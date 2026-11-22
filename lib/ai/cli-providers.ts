import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Chạy Claude Code / Codex CLI ở chế độ headless làm "model" cho /api/interpret,
 * dùng gói đăng ký (subscription) đã đăng nhập trên máy này thay cho API key.
 *
 * ⚠ Chỉ dành cho dùng cá nhân trên máy local: CLI phải được cài và đăng nhập trên máy chạy Next.js,
 *   và quota thuộc về tài khoản cá nhân của bạn — không triển khai cho người khác dùng.
 *
 * An toàn: đây là coding agent, còn nội dung chat do người dùng nhập. Vì vậy mỗi lần chạy:
 * - trong một thư mục tạm trống (xóa sau khi xong);
 * - Claude Code: tắt toàn bộ tool (--tools ""), không MCP, không settings/skills;
 * - Codex: sandbox read-only, tắt shell/exec/web/browser/computer-use/apps/plugins, bỏ qua config người dùng.
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export class CliProviderError extends Error {}

/** Thông tin cho tracing: model thực chạy, token, chi phí (nếu CLI báo). */
export interface GenerationInfo {
  model?: string;
  usage?: { input?: number; output?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
  costUsd?: number;
  stopReason?: string;
}
export type OnInfo = (info: GenerationInfo) => void;

const TIMEOUT_MS = 5 * 60 * 1000;

/** Biến môi trường không được truyền xuống CLI con (để nó dùng đăng nhập subscription, không dùng key rỗng trong .env). */
const STRIP_ENV = [
  'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL',
  'OPENAI_API_KEY', 'OPENAI_BASE_URL',
  'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SSE_PORT',
  'ZAI_API_KEY',
];

function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const k of STRIP_ENV) delete env[k];
  return env;
}

/** Ghép lịch sử hội thoại thành một prompt (CLI headless chỉ nhận một lượt nhập). */
export function transcriptPrompt(messages: ChatTurn[]): string {
  const last = messages[messages.length - 1];
  const history = messages.slice(0, -1);
  if (!history.length) return last.content;
  const lines = history.map(m => `[${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}]\n${m.content}`);
  return `Lịch sử hội thoại trước đó:\n\n${lines.join('\n\n')}\n\n---\nYêu cầu mới của người dùng:\n\n${last.content}`;
}

/**
 * Chạy một tiến trình, ghi `stdin`, trả về từng dòng stdout (JSONL).
 * Ném CliProviderError nếu không chạy được, quá thời gian, hoặc thoát mã lỗi.
 */
async function* runJsonl(
  bin: string,
  args: string[],
  stdin: string,
  signal: AbortSignal,
): AsyncGenerator<Record<string, unknown>> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'ziwei-ai-'));
  const child = spawn(bin, args, { cwd, env: childEnv(), stdio: ['pipe', 'pipe', 'pipe'] });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d: string) => { stderr = (stderr + d).slice(-4000); });

  const kill = () => { if (child.exitCode === null) child.kill('SIGTERM'); };
  const timer = setTimeout(kill, TIMEOUT_MS);
  signal.addEventListener('abort', kill, { once: true });

  const exited = new Promise<{ code: number | null; spawnError?: Error }>(resolve => {
    child.once('error', err => resolve({ code: null, spawnError: err }));
    child.once('close', code => resolve({ code }));
  });

  child.stdin.on('error', () => { /* tiến trình chết sớm — lỗi sẽ được báo qua exit */ });
  child.stdin.end(stdin);

  try {
    let buf = '';
    child.stdout.setEncoding('utf8');
    for await (const chunk of child.stdout as AsyncIterable<string>) {
      buf += chunk;
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try { yield JSON.parse(line); } catch { /* bỏ qua dòng không phải JSON */ }
      }
    }
    const { code, spawnError } = await exited;
    if (spawnError) {
      throw new CliProviderError(
        (spawnError as NodeJS.ErrnoException).code === 'ENOENT'
          ? `không tìm thấy lệnh "${bin}"`
          : spawnError.message,
      );
    }
    if (signal.aborted) throw new CliProviderError('đã hủy');
    if (code !== 0) throw new CliProviderError(`thoát với mã ${code}${stderr.trim() ? `: ${stderr.trim().slice(-500)}` : ''}`);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', kill);
    kill();
    await rm(cwd, { recursive: true, force: true }).catch(() => {});
  }
}

