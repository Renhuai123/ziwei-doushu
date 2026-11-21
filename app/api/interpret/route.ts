import { describeChart } from '@/lib/ai/chart-context';
import { loadAiConfig } from '@/lib/ai/config';
import { interpretSystemPrompt } from '@/lib/ai/prompts';
import { chartFromClient, jsonResponse, parseMessages, readJsonBody } from '@/lib/ai/request';
import { sseResponse } from '@/lib/ai/sse';
import { streamText } from '@/lib/ai/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_OUTPUT_TOKENS = 16000;

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return jsonResponse(400, { error: body.error });
  const messages = parseMessages(body.value.messages);
  if (!messages.ok) return jsonResponse(400, { error: messages.error });
  const chart = chartFromClient(body.value.chart);
  if (!chart.ok) return jsonResponse(400, { error: chart.error });

  const ai = loadAiConfig();
  if (!ai.ok) return jsonResponse(503, { error: 'ai-not-configured', missing: ai.missing });

  const source = streamText(ai.config, {
    system: interpretSystemPrompt(describeChart(chart.value)),
    messages: messages.value,
    maxTokens: MAX_OUTPUT_TOKENS,
    signal: request.signal,
  });
  return sseResponse(source, request.signal);
}
