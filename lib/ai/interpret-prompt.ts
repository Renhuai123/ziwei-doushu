import 'server-only';
import { BRANCHES, SI_HUA_TABLE, STEMS } from '@/lib/ziwei/constants';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { boshiShenName, jiangQianShenName, suiQianShenName } from '@/lib/ziwei/shier-shen';
import { getDaXianIndexForYear } from '@/lib/ziwei/yunxian-context';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';

/**
 * System prompt của "thầy Tử Vi" —— dùng chung cho mọi lượt hỏi trong /api/interpret.
 *
 * Nguyên tắc viết prompt (đừng rút gọn tùy tiện):
 *   · Nêu rõ thứ tự đọc lá số (Cục → Mệnh/Thân → chính tinh → tứ hóa → tam phương →
 *     phụ/sát tinh → đại hạn/lưu niên) để model không đọc sao rời rạc.
 *   · Ép mỗi kết luận phải có căn cứ trên lá số, tránh phán bừa.
 *   · Ép định dạng **【...】** vì components/InsightPanel.tsx chỉ parse đúng dạng này.
 *   · Giọng điềm đạm, không hù dọa, không cam kết y tế/tài chính.
 */
export const INTERPRET_SYSTEM_PROMPT = `Bạn là một bậc thầy Tử Vi Đẩu Số (紫微斗數) đã hành nghề hơn ba mươi năm, thuộc hệ Nghê Hải Hạ (倪海厦《天紀·紫微斗數》), thông hiểu cả Nam phái lẫn Bắc phái, thuộc lòng các bộ cổ thư như 《紫微斗數全書》《紫微斗數全集》《骨髓賦》, tinh thông Tứ Hóa phi tinh, cách cục, vòng Thái Tuế, Lộc Tồn – Kình Dương – Đà La, Triệt Không – Tuần Không.

Bạn đang tư vấn trực tiếp cho đương số. Dữ liệu lá số do hệ thống an sao cung cấp; bạn KHÔNG tự an sao lại, chỉ luận giải trên đúng dữ liệu đó.

## 1. Nguyên tắc nền tảng
- Chỉ dùng sao, cung, tứ hóa có trong dữ liệu. Không bịa thêm sao, không đổi vị trí, không suy ra sao không được cung cấp.
- Nếu dữ liệu thiếu hoặc mơ hồ (giờ sinh chưa rõ, thiếu lưu niên, cung trống...), nói rõ mức độ chắc chắn thay vì lấp liếm.
- Mỗi kết luận phải có căn cứ: nêu 1–2 sao hoặc cung làm chứng cứ, rồi mới diễn giải ý nghĩa.
- Phân biệt "chất liệu" (Mệnh, Thân, cách cục) với "thời vận" (đại hạn, lưu niên). Không lấy một năm xấu để phủ định cả đời, không lấy một sao để kết luận toàn bộ con người.
- Trước khi luận phải đọc các tầng: Âm Dương thuận lý/nghịch lý, Cục sinh Mệnh hay Mệnh sinh Cục, độ sáng miếu/vượng/lợi/hãm của chính tinh, có Lộc Tồn hội chiếu hay không, thế Kình Đà giáp Kỵ, Không Kiếp tọa thủ hay giáp cung, Triệt/Tuần án ngữ.

## 2. Trình tự luận giải
1. Tổng quan cục diện: Cục, Âm Dương, Mệnh chủ/Thân chủ, Mệnh – Thân đồng cung hay phân ly.
2. Cách cục chính của Mệnh – Thân: nhận diện cách cục (Tử Phủ, Sát Phá Lang, Cơ Nguyệt Đồng Lương, Phủ Tướng, Cự Nhật, Nhật Nguyệt...), nói rõ là thành cách hay phá cách, sao nào phá.
3. Chính tinh ở Mệnh: độ sáng + tứ hóa sinh niên + tự hóa, rồi mới đến phụ tinh (lục cát, lục sát, tạp diệu).
4. Tam phương tứ chính (Mệnh – Tài Bạch – Quan Lộc – Thiên Di) và cung xung chiếu: đọc sự liên động, không đọc rời rạc từng cung.
5. Vòng Thái Tuế (岁建 và mười một thần còn lại), Lộc Tồn / Kình Dương / Đà La / Thiên Mã, Triệt Không / Tuần Không / Địa Không / Địa Kiếp.
6. Đại hạn hiện tại và lưu niên: cung đại hạn, tứ hóa đại hạn, lưu niên mệnh cung, tứ hóa lưu niên, các cung bị xung, thời điểm đáng chú ý trong năm.

## 3. Cách trả lời
- Câu đầu tiên đi thẳng vào câu hỏi: một câu kết luận ngắn, rõ ràng.
- Sau đó mới triển khai căn cứ và các tầng ảnh hưởng. Câu hỏi hẹp (một cung, một hóa, một năm) thì không lan sang toàn bộ lá số.
- Đưa lời khuyên có thể hành động: thời điểm nên tiến hay lùi, kiểu môi trường phù hợp, cách chọn đối tác, cách phòng ngừa. "Hóa giải" nằm ở hành vi và nhận thức, không phải bùa chú.
- Nêu cả mặt thuận và mặt cần đề phòng. Không tô hồng, không hù dọa.

## 4. Văn phong
- Điềm đạm, từ tốn, sắc sảo, như một thầy già ngồi trà đàm: xưng "tôi", gọi người nghe là "bạn" hoặc "đương số".
- Câu ngắn, giàu hình ảnh nhưng không sáo rỗng. Tránh từ ngữ tuyệt đối: "chắc chắn", "nhất định", "sẽ chết", "phá sản".
- Không nhắc đến AI, mô hình, prompt hay dữ liệu hệ thống.

## 5. Định dạng bắt buộc
- Chia 3–6 mục. Mỗi tiêu đề nằm riêng một dòng, đúng dạng: **【Tên mục】**
- Trong mục: đoạn ngắn 2–4 câu hoặc gạch đầu dòng "- "; in đậm kết luận then chốt bằng **...**.
- Không dùng dấu #, không bảng, không công thức, không trích lại toàn bộ lá số, không lặp lại câu hỏi.
- Độ dài 600–1000 từ. Trả lời bằng ngôn ngữ của câu hỏi mới nhất (mặc định tiếng Việt). Tên sao, tên cung và thuật ngữ giữ nguyên chữ Hán, có thể kèm giải thích ngắn trong ngoặc khi cần.

## 6. Giới hạn
- Tử vi là công cụ chiêm nghiệm, không phải chân lý tuyệt đối; nhắc điều này một lần khi phù hợp, không lặp lại.
- Không chẩn đoán bệnh, không kê đơn, không cam kết lợi nhuận đầu tư; chỉ nêu xu hướng và khuyên đi khám hoặc tham vấn chuyên môn khi cần.
- Không bàn chuyện chết chóc, bệnh nặng, ly tán theo kiểu định mệnh; quy về phòng ngừa và chuẩn bị.
- Nếu câu hỏi nằm ngoài tử vi, trả lời ngắn rồi nhẹ nhàng kéo về lá số.`;

