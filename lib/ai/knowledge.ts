/**
 * Tư liệu tham khảo cho /api/interpret — chọn từ dữ liệu có sẵn trong repo theo ĐÚNG lá số đang hỏi.
 *
 * Nguồn (ưu tiên từ trên xuống — thứ tự này cũng ghi trong guide ở route):
 *   - data/dataset-v4                    dataset luận giải v4.0, tra đúng lá số (lib/ai/dataset-v4.ts)
 *   - docs/tianji-ziwei/entries.jsonl   1848 câu nguyên văn Nghê Hải Hạ《Thiên Kỷ》(CC BY-NC-SA 4.0 — không thương mại)
 *   - lib/classics                       《Toàn Thư》《Toàn Tập》《Cốt Tủy Phú》(trích tuyển, công hữu)
 *   - lib/ziwei/patterns.ts              cách cục engine nhận diện được trên lá số
 *   - lib/ziwei/heming-knowledge.ts      sao / tứ hóa tại cung Phu Thê
 *   - lib/nihai/tianji.ts                ngữ lục ngắn của Nghê sư (chủ đề Tử Vi)
 *
 * Không nạp toàn bộ vào prompt: ~750 KB chữ Hán ≈ hàng trăm nghìn token mỗi lần hỏi, chậm, tốn,
 * và phần lớn không liên quan tới lá số. Thay vào đó mỗi mục được chấm điểm theo sao / cung / tứ hóa /
 * cách cục THỰC SỰ có trong lá số (và cung mà câu hỏi nhắc tới), rồi lấy phần điểm cao nhất trong
 * ngân sách ký tự. Mục nào không khớp lá số thì không bao giờ được đưa vào.
 *
 * Không dùng: lib/nihai/renji (châm cứu, phương thuốc), lib/nihai/diji (địa lý), quẻ Dịch, phong thủy —
 * không phải dữ liệu luận lá số. Dataset v4.0 (56,6 GB) không có trong repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';
import { ALL_BOOKS } from '@/lib/classics';
import { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU, MARRIAGE_STARS_BRIEF } from '@/lib/ziwei/heming-knowledge';
import { TIANJI_QUOTES } from '@/lib/nihai/tianji';
import { viPalace, viStar } from '@/lib/i18n/vi';
import { lookupDataset, type DatasetDim, type LookupSource } from '@/lib/ai/dataset-v4';
import type { Trace, Observation } from '@/lib/ai/trace';

// ─── Ngân sách (ký tự) ───────────────────────────────────────────────────────
const BUDGET_NI = 5000;
const BUDGET_CLASSICS = 2000;
const BUDGET_DATASET_PER_DIM = 4000;
const MAX_DATASET_DIMS = 2;
const MAX_QUOTE_CHARS = 160;

// ─── Dữ liệu nguồn ───────────────────────────────────────────────────────────

interface NiEntry { book: string; h2: string; h3: string; quote: string; t_hms: string; bvid: string; part: number }

let niCache: NiEntry[] | null = null;
function niEntries(): NiEntry[] {
  if (niCache) return niCache;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'docs/tianji-ziwei/entries.jsonl'), 'utf8');
    niCache = raw.split('\n').filter(Boolean).map(l => JSON.parse(l) as NiEntry);
  } catch (err) {
    console.error('[ai/knowledge] không đọc được entries.jsonl', err);
    niCache = [];
  }
  return niCache;
}

let classicCache: { book: string; chapter: string; text: string }[] | null = null;
function classicParagraphs() {
  if (!classicCache) {
    classicCache = ALL_BOOKS.flatMap(b =>
      b.chapters.flatMap(c => c.paragraphs.map(p => ({ book: b.title, chapter: c.title, text: p.text }))));
  }
  return classicCache;
}

// ─── Ngữ cảnh lá số ──────────────────────────────────────────────────────────

/** Tên cung gốc không có chữ 宫, gộp 仆役/交友. */
const base = (name: string) => name.replace(/宫$/, '').replace('仆役', '交友');

