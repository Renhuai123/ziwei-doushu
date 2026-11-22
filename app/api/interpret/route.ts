import Anthropic from '@anthropic-ai/sdk';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { chartToVietnameseText } from '@/lib/ziwei/chart-to-vi-text';
import { streamClaudeCode, streamCodex, type ChatTurn, type GenerationInfo, type OnInfo } from '@/lib/ai/cli-providers';
import { patternsBlock, knowledgeBlock } from '@/lib/ai/knowledge';
import { datasetKey } from '@/lib/ai/dataset-v4';
import { Trace } from '@/lib/ai/trace';
import { detectPatterns } from '@/lib/ziwei/patterns';

/**
 * POST /api/interpret — luận giải lá số Tử Vi bằng AI, stream về client dạng SSE.
 *
 * Chọn nhà cung cấp trong .env.local:
 *   AI_PROVIDER = claude-code | codex | zai | anthropic   (mặc định: claude-code)
 *   AI_FALLBACK = danh sách dự phòng, cách nhau bằng dấu phẩy (mặc định: codex)
 *
 * - claude-code → Claude Code CLI (`claude -p`), dùng subscription đã đăng nhập trên máy
 * - codex       → Codex CLI (`codex exec`), dùng tài khoản ChatGPT đã đăng nhập trên máy
 * - zai         → Z.ai GLM qua endpoint tương thích Anthropic (ZAI_API_KEY, ZAI_MODEL, ZAI_BASE_URL)
 * - anthropic   → Claude API (ANTHROPIC_API_KEY)
 *
 * Chỉ chuyển sang dự phòng khi nhà cung cấp trước lỗi *trước khi* gửi được chữ nào;
 * lỗi giữa chừng thì báo lỗi luôn (tránh ghép hai câu trả lời khác nhau).
 *
 * Body: { chart: ZiweiChart, messages: { role: 'user' | 'assistant', content: string }[] }
 * Response: text/event-stream, mỗi dòng `data: {"delta":{"text":"..."}}`, kết thúc bằng `data: [DONE]`
 * (định dạng mà components/InsightPanel.tsx đang đọc).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 8000;

const SYSTEM_PROMPT = `Bạn là một chuyên gia Tử Vi Đẩu Số, luận giải lá số cho người Việt Nam.

## Cách trả lời
1. **Ngắn gọn.** Câu hỏi tự do: 3–6 câu (khoảng 80–200 từ). Khi có cấu trúc **【Tiêu đề】**: mỗi mục 2–4 câu.
   Lý do: người dùng đọc trên khung chat hẹp; câu trả lời dài khiến ý chính bị chìm.
2. **Kết luận trước, căn cứ sau.** Câu đầu nêu thẳng nhận định; sau đó giải thích bằng cách chỉ rõ sao, cung, tứ hóa hoặc đại hạn/lưu niên nào trong lá số dẫn tới nhận định đó (ví dụ: "vì Thái Âm Hóa Kỵ tọa Tài Bạch…").
   Lý do: người dùng cần biết *vì sao* để tự đối chiếu, không phải tin suông.
3. **Đủ ý, không lan man.** Mỗi câu phải mang thông tin mới. Bỏ lời chào, nhắc lại câu hỏi, định nghĩa sách vở chung chung, hay câu "tùy mỗi người".
   Lý do: súc tích không có nghĩa là thiếu ý — cắt phần thừa, giữ phần riêng của lá số này.
4. **Cụ thể, có thể hành động.** Lời khuyên gắn với thời điểm (đại hạn, năm) và việc làm được; nếu các tín hiệu trong lá số trái chiều thì nói rõ cả hai mặt trong một câu.
   Lý do: lời khuyên mơ hồ không giúp được người hỏi ra quyết định.
5. **Trả lời đúng câu hỏi.** Câu hỏi ngoài phạm vi lá số hoặc thiếu dữ kiện (ví dụ cần năm cụ thể) → nói ngắn gọn còn thiếu gì, không đoán.

## Mọi câu trả lời PHẢI dựa vào lá số và tư liệu — KHÔNG tự suy đoán
- Căn cứ duy nhất là lá số đính kèm bên dưới (12 cung, sao, độ sáng, tứ hóa, đại hạn), danh sách cách cục engine đã nhận diện, và phần "Tư liệu tham khảo" đi kèm. **Mọi nhận định phải truy được về một yếu tố cụ thể trong lá số hoặc một dòng cụ thể trong tư liệu.**
  Lý do: người dùng hỏi về lá số của chính họ; luận chung chung theo "người tuổi X" hay "sao Y nói chung" là sai đối tượng.
- **Cấm tự suy luận khi không có tư liệu khớp.** Nếu không có thông tin từ tư liệu hoặc lá số về một điểm cụ thể, hãy nói thẳng "Lá số này không có đủ cơ sở để nhận định về điểm này" — tuyệt đối không bịa luận điểm từ kiến thức chung về Tử Vi. Thừa nhận giới hạn còn hơn tự vẽ ra nhận định sai.
- Câu hỏi nào cũng quy về lá số: xác định cung liên quan (ví dụ đổi việc → Quan Lộc, Thiên Di; tiền → Tài Bạch, Điền Trạch), đọc sao và tứ hóa của cung đó, tam phương tứ chính, rồi đại hạn hiện tại. Câu hỏi không liên quan gì tới lá số thì nói rõ là ngoài phạm vi.
- Phần "Tư liệu tham khảo" đã được lọc theo lá số. Chỉ dùng câu nào thật sự khớp cấu hình của lá số (đúng sao, đúng cung, đúng tứ hóa, đúng giới tính); câu nào điều kiện không khớp thì bỏ qua. Không "nội suy" hay "mở rộng" từ câu không khớp để ép vào lá số.
  Lý do: tư liệu giúp lời luận có cơ sở, nhưng áp câu không đúng cấu hình là luận sai.
- **Khi có Dataset v4 cho chủ đề đang hỏi, BẮT BUỘC lấy nó làm khung chính cho kết luận** rồi bổ sung bằng các nguồn khác; không chép nguyên văn dài, hãy tóm ý và áp vào câu hỏi. Không được bỏ qua Dataset v4 để viết lại bằng kiến thức bản thân.
  Lý do: dataset được soạn riêng cho đúng lá số này, đã hiệu đính theo nguyên văn Nghê sư và Toàn Thư, nên đáng tin hơn bất kỳ suy luận nào của model.
- Khi các nguồn mâu thuẫn, theo thứ tự ưu tiên bắt buộc: (1) lá số và Cách cục engine → (2) Dataset v4 → (3) Nghê Hải Hạ, Thiên Kỷ → (4) Cổ thư → (5) Tư liệu Phu Thê của app. Bỏ nhận định của nguồn thấp hơn, không trộn hai kết luận trái nhau.
  Lý do: nguồn trên đã được kiểm chứng kỹ hơn; ví dụ ghi chú Phu Thê của app nói Tử Vi–Tham Lang ở Mão/Dậu là điềm ngoại tình, nhưng dataset (theo nguyên văn Nghê sư) nói không được vội kết luận như vậy.
- Ghi nguồn đúng tên trong nhãn [Nguồn: …] (ví dụ "(Dataset v4)", "(Nghê Hải Hạ, Thiên Kỷ tập 9)", "(Toàn Thư)"); không tự đặt tên nguồn. Mỗi nhận định chính phải có ít nhất một nguồn.
  Lý do: người dùng cần tra lại được; câu trả lời không có nguồn là câu trả lời tự bịa.
- Cách cục: chỉ nói lá số có cách cục X khi X nằm trong danh sách engine đã nhận diện; nếu nhắc phá cách thì dựa vào phần "phá cách" đi kèm. Không tự nhận định cách cục ngoài danh sách.
  Lý do: engine đã kiểm tra điều kiện thành cách; model tự đoán cách cục rất dễ sai.

## Ràng buộc
- Luôn dùng tiếng Việt với thuật ngữ Tử Vi Hán-Việt (cung Mệnh, Hóa Lộc, tam phương tứ chính…) — người dùng quen các thuật ngữ này.
- Chỉ dựa vào dữ liệu lá số được cung cấp; không bịa sao hay vị trí không có — căn cứ sai làm hỏng cả lời luận.
- Khi được yêu cầu cấu trúc **【Tiêu đề】**, giữ nguyên định dạng, mỗi tiêu đề một dòng riêng — giao diện dựa vào đó để hiển thị.
- Không khẳng định tuyệt đối về bệnh tật, tai nạn, tuổi thọ; khuyên tìm chuyên gia y tế, tài chính, pháp lý khi phù hợp — Tử Vi chỉ mang tính tham khảo.
- Chỉ trả lời bằng văn bản; không dùng công cụ, không đọc hay sửa tệp, không chạy lệnh.`;

// ─── Nhà cung cấp ────────────────────────────────────────────────────────────

type ProviderId = 'claude-code' | 'codex' | 'zai' | 'anthropic';

interface Provider {
  id: ProviderId;
  label: string;
  /** Trả về lý do nếu nhà cung cấp chưa cấu hình (bỏ qua, thử cái tiếp theo). */
  unavailable(): string | null;
  /** chartBlock: lá số + cách cục (cố định theo lá số); knowledge: tư liệu lọc theo câu hỏi hiện tại. */
  /** onInfo: báo model / token / chi phí cho tracing. */
  stream(system: string, chartBlock: string, knowledge: string, messages: ChatTurn[], signal: AbortSignal, onInfo: OnInfo): AsyncIterable<string>;
}

