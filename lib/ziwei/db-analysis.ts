/**
 * lib/ziwei/db-analysis —— 主星论断内容库
 *
 * STAR_DB 收 14 主星 × 13 个宫位语境的论断（一句话定调 / 核心论断 /
 * 命盘依据 / 经典出处），每颗星一个文件，见 lib/ziwei/star-db/<slug>.ts。
 * 内容为本仓库原创撰写；经典出处只引用仓库内的古籍数据
 * （lib/classics/data）与倪海厦《天纪》原话（docs/tianji-ziwei），
 * 引文逐字核对由 scripts/regression/star-db.test.ts 守护。
 */

import ziwei from './star-db/ziwei';
import tianji from './star-db/tianji';
import taiyang from './star-db/taiyang';
import wuqu from './star-db/wuqu';
import tiantong from './star-db/tiantong';
import lianzhen from './star-db/lianzhen';
import tianfu from './star-db/tianfu';
import taiyin from './star-db/taiyin';
import tanlang from './star-db/tanlang';
import jumen from './star-db/jumen';
import tianxiang from './star-db/tianxiang';
import tianliang from './star-db/tianliang';
import qisha from './star-db/qisha';
import pojun from './star-db/pojun';

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

// iztro zh-CN 宫位名：命宫保留「宫」字，其余无「宫」字，「交友」在 iztro 里叫「仆役」
export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻',
  career:      '官禄',
  wealth:      '财帛',
  health:      '疾厄',
  family:      '兄弟',
  children:    '子女',
  move:        '迁移',
  friends:     '仆役',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    '命格总览',
  personality: '性格特质',
  love:        '感情婚姻',
  career:      '事业职业',
  wealth:      '财富运势',
  health:      '健康状况',
  family:      '兄弟合伙',
  children:    '子女缘分',
  move:        '迁移外出',
  friends:     '人际贵人',
  home:        '田宅不动产',
  spirit:      '精神福德',
  parents:     '父母长辈',
};

/** 每个字段是一段带四个标记的文本，由 lib/seo/knowledge.ts 的 parseStarContent 拆分。 */
export interface StarContent {
  mingGong: string;
  personality: string;
  xiongDi: string;
  fuQi: string;
  ziNv: string;
  caiBo: string;
  jiE: string;
  qianYi: string;
  jiaoYou: string;
  guanLu: string;
  tianZhai: string;
  fuDe: string;
  fuMu: string;
}

export const STAR_DB: Record<string, StarContent> = {
  '紫微': ziwei,
  '天机': tianji,
  '太阳': taiyang,
  '武曲': wuqu,
  '天同': tiantong,
  '廉贞': lianzhen,
  '天府': tianfu,
  '太阴': taiyin,
  '贪狼': tanlang,
  '巨门': jumen,
  '天相': tianxiang,
  '天梁': tianliang,
  '七杀': qisha,
  '破军': pojun,
};
