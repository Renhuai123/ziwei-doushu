/**
 * Lớp hiển thị: tra chữ Hán gốc (dùng làm khóa logic trong engine) → nhãn tiếng Việt (Hán Việt).
 * KHÔNG dùng các nhãn tiếng Việt này làm khóa so sánh/tra cứu trong logic — chỉ dùng khi render UI.
 * Nguồn thuật ngữ: docs/i18n/glossary-ziwei.md — cập nhật đồng thời khi thêm thuật ngữ mới.
 */

const PALACE_NAME_VI: Record<string, string> = {
  // Dạng có hậu tố "宫" (dùng trong constants.ts/PALACE_NAMES_ORDER và văn bản cổ thư)
  '命宫': 'Cung Mệnh',
  '兄弟宫': 'Cung Huynh Đệ',
  '夫妻宫': 'Cung Phu Thê',
  '子女宫': 'Cung Tử Nữ',
  '财帛宫': 'Cung Tài Bạch',
  '疾厄宫': 'Cung Tật Ách',
  '迁移宫': 'Cung Thiên Di',
  '交友宫': 'Cung Giao Hữu',
  '官禄宫': 'Cung Quan Lộc',
  '田宅宫': 'Cung Điền Trạch',
  '福德宫': 'Cung Phúc Đức',
  '父母宫': 'Cung Phụ Mẫu',
  '身宫': 'Cung Thân',
  // Dạng không hậu tố "宫" (thư viện iztro dùng cho Palace.name, xem node_modules/iztro/lib/i18n/locales/zh-CN/palace.js)
  '兄弟': 'Cung Huynh Đệ',
  '夫妻': 'Cung Phu Thê',
  '子女': 'Cung Tử Nữ',
  '财帛': 'Cung Tài Bạch',
  '疾厄': 'Cung Tật Ách',
  '迁移': 'Cung Thiên Di',
  '仆役': 'Cung Giao Hữu',
  '官禄': 'Cung Quan Lộc',
  '田宅': 'Cung Điền Trạch',
  '福德': 'Cung Phúc Đức',
  '父母': 'Cung Phụ Mẫu',
  '来因': 'Cung Lai Nhân',
};

const STAR_NAME_VI: Record<string, string> = {
  '紫微': 'Tử Vi', '天机': 'Thiên Cơ', '太阳': 'Thái Dương', '武曲': 'Vũ Khúc',
  '天同': 'Thiên Đồng', '廉贞': 'Liêm Trinh', '天府': 'Thiên Phủ', '太阴': 'Thái Âm',
  '贪狼': 'Tham Lang', '巨门': 'Cự Môn', '天相': 'Thiên Tướng', '天梁': 'Thiên Lương',
  '七杀': 'Thất Sát', '破军': 'Phá Quân',
  '文昌': 'Văn Xương', '文曲': 'Văn Khúc', '左辅': 'Tả Phụ', '右弼': 'Hữu Bật',
  '天魁': 'Thiên Khôi', '天钺': 'Thiên Việt', '禄存': 'Lộc Tồn', '天马': 'Thiên Mã',
  '擎羊': 'Kình Dương', '陀罗': 'Đà La', '火星': 'Hỏa Tinh', '铃星': 'Linh Tinh',
  '地空': 'Địa Không', '地劫': 'Địa Kiếp', '天刑': 'Thiên Hình', '天姚': 'Thiên Diêu',
  '天哭': 'Thiên Khốc', '天虚': 'Thiên Hư', '天月': 'Thiên Nguyệt', '阴煞': 'Âm Sát',
  '蜚廉': 'Phi Liêm', '空亡': 'Không Vong', '孤辰': 'Cô Thần', '寡宿': 'Quả Tú',
  '天官': 'Thiên Quan', '天福': 'Thiên Phúc', '天才': 'Thiên Tài', '天寿': 'Thiên Thọ',
  '三台': 'Tam Thai', '八座': 'Bát Tọa', '恩光': 'Ân Quang', '天贵': 'Thiên Quý',
  '台辅': 'Thai Phụ', '龙池': 'Long Trì', '凤阁': 'Phượng Các', '红鸾': 'Hồng Loan',
  '天喜': 'Thiên Hỷ', '解神': 'Giải Thần', '天德': 'Thiên Đức', '月德': 'Nguyệt Đức',
  '年解': 'Niên Giải', '天巫': 'Thiên Vu', '华盖': 'Hoa Cái', '封诰': 'Phong Cáo',
  '破碎': 'Phá Toái', '天厨': 'Thiên Trù',
  // Nhóm Tuần Không / Triệt Không và sao phụ hiếm gặp (xem SHA_STARS trong lib/ziwei/algorithm.ts)
  '天空': 'Thiên Không', '旬空': 'Tuần Không', '副旬': 'Phó Tuần',
  '截路': 'Triệt Lộ', '截空': 'Triệt Không', '副截': 'Phó Triệt',
  '大耗': 'Đại Hao', '天使': 'Thiên Sứ', '天伤': 'Thiên Thương',
};

