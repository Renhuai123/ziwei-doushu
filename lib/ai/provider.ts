import 'server-only';

/**
 * 服务端 AI Provider 适配层。
 *
 * 只支持 OpenAI 兼容的 /chat/completions 流式协议——DeepSeek、MIMO、
 * OpenAI、Moonshot、Qwen、OpenRouter、Ollama 等都可以通过环境变量接入。
 * API Key 只在服务端读取，绝不会下发到浏览器。
 */

export interface AiConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class MissingAiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingAiConfigError';
  }
}

function trimmed(value: string | undefined): string {
  return value?.trim() ?? '';
}

function isPlaceholderKey(key: string): boolean {
  return /^your[-_]/i.test(key) || key === 'sk-xxx' || key === 'changeme';
}

function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(url);
}

function completionsUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`;
}

/**
 * 解析环境变量。默认 DeepSeek；MIMO 沿用 .env.example 的变量名；
 * 其他服务用 AI_PROVIDER=openai-compatible + AI_BASE_URL / AI_MODEL。
 */
export function resolveAiConfig(): AiConfig {
  const provider = (trimmed(process.env.AI_PROVIDER) || 'deepseek').toLowerCase();

  if (provider === 'deepseek') {
    const apiKey = trimmed(process.env.DEEPSEEK_API_KEY) || trimmed(process.env.AI_API_KEY);
    if (!apiKey || isPlaceholderKey(apiKey)) {
      throw new MissingAiConfigError(
        'AI 解读未配置：请在 .env.local 填入有效的 DEEPSEEK_API_KEY，然后重启 npm run dev。'
        + '（DeepSeek 控制台：https://platform.deepseek.com/api_keys）',
      );
    }
    return {
      provider,
      apiKey,
      baseUrl: trimmed(process.env.DEEPSEEK_BASE_URL) || 'https://api.deepseek.com/v1',
      model: trimmed(process.env.DEEPSEEK_MODEL) || 'deepseek-chat',
    };
  }

  if (provider === 'mimo') {
    const apiKey = trimmed(process.env.MIMO_API_KEY);
    const baseUrl = trimmed(process.env.MIMO_BASE_URL);
    const model = trimmed(process.env.MIMO_MODEL);
    if (!apiKey || isPlaceholderKey(apiKey) || !baseUrl || !model) {
      throw new MissingAiConfigError(
        'AI 解读未配置：MIMO 需要同时设置 MIMO_API_KEY、MIMO_BASE_URL、MIMO_MODEL。',
      );
    }
    return { provider, apiKey, baseUrl, model };
  }

  // 通用 OpenAI 兼容服务（OpenAI / Moonshot / Qwen / Ollama / OpenRouter …）
  const apiKey = trimmed(process.env.AI_API_KEY);
  const baseUrl = trimmed(process.env.AI_BASE_URL);
  const model = trimmed(process.env.AI_MODEL);
  if (!baseUrl || !model) {
    throw new MissingAiConfigError(
      'AI 解读未配置：请设置 AI_PROVIDER=openai-compatible，并提供 AI_BASE_URL 与 AI_MODEL（以及 AI_API_KEY，本地模型可留空）。',
    );
  }
  if (!apiKey && !isLocalUrl(baseUrl)) {
    throw new MissingAiConfigError(
      'AI 解读未配置：远程 OpenAI 兼容服务需要 AI_API_KEY。若用本地 Ollama，请把 AI_BASE_URL 指向 http://127.0.0.1:11434/v1。',
    );
  }
  return { provider, apiKey, baseUrl, model };
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function requestChatCompletion(
  config: AiConfig,
  messages: ChatTurn[],
  systemPrompt: string,
  signal: AbortSignal,
): Promise<Response> {
  const body = {
    model: config.model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    temperature: Number.parseFloat(process.env.AI_TEMPERATURE || '0.7') || 0.7,
    max_tokens: Number.parseInt(process.env.AI_MAX_TOKENS || '2400', 10) || 2400,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  return fetch(completionsUrl(config.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
}

function extractDelta(data: string): string {
  try {
    const json = JSON.parse(data) as {
      choices?: Array<{
        delta?: { content?: unknown };
        message?: { content?: unknown };
      }>;
    };
    const choice = json.choices?.[0];
    const content = choice?.delta?.content ?? choice?.message?.content;
    return typeof content === 'string' ? content : '';
  } catch {
    return '';
  }
}

/**
 * 把上游 OpenAI 兼容 SSE 转成前端约定的 SSE：
 *   data: {"delta":{"text":"..."}}\n\n
 *   data: [DONE]\n\n
 */
export function createClientStream(upstream: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body!.getReader();
  let buffer = '';
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (payload: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          cancelled = true;
        }
      };
      const writeDelta = (text: string) => {
        if (text) write(`data: ${JSON.stringify({ delta: { text } })}\n\n`);
      };
      const finish = () => {
        write('data: [DONE]\n\n');
        if (!cancelled) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      };

      try {
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newline: number;
          while ((newline = buffer.indexOf('\n')) !== -1) {
            const rawLine = buffer.slice(0, newline);
            buffer = buffer.slice(newline + 1);
            const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
            if (!line.startsWith('data:')) continue;

            const data = line.slice(5).trim();
            if (!data) continue;
            if (data === '[DONE]') {
              finish();
              return;
            }
            writeDelta(extractDelta(data));
          }
        }

        // 少数服务最后一行没有换行符
        const rest = buffer.trim();
        if (rest.startsWith('data:')) {
          const data = rest.slice(5).trim();
          if (data && data !== '[DONE]') writeDelta(extractDelta(data));
        }
        finish();
      } catch {
        if (!cancelled) {
          writeDelta('\n\n（解读中断，请重试。）');
          finish();
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* noop */
        }
      }
    },
    cancel() {
      cancelled = true;
      reader.cancel().catch(() => { /* noop */ });
    },
  });
}
