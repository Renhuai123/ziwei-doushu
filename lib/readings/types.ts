import type { TopicKey } from '@/lib/ziwei/db-analysis';

export const READINGS_YEAR_RANGE = [1950, 2026] as const;

export interface ChartReading {
  key: string;
  mainStar: string | null;
  topics: Record<TopicKey, string>;
}

export type ReadingResult =
  | { status: 'found'; reading: ChartReading }
  | { status: 'out-of-range'; range: readonly [number, number] }
  | { status: 'unavailable' };
