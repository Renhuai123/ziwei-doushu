/**
 * POST /api/interpret — 单盘 AI 解读（ChatPanel / InsightPanel 调用）
 * 请求：{ chart: ZiweiChart, messages: { role, content }[] }
 * 响应：SSE，`data: {"delta":{"text":"..."}}` … `data: [DONE]`
 */
import { buildChartContext } from '@/lib/ai/chart-context';
import { INTERPRET_SYSTEM } from '@/lib/ai/prompts';
import { BadRequest, jsonError, parseMessages, readJson, rebuildChart, streamCompletion } from '@/lib/ai/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await readJson(req);
    const chart = rebuildChart(body.chart);
    const messages = parseMessages(body.messages);
    return await streamCompletion({
      system: INTERPRET_SYSTEM,
      context: buildChartContext(chart),
      messages,
      signal: req.signal,
    });
  } catch (e) {
    if (e instanceof BadRequest) return jsonError(400, e.message);
    console.error('[api/interpret]', e);
    return jsonError(500, '服务器内部错误');
  }
}
