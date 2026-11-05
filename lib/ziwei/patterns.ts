/**
 * 紫微斗数格局识别（v2 严格化版本）
 *
 * 设计原则：
 * 1. 古书条件优先：每个格局列出"必须 / 加分 / 破格"三层结构，出处可考
 * 2. 倪师立场：不使用宫干自化、大限四化、来因宫等飞星派工具
 * 3. 庙旺利陷：用 brightness 字段（bright=庙旺、normal=平、dim=陷）
 * 4. 三方四正会照：命宫 + 财帛 + 官禄 + 迁移
 * 5. 夹宫：命宫前后两宫
 *
 * 主要古籍出处：
 *  - 《紫微斗数全集》（陈抟祖师传，明代刊本）
 *  - 《紫微斗数全书》（罗洪先编，明代刊本）
 *  - 《骨髓赋》《女命骨髓赋》《十二宫诸星得地合格诀》
 *  - 倪师《天纪》紫微斗数讲义
 */

import 'server-only';
import type { ZiweiChart, Palace, Star, SiHua } from './types';
import { starName, branchName } from './display-vi';

// ────────────────── 类型 ──────────────────
export interface PatternCondition {
  required: string[];   // 必须满足条件（已通过的）
  bonus?: string[];     // 加分项（已触发）
  breaking?: string[];  // 破格警示（已触发）
}

export interface Pattern {
  name: string;
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  palaces: string[];                 // 涉及宫位
  conditions?: PatternCondition;     // 成立条件分层（v2 新增）
  source?: string;                   // 古籍出处（v2 新增）
}

// ────────────────── 常量 ──────────────────
const SHA_NAMES = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
const SHA_HARD = ['擎羊', '陀罗', '火星', '铃星'];   // 四煞
const SHA_KONG = ['地空', '地劫'];                  // 空劫
const ZUO_YOU = ['左辅', '右弼'];
const CHANG_QU = ['文昌', '文曲'];
const KUI_YUE = ['天魁', '天钺'];

// ────────────────── 辅助函数 ──────────────────
function getMajorStarNames(palace: Palace): string[] {
  return palace.stars.filter(s => s.type === 'major').map(s => s.name);
}
function findStar(palace: Palace, name: string): Star | undefined {
  return palace.stars.find(s => s.name === name);
}
function hasStar(palace: Palace, name: string): boolean {
  return palace.stars.some(s => s.name === name);
}
function findStarPalace(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.stars.some(s => s.name === name));
}
function getPalaceByBranch(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === ((branch % 12) + 12) % 12);
}
function shaCountInPalace(palace: Palace, list: string[] = SHA_HARD): number {
  return palace.stars.filter(s => list.includes(s.name)).length;
}
function hasShaInPalace(palace: Palace, list: string[] = SHA_NAMES): boolean {
  return palace.stars.some(s => list.includes(s.name));
}
function getSanFangPalaces(chart: ZiweiChart): Palace[] {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter(p => branches.includes(p.branch));
}
function isInSanFang(chart: ZiweiChart, branch: number): boolean {
  const m = chart.mingGongBranch;
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}
function getDuiGong(chart: ZiweiChart, branch: number): Palace | undefined {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}
function getJiaPalaces(chart: ZiweiChart, branch: number): { prev?: Palace; next?: Palace } {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12),
  };
}
function sanFangAllStars(chart: ZiweiChart): Set<string> {
  return new Set(getSanFangPalaces(chart).flatMap(p => p.stars.map(s => s.name)));
}
function sanFangShaCount(chart: ZiweiChart, list: string[] = SHA_HARD): number {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}
function isBright(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'bright';
}
function isDim(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'dim';
}
function getStarSiHua(palace: Palace, starName: string): Star['siHua'] | undefined {
  return findStar(palace, starName)?.siHua;
}
// 四化挂在星曜的 siHua 字段上，不是独立星名——不能用 hasStar / sanFangAllStars 查「化禄」
function palaceHasSiHua(palace: Palace, hua: SiHua): boolean {
  return palace.stars.some(s => s.siHua === hua);
}
function sanFangHasSiHua(chart: ZiweiChart, hua: SiHua): boolean {
  return getSanFangPalaces(chart).some(p => palaceHasSiHua(p, hua));
}
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ────────────────── 正格识别器 ──────────────────