const SIHUA_NAME_VI: Record<string, string> = {
  '化禄': 'Hóa Lộc', '化权': 'Hóa Quyền', '化科': 'Hóa Khoa', '化忌': 'Hóa Kỵ',
};

const SHISHEN_NAME_VI: Record<string, string> = {
  '将星': 'Tướng Tinh', '攀鞍': 'Phàn Yên', '岁驿': 'Tuế Dịch', '息神': 'Tức Thần',
  '劫煞': 'Kiếp Sát', '灾煞': 'Tai Sát', '天煞': 'Thiên Sát', '指背': 'Chỉ Bối',
  '咸池': 'Hàm Trì', '月煞': 'Nguyệt Sát', '亡神': 'Vong Thần',
  '岁建': 'Tuế Kiến', '晦气': 'Hối Khí', '丧门': 'Tang Môn', '贯索': 'Quán Sách',
  '官符': 'Quan Phù', '小耗': 'Tiểu Hao', '岁破': 'Tuế Phá', '龙德': 'Long Đức',
  '白虎': 'Bạch Hổ', '吊客': 'Điếu Khách', '病符': 'Bệnh Phù',
  '博士': 'Bác Sĩ', '力士': 'Lực Sĩ', '青龙': 'Thanh Long', '将军': 'Tướng Quân',
  '奏书': 'Tấu Thư', '喜神': 'Hỷ Thần', '大耗': 'Đại Hao', '伏兵': 'Phục Binh',
};

const STEM_NAME_VI: Record<string, string> = {
  '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
  '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý',
};

const BRANCH_NAME_VI: Record<string, string> = {
  '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
  '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi',
};

const ELEMENT_NAME_VI: Record<string, string> = {
  '金': 'Kim', '木': 'Mộc', '水': 'Thủy', '火': 'Hỏa', '土': 'Thổ',
};

const JU_NAME_VI: Record<string, string> = {
  '水二局': 'Thủy Nhị Cục', '木三局': 'Mộc Tam Cục', '金四局': 'Kim Tứ Cục',
  '土五局': 'Thổ Ngũ Cục', '火六局': 'Hỏa Lục Cục',
};

const PROVINCE_NAME_VI: Record<string, string> = {
  '北京市': 'Thành phố Bắc Kinh',
  '天津市': 'Thành phố Thiên Tân',
  '上海市': 'Thành phố Thượng Hải',
  '重庆市': 'Thành phố Trùng Khánh',
  '河北省': 'Tỉnh Hà Bắc',
  '山西省': 'Tỉnh Sơn Tây',
  '内蒙古自治区': 'Khu tự trị Nội Mông',
  '辽宁省': 'Tỉnh Liêu Ninh',
  '吉林省': 'Tỉnh Cát Lâm',
  '黑龙江省': 'Tỉnh Hắc Long Giang',
  '江苏省': 'Tỉnh Giang Tô',
  '浙江省': 'Tỉnh Chiết Giang',
  '安徽省': 'Tỉnh An Huy',
  '福建省': 'Tỉnh Phúc Kiến',
  '江西省': 'Tỉnh Giang Tây',
  '山东省': 'Tỉnh Sơn Đông',
  '河南省': 'Tỉnh Hà Nam',
  '湖北省': 'Tỉnh Hồ Bắc',
  '湖南省': 'Tỉnh Hồ Nam',
  '广东省': 'Tỉnh Quảng Đông',
  '广西壮族自治区': 'Khu tự trị Quảng Tây',
  '海南省': 'Tỉnh Hải Nam',
  '四川省': 'Tỉnh Tứ Xuyên',
  '贵州省': 'Tỉnh Quý Châu',
  '云南省': 'Tỉnh Vân Nam',
  '西藏自治区': 'Khu tự trị Tây Tạng',
  '陕西省': 'Tỉnh Thiểm Tây',
  '甘肃省': 'Tỉnh Cam Túc',
  '青海省': 'Tỉnh Thanh Hải',
  '宁夏回族自治区': 'Khu tự trị Ninh Hạ',
  '新疆维吾尔自治区': 'Khu tự trị Tân Cương',
  '香港特别行政区': 'Đặc khu Hồng Kông',
  '澳门特别行政区': 'Đặc khu Ma Cao',
  '台湾省': 'Tỉnh Đài Loan',
};

