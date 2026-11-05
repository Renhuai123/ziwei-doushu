/**
 * Nghê Hải Hạ — Thiên Kỷ / Địa Kỷ / Nhân Kỷ — Xuất khẩu thống nhất
 *
 * Nghê Hải Hạ (1954-2012), người sáng lập Học viện Trung y Hán Đường Hoa Kỳ,
 * kỳ nhân khoáng thế đương đại hiếm có kiêm toàn cả năm thuật "Mệnh, Tướng, Bốc, Sơn, Y".
 *
 * Hệ thống Tam Kỷ:
 *   Thiên Kỷ —— Thượng tri thiên văn (Tử Vi Đẩu Số, Kinh Dịch, Kham dư, Thôi mệnh, Diện tướng, Trắc tự)
 *   Địa Kỷ —— Hạ tri địa lý (Quốc gia địa lý chí, Phong thủy và quốc vận)
 *   Nhân Kỷ —— Trung tri nhân sự (Châm cứu, Hoàng Đế Nội Kinh, Thần Nông Bản Thảo Kinh, Thương Hàn Luận, Kim Quỹ Yếu Lược)
 */

export * from './types';
export { TIANJI_MODULES, HEXAGRAMS, FENGSHUI_ENTRIES, TIANJI_EPISODES, TIANJI_QUOTES, TIANJI_STATS } from './tianji';
export { RENJI_MODULES, ACU_EXPERIENCES, TRANS_NEEDLING, HANTANG_FORMULAS, CLASSIC_FORMULAS, RENJI_STATS } from './renji';
export { DIJI_MODULES, DIJI_STATS } from './diji';

