import type { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { buildSystemPrompt } from '@/lib/ai/interpret-prompt';
import {
  createClientStream,
  MissingAiConfigError,
  requestChatCompletion,
  resolveAiConfig,
  type AiConfig,
  type ChatTurn,
} from '@/lib/ai/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_HISTORY_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_CHARS = 24000;
const UPSTREAM_TIMEOUT_MS = 120_000;

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 只做「够用」的结构校验：命盘由本仓库引擎生成，这里防的是空请求、
 * 明显畸形数据和超大 payload，而不是重新实现一遍排盘校验。
 */
function parseChart(value: unknown): ZiweiChart | null {
  if (!isRecord(value)) return null;
  if (!isRecord(value.birthInfo) || !isRecord(value.lunarInfo)) return null;
  if (!Array.isArray(value.palaces) || value.palaces.length !== 12) return null;
  if (!value.palaces.every(p => isRecord(p) && Array.isArray(p.stars))) return null;
  if (!Array.isArray(value.daXians)) return null;

  const birth = value.birthInfo;
  if (
    typeof birth.year !== 'number'
    || typeof birth.month !== 'number'
    || typeof birth.day !== 'number'
    || typeof birth.hour !== 'number'
    || (birth.gender !== 'male' && birth.gender !== 'female')
  ) {
    return null;
  }
  return value as unknown as ZiweiChart;
}

function parseMessages(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];

  const messages: ChatTurn[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (item.role !== 'user' && item.role !== 'assistant') continue;
    if (typeof item.content !== 'string') continue;

    const content = item.content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!content) continue;
    messages.push({ role: item.role, content });
  }

  // 只保留最近若干轮，并从尾部累计字符数，防止历史无限增长。
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  let total = 0;
  const bounded: ChatTurn[] = [];
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    total += recent[i].content.length;
    if (bounded.length > 0 && total > MAX_HISTORY_CHARS) break;
    bounded.unshift(recent[i]);
  }
  return bounded;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('请求体不是合法 JSON。', 400);
  }
  if (!isRecord(body)) return jsonError('请求体格式错误。', 400);

  const chart = parseChart(body.chart);
  if (!chart) return jsonError('命盘数据不完整，请重新起盘后再试。', 400);

  const messages = parseMessages(body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return jsonError('缺少有效的提问内容。', 400);
  }

  let config: AiConfig;
  try {
    config = resolveAiConfig();
  } catch (error) {
    if (error instanceof MissingAiConfigError) return jsonError(error.message, 503);
    throw error;
  }

  const systemPrompt = buildSystemPrompt(chart);
  const signal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await requestChatCompletion(config, messages, systemPrompt, signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonError('AI 服务响应超时，请重试。', 504);
    }
    console.error('[api/interpret] 无法连接上游 AI 服务:', error);
    return jsonError(
      `无法连接 AI 服务（provider=${config.provider}, model=${config.model}），请检查网络或 AI_BASE_URL。`,
      502,
    );
  }

  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 800);
    console.error(
      `[api/interpret] 上游返回 HTTP ${upstream.status}（provider=${config.provider}, model=${config.model}）:`,
      detail,
    );
    return jsonError(
      `AI 服务返回错误（HTTP ${upstream.status}），请检查 API Key、模型名与账户额度。`,
      502,
    );
  }
  if (!upstream.body) {
    return jsonError('AI 服务未返回内容流，请稍后重试。', 502);
  }

  return new Response(createClientStream(upstream), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
