/** Từ khóa giao diện tiếng Việt tương ứng với thuật ngữ trong tư liệu gốc. */
const CLASSICS_SEARCH_TERMS: Record<string, string> = {
  'tu vi': '紫微',
  'tu vi dau so': '紫微斗数',
  'thien co': '天机',
  'thai duong': '太阳',
  'vu khuc': '武曲',
  'thien dong': '天同',
  'liem trinh': '廉贞',
  'thien phu': '天府',
  'thai am': '太阴',
  'tham lang': '贪狼',
  'cu mon': '巨门',
  'thien tuong': '天相',
  'thien luong': '天梁',
  'that sat': '七杀',
  'pha quan': '破军',
  'ta phu': '左辅',
  'huu bat': '右弼',
  'van xuong': '文昌',
  'van khuc': '文曲',
  'thien khoi': '天魁',
  'thien viet': '天钺',
  'loc ton': '禄存',
  'kinh duong': '擎羊',
  'da la': '陀罗',
  'hoa tinh': '火星',
  'linh tinh': '铃星',
  'dia khong': '地空',
  'dia kiep': '地劫',
  'hoa loc': '化禄',
  'hoa quyen': '化权',
  'hoa khoa': '化科',
  'hoa ky': '化忌',
  'tu hoa': '四化',
  'menh': '命宫',
  'cung menh': '命宫',
  'cung than': '身宫',
  'tai bach': '财帛',
  'quan loc': '官禄',
  'thien di': '迁移',
  'phu the': '夫妻',
  'tu tuc': '子女',
  'tat ach': '疾厄',
  'dien trach': '田宅',
  'phuc duc': '福德',
  'phu mau': '父母',
  'dai han': '大限',
  'luu nien': '流年',
  'tam phuong tu chinh': '三方四正',
  'that sat trieu dau': '七杀朝斗',
  'song loc trieu vien': '双禄朝垣',
  'co nguyet dong luong': '机月同梁',
  'sat pha tham': '杀破狼',
  'tu phu dong cung': '紫府同宫',
  'quan than khanh hoi': '君臣庆会',
  'nhat nguyet dong cung': '日月同宫',
};

export function classicsSearchQuery(query: string): string {
  const trimmed = query.trim();
  const normalized = trimmed.normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ');
  return CLASSICS_SEARCH_TERMS[normalized] ?? trimmed;
}