/** 君臣庆会：紫微入命，左辅右弼同会（同宫或三方） */
function detectJunChenQingHui(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微')) return;
  const sanFangSet = sanFangAllStars(chart);
  const hasZuo = sanFangSet.has('左辅');
  const hasYou = sanFangSet.has('右弼');
  if (!hasZuo || !hasYou) return;

  const required = ['Tử Vi nhập Mệnh', 'Tả Phụ Hữu Bật đồng hội Tam Phương Tứ Chính'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Lại hội Văn Xương hoặc Văn Khúc');
  if (sanFangSet.has('天魁') || sanFangSet.has('天钺')) bonus.push('Khôi Việt quý nhân gia chiếu');
  if (getStarSiHua(ming, '紫微') === '权') bonus.push('Tử Vi Hóa Quyền');
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push('Địa Không Địa Kiếp song giáp hội chiếu (Tử Vi kỵ Không Kiếp)');

  patterns.push({
    name: 'Quân Thần Khánh Hội',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Tử Vi nhập Mệnh, Tả Phụ Hữu Bật đồng hội, bậc đế vương được hiền thần phò tá, chủ đại phú đại quý, mệnh thống lĩnh. Trọn đời quý nhân không dứt, hợp tiến thân nơi chính trường, thương trường địa vị cao hoặc làm lãnh đạo liên ngành.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội Cách》',
  });
}

/** 紫府同宫：紫微+天府于命宫（限寅、申宫） */
function detectZiFu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const ziwei = findStarPalace(chart, '紫微');
  const tianfu = findStarPalace(chart, '天府');
  if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;

  const inMing = ziwei.branch === chart.mingGongBranch;
  const required = inMing
    ? ['Tử Vi Thiên Phủ đồng nhập Cung Mệnh']
    : ['Tử Vi Thiên Phủ đồng cung (không ở Cung Mệnh, hội chiếu giảm lực)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phụ Hữu Bật đồng hội');
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Lại hội Xương Khúc');
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push('Cung Tử Phủ tọa Không Kiếp (phá quý khí của Tử Phủ)');
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push('Cung Tử Phủ gặp song sát đồng tọa');

  patterns.push({
    name: 'Tử Phủ Đồng Cung',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    description: inMing
      ? 'Tử Vi Thiên Phủ đồng nhập Cung Mệnh, Đế Tướng cùng lâm, mệnh tôn quý. Chủ phẩm hạnh đoan chính, cơm áo không lo, có tài lãnh đạo, hợp đảm nhận trọng trách. Cần Tả Hữu Phụ Bật phối hợp mới thành đại cách hoàn chỉnh.'
      : 'Tử Vi Thiên Phủ đồng cung nhưng không tọa Mệnh, chủ một đời có quý nhân quý khí nương tựa, song bản thân chưa chắc đại phú quý, cần xét cát sát hội chiếu mà định.',
    palaces: [ziwei.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tử Phủ Đồng Cung Cách》',
  });
}

/** 府相朝垣：天府、天相分别坐守命宫的三方四正 */
function detectFuXiangChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tianfu = findStarPalace(chart, '天府');
  const tianxiang = findStarPalace(chart, '天相');
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
  if (tianfu.branch === chart.mingGongBranch && tianxiang.branch === chart.mingGongBranch) return;
  if (tianfu.branch === tianxiang.branch) return;

  const required = ['Thiên Phủ tọa Tam Phương Cung Mệnh', 'Thiên Tướng tọa Tam Phương Cung Mệnh', 'Hai sao không đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(ming, '禄存') || palaceHasSiHua(ming, '禄')) bonus.push('Cung Mệnh kiến Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Lại hội Tả Phụ');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh tọa sát tinh');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Tam Phương Tứ Chính quá nhiều sát tinh');

  patterns.push({
    name: 'Phủ Tướng Triều Viên',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thiên Phủ Thiên Tướng phân thủ Tam Phương Tứ Chính của Cung Mệnh, văn võ song toàn, quyền ấn cùng sáng, chủ một đời cơm áo dồi dào, địa vị tôn cao. Cổ thư viết "Phủ Tướng triều viên thiên chung thực lộc", thường gặp ở giới chính trị, nhà quản lý doanh nghiệp.',
    palaces: [tianfu.name, tianxiang.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phủ Tướng Triều Viên Cách》',
  });
}

/** 阳梁昌禄：太阳+天梁+文昌+禄存四星会命宫，大贵格 */
function detectYangLiangChangLu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('太阳') || !sanFangSet.has('天梁') ||
      !sanFangSet.has('文昌') || !sanFangSet.has('禄存')) return;

  const sun = findStarPalace(chart, '太阳')!;
  const liang = findStarPalace(chart, '天梁')!;
  const required = [
    'Thái Dương hội Tam Phương Cung Mệnh',
    'Thiên Lương hội Tam Phương Cung Mệnh',
    'Văn Xương hội Tam Phương Cung Mệnh',
    'Lộc Tồn hội Tam Phương Cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sun, '太阳')) bonus.push('Thái Dương miếu vượng');
  if (isBright(liang, '天梁')) bonus.push('Thiên Lương miếu vượng');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Lại hội Hóa Khoa');
  if (isDim(sun, '太阳')) breaking.push('Thái Dương lạc hãm (Dương Lương thất huy)');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Tam Phương sát tinh nặng');

  patterns.push({
    name: 'Dương Lương Xương Lộc',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Bốn sao Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn cùng hội Tam Phương Cung Mệnh, mệnh danh là "Khoa Cử Chi Tinh", chủ thanh quý hiển đạt, vận thi cử cực tốt, hợp đi theo con đường học thuật, văn giáo, nghiên cứu, chứng chỉ chuyên môn, trọn đời công danh dễ thành.',
    palaces: [sun.name, liang.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Dương Lương Xương Lộc Cách》',
  });
}

/** 火贪格 / 铃贪格：贪狼+火星 或 贪狼+铃星 同宫或会照 */
function detectHuoTanLingTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tan = findStarPalace(chart, '贪狼');
  if (!tan) return;
  const huo = findStarPalace(chart, '火星');
  const ling = findStarPalace(chart, '铃星');

  for (const [shaName, shaPalace] of [['火星', huo], ['铃星', ling]] as const) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.branch === shaPalace.branch ||
      (tan.branch + 4) % 12 === shaPalace.branch ||
      (tan.branch + 8) % 12 === shaPalace.branch ||
      (tan.branch + 6) % 12 === shaPalace.branch;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.branch)) continue;

    const required = [`Tham Lang ${tan.branch === shaPalace.branch ? 'đồng cung' : 'hội chiếu'} ${starName(shaName)}`, 'Tham Lang hội chiếu Tam Phương Cung Mệnh'];
    const bonus: string[] = [];
    const breaking: string[] = [];
    if (isBright(tan, '贪狼')) bonus.push('Tham Lang miếu vượng');
    if (getStarSiHua(tan, '贪狼') === '禄' || getStarSiHua(tan, '贪狼') === '权') bonus.push('Tham Lang Hóa Lộc/Hóa Quyền');
    if (hasShaInPalace(tan, ['擎羊', '陀罗'])) breaking.push('Cung Tham Lang lại gặp Dương Đà (phá sức bộc phát hoạnh tài)');
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push('Tham Lang ngộ Không Kiếp (tiền đến rồi lại đi)');

    patterns.push({
      name: shaName === '火星' ? 'Hỏa Tham Cách' : 'Linh Tham Cách',
      level: breaking.length ? 'good' : 'excellent',
      description: `Tham Lang gặp ${starName(shaName)} ${tan.branch === shaPalace.branch ? 'đồng cung' : 'Tam Phương hội chiếu'}, chủ bộc phát hoạnh tài, cơ hội đến bất ngờ. Cổ thư viết "Tham Lang ngộ Hỏa Linh, tất phát hoạnh tài", nhưng đến nhanh đi cũng nhanh, nên biết điểm dừng đúng lúc.${breaking.length ? ' Lá số này đã chạm điều kiện phá cách, sức phát giảm sút.' : ''}`,
      palaces: [tan.name, shaPalace.name],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Đẩu Số Cốt Tủy Phú》',
    });
  }
}

/** 武贪格：武曲+贪狼 同宫（丑、未） 或 对照 */
function detectWuTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const tan = findStarPalace(chart, '贪狼');
  if (!wu || !tan) return;
  const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;

  const required = [
    wu.branch === tan.branch ? 'Vũ Khúc Tham Lang đồng cung (Sửu/Mùi)' : 'Vũ Khúc Tham Lang đối cung củng chiếu',
    'Hội chiếu Tam Phương Cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('火星') || sanFangAllStars(chart).has('铃星'))
    bonus.push('Lại gặp Hỏa Tinh/Linh Tinh (Hỏa Tham/Linh Tham chồng lớp)');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('Vũ Khúc Hóa Lộc');
  if (hasShaInPalace(wu, ['擎羊', '陀罗'])) breaking.push('Cung Vũ Tham gặp Dương Đà');
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push('Cung Vũ Tham ngộ Không Kiếp');

  patterns.push({
    name: 'Vũ Tham Cách',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Vũ Khúc Tham Lang hội Mệnh, tài tinh cùng sao đào hoa dục vọng giao huy, cổ thư viết "Vũ Tham bất phát thiếu niên nhân" — sau ba mươi tuổi mới có thể tích lũy dày mà bộc phát. Chủ từ trung niên trở đi đại phú đại quý, nguồn tiền đến từ nhân mạch, giao tế, quản lý dục vọng, thích hợp tài chính, đầu cơ, kinh doanh, ngành giải trí.',
    palaces: [wu.name, tan.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Cốt Tủy Phú》',
  });
}

/** 杀破狼：七杀、破军、贪狼三方齐聚 */
function detectShaPoLang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['七杀', '破军', '贪狼'].filter(s => sanFangSet.has(s));
  if (has.length < 3) return;

  const required = ['Ba sao Thất Sát, Phá Quân, Tham Lang cùng nhập Tam Phương Tứ Chính của Cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangHasSiHua(chart, '禄') || sanFangHasSiHua(chart, '权')) bonus.push('Tam Phương có Hóa Lộc hoặc Hóa Quyền (động có lực)');
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Phụ Bật đồng hội (trong biến động gặp quý nhân)');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Sát tinh quá nặng (động mà không thành)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Mệnh tọa Không Kiếp (bôn ba vất vả)');

  patterns.push({
    name: 'Sát Phá Lang',
    level: breaking.length ? 'caution' : 'good',
    description: 'Ba sao Thất Sát, Phá Quân, Tham Lang hội Mệnh, mệnh cách khai sáng bôn ba. Trọn đời nhiều biến động, không cam chịu bình thường, hợp khởi nghiệp, quân cảnh, nghiệp vụ, kinh doanh. Sau trung niên mới có thể ổn định giữ thành quả, thời trẻ dễ vì bốc đồng mà thất lợi.',
    palaces: getSanFangPalaces(chart).filter(p => has.includes(getMajorStarNames(p)[0])).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Sát Phá Lang》',
  });
}

