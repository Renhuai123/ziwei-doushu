import { describeChart } from '@/lib/ai/chart-context';
import { loadAiConfig } from '@/lib/ai/config';
import { hemingKnowledge, hemingSystemPrompt } from '@/lib/ai/prompts';
import { chartFromClient, jsonResponse, parseQuestion, readJsonBody } from '@/lib/ai/request';
import { rateLimited } from '@/lib/ai/rate-limit';
import { sseResponse } from '@/lib/ai/sse';
import { streamText } from '@/lib/ai/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_OUTPUT_TOKENS = 16000;

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return jsonResponse(400, { error: body.error });
  const chartA = chartFromClient(body.value.chartA, 'chartA');
  if (!chartA.ok) return jsonResponse(400, { error: chartA.error });
  const chartB = chartFromClient(body.value.chartB, 'chartB');
  if (!chartB.ok) return jsonResponse(400, { error: chartB.error });
  const question = parseQuestion(body.value.question);
  if (!question.ok) return jsonResponse(400, { error: question.error });

  const ai = loadAiConfig();
  if (!ai.ok) return jsonResponse(503, { error: 'ai-not-configured', missing: ai.missing });
  const limited = rateLimited(request);
  if (limited) return limited;

  const source = streamText(ai.config, {
    system: hemingSystemPrompt(
      describeChart(chartA.value),
      describeChart(chartB.value),
      hemingKnowledge(chartA.value, chartB.value),
    ),
    messages: [
      {
        role: 'user',
        content: question.value
          ? `请对甲乙双方做合盘分析。我最关心的问题：${question.value}`
          : '请对甲乙双方做完整的合盘分析。',
      },
    ],
    maxTokens: MAX_OUTPUT_TOKENS,
    signal: request.signal,
  });
  return sseResponse(source, request.signal);
}
