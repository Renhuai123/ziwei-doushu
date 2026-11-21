import Anthropic from '@anthropic-ai/sdk';
import type { AiConfig } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamRequest {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  signal?: AbortSignal;
}

export class ProviderError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

// DeepSeek rejects max_tokens above 8192; other OpenAI-compatible providers accept it.
const OPENAI_MAX_OUTPUT_TOKENS = 8192;

export function streamText(config: AiConfig, req: StreamRequest): AsyncIterable<string> {
  return config.protocol === 'anthropic' ? streamAnthropic(config, req) : streamOpenAi(config, req);
}

async function* streamAnthropic(
  config: Extract<AiConfig, { protocol: 'anthropic' }>,
  req: StreamRequest,
): AsyncGenerator<string> {
  // The SDK reads ANTHROPIC_BASE_URL, so a proxy or a local fake can stand in for the API.
  const client = new Anthropic({ apiKey: config.apiKey });
  const stream = client.messages.stream(
    { model: config.model, max_tokens: req.maxTokens, system: req.system, messages: req.messages },
    { signal: req.signal },
  );
  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if ((final.stop_reason as string | null) === 'refusal') throw new ProviderError('refusal');
  } finally {
    stream.abort();
  }
}

async function* streamOpenAi(
  config: Extract<AiConfig, { protocol: 'openai' }>,
  req: StreamRequest,
): AsyncGenerator<string> {
  const upstream = new AbortController();
  const forward = () => upstream.abort();
  if (req.signal?.aborted) forward();
  req.signal?.addEventListener('abort', forward, { once: true });
  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        max_tokens: Math.min(req.maxTokens, OPENAI_MAX_OUTPUT_TOKENS),
        messages: [{ role: 'system', content: req.system }, ...req.messages],
      }),
      signal: upstream.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw new ProviderError(`upstream ${res.status}: ${detail.slice(0, 300)}`, res.status);
    }
    for await (const payload of sseDataLines(res.body)) {
      const text = openAiDelta(payload);
      if (text) yield text;
    }
  } finally {
    req.signal?.removeEventListener('abort', forward);
    upstream.abort();
  }
}

/** Yields each `data:` payload of an SSE byte stream, joining lines split across chunks, until `[DONE]`. */
export async function* sseDataLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  const payloadOf = (line: string): string | null => {
    const clean = line.endsWith('\r') ? line.slice(0, -1) : line;
    return clean.startsWith('data:') ? clean.slice(5).trimStart() : null;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        const data = payloadOf(line);
        if (data === null) continue;
        if (data === '[DONE]') return;
        yield data;
      }
    }
    pending += decoder.decode();
    const last = payloadOf(pending);
    if (last !== null && last !== '[DONE]') yield last;
  } finally {
    await reader.cancel().catch(() => {});
  }
}

function openAiDelta(payload: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return '';
  }
  const obj = parsed as {
    error?: { message?: string };
    choices?: { delta?: { content?: unknown } }[];
  };
  if (obj.error) throw new ProviderError(`upstream error: ${obj.error.message ?? 'unknown'}`);
  const content = obj.choices?.[0]?.delta?.content;
  return typeof content === 'string' ? content : '';
}
