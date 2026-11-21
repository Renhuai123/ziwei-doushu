import { NextResponse } from 'next/server';
import { findReading } from '@/lib/readings/store';

export const runtime = 'nodejs';

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad('invalid JSON');
  }
  const { year, month, day, hour, gender } = (body ?? {}) as Record<string, unknown>;
  if (![year, month, day, hour].every(Number.isInteger)) return bad('year, month, day, hour must be integers');
  const [y, m, d, h] = [year, month, day, hour] as number[];
  if (h < 0 || h > 11) return bad('hour must be 0-11');
  if (gender !== 'male' && gender !== 'female') return bad('gender must be male or female');
  const date = new Date(Date.UTC(2000, m - 1, d));
  date.setUTCFullYear(y);
  if (m < 1 || m > 12 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return bad('not a real calendar date');
  }
  try {
    return NextResponse.json(await findReading({ year: y, month: m, day: d, hour: h, gender }));
  } catch {
    return NextResponse.json({ error: 'reading lookup failed' }, { status: 500 });
  }
}
