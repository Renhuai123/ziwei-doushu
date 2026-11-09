import type { CalendarZone, VietnamRegion } from './calendar-zone';
import { VN_DISTRICTS } from './vn-districts.generated';

export interface CityInfo {
  name: string;
  longitude: number; // degrees East
}

export interface ProvinceInfo {
  name: string;
  cities: CityInfo[];
  /** Lịch âm / múi giờ mặc định của nơi sinh; bỏ trống = Trung Quốc (UTC+8) như trước. */
  calendarZone?: CalendarZone;
  /** Chỉ dùng cho độ lệch giờ lịch sử của Việt Nam trước 1975-06-13. */
  region?: VietnamRegion;
}

// ★ 2026-10-07 用户反馈「出生地点还不够全」→ 补全全国区县（直辖市以外 2724 个，挂在各地级市下）。
//   区县不放进本表：本表经 BirthForm → LocationPicker 在 /chart、/heming 首屏静态依赖图上，
//   区县表与拼音表在 lib/ziwei/counties.generated.ts、lib/i18n/county-pinyin.generated.ts，
//   打开地点选择框时才动态加载（lib/ziwei/county-data.ts）。区县选中后城市字段存成「地级市·区县」，
//   见 lib/ziwei/county-label.ts。省直辖县级单位（仙桃、海南各市县、新疆兵团各市）仍是本表的市一级。
export const PROVINCES: ProvinceInfo[] = [
  // ─── 直辖市 ───────────────────────────────────────────
  {
    name: '北京市',
    cities: [
      // ★ 2026-08-23 用户反馈「直辖市内部也有分区，希望加上更准一些」→ 补全 16 区。
      //   保留「北京」市级条目在首位：老用户历史命盘存的是它，删掉会对不上。
      //   全市经度跨度 115.98–117.12（延庆↔平谷），约 1.14°，真太阳时最大差约 4.6 分钟——
      //   出生时刻落在时辰交界 ±5 分钟内时，选市中心与选边缘区会得到不同时辰，整盘皆变。
      { name: '北京', longitude: 116.4 },
      { name: '东城', longitude: 116.42 },
      { name: '西城', longitude: 116.37 },
      { name: '朝阳', longitude: 116.49 },
      { name: '丰台', longitude: 116.29 },
      { name: '石景山', longitude: 116.22 },
      { name: '海淀', longitude: 116.30 },
      { name: '门头沟', longitude: 116.10 },
      { name: '房山', longitude: 116.14 },
      { name: '通州', longitude: 116.66 },
      { name: '顺义', longitude: 116.65 },
      { name: '昌平', longitude: 116.24 },
      { name: '大兴', longitude: 116.34 },
      { name: '怀柔', longitude: 116.64 },
      { name: '平谷', longitude: 117.12 },
      { name: '密云', longitude: 116.84 },
      { name: '延庆', longitude: 115.98 },
    ],
  },
  {
    name: '天津市',
    cities: [
      // 跨度 116.97–117.83（静海↔宁河），约 0.86°，真太阳时最大差约 3.4 分钟
      { name: '天津', longitude: 117.2 },
      { name: '和平', longitude: 117.21 },
      { name: '河东', longitude: 117.24 },
      { name: '河西', longitude: 117.22 },
      { name: '南开', longitude: 117.15 },
      { name: '河北', longitude: 117.20 },
      { name: '红桥', longitude: 117.15 },
      { name: '东丽', longitude: 117.31 },
      { name: '西青', longitude: 117.01 },
      { name: '津南', longitude: 117.36 },
      { name: '北辰', longitude: 117.13 },
      { name: '武清', longitude: 117.04 },
      { name: '宝坻', longitude: 117.31 },
      { name: '滨海新区', longitude: 117.70 },
      { name: '宁河', longitude: 117.83 },
      { name: '静海', longitude: 116.97 },
      { name: '蓟州', longitude: 117.41 },
    ],
  },
  {
    name: '上海市',
    cities: [
      // 跨度 121.12–121.56（青浦↔浦东新区），约 0.44°，真太阳时最大差约 1.8 分钟
      { name: '上海', longitude: 121.5 },
      { name: '黄浦', longitude: 121.49 },
      { name: '徐汇', longitude: 121.44 },
      { name: '长宁', longitude: 121.42 },
      { name: '静安', longitude: 121.45 },
      { name: '普陀', longitude: 121.40 },
      { name: '虹口', longitude: 121.51 },
      { name: '杨浦', longitude: 121.53 },
      { name: '闵行', longitude: 121.38 },
      { name: '宝山', longitude: 121.49 },
      { name: '嘉定', longitude: 121.25 },
      { name: '浦东新区', longitude: 121.56 },
      { name: '金山', longitude: 121.34 },
      { name: '松江', longitude: 121.23 },
      { name: '青浦', longitude: 121.12 },
      { name: '奉贤', longitude: 121.47 },
      { name: '崇明', longitude: 121.40 },
    ],
  },
  {
    name: '重庆市',
    cities: [
      // 主城九区
      { name: '渝中', longitude: 106.6 },
      { name: '大渡口', longitude: 106.5 },
      { name: '江北', longitude: 106.6 },
      { name: '沙坪坝', longitude: 106.5 },
      { name: '九龙坡', longitude: 106.5 },
      { name: '南岸', longitude: 106.6 },
      { name: '北碚', longitude: 106.4 },
      { name: '渝北', longitude: 106.6 },
      { name: '巴南', longitude: 106.5 },
      // 远郊区
      { name: '万州', longitude: 108.4 },
      { name: '涪陵', longitude: 107.4 },
      { name: '黔江', longitude: 108.8 },
      { name: '长寿', longitude: 107.1 },
      { name: '江津', longitude: 106.3 },
      { name: '合川', longitude: 106.3 },
      { name: '永川', longitude: 105.9 },
      { name: '南川', longitude: 107.1 },
      { name: '綦江', longitude: 106.7 },
      { name: '大足', longitude: 105.7 },
      { name: '璧山', longitude: 106.2 },
      { name: '铜梁', longitude: 106.1 },
      { name: '潼南', longitude: 105.8 },
      { name: '荣昌', longitude: 105.6 },
      { name: '开州', longitude: 108.4 },
      { name: '梁平', longitude: 107.8 },
      { name: '武隆', longitude: 107.8 },
      // 县
      { name: '城口', longitude: 108.7 },
      { name: '丰都', longitude: 107.7 },
      { name: '垫江', longitude: 107.4 },
      { name: '忠县', longitude: 108.1 },
      { name: '云阳', longitude: 108.7 },
      { name: '奉节', longitude: 109.5 },
      { name: '巫山', longitude: 109.9 },
      { name: '巫溪', longitude: 109.6 },
      // 自治县
      { name: '石柱', longitude: 108.1 },
      { name: '秀山', longitude: 109.0 },
      { name: '酉阳', longitude: 108.8 },
      { name: '彭水', longitude: 108.2 },
    ],
  },

  // ─── 华北 ─────────────────────────────────────────────
  {
    name: '河北省',
    cities: [
      { name: '石家庄', longitude: 114.5 },
      { name: '保定', longitude: 115.5 },
      { name: '唐山', longitude: 118.2 },
      { name: '秦皇岛', longitude: 119.6 },
      { name: '廊坊', longitude: 116.7 },
      { name: '张家口', longitude: 114.9 },
      { name: '承德', longitude: 117.9 },
      { name: '沧州', longitude: 116.8 },
      { name: '邯郸', longitude: 114.5 },
      { name: '衡水', longitude: 115.7 },
      { name: '邢台', longitude: 114.5 },
    ],
  },
  {
    name: '山西省',
    cities: [
      { name: '太原', longitude: 112.6 },
      { name: '大同', longitude: 113.3 },
      { name: '长治', longitude: 113.1 },
      { name: '晋城', longitude: 112.9 },
      { name: '朔州', longitude: 112.4 },
      { name: '晋中', longitude: 112.8 },
      { name: '运城', longitude: 111.0 },
      { name: '忻州', longitude: 112.7 },
      { name: '临汾', longitude: 111.5 },
      { name: '吕梁', longitude: 111.1 },
      { name: '阳泉', longitude: 113.6 },
    ],
  },
  {
    name: '内蒙古自治区',
    cities: [
      { name: '呼和浩特', longitude: 111.7 },
      { name: '包头', longitude: 110.0 },
      { name: '鄂尔多斯', longitude: 109.8 },
      { name: '赤峰', longitude: 118.9 },
      { name: '通辽', longitude: 122.3 },
      { name: '呼伦贝尔', longitude: 119.7 },
      { name: '乌兰察布', longitude: 113.1 },
      { name: '巴彦淖尔', longitude: 107.4 },
      { name: '锡林郭勒', longitude: 116.1 },
      { name: '乌海', longitude: 106.8 },
      { name: '兴安盟', longitude: 122.1 },
      { name: '阿拉善盟', longitude: 105.7 },
    ],
  },

  // ─── 东北 ─────────────────────────────────────────────
  {
    name: '辽宁省',
    cities: [
      { name: '沈阳', longitude: 123.4 },
      { name: '大连', longitude: 121.6 },
      { name: '鞍山', longitude: 122.9 },
      { name: '抚顺', longitude: 123.9 },
      { name: '本溪', longitude: 123.8 },
      { name: '丹东', longitude: 124.4 },
      { name: '锦州', longitude: 121.1 },
      { name: '营口', longitude: 122.2 },
      { name: '阜新', longitude: 121.7 },
      { name: '辽阳', longitude: 123.2 },
      { name: '朝阳', longitude: 120.5 },
      { name: '盘锦', longitude: 122.1 },
      { name: '葫芦岛', longitude: 120.8 },
      { name: '铁岭', longitude: 123.8 },
    ],
  },
  {
    name: '吉林省',
    cities: [
      { name: '长春', longitude: 125.4 },
      { name: '吉林', longitude: 126.6 },
      { name: '四平', longitude: 124.4 },
      { name: '辽源', longitude: 125.1 },
      { name: '通化', longitude: 125.9 },
      { name: '白山', longitude: 126.4 },
      { name: '松原', longitude: 124.8 },
      { name: '白城', longitude: 122.8 },
      { name: '延边', longitude: 129.5 },
    ],
  },
  {
    name: '黑龙江省',
    cities: [
      { name: '哈尔滨', longitude: 126.5 },
      { name: '齐齐哈尔', longitude: 123.9 },
      { name: '牡丹江', longitude: 129.6 },
      { name: '佳木斯', longitude: 130.4 },
      { name: '大庆', longitude: 125.0 },
      { name: '绥化', longitude: 126.9 },
      { name: '鸡西', longitude: 130.9 },
      { name: '双鸭山', longitude: 131.2 },
      { name: '伊春', longitude: 128.9 },
      { name: '七台河', longitude: 130.8 },
      { name: '抚远（中国最东）', longitude: 134.3 },
      { name: '鹤岗', longitude: 130.3 },
      { name: '黑河', longitude: 127.5 },
      { name: '大兴安岭', longitude: 124.1 },
    ],
  },

  // ─── 华东 ─────────────────────────────────────────────
  {
    name: '江苏省',
    cities: [
      { name: '南京', longitude: 118.8 },
      { name: '苏州', longitude: 120.6 },
      { name: '无锡', longitude: 120.3 },
      { name: '常州', longitude: 119.9 },
      { name: '南通', longitude: 120.9 },
      { name: '扬州', longitude: 119.4 },
      { name: '徐州', longitude: 117.2 },
      { name: '连云港', longitude: 119.2 },
      { name: '淮安', longitude: 119.0 },
      { name: '盐城', longitude: 120.2 },
      { name: '镇江', longitude: 119.5 },
      { name: '泰州', longitude: 119.9 },
      { name: '宿迁', longitude: 118.3 },
    ],
  },
  {
    name: '浙江省',
    cities: [
      { name: '杭州', longitude: 120.1 },
      { name: '宁波', longitude: 121.6 },
      { name: '温州', longitude: 120.7 },
      { name: '嘉兴', longitude: 120.8 },
      { name: '湖州', longitude: 120.1 },
      { name: '绍兴', longitude: 120.6 },
      { name: '金华', longitude: 119.6 },
      { name: '衢州', longitude: 118.9 },
      { name: '舟山', longitude: 122.1 },
      { name: '台州', longitude: 121.4 },
      { name: '丽水', longitude: 119.9 },
    ],
  },
  {
    name: '安徽省',
    cities: [
      { name: '合肥', longitude: 117.3 },
      { name: '芜湖', longitude: 118.4 },
      { name: '蚌埠', longitude: 117.4 },
      { name: '淮南', longitude: 117.0 },
      { name: '马鞍山', longitude: 118.5 },
      { name: '淮北', longitude: 116.8 },
      { name: '铜陵', longitude: 117.8 },
      { name: '安庆', longitude: 117.1 },
      { name: '黄山', longitude: 118.3 },
      { name: '滁州', longitude: 118.3 },
      { name: '阜阳', longitude: 115.8 },
      { name: '宿州', longitude: 116.9 },
      { name: '六安', longitude: 116.5 },
      { name: '亳州', longitude: 115.8 },
      { name: '池州', longitude: 117.5 },
      { name: '宣城', longitude: 118.8 },
    ],
  },
  {
    name: '福建省',
    cities: [
      { name: '福州', longitude: 119.3 },
      { name: '厦门', longitude: 118.1 },
      { name: '莆田', longitude: 119.0 },
      { name: '三明', longitude: 117.6 },
      { name: '泉州', longitude: 118.7 },
      { name: '漳州', longitude: 117.6 },
      { name: '南平', longitude: 118.2 },
      { name: '龙岩', longitude: 117.0 },
      { name: '宁德', longitude: 119.5 },
    ],
  },
  {
    name: '江西省',
    cities: [
      { name: '南昌', longitude: 115.9 },
      { name: '景德镇', longitude: 117.2 },
      { name: '萍乡', longitude: 113.9 },
      { name: '九江', longitude: 116.0 },
      { name: '新余', longitude: 114.9 },
      { name: '鹰潭', longitude: 117.1 },
      { name: '赣州', longitude: 114.9 },
      { name: '吉安', longitude: 114.9 },
      { name: '宜春', longitude: 114.4 },
      { name: '抚州', longitude: 116.4 },
      { name: '上饶', longitude: 117.9 },
    ],
  },
  {
    name: '山东省',
    cities: [
      { name: '济南', longitude: 117.0 },
      { name: '青岛', longitude: 120.4 },
      { name: '淄博', longitude: 118.1 },
      { name: '枣庄', longitude: 117.6 },
      { name: '东营', longitude: 118.7 },
      { name: '烟台', longitude: 121.4 },
      { name: '潍坊', longitude: 119.1 },
      { name: '济宁', longitude: 116.6 },
      { name: '泰安', longitude: 117.1 },
      { name: '威海', longitude: 122.1 },
      { name: '日照', longitude: 119.5 },
      { name: '临沂', longitude: 118.4 },
      { name: '德州', longitude: 116.4 },
      { name: '聊城', longitude: 116.0 },
      { name: '滨州', longitude: 118.0 },
      { name: '菏泽', longitude: 115.5 },
    ],
  },

  // ─── 华中 ─────────────────────────────────────────────
  {
    name: '河南省',
    cities: [
      { name: '郑州', longitude: 113.6 },
      { name: '开封', longitude: 114.3 },
      { name: '洛阳', longitude: 112.5 },
      { name: '平顶山', longitude: 113.3 },
      { name: '安阳', longitude: 114.4 },
      { name: '鹤壁', longitude: 114.3 },
      { name: '新乡', longitude: 113.9 },
      { name: '焦作', longitude: 113.2 },
      { name: '濮阳', longitude: 115.0 },
      { name: '许昌', longitude: 113.8 },
      { name: '漯河', longitude: 114.0 },
      { name: '三门峡', longitude: 111.2 },
      { name: '南阳', longitude: 112.5 },
      { name: '商丘', longitude: 115.6 },
      { name: '信阳', longitude: 114.1 },
      { name: '周口', longitude: 114.7 },
      { name: '驻马店', longitude: 114.0 },
      { name: '济源', longitude: 112.6 },
    ],
  },
  {
    name: '湖北省',
    cities: [
      { name: '武汉', longitude: 114.3 },
      { name: '黄石', longitude: 115.0 },
      { name: '十堰', longitude: 110.8 },
      { name: '宜昌', longitude: 111.3 },
      { name: '襄阳', longitude: 112.1 },
      { name: '鄂州', longitude: 114.9 },
      { name: '荆门', longitude: 112.2 },
      { name: '孝感', longitude: 113.9 },
      { name: '荆州', longitude: 112.2 },
      { name: '黄冈', longitude: 114.9 },
      { name: '咸宁', longitude: 114.3 },
      { name: '随州', longitude: 113.4 },
      { name: '恩施', longitude: 109.5 },
      { name: '仙桃', longitude: 113.4 },
      { name: '潜江', longitude: 112.9 },
      { name: '天门', longitude: 113.2 },
      // ★ 2026-10-07 补省直辖县级单位（经度取 data/geo/cn-counties-2023.json）
      { name: '神农架', longitude: 110.67 },
    ],
  },
  {
    name: '湖南省',
    cities: [
      { name: '长沙', longitude: 113.0 },
      { name: '株洲', longitude: 113.1 },
      { name: '湘潭', longitude: 112.9 },
      { name: '衡阳', longitude: 112.6 },
      { name: '邵阳', longitude: 111.5 },
      { name: '岳阳', longitude: 113.1 },
      { name: '常德', longitude: 111.7 },
      { name: '张家界', longitude: 110.5 },
      { name: '益阳', longitude: 112.4 },
      { name: '郴州', longitude: 113.0 },
      { name: '永州', longitude: 111.6 },
      { name: '怀化', longitude: 110.0 },
      { name: '娄底', longitude: 112.0 },
      { name: '湘西', longitude: 109.7 },
    ],
  },

  // ─── 华南 ─────────────────────────────────────────────
  {
    name: '广东省',
    cities: [
      { name: '广州', longitude: 113.3 },
      { name: '深圳', longitude: 114.1 },
      { name: '珠海', longitude: 113.6 },
      { name: '佛山', longitude: 113.1 },
      { name: '东莞', longitude: 113.8 },
      { name: '中山', longitude: 113.4 },
      { name: '江门', longitude: 113.1 },
      { name: '惠州', longitude: 114.4 },
      { name: '汕头', longitude: 116.7 },
      { name: '湛江', longitude: 110.4 },
      { name: '茂名', longitude: 110.9 },
      { name: '肇庆', longitude: 112.5 },
      { name: '梅州', longitude: 116.1 },
      { name: '韶关', longitude: 113.6 },
      { name: '阳江', longitude: 111.9 },
      { name: '清远', longitude: 113.1 },
      { name: '潮州', longitude: 116.6 },
      { name: '揭阳', longitude: 116.4 },
      { name: '云浮', longitude: 112.0 },
      { name: '汕尾', longitude: 115.4 },
      { name: '河源', longitude: 114.7 },
    ],
  },
  {
    name: '广西壮族自治区',
    cities: [
      { name: '南宁', longitude: 108.3 },
      { name: '柳州', longitude: 109.4 },
      { name: '桂林', longitude: 110.3 },
      { name: '梧州', longitude: 111.3 },
      { name: '北海', longitude: 109.1 },
      { name: '防城港', longitude: 108.4 },
      { name: '钦州', longitude: 108.6 },
      { name: '贵港', longitude: 109.6 },
      { name: '玉林', longitude: 110.2 },
      { name: '百色', longitude: 106.6 },
      { name: '贺州', longitude: 111.6 },
      { name: '河池', longitude: 108.1 },
      { name: '来宾', longitude: 109.2 },
      { name: '崇左', longitude: 107.4 },
    ],
  },
  {
    name: '海南省',
    cities: [
      { name: '海口', longitude: 110.3 },
      { name: '三亚', longitude: 109.5 },
      { name: '儋州', longitude: 109.6 },
      { name: '文昌', longitude: 110.8 },
      { name: '琼海', longitude: 110.5 },
      { name: '万宁', longitude: 110.4 },
      { name: '陵水', longitude: 110.0 },
      { name: '乐东', longitude: 109.2 },
      { name: '五指山', longitude: 109.5 },
      // ★ 2026-10-07 补齐省直辖市县（经度取 data/geo/cn-counties-2023.json）
      { name: '东方', longitude: 108.65 },
      { name: '定安', longitude: 110.33 },
      { name: '屯昌', longitude: 110.1 },
      { name: '澄迈', longitude: 109.99 },
      { name: '临高', longitude: 109.71 },
      { name: '白沙', longitude: 109.45 },
      { name: '昌江', longitude: 109.08 },
      { name: '保亭', longitude: 109.67 },
      { name: '琼中', longitude: 109.85 },
      { name: '三沙（中国最南）', longitude: 112.3 },
    ],
  },

  // ─── 西南 ─────────────────────────────────────────────
  {
    name: '四川省',
    cities: [
      { name: '成都', longitude: 104.1 },
      { name: '绵阳', longitude: 104.7 },
      { name: '德阳', longitude: 104.4 },
      { name: '宜宾', longitude: 104.6 },
      { name: '泸州', longitude: 105.4 },
      { name: '达州', longitude: 107.5 },
      { name: '南充', longitude: 106.1 },
      { name: '乐山', longitude: 103.8 },
      { name: '自贡', longitude: 104.8 },
      { name: '攀枝花', longitude: 101.7 },
      { name: '遂宁', longitude: 105.6 },
      { name: '内江', longitude: 105.1 },
      { name: '广元', longitude: 105.8 },
      { name: '雅安', longitude: 103.0 },
      { name: '巴中', longitude: 106.8 },
      { name: '资阳', longitude: 104.6 },
      { name: '广安', longitude: 106.6 },
      { name: '眉山', longitude: 103.8 },
      { name: '凉山', longitude: 102.3 },
      { name: '甘孜', longitude: 101.9 },
      { name: '阿坝', longitude: 102.2 },
    ],
  },
  {
    name: '贵州省',
    cities: [
      { name: '贵阳', longitude: 106.7 },
      { name: '遵义', longitude: 106.9 },
      { name: '六盘水', longitude: 104.8 },
      { name: '安顺', longitude: 105.9 },
      { name: '毕节', longitude: 105.3 },
      { name: '铜仁', longitude: 109.2 },
      { name: '黔西南', longitude: 104.9 },
      { name: '黔东南', longitude: 107.9 },
      { name: '黔南', longitude: 107.5 },
    ],
  },
  {
    name: '云南省',
    cities: [
      { name: '昆明', longitude: 102.7 },
      { name: '曲靖', longitude: 103.8 },
      { name: '玉溪', longitude: 102.5 },
      { name: '保山', longitude: 99.2 },
      { name: '昭通', longitude: 103.7 },
      { name: '丽江', longitude: 100.2 },
      { name: '普洱', longitude: 101.0 },
      { name: '临沧', longitude: 100.1 },
      { name: '楚雄', longitude: 101.5 },
      { name: '红河', longitude: 103.5 },
      { name: '文山', longitude: 104.2 },
      { name: '西双版纳', longitude: 100.8 },
      { name: '大理', longitude: 100.2 },
      { name: '德宏', longitude: 98.6 },
      { name: '怒江', longitude: 98.8 },
      { name: '迪庆', longitude: 99.7 },
    ],
  },
  {
    name: '西藏自治区',
    cities: [
      { name: '拉萨', longitude: 91.1 },
      { name: '日喀则', longitude: 88.9 },
      { name: '昌都', longitude: 97.2 },
      { name: '林芝', longitude: 94.4 },
      { name: '山南', longitude: 91.8 },
      { name: '那曲', longitude: 92.1 },
      { name: '阿里', longitude: 80.1 },
    ],
  },

  // ─── 西北 ─────────────────────────────────────────────
  {
    name: '陕西省',
    cities: [
      { name: '西安', longitude: 108.9 },
      { name: '咸阳', longitude: 108.7 },
      { name: '宝鸡', longitude: 107.2 },
      { name: '铜川', longitude: 109.1 },
      { name: '渭南', longitude: 109.5 },
      { name: '延安', longitude: 109.5 },
      { name: '汉中', longitude: 107.1 },
      { name: '榆林', longitude: 109.7 },
      { name: '安康', longitude: 109.0 },
      { name: '商洛', longitude: 109.9 },
    ],
  },
  {
    name: '甘肃省',
    cities: [
      { name: '兰州', longitude: 103.8 },
      { name: '嘉峪关', longitude: 98.3 },
      { name: '金昌', longitude: 102.2 },
      { name: '白银', longitude: 104.2 },
      { name: '天水', longitude: 105.7 },
      { name: '武威', longitude: 102.6 },
      { name: '张掖', longitude: 100.5 },
      { name: '平凉', longitude: 106.7 },
      { name: '酒泉', longitude: 98.5 },
      { name: '庆阳', longitude: 107.6 },
      { name: '定西', longitude: 104.6 },
      { name: '陇南', longitude: 104.9 },
      { name: '临夏', longitude: 103.2 },
      { name: '甘南', longitude: 102.9 },
    ],
  },
  {
    name: '青海省',
    cities: [
      { name: '西宁', longitude: 101.8 },
      { name: '海东', longitude: 102.1 },
      { name: '格尔木', longitude: 94.9 },
      { name: '德令哈', longitude: 97.4 },
      { name: '玉树', longitude: 97.0 },
      { name: '果洛', longitude: 100.2 },
      { name: '海西', longitude: 97.4 },
      { name: '海北', longitude: 100.9 },
      { name: '黄南', longitude: 102.0 },
      { name: '海南州', longitude: 100.6 },
    ],
  },
  {
    name: '宁夏回族自治区',
    cities: [
      { name: '银川', longitude: 106.3 },
      { name: '石嘴山', longitude: 106.4 },
      { name: '吴忠', longitude: 106.2 },
      { name: '固原', longitude: 106.3 },
      { name: '中卫', longitude: 105.2 },
    ],
  },
  {
    name: '新疆维吾尔自治区',
    cities: [
      { name: '乌鲁木齐', longitude: 87.6 },
      { name: '克拉玛依', longitude: 84.9 },
      { name: '吐鲁番', longitude: 89.2 },
      { name: '哈密', longitude: 93.5 },
      { name: '昌吉', longitude: 87.3 },
      { name: '博尔塔拉', longitude: 82.1 },
      { name: '巴音郭楞', longitude: 86.2 },
      { name: '阿克苏', longitude: 80.3 },
      { name: '克孜勒苏', longitude: 76.2 },
      { name: '喀什', longitude: 75.9 },
      { name: '和田', longitude: 79.9 },
      { name: '伊犁', longitude: 81.3 },
      { name: '塔城', longitude: 83.0 },
      { name: '阿勒泰', longitude: 88.1 },
      { name: '石河子', longitude: 86.1 },
      // ★ 2026-10-07 补齐自治区直辖县级市（兵团各市，经度取 data/geo/cn-counties-2023.json）
      { name: '阿拉尔', longitude: 81.27 },
      { name: '图木舒克', longitude: 79.07 },
      { name: '五家渠', longitude: 87.54 },
      { name: '北屯', longitude: 87.82 },
      { name: '铁门关', longitude: 85.65 },
      { name: '双河', longitude: 82.35 },
      { name: '可克达拉', longitude: 81.0 },
      { name: '昆玉', longitude: 79.29 },
      { name: '胡杨河', longitude: 84.83 },
      { name: '新星', longitude: 93.75 },
      { name: '白杨', longitude: 82.9 },
      { name: '塔什库尔干（中国最西）', longitude: 75.2 },
    ],
  },

  // ─── 特别行政区 / 台湾 ──────────────────────────────────
  {
    name: '香港特别行政区',
    cities: [
      { name: '香港', longitude: 114.2 },
      { name: '九龙', longitude: 114.2 },
      { name: '新界', longitude: 114.2 },
    ],
  },
  {
    name: '澳门特别行政区',
    cities: [
      { name: '澳门', longitude: 113.5 },
      { name: '氹仔', longitude: 113.6 },
      { name: '路环', longitude: 113.6 },
    ],
  },
  {
    name: '台湾省',
    cities: [
      { name: '台北', longitude: 121.5 },
      { name: '新北', longitude: 121.5 },
      { name: '桃园', longitude: 121.3 },
      { name: '台中', longitude: 120.7 },
      { name: '台南', longitude: 120.2 },
      { name: '高雄', longitude: 120.3 },
      { name: '基隆', longitude: 121.7 },
      { name: '新竹', longitude: 120.9 },
      { name: '嘉义', longitude: 120.4 },
      { name: '苗栗', longitude: 120.8 },
      { name: '彰化', longitude: 120.5 },
      { name: '南投', longitude: 120.7 },
      { name: '云林', longitude: 120.5 },
      { name: '屏东', longitude: 120.5 },
      { name: '宜兰', longitude: 121.7 },
      { name: '花莲', longitude: 121.6 },
      { name: '台东', longitude: 121.1 },
      { name: '澎湖', longitude: 119.6 },
      { name: '金门', longitude: 118.3 },
      { name: '连江', longitude: 119.9 },
    ],
  },

  // 注：海外出生暂未支持，因 share.ts 真太阳时算法假设输入为北京时间(UTC+8)。
  // 海外用户请把当地时间换算成北京时间再填写（或填出生时所在的中国时区相对城市）。
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Việt Nam — 63 tỉnh/thành (đơn vị hành chính trước 2025; giữ đủ để người sinh
 * trước đây chọn đúng nơi sinh). Mỗi tỉnh có tỉnh lỵ + toàn bộ quận/huyện/thị xã
 * (kinh độ tâm đơn vị hành chính, xem `vn-districts.generated.ts`). Cấp huyện quan trọng
 * vì trong cùng một tỉnh, kinh độ có thể lệch ~0,5° ≈ 2 phút, và tỉnh trải dài (Lai Châu,
 * Điện Biên, Cà Mau…) lệch tới ~20 phút — đủ để đổi canh giờ khi sinh sát ranh giới.
 *
 * `calendarZone: 'vn'` → lá số dùng âm lịch Việt Nam (UTC+7, kinh tuyến 105°Đ).
 * `region` chỉ dùng cho độ lệch giờ lịch sử trước 1975-06-13 (xem calendar-zone.ts):
 * miền Nam dùng giờ Sài Gòn UTC+8 từ 1960, miền Bắc UTC+7 từ 1968.
 * ───────────────────────────────────────────────────────────────────────────── */
const VN_NORTH: VietnamRegion = 'north';
const VN_SOUTH: VietnamRegion = 'south';

const DISTRICT_PREFIX = /^(Quận|Huyện|Thị xã|Thành phố|Thị trấn)\s+/u;

/** Tên rút gọn để so trùng: bỏ tiền tố loại đơn vị, chuẩn hoá khoảng trắng quanh dấu gạch nối. */
const shortPlaceName = (name: string) =>
  name.normalize('NFC').replace(DISTRICT_PREFIX, '').replace(/\s*-\s*/g, '-').trim().toLowerCase();

/**
 * Tỉnh Việt Nam + danh sách quận/huyện của tỉnh đó.
 *
 * Tỉnh lỵ vẫn đứng đầu danh sách (giữ tên ngắn cũ) để link chia sẻ / lá số đã lưu trước đây
 * vẫn chọn đúng; các quận/huyện còn lại lấy từ `vn-districts.generated.ts`.
 */
function vnProvince(name: string, capital: string, longitude: number, region: 'north' | 'south'): ProvinceInfo {
  const seen = new Set([shortPlaceName(capital)]);
  const districts = (VN_DISTRICTS[name] ?? []).filter((d) => {
    const key = shortPlaceName(d.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    name,
    calendarZone: 'vn',
    region,
    cities: [{ name: capital, longitude }, ...districts.map((d) => ({ name: d.name, longitude: d.longitude }))],
  };
}

export const VN_PROVINCES: ProvinceInfo[] = [
  // ─── Miền Bắc ───
  vnProvince('Hà Nội', 'Hà Nội', 105.85, VN_NORTH),
  vnProvince('Hải Phòng', 'Hải Phòng', 106.68, VN_NORTH),
  vnProvince('Quảng Ninh', 'Hạ Long', 107.08, VN_NORTH),
  vnProvince('Hải Dương', 'Hải Dương', 106.33, VN_NORTH),
  vnProvince('Hưng Yên', 'Hưng Yên', 106.05, VN_NORTH),
  vnProvince('Bắc Ninh', 'Bắc Ninh', 106.08, VN_NORTH),
  vnProvince('Bắc Giang', 'Bắc Giang', 106.20, VN_NORTH),
  vnProvince('Vĩnh Phúc', 'Vĩnh Yên', 105.60, VN_NORTH),
  vnProvince('Thái Nguyên', 'Thái Nguyên', 105.85, VN_NORTH),
  vnProvince('Lạng Sơn', 'Lạng Sơn', 106.76, VN_NORTH),
  vnProvince('Cao Bằng', 'Cao Bằng', 106.25, VN_NORTH),
  vnProvince('Bắc Kạn', 'Bắc Kạn', 105.83, VN_NORTH),
  vnProvince('Tuyên Quang', 'Tuyên Quang', 105.22, VN_NORTH),
  vnProvince('Hà Giang', 'Hà Giang', 104.98, VN_NORTH),
  vnProvince('Lào Cai', 'Lào Cai', 103.97, VN_NORTH),
  vnProvince('Yên Bái', 'Yên Bái', 104.87, VN_NORTH),
  vnProvince('Phú Thọ', 'Việt Trì', 105.40, VN_NORTH),
  vnProvince('Điện Biên', 'Điện Biên Phủ', 103.02, VN_NORTH),
  vnProvince('Lai Châu', 'Lai Châu', 103.46, VN_NORTH),
  vnProvince('Sơn La', 'Sơn La', 103.91, VN_NORTH),
  vnProvince('Hòa Bình', 'Hòa Bình', 105.34, VN_NORTH),
  vnProvince('Hà Nam', 'Phủ Lý', 105.92, VN_NORTH),
  vnProvince('Thái Bình', 'Thái Bình', 106.34, VN_NORTH),
  vnProvince('Nam Định', 'Nam Định', 106.17, VN_NORTH),
  vnProvince('Ninh Bình', 'Ninh Bình', 105.97, VN_NORTH),
  vnProvince('Thanh Hóa', 'Thanh Hóa', 105.78, VN_NORTH),
  vnProvince('Nghệ An', 'Vinh', 105.68, VN_NORTH),
  vnProvince('Hà Tĩnh', 'Hà Tĩnh', 105.90, VN_NORTH),
  vnProvince('Quảng Bình', 'Đồng Hới', 106.60, VN_NORTH),

  // ─── Miền Trung & Tây Nguyên ───
  vnProvince('Quảng Trị', 'Đông Hà', 106.58, VN_SOUTH),
  vnProvince('Thừa Thiên Huế', 'Huế', 107.60, VN_SOUTH),
  vnProvince('Đà Nẵng', 'Đà Nẵng', 108.22, VN_SOUTH),
  vnProvince('Quảng Nam', 'Tam Kỳ', 108.47, VN_SOUTH),
  vnProvince('Quảng Ngãi', 'Quảng Ngãi', 108.80, VN_SOUTH),
  vnProvince('Bình Định', 'Quy Nhơn', 109.22, VN_SOUTH),
  vnProvince('Phú Yên', 'Tuy Hòa', 109.30, VN_SOUTH),
  vnProvince('Khánh Hòa', 'Nha Trang', 109.19, VN_SOUTH),
  vnProvince('Ninh Thuận', 'Phan Rang - Tháp Chàm', 108.99, VN_SOUTH),
  vnProvince('Bình Thuận', 'Phan Thiết', 108.10, VN_SOUTH),
  vnProvince('Kon Tum', 'Kon Tum', 108.00, VN_SOUTH),
  vnProvince('Gia Lai', 'Pleiku', 107.98, VN_SOUTH),
  vnProvince('Đắk Lắk', 'Buôn Ma Thuột', 108.05, VN_SOUTH),
  vnProvince('Đắk Nông', 'Gia Nghĩa', 107.69, VN_SOUTH),
  vnProvince('Lâm Đồng', 'Đà Lạt', 108.44, VN_SOUTH),

  // ─── Miền Nam ───
  vnProvince('Bình Phước', 'Đồng Xoài', 106.90, VN_SOUTH),
  vnProvince('Tây Ninh', 'Tây Ninh', 106.10, VN_SOUTH),
  vnProvince('Bình Dương', 'Thủ Dầu Một', 106.65, VN_SOUTH),
  vnProvince('Đồng Nai', 'Biên Hòa', 106.82, VN_SOUTH),
  vnProvince('Bà Rịa - Vũng Tàu', 'Vũng Tàu', 107.08, VN_SOUTH),
  vnProvince('TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 106.70, VN_SOUTH),
  vnProvince('Long An', 'Tân An', 106.41, VN_SOUTH),
  vnProvince('Tiền Giang', 'Mỹ Tho', 106.36, VN_SOUTH),
  vnProvince('Bến Tre', 'Bến Tre', 106.37, VN_SOUTH),
  vnProvince('Trà Vinh', 'Trà Vinh', 106.34, VN_SOUTH),
  vnProvince('Vĩnh Long', 'Vĩnh Long', 105.97, VN_SOUTH),
  vnProvince('Đồng Tháp', 'Cao Lãnh', 105.63, VN_SOUTH),
  vnProvince('An Giang', 'Long Xuyên', 105.43, VN_SOUTH),
  vnProvince('Kiên Giang', 'Rạch Giá', 105.08, VN_SOUTH),
  vnProvince('Cần Thơ', 'Cần Thơ', 105.78, VN_SOUTH),
  vnProvince('Hậu Giang', 'Vị Thanh', 105.47, VN_SOUTH),
  vnProvince('Sóc Trăng', 'Sóc Trăng', 105.97, VN_SOUTH),
  vnProvince('Bạc Liêu', 'Bạc Liêu', 105.72, VN_SOUTH),
  vnProvince('Cà Mau', 'Cà Mau', 105.15, VN_SOUTH),
];

/** Toàn bộ địa danh chọn được (Việt Nam trước, Trung Quốc sau). */
export const ALL_PROVINCES: ProvinceInfo[] = [...VN_PROVINCES, ...PROVINCES];

/** Nhóm địa danh theo quốc gia — dùng cho <optgroup> trong form. */
export const PLACE_GROUPS: ReadonlyArray<{ id: 'vn' | 'cn'; provinces: ProvinceInfo[] }> = [
  { id: 'vn', provinces: VN_PROVINCES },
  { id: 'cn', provinces: PROVINCES },
];

export function findProvince(name: string): ProvinceInfo | undefined {
  return ALL_PROVINCES.find((p) => p.name === name);
}

export function findCity(provinceName: string, cityName: string): CityInfo | undefined {
  return findProvince(provinceName)?.cities.find((c) => c.name === cityName);
}
