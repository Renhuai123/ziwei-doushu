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
