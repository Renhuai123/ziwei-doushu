/**
 * 大模型调用层：两种协议统一成「流式吐出文本片段」的 AsyncGenerator。
 *
 * AI_PROVIDER 选择：
 *   anthropic — Claude，官方 SDK（@anthropic-ai/sdk）
 *   deepseek  — DeepSeek（OpenAI 兼容协议），默认
 *   openai    — 任意 OpenAI 兼容服务（通义、Kimi、智谱、OpenAI、本地 vLLM/Ollama 等）
 */
import Anthropic from '@anthropic-ai/sdk';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateRequest {
  /** 稳定的系统提示词（可缓存） */
  system: string;
  /** 每张盘不同的上下文（命盘数据），拼在 system 之后 */
  context: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
}

/** 配置缺失等「不是用户的错、也不该重试」的问题 */
export class AIConfigError extends Error {}

type Provider = 'anthropic' | 'deepseek' | 'openai';

function resolveProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? 'deepseek').trim().toLowerCase();
  if (p === 'anthropic' || p === 'claude') return 'anthropic';
  if (p === 'deepseek') return 'deepseek';
  if (p === 'openai' || p === 'openai-compatible') return 'openai';
  throw new AIConfigError(`未知的 AI_PROVIDER：${p}（可选 anthropic / deepseek / openai）`);
}

export function generate(req: GenerateRequest): AsyncGenerator<string> {
  const provider = resolveProvider();
  if (provider === 'anthropic') return generateAnthropic(req);
  if (provider === 'deepseek') {
    return generateOpenAICompatible(req, {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      keyName: 'DEEPSEEK_API_KEY',
    });
  }
  return generateOpenAICompatible(req, {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL,
    keyName: 'OPENAI_API_KEY',
  });
}

// ─── Claude ────────────────────────────────────────────────────────────

let anthropicClient: Anthropic | undefined;

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

async function* generateAnthropic(req: GenerateRequest): AsyncGenerator<string> {
  // 不显式传 apiKey：SDK 依次读 ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / `ant auth login` 的登录态
  anthropicClient ??= new Anthropic();
  const effortEnv = (process.env.ANTHROPIC_EFFORT ?? 'medium') as Effort;

  const stream = anthropicClient.beta.messages.stream(
    {
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
      max_tokens: 64000,
      // 思考深度只用 effort 控制（Opus 5.5 不支持关闭 thinking）
      output_config: { effort: EFFORTS.includes(effortEnv) ? effortEnv : 'medium' },
      // 被安全分类器误拒时，服务端自动换模型重跑，无需自己维护模型列表
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // 自动缓存：多轮追问时，系统提示词 + 命盘 + 之前的对话都走缓存
      cache_control: { type: 'ephemeral' },
      system: [
        { type: 'text', text: req.system },
        { type: 'text', text: `# 命盘数据\n\n${req.context}` },
      ],
      messages: req.messages,
    },
    { signal: req.signal },
  );

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }

  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    yield '\n\n（这个问题模型无法回答，换个问法试试。）';
  } else if (final.stop_reason === 'max_tokens') {
    yield '\n\n（回答过长被截断，可以让我接着说。）';
  }
}

// ─── OpenAI 兼容协议 ──────────────────────────────────────────────────

interface CompatConfig {
  apiKey?: string;
  baseUrl: string;
  model?: string;
  keyName: string;
}

async function* generateOpenAICompatible(req: GenerateRequest, cfg: CompatConfig): AsyncGenerator<string> {
  if (!cfg.apiKey) throw new AIConfigError(`缺少 ${cfg.keyName}`);
  if (!cfg.model) throw new AIConfigError('缺少 OPENAI_MODEL');

  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      messages: [
        { role: 'system', content: `${req.system}\n\n# 命盘数据\n\n${req.context}` },
        ...req.messages,
      ],
    }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`上游接口返回 ${res.status}：${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finishReason: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE 事件可能被拆在两个 chunk 里：只处理完整的行，残行留到下一轮
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const choice = JSON.parse(data).choices?.[0];
        const text: string | undefined = choice?.delta?.content;
        if (text) yield text;
        if (choice?.finish_reason) finishReason = choice.finish_reason;
      } catch { /* 心跳或非 JSON 行，忽略 */ }
    }
  }
  if (finishReason === 'length') yield '\n\n（回答过长被截断，可以让我接着说。）';
}