/** 机月同梁：天机、太阴、天同、天梁四星齐入命迁财官 */
function detectJiYueTongLiang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length < 4) return;

  const required = ['Bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng nhập Tam Phương Tứ Chính của Cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Lại hội Xương Khúc');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Lại hội Hóa Khoa');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Sát tinh quá nhiều (Cơ Nguyệt Đồng Lương kỵ sát)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh tọa sát');

  patterns.push({
    name: 'Cơ Nguyệt Đồng Lương',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng nhập Mệnh Di Tài Quan, văn nhã lịch thiệp, thông tuệ giỏi mưu lược. Thích hợp nhất với công chức, học thuật, văn nghệ, y tế, dịch vụ và những ngành nghề cần tích lũy ổn định, không hợp mạo hiểm lớn hay đầu cơ lớn.',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cơ Nguyệt Đồng Lương Cách》',
  });
}

/** 廉贞天相：同宫 */
function detectLianXiang(chart: ZiweiChart, patterns: Pattern[]) {
  const lian = findStarPalace(chart, '廉贞');
  const xiang = findStarPalace(chart, '天相');
  if (!lian || !xiang || lian.branch !== xiang.branch) return;

  const inMing = lian.branch === chart.mingGongBranch;
  const required = ['Liêm Trinh Thiên Tướng đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(lian, '禄存') || getStarSiHua(lian, '廉贞') === '禄') bonus.push('Kiến Lộc Tồn hoặc Liêm Trinh Hóa Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Tả Phụ hội chiếu');
  if (hasShaInPalace(lian, ['擎羊'])) breaking.push('Cung Liêm Tướng tọa Kình Dương (khuynh hướng Liêm Sát Dương)');
  if (getStarSiHua(lian, '廉贞') === '忌') breaking.push('Liêm Trinh Hóa Kỵ');

  patterns.push({
    name: 'Liêm Trinh Thiên Tướng Cách',
    level: breaking.length ? 'caution' : (inMing ? 'good' : 'neutral'),
    description: 'Liêm Trinh Thiên Tướng đồng cung, cách cục ấn thụ, chủ xử việc công minh, có tiếng thanh liêm, hợp giữ công chức, quản lý hành chính, pháp vụ, hoạch định. Sợ gặp Kình Dương Hóa Kỵ, trái lại chủ quan phi.',
    palaces: [lian.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 武曲七杀：同宫，将星配财星 */
function detectWuQiSha(chart: ZiweiChart, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const qi = findStarPalace(chart, '七杀');
  if (!wu || !qi || wu.branch !== qi.branch) return;

  const inMing = wu.branch === chart.mingGongBranch;
  const required = ['Vũ Khúc Thất Sát đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(wu, '武曲') === '权') bonus.push('Vũ Khúc Hóa Quyền');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('Vũ Khúc Hóa Lộc');
  if (getStarSiHua(wu, '武曲') === '忌') breaking.push('Vũ Khúc Hóa Kỵ (Vũ Khúc Hóa Kỵ là điềm hao tài kiếp tài)');
  if (hasShaInPalace(wu, ['擎羊', '陀罗', '火星', '铃星'])) breaking.push('Cung Vũ Sát quá nhiều sát tinh');

  patterns.push({
    name: 'Vũ Khúc Thất Sát',
    level: breaking.length ? 'caution' : (inMing ? 'excellent' : 'good'),
    description: 'Vũ Khúc Thất Sát đồng cung, tướng tinh phối tài tinh, chủ quả quyết cương nghị, năng lực quản lý tài chính mạnh, thích hợp tài chính, quân cảnh, khởi nghiệp. Nhưng kỵ gặp Hóa Kỵ sát tinh, bằng không sẽ hung hiểm. Trọn đời phấn đấu, tích được tài nhưng nhiều lo toan.',
    palaces: [wu.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 天同天梁：同宫 */
function detectTongLiang(chart: ZiweiChart, patterns: Pattern[]) {
  const tong = findStarPalace(chart, '天同');
  const liang = findStarPalace(chart, '天梁');
  if (!tong || !liang || tong.branch !== liang.branch) return;

  const required = ['Thiên Đồng Thiên Lương đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu');
  if (getStarSiHua(tong, '天同') === '禄') bonus.push('Thiên Đồng Hóa Lộc');
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push('Sát tinh đồng tọa');

  patterns.push({
    name: 'Thiên Đồng Thiên Lương Cách',
    level: breaking.length ? 'neutral' : 'good',
    description: 'Thiên Đồng Thiên Lương đồng cung, phúc tinh và ấm tinh cùng hội, chủ khoan hậu hiền hòa, vui lòng giúp người, hợp y tế, giáo dục, tôn giáo, công ích xã hội. Nhưng thiên về ôn hòa bảo thủ, khó thành cục diện đại phú đại quý.',
    palaces: [tong.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 日月同宫：太阳太阴丑或未宫同宫 */
function detectRiYueTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const sun = findStarPalace(chart, '太阳');
  const moon = findStarPalace(chart, '太阴');
  if (!sun || !moon || sun.branch !== moon.branch) return;
  if (sun.branch !== 1 && sun.branch !== 7) return;  // 必须丑(1) 或 未(7)

  const inMing = sun.branch === chart.mingGongBranch;
  const required = [`Thái Dương Thái Âm đồng nhập cung ${branchName(BRANCH_NAMES[sun.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sun.branch === 7) bonus.push('Cung Mùi Nhật Nguyệt đồng huy (cổ thư viết cung Mùi Nhật Nguyệt song mỹ)');
  if (sanFangAllStars(chart).has('文昌') && sanFangAllStars(chart).has('文曲')) bonus.push('Xương Khúc hội chiếu');
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push('Cung Nhật Nguyệt có sát tinh đồng tọa');

  patterns.push({
    name: 'Nhật Nguyệt Đồng Cung',
    level: breaking.length ? 'good' : (inMing ? 'excellent' : 'good'),
    description: `Thái Dương Thái Âm đồng cung tại cung ${branchName(BRANCH_NAMES[sun.branch])}, âm dương cân bằng, văn võ kiêm toàn. Chủ duyên khác giới tốt đẹp, sự nghiệp hanh thông, danh tiếng vang xa. ${sun.branch === 7 ? 'Tại cung Mùi Nhật Nguyệt song mỹ lại càng tốt đẹp.' : 'Tại cung Sửu Nhật Nguyệt đồng cung lực lượng bình hòa hơn.'}`,
    palaces: [sun.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 日月夹命：太阳太阴在命宫前后两宫 */
function detectRiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, '太阳');
  const prevHasMoon = hasStar(prev, '太阴');
  const nextHasSun = hasStar(next, '太阳');
  const nextHasMoon = hasStar(next, '太阴');
  const ok = (prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun);
  if (!ok) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ['Thái Dương Thái Âm phân cư hai cung trước sau Cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sunPalace, '太阳')) bonus.push('Thái Dương miếu vượng');
  if (isBright(moonPalace, '太阴')) bonus.push('Thái Âm miếu vượng');
  if (isDim(sunPalace, '太阳') || isDim(moonPalace, '太阴')) breaking.push('Nhật Nguyệt lạc hãm (giáp Mệnh mất sáng)');

  patterns.push({
    name: 'Nhật Nguyệt Giáp Mệnh',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương Thái Âm phân cư hai bên Cung Mệnh giáp chiếu, quang minh lỗi lạc, trọn đời có quý nhân tương trợ, sự nghiệp hưng thịnh. Nam chủ quan quý, nữ chủ vượng phu hưng gia. Nhật Nguyệt phải không lạc hãm mới là chân giáp.',
    palaces: [sunPalace.name, moonPalace.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Nhật Nguyệt Giáp Mệnh》',
  });
}

/** 巨日同宫：巨门太阳同入寅或申 */
function detectJuRiTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const ju = findStarPalace(chart, '巨门');
  const sun = findStarPalace(chart, '太阳');
  if (!ju || !sun || ju.branch !== sun.branch) return;
  if (ju.branch !== 2 && ju.branch !== 8) return;  // 必须寅(2) 或 申(8)

  const inMing = ju.branch === chart.mingGongBranch;
  const required = [`Cự Môn Thái Dương đồng nhập cung ${branchName(BRANCH_NAMES[ju.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (ju.branch === 2) bonus.push('Thái Dương cung Dần miếu vượng, Cự Môn nhờ ánh mặt trời hóa giải thị phi');
  if (getStarSiHua(ju, '巨门') === '禄' || getStarSiHua(ju, '巨门') === '权') bonus.push('Cự Môn Hóa Lộc/Hóa Quyền (tài ăn nói sinh tài)');
  if (getStarSiHua(ju, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (khẩu thiệt quan phi)');
  if (ju.branch === 8) breaking.push('Thái Dương cung Thân ngả bóng về tây, ám diệu Cự Môn càng lộ rõ');

  patterns.push({
    name: 'Cự Nhật Đồng Cung',
    level: breaking.length ? 'caution' : (inMing && ju.branch === 2 ? 'excellent' : 'good'),
    description: `Cự Môn Thái Dương đồng cung tại cung ${branchName(BRANCH_NAMES[ju.branch])}, Thái Dương hóa giải ám diệu Cự Môn, chủ lập nghiệp bằng tài ăn nói, truyền thông, ngoại ngữ, chuyên môn. Cung Dần là đẹp nhất, cung Thân lực giảm. Sợ Cự Môn Hóa Kỵ ắt vướng quan phi.`,
    palaces: [ju.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cự Nhật Đồng Cung》',
  });
}

/** 石中隐玉：巨门入命于子午宫 */
function detectShiZhongYinYu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '巨门')) return;
  if (ming.branch !== 0 && ming.branch !== 6) return;  // 子(0) 或 午(6)

  const required = [`Cự Môn nhập Mệnh tại cung ${branchName(BRANCH_NAMES[ming.branch])}`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(ming, '巨门') === '禄' || getStarSiHua(ming, '巨门') === '权') bonus.push('Cự Môn Hóa Lộc/Hóa Quyền');
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu (Thạch Trung Ẩn Ngọc được sáng)');
  if (getStarSiHua(ming, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (ngọc vùi bùn sâu)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Mệnh tọa sát tinh');

  patterns.push({
    name: 'Thạch Trung Ẩn Ngọc',
    level: breaking.length ? 'caution' : 'excellent',
    description: 'Cự Môn tọa Mệnh tại Tý Ngọ, bề ngoài bình dị mà bên trong ẩn chứa tài học. Thuở thiếu thời âm thầm vô danh, đến trung niên mới hiển lộ quý khí, hợp đi theo chuyên môn, nghiên cứu, tài ăn nói, truyền thông. Cần có Lộc Quyền hoặc Văn Xương tương trợ mới có thể "đẽo đá thấy ngọc".',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Cốt Tủy Phú · Thạch Trung Ẩn Ngọc》',
  });
}

/** 明珠出海：命宫在未空宫，对宫丑宫为太阳太阴 */
function detectMingZhuChuHai(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 7) return;   // 命在未
  if (getMajorStarNames(ming).length > 0) return;   // 命宫为空宫
  const dui = getDuiGong(chart, ming.branch);
  if (!dui) return;
  if (!hasStar(dui, '太阳') || !hasStar(dui, '太阴')) return;

  const required = ['Cung Mệnh tại Mùi là cung trống', 'Đối cung tại Sửu có Thái Dương Thái Âm đồng độ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌') || sanFangAllStars(chart).has('文曲')) bonus.push('Lại hội Xương Khúc');
  if (sanFangAllStars(chart).has('左辅') || sanFangAllStars(chart).has('右弼')) bonus.push('Phụ Bật tương trợ');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Sát tinh hội chiếu (ánh châu ảm đạm)');

  patterns.push({
    name: 'Minh Châu Xuất Hải',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Mệnh tại Mùi là cung trống, đối cung tại Sửu có Nhật Nguyệt đồng huy củng chiếu, mệnh danh "Minh Châu Xuất Hải". Chủ xuất thân bình thường, nhờ nỗ lực hậu thiên mà vươn lên, hợp lập nghiệp phương xa, nghiên cứu học thuật hoặc giữ chức vị cao trong tập đoàn lớn, chủ đại phú đại quý.',
    palaces: ['命宫', dui.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Tập · Minh Châu Xuất Hải》',
  });
}

/** 紫微独坐入命 */
function detectZiWeiInMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微') || hasStar(ming, '天府')) return;

  const required = ['Tử Vi độc tọa Cung Mệnh (không có Thiên Phủ đồng tọa)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phụ Hữu Bật đồng hội');
  if (sanFangSet.has('文昌') && sanFangSet.has('文曲')) bonus.push('Văn Xương Văn Khúc đồng hội');
  if (!sanFangSet.has('左辅') && !sanFangSet.has('右弼')) breaking.push('Không có Phụ Bật (cô quân vô thần)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Tử Vi ngộ Không Kiếp (cổ thư tối kỵ)');

  patterns.push({
    name: 'Tử Vi Nhập Mệnh',
    level: breaking.length ? 'caution' : (bonus.length ? 'excellent' : 'good'),
    description: 'Tử Vi độc tọa Cung Mệnh, sao Đế Vương, lòng tự tôn mạnh, có sức hút lãnh đạo. Nhưng Tử Vi tối kỵ "tại dã cô quân" — nếu không có Tả Hữu Phụ Bật tương hội, trái lại thành cô cao tự ngạo, dễ chuốc gièm pha.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 辅弼夹命 */
function detectFuBiJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasZuo = hasStar(prev, '左辅');
  const prevHasYou = hasStar(prev, '右弼');
  const nextHasZuo = hasStar(next, '左辅');
  const nextHasYou = hasStar(next, '右弼');
  if (!((prevHasZuo && nextHasYou) || (prevHasYou && nextHasZuo))) return;

  const required = ['Tả Phụ Hữu Bật phân cư hai cung trước sau Cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Lại hội Khôi Việt');

  patterns.push({
    name: 'Phụ Bật Giáp Mệnh',
    level: 'excellent',
    description: 'Tả Phụ Hữu Bật giáp Mệnh, luận thuyết truyền thống cho rằng cách này tượng trưng cho sự tương trợ của quý nhân và phẩm chất phúc hậu. Thích hợp theo đường quan lộ, quản lý doanh nghiệp lớn và những hướng phát huy tài tổ chức. Cổ thư viết "Tả Phụ Hữu Bật, chung thân phúc hậu" — nhấn mạnh ưu thế điều phối tổ chức của cách này.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phụ Bật Giáp Mệnh》',
  });
}

/** 昌曲夹命 */
function detectChangQuJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasChang = hasStar(prev, '文昌');
  const prevHasQu = hasStar(prev, '文曲');
  const nextHasChang = hasStar(next, '文昌');
  const nextHasQu = hasStar(next, '文曲');
  if (!((prevHasChang && nextHasQu) || (prevHasQu && nextHasChang))) return;

  patterns.push({
    name: 'Xương Khúc Giáp Mệnh',
    level: 'excellent',
    description: 'Văn Xương Văn Khúc giáp Cung Mệnh, chủ thông minh tuấn tú, văn tài rực rỡ, hợp theo ngành văn giáo, học thuật, nghệ thuật, sáng tác. Cổ thư viết "Xương Khúc giáp Mệnh chủ khoa giáp", rất lợi cho vận thi cử.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Văn Xương Văn Khúc phân cư hai cung trước sau Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 魁钺夹命 */
function detectKuiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '天魁') && hasStar(next, '天钺');
  const okB = hasStar(prev, '天钺') && hasStar(next, '天魁');
  if (!okA && !okB) return;

  patterns.push({
    name: 'Khôi Việt Giáp Mệnh',
    level: 'good',
    description: 'Thiên Khôi Thiên Việt giáp Mệnh, nam gọi là Thiên Ất, nữ gọi là Ngọc Đường, trọn đời được quý nhân dìu dắt. Trong thi cử, cầu việc, thời khắc then chốt thường có quý nhân bất ngờ tương trợ.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Thiên Khôi Thiên Việt phân cư hai cung trước sau Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 双禄朝垣：化禄 + 禄存 同会三方 */
function detectShuangLuChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFang = getSanFangPalaces(chart);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    if (p.stars.some(s => s.siHua === '禄')) huaLuFound = true;
    if (hasStar(p, '禄存')) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;

  patterns.push({
    name: 'Song Lộc Triều Viên',
    level: 'excellent',
    description: 'Hóa Lộc, Lộc Tồn đồng hội Tam Phương Tứ Chính của Cung Mệnh, nguồn tài lộc dạt dào, cơm áo sung túc. Cổ thư viết "Song Lộc triều viên, phú tỷ Đào Chu", chủ một đời không lo tiền bạc, thường kiêm đắc cả chính tài lẫn hoạnh tài.',
    palaces: sanFang.map(p => p.name),
    conditions: {
      required: ['Hóa Lộc hội chiếu Tam Phương Tứ Chính', 'Lộc Tồn hội chiếu Tam Phương Tứ Chính'],
      breaking: hasShaInPalace(ming, SHA_KONG) ? ['Mệnh tọa Không Kiếp (Song Lộc ngộ Không, tiền đến rồi lại đi)'] : undefined,
    },
    source: '《Tử Vi Đẩu Số Toàn Thư · Song Lộc Triều Viên》',
  });
}

/** 三奇加会：化禄 化权 化科 同会三方 */
function detectSanQiJiaHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangPalaces = getSanFangPalaces(chart);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    for (const s of p.stars) {
      if (s.siHua === '禄') lu = true;
      if (s.siHua === '权') quan = true;
      if (s.siHua === '科') ke = true;
    }
  }
  if (!(lu && quan && ke)) return;

  patterns.push({
    name: 'Tam Kỳ Gia Hội',
    level: 'excellent',
    description: 'Ba cát hóa Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội Tam Phương Tứ Chính của Cung Mệnh, mệnh danh là "Tam Kỳ Gia Hội". Chủ một đời công danh, tài phú, quý nhân vẹn cả ba, là một trong những cát cách bậc nhất của Tử Vi Đẩu Số.',
    palaces: sanFangPalaces.map(p => p.name),
    conditions: { required: ['Ba cát hóa Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội Tam Phương Tứ Chính của Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tam Kỳ Gia Hội》',
  });
}

/** 化禄入命/官/财 */
function detectHuaLuRuMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const huaLuStar = ming.stars.find(s => s.siHua === '禄' && s.type === 'major');
  if (!huaLuStar) return;

  patterns.push({
    name: `${starName(huaLuStar.name)} Hóa Lộc Nhập Mệnh`,
    level: 'good',
    description: `${starName(huaLuStar.name)} Hóa Lộc tọa Mệnh, chủ sinh tài thuận lợi, nhân duyên tốt đẹp, cơ duyên dồi dào.${huaLuStar.name === '武曲' ? ' Vũ Khúc Hóa Lộc thuộc chính tài, hợp thực nghiệp, tài chính.' : huaLuStar.name === '太阴' ? ' Thái Âm Hóa Lộc thuộc âm tài, bất động sản.' : huaLuStar.name === '贪狼' ? ' Tham Lang Hóa Lộc thuộc tài lộc từ nhân mạch, đào hoa tài.' : ''}`,
    palaces: ['命宫'],
    conditions: { required: [`${starName(huaLuStar.name)} Hóa Lộc tọa Cung Mệnh`] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

// ────────────────── 恶格识别器 ──────────────────

/** 化忌入命/迁 */
function detectHuaJiRuMingQian(chart: ZiweiChart, patterns: Pattern[]) {
  const qianBranch = (chart.mingGongBranch + 6) % 12;
  for (const palace of chart.palaces) {
    if (palace.branch !== chart.mingGongBranch && palace.branch !== qianBranch) continue;
    const jiStar = palace.stars.find(s => s.siHua === '忌' && s.type === 'major');
    if (!jiStar) continue;

    const inMing = palace.branch === chart.mingGongBranch;
    patterns.push({
      name: `${starName(jiStar.name)} Hóa Kỵ Nhập ${inMing ? 'Mệnh' : 'Di'}`,
      level: 'caution',
      description: inMing
        ? `${starName(jiStar.name)} Hóa Kỵ tọa Cung Mệnh, cần lưu ý tính cố chấp, trở ngại tâm lý hoặc nguy cơ sức khỏe tiềm ẩn của bản thân, mọi việc nên lùi một bước để suy ngẫm. Hóa Kỵ không hẳn là xấu, mà biểu thị năng lượng của sao này cần được đặc biệt quan tâm.`
        : `${starName(jiStar.name)} Hóa Kỵ tọa Cung Thiên Di, khi ra ngoài, đi xa, quan hệ giao tế dễ gặp trắc trở, nên tĩnh tại giữ mình hơn là vọng động.`,
      palaces: [palace.name],
      conditions: { required: [`${starName(jiStar.name)} Hóa Kỵ tọa Cung ${inMing ? 'Mệnh' : 'Thiên Di'}`] },
      source: '《Tử Vi Đẩu Số Toàn Thư》',
    });
  }
}

/** 羊陀夹忌：化忌坐宫，左右被擎羊陀罗夹 */
function detectYangTuoJiaJi(chart: ZiweiChart, patterns: Pattern[]) {
  for (const palace of chart.palaces) {
    const jiStar = palace.stars.find(s => s.siHua === '忌');
    if (!jiStar) continue;
    if (palace.branch !== chart.mingGongBranch) continue;   // 只看命宫被夹

    const { prev, next } = getJiaPalaces(chart, palace.branch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, '擎羊') && hasStar(next, '陀罗');
    const aNext = hasStar(prev, '陀罗') && hasStar(next, '擎羊');
    if (!aPrev && !aNext) continue;

    patterns.push({
      name: 'Dương Đà Giáp Kỵ',
      level: 'caution',
      description: 'Hóa Kỵ tọa Mệnh, hai bên tả hữu bị Kình Dương Đà La giáp Mệnh, cổ thư viết "Dương Đà giáp Kỵ vi bại cục", chủ một đời lao lực bôn ba, trắc trở bất thuận, thân tâm đều mỏi mệt. Cần lấy việc tu dưỡng đức hạnh và tích cực hành sự để hóa giải, mọi việc lấy sự cẩn trọng làm đầu.',
      palaces: ['命宫', prev.name, next.name],
      conditions: { required: ['Hóa Kỵ tọa Mệnh', 'Kình Dương Đà La phân cư hai cung trước sau Cung Mệnh'] },
      source: '《Tử Vi Đẩu Số Cốt Tủy Phú · Dương Đà Giáp Kỵ》',
    });
    return;
  }
}

/** 火铃夹命：火星铃星分居命宫前后 */
function detectHuoLingJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '火星') && hasStar(next, '铃星');
  const okB = hasStar(prev, '铃星') && hasStar(next, '火星');
  if (!okA && !okB) return;

  patterns.push({
    name: 'Hỏa Linh Giáp Mệnh',
    level: 'caution',
    description: 'Hỏa Tinh Linh Tinh phân cư hai cung trước sau giáp Cung Mệnh, chủ tính nóng nảy, dễ bốc đồng, gặp sự cố bất ngờ hoặc tranh chấp. Cần rèn luyện tính kiên nhẫn, tránh quyết định bốc đồng.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Hỏa Tinh Linh Tinh phân cư hai cung trước sau Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 空劫夹命：地空地劫分居命宫前后 */
function detectKongJieJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '地空') && hasStar(next, '地劫');
  const okB = hasStar(prev, '地劫') && hasStar(next, '地空');
  if (!okA && !okB) return;

  patterns.push({
    name: 'Không Kiếp Giáp Mệnh',
    level: 'caution',
    description: 'Địa Không Địa Kiếp giáp Mệnh, chủ tiền đến rồi lại đi, tư tưởng thoát tục, dễ hướng về tôn giáo triết học. Cổ thư viết "Không Kiếp giáp Mệnh, tài bất tụ". Hợp kỹ nghệ, tôn giáo, nghiên cứu và những ngành nghề không đặt nặng vật chất.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Địa Không Địa Kiếp phân cư hai cung trước sau Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 廉杀羊：廉贞、七杀、擎羊三星会照（流年大限最凶） */
function detectLianShaYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('廉贞') && sanFangSet.has('七杀') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: 'Liêm Sát Dương',
    level: 'caution',
    description: 'Ba sao Liêm Trinh, Thất Sát, Kình Dương hội chiếu Tam Phương Cung Mệnh, trong luận thuyết truyền thống được đánh dấu là tổ hợp cần đặc biệt lưu tâm. Khi cách này khởi phát ở Đại Hạn hoặc Lưu Niên, cần giữ thái độ cẩn trọng: an toàn khi cầm lái, hòa khí trong giao tiếp, lý trí khi quyết định y tế — nhấn mạnh sự chủ động quản lý hơn là cam chịu số mệnh tiêu cực.',
    palaces: ['命宫'],
    conditions: { required: ['Ba sao Liêm Trinh, Thất Sát, Kình Dương hội chiếu Tam Phương Tứ Chính'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Liêm Sát Dương》',
  });
}

/** 巨火羊：巨门、火星、擎羊会照 */
function detectJuHuoYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('巨门') && sanFangSet.has('火星') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: 'Cự Hỏa Dương',
    level: 'caution',
    description: 'Ba sao Cự Môn, Hỏa Tinh, Kình Dương hội chiếu, cổ thư truyền thống ghi chép cách này là tổ hợp cần cảnh giác (cổ văn viết "chung thân ải tử" là lối biểu đạt thuyết định mệnh, nay không còn phù hợp). Cách hiểu hiện đại là: tổ hợp này tượng trưng cho lời nói thẳng dễ châm ngòi xung đột, khi cảm xúc kịch liệt cần tự nhận thức bản thân. Hướng tu dưỡng là: rèn cách diễn đạt ôn hòa, chủ động hóa giải đối lập, trau dồi khả năng quản lý cảm xúc.',
    palaces: ['命宫'],
    conditions: { required: ['Ba sao Cự Môn, Hỏa Tinh, Kình Dương hội chiếu Tam Phương Tứ Chính'] },
    source: '《Tử Vi Đẩu Số Cốt Tủy Phú · Cự Hỏa Dương》',
  });
}

/** 铃昌陀武：铃星、文昌、陀罗、武曲会照（限至投河） */
function detectLingChangTuoWu(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('铃星') && sanFangSet.has('文昌') && sanFangSet.has('陀罗') && sanFangSet.has('武曲'))) return;

  patterns.push({
    name: 'Linh Xương Đà Vũ',
    level: 'caution',
    description: 'Bốn sao Linh Tinh, Văn Xương, Đà La, Vũ Khúc cùng hội, cổ thư truyền thống ghi chép đây là tổ hợp cần đặc biệt quan tâm (cổ văn viết "hạn chí đầu hà" là lối biểu đạt thuyết định mệnh, không phải cách hiểu hiện đại). Lời khuyên hiện đại là: khi tổ hợp này khởi phát ở Đại Hạn hoặc Lưu Niên, nhắc nhở cần xử lý lý trí các quyết định trọng đại, lưu tâm biến động cảm xúc, duy trì sự ổn định trong cuộc sống — nhấn mạnh chủ động quản lý thay vì chờ đợi tiêu cực.',
    palaces: ['命宫'],
    conditions: { required: ['Bốn sao Linh Tinh, Văn Xương, Đà La, Vũ Khúc hội chiếu Tam Phương Tứ Chính'] },
    source: '《Tử Vi Đẩu Số Cốt Tủy Phú · Linh Xương Đà Vũ》',
  });
}

/** 马头带箭：擎羊在午宫坐命 */
function detectMaTouDaiJian(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 6) return;   // 必须午
  if (!hasStar(ming, '擎羊')) return;

  const required = ['Kình Dương tọa Mệnh tại cung Ngọ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('七杀') || sanFangAllStars(chart).has('破军')) bonus.push('Lại hội Thất Sát hoặc Phá Quân (võ chức đại quý)');
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Khôi Việt gia chiếu');

  patterns.push({
    name: 'Mã Đầu Đới Tiễn',
    level: bonus.length ? 'good' : 'caution',
    description: 'Kình Dương tọa Mệnh tại cung Ngọ, mệnh danh "Mã Đầu Đới Tiễn", cổ thư viết "uy trấn biên cương". Cách này tượng trưng cho sức hành động quả quyết và tinh thần cạnh tranh, thích hợp với những định hướng nghề nghiệp đòi hỏi năng lực thực thi và quyết đoán can trường. Luận thuyết truyền thống đồng thời nhắc nhở cách này cần phối hợp với các cát tinh mới phát huy tối ưu — nhấn mạnh ảnh hưởng của tổ hợp hơn là luận đơn độc một sao.',
    palaces: ['命宫'],
    conditions: { required, bonus },
    source: '《Tử Vi Đẩu Số Cốt Tủy Phú · Mã Đầu Đới Tiễn》',
  });
}

// ────────────────── 基础格局（提升识别覆盖率）──────────────────
// 设计：让普通命盘也能识别出 1-3 个常见格局，而不是 30+ 严格古书格局都不匹配。
// 这些都是单一条件触发的轻量识别，level 多为 neutral / good。

/** 禄存守身：禄存入身宫（或命宫与身宫同宫） */
function detectLuCunShouShen(chart: ZiweiChart, patterns: Pattern[]) {
  const luCunPalace = findStarPalace(chart, '禄存');
  if (!luCunPalace) return;
  const inMing = luCunPalace.branch === chart.mingGongBranch;
  const inShen = luCunPalace.branch === chart.shenGongBranch;
  if (!inMing && !inShen) return;
  patterns.push({
    name: inMing ? 'Lộc Tồn Thủ Mệnh' : 'Lộc Tồn Thủ Thân',
    level: 'good',
    description: inMing
      ? 'Lộc Tồn tọa Mệnh, chủ một đời cơm áo không lo, tài lộc ổn định. Tính cách cẩn trọng, giỏi tích lũy, nhưng Dương Đà giáp Lộc cần đề phòng tiểu nhân. Tốt nhất nên phối hợp Hóa Lộc, Tả Phụ Hữu Bật mới thành đại cách.'
      : 'Lộc Tồn nhập Cung Thân, chủ sau trung niên nguồn tài lộc ổn định, đắc lộc tự hưởng. Nghê sư nói "Lộc Tồn nhập Thân, tài khí cận thân" — người phối ngẫu hoặc định hướng sự nghiệp có thể mang lại tài lộc ổn định.',
    palaces: [inMing ? '命宫' : '身宫'],
    conditions: { required: [inMing ? 'Lộc Tồn nhập Cung Mệnh' : 'Lộc Tồn nhập Cung Thân'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Lộc Tồn Tinh》',
  });
}

/** 天马入命/迁：驿马星动 */
function detectTianMaRuMing(chart: ZiweiChart, patterns: Pattern[]) {
  const tianMaPalace = findStarPalace(chart, '天马');
  if (!tianMaPalace) return;
  const inMing = tianMaPalace.branch === chart.mingGongBranch;
  const inQian = tianMaPalace.branch === ((chart.mingGongBranch + 6) % 12);
  if (!inMing && !inQian) return;
  patterns.push({
    name: inMing ? 'Thiên Mã Nhập Mệnh' : 'Thiên Mã Tại Di',
    level: 'neutral',
    description: inMing
      ? 'Thiên Mã tọa Mệnh, chủ một đời bôn ba, trong dịch chuyển mà đắc tài, hợp đi theo thương mại lữ hành, công tác bên ngoài, phát triển liên ngành. Nghê sư nói "Thiên Mã nhập Mệnh, vô Lộc bất phát" — nếu lại hội Lộc Tồn hoặc Hóa Lộc tức thành phú cách "Lộc Mã Giao Trì".'
      : 'Thiên Mã ở Cung Thiên Di, chủ ra ngoài có lợi, đi xa đắc tài, hợp phát triển nơi đất khách. Phối Hóa Lộc chủ sinh tài nơi xa, phối sát tinh thì đường đi nhiều trắc trở.',
    palaces: [tianMaPalace.name],
    conditions: { required: [inMing ? 'Thiên Mã nhập Cung Mệnh' : 'Thiên Mã nhập Cung Thiên Di'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Thiên Mã Tinh》',
  });
}

/** 化禄入财：财帛宫主星化禄 */
function detectHuaLuRuCai(chart: ZiweiChart, patterns: Pattern[]) {
  const cai = chart.palaces.find(p => p.name === '财帛');
  if (!cai) return;
  const luStar = cai.stars.find(s => s.type === 'major' && s.siHua === '禄');
  if (!luStar) return;
  patterns.push({
    name: 'Hóa Lộc Nhập Tài',
    level: 'good',
    description: `${starName(luStar.name)} Hóa Lộc nhập Cung Tài Bạch, chủ nguồn tài lộc hanh thông, thu nhập ổn định. Nghê sư giảng Hóa Lộc là biểu tượng của "chính tài" — năng lực mà sao Hóa Lộc này đại diện (đặc tính cốt lõi của ${starName(luStar.name)}) chính là trục chính giúp bạn kiếm tiền. Phối hợp thêm Lộc Tồn hoặc Thiên Mã thì nguồn tài lộc càng rộng mở.`,
    palaces: ['财帛'],
    conditions: { required: [`${starName(luStar.name)} Hóa Lộc nhập Cung Tài Bạch`] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
  });
}

/** 化权入官：官禄宫主星化权 */
function detectHuaQuanRuGuan(chart: ZiweiChart, patterns: Pattern[]) {
  const guan = chart.palaces.find(p => p.name === '官禄');
  if (!guan) return;
  const quanStar = guan.stars.find(s => s.type === 'major' && s.siHua === '权');
  if (!quanStar) return;
  patterns.push({
    name: 'Hóa Quyền Nhập Quan',
    level: 'good',
    description: `${starName(quanStar.name)} Hóa Quyền nhập Cung Quan Lộc, chủ sự nghiệp có sức nắm giữ, có thể đảm đương chức vị tự chủ một phương. Hóa Quyền đại diện cho quyền lực và sức thực thi — ${starName(quanStar.name)} Hóa Quyền cho thấy trong sự nghiệp bạn có thể trở thành người ra quyết định hoặc người thực thi cốt lõi, hợp đi theo con đường quản lý hoặc chuyên gia kỹ thuật uy quyền.`,
    palaces: ['官禄'],
    conditions: { required: [`${starName(quanStar.name)} Hóa Quyền nhập Cung Quan Lộc`] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
  });
}

/** 化科入命/身：科名加身 */
function detectHuaKeRuMingShen(chart: ZiweiChart, patterns: Pattern[]) {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const target = [ming, shen].filter((p): p is Palace => Boolean(p));
  for (const p of target) {
    const keStar = p.stars.find(s => s.type === 'major' && s.siHua === '科');
    if (!keStar) continue;
    const isMing = p.branch === chart.mingGongBranch;
    patterns.push({
      name: isMing ? 'Hóa Khoa Nhập Mệnh' : 'Hóa Khoa Nhập Thân',
      level: 'good',
      description: `${starName(keStar.name)} Hóa Khoa nhập Cung ${isMing ? 'Mệnh' : 'Thân'}, chủ về danh tiếng, văn thư, vận học thuật. Nghê sư giảng Hóa Khoa là "sao Quý Nhân" — ${starName(keStar.name)} Hóa Khoa mang lại phẩm chất được người đời coi trọng, hợp theo đuổi các lĩnh vực văn thư, giáo dục, nghiên cứu, tư vấn, sáng tạo văn hóa theo hướng "lấy danh cầu lợi".`,
      palaces: [isMing ? '命宫' : '身宫'],
      conditions: { required: [`${starName(keStar.name)} Hóa Khoa nhập Cung ${isMing ? 'Mệnh' : 'Thân'}`] },
      source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
    });
    return; // 命和身重复时只识别一次
  }
}

/** 机月同梁三星会（3 星不全格，非四星真格）：天机/太阴/天同/天梁 任 3 星齐入三方四正 */
function detectJiYueTongLiangPartial(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length !== 3) return; // 4 星齐由 detectJiYueTongLiang 处理
  // 避免和上面 detectJiYueTongLiang 重复（4 星齐的不进这里）
  const missing = ['天机', '太阴', '天同', '天梁'].filter(s => !sanFangSet.has(s));
  patterns.push({
    name: 'Cơ Nguyệt Đồng Lương Tam Tinh Hội',
    level: 'neutral',
    description: `Cơ Nguyệt Đồng Lương cần bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng hội chiếu Tam Phương Tứ Chính mới thành chân cách hoàn chỉnh; lá số này chỉ hội đủ 3 sao trong số đó (${has.map(starName).join(', ')}), khuyết ${missing.map(starName).join(', ')} chưa hội, chưa phải chân cách hoàn chỉnh nên lực lượng giảm một bậc. Văn nhã mà có mưu lược, hợp công chức, giáo dục nghiên cứu, y tế, dịch vụ và các ngành nghề dựa vào tích lũy ổn định, mấu chốt cần xét sự phối hợp giữa sao khuyết vị và Tứ Hóa.`,
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required: [`Tam Phương Tứ Chính hội ${has.map(starName).join(', ')} (Cơ Nguyệt Đồng Lương khuyết ${missing.map(starName).join(', ')})`] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cơ Nguyệt Đồng Lương Cách》',
  });
  void ming;
}

/** 昌曲同会：文昌+文曲都在命三方四正 */
function detectChangQuTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('文昌') || !sanFangSet.has('文曲')) return;
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return;
  const inMing = hasStar(ming, '文昌') && hasStar(ming, '文曲');
  patterns.push({
    name: inMing ? 'Xương Khúc Tọa Mệnh' : 'Xương Khúc Đồng Hội',
    level: 'good',
    description: inMing
      ? 'Văn Xương Văn Khúc đồng nhập Cung Mệnh, chủ thông minh tuấn tú, văn tài rực rỡ, hợp văn học, giáo dục, sáng tác, tư vấn. Tối kỵ Hóa Kỵ — Xương Khúc Hóa Kỵ chủ thiệt thòi ngầm về văn thư khế ước.'
      : 'Văn Xương Văn Khúc đồng hội Tam Phương Tứ Chính, chủ tài hoa hơn người, tài ăn nói và văn bút đều xuất sắc. Hợp đi theo ngành nghề cần sự diễn đạt và văn tài, có thêm Hóa Khoa gia trì thì danh tiếng vang dội.',
    palaces: ['命宫'],
    conditions: { required: ['Văn Xương, Văn Khúc đồng hội Tam Phương Tứ Chính của Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Văn Tinh Luận》',
  });
}

/** 辅弼同会：左辅+右弼都在命三方四正 */
function detectFuBiTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('左辅') || !sanFangSet.has('右弼')) return;
  patterns.push({
    name: 'Phụ Bật Đồng Hội',
    level: 'good',
    description: 'Tả Phụ Hữu Bật đồng hội Tam Phương Tứ Chính của Cung Mệnh, chủ một đời quý nhân không dứt, nhân duyên cực tốt. Rất hợp cương vị lãnh đạo và công việc mang tính hợp tác đội nhóm. Nghê sư nói "Phụ Bật giáp Mệnh, bình sinh quý nhân đa" — bạn không phải mệnh đơn thương độc mã, hãy khéo tận dụng mạng lưới quan hệ.',
    palaces: ['命宫'],
    conditions: { required: ['Tả Phụ, Hữu Bật đồng hội Tam Phương Tứ Chính của Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phụ Bật Luận》',
  });
}

/** 魁钺同会：天魁+天钺都在命三方四正 */
function detectKuiYueTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('天魁') || !sanFangSet.has('天钺')) return;
  patterns.push({
    name: 'Khôi Việt Đồng Hội',
    level: 'good',
    description: 'Thiên Khôi Thiên Việt đồng hội Tam Phương Tứ Chính của Cung Mệnh, chủ được "Thiên Ất Quý Nhân" gia trì, vào thời khắc then chốt luôn có quý nhân dìu dắt. Nghê sư nói "Khôi Việt giáp Mệnh, tất vi quý nhân" — khi gặp khó khăn bên cạnh sẽ xuất hiện người đắc lực tương trợ, nên chủ động gìn giữ nhân mạch.',
    palaces: ['命宫'],
    conditions: { required: ['Thiên Khôi, Thiên Việt đồng hội Tam Phương Tứ Chính của Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Khôi Việt Luận》',
  });
}

/** 科权双会：化科 + 化权 同会三方四正 */
function detectKeQuanShuangHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sfPalaces = getSanFangPalaces(chart);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    for (const s of p.stars) {
      if (s.type === 'major' && s.siHua === '科') hasKe = true;
      if (s.type === 'major' && s.siHua === '权') hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;
  patterns.push({
    name: 'Khoa Quyền Song Hội',
    level: 'good',
    description: 'Hóa Khoa + Hóa Quyền đồng hội Tam Phương Tứ Chính, chủ danh quyền song mỹ — vừa có học thức/danh tiếng (Khoa), vừa có sức nắm giữ (Quyền), hợp đi theo con đường "chuyên gia uy quyền" (như bác sĩ, luật sư, giáo sư, nòng cốt kỹ thuật), danh lợi song thu mà nền tảng vững chắc.',
    palaces: ['命宫'],
    conditions: { required: ['Hóa Khoa, Hóa Quyền đồng hội Tam Phương Tứ Chính của Cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Hội Chiếu》',
  });
}

// ────────────────── 主入口 ──────────────────
export function detectPatterns(chart: ZiweiChart): Pattern[] {
  const patterns: Pattern[] = [];
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return patterns;

  // 上格
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);

  // 中格
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);

  // 助力格
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);

  // 恶格
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);

  // 基础格局（提升识别覆盖率，让普通命盘也能识别 1-3 个）
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);

  return patterns;
}

// ────────────────── 命宫摘要（保持向后兼容）──────────────────
export function getMingGongSummary(chart: ZiweiChart): {
  stars: string[];
  keywords: string[];
  nature: string;
} {
  const mingPalace = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!mingPalace) return { stars: [], keywords: [], nature: '' };

  const majorStars = mingPalace.stars.filter(s => s.type === 'major');
  const starNames = majorStars.map(s => s.name);

  const keywordMap: Record<string, string[]> = {
    '紫微': ['Tôn quý', 'Độc lập', 'Lãnh đạo'],
    '天机': ['Trí tuệ', 'Cơ biến', 'Giỏi mưu lược'],
    '太阳': ['Dương cương', 'Quan quý', 'Hào phóng'],
    '武曲': ['Tài phú', 'Cương nghị', 'Quả đoán'],
    '天同': ['Ôn hòa', 'Hưởng phúc', 'Tùy duyên'],
    '廉贞': ['Tài nghệ', 'Đào hoa', 'Đa biến'],
    '天府': ['Tài kho', 'Vững vàng', 'Thận trọng'],
    '太阴': ['Nhu mỹ', 'Tài phú', 'Tinh tế'],
    '贪狼': ['Dục vọng', 'Đào hoa', 'Đa tài'],
    '巨门': ['Hùng biện', 'Đa tư', 'Khẩu tài'],
    '天相': ['Phụ tá', 'Hành chính', 'Vững chãi'],
    '天梁': ['Ấm hộ', 'Y dược', 'Trưởng bối'],
    '七杀': ['Tướng tinh', 'Quả quyết', 'Cô khắc'],
    '破军': ['Khai sáng', 'Biến động', 'Phá cũ'],
  };

  const natureMap: Record<string, string> = {
    '紫微': 'Sao Đế Vương', '天机': 'Sao Trí Tuệ', '太阳': 'Sao Quý Nhân',
    '武曲': 'Sao Tài Bạch', '天同': 'Sao Phúc Đức', '廉贞': 'Sao Đào Hoa',
    '天府': 'Sao Tài Kho', '太阴': 'Sao Tài Phú', '贪狼': 'Sao Đào Hoa',
    '巨门': 'Sao Thị Phi', '天相': 'Sao Ấn Thụ', '天梁': 'Sao Ấm Bì',
    '七杀': 'Sao Tướng Soái', '破军': 'Sao Biến Động',
  };

  const keywords = starNames.flatMap(n => keywordMap[n] ?? []).slice(0, 5);
  const nature = starNames.length > 0 ? (natureMap[starNames[0]] ?? '') : 'Cung trống';

  return { stars: starNames, keywords, nature };
}