const CITY_NAME_VI: Record<string, string> = {
  '北京': 'Bắc Kinh', '天津': 'Thiên Tân', '上海': 'Thượng Hải', '重庆': 'Trùng Khánh',
  '广州': 'Quảng Châu', '深圳': 'Thâm Quyến', '珠海': 'Chu Hải', '佛山': 'Phật Sơn',
  '东莞': 'Đông Hoàn', '中山': 'Trung Sơn', '汕头': 'Sán Đầu', '惠州': 'Huệ Châu',
  '江门': 'Giang Môn', '湛江': 'Trạm Giang', '茂名': 'Mậu Danh', '肇庆': 'Triệu Khánh',
  '杭州': 'Hàng Châu', '宁波': 'Ninh Ba', '温州': 'Ôn Châu', '嘉兴': 'Gia Hưng',
  '湖州': 'Hồ Châu', '绍兴': 'Thiệu Hưng', '金华': 'Kim Hoa', '衢州': 'Cù Châu',
  '舟山': 'Chu Sơn', '台州': 'Thai Châu', '丽水': 'Lệ Thủy',
  '南京': 'Nam Kinh', '无锡': 'Vô Tích', '徐州': 'Từ Châu', '常州': 'Thường Châu',
  '苏州': 'Tô Châu', '南通': 'Nam Thông', '连云港': 'Liên Vân Cảng', '淮安': 'Hoài An',
  '盐城': 'Diêm Thành', '扬州': 'Dương Châu', '镇江': 'Trấn Giang', '泰州': 'Thái Châu',
  '宿迁': 'Túc Thiên',
  '成都': 'Thành Đô', '绵阳': 'Miên Dương', '自贡': 'Tự Cống', '攀枝花': 'Phan Chi Hoa',
  '泸州': 'Lô Châu', '德阳': 'Đức Dương', '广元': 'Quảng Nguyên', '遂宁': 'Toại Ninh',
  '内江': 'Nội Giang', '乐山': 'Lạc Sơn', '南充': 'Nam Sung', '眉山': 'Mi Sơn',
  '宜宾': 'Nghi Tân', '广安': 'Quảng An', '达州': 'Đạt Châu', '雅安': 'Nhã An',
  '巴中': 'Ba Trung', '资阳': 'Tư Dương',
  '武汉': 'Vũ Hán', '黄石': 'Hoàng Thạch', '十堰': 'Thập Yển', '宜昌': 'Nghi Xương',
  '襄阳': 'Tương Dương', '鄂州': 'Ngạc Châu', '荆门': 'Kinh Môn', '孝感': 'Hiếu Cảm',
  '荆州': 'Kinh Châu', '黄冈': 'Hoàng Cương', '咸宁': 'Hàm Ninh', '随州': 'Tùy Châu',
  '恩施': 'Ân Thi',
  '长沙': 'Trường Sa', '株洲': 'Chu Châu', '湘潭': 'Tương Đàm', '衡阳': 'Hành Dương',
  '邵阳': 'Thiệu Dương', '岳阳': 'Nhạc Dương', '常德': 'Thường Đức', '张家界': 'Trương Gia Giới',
  '益阳': 'Ích Dương', '郴州': 'Sâm Châu', '永州': 'Vĩnh Châu', '怀化': 'Hoài Hóa',
  '娄底': 'Lâu Đáy', '湘西': 'Tương Tây',
  '福州': 'Phúc Châu', '厦门': 'Hạ Môn', '莆田': 'Bồ Điền', '三明': 'Tam Minh',
  '泉州': 'Tuyền Châu', '漳州': 'Chương Châu', '南平': 'Nam Bình', '龙岩': 'Long Nham',
  '宁德': 'Ninh Đức',
  '西安': 'Tây An', '铜川': 'Đồng Xuyên', '宝鸡': 'Bảo Kê', '咸阳': 'Hàm Dương',
  '渭南': 'Vị Nam', '延安': 'Diên An', '汉中': 'Hán Trung', '榆林': 'Du Lâm',
  '安康': 'An Khang', '商洛': 'Thương Lạc',
  '济南': 'Tế Nam', '青岛': 'Thanh Đảo', '淄博': 'Truy Bác', '枣庄': 'Tảo Trang',
  '东营': 'Đông Dinh', '烟台': 'Yên Đài', '潍坊': 'Duy Phường', '济宁': 'Tế Ninh',
  '泰安': 'Thái An', '威海': 'Uy Hải', '日照': 'Nhật Chiếu', '临沂': 'Lâm Nghi',
  '德州': 'Đức Châu', '聊城': 'Liêu Thành', '滨州': 'Tân Châu', '菏泽': 'Hà Trạch',
  '郑州': 'Trịnh Châu', '开封': 'Khai Phong', '洛阳': 'Lạc Dương', '平顶山': 'Bình Đỉnh Sơn',
  '安阳': 'An Dương', '鹤壁': 'Hạc Bích', '新乡': 'Tân Hương', '焦作': 'Tiêu Tác',
  '濮阳': 'Bộc Dương', '许昌': 'Hứa Xương', '漯河': 'Tháp Hà', '三门峡': 'Tam Môn Hiệp',
  '南阳': 'Nam Dương', '商丘': 'Thương Khâu', '信阳': 'Tín Dương', '周口': 'Chu Khẩu',
  '驻马店': 'Trú Mã Điếm',
  '石家庄': 'Thạch Gia Trang', '唐山': 'Đường Sơn', '秦皇岛': 'Tần Hoàng Đảo',
  '邯郸': 'Hàm Đan', '邢台': 'Hình Đài', '保定': 'Bảo Định', '张家口': 'Trương Gia Khẩu',
  '承德': 'Thừa Đức', '沧州': 'Thương Châu', '廊坊': 'Lang Phường', '衡水': 'Hành Thủy',
  '沈阳': 'Thẩm Dương', '大连': 'Đại Liên', '鞍山': 'An Sơn', '抚顺': 'Phủ Thuận',
  '本溪': 'Bản Khê', '丹东': 'Đan Đông', '锦州': 'Cẩm Châu', '营口': 'Dinh Khẩu',
  '阜新': 'Phụ Tân', '辽阳': 'Liêu Dương', '盘锦': 'Bàn Cẩm', '铁岭': 'Thiết Lĩnh',
  '朝阳': 'Triều Dương', '葫芦岛': 'Hồ Lô Đảo',
  '长春': 'Trường Xuân', '吉林': 'Cát Lâm', '四平': 'Tứ Bình', '辽源': 'Liêu Nguyên',
  '通化': 'Thông Hóa', '白山': 'Bạch Sơn', '松原': 'Tùng Nguyên', '白城': 'Bạch Thành',
  '延边': 'Diên Biên',
  '哈尔滨': 'Cáp Nhĩ Tân', '齐齐哈尔': 'Tề Tề Cáp Nhĩ', '鸡西': 'Kê Tây', '鹤岗': 'Hạc Cương',
  '双鸭山': 'Song Áp Sơn', '大庆': 'Đại Khánh', '伊春': 'Y Xuân', '佳木斯': 'Giai Mộc Tư',
  '七台河': 'Thất Đài Hà', '牡丹江': 'Mẫu Đơn Giang', '黑河': 'Hắc Hà', '绥化': 'Tuy Hóa',
  '大兴安岭': 'Đại Hưng An Lĩnh',
  '合肥': 'Hợp Phì', '芜湖': 'Vu Hồ', '蚌埠': 'Bạng Phụ', '淮南': 'Hoài Nam',
  '马鞍山': 'Mã An Sơn', '淮北': 'Hoài Bắc', '铜陵': 'Đồng Lăng', '安庆': 'An Khánh',
  '黄山': 'Hoàng Sơn', '滁州': 'Trừ Châu', '阜阳': 'Phụ Dương', '宿州': 'Túc Châu',
  '六安': 'Lục An', '亳州': 'Bạc Châu', '池州': 'Trì Châu', '宣城': 'Tuyên Thành',
  '南昌': 'Nam Xương', '景德镇': 'Cảnh Đức Trấn', '萍乡': 'Bình Hương', '九江': 'Cửu Giang',
  '新余': 'Tân Dư', '鹰潭': 'Ưng Đàm', '赣州': 'Cám Châu', '吉安': 'Cát An',
  '宜春': 'Nghi Xuân', '抚州': 'Phủ Châu', '上饶': 'Thượng Nhiêu',
  '南宁': 'Nam Ninh', '柳州': 'Liễu Châu', '桂林': 'Quế Lâm', '梧州': 'Ngô Châu',
  '北海': 'Bắc Hải', '防城港': 'Phòng Thành Cảng', '钦州': 'Khâm Châu', '贵港': 'Quý Cảng',
  '玉林': 'Ngọc Lâm', '百色': 'Bách Sắc', '贺州': 'Hạ Châu', '河池': 'Hà Trì',
  '来宾': 'Lai Tân', '崇左': 'Sùng Tả',
  '海口': 'Hải Khẩu', '三亚': 'Tam Á', '三沙': 'Tam Sa', '儋州': 'Đam Châu',
  '贵阳': 'Quý Dương', '六盘水': 'Lục Bàn Thủy', '遵义': 'Tuân Nghĩa', '安顺': 'An Thuận',
  '毕节': 'Tất Tiết', '铜仁': 'Đồng Nhân',
  '昆明': 'Côn Minh', '曲靖': 'Khúc Tĩnh', '玉溪': 'Ngọc Khê', '保山': 'Bảo Sơn',
  '昭通': 'Chiêu Thông', '丽江': 'Lệ Giang', '普洱': 'Phổ Nhĩ', '临沧': 'Lâm Thương',
  '楚雄': 'Sở Hùng', '红河': 'Hồng Hà', '文山': 'Văn Sơn', '西双版纳': 'Tây Song Bản Nạp',
  '大理': 'Đại Lý', '德宏': 'Đức Hoành', '怒江': 'Nộ Giang', '迪庆': 'Địch Khánh',
  '拉萨': 'Lhasa (Lạp Tát)', '日喀则': 'Shigatse (Nhật Khách Tắc)', '昌都': 'Xương Đô',
  '林芝': 'Nyingchi (Lâm Chi)', '山南': 'Sơn Nam', '那曲': 'Na Khúc', '阿里': 'Ngari (A Lý)',
  '兰州': 'Lan Châu', '嘉峪关': 'Gia Dục Quan', '金昌': 'Kim Xương', '白银': 'Bạch Ngân',
  '天水': 'Thiên Thủy', '武威': 'Vũ Uy', '张掖': 'Trương Dịch', '平凉': 'Bình Lương',
  '酒泉': 'Tửu Tuyền', '庆阳': 'Khánh Dương', '定西': 'Định Tây', '陇南': 'Lũng Nam',
  '临夏': 'Lâm Hạ', '甘南': 'Cam Nam',
  '西宁': 'Tây Ninh', '海东': 'Hải Đông', '海北': 'Hải Bắc', '黄南': 'Hoàng Nam',
  '海南': 'Hải Nam', '果洛': 'Quả Lạc', '玉树': 'Ngọc Thụ', '海西': 'Hải Tây',
  '银川': 'Ngân Xuyên', '石嘴山': 'Thạch Chủy Sơn', '吴忠': 'Ngô Trung', '固原': 'Cố Nguyên',
  '中卫': 'Trung Vệ',
  '乌鲁木齐': 'Urumqi (Ô Lỗ Mộc Tề)', '克拉玛依': 'Karamay (Khắc Lạp Mã Y)',
  '吐鲁番': 'Turpan (Thổ Lỗ Phiên)', '哈密': 'Hami (Cáp Mật)', '昌吉': 'Xương Cát',
  '博尔塔拉': 'Bortala (Bác Nhĩ Tháp Lạp)', '巴音郭楞': 'Bayingolin (Ba Âm Quách Lăng)',
  '阿克苏': 'Aksu (A Khắc Tô)', '克孜勒苏': 'Kizilsu (Khắc Tư Lặc Tô)',
  '喀什': 'Kashgar (Khách Thập)', '和田': 'Hotan (Hòa Điền)', '伊犁': 'Ili (Y Lê)',
  '塔城': 'Tháp Thành', '阿勒泰': 'Altay (A Lặc Thái)',
  '太原': 'Thái Nguyên', '大同': 'Đại Đồng', '阳泉': 'Dương Tuyền', '长治': 'Trường Trị',
  '晋城': 'Tấn Thành', '朔州': 'Sóc Châu', '晋中': 'Tấn Trung', '运城': 'Vận Thành',
  '忻州': 'Hân Châu', '临汾': 'Lâm Phân', '吕梁': 'Lữ Lương',
  '呼和浩特': 'Hô Hòa Hạo Đặc', '包头': 'Bao Đầu', '乌海': 'Ô Hải', '赤峰': 'Xích Phong',
  '通辽': 'Thông Liêu', '鄂尔多斯': 'Ordos (Ngạc Nhĩ Đa Tư)', '呼伦贝尔': 'Hulunbuir (Hô Luân Bối Nhĩ)',
  '巴彦淖尔': 'Bayannur (Ba Ngạn Náo Nhĩ)', '乌兰察布': 'Ulanqab (Ô Lan Sát Bố)',
  '兴安': 'Hưng An', '锡林郭勒': 'Xilingol (Tích Lâm Quách Lặc)', '阿拉善': 'Alxa (A Lạp Thiện)',
  '香港': 'Hồng Kông', '九龙': 'Cửu Long', '新界': 'Tân Giới',
  '澳门': 'Ma Cao', '氹仔': 'Đãng Tử (Taipa)', '路环': 'Lộ Hoàn (Coloane)',
  '台北': 'Đài Bắc', '新北': 'Tân Bắc', '桃园': 'Đào Viên', '台中': 'Đài Trung',
  '台南': 'Đài Nam', '高雄': 'Cao Hùng', '基隆': 'Cơ Long', '新竹': 'Tân Trúc',
  '嘉义': 'Gia Nghĩa', '苗栗': 'Miêu Lật', '彰化': 'Chương Hóa', '南投': 'Nam Đầu',
  '云林': 'Vân Lâm', '屏东': 'Bình Đông', '宜兰': 'Nghi Lan', '花莲': 'Hoa Liên',
  '台东': 'Đài Đông', '澎湖': 'Bành Hồ', '金门': 'Kim Môn', '连江': 'Liên Giang',
};

