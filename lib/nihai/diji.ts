/**
 * 地纪 — 倪海厦地理风水体系数据库
 *
 * 「下知地理」—— 地之纪，是地理志的体系化研究。
 * 倪海厦原计划60岁后著述，利用天文地理知识与医学素养
 * 重新编写各国地理志，研究国家人性、物产与其风水地理的关系。
 *
 * 倪师于2012年辞世，地纪未能完成，为「倪师未竟之业」。
 * 现有内容来自天纪课程中的堪舆学部分以及后人整理的遗稿。
 */

import type { NiModule } from './types';

// ─── 地纪模块 ────────────────────────────────────────────
export const DIJI_MODULES: NiModule[] = [
  {
    id: 'dj-guojiadili',
    category: 'diji',
    name: 'Quốc Gia Địa Lý Chí',
    nameEn: 'National Geography',
    subtitle: 'Sự nghiệp chưa trọn của thầy Nghê · Nghiên cứu di cảo',
    description: 'Thầy Nghê dự định dùng tri thức phong thủy địa lý để giải đọc ảnh hưởng của hoàn cảnh địa lý các nước đối với tính cách quốc dân, vật sản tài nguyên và sự hưng suy của quốc vận. Đây là hoài bão lớn mà thầy Nghê chưa kịp hoàn thành.',
    details: [
      'Địa Kỷ là phần được lên kế hoạch hoàn thành sau cùng trong ba hệ thống trước tác lớn của Nghê Hải Hạ, nguyên định sau tuổi 60 sẽ bắt đầu chấp bút.',
      'Ý tưởng cốt lõi là dùng tri thức phong thủy địa lý để biên soạn lại địa lý chí các nước, đem môn Khám Dư học truyền thống ứng dụng vào tầm vĩ mô cấp quốc gia.',
      'Hướng nghiên cứu bao gồm: vị trí địa lý, núi non sông ngòi của quốc gia đối với việc hun đúc tính cách quốc dân, mối quan hệ giữa vật sản tài nguyên với cách cục phong thủy, cùng sự liên hệ giữa hưng suy lịch sử và biến thiên địa lý.',
      'Thầy Nghê từ trần năm 2012, Địa Kỷ chỉ để lại phác thảo bước đầu cùng nền tảng lý luận Khám Dư học trong giáo trình Thiên Kỷ. Những tia sáng tư tưởng quý giá này rất đáng để hậu bối chỉnh lý và truyền thừa.',
    ],
    references: [
      'Phần Khám Dư Học trong 《Thiên Kỷ》 của Nghê Hải Hạ',
      'Ý tưởng Địa Lý Chí trong các bài giảng của Nghê Hải Hạ',
    ],
    keywords: ['Địa Kỷ', 'Quốc gia địa lý', 'Phong thủy', 'Địa lý chí', 'Quốc vận', 'Vật sản', 'Nhân tính', 'Khám Dư'],
    icon: '⊞',
    status: 'preview',
    order: 1,
    slug: 'geography',
    chapters: [
      {
        id: 'dj-dl-01',
        title: 'Phác Thảo Địa Kỷ',
        subtitle: 'Hoài bão lớn và bản đồ quy hoạch của thầy Nghê',
        description: 'Phác thảo tổng thể của thầy Nghê về Địa Kỷ — dùng tri thức phong thủy địa lý để giải đọc vận mệnh quốc gia.',
        keyPoints: [
          'Dự kiến chấp bút sau tuổi 60 (thầy Nghê sinh năm 1954)',
          'Dung hợp tri thức thiên văn địa lý với tố chất y học',
          'Biên soạn lại địa lý chí của các quốc gia',
          'Nghiên cứu mối quan hệ giữa nhân tính, vật sản và phong thủy địa lý',
        ],
        quotes: ['Tôi muốn sau năm sáu mươi tuổi, vận dụng tri thức thiên văn địa lý cùng tố chất y học của mình để viết lại Địa Lý Chí'],
        order: 1,
      },
      {
        id: 'dj-dl-02',
        title: 'Địa Lý và Nhân Tính',
        subtitle: 'Một phương thủy thổ nuôi dưỡng một phương người',
        description: 'Hoàn cảnh địa lý khác nhau hun đúc nên tính cách dân tộc và đặc trưng văn hóa khác nhau như thế nào.',
        keyPoints: [
          'Sự khác biệt tính cách giữa dân tộc miền núi và dân tộc đồng bằng',
          'Ảnh hưởng của sự phân bố hệ thống sông ngòi đối với văn minh nông nghiệp',
          'Mối quan hệ giữa đới khí hậu với thể chất và tính cách con người',
          'Nơi có phong thủy tốt ắt có bậc hiền tài xuất hiện',
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'dj-kanyu-theory',
    category: 'diji',
    name: 'Nền Tảng Lý Luận Khám Dư',
    nameEn: 'Feng Shui Theory',
    subtitle: 'Khám Dư Học Thiên Kỷ · Chỉnh lý lý luận',
    description: 'Chỉnh lý từ phần lý luận Khám Dư học trong giáo trình Thiên Kỷ, làm nền tảng lý luận cho Địa Kỷ. Bao gồm các lý luận cốt lõi như Loan Đầu học, Lý Khí học, Dương Trạch học.',
    details: [
      'Tuy Địa Kỷ chưa thể thành sách độc lập, song trong giáo trình Thiên Kỷ đã bao hàm nội dung lý luận Khám Dư học vô cùng phong phú.',
      'Những lý luận này là khung nền tảng của Địa Kỷ, bao quát phương pháp phân tích phong thủy từ vi mô (nhà ở) đến vĩ mô (đô thị, quốc gia).',
      'Thầy Nghê áp dụng phái Cửu Tinh (lưu phái Dương Cứu Bần), chú trọng cả Loan Đầu lẫn Lý Khí.',
      'Phần nội dung này có thể xem như "dự khoa lý luận" của Địa Kỷ, cung cấp phương pháp luận cho việc nghiên cứu Quốc Gia Địa Lý Chí về sau.',
    ],
    school: 'Phái Cửu Tinh (lưu phái Dương Cứu Bần)',
    references: [
      'Nghê Hải Hạ 《Thiên Kỷ · Địa Mạch Đạo》',
      'Điển tịch phong thủy Dương Cứu Bần',
    ],
    keywords: ['Khám Dư', 'Lý luận phong thủy', 'Loan Đầu', 'Lý Khí', 'Phái Cửu Tinh', 'Dương Cứu Bần', 'Dương trạch', 'Âm trạch'],
    icon: '◫',
    status: 'active',
    order: 2,
    slug: 'kanyu-theory',
    chapters: [
      {
        id: 'dj-kt-01',
        title: 'Loan Đầu Học',
        subtitle: 'Phán đoán sơn hình thủy thế',
        description: 'Thông qua quan sát hình dáng, thế đi của núi, hướng chảy của nước cùng các địa mạo tự nhiên để phán đoán cát hung phong thủy.',
        keyPoints: [
          'Long mạch: Thế đi của dãy núi và khí mạch',
          'Huyệt vị: Vị trí tối ưu để tàng phong tụ khí',
          'Sa thủ: Thế núi bao bọc hai bên tả hữu của huyệt vị',
          'Thủy khẩu: Phương vị dòng nước chảy vào và thoát ra',
        ],
        order: 1,
      },
      {
        id: 'dj-kt-02',
        title: 'Lý Khí Học',
        subtitle: 'Suy tính cát hung phương vị',
        description: 'Thông qua la bàn đo đạc phương vị, kết hợp các lý luận Cửu Tinh phi bố, Bát Sát Hoàng Tuyền để suy tính cát hung.',
        keyPoints: [
          'Phương pháp sử dụng la bàn',
          'Nguyên lý Cửu Tinh phi bố',
          'Phương vị cấm kỵ của Bát Sát Hoàng Tuyền',
          'Phương vị cát lợi của Tam Cát Lục Tú',
        ],
        order: 2,
      },
      {
        id: 'dj-kt-03',
        title: 'Ứng Dụng Dương Trạch',
        subtitle: 'Thực hành phong thủy hoàn cảnh cư trú',
        description: 'Phương pháp thao tác thực tế khi ứng dụng lý luận Khám Dư vào việc chọn lựa và bố cục nhà ở.',
        keyPoints: [
          'Nguyên tắc chọn tọa hướng cho ngôi nhà',
          'Bố trí phương vị các khu vực chức năng trong nhà',
          'Phán đoán cát hung của hoàn cảnh xung quanh',
          'Phương pháp hóa giải phong thủy bất lương',
        ],
        order: 3,
      },
    ],
  },
  {
    id: 'dj-yigao',
    category: 'diji',
    name: 'Di Cảo và Hậu Học',
    nameEn: 'Legacy & Continuation',
    subtitle: 'Hậu bối bổ chú · Củi lửa truyền nhau',
    description: 'Chỉnh lý những lời giảng rải rác của thầy Nghê về Địa Kỷ, phần nghiên cứu bổ chú của học trò hậu bối, cùng sự mở rộng hiện đại của tư tưởng Địa Kỷ.',
    details: [
      'Thầy Nghê tuy chưa hoàn thành chuyên khảo Địa Kỷ, nhưng trong giáo trình Thiên Kỷ và nhiều dịp khác đã nhiều lần nhắc đến ý tưởng cùng trọng điểm của Địa Kỷ.',
      'Các học trò và nhà nghiên cứu hậu bối dựa theo lời giảng và di cảo của thầy Nghê đã tiến hành chỉnh lý và bổ chú ở một mức độ nhất định.',
      'Tư tưởng Địa Kỷ có giá trị tham khảo quan trọng trong các lĩnh vực nghiên cứu phong thủy hiện đại, quy hoạch đô thị, khoa học môi trường.',
      'Học phần này nhằm thu thập, chỉnh lý toàn bộ tư liệu tản mạn liên quan đến Địa Kỷ, cung cấp nền tảng cho các nghiên cứu tiếp theo.',
    ],
    references: [
      'Thực lục bài giảng của Nghê Hải Hạ',
      'Ghi chép và nghiên cứu của học trò hậu bối',
    ],
    keywords: ['Di cảo', 'Hậu học', 'Bổ chú', 'Truyền thừa', 'Ứng dụng hiện đại'],
    icon: '⊟',
    status: 'coming',
    order: 3,
    slug: 'legacy',
    chapters: [
      {
        id: 'dj-yg-01',
        title: 'Ngữ Lục Địa Kỷ Của Thầy Nghê',
        subtitle: 'Tư tưởng Địa Kỷ tản kiến trong các giáo trình',
        description: 'Trích lục những luận thuật quan trọng của thầy Nghê về Địa Kỷ từ các giáo trình Thiên Kỷ, Nhân Kỷ.',
        keyPoints: [
          'Động cơ sáng tác và quy hoạch Địa Kỷ',
          'Quan sát về hoàn cảnh địa lý các quốc gia',
          'Luận thuật về mối quan hệ giữa phong thủy và quốc vận',
          'Mối liên hệ giữa Địa Kỷ với Thiên Kỷ và Nhân Kỷ',
        ],
        quotes: [
          'Nỗ lực của nhân sự cộng thêm sự điều chỉnh về địa lý, nhất định có thể lớn hơn vận mệnh tiên thiên',
          '2/3 lớn hơn 1/3 — Nhân sự + Địa lý = 2/3, Vận mệnh tiên thiên = 1/3',
        ],
        order: 1,
      },
    ],
  },
];

// ─── 统计 ────────────────────────────────────────────────
export const DIJI_STATS = {
  totalModules: DIJI_MODULES.length,
  totalChapters: DIJI_MODULES.reduce((sum, m) => sum + m.chapters.length, 0),
  status: 'Sự nghiệp chưa trọn của thầy Nghê · Hậu bối tiếp tục chỉnh lý',
  note: 'Nghê Hải Hạ nguyên định sau tuổi 60 sẽ trước tác Địa Kỷ, năm 2012 từ trần, Địa Kỷ chỉ để lại phác thảo và nền tảng lý luận',
};