const BRANCH_PINYIN = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
  'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
];

const SHICHEN_LABEL = [
  'Tý (23:00–01:00)', 'Sửu (01:00–03:00)', 'Dần (03:00–05:00)', 'Mão (05:00–07:00)',
  'Thìn (07:00–09:00)', 'Tỵ (09:00–11:00)', 'Ngọ (11:00–13:00)', 'Mùi (13:00–15:00)',
  'Thân (15:00–17:00)', 'Dậu (17:00–19:00)', 'Tuất (19:00–21:00)', 'Hợi (21:00–23:00)',
];

function branchLabel(branch: number): string {
  const b = ((branch % 12) + 12) % 12;
  return `${BRANCHES[b]} (${BRANCH_PINYIN[b]})`;
}

function stemLabel(stem: number | undefined): string {
  if (typeof stem !== 'number' || !STEMS[stem]) return '';
  return STEMS[stem];
}

function formatStar(star: Star): string {
  const brightness = star.brightnessRaw ? `(${star.brightnessRaw})` : '';
  const siHua = star.siHua ? `化${star.siHua}` : '';
  return `${star.name}${brightness}${siHua}`;
}

function formatStarGroup(label: string, stars: Star[]): string {
  return stars.length > 0 ? `${label}: ${stars.map(formatStar).join(' ')}` : '';
}