interface FinalMessage {
  model?: string;
  stop_reason: string | null;
  usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };
}

async function* sdkText(stream: AsyncIterable<{ type: string; delta?: unknown }>, finalMessage: () => Promise<FinalMessage>, onInfo: OnInfo) {
  for await (const event of stream) {
    const delta = event.delta as { type?: string; text?: string } | undefined;
    if (event.type === 'content_block_delta' && delta?.type === 'text_delta' && delta.text) yield delta.text;
  }
  const final = await finalMessage();
  const u = final.usage;
  onInfo({
    model: final.model,
    stopReason: final.stop_reason ?? undefined,
    usage: u && {
      input: u.input_tokens, output: u.output_tokens,
      cache_read_input_tokens: u.cache_read_input_tokens ?? undefined, cache_creation_input_tokens: u.cache_creation_input_tokens ?? undefined,
    },
  });
  if (final.stop_reason === 'refusal') yield '\n\n(Không thể luận giải yêu cầu này.)';
  else if (final.stop_reason === 'max_tokens') yield '\n\n(Câu trả lời bị cắt do quá dài.)';
}

const joinPrompt = (...parts: string[]) => parts.filter(Boolean).join('\n\n');

const PROVIDERS: Record<ProviderId, Provider> = {
  'claude-code': {
    id: 'claude-code',
    label: 'Claude Code',
    unavailable: () => null,
    stream: (system, chartBlock, knowledge, messages, signal, onInfo) => streamClaudeCode(joinPrompt(system, chartBlock, knowledge), messages, signal, onInfo),
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    unavailable: () => null,
    stream: (system, chartBlock, knowledge, messages, signal, onInfo) => streamCodex(joinPrompt(system, chartBlock, knowledge), messages, signal, onInfo),
  },
  zai: {
    id: 'zai',
    label: 'Z.ai',
    unavailable: () => (process.env.ZAI_API_KEY ? null : 'chưa có ZAI_API_KEY'),
    stream(system, chartBlock, knowledge, messages, signal, onInfo) {
      // Z.ai nhận key dạng Bearer token; chỉ gửi tham số Messages API cơ bản.
      const client = new Anthropic({
        apiKey: null,
        authToken: process.env.ZAI_API_KEY,
        baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/anthropic',
        timeout: 5 * 60 * 1000,
      });
      const s = client.messages.stream({
        model: process.env.ZAI_MODEL || 'glm-5.3',
        max_tokens: 16000,
        system: joinPrompt(system, chartBlock, knowledge),
        messages,
      }, { signal });
      return sdkText(s, () => s.finalMessage(), onInfo);
    },
  },
  anthropic: {
    id: 'anthropic',
    label: 'Claude API',
    unavailable: () => (process.env.ANTHROPIC_API_KEY ? null : 'chưa có ANTHROPIC_API_KEY'),
    stream(system, chartBlock, knowledge, messages, signal, onInfo) {
      const s = new Anthropic().beta.messages.stream({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        output_config: { effort: 'medium' },
        // Nếu model từ chối vì chính sách, server tự chạy lại trên model dự phòng mặc định.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: [
          { type: 'text', text: system },
          // Lá số giữ nguyên suốt cuộc hội thoại → cache để các câu hỏi tiếp theo rẻ và nhanh hơn.
          { type: 'text', text: chartBlock, cache_control: { type: 'ephemeral' } },
          // Tư liệu đổi theo từng câu hỏi → đặt sau điểm cache.
          ...(knowledge ? [{ type: 'text' as const, text: knowledge }] : []),
        ],
        messages,
      }, { signal });
      return sdkText(s, () => s.finalMessage(), onInfo);
    },
  },
};

