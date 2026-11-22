/**
 * Tracing cho /api/interpret: mỗi request là một trace gồm các observation con
 * (span = một bước, generation = một lần gọi model, event = một mốc).
 *
 * Đích ghi:
 *   1. Luôn có: data/traces/YYYY-MM-DD.jsonl — một dòng = một trace đầy đủ (tắt bằng TRACE_FILE=0).
 *   2. Langfuse (khi có LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY): gửi OTLP/HTTP JSON tới
 *      `POST {LANGFUSE_BASE_URL}/api/public/otel/v1/traces` (header x-langfuse-ingestion-version: 4) —
 *      không cần SDK, chạy được với cả bản tự host lẫn Cloud. Request = span gốc; bước con = span con.
 *
 * Dữ liệu cá nhân: không bao giờ ghi tên đương số. Nội dung prompt / câu trả lời gửi sang Langfuse chỉ khi
 * LANGFUSE_CAPTURE_CONTENT=1, hoặc mặc định khi LANGFUSE_BASE_URL là localhost (tự host trên máy này).
 * File JSONL local luôn ghi nội dung (nằm trên máy, đã .gitignore).
 *
 * Mọi lỗi của tracing đều bị nuốt (chỉ console.error) — tracing không bao giờ làm hỏng câu trả lời.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

type Level = 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';

export interface Usage {
  input?: number;
  output?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  total?: number;
}

interface ObservationRecord {
  id: string;
  type: 'span' | 'generation' | 'event';
  name: string;
  parentId?: string;
  startTime: string;
  endTime?: string;
  completionStartTime?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  level?: Level;
  statusMessage?: string;
  model?: string;
  usage?: Usage;
  costUsd?: number;
}

interface EndUpdate {
  output?: unknown;
  metadata?: Record<string, unknown>;
  level?: Level;
  statusMessage?: string;
  model?: string;
  usage?: Usage;
  costUsd?: number;
}

export interface Observation {
  readonly id: string;
  update(u: EndUpdate): void;
  /** Đánh dấu lúc nhận token đầu tiên (generation). */
  firstToken(): void;
  end(u?: EndUpdate): void;
}

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export class Trace {
  readonly id = uuid();
  private readonly startTime = now();
  private readonly observations: ObservationRecord[] = [];
  private output: unknown;
  private metadata: Record<string, unknown> = {};
  private tags: string[] = [];
  private flushed = false;

  constructor(
    private readonly name: string,
    private readonly input: unknown,
    private readonly sessionId?: string,
  ) {}

  setMetadata(m: Record<string, unknown>) { Object.assign(this.metadata, m); }
  addTags(...t: string[]) { for (const x of t) if (!this.tags.includes(x)) this.tags.push(x); }

  private start(type: ObservationRecord['type'], name: string, opts: { input?: unknown; metadata?: Record<string, unknown>; parent?: Observation; model?: string } = {}): Observation {
    const rec: ObservationRecord = {
      id: uuid(), type, name, startTime: now(),
      parentId: opts.parent?.id, input: opts.input, metadata: opts.metadata, model: opts.model,
    };
    this.observations.push(rec);
    const apply = (u: EndUpdate) => {
      if (u.output !== undefined) rec.output = u.output;
      if (u.metadata) rec.metadata = { ...rec.metadata, ...u.metadata };
      if (u.level) rec.level = u.level;
      if (u.statusMessage) rec.statusMessage = u.statusMessage;
      if (u.model) rec.model = u.model;
      if (u.usage) rec.usage = u.usage;
      if (u.costUsd !== undefined) rec.costUsd = u.costUsd;
    };
    return {
      id: rec.id,
      update: apply,
      firstToken: () => { rec.completionStartTime ??= now(); },
      end: (u = {}) => { apply(u); rec.endTime ??= now(); },
    };
  }

  span(name: string, opts?: { input?: unknown; metadata?: Record<string, unknown>; parent?: Observation }) {
    return this.start('span', name, opts);
  }
  generation(name: string, opts?: { input?: unknown; metadata?: Record<string, unknown>; parent?: Observation; model?: string }) {
    return this.start('generation', name, opts);
  }
  event(name: string, opts: { metadata?: Record<string, unknown>; level?: Level; statusMessage?: string; parent?: Observation } = {}) {
    const o = this.start('event', name, opts);
    o.end({ level: opts.level, statusMessage: opts.statusMessage });
  }

  /** Kết thúc trace và gửi đi (không chờ, không ném lỗi). Gọi nhiều lần chỉ có hiệu lực lần đầu. */
  end(output: unknown, metadata?: Record<string, unknown>) {
    if (this.flushed) return;
    this.flushed = true;
    this.output = output;
    if (metadata) this.setMetadata(metadata);
    const endTime = now();
    for (const o of this.observations) o.endTime ??= endTime; // observation bị bỏ dở (ví dụ client hủy)
    const record = {
      id: this.id, name: this.name, sessionId: this.sessionId, startTime: this.startTime, endTime,
      durationMs: Date.parse(endTime) - Date.parse(this.startTime),
      tags: this.tags, input: this.input, output: this.output, metadata: this.metadata,
      observations: this.observations,
    };
    writeFile(record);
    void sendLangfuse(record);
  }
}

// ─── Đích 1: file JSONL ──────────────────────────────────────────────────────

const TRACE_DIR = path.join(process.cwd(), 'data/traces');

function writeFile(record: { startTime: string }) {
  if (process.env.TRACE_FILE === '0') return;
  try {
    fs.mkdirSync(TRACE_DIR, { recursive: true });
    fs.appendFileSync(path.join(TRACE_DIR, `${record.startTime.slice(0, 10)}.jsonl`), `${JSON.stringify(record)}\n`);
  } catch (err) {
    console.error('[trace] không ghi được file', err);
  }
}