function lookup(dict: Record<string, string>, key: string): string {
  return dict[key] ?? key;
}

export function paName(hanzi: string): string {
  return lookup(PALACE_NAME_VI, hanzi);
}

export function starName(hanzi: string): string {
  return lookup(STAR_NAME_VI, hanzi);
}

export function sihuaName(hanzi: string): string {
  return lookup(SIHUA_NAME_VI, hanzi);
}

export function shishenName(hanzi: string): string {
  return lookup(SHISHEN_NAME_VI, hanzi);
}

export function stemName(hanzi: string): string {
  return lookup(STEM_NAME_VI, hanzi);
}

export function branchName(hanzi: string): string {
  return lookup(BRANCH_NAME_VI, hanzi);
}

export function elementName(hanzi: string): string {
  return lookup(ELEMENT_NAME_VI, hanzi);
}

export function juName(hanzi: string): string {
  return lookup(JU_NAME_VI, hanzi);
}

export function provinceName(hanzi: string): string {
  return lookup(PROVINCE_NAME_VI, hanzi);
}

export function cityName(hanzi: string): string {
  return lookup(CITY_NAME_VI, hanzi);
}

/** Tra theo bất kỳ loại nào, dùng khi không biết trước danh mục (ví dụ render danh sách hỗn hợp). */
export function anyTermName(hanzi: string): string {
  return (
    PALACE_NAME_VI[hanzi] ??
    STAR_NAME_VI[hanzi] ??
    SIHUA_NAME_VI[hanzi] ??
    SHISHEN_NAME_VI[hanzi] ??
    STEM_NAME_VI[hanzi] ??
    BRANCH_NAME_VI[hanzi] ??
    ELEMENT_NAME_VI[hanzi] ??
    hanzi
  );
}
