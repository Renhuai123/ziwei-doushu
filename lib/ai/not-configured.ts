/** Client-safe: turns the API's 503 "not configured" reply into a Chinese setup hint, or null for any other response. */
export async function readNotConfiguredNotice(res: Response): Promise<string | null> {
  if (res.status !== 503) return null;
  const body: unknown = await res.json().catch(() => null);
  const { error, missing } = (body ?? {}) as { error?: unknown; missing?: unknown };
  if (error !== 'ai-not-configured') return null;
  const variable = typeof missing === 'string' && missing ? missing : 'AI_PROVIDER';
  return (
    `AI 解读尚未配置：请在项目根目录的 .env.local 中设置 AI_PROVIDER（anthropic / deepseek / mimo / openai-compatible），` +
    `并填入缺少的环境变量 ${variable}，保存后重启服务。示例见 .env.example。`
  );
}

/** Client-safe: turns the API's 429 reply into a Chinese "try again later" message, or null for any other response. */
export function readRateLimitNotice(res: Response): string | null {
  if (res.status !== 429) return null;
  const seconds = Number(res.headers.get('Retry-After'));
  const wait = Number.isFinite(seconds) && seconds > 0
    ? seconds < 60 ? `${Math.ceil(seconds)} 秒` : `${Math.ceil(seconds / 60)} 分钟`
    : '几分钟';
  return `AI 解读请求太频繁，请约 ${wait}后再试。命盘本身不受影响。`;
}
