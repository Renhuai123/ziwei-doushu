/**
 * POST /api/heming — 合盘 AI 分析（/heming 页调用）
 * 请求：{ chartA: ZiweiChart, chartB: ZiweiChart, relation?: 'love' | 'partner' | 'work' | 'friend', messages?: { role: 'user' | 'assistant', content: string }[], question?: string }
 * relation 默认 love；未传 messages 时兼容旧的 question 字段。
 * 响应：SSE，`data: {"delta":{"text":"..."}}` … `data: [DONE]`
 */
import { buildChartContext } from '@/lib/ai/chart-context';
import { buildHemingRelationContext, HEMING_SYSTEM, type HemingRelation } from '@/lib/ai/prompts';
import { BadRequest, jsonError, parseMessages, readJson, rebuildChart, streamCompletion } from '@/lib/ai/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUESTION_CHARS = 500;

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await readJson(req);
    const chartA = rebuildChart(body.chartA, 'chartA');
    const chartB = rebuildChart(body.chartB, 'chartB');
    const relation = body.relation === undefined ? 'love' : body.relation;
    if (relation !== 'love' && relation !== 'partner' && relation !== 'work' && relation !== 'friend') throw new BadRequest('relation 不合法');

    let question = '请按本次关系类型的默认结构为我们做一次完整的合盘分析。';
    if (body.messages === undefined && body.question !== undefined && body.question !== null) {
      if (typeof body.question !== 'string') throw new BadRequest('question 必须是字符串');
      const q = body.question.trim();
      if (q.length > MAX_QUESTION_CHARS) throw new BadRequest(`问题不能超过 ${MAX_QUESTION_CHARS} 字`);
      if (q) question = q;
    }

    return await streamCompletion({
      system: HEMING_SYSTEM,
      context: [
        buildHemingRelationContext(relation as HemingRelation),
        buildChartContext(chartA, { label: '甲方命盘' }),
        buildChartContext(chartB, { label: '乙方命盘' }),
      ].join('\n\n---\n\n'),
      messages: body.messages === undefined ? [{ role: 'user', content: question }] : parseMessages(body.messages),
      signal: req.signal,
    });
  } catch (e) {
    if (e instanceof BadRequest) return jsonError(400, e.message);
    console.error('[api/heming]', e);
    return jsonError(500, '服务器内部错误');
  }
}
