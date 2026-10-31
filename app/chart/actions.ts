'use server';

import { detectPatterns, getMingGongSummary } from '@/lib/ziwei/patterns';
import { BadRequest, rebuildChart } from '@/lib/ai/request';
import type { BirthInfo } from '@/lib/ziwei/types';

export async function getChartAnalysis(input: { birthInfo: BirthInfo }) {
  try {
    const chart = rebuildChart(input);
    return { patterns: detectPatterns(chart), summary: getMingGongSummary(chart) };
  } catch (error) {
    if (error instanceof BadRequest) throw new Error(error.message);
    throw error;
  }
}
