/**
 * API 请求校验与流式响应。
 *
 * 前端会把整张 chart 发过来，但服务端不信任它：只取出生信息，用本仓库的引擎重新排盘。
 * 这样既校验了输入，也避免有人伪造星曜/格局文字往提示词里塞指令。
 */
import Anthropic from '@anthropic-ai/sdk';
import { generateChart, type LunarMonthPolicy } from '../ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '../ziwei/types';
import { AIConfigError, generate, type ChatTurn, type GenerateRequest } from './providers';

export class BadRequest extends Error {}

const LEAP_POLICIES: readonly LunarMonthPolicy[] = ['split', 'next-month', 'prev-month', 'origin-month'];
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 60000;

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

/** 从前端传来的 chart 里取出生信息并重新排盘。 */
export function rebuildChart(raw: unknown, label = 'chart'): ZiweiChart {
  const b = (raw as { birthInfo?: Record<string, unknown> } | null)?.birthInfo;
  if (!b || typeof b !== 'object') throw new BadRequest(`${label} 缺少 birthInfo`);
  const { year, month, day, hour, gender, leapMonthPolicy } = b;
  if (!isInt(year, 1900, 2100) || !isInt(month, 1, 12) || !isInt(day, 1, 31) || !isInt(hour, 0, 11)) {
    throw new BadRequest(`${label} 出生日期或时辰不合法`);
  }
  if (gender !== 'male' && gender !== 'female') throw new BadRequest(`${label} 性别不合法`);
  const leapMonth = LEAP_POLICIES.includes(leapMonthPolicy as LunarMonthPolicy)
    ? (leapMonthPolicy as LunarMonthPolicy)
    : undefined;

  const info: BirthInfo = { year, month, day, hour, gender };
  try {
    return generateChart(info, leapMonth ? { leapMonth } : undefined);
  } catch (e) {
    if (e instanceof RangeError) throw new BadRequest(`${label} ${e.message}`);
    throw e;
  }
}

/** 校验对话历史：只留 user/assistant 文本，合并相邻同角色，保证以用户开头和结尾。 */
export function parseMessages(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new BadRequest('messages 不能为空');
  if (raw.length > MAX_MESSAGES) throw new BadRequest(`对话过长（最多 ${MAX_MESSAGES} 条），请重新起盘开始新对话`);

  const turns: ChatTurn[] = [];
  let total = 0;
  for (const m of raw) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      throw new BadRequest('messages 格式不合法');
    }
    const text = content.trim();
    if (!text) continue;
    if (text.length > MAX_MESSAGE_CHARS) throw new BadRequest(`单条消息不能超过 ${MAX_MESSAGE_CHARS} 字`);
    total += text.length;
    const last = turns[turns.length - 1];
    if (last?.role === role) last.content += `\n\n${text}`;
    else turns.push({ role, content: text });
  }
  if (total > MAX_TOTAL_CHARS) throw new BadRequest('对话过长，请重新起盘开始新对话');
  while (turns[0]?.role === 'assistant') turns.shift();
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    throw new BadRequest('最后一条消息必须是用户提问');
  }
  return turns;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object') return body as Record<string, unknown>;
  } catch { /* fallthrough */ }
  throw new BadRequest('请求体必须是 JSON 对象');
}

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** 前端约定的 SSE 格式：每段 `data: {"delta":{"text":"..."}}`，结尾 `data: [DONE]`。 */
function sse(text: string): string {
  return `data: ${JSON.stringify({ delta: { text } })}\n\n`;
}

/**
 * 调模型并以 SSE 返回。先等到第一段文本再回 200：
 * 配置缺失、Key 无效、限流这类错误能以非 200 状态码返回，前端会显示「解读失败」而不是空白。
 */
export async function streamCompletion(req: GenerateRequest): Promise<Response> {
  const gen = generate(req);
  let first: IteratorResult<string>;
  try {
    first = await gen.next();
  } catch (e) {
    return upstreamError(e);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(sse(first.value)));
        for await (const text of gen) controller.enqueue(encoder.encode(sse(text)));
      } catch (e) {
        if (!req.signal?.aborted) {
          console.error('[ai] 流式输出中断：', e);
          controller.enqueue(encoder.encode(sse('\n\n（解读中断，请稍后重试。）')));
        }
      } finally {
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch { /* 客户端已断开 */ }
      }
    },
    cancel() {
      void gen.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function upstreamError(e: unknown): Response {
  if (e instanceof AIConfigError) {
    console.error('[ai] 配置错误：', e.message);
    return jsonError(503, `AI 接口未配置：${e.message}`);
  }
  if (e instanceof Anthropic.AuthenticationError) {
    console.error('[ai] Anthropic 鉴权失败：', e.message);
    return jsonError(503, 'AI 接口鉴权失败，请检查 API Key');
  }
  if (e instanceof Anthropic.RateLimitError) return jsonError(429, 'AI 接口限流，请稍后再试');
  if (e instanceof Anthropic.APIError) {
    console.error(`[ai] Anthropic API 错误 ${e.status}：`, e.message);
    return jsonError(502, 'AI 接口调用失败');
  }
  console.error('[ai] 调用失败：', e);
  return jsonError(502, 'AI 接口调用失败');
}