// ─── Đích 2: Langfuse ────────────────────────────────────────────────────────

function langfuseConfig() {
  const pk = process.env.LANGFUSE_PUBLIC_KEY;
  const sk = process.env.LANGFUSE_SECRET_KEY;
  if (!pk || !sk) return null;
  const baseUrl = (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').replace(/\/+$/, '');
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(baseUrl);
  const capture = process.env.LANGFUSE_CAPTURE_CONTENT ? process.env.LANGFUSE_CAPTURE_CONTENT === '1' : local;
  return { auth: Buffer.from(`${pk}:${sk}`).toString('base64'), baseUrl, capture };
}

/** Khi không gửi nội dung: thay chuỗi bằng độ dài để vẫn thấy được kích thước. */
function redact(v: unknown): unknown {
  if (typeof v === 'string') return `[ẩn · ${v.length} ký tự]`;
  if (Array.isArray(v)) return v.map(redact);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redact(x)]));
  return v;
}

let warnedLangfuse = false;

// OTLP/HTTP JSON (Langfuse v4 bỏ endpoint /api/public/ingestion cũ; OTel là đường ghi thời gian thực).
type OtlpValue = { stringValue: string } | { arrayValue: { values: { stringValue: string }[] } };
type OtlpAttr = { key: string; value: OtlpValue };

const hexId = (uuidStr: string, len: 32 | 16) => uuidStr.replace(/-/g, '').slice(0, len);
const nanos = (iso: string) => `${BigInt(Date.parse(iso)) * BigInt(1_000_000)}`;
const str = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

function attrs(o: Record<string, unknown>): OtlpAttr[] {
  const out: OtlpAttr[] = [];
  for (const [key, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      out.push({ key, value: { arrayValue: { values: v.map(x => ({ stringValue: x })) } } });
    } else {
      out.push({ key, value: { stringValue: str(v) } });
    }
  }
  return out;
}

/** metadata → langfuse.<scope>.metadata.<key> (key cấp 1, lọc được trong Langfuse). */
function metadataAttrs(scope: 'trace' | 'observation', m?: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(m ?? {}).map(([k, v]) => [`langfuse.${scope}.metadata.${k}`, v]));
}

async function sendLangfuse(t: {
  id: string; name: string; sessionId?: string; startTime: string; endTime: string; tags: string[];
  input: unknown; output: unknown; metadata: Record<string, unknown>; observations: ObservationRecord[];
}) {
  const cfg = langfuseConfig();
  if (!cfg) return;
  const content = (v: unknown) => (v === undefined ? undefined : cfg.capture ? v : redact(v));
  const traceId = hexId(t.id, 32);
  const rootId = hexId(crypto.randomUUID(), 16);

  // Span gốc = cả request: mang input/output của trace (v4 đọc input/output trace từ observation gốc).
  const spans = [{
    traceId, spanId: rootId, name: t.name, kind: 2,
    startTimeUnixNano: nanos(t.startTime), endTimeUnixNano: nanos(t.endTime),
    attributes: attrs({
      'langfuse.trace.name': t.name,
      'langfuse.session.id': t.sessionId,
      'langfuse.trace.tags': t.tags,
      'langfuse.environment': process.env.NODE_ENV === 'production' ? 'production' : 'development',
      'langfuse.observation.type': 'span',
      'langfuse.observation.input': content(t.input),
      'langfuse.observation.output': content(t.output),
      ...metadataAttrs('trace', t.metadata),
    }),
  }];

  for (const o of t.observations) {
    const isError = o.level === 'ERROR';
    spans.push({
      traceId, spanId: hexId(o.id, 16), name: o.name, kind: o.type === 'generation' ? 3 : 1,
      ...{ parentSpanId: o.parentId ? hexId(o.parentId, 16) : rootId },
      startTimeUnixNano: nanos(o.startTime), endTimeUnixNano: nanos(o.endTime ?? o.startTime),
      attributes: attrs({
        'langfuse.observation.type': o.type,
        'langfuse.observation.input': content(o.input),
        'langfuse.observation.output': content(o.output),
        'langfuse.observation.level': o.level,
        'langfuse.observation.status_message': o.statusMessage,
        'langfuse.observation.model.name': o.model,
        'langfuse.observation.usage_details': o.usage && Object.fromEntries(Object.entries(o.usage).filter(([, v]) => typeof v === 'number')),
        'langfuse.observation.cost_details': o.costUsd !== undefined ? { total: o.costUsd } : undefined,
        'langfuse.observation.completion_start_time': o.completionStartTime,
        ...metadataAttrs('observation', o.metadata),
      }),
      ...(isError ? { status: { code: 2, message: o.statusMessage ?? '' } } : {}),
    } as (typeof spans)[number]);
  }

  const body = {
    resourceSpans: [{
      resource: { attributes: attrs({ 'service.name': 'ziwei-doushu' }) },
      scopeSpans: [{ scope: { name: 'ziwei-doushu/interpret' }, spans }],
    }],
  };
  try {
    const res = await fetch(`${cfg.baseUrl}/api/public/otel/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${cfg.auth}`,
        'x-langfuse-ingestion-version': '4',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error('[trace] Langfuse từ chối', res.status, (await res.text().catch(() => '')).slice(0, 500));
  } catch (err) {
    if (!warnedLangfuse) console.error('[trace] không gửi được tới Langfuse', cfg.baseUrl, err);
    warnedLangfuse = true;
  }
}