/** Claude Code (`claude -p`) — stream từng đoạn text. */
export async function* streamClaudeCode(
  system: string,
  messages: ChatTurn[],
  signal: AbortSignal,
  onInfo?: OnInfo,
): AsyncGenerator<string> {
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--tools', '',
    '--strict-mcp-config',
    '--setting-sources', '',
    '--disable-slash-commands',
    '--no-session-persistence',
    '--system-prompt', system,
  ];
  if (process.env.CLAUDE_CODE_MODEL) args.push('--model', process.env.CLAUDE_CODE_MODEL);

  let resultError: string | null = null;
  for await (const ev of runJsonl(process.env.CLAUDE_CODE_BIN || 'claude', args, transcriptPrompt(messages), signal)) {
    if (ev.type === 'stream_event') {
      const e = ev.event as { type?: string; delta?: { type?: string; text?: string } } | undefined;
      if (e?.type === 'content_block_delta' && e.delta?.type === 'text_delta' && e.delta.text) yield e.delta.text;
    } else if (ev.type === 'system' && ev.subtype === 'init' && typeof ev.model === 'string') {
      onInfo?.({ model: ev.model });
    } else if (ev.type === 'result') {
      const u = ev.usage as Record<string, number> | undefined;
      onInfo?.({
        usage: u && {
          input: u.input_tokens, output: u.output_tokens,
          cache_read_input_tokens: u.cache_read_input_tokens, cache_creation_input_tokens: u.cache_creation_input_tokens,
        },
        costUsd: typeof ev.total_cost_usd === 'number' ? ev.total_cost_usd : undefined,
        stopReason: typeof ev.subtype === 'string' ? ev.subtype : undefined,
      });
      if (ev.is_error) resultError = typeof ev.result === 'string' && ev.result ? ev.result : String(ev.subtype ?? 'lỗi không rõ');
    }
  }
  if (resultError) throw new CliProviderError(resultError);
}

const CODEX_DISABLED_FEATURES = [
  'code_mode_host', 'shell_tool', 'unified_exec', 'apps', 'plugins', 'remote_plugin',
  'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use',
  'skill_search', 'skill_mcp_dependency_install',
];

/** Codex (`codex exec`) — Codex chỉ trả từng tin nhắn hoàn chỉnh, không có delta. */
export async function* streamCodex(
  system: string,
  messages: ChatTurn[],
  signal: AbortSignal,
  onInfo?: OnInfo,
): AsyncGenerator<string> {
  const args = [
    'exec', '--json',
    '--skip-git-repo-check', '--ephemeral',
    '--ignore-user-config', '--ignore-rules',
    '--sandbox', 'read-only',
    '-c', 'web_search="disabled"',
    ...CODEX_DISABLED_FEATURES.flatMap(f => ['--disable', f]),
  ];
  if (process.env.CODEX_MODEL) args.push('-m', process.env.CODEX_MODEL);
  args.push('-'); // đọc prompt từ stdin

  // codex exec không có cờ system prompt → đặt chỉ dẫn ở đầu prompt.
  const prompt = `${system}\n\n===\n\n${transcriptPrompt(messages)}`;

  if (process.env.CODEX_MODEL) onInfo?.({ model: process.env.CODEX_MODEL });
  let sent = 0;
  let failure: string | null = null;
  for await (const ev of runJsonl(process.env.CODEX_BIN || 'codex', args, prompt, signal)) {
    const item = ev.item as { type?: string; text?: string } | undefined;
    if (ev.type === 'item.completed' && item?.type === 'agent_message' && item.text) {
      yield (sent++ ? '\n\n' : '') + item.text;
    } else if (ev.type === 'turn.completed') {
      const u = ev.usage as Record<string, number> | undefined;
      if (u) onInfo?.({ usage: { input: u.input_tokens, output: u.output_tokens, cache_read_input_tokens: u.cached_input_tokens } });
    } else if (ev.type === 'turn.failed' || ev.type === 'error') {
      const err = ev.error as { message?: string } | undefined;
      failure = err?.message ?? (typeof ev.message === 'string' ? ev.message : 'lỗi không rõ');
    }
  }
  if (failure && !sent) throw new CliProviderError(failure);
  if (!sent) throw new CliProviderError('Codex không trả về nội dung');
}