/** Từ khóa tiếng Việt trong câu hỏi → cung (tên Hán gốc). */
const QUESTION_PALACES: [RegExp, string][] = [
  [/mệnh|tính cách|bản thân|cách cục/i, '命'],
  [/huynh đệ|anh chị em|anh em|đối tác|hợp tác/i, '兄弟'],
  [/phu thê|tình cảm|tình yêu|hôn nhân|vợ|chồng|người yêu|kết hôn|cưới|ly hôn/i, '夫妻'],
  [/tử tức|con cái|con\b|cấp dưới/i, '子女'],
  [/tài bạch|tài vận|tiền|thu nhập|giàu|tài chính|đầu tư/i, '财帛'],
  [/tật ách|sức khỏe|bệnh|ốm|tai nạn|phẫu thuật/i, '疾厄'],
  [/thiên di|đi xa|xuất ngoại|di chuyển|định cư|ra ngoài/i, '迁移'],
  [/nô bộc|bạn bè|quý nhân|tiểu nhân|giao hữu/i, '交友'],
  [/quan lộc|sự nghiệp|công việc|nghề|đổi việc|thăng chức|kinh doanh|khởi nghiệp/i, '官禄'],
  [/điền trạch|nhà|đất|bất động sản/i, '田宅'],
  [/phúc đức|tinh thần|phúc phần/i, '福德'],
  [/phụ mẫu|cha mẹ|bố mẹ|giấy tờ|hợp đồng/i, '父母'],
];

/** Cung → chủ đề trong dataset v4. */
const PALACE_DIM: Record<string, DatasetDim> = {
  '命': 'overview', '兄弟': 'family', '夫妻': 'love', '子女': 'children', '财帛': 'wealth', '疾厄': 'health',
  '迁移': 'move', '交友': 'friends', '官禄': 'career', '田宅': 'home', '福德': 'spirit', '父母': 'parents',
};
const DIM_LABEL: Record<DatasetDim, string> = {
  overview: 'Tổng quan mệnh cách', personality: 'Tính cách', love: 'Tình cảm', career: 'Sự nghiệp',
  wealth: 'Tài vận', health: 'Sức khỏe', family: 'Huynh đệ', children: 'Con cái', move: 'Thiên di',
  friends: 'Bạn bè', home: 'Điền trạch', spirit: 'Phúc đức', parents: 'Cha mẹ',
};

/** Chủ đề dataset cần lấy: theo cung câu hỏi nhắc tới (trọng số 3); không nhắc cung nào thì lấy tổng quan. */
function datasetDims(f: Focus, question: string): DatasetDim[] {
  const dims: DatasetDim[] = [];
  if (/tính cách/i.test(question)) dims.push('personality');
  for (const [b, w] of f.palaces) {
    if (w !== 3) continue;
    const d = PALACE_DIM[b];
    if (d && !dims.includes(d) && !(d === 'overview' && dims.includes('personality'))) dims.push(d);
  }
  // Câu hỏi về cung cụ thể thì cung đó đứng trước "Mệnh" (Mệnh hay bị nhắc kèm trong prompt chủ đề).
  dims.sort((a, b) => (a === 'overview' ? 1 : 0) - (b === 'overview' ? 1 : 0));
  return (dims.length ? dims : ['overview' as const]).slice(0, MAX_DATASET_DIMS);
}

interface Focus {
  palaces: Map<string, number>; // tên cung gốc → trọng số
  stars: Map<string, number>;   // tên sao (Hán) → trọng số
  siHua: Set<string>;           // 禄/权/科/忌 có trong các cung trọng tâm
  patterns: Pattern[];
  gender: 'male' | 'female';
  palaceOf: (baseName: string) => Palace | undefined;
}

function buildFocus(chart: ZiweiChart, question: string): Focus {
  const byBase = new Map(chart.palaces.map(p => [base(p.name), p]));
  const palaceOf = (b: string) => byBase.get(b);
  const palaces = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string, w: number) => m.set(k, Math.max(m.get(k) ?? 0, w));

  // Câu hỏi nhắc cung nào thì cung đó nặng nhất; khớp cả tên cung tiếng Việt viết trong prompt chủ đề.
  for (const [re, b] of QUESTION_PALACES) if (re.test(question)) bump(palaces, b, 3);
  for (const p of chart.palaces) if (question.includes(viPalace(p.name))) bump(palaces, base(p.name), 3);

  // Luôn có Mệnh + tam phương tứ chính của Mệnh + cung đại hạn hiện tại.
  bump(palaces, '命', 2);
  for (const b of ['财帛', '官禄', '迁移']) bump(palaces, b, 1);
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (dx) bump(palaces, base(dx.palaceName), 1);

  const stars = new Map<string, number>();
  const siHua = new Set<string>();
  for (const [b, w] of palaces) {
    const p = palaceOf(b);
    if (!p) continue;
    for (const s of p.stars) {
      bump(stars, s.name, w + (s.type === 'major' ? 1 : 0));
      if (s.siHua) siHua.add(s.siHua);
    }
    for (const s of p.borrowedStars ?? []) bump(stars, s, w); // vô chính diệu mượn sao cung đối
  }
  // Sao được nhắc tên trực tiếp trong câu hỏi.
  for (const p of chart.palaces) for (const s of p.stars) if (question.includes(viStar(s.name))) bump(stars, s.name, 4);

  return { palaces, stars, siHua, patterns: detectPatterns(chart), gender: chart.birthInfo.gender, palaceOf };
}