function formatPalace(palace: Palace, chart: ZiweiChart): string {
  const branch = branchLabel(palace.branch);
  const ganzhi = `${stemLabel(palace.stem)}${BRANCHES[palace.branch] ?? ''}`;
  const flags = [
    palace.isMingGong ? '命宫' : '',
    palace.isShenGong ? '身宫' : '',
    palace.isCurrentDaXian ? 'đại hạn hiện tại' : '',
  ].filter(Boolean);

  const groups = [
    formatStarGroup('主星', palace.stars.filter((s) => s.type === 'major')),
    formatStarGroup('辅星', palace.stars.filter((s) => s.type === 'minor')),
    formatStarGroup('吉星', palace.stars.filter((s) => s.type === 'lucky')),
    formatStarGroup('煞星', palace.stars.filter((s) => s.type === 'sha')),
  ].filter(Boolean);

  // 空宫借对宫：不写出借来的星，模型会误以为它们真的坐守本宫
  if (palace.stars.every((s) => s.type !== 'major') && palace.borrowedStars?.length) {
    const from = palace.borrowedFromName ?? branchLabel((palace.branch + 6) % 12);
    groups.unshift(`主星: 空宫，借对宫 ${from} → ${palace.borrowedStars.join(' ')}`);
  }

  const selfSihua = palace.selfSihua?.length
    ? `自化: ${palace.selfSihua.map((s) => `${s.starName}化${s.siHua}`).join(' ')}`
    : '';
  const shenSha = [
    suiQianShenName(chart.lunarInfo.yearBranch, palace.branch),
    jiangQianShenName(chart.lunarInfo.yearBranch, palace.branch),
    boshiShenName(chart.lunarInfo.yearStem, chart.birthInfo.gender, palace.branch),
  ].join(' / ');

  const head = [
    `${branch} ${ganzhi} ${palace.name}`,
    palace.daXianAge ? `đại hạn ${palace.daXianAge[0]}–${palace.daXianAge[1]}` : '',
    flags.length ? `[${flags.join(', ')}]` : '',
  ].filter(Boolean).join(' | ');

  return `- ${head}\n    ${[...groups, selfSihua, `神煞: ${shenSha}`].filter(Boolean).join(' | ')}`;
}

function formatDaXians(chart: ZiweiChart): string {
  const currentIndex = chart.currentDaXianIndex;
  return chart.daXians
    .map((dx, index) => {
      const palace = chart.palaces.find((p) => p.branch === dx.palaceBranch);
      const stem = dx.stemName ?? stemLabel(palace?.stem);
      const siHua = dx.siHua
        ? `四化: ${dx.siHua.lu}禄 ${dx.siHua.quan}权 ${dx.siHua.ke}科 ${dx.siHua.ji}忌`
        : '';
      const mark = index === currentIndex ? ' ← hiện tại' : '';
      return `- ${dx.startAge}–${dx.endAge} tuổi: ${dx.palaceName} (${stem}${BRANCHES[dx.palaceBranch] ?? ''}) ${siHua}${mark}`;
    })
    .join('\n');
}

function formatPatterns(chart: ZiweiChart): string {
  try {
    const patterns = detectPatterns(chart).slice(0, 8);
    if (patterns.length === 0) return '';
    return patterns
      .map((p) => `- ${p.name} [${p.level}] ${p.description} (cung: ${p.palaces.join('、') || '—'})`)
      .join('\n');
  } catch {
    // 格局识别只是锦上添花，绝不能让接口 500
    return '';
  }
}

/** Tuổi mụ theo năm hiện tại (âm lịch năm sinh → năm đang xét). */
export function nominalAge(chart: ZiweiChart, year: number): number {
  return Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
}

/**
 * Chuyển ZiweiChart thành khối văn bản gọn cho model đọc.
 * Không gửi JSON thô: JSON tốn token và model hay bỏ sót quan hệ tam phương.
 */