/** Tiểu sử hoàn chỉnh Nghê Hải Hạ */
export const NI_HAIXIA_BIO = {
  name: 'Nghê Hải Hạ',
  nameVariant: 'Nghê Hải Hạ (倪海夏)',
  alias: 'Phạn Vũ Long',
  birth: '1/1/1954',
  death: '31/1/2012',
  birthPlace: 'Thành phố Đài Bắc',
  ancestry: 'Thụy An, Chiết Giang',
  family: 'Bảy anh chị em, đứng thứ năm',
  education: 'Khoa Chính trị Đại học Đông Ngô',
  title: 'Người sáng lập Học viện Trung y Hán Đường Hoa Kỳ',
  titles: [
    'Kỳ nhân khoáng thế kiêm toàn ngũ thuật Mệnh, Tướng, Bốc, Sơn, Y',
    'Viện trưởng Học viện Trung y Hán Đường Hoa Kỳ',
    'Giáo sư hướng dẫn tiến sĩ Đại học Trung y Dược California, Hoa Kỳ',
    'Ủy viên tối cao Ủy ban Trung y Sở Y tế bang Florida (2000-2003)',
    'Ủy viên kiêm Phó Chủ tịch Ủy ban Châm cứu bang Florida',
    'Người kế thừa hiện đại của phái Kinh Phương',
    'Người sáng lập hệ thống giảng dạy Thiên Kỷ, Nhân Kỷ',
    'Người đoạt giải Hoa kiều ưu tú hải ngoại',
  ],
  /** Quan hệ sư thừa */
  teachers: [
    { name: 'Chu Tả Vũ', background: 'Danh y gia truyền bốn đời Bắc Kinh, sau năm 1949 chuyển đến Đài Loan', subject: 'Châm cứu', period: '1977-1981' },
    { name: 'Từ Tế Dân', background: 'Danh y Thượng Hải gốc Giang Tô', subject: 'Châm cứu', period: 'Thập niên 1970' },
    { name: 'Truyền thừa Khương Tá Cảnh', background: 'Nhà Kinh phương học trò của Tào Dĩnh Phủ', subject: 'Kinh phương', period: 'Thời gian học việc tại tiệm thuốc bắc Cơ Long' },
  ],
  /** Triết lý cốt lõi */
  corePhilosophy: [
    'Đại đạo chí giản — Phi Tinh bay qua bay lại quá phức tạp, không làm cái này',
    'Cung Mệnh làm gốc, Tam Phương làm dụng',
    'Nỗ lực nhân sự + Điều chỉnh địa lý > Vận mệnh tiên thiên (2/3 > 1/3)',
    'Trung y là y học vật lý, phân tích cơ thể người từ góc độ vật lý',
    'Biện chứng bất biện bệnh — Trung y nhìn vào chứng hình chứ không phải tên bệnh',
    'Kinh phương nhất tề tri, nhị tề dĩ (Một thang thấy chuyển biến, hai thang khỏi bệnh)',
    'Không muốn văn hóa Trung Hoa thất truyền, nên đã dạy rất nhiều học trò',
    'Đoán mệnh là một môn triết học bàn luận về Quả',
    'Văn tự chỉ là chiếc thuyền, chân lý mới là bờ bên kia',
  ],
  /** Niên biểu cuộc đời */
  timeline: [
    { year: '1954', event: 'Sinh tại thành phố Đài Bắc, tổ quán Thụy An, Chiết Giang' },
    { year: 'Thập niên 1970', event: 'Thời trung học dùng 《Y Tông Kim Giám》 chữa khỏi đau bụng kinh cho chị hai, lập chí học y' },
    { year: '1977-1981', event: 'Học châm cứu với danh y Chu Tả Vũ' },
    { year: '1978', event: 'Phục vụ trong quân y bộ Mã Tổ, được xưng tụng là "Mã Tổ thần y", khi đó 24 tuổi' },
    { year: '1979', event: 'Sau khi xuất ngũ lấy hóa danh "Phạn Vũ Long" bắt đầu sự nghiệp toán mệnh xem tướng' },
    { year: '1980', event: 'Di cư sang Hoa Kỳ' },
    { year: '1988', event: 'Mở lớp "Thiên văn Địa lý" tại đường Kim Sơn Nam, Đài Bắc, truyền dạy Tử Vi Đẩu Số và phong thủy Dương trạch' },
    { year: '1991', event: 'Trở thành châm cứu sư có chứng chỉ tại bang Florida, Hoa Kỳ' },
    { year: '1993', event: 'Chọn địa điểm xây dựng Học viện Trung y Hán Đường tại đảo Merritt, bang Florida' },
    { year: '1994', event: 'Hoàn thành ghi hình bộ tác phẩm 《Thiên Kỷ》 gồm 24 tập' },
    { year: '1995', event: 'Thành lập Học viện Trung y Hán Đường' },
    { year: '2000-2003', event: 'Giữ chức Ủy viên tối cao Ủy ban Trung y Sở Y tế bang Florida' },
    { year: '2004', event: 'Mở lớp giảng dạy Trung y 《Nhân Kỷ》 tại Đài Bắc' },
    { year: '2005', event: 'Xuất bản bộ DVD giảng dạy 《Nhân Kỷ》' },
    { year: '2007', event: 'Bắt đầu biên soạn 《Địa Kỷ》' },
    { year: '2010', event: 'Thành lập Phòng khám Trung y Kinh Phương Hán Đường Đài Bắc; nhận lời mời thuyết giảng trọn ngày tại Diễn đàn Phù Dương lần 3' },
    { year: '2011', event: 'Thành lập Hán Đường Kinh Phương Trung Y Quán tại Thâm Quyến' },
    { year: '2012', event: 'Ngày 31 tháng 1 tạ thế tại Đài Bắc do suy tim phổi, hưởng thọ 59 tuổi' },
  ],
  /** Hệ thống tác phẩm */
  publications: {
    originalBooks8: ['Hoàng Đế Nội Kinh Tố Vấn', 'Hoàng Đế Nội Kinh', 'Thần Nông Bản Thảo Kinh', 'Châm Cứu', 'Thương Hàn Luận', 'Kim Quỹ', 'Nhân Gian Đạo', 'Thiên Cơ Đạo · Địa Mạch Đạo'],
    totalBooks: '26-44 cuốn (bao gồm giáo trình chú giải, y án toàn tập, giải nghĩa huyệt vị...)',
    hantangFormulas: 'Hán Đường 100 phương',
    classicFormulas: '259 bài thuốc kinh điển',
    medicalCases: 'Y án toàn tập 7 tập',
    totalVideoHours: 'Hơn 200 giờ',
  },
  /** Hệ thống Tam Kỷ */
  sanJi: {
    tianji: {
      name: 'Thiên Kỷ',
      meaning: 'Thượng tri thiên văn',
      content: 'Tử Vi Đẩu Số, Kinh Dịch 64 quẻ, Kham dư học, Thôi mệnh học, Diện tướng học, Trắc tự thuật',
      recordYear: 1994,
      episodes: 24,
      hdEpisodes: 83,
      hoursPerEpisode: 2,
      totalHours: 48,
      books: ['Thiên Cơ Đạo', 'Nhân Gian Đạo', 'Địa Mạch Đạo', '64 Quái Dịch Đồ'],
      schools: ['Phái Tam Hợp (Tử Vi Đẩu Số)', 'Phái Tượng Số (Kinh Dịch)', 'Phái Cửu Tinh (Kham Dư)', 'Phái Hà Lạc Số Lý (Thôi Mệnh)'],
      structure: 'Một giờ đầu giảng về Mệnh học, một giờ sau giảng về Kinh Dịch',
    },
    renji: {
      name: 'Nhân Kỷ',
      meaning: 'Trung tri nhân sự',
      content: 'Châm Cứu Đại Thành (44 tập), Hoàng Đế Nội Kinh (20 tập), Thần Nông Bản Thảo Kinh (46 tập), Thương Hàn Luận, Kim Quỹ Yếu Lược (20 tập)',
      completionYear: '2004-2005',
      totalLessons: 'Hơn 150 tập',
      learningOrder: 'Châm cứu → Hoàng Đế Nội Kinh → Thần Nông Bản Thảo Kinh → Thương Hàn Luận → Kim Quỹ Yếu Lược',
      acuExperience: 215,
      transNeedling: 31,
      hantangFormulas: 100,
    },
    diji: {
      name: 'Địa Kỷ',
      meaning: 'Hạ tri địa lý',
      content: 'Quốc gia địa lý chí (chưa hoàn thành)',
      status: 'Tâm nguyện chưa hoàn thành của thầy Nghê',
      note: 'Kế hoạch ban đầu là trước tác sau tuổi 60, năm 2012 thầy tạ thế',
      startYear: 2007,
      existingContent: 'Phần Kham dư học trong khóa Thiên Kỷ + di cảo do học trò và hậu thế chỉnh lý',
    },
  },
  /** Đặc trưng tính cách */
  personality: {
    'Phong cách toán mệnh': 'Thiết khẩu trực đoán không lưu dư địa',
    'Sở thích âm nhạc': 'Thích nhất bài "Hotel California" của The Eagles',
    'Kỹ năng đời sống': 'Nấu nướng giặt giũ đều tinh thông, tay nghề làm mì bánh ai cũng tấm tắc khen ngợi',
    'Thái độ làm việc': 'Đầu giường quanh năm để sẵn giấy bút, khi gặp ca bệnh nan y liền hướng về tiên sư cầu nguyện',
    'Giấc ngủ': 'Nhiều năm liền ngủ đêm không quá ba tiếng',
    'Đánh giá của bệnh nhân': 'Thường được các bệnh nhân người Mỹ gọi là "Niềm hy vọng cuối cùng (The last hope)"',
  },
  /** Tiêu chuẩn tuyển chọn truyền nhân */
  discipleStandards: [
    'Tâm tính tốt',
    'Cá tính mạnh mẽ',
    'Chủ kiến vững vàng',
    'Khả năng quan sát nhạy bén',
    'Dũng cảm phê phán những lý luận sai lầm',
  ],
};

/** Điều hướng Tam Kỷ */
export const SANJI_CATEGORIES = [
  { key: 'tianji' as const, name: 'Thiên Kỷ', nameEn: 'Tian Ji', icon: '⊙', meaning: 'Thượng tri thiên văn', color: '#d4a843', href: '/tianji' },
  { key: 'diji' as const, name: 'Địa Kỷ', nameEn: 'Di Ji', icon: '⊞', meaning: 'Hạ tri địa lý', color: '#6b8a5e', href: '/diji' },
  { key: 'renji' as const, name: 'Nhân Kỷ', nameEn: 'Ren Ji', icon: '⊕', meaning: 'Trung tri nhân sự', color: '#8b6b9e', href: '/renji' },
] as const;