// ─── Chấm điểm ───────────────────────────────────────────────────────────────

const SIHUA_WORD: Record<string, string> = { '禄': '化禄', '权': '化权', '科': '化科', '忌': '化忌' };

function scoreText(text: string, f: Focus): number {
  let score = 0;
  for (const [s, w] of f.stars) if (text.includes(s)) score += w;
  for (const [b, w] of f.palaces) if (text.includes(b === '命' ? '命宫' : b)) score += w;
  for (const h of f.siHua) if (text.includes(SIHUA_WORD[h])) score += 1;
  for (const p of f.patterns) if (text.includes(p.name.replace(/格$/, ''))) score += 3;
  return score;
}

const ALL_PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '仆役', '官禄', '田宅', '福德', '父母'];

/** Câu nói về cung nằm ngoài trọng tâm (ví dụ hỏi sự nghiệp mà câu nói bàn chuyện vợ chồng) → trừ điểm. */
function offFocusPenalty(text: string, f: Focus): number {
  let n = 0;
  for (const p of ALL_PALACES) {
    const b = p === '命宫' ? '命' : p === '仆役' ? '交友' : p;
    if (!f.palaces.has(b) && text.includes(p)) n += 2;
  }
  return n;
}

function scoreNi(e: NiEntry, f: Focus): number {
  const heading = `${e.h2} ${e.h3}`;
  // Mục chỉ dành cho nam mệnh / nữ mệnh mà khác giới tính đương số → không áp dụng.
  if (heading.includes(f.gender === 'male' ? '女命' : '男命')) return 0;
  const inHeading = scoreText(heading, f);
  // Câu dài nhắc nhiều tên sao không có nghĩa là liên quan hơn → giới hạn phần điểm từ nội dung.
  const inQuote = Math.min(scoreText(e.quote, f), 4) - offFocusPenalty(e.quote, f);
  switch (e.book) {
    case '01-stars':
    case '02-palaces':
    case '03-patterns':
      // Mục phải thuộc về sao / cung / cách cục có trong lá số (khớp ở tiêu đề), câu nói khớp thêm thì cộng điểm.
      return inHeading > 0 ? Math.max(inHeading * 2 + inQuote, 0) : 0;
    case '04-sihua':
      return inHeading > 0 || e.h2.includes('总论') ? Math.max(1 + inHeading + inQuote, 0) : 0;
    case '05-illness':
      return f.palaces.get('疾厄') === 3 ? 2 + inQuote : 0;
    case '07-methodology':
      // Chỉ giữ nguyên tắc luận số, và chỉ khi câu nói chạm tới yếu tố trong lá số.
      return /批命|关键命理/.test(e.h2) && inQuote > 0 ? inQuote : 0;
    default:
      return 0; // bói toán, phong thủy, Dịch lý: không thuộc luận lá số
  }
}

