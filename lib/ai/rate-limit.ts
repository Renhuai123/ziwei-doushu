/**
 * /api/interpret 与 /api/heming 共用的按 IP 限流，防止有人写脚本反复调用、刷光 AI 额度。
 *
 * 计数存在进程内存里：单机自托管时是准确的；Vercel 等多实例环境下每个实例各自计数，
 * 只能挡住普通的连点和简单脚本，挡不住分散到多个实例的大规模滥用。
 *
 * AI_RATE_LIMIT 环境变量：
 *   未设置      默认每个 IP 每 10 分钟 20 次
 *   "30/600"    每 600 秒 30 次
 *   "off"       关闭限流（例如前面已有网关限流）
 */
import { jsonResponse } from './request';

export type RateLimit = { max: number; windowMs: number } | null;

const DEFAULT_LIMIT = { max: 20, windowMs: 10 * 60_000 };

export function parseRateLimit(raw: string | undefined): RateLimit {
  const value = raw?.trim().toLowerCase();
  if (!value) return DEFAULT_LIMIT;
  if (value === 'off') return null;
  const m = /^(\d+)\/(\d+)$/.exec(value);
  if (!m || Number(m[1]) < 1 || Number(m[2]) < 1) return DEFAULT_LIMIT;
  return { max: Number(m[1]), windowMs: Number(m[2]) * 1000 };
}

/**
 * 取客户端 IP。Vercel 会覆盖 x-real-ip / x-forwarded-for，可以信任；
 * 自托管时需要反向代理设置这两个头，否则所有人会共用 'unknown' 这一份额度。
 */
export function clientIp(request: Request): string {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

type Window = { count: number; resetAt: number };

export function createLimiter(limit: RateLimit) {
  const windows = new Map<string, Window>();

  /** 记一次请求。允许返回 null；超限返回距离窗口重置的秒数。 */
  return function hit(key: string, now = Date.now()): number | null {
    if (!limit) return null;
    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    const w = windows.get(key);
    if (!w || w.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + limit.windowMs });
      return null;
    }
    if (w.count >= limit.max) return Math.ceil((w.resetAt - now) / 1000);
    w.count += 1;
    return null;
  };
}

let shared: ReturnType<typeof createLimiter> | undefined;

/** 路由里调用：超限时返回 429 响应，否则返回 null 继续处理。 */
export function rateLimited(request: Request): Response | null {
  shared ??= createLimiter(parseRateLimit(process.env.AI_RATE_LIMIT));
  const retryAfter = shared(clientIp(request));
  if (retryAfter === null) return null;
  const res = jsonResponse(429, { error: 'rate-limited', retryAfter });
  res.headers.set('Retry-After', String(retryAfter));
  return res;
}
