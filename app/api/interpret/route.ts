import { buildChartContext, INTERPRET_SYSTEM_PROMPT } from '@/lib/ai/interpret-prompt';
import type { ZiweiChart } from '@/lib/ziwei/types';

/**
 * POST /api/interpret —— luận giải lá số bằng AI, trả về SSE.
 *
 * Hợp đồng với frontend (components/InsightPanel.tsx, components/ChatPanel.tsx):
 *   body: { chart: ZiweiChart, messages: { role: 'user' | 'assistant', content: string }[] }
 *   200 : text/event-stream, mỗi sự kiện `data: {"delta":{"text":"..."}}`, kết thúc `data: [DONE]`
 *   4xx : JSON lỗi đầu vào
 *   503 : chưa cấu hình API key
 *   502 : gọi upstream thất bại
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Role = 'user' | 'assistant';
interface ChatMessage {
  role: Role;
  content: string;
}

type ProviderConfig = {
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  baseUrl: string;
};

const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

const DEFAULT_QUESTION =
  'Hãy luận giải tổng quan lá số: cục diện, cách cục Mệnh – Thân, tam phương tứ chính, và vận hạn đại hạn – lưu niên hiện tại.';

const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 6000;

function jsonError(status: number, error: string) {
  return Response.json({ success: false, error }, { status });
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function resolveProvider(): ProviderConfig | { error: string } {
  const requested = readEnv('AI_PROVIDER')?.toLowerCase();
  const geminiKey = readEnv('GEMINI_API_KEY');
  const deepseekKey = readEnv('DEEPSEEK_API_KEY');
  const mimoKey = readEnv('MIMO_API_KEY');

  const useGemini =
    requested === 'gemini'
    || requested === 'google'
    || (!requested && !!geminiKey)
    || (requested === 'deepseek' && !deepseekKey && !mimoKey && !!geminiKey);

  if (useGemini) {
    if (!geminiKey) return { error: 'missing_gemini_api_key' };
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: readEnv('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL,
      baseUrl: readEnv('GEMINI_API_BASE') ?? DEFAULT_GEMINI_BASE,
    };
  }

  if (requested === 'deepseek' || (!requested && deepseekKey)) {
    if (!deepseekKey) return { error: 'missing_deepseek_api_key' };
    return {
      provider: 'openai',
      apiKey: deepseekKey,
      model: readEnv('DEEPSEEK_MODEL') ?? DEFAULT_DEEPSEEK_MODEL,
      baseUrl: readEnv('DEEPSEEK_BASE_URL') ?? DEFAULT_DEEPSEEK_BASE,
    };
  }

  if (requested === 'mimo') {
    const baseUrl = readEnv('MIMO_BASE_URL');
    const model = readEnv('MIMO_MODEL');
    if (!mimoKey) return { error: 'missing_mimo_api_key' };
    if (!baseUrl || !model) return { error: 'missing_mimo_base_url_or_model' };
    return { provider: 'openai', apiKey: mimoKey, model, baseUrl };
  }

  return { error: 'ai_not_configured' };
}

function isZiweiChart(value: unknown): value is ZiweiChart {
  if (!value || typeof value !== 'object') return false;
  const chart = value as Partial<ZiweiChart>;
  return Array.isArray(chart.palaces)
    && chart.palaces.length === 12
    && !!chart.birthInfo
    && !!chart.lunarInfo
    && Array.isArray(chart.daXians);
}

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is { role: unknown; content: unknown } => !!m && typeof m === 'object')
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role as Role,
      content: (m.content as string).trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_MESSAGES);
}

/** Gộp các message cùng role liền nhau — Gemini bắt buộc role xen kẽ. */
function toGeminiContents(messages: ChatMessage[]) {
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const message of messages) {
    const role = message.role === 'user' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${message.content}`;
    } else {
      contents.push({ role, parts: [{ text: message.content }] });
    }
  }
  return contents;
}

async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const raw of lines) {
        const line = raw.replace(/\r$/, '');
        if (line.startsWith('data:')) yield line.slice(5).trim();
      }
    }
    buffer += decoder.decode();
    const tail = buffer.replace(/\r$/, '');
    if (tail.startsWith('data:')) yield tail.slice(5).trim();
  } finally {
    reader.releaseLock();
  }
}

async function readUpstreamError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return `HTTP ${res.status}${text ? `: ${text.slice(0, 500)}` : ''}`;
}

type UpstreamStream = {
  stream: AsyncGenerator<string>;
  abort: () => void;
};

async function openUpstream(
  config: ProviderConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<UpstreamStream> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });

  if (config.provider === 'gemini') {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/models/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: toGeminiContents(messages),
        generationConfig: { temperature: 0.75, topP: 0.95, maxOutputTokens: 4096 },
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error(await readUpstreamError(res));

    const body = res.body;
    async function* stream(): AsyncGenerator<string> {
      for await (const data of sseData(body)) {
        if (!data || data === '[DONE]') continue;
        let payload: {
          candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
          promptFeedback?: { blockReason?: string };
        };
        try {
          payload = JSON.parse(data);
        } catch {
          continue;
        }
        if (payload.promptFeedback?.blockReason) {
          throw new Error(`blocked: ${payload.promptFeedback.blockReason}`);
        }
        for (const part of payload.candidates?.[0]?.content?.parts ?? []) {
          if (typeof part.text === 'string' && part.text && !part.thought) yield part.text;
        }
      }
    }

    return { stream: stream(), abort: () => controller.abort() };
  }

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      temperature: 0.75,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
    signal: controller.signal,
  });
  if (!res.ok || !res.body) throw new Error(await readUpstreamError(res));

  const body = res.body;
  async function* stream(): AsyncGenerator<string> {
    for await (const data of sseData(body)) {
      if (!data || data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) yield delta;
      } catch {
        // 忽略 keep-alive / 非 JSON 行
      }
    }
  }

  return { stream: stream(), abort: () => controller.abort() };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'invalid_json');
  }

  // 兼容两种入参：新前端 { chart, messages }，以及 { chartData, userQuery, currentAge }
  const chart = body.chart ?? body.chartData;
  if (!isZiweiChart(chart)) return jsonError(400, 'invalid_chart');

  const messages = normalizeMessages(body.messages);
  if (typeof body.userQuery === 'string' && body.userQuery.trim()) {
    messages.push({ role: 'user', content: body.userQuery.trim().slice(0, MAX_MESSAGE_CHARS) });
  }
  if (!messages.some((m) => m.role === 'user')) {
    messages.push({ role: 'user', content: DEFAULT_QUESTION });
  }

  const config = resolveProvider();
  if ('error' in config) {
    console.error('[api/interpret] AI chưa cấu hình:', config.error);
    return jsonError(503, config.error);
  }

  const chartContext = buildChartContext(chart);
  const systemPrompt = `${INTERPRET_SYSTEM_PROMPT}\n\n${chartContext}`;

  let upstream: UpstreamStream;
  try {
    upstream = await openUpstream(config, systemPrompt, messages, req.signal);
  } catch (error) {
    console.error('[api/interpret] upstream error:', error);
    return jsonError(502, 'upstream_failed');
  }

  const encoder = new TextEncoder();
  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      try {
        for await (const text of upstream.stream) send({ delta: { text } });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        // 已经发出的内容保留；补一条错误事件，再正常收尾
        if ((error as Error)?.name !== 'AbortError') console.error('[api/interpret] stream error:', error);
        send({ error: 'stream_failed' });
      } finally {
        controller.close();
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
