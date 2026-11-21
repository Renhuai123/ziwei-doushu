import { generateChart, type LunarMonthPolicy } from '../ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '../ziwei/types';
import type { ChatMessage } from './stream';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 8000;
export const MAX_QUESTION_CHARS = 1000;

const LEAP_POLICIES: readonly LunarMonthPolicy[] = ['split', 'next-month', 'prev-month', 'origin-month'];

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function intIn(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

function parseOrigInput(v: unknown): BirthInfo['origInput'] | null {
  if (!isRecord(v)) return null;
  const { year, month, day, clockHour, clockMinute } = v;
  if (!intIn(year, 1900, 2100) || !intIn(month, 1, 12) || !intIn(day, 1, 31)) return null;
  if (!intIn(clockHour, 0, 23) || !intIn(clockMinute, 0, 59)) return null;
  return { year, month, day, clockHour, clockMinute };
}

/** Keeps only the fields that change the chart or its explanation; drops names and places. */
export function parseBirthInfo(raw: unknown): Parsed<BirthInfo & { leapMonthPolicy?: LunarMonthPolicy }> {
  if (!isRecord(raw)) return fail('birthInfo must be an object');
  const { year, month, day, hour, gender, leapMonthPolicy, origInput } = raw;
  if (!intIn(year, 1900, 2100)) return fail('birthInfo.year must be an integer in 1900-2100');
  if (!intIn(month, 1, 12)) return fail('birthInfo.month must be an integer in 1-12');
  if (!intIn(day, 1, 31)) return fail('birthInfo.day must be an integer in 1-31');
  if (!intIn(hour, 0, 11)) return fail('birthInfo.hour must be an integer in 0-11');
  if (gender !== 'male' && gender !== 'female') return fail("birthInfo.gender must be 'male' or 'female'");
  const info: BirthInfo & { leapMonthPolicy?: LunarMonthPolicy } = { year, month, day, hour, gender };
  if (leapMonthPolicy !== undefined) {
    if (!LEAP_POLICIES.includes(leapMonthPolicy as LunarMonthPolicy)) return fail('birthInfo.leapMonthPolicy is invalid');
    info.leapMonthPolicy = leapMonthPolicy as LunarMonthPolicy;
  }
  if (origInput !== undefined) {
    const orig = parseOrigInput(origInput);
    if (!orig) return fail('birthInfo.origInput is invalid');
    info.origInput = orig;
  }
  return { ok: true, value: info };
}

/** The client's chart object is never trusted: only its birthInfo is used, and the chart is rebuilt here. */
export function chartFromClient(raw: unknown, label = 'chart'): Parsed<ZiweiChart> {
  if (!isRecord(raw)) return fail(`${label} must be an object`);
  const info = parseBirthInfo(raw.birthInfo);
  if (!info.ok) return fail(`${label}: ${info.error}`);
  const { leapMonthPolicy, ...birthInfo } = info.value;
  try {
    return { ok: true, value: generateChart(birthInfo, { leapMonth: leapMonthPolicy }) };
  } catch (e) {
    return fail(`${label}: ${e instanceof Error ? e.message : 'cannot build chart'}`);
  }
}

export function parseMessages(raw: unknown): Parsed<ChatMessage[]> {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_MESSAGES) {
    return fail(`messages must be an array of 1-${MAX_MESSAGES} items`);
  }
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (!isRecord(item) || (item.role !== 'user' && item.role !== 'assistant')) {
      return fail("each message needs role 'user' or 'assistant'");
    }
    if (typeof item.content !== 'string' || !item.content.trim() || item.content.length > MAX_MESSAGE_CHARS) {
      return fail(`message content must be a non-empty string of at most ${MAX_MESSAGE_CHARS} characters`);
    }
    messages.push({ role: item.role, content: item.content });
  }
  if (messages[messages.length - 1].role !== 'user') return fail('the last message must be from the user');
  return { ok: true, value: messages };
}

export function parseQuestion(raw: unknown): Parsed<string | undefined> {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== 'string' || raw.length > MAX_QUESTION_CHARS) {
    return fail(`question must be a string of at most ${MAX_QUESTION_CHARS} characters`);
  }
  const text = raw.trim();
  return { ok: true, value: text || undefined };
}

export function jsonResponse(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function readJsonBody(request: Request): Promise<Parsed<Record<string, unknown>>> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? { ok: true, value: body } : fail('body must be a JSON object');
  } catch {
    return fail('body must be valid JSON');
  }
}