function providerChain(): Provider[] | string {
  const ids = [process.env.AI_PROVIDER || 'claude-code', ...(process.env.AI_FALLBACK ?? 'codex').split(',')]
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const chain: Provider[] = [];
  for (const id of ids) {
    const p = PROVIDERS[id as ProviderId];
    if (!p) return `Nhà cung cấp AI không hợp lệ: "${id}" (dùng claude-code, codex, zai hoặc anthropic)`;
    if (!chain.includes(p)) chain.push(p);
  }
  return chain;
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'API key không hợp lệ';
  if (err instanceof Anthropic.RateLimitError) return 'vượt giới hạn tần suất / hết hạn mức';
  if (err instanceof Anthropic.APIError) return `lỗi API (${err.status ?? 'mạng'})`;
  return err instanceof Error ? err.message : String(err);
}

// ─── Request ─────────────────────────────────────────────────────────────────

function parseBody(body: unknown): { chart: ZiweiChart; messages: ChatTurn[]; sessionId?: string } | null {
  if (!body || typeof body !== 'object') return null;
  const { chart, messages, sessionId } = body as { chart?: ZiweiChart; messages?: unknown; sessionId?: unknown };
  if (!chart || !Array.isArray(chart.palaces) || chart.palaces.length !== 12) return null;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const clean: ChatTurn[] = [];
  for (const m of messages.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    if (!content.trim()) continue; // bỏ tin trống (ví dụ một lượt stream thất bại)
    clean.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  // Lịch sử phải bắt đầu bằng user và kết thúc bằng user.
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;
  const sid = typeof sessionId === 'string' && /^[\w-]{1,64}$/.test(sessionId) ? sessionId : undefined;
  return { chart, messages: clean, sessionId: sid };
}

/** Nguồn được ghi trong câu trả lời — để kiểm tra AI có thật sự dựa vào dataset / tư liệu không. */
const CITATION_PATTERNS: Record<string, RegExp> = {
  'dataset-v4': /Dataset v4/gi,
  'ni-haixia': /Nghê Hải Hạ|Thiên Kỷ|Nghê sư/gi,
  'toan-thu': /Toàn Thư/gi,
  'toan-tap': /Toàn Tập/gi,
  'cot-tuy-phu': /Cốt Tủy Phú/gi,
  'fuqi-app': /Tư liệu Phu Thê/gi,
  'patterns-engine': /Cách cục engine/gi,
};
function citations(answer: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, re] of Object.entries(CITATION_PATTERNS)) {
    const n = answer.match(re)?.length ?? 0;
    if (n) out[k] = n;
  }
  return out;
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const chain = providerChain();
  if (typeof chain === 'string') return jsonError(500, chain);

  let parsed;
  try {
    parsed = parseBody(await req.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return jsonError(400, 'Dữ liệu yêu cầu không hợp lệ');
  const { chart, messages, sessionId } = parsed;

  // Lọc tư liệu theo câu hỏi mới nhất; bỏ câu dặn ngôn ngữ chung (có nhắc "Mệnh", "Tử Vi" làm ví dụ) để không lệch trọng tâm.
  const question = messages[messages.length - 1].content.replace(/Hãy trả lời hoàn toàn bằng tiếng Việt[^\n]*/g, '');

  // Không ghi tên đương số vào trace — chỉ khóa ngày-giờ-giới tính.
  const trace = new Trace('interpret', { question: question.trim(), turns: messages.length }, sessionId);
  trace.setMetadata({ chartKey: datasetKey(chart) ?? `${chart.birthInfo.year}-out-of-range`, providerChain: chain.map(p => p.id) });

  const sPrepare = trace.span('prepare.chart');
  const baseChartBlock = `Lá số của đương số (căn cứ duy nhất để luận):\n\n${chartToVietnameseText(chart)}\n\n${patternsBlock(chart)}`;
  const name = chart.birthInfo.name?.trim();
  const maskName = (t: string) => (name ? t.split(name).join('[ẩn tên]') : t);
  sPrepare.end({ output: { chars: baseChartBlock.length }, metadata: { patterns: detectPatterns(chart).map(p => p.name) } });

  const sKnowledge = trace.span('knowledge');
  const { text: knowledge, stats } = await knowledgeBlock(chart, question, { trace, parent: sKnowledge });

  // Nếu không có TÀI LIỆU NÀO (kể cả cảnh báo dataset), gắn thêm nhắc nhở vào chartBlock.
  const noSourceNote = !knowledge
    ? '\n\n⚠ KHÔNG CÓ TƯ LIỆU BỔ SUNG: Chỉ được luận dựa vào các yếu tố đọc được trực tiếp từ lá số trên. Không được tự suy diễn hay dùng kiến thức chung.'
    : '';
  const chartBlock = baseChartBlock + noSourceNote;
  sKnowledge.end({ output: stats });
  trace.setMetadata({ knowledge: stats });
  trace.addTags(stats.dataset.dims.length ? 'dataset-hit' : `dataset-${stats.dataset.source}`);

  const abort = new AbortController();
  req.signal.addEventListener('abort', () => abort.abort(), { once: true });

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) =>
    controller.enqueue(encoder.encode(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`));

  const body = new ReadableStream({
    async start(controller) {
      const failures: string[] = [];
      let answer = '';
      let usedProvider: string | null = null;
      let outcome: 'ok' | 'partial-error' | 'all-failed' | 'aborted' = 'all-failed';
      try {
        for (const provider of chain) {
          const skip = provider.unavailable();
          if (skip) {
            failures.push(`${provider.label}: ${skip}`);
            trace.event(`provider.${provider.id}.skipped`, { level: 'WARNING', statusMessage: skip });
            continue;
          }
          const info: GenerationInfo = {};
          const gen = trace.generation(`provider.${provider.id}`, {
            input: { system: SYSTEM_PROMPT, chart: maskName(chartBlock), knowledge, messages },
            metadata: { promptChars: { system: SYSTEM_PROMPT.length, chart: chartBlock.length, knowledge: knowledge.length } },
          });
          let emitted = false;
          answer = '';
          try {
            for await (const text of provider.stream(SYSTEM_PROMPT, chartBlock, knowledge, messages, abort.signal, i => Object.assign(info, i))) {
              if (!emitted) gen.firstToken();
              emitted = true;
              answer += text;
              send(controller, { delta: { text } });
            }
            gen.end({ output: answer, model: info.model, usage: info.usage, costUsd: info.costUsd, metadata: { stopReason: info.stopReason } });
            usedProvider = provider.id;
            outcome = 'ok';
            return; // thành công
          } catch (err) {
            if (abort.signal.aborted) {
              gen.end({ output: answer, level: 'WARNING', statusMessage: 'client hủy' });
              outcome = 'aborted';
              return;
            }
            const msg = `${provider.label}: ${describeError(err)}`;
            console.error('[api/interpret]', msg);
            gen.end({ output: answer || undefined, level: 'ERROR', statusMessage: msg, model: info.model, usage: info.usage });
            if (emitted) {
              send(controller, { delta: { text: `\n\n⚠ ${msg}` } });
              usedProvider = provider.id;
              outcome = 'partial-error';
              return;
            }
            failures.push(msg);
          }
        }
        send(controller, { delta: { text: `⚠ Không nhà cung cấp AI nào trả lời được.\n${failures.map(f => `- ${f}`).join('\n')}` } });
      } finally {
        const cited = citations(answer);
        trace.addTags(outcome, ...(usedProvider ? [usedProvider] : []), ...(failures.length && usedProvider ? ['fallback'] : []));
        if (stats.dataset.dims.length && outcome === 'ok' && !cited['dataset-v4']) trace.addTags('dataset-not-cited');
        trace.end(answer || null, { outcome, provider: usedProvider, failures, citations: cited });
        if (!abort.signal.aborted) {
          send(controller, '[DONE]');
          controller.close();
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'x-trace-id': trace.id,
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