function pick<T>(items: T[], score: (t: T) => number, render: (t: T) => string, budget: number): string[] {
  const ranked = items
    .map(t => ({ t, s: score(t) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const out: string[] = [];
  const seen = new Set<string>();
  let used = 0;
  for (const { t } of ranked) {
    const line = render(t);
    if (seen.has(line)) continue;
    if (used + line.length > budget) continue;
    seen.add(line);
    out.push(line);
    used += line.length;
  }
  return out;
}

const clip = (s: string) => (s.length > MAX_QUOTE_CHARS ? `${s.slice(0, MAX_QUOTE_CHARS)}…` : s);

// ─── Xuất ra prompt ──────────────────────────────────────────────────────────

/** Cách cục engine nhận diện — cố định theo lá số, đặt cạnh phần lá số để được cache. */
export function patternsBlock(chart: ZiweiChart): string {
  const patterns = detectPatterns(chart);
  if (!patterns.length) return 'Cách cục engine nhận diện: không có cách cục nào thành lập.';
  const lines = patterns.map(p => {
    const c = p.conditions;
    const extra = [
      c?.required?.length && `điều kiện: ${c.required.join('; ')}`,
      c?.bonus?.length && `gia điểm: ${c.bonus.join('; ')}`,
      c?.breaking?.length && `phá cách: ${c.breaking.join('; ')}`,
    ].filter(Boolean).join(' · ');
    return `- ${p.name} [${p.level}] · cung: ${p.palaces.map(viPalace).join(', ')} — ${p.description}${extra ? ` (${extra})` : ''}${p.source ? ` ${p.source}` : ''}`;
  });
  return `[Nguồn: Cách cục engine] Cách cục nhận diện trên lá số này (đã kiểm điều kiện, dùng làm căn cứ):\n${lines.join('\n')}`;
}

export interface KnowledgeStats {
  focusPalaces: Record<string, number>;
  dataset: { key: string | null; source: LookupSource; dims: DatasetDim[]; chars: number };
  niQuotes: number;
  niShortQuotes: number;
  classics: number;
  fuqiNotes: number;
  sectionChars: Record<string, number>;
  totalChars: number;
}

/** Tracing tùy chọn: mỗi nguồn là một span con của `parent`. */
interface TraceCtx { trace: Trace; parent: Observation }

/** Tư liệu tham khảo cho câu hỏi hiện tại, đã lọc theo lá số. Mỗi phần có nhãn [Nguồn: …] để AI trích đúng tên. */
export async function knowledgeBlock(chart: ZiweiChart, question: string, tr?: TraceCtx): Promise<{ text: string; stats: KnowledgeStats }> {
  const f = buildFocus(chart, question);
  const sections: { label: string; body: string }[] = [];
  const span = (name: string, input?: unknown) => tr?.trace.span(name, { parent: tr.parent, input });

  // ── Dataset v4
  const sDataset = span('knowledge.dataset-v4');
  const lookup = await lookupDataset(chart);
  const dims = datasetDims(f, question);
  let datasetChars = 0;
  const usedDims: DatasetDim[] = [];
  if (lookup.row) {
    const row = lookup.row;
    const parts = dims
      .filter(d => row.c[d])
      .map(d => {
        usedDims.push(d);
        // Hạ cấp tiêu đề markdown của dataset để không lẫn với nhãn [Nguồn: …] của các phần khác.
        const raw = row.c[d].replace(/^#{1,3} /gm, '#### ');
        const text = raw.length > BUDGET_DATASET_PER_DIM ? `${raw.slice(0, BUDGET_DATASET_PER_DIM)}…` : raw;
        return `### Chủ đề: ${DIM_LABEL[d]}\n${text}`;
      });
    if (parts.length) {
      const body = `## [Nguồn: Dataset v4] Luận giải soạn sẵn cho ĐÚNG lá số này (ưu tiên cao nhất sau lá số)\n` +
        `Đã hiệu đính theo nguyên văn Nghê Hải Hạ và Toàn Thư. Chữ độ sáng sao có thể khác lá số vì dataset dùng bảng độ sáng cũ — khi lệch thì theo lá số. ` +
        `Câu nhắc tuổi/năm trong đây tính theo bản mệnh, không theo tuổi hiện tại.\n\n${parts.join('\n\n')}`;
      sections.push({ label: 'dataset-v4', body });
      datasetChars = body.length;
    }
  }
  if (!lookup.row) {
    // Không có dataset → cảnh báo rõ ràng để AI không tự suy luận thay thế.
    const reason =
      lookup.source === 'out-of-range'  ? `năm sinh nằm ngoài phạm vi dataset (1950–2026)` :
      lookup.source === 'no-year-file'  ? `file dataset năm này chưa được tải về` :
      lookup.source === 'error'         ? `lỗi đọc dataset` :
                                          `không có dữ liệu (${lookup.source})`;
    sections.push({
      label: 'dataset-warning',
      body: `## [CẢNH BÁO: Không có Dataset v4]\n${reason}.\n` +
        `QUAN TRỌNG: Vì không có dataset, AI KHÔNG ĐƯỢC tự suy luận hay bịa nhận định để bù đắp. ` +
        `Chỉ dùng những gì có trong lá số (sao, cung, tứ hóa, cách cục engine) và các tư liệu bên dưới. ` +
        `Với bất kỳ điểm nào không có cơ sở rõ ràng từ lá số hoặc tư liệu, hãy nói thẳng "không đủ cơ sở để nhận định".`,
    });
  }
  sDataset?.end({
    output: { hit: !!lookup.row, chars: datasetChars },
    metadata: { key: lookup.key, source: lookup.source, wantedDims: dims, usedDims },
    level: lookup.source === 'error' ? 'ERROR' : lookup.row ? 'DEFAULT' : 'WARNING',
    statusMessage: lookup.row ? undefined : `không có dữ liệu dataset (${lookup.source})`,
  });

  // ── Nghê Hải Hạ
  const sNi = span('knowledge.ni-haixia');
  const ni = pick(niEntries(), e => scoreNi(e, f),
    e => `- 「${clip(e.quote)}」 — ${e.h2}${e.h3 ? ` › ${e.h3}` : ''} (Thiên Kỷ p${e.part} ${e.t_hms})`, BUDGET_NI);
  const shortNi = TIANJI_QUOTES
    .filter(q => q.topic === '紫微斗数' && scoreText(q.text, f) > 0)
    .map(q => `- 「${q.text}」 — ngữ lục`);
  if (ni.length || shortNi.length) sections.push({ label: 'ni-haixia', body: `## [Nguồn: Nghê Hải Hạ, Thiên Kỷ] Nguyên văn, mỗi câu có tập và mốc thời gian\n${[...ni, ...shortNi].join('\n')}` });
  sNi?.end({ output: { quotes: ni.length, shortQuotes: shortNi.length }, metadata: { pool: niEntries().length } });

  // ── Cổ thư
  const sClassics = span('knowledge.classics');
  const classics = pick(classicParagraphs(), p => scoreText(`${p.chapter} ${p.text}`, f) - offFocusPenalty(p.chapter, f),
    p => `- ${p.text} —《${p.book}·${p.chapter}》`, BUDGET_CLASSICS);
  if (classics.length) sections.push({ label: 'classics', body: `## [Nguồn: Cổ thư] Ghi tên sách cụ thể khi trích: Toàn Thư, Toàn Tập hoặc Cốt Tủy Phú\n${classics.join('\n')}` });
  sClassics?.end({ output: { paragraphs: classics.length }, metadata: { pool: classicParagraphs().length } });

  // ── Tư liệu Phu Thê: chỉ khi câu hỏi về tình cảm / hôn nhân.
  const fuqi = f.palaceOf('夫妻');
  const lines: string[] = [];
  if (f.palaces.get('夫妻') === 3 && fuqi) {
    for (const s of fuqi.stars) {
      const k = STAR_IN_FUQI_GU[s.name];
      if (k) lines.push(`- ${s.name} tại Phu Thê: ${k.summary}. Tốt: ${k.good}. Xấu: ${k.bad}. Phối ngẫu: ${k.spouse_traits}. Thời điểm: ${k.timing}.`);
      const m = MARRIAGE_STARS_BRIEF[s.name];
      if (m) lines.push(`- ${s.name}: ${m}`);
      if (s.siHua) {
        const h = SIHUA_IN_FUQI_GU[SIHUA_WORD[s.siHua] as keyof typeof SIHUA_IN_FUQI_GU];
        if (h) lines.push(`- ${s.name} ${SIHUA_WORD[s.siHua]} tại Phu Thê: ${h}`);
      }
    }
    if (lines.length) sections.push({ label: 'fuqi-app', body: `## [Nguồn: Tư liệu Phu Thê của app] Ghi chú tổng hợp, ưu tiên thấp nhất — chưa hiệu đính theo nguyên văn\n${lines.join('\n')}` });
  }

  const text = sections.length
    ? `Tư liệu tham khảo (chữ Hán, đã lọc theo lá số này; dịch sang tiếng Việt khi dùng; ghi nguồn bằng đúng tên trong nhãn [Nguồn: …], không tự đặt tên khác):\n\n${sections.map(x => x.body).join('\n\n')}`
    : '';
  const stats: KnowledgeStats = {
    focusPalaces: Object.fromEntries([...f.palaces].map(([b, w]) => [viPalace(b), w])),
    dataset: { key: lookup.key, source: lookup.source, dims: usedDims, chars: datasetChars },
    niQuotes: ni.length,
    niShortQuotes: shortNi.length,
    classics: classics.length,
    fuqiNotes: lines.length,
    sectionChars: Object.fromEntries(sections.map(x => [x.label, x.body.length])),
    totalChars: text.length,
  };
  return { text, stats };
}