export function buildChartContext(chart: ZiweiChart, now: Date = new Date()): string {
  const { birthInfo, lunarInfo } = chart;
  const lunarMonth = `${Math.abs(lunarInfo.lunarMonth)}${lunarInfo.isLeapMonth ? ' (nhuận)' : ''}`;
  const currentYear = now.getFullYear();
  const yearStem = ((currentYear - 4) % 10 + 10) % 10;
  const yearBranch = ((currentYear - 4) % 12 + 12) % 12;
  const yearPalace = chart.palaces.find((p) => p.branch === yearBranch);
  const yearSiHua = SI_HUA_TABLE[yearStem];
  const age = nominalAge(chart, currentYear);
  const yearDaXianIndex = getDaXianIndexForYear(chart, currentYear);
  const daXianIndex = chart.daXians[yearDaXianIndex] ? yearDaXianIndex : chart.currentDaXianIndex;
  const daXian = chart.daXians[daXianIndex];

  const lines: string[] = [
    '=== DỮ LIỆU LÁ SỐ (do engine an sao cung cấp, không cần an lại) ===',
    `[Đương số] ${birthInfo.gender === 'male' ? 'Nam' : 'Nữ'} · ${chart.yinYangGender ?? '—'} · ${chart.wuxingJuName}`,
    `[Dương lịch] ${birthInfo.year}-${String(birthInfo.month).padStart(2, '0')}-${String(birthInfo.day).padStart(2, '0')} · ${SHICHEN_LABEL[birthInfo.hour] ?? `giờ thứ ${birthInfo.hour}`}${birthInfo.calendarZone === 'vn' ? ' · âm lịch Việt Nam (UTC+7)' : ''}`,
    `[Âm lịch] ${STEMS[lunarInfo.yearStem]}${BRANCHES[lunarInfo.yearBranch]} niên · tháng ${lunarMonth} · ngày ${lunarInfo.lunarDay}`,
    lunarInfo.fourPillars ? `[Tứ trụ] ${lunarInfo.fourPillars.join(' ')}` : '',
    `[Mệnh chủ] ${chart.mingZhu ?? '—'} · [Thân chủ] ${chart.shenZhu ?? '—'}`,
    `[Mệnh cung] ${branchLabel(chart.mingGongBranch)} · [Thân cung] ${branchLabel(chart.shenGongBranch)}`,
    '',
    '[Mười hai cung — thứ tự địa chi; đại hạn tính theo tuổi mụ]',
    ...chart.palaces.map((palace) => formatPalace(palace, chart)),
    '',
    '[Đại hạn — 四化 theo can cung đại hạn]',
    formatDaXians(chart),
    '',
    `[Vận hiện tại] Dương lịch ${currentYear} (${STEMS[yearStem]}${BRANCHES[yearBranch]}) · tuổi mụ ${age}`,
    daXian
      ? `Đại hạn ${daXian.startAge}–${daXian.endAge} tuổi tại ${daXian.palaceName} (${branchLabel(daXian.palaceBranch)})`
      : 'Đại hạn: chưa xác định',
    yearPalace
      ? `Lưu niên mệnh cung (theo chi năm) tại ${branchLabel(yearBranch)} — ${yearPalace.name}; chính tinh: ${yearPalace.stars.filter((s) => s.type === 'major').map(formatStar).join(' ') || '空宫'}`
      : '',
    yearSiHua
      ? `Lưu niên tứ hóa: ${yearSiHua[0]}禄 ${yearSiHua[1]}权 ${yearSiHua[2]}科 ${yearSiHua[3]}忌`
      : '',
  ].filter((line) => line !== '');

  const patterns = formatPatterns(chart);
  if (patterns) {
    lines.push('', '[Cách cục engine nhận diện — chỉ là gợi ý, hãy kiểm chứng trên dữ liệu]', patterns);
  }

  if (birthInfo.origInput) {
    const o = birthInfo.origInput;
    lines.push(
      '',
      `[Ghi chú] Giờ nhập ban đầu ${o.year}-${o.month}-${o.day} ${String(o.clockHour).padStart(2, '0')}:${String(o.clockMinute).padStart(2, '0')}; lá số đã quy đổi theo quy tắc giờ Tý / chân thái dương thời.`,
    );
  }

  return lines.join('\n');
}
