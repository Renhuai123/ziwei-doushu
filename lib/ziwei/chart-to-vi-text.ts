import type { ZiweiChart } from './types';
import { BRANCHES_VI, viGanzhi, viPalace, viStar, viSiHua, viBrightness, viTerm } from '@/lib/i18n/vi';

/** Mô tả lá số bằng văn bản tiếng Việt để đưa vào prompt cho Claude. */
export function chartToVietnameseText(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const l = chart.lunarInfo;
  const lines: string[] = [];

  lines.push(`Đương số: ${b.name || '(không tên)'} · ${b.gender === 'male' ? 'Nam' : 'Nữ'}`);
  lines.push(`Ngày lập lá số (dương lịch): ${b.day}/${b.month}/${b.year} · giờ ${BRANCHES_VI[b.hour]}`);
  if (b.city || b.province) lines.push(`Nơi sinh: ${[b.city, b.province].filter(Boolean).join(', ')}`);
  lines.push(`Âm lịch: ngày ${l.lunarDay} tháng ${l.isLeapMonth ? 'nhuận ' : ''}${Math.abs(l.lunarMonth)} năm ${l.lunarYear}`);
  lines.push(`Âm dương: ${viTerm(chart.yinYangGender ?? '')} · Cục: ${viTerm(chart.wuxingJuName)}`);
  lines.push(`Mệnh an tại ${BRANCHES_VI[chart.mingGongBranch]} · Thân an tại ${BRANCHES_VI[chart.shenGongBranch]}`);
  if (chart.mingZhu) lines.push(`Mệnh chủ: ${viStar(chart.mingZhu)} · Thân chủ: ${chart.shenZhu ? viStar(chart.shenZhu) : '?'}`);
  lines.push(`Tuổi hiện tại (tuổi mụ): ${chart.currentAge}`);

  const dx = chart.daXians[chart.currentDaXianIndex];
  if (dx) lines.push(`Đại hạn hiện tại: ${dx.startAge}–${dx.endAge} tuổi, tại cung ${viPalace(dx.palaceName)}`);

  lines.push('', '12 cung (can chi · tên cung · đại hạn · sao):');
  const ordered = [...chart.palaces].sort((a, b) =>
    ((chart.mingGongBranch - a.branch + 12) % 12) - ((chart.mingGongBranch - b.branch + 12) % 12));
  for (const p of ordered) {
    const fmt = (types: string[]) => p.stars
      .filter(s => types.includes(s.type))
      .map(s => `${viStar(s.name)}${s.brightnessRaw ? ` (${viBrightness(s.brightnessRaw)})` : ''}${s.siHua ? ` Hóa ${viSiHua(s.siHua)}` : ''}`)
      .join(', ');
    const major = fmt(['major']) || `vô chính diệu${p.borrowedStars?.length ? ` (mượn ${p.borrowedStars.map(viStar).join(', ')} từ cung đối)` : ''}`;
    const tags = [p.isMingGong && 'MỆNH', p.isShenGong && 'THÂN', p.isCurrentDaXian && 'ĐẠI HẠN HIỆN TẠI'].filter(Boolean).join(', ');
    lines.push(
      `- ${viGanzhi(p.stem, p.branch)} · ${viPalace(p.name)}${tags ? ` [${tags}]` : ''}` +
      `${p.daXianAge ? ` · ${p.daXianAge[0]}–${p.daXianAge[1]}` : ''}` +
      ` · Chính tinh: ${major}` +
      `${fmt(['lucky', 'minor']) ? ` · Phụ/cát tinh: ${fmt(['lucky', 'minor'])}` : ''}` +
      `${fmt(['sha']) ? ` · Sát tinh: ${fmt(['sha'])}` : ''}`,
    );
  }
  return lines.join('\n');
}
