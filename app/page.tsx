'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import { useTheme, type Theme } from '@/components/ThemeProvider';
import AnnouncementModal from '@/components/AnnouncementModal';
import { starName, sihuaName } from '@/lib/ziwei/display-vi';

// ─── Wrapper hiệu ứng cuộn vào khung hình ────────────────────────────────────
function FadeIn({
  children, delay = 0, y = 28, className = '',
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WeakBoundary({ line }: { line: string }) {
  // 之前的版本有 1px 实线 + 12px 渐变阴影，主题切换时形成清晰横线很硬。
  // 改为更柔和的 24px 渐变 + 低 opacity，section 衔接更自然。
  return (
    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${line}, transparent)`, opacity: 0.45 }} />
  );
}

// ─── Nút chuyển chủ đề ────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{
        borderColor: isDark ? 'rgba(212,168,67,0.3)' : 'rgba(140,100,20,0.35)',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,252,242,0.85)',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}
    >
      <div className="relative w-10 h-5 rounded-full flex-shrink-0"
        style={{
          background: isDark ? 'rgba(12,24,64,0.95)' : 'rgba(230,195,80,0.55)',
          transition: 'background 0.35s ease',
        }}>
        <motion.div
          animate={{ x: isDark ? 2 : 22 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-1 w-3.5 h-3.5 rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #b8a050, #e8d090)'
              : 'linear-gradient(135deg, #e89010, #f8d050)',
          }}
        />
      </div>
      <span className="text-[11px] font-medium tracking-wide select-none"
        style={{
          color: isDark ? 'rgba(212,180,100,0.85)' : 'rgba(110,72,8,0.8)',
          transition: 'color 0.35s ease',
        }}>
        {isDark ? 'Tối' : 'Sáng'}
      </span>
    </motion.button>
  );
}

// ─── Dữ liệu chính tinh ────────────────────────────────────────────
const STARS = [
  { name: '紫微' }, { name: '天机' }, { name: '太阳' }, { name: '武曲' },
  { name: '天同' }, { name: '廉贞' }, { name: '天府' }, { name: '太阴' },
  { name: '贪狼' }, { name: '巨门' }, { name: '天相' }, { name: '天梁' },
  { name: '七杀' }, { name: '破军' },
];

// ─── Mô-đun tính năng ────────────────────────────────────────────
const FEATURES = [
  {
    tag: 'Hệ thống lập lá số',
    title: 'Tử Vi Đẩu Số\nchính truyền Nghê Hải Hạ',
    subtitle: 'Không phải bản rút gọn, tuân thủ nghiêm ngặt truyền thừa của thầy Nghê Hải Hạ',
    points: [
      'Lập lá số theo Nạp Âm Ngũ Hành Cục, không dùng thuật toán rút gọn phổ biến trên mạng',
      'Cung Mệnh đếm nghịch theo giờ sinh, Cung Thân đếm thuận theo giờ sinh, tuân thủ chặt quy tắc giáo học',
      '14 chính tinh và Tứ Hóa phi tinh suy diễn theo đúng phép gốc, cấu trúc đầy đủ, có thể kiểm chứng lại',
    ],
  },
  {
    tag: 'Hiển thị lá số',
    title: 'Đầy đủ 14 chính tinh\nTứ Hóa phi tinh',
    subtitle: 'Cấu trúc rõ ràng, nhìn là hiểu trục chính và điểm trọng yếu',
    points: [
      '14 chính tinh nhập cung đầy đủ, quan hệ giữa các chính tinh dễ đọc',
      'Phụ tinh và sát tinh hiển thị cùng màn hình, tránh thiếu thông tin quan trọng',
      'Phân cấp độ sáng Miếu/Vượng/Lợi/Hãm, nhận diện nhanh sao mạnh yếu',
      'Bấm vào bất kỳ chính tinh nào để xem luận giải chi tiết của thầy Nghê Hải Hạ về sao đó',
    ],
  },
  {
    tag: 'AI luận giải',
    title: 'Luận giải sâu\nkhông chỉ là tính toán',
    subtitle: 'Kho tri thức hệ thống Nghê Hải Hạ × Claude AI',
    points: [
      'Phân tích Mệnh cách: xuất phát từ chính tinh Cung Mệnh, kết hợp Tam Phương Tứ Chính, đưa ra nhận định toàn diện về tính cách và cách cục đời người',
      'Luận giải 6 chiều: hướng sự nghiệp, tình cảm hôn nhân, mô hình tài vận, lưu ý sức khỏe, quan hệ gia đình, duyên con cái',
      'Theo dõi Đại Hạn Lưu Niên: trọng điểm Đại Hạn 10 năm hiện tại, gợi ý cụ thể và lời khuyên hành động cho cung Lưu Niên năm nay',
      'Hỏi tự do: đặt câu hỏi trực tiếp về lá số của bạn, như "năm nay có nên đổi việc không" hay "khi nào vận kết hôn tốt nhất"',
    ],
  },
  {
    tag: 'Nhận diện Cách Cục',
    title: 'Tự động phát hiện\nCách Cục lá số',
    subtitle: 'Khám phá vận số định sẵn từ tổ hợp tinh diệu',
    points: [
      'Tự động nhận diện 11 Cách Cục kinh điển: Tử Phủ đồng cung, Sát Phá Tham cách, Cơ Nguyệt Đồng Lương, Liêm Tướng cách, Vũ Khúc Thất Sát, v.v.',
      'Phát hiện chính xác các cách cục đặc biệt như Tả Hữu giáp Mệnh, Nhật Nguyệt giáp Mệnh, kèm luận giải chuẩn theo hệ thống Nghê Hải Hạ',
      'Tự động đánh dấu các trường hợp đặc biệt khi Tứ Hóa nhập Cung Mệnh hoặc Cung Thiên Di, gợi ý những vấn đề cần quan tâm trong đời người',
      'Cách Cục được phân tầng hiển thị theo cấp độ cát hung, giúp bạn nhìn rõ ưu thế và thử thách trong lá số của mình',
    ],
  },
];

// ─── 4 học phần lớn (dòng thời gian sau hero) ──────────────────────────
const SECTIONS = [
  {
    key: 'ziwei',
    name: 'Tử Vi',
    en: 'Zi Wei',
    desc: '14 chính tinh · 13 cung · AI luận giải',
    status: 'ready' as const,
    when: 'Tháng 5',
    icon: '◉',  // vòng tròn đặc + điểm trong, hình ảnh sao Tử Vi
    note: '',
  },
  {
    key: 'tianji',
    name: 'Thiên Kỷ',
    en: 'Tian Ji',
    desc: 'Tử Vi · Kinh Dịch · Kỳ Môn Độn Giáp',
    status: 'soon' as const,
    when: 'Tháng 6',
    icon: '⊙',  // vòng tròn + điểm trong (cổ văn "nhật"), cùng độ rộng với ◉
    note: '',
  },
  {
    key: 'diji',
    name: 'Địa Kỷ',
    en: 'Di Ji',
    desc: 'Di nghiệp của thầy Nghê · hậu học biên soạn chú giải',
    status: 'soon' as const,
    when: 'Tháng 6',
    icon: '⊞',  // vuông + giếng (hình ảnh đất/ruộng), cùng độ rộng với ⊙
    note: 'Nghiên cứu di cảo',
  },
  {
    key: 'renji',
    name: 'Nhân Kỷ',
    en: 'Ren Ji',
    desc: 'Nội Kinh · Thương Hàn · Kim Quỹ · Châm Cứu',
    status: 'soon' as const,
    when: 'Tháng 7',
    icon: '⊕',  // vòng tròn + chữ thập (y đạo/âm dương điều hòa), cùng độ rộng với ⊙/⊞
    note: '',
  },
];

// ─── Giáo lý cốt lõi của Nghê Hải Hạ ──────────────────────────
const NI_TEACHINGS = [
  {
    title: 'Cung Mệnh là gốc, Tam Phương là dụng',
    body: 'Thầy Nghê luôn nhấn mạnh, xem mệnh phải xem Cung Mệnh trước. Chính tinh Cung Mệnh quyết định cách cục căn bản và tính cách bẩm sinh của một người, Tam Phương (Tài Bạch, Quan Lộc, Thiên Di) quyết định "đất dụng võ" của người đó. Bốn cung liên động mới là bức tranh đầy đủ của đời người.',
  },
  {
    title: 'Mượn sao đối cung, không thể xem nhẹ',
    body: 'Điểm độc đáo của thầy Nghê là coi trọng "đối cung". Bất kỳ cung nào là cung trống, đều phải mượn tinh diệu ở đối cung để luận đoán; đối diện Cung Mệnh là Cung Thiên Di, hai cung ảnh hưởng lẫn nhau — đây là điểm mấu chốt mà nhiều người mới học dễ bỏ qua.',
  },
  {
    title: 'Tứ Hóa mới là bàn tay của vận mệnh',
    body: 'Tinh diệu chỉ là nền tảng, Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) mới là yếu tố quyết định vận trình tốt xấu. Cùng một sao, có Hóa Lộc và có Hóa Kỵ, đường đời có thể hoàn toàn khác biệt. Thầy Nghê nhiều lần nhấn mạnh: không xem Tứ Hóa, lá số chỉ giải được một nửa.',
  },
  {
    title: 'Đại Hạn mười năm, vận trình có nhịp',
    body: 'Thầy Nghê chia đời người thành 12 Đại Hạn, mỗi Đại Hạn 10 năm. Ông cho rằng con người ở các cung Đại Hạn khác nhau sẽ gặp vận hội hoàn toàn khác nhau. Hiểu rõ mình hiện đang ở Đại Hạn nào, cung đó có tinh diệu gì, mới có thể thực sự nắm bắt vận trình hiện tại.',
  },
];

// ─── 主题色彩 helper ─────────────────────────────────────
function useColors(theme: Theme) {
  const d = theme === 'dark';
  return {
    bgBase:       d ? '#020810'                                : '#f5efe0',
    // nav 用与 bgBase 完全相同的不透明色，避免半透明叠加产生色差带
    navBg:        d ? '#020810'                                : '#f5efe0',
    navBorder:    d ? 'rgba(255,255,255,0.05)'                : 'rgba(160,120,30,0.15)',
    goldGrad:     d ? 'linear-gradient(160deg,#c8993a 0%,#f0d070 40%,#c8993a 70%,#f0c755 100%)'
                    : 'linear-gradient(160deg,#6a4206 0%,#9a6a10 40%,#6a4206 70%,#885010 100%)',
    goldSolid:    d ? '#d4a843'                               : '#8b6410',
    goldLine:     d ? 'rgba(212,168,67,0.4)'                  : 'rgba(140,100,20,0.4)',
    tagText:      d ? 'rgba(212,168,67,0.6)'                  : 'rgba(120,80,10,0.65)',
    // 亮色文字用冷灰系（A 方案核心）：暖底 + 冷字 → 视觉不审美疲劳
    textPrimary:  d ? '#e8eef6'                               : '#1a1d24',
    textSecond:   d ? '#b8c6df'                               : '#3a3f4a',
    textMuted:    d ? '#9db0d0'                               : '#5a6275',
    textFaint:    d ? 'rgba(240,246,255,0.56)'                : '#9da4b3',
    // 冷色 accent（B 方案核心）：呼应暗色 quan 蓝；用于装饰性 glow / 链接 / 高亮
    accent:       d ? '#3a78d4'                               : '#3a5a82',
    accentSoft:   d ? 'rgba(58,120,212,0.18)'                 : 'rgba(58,90,130,0.10)',
    cardBg:       d ? 'rgba(255,255,255,0.05)'                : 'rgba(255,255,255,0.88)',
    cardBorder:   d ? 'rgba(255,255,255,0.10)'                : 'rgba(200,160,60,0.25)',
    cardShadow:   d ? '0 4px 32px rgba(0,0,0,0.5)'           : '0 4px 24px rgba(140,100,20,0.12)',
    featureBg:    d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.75)',
    featureBord:  d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    glowTint:     d ? 'rgba(212,168,67,0.07)'                 : 'rgba(180,140,40,0.06)',
    // 亮色 glow 真用蓝/紫——给整体氛围加冷色点缀
    glowBlue:     d ? 'rgba(40,80,160,0.12)'                  : 'rgba(58,90,130,0.06)',
    glowPurple:   d ? 'rgba(120,50,180,0.08)'                 : 'rgba(96,80,140,0.04)',
    niBg:         d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.8)',
    niBorder:     d ? 'rgba(212,168,67,0.2)'                  : 'rgba(180,130,40,0.25)',
    niDivider:    d ? 'rgba(255,255,255,0.08)'                : 'rgba(180,130,40,0.12)',
    niCardBg:     d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.9)',
    niCardBord:   d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    niCardShadow: d ? '0 2px 20px rgba(0,0,0,0.4)'           : '0 2px 16px rgba(140,100,20,0.1)',
    starBg:       d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.7)',
    starBorder:   d ? 'rgba(212,168,67,0.22)'                 : 'rgba(160,120,30,0.3)',
    starText:     d ? 'rgba(212,168,67,0.7)'                  : 'rgba(120,80,10,0.7)',
    ctaBg:        d ? 'linear-gradient(135deg,#b8892a,#f0d070,#b8892a)'
                    : 'linear-gradient(135deg,#6a4206,#9a6810,#6a4206)',
    ctaText:      d ? '#08080a'                               : '#f8f3e8',
    footerText:   d ? 'rgba(255,255,255,0.08)'                : '#d0b878',
    scrollLine:   d ? 'rgba(212,168,67,0.3)'                  : 'rgba(140,100,20,0.3)',
    scrollText:   d ? 'rgba(255,255,255,0.12)'                : '#c0a870',
    altSection:   d ? 'rgba(255,255,255,0.02)'                : 'rgba(255,255,255,0.4)',
    quoteBg:      d ? 'rgba(212,168,67,0.04)'                 : 'rgba(255,255,255,0.9)',
  };
}

// ─── Dữ liệu giới thiệu Tứ Hóa ─────────────────────────────────────────
const SIHUA_BRIEF: Record<string, { attr: string; brief: string }> = {
  '化禄': { attr: 'Cát Hóa · Tăng ích', brief: 'Sao Phúc nhập cung, chủ tài vận và phúc khí tăng ích. Cung sở tại việc gì cũng thuận lợi, năng lực tăng cường, là sao Hóa được yêu thích nhất trong lá số.' },
  '化权': { attr: 'Cát Hóa · Quyền uy', brief: 'Sao Quyền lực nhập cung, chủ khống chế và lãnh đạo. Cung sở tại chủ về sự mạnh mẽ và quyết đoán, thích nhập Cung Quan Lộc và Cung Mệnh, chủ thực quyền trong sự nghiệp.' },
  '化科': { attr: 'Cát Hóa · Danh dự', brief: 'Sao Khoa Danh nhập cung, chủ danh tiếng và duyên gặp người giúp đỡ. Cung sở tại chủ văn danh và vận thi cử, có người giúp đỡ, thích hợp học thuật, thi cử và nơi công cộng.' },
  '化忌': { attr: 'Hung Hóa · Trở ngại', brief: 'Sao Kiếp Số nhập cung, chủ chấp niệm và trở ngại. Cung sở tại cần đặc biệt lưu tâm, vấn đề đời người tại cung đó sẽ trở thành thử thách quan trọng.' },
};

// ─── Dữ liệu giới thiệu chính tinh ─────────────────────────────────────────
const STAR_BRIEF: Record<string, { attr: string; brief: string }> = {
  '紫微': { attr: 'Thổ · Sao Đế Vương', brief: 'Sao Thiên Hoàng cao quý, thống lĩnh các sao. Người tọa Mệnh có khí chất kiêu hãnh, chủ quyền uy hiển đạt, bẩm sinh có khí chất lãnh đạo, thích hợp vị trí lãnh đạo độc lập quyết đoán.' },
  '天机': { attr: 'Mộc · Sao Trí Tuệ', brief: 'Sao Ích Thọ, chủ trí mưu và biến động. Thông minh lanh lợi, giỏi tính toán, tâm tư tinh tế, thích hợp làm công việc hoạch định, cố vấn, kỹ thuật.' },
  '太阳': { attr: 'Hỏa · Chủ Quan Lộc', brief: 'Sao chủ Quan Lộc, chủ danh tiếng và thanh thế. Khoan dung rộng lượng, coi trọng hình ảnh trước công chúng, lợi về quan trường và công vụ, mệnh nam mạnh mẽ, khi nhập Miếu thì quang minh chính trực.' },
  '武曲': { attr: 'Kim · Chủ Tài Bạch', brief: 'Sao chủ Tài Bạch, chủ tài chính và quyết đoán. Ý chí kiên định, hành động quyết liệt, thích hợp nghề tài chính, ngân hàng, quân cảnh, là sao cô khắc, lợi kết hôn muộn.' },
  '天同': { attr: 'Thủy · Sao Phúc', brief: 'Sao chủ Phúc Đức, chủ hưởng lạc và duyên giao tiếp. Tính tình ôn hòa, duyên giao tiếp rất tốt, coi trọng chất lượng cuộc sống, tình cảm tinh tế, vận trình tuổi già tốt.' },
  '廉贞': { attr: 'Hỏa · Sao Tài Nghệ', brief: 'Sao đào hoa thứ cấp, chủ tài nghệ và tình dục. Tài hoa xuất chúng, tình cảm phong phú, thích hợp nghệ thuật, chính giới, đa tài đa nghệ nhưng cần đề phòng thị phi đào hoa.' },
  '天府': { attr: 'Thổ · Sao Tài Khố', brief: 'Sao chủ Nam Đẩu, chủ tài khố và tích lũy. Ổn trọng bảo thủ, năng lực quản lý tài chính mạnh, là lực lượng ổn định của lá số, thích hợp quản lý tài chính và hành chính.' },
  '太阴': { attr: 'Thủy · Chủ Điền Trạch', brief: 'Sao chủ Điền Trạch, chủ tài phú và âm nhu. Tinh tế dịu dàng, cảm nhận mạnh, mệnh nữ đặc biệt tốt, lợi về bất động sản và tích lũy, thích hợp nghề văn nghệ hoặc dịch vụ.' },
  '贪狼': { attr: 'Mộc Thủy · Đào Hoa', brief: 'Sao đào hoa, chủ dục vọng và tài nghệ. Đa tài đa nghệ, dục vọng mạnh mẽ, giao tiếp xã hội năng động, thích hợp nghệ thuật, quan hệ công chúng, kinh doanh, duyên giao tiếp rất tốt.' },
  '巨门': { attr: 'Thủy · Sao Thị Phi', brief: 'Sao Ám, chủ khẩu tài và thị phi. Khẩu tài xuất chúng, năng lực biện luận mạnh, thích hợp luật sư, giáo dục, truyền thông, cần lưu ý thị phi miệng lưỡi, lập thân bằng tài biện luận.' },
  '天相': { attr: 'Thủy · Sao Ấn', brief: 'Sao Ấn, chủ phụ tá và ấn thụ. Khéo điều hòa, coi trọng lễ nghĩa, chính trực tuân pháp, thích hợp làm mưu sĩ, hành chính, công việc pháp luật, vận gặp người giúp đỡ tốt.' },
  '天梁': { attr: 'Thổ · Sao Ấm', brief: 'Sao Ấm, chủ lão thành và che chở. Chính trực ổn trọng, lòng từ bi mạnh, được trời che chở, thích hợp y tế, công tác xã hội, lĩnh vực tôn giáo.' },
  '七杀': { attr: 'Kim Hỏa · Sao Tướng', brief: 'Sao Tướng, chủ cương liệt và khai phá. Tính cách cương nghị, năng lực hành động mạnh, dũng cảm thử thách, thích hợp khởi nghiệp, quân cảnh, ngành có tính cạnh tranh, gặp hung hóa cát.' },
  '破军': { attr: 'Thủy · Sao Hao', brief: 'Sao Hao, chủ biến động và khai mở. Dũng cảm đột phá, không sợ thay đổi, đời nhiều biến động nhưng có khí phách, thích hợp công việc mang tính khai phá, đi con đường người khác chưa đi.' },
};

// ─── Trang trí hình ảnh tính năng ────────────────────────────────────────
function FeatureVisual({ index, colors: c }: { index: number; colors: ReturnType<typeof useColors> }) {
  if (index === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="grid grid-cols-4 gap-1.5 w-72 mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCenter = [5, 6, 9, 10].includes(i);
            const isActive = [0, 3, 12, 15].includes(i);
            return (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="h-14 rounded-sm flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  border: `1px solid ${isActive ? c.goldLine : c.cardBorder}`,
                  background: isCenter ? 'transparent' : isActive ? c.starBg : c.featureBg,
                  color: isActive ? c.goldSolid : c.textFaint,
                  opacity: isCenter ? 0 : 1,
                }}>
                {isActive ? '★' : ''}
              </motion.div>
            );
          })}
        </div>
        <p className="text-[10px] tracking-widest transition-colors duration-300"
          style={{ color: c.textFaint }}>Phép lập lá số Nghê Hải Hạ</p>
      </div>
    );
  }

  if (index === 1) {
    const [sel, setSel] = useState<string | null>(null);
    const selInfo = sel ? (STAR_BRIEF[sel] ?? SIHUA_BRIEF[sel] ?? null) : null;
    return (
      <div className="flex flex-col gap-4 h-full justify-center">
        {[
          { group: 'Hệ Tử Vi', stars: ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'] },
          { group: 'Hệ Thiên Phủ', stars: ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'] },
        ].map(group => (
          <div key={group.group}>
            <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
              style={{ color: c.textFaint }}>{group.group}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.stars.map(s => (
                <motion.button key={s}
                  onClick={() => setSel(sel === s ? null : s)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs px-2 py-1 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${sel === s ? c.goldSolid : c.goldLine}`,
                    color: c.goldSolid,
                    background: sel === s ? `${c.goldLine}30` : 'transparent',
                    fontWeight: sel === s ? 600 : 400,
                  }}>
                  {starName(s)}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
            style={{ color: c.textFaint }}>Tứ Hóa phi tinh</div>
          <div className="flex gap-2 flex-wrap">
            {[['化禄', 'rgba(52,211,153,0.7)'], ['化权', 'rgba(96,165,250,0.7)'], ['化科', 'rgba(250,204,21,0.7)'], ['化忌', 'rgba(248,113,113,0.7)']].map(([label, color]) => (
              <motion.button key={label}
                onClick={() => setSel(sel === label ? null : label)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer"
                style={{
                  border: `1px solid ${color}`,
                  color,
                  background: sel === label ? `${color.replace('0.7', '0.15')}` : 'transparent',
                  fontWeight: sel === label ? 600 : 400,
                }}>
                {sihuaName(label)}
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {selInfo && (
            <motion.div key={sel}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4 mt-1.5"
              style={{ border: `1px solid ${c.goldLine}`, background: c.featureBg }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: c.goldSolid }}>{sel ? (starName(sel) !== sel ? starName(sel) : sihuaName(sel)) : ''}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: c.tagText, border: `1px solid ${c.goldLine}` }}>{selInfo.attr}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>{selInfo.brief}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (index === 2) {
    const msgs = [
      { role: 'user', text: 'Vận sự nghiệp năm nay của tôi thế nào?' },
      { role: 'ai', text: 'Cung Mệnh có Thiên Cơ Hóa Lộc, Đại Hạn năm nay vào Cung Quan Lộc, Tam Phương có Tả Phụ trợ giúp, sự nghiệp có người giúp đỡ dẫn dắt, thích hợp chủ động mở rộng…' },
      { role: 'user', text: 'Khi nào vận tình cảm tốt nhất?' },
    ];
    return (
      <div className="flex flex-col gap-2 h-full justify-center">
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] text-[11px] px-3 py-2 rounded-lg leading-relaxed"
              style={{
                border: `1px solid ${m.role === 'user' ? c.goldLine : c.cardBorder}`,
                background: m.role === 'user' ? c.starBg : c.featureBg,
                color: m.role === 'user' ? c.goldSolid : c.textSecond,
              }}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (index === 3) {
    const patterns = [
      { name: 'Sát Phá Tham cách', desc: 'Mệnh khai phá tiến thủ', ok: true },
      { name: 'Liêm Tướng cách',   desc: 'Cách hành chính ấn thụ', ok: true },
      { name: 'Hóa Kỵ nhập Mệnh', desc: 'Cần quan tâm vấn đề tâm lý', ok: false },
    ];
    return (
      <div className="flex flex-col gap-3 h-full justify-center">
        {patterns.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              border: `1px solid ${p.ok ? 'rgba(96,165,250,0.25)' : 'rgba(251,146,60,0.25)'}`,
              background: p.ok ? 'rgba(96,165,250,0.05)' : 'rgba(251,146,60,0.05)',
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: p.ok ? 'rgba(96,165,250,0.6)' : 'rgba(251,146,60,0.6)' }} />
            <div>
              <div className="text-[11px] font-medium"
                style={{ color: p.ok ? 'rgba(147,197,253,0.8)' : 'rgba(253,186,116,0.8)' }}>{p.name}</div>
              <div className="text-[10px]" style={{ color: c.textMuted }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
        <div className="text-[9px] mt-2 tracking-wider text-center" style={{ color: c.textFaint }}>
          Tự động nhận diện 11 Cách Cục kinh điển
        </div>
      </div>
    );
  }

  return null;
}

// ─── 主页 ─────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = useColors(theme);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // 把 body / html 背景同步到 home 主题色，消除半透明 nav 透出 #fafaf9 的色差
  // useLayoutEffect 保证在浏览器绘制前同步更新，避免与根 div 的 transition 不同步
  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  return (
    <div style={{ background: c.bgBase, transition: 'background 0.35s ease' }} className="overflow-x-hidden">
      {/* Thông báo đến người dùng — che toàn màn hình khi truy cập lần đầu, đóng rồi mới vào trang chủ */}
      <AnnouncementModal />

      <StarField />

      {/* Hào quang toàn cục */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }} />
      </div>

      {/* ── Thanh điều hướng trên cùng ── nav cùng màu với hero (c.bgBase), không blur không border, hoàn toàn không có dải lệch màu */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-2"
        style={{
          background: c.navBg,
        }}>
        <div className="text-[11px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] font-medium transition-colors duration-300 flex-shrink-0"
          style={{ color: c.goldSolid }}>
          Lá Số Tử Vi
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/heming')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.navBorder}`, color: c.textMuted }}>
            Hợp Hôn
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.goldLine}`, color: c.goldSolid }}>
            Lập lá số ngay
          </motion.button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[82svh] lg:min-h-[92vh] flex flex-col items-center justify-center px-6 z-10 pb-24 pt-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity, maxWidth: '960px' }} className="text-center w-full mx-auto mt-10">
          {/* Dòng nhãn */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[11px] tracking-[0.45em] transition-colors duration-300" style={{ color: c.tagText }}>
              Tử Vi Đẩu Số · Hệ thống Nghê Hải Hạ
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </motion.div>

          {/* Tiêu đề chính */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: 'relative', display: 'inline-block' }}>
            <h1
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-none mb-5`}
              style={{
                fontSize: 'clamp(56px, 10vw, 124px)',
                letterSpacing: '0.07em',
              }}>
              Lá Số Tử Vi
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-base md:text-lg tracking-[0.18em] mb-2"
            style={{ color: c.textSecond, fontWeight: 500 }}>
            Tử Vi là cửa · Thiên Địa Nhân là đường · Nghê Hải Hạ là thầy
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-xs md:text-sm tracking-[0.3em] mb-6"
            style={{ color: c.textMuted, opacity: 0.85 }}>
            AI giải đáp · Tri hành hợp nhất
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-sm max-w-xl mx-auto leading-relaxed mb-10"
            style={{ color: c.textMuted }}>
            Nhập năm, tháng, ngày, giờ sinh để tạo lá số Tử Vi Đẩu Số riêng của bạn — các học phần Thiên Kỷ, Địa Kỷ, Nhân Kỷ sẽ lần lượt mở sau.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ y: -2, filter: 'brightness(1.06)' }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/chart')}
              className="px-12 py-4 font-semibold text-base tracking-widest rounded-full"
              style={{ background: c.ctaBg, color: c.ctaText }}>
              Lập lá số ngay
            </motion.button>
          </motion.div>

          {/* 14 chính tinh */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-12 grid grid-cols-7 gap-1.5 max-w-[540px] mx-auto">
            {STARS.map((star, i) => (
              <motion.div key={star.name}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.05 + i * 0.03, duration: 0.35 }}
                className="flex items-center justify-center px-2 py-1 rounded-full"
                style={{ background: c.starBg, border: `1px solid ${c.starBorder}` }}>
                <span className="text-[11px] tracking-wide" style={{ color: c.starText }}>{starName(star.name)}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Ghi chú thông báo ra mắt — định vị tuyệt đối bên phải trên desktop */}
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 0 }}
          animate={{ opacity: 1, x: 0, rotate: -4 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute hidden lg:block pointer-events-none"
          style={{
            right: 'clamp(2%, 6vw, 8%)',
            top: '54%',
            maxWidth: '240px',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
            border: '2px dashed rgba(232,132,62,0.45)',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(196,90,45,0.18), 0 2px 6px rgba(196,90,45,0.1)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px', lineHeight: 1 }}>🎁</div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              <span style={{ color: '#c45a2d', fontWeight: 700, fontSize: '14px' }}>1/5 — 8/5</span>
              <span> Ưu đãi có thời hạn</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              Toàn bộ tính năng + hỏi AI
              <strong style={{ color: '#c45a2d' }}> hoàn toàn miễn phí</strong>
            </div>
          </div>
        </motion.div>

        {/* Ghi chú thông báo ra mắt — hiển thị dạng luồng bình thường trên di động (căn giữa dưới nội dung hero) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="lg:hidden mx-auto mt-8 mb-2 pointer-events-none"
          style={{
            maxWidth: 'min(280px, 84vw)',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
            border: '2px dashed rgba(232,132,62,0.45)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 6px 18px rgba(196,90,45,0.16), 0 2px 4px rgba(196,90,45,0.08)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px', lineHeight: 1 }}>🎁</div>
            <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              <span style={{ color: '#c45a2d', fontWeight: 700, fontSize: '13px' }}>1/5 — 8/5</span>
              <span> Ưu đãi có thời hạn</span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              Toàn bộ tính năng + AI <strong style={{ color: '#c45a2d' }}>hoàn toàn miễn phí</strong>
            </div>
          </div>
        </motion.div>

        {/* Gợi ý cuộn (định vị tuyệt đối, không ảnh hưởng tính toán opacity của hero) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: c.scrollText }}>Khám phá thêm</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${c.scrollLine}, transparent)` }} />
        </motion.div>
      </section>

      {/* ══ 哲学引言 ══════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden min-h-[82svh] lg:min-h-[92vh] flex items-center" style={{ padding: '72px 24px' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="absolute inset-0"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, #020810 0%, #020810 6%, #030a18 22%, #0d0820 40%, #0a0618 68%, #030a18 86%, #020810 100%)'
              : 'linear-gradient(to bottom, #f5efe0 0%, #f5efe0 6%, #c08055 18%, #6a2810 32%, #1e0a02 50%, #1e0a02 70%, #6a2810 84%, #f5efe0 100%)',
            transition: 'background 0.4s ease',
          }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-bold" style={{ fontSize: 'clamp(220px, 38vw, 460px)', color: 'rgba(212,168,67,0.012)', lineHeight: 1, fontFamily: 'serif' }}>命</span>
        </div>
        <FadeIn className="relative mx-auto text-center w-full" y={20}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.45))' }} />
            <span className="text-[10px] tracking-[0.55em] uppercase" style={{ color: 'rgba(212,168,67,0.5)' }}>Mệnh · Vận · Quan</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,67,0.45))' }} />
          </div>
          <div className="space-y-3" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {[
              { text: 'Ý nghĩa của việc đoán biết vận mệnh trước', size: 'clamp(17px, 2.2vw, 28px)', color: 'rgba(215,228,252,0.72)', delay: 0.1 },
              { text: 'không nằm ở việc biết trước tương lai', size: 'clamp(21px, 2.6vw, 32px)', color: 'rgba(220,232,250,0.74)', delay: 0.25 },
              { text: 'mà ở việc không ngừng nhận thức bản thân', size: 'clamp(24px, 3vw, 40px)', color: 'rgba(218,230,248,0.8)', delay: 0.34 },
            ].map((line, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: line.delay }}
                className="tracking-wider" style={{ fontSize: line.size, color: line.color, fontWeight: 400 }}>
                {line.text}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold`}
              style={{ fontSize: 'clamp(24px, 3.4vw, 48px)', letterSpacing: '0.05em', lineHeight: 1.35 }}>
              để cuối cùng viết nên kịch bản đời mình
            </motion.p>
          </div>
        </FadeIn>
      </section>

      {/* ══ Dòng thời gian 4 học phần lớn ════════════════════════════ */}
      <section className="relative z-10 py-20 lg:py-24 px-6"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.03) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.04) 50%, transparent 100%)',
        }}>
        <FadeIn className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: c.goldSolid, opacity: 0.7 }}>Curriculum</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-2 tracking-[0.15em]" style={{ color: c.textPrimary }}>
            Phương pháp luận của thầy Nghê · Mở dần theo từng phần
          </div>
          <div className="text-xs lg:text-sm tracking-[0.1em]" style={{ color: c.textMuted }}>
            Bắt đầu từ Tử Vi, dần mở các học phần Thiên Kỷ / Địa Kỷ / Nhân Kỷ
          </div>
        </FadeIn>

        <div className="max-w-sm lg:max-w-5xl mx-auto relative">
          {/* Đường kết nối ngang (chỉ desktop) */}
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5"
            style={{
              background: `linear-gradient(90deg, ${c.goldSolid} 0%, ${c.goldSolid} 25%, ${c.goldLine} 25%)`,
              opacity: 0.6,
            }} />

          {/* Đường kết nối dọc (chỉ di động) — điểm tròn áp sát đường, theo phong cách "bản đồ tuyến tàu điện" */}
          <div className="lg:hidden absolute left-7 top-7 bottom-7 w-px -translate-x-1/2"
            style={{
              background: `linear-gradient(180deg, ${c.goldSolid} 0%, ${c.goldSolid} 22%, ${c.goldLine} 22%)`,
              opacity: 0.6,
            }} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-4">
            {SECTIONS.map((s, i) => {
              const ready = s.status === 'ready';
              return (
                <motion.div key={s.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0">
                  {/* Vòng tròn nút */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center lg:mb-3"
                    style={{
                      background: ready
                        ? `linear-gradient(135deg, ${c.goldSolid} 0%, ${c.goldSolid}cc 100%)`
                        : (theme === 'dark' ? 'rgba(184,146,42,0.05)' : '#fdf8ee'),
                      border: ready ? 'none' : `2px dashed ${c.goldLine}`,
                      color: ready ? '#fff' : c.textMuted,
                      boxShadow: ready ? `0 4px 16px ${c.goldSolid}55` : 'none',
                    }}>
                    <span className="text-2xl">{s.icon}</span>
                    {ready && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                        style={{ background: '#10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.4)' }}>
                        ✓
                      </div>
                    )}
                  </div>
                  {/* Nhóm chữ: di động xếp một cột bên phải; desktop xếp chồng căn giữa */}
                  <div className="flex-1 lg:flex-none flex flex-col items-start lg:items-center min-w-0">
                    {/* Hàng trên: nhãn thời gian + tên học phần + note (di động inline; desktop vẫn xuống dòng) */}
                    <div className="flex items-baseline gap-2 lg:flex-col lg:gap-0 lg:mb-1">
                      <div className="text-[10px] tracking-[0.25em] lg:mb-1.5"
                        style={{ color: ready ? '#10b981' : c.textMuted, fontWeight: 500 }}>
                        {s.when}
                      </div>
                      <div className="text-base lg:text-xl font-semibold tracking-[0.15em]"
                        style={{ color: c.textPrimary }}>
                        {s.name}
                      </div>
                      {s.note && (
                        <div className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-full lg:hidden"
                          style={{
                            color: c.goldSolid,
                            background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                            border: `1px solid ${c.goldLine}`,
                            opacity: 0.85,
                          }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                    {/* Note riêng cho desktop (di động đã hiển thị inline ở hàng trên) */}
                    {s.note && (
                      <div className="hidden lg:block text-[9px] tracking-[0.15em] mb-1.5 px-2 py-0.5 rounded-full"
                        style={{
                          color: c.goldSolid,
                          background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                          border: `1px solid ${c.goldLine}`,
                          opacity: 0.85,
                        }}>
                        {s.note}
                      </div>
                    )}
                    {/* Giới thiệu */}
                    <div className="text-[11px] lg:text-xs leading-relaxed lg:max-w-[200px] mt-0.5 lg:mt-0"
                      style={{ color: c.textSecond }}>
                      {s.desc}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ Giải thích chi tiết tính năng ══════════════════════════════════════ */}
      <section className="relative z-10">
        {FEATURES.map((feature, i) => (
          <div key={i}
            className={`flex items-center px-6 md:px-10 lg:px-14 py-20 md:py-24 ${i <= 2 ? 'min-h-[82svh] lg:min-h-[92vh]' : ''}`}
            style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}>
            <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
              <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.45fr_0.55fr]' : 'lg:grid-cols-[0.55fr_0.45fr]'} gap-10 lg:gap-16 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* Khu vực chữ */}
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <FadeIn delay={0}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ background: c.goldLine }} />
                      <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>{feature.tag}</span>
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-tight mb-5 tracking-tight`}
                      style={{
                        fontSize: i < 2 ? 'clamp(36px, 4vw, 56px)' : 'clamp(30px, 3.5vw, 48px)',
                        whiteSpace: 'pre-line',
                      }}>
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <p className="text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>{feature.subtitle}</p>
                  </FadeIn>
                  <div className="space-y-4">
                    {feature.points.map((point, j) => (
                      <FadeIn key={j} delay={0.25 + j * 0.08}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: c.goldSolid, opacity: 0.6 }} />
                          <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{point}</p>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </div>
                {/* Khu trang trí hình ảnh */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <FadeIn delay={0.15}>
                    <div className="relative rounded-2xl overflow-hidden p-8 md:p-12"
                      style={{
                        border: `1px solid ${c.featureBord}`,
                        background: c.featureBg,
                        minHeight: i <= 1 ? '540px' : i === 2 ? '460px' : '320px',
                        boxShadow: c.cardShadow,
                      }}>
                      <FeatureVisual index={i} colors={c} />
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ Lý thuyết tam phân Thiên · Địa · Nhân ════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20"
        style={{ background: c.altSection, minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Ni Haixia · Philosophy</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-5 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                Thiên · Địa · Nhân
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
                Quan niệm vận mệnh cốt lõi của thầy Nghê Hải Hạ: vận mệnh chưa bao giờ là toàn bộ đời người.<br />
                Ông chia các lực ảnh hưởng đến đời người thành ba chiều kích quan trọng tương đương.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { glyph: '天', label: 'Vận mệnh tiên thiên', pct: '⅓', color: c.goldSolid, borderColor: c.goldLine, desc: 'Điều Tử Vi Đẩu Số hé lộ là cách cục lá số tiên thiên của một người — bố cục tinh diệu, số Ngũ Hành Cục, chính tinh Cung Mệnh được quyết định bởi thời điểm sinh ra. Đây chỉ là một phần ba của vận mệnh, là nền tảng của đời người, không phải toàn cảnh.', sub: 'Lá số · Tinh diệu · Ngũ Hành' },
              { glyph: '地', label: 'Môi trường địa lý', pct: '⅓', color: 'rgba(96,165,250,0.9)', borderColor: 'rgba(96,165,250,0.3)', desc: 'Môi trường địa lý, thành phố, quốc gia, cách cục phong thủy nơi bạn sinh sống, cho đến hoàn cảnh gia đình và cấu trúc xã hội, cùng tạo nên chiều kích thứ hai của vận mệnh. Cùng một lá số, sinh ở nơi khác nhau, vận hội có thể khác biệt hoàn toàn.', sub: 'Địa phương · Phong thủy · Môi trường' },
              { glyph: '人', label: 'Tâm niệm con người', pct: '⅓', color: 'rgba(100,216,139,0.9)', borderColor: 'rgba(100,216,139,0.3)', desc: 'Ý chí, tâm thái, sự lựa chọn và hành động của mỗi cá nhân mới là lực chủ động nhất để thay đổi vận mệnh. Thầy Nghê nhấn mạnh: hiểu lá số là để sống tốt hơn, không phải để ngồi chờ vận mệnh an bài. Tự rèn luyện bản thân là cách phá cách mạnh mẽ nhất.', sub: 'Ý chí · Lựa chọn · Hành động' },
            ].map((item, i) => (
              <FadeIn key={item.glyph} delay={0.1 + i * 0.12}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.1 }}
                  className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: c.cardBg, border: `1px solid ${item.borderColor}`, boxShadow: c.cardShadow }}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-5xl font-bold leading-none" style={{ color: item.color }}>{item.glyph}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                      <div className="text-[9px] mt-0.5 tracking-widest" style={{ color: c.textMuted }}>đời người</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-0.5" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[10px] tracking-wider" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                  <div className="h-px mb-4" style={{ background: item.borderColor }} />
                  <p className="text-xs leading-relaxed flex-1" style={{ color: c.textSecond }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="mt-10 text-center">
              <p className="text-sm leading-relaxed" style={{ color: c.textSecond }}>
                "Vận mệnh không phải toàn bộ đời người, cộng thêm vị trí địa lý và tâm niệm con người, mới là toàn bộ."
              </p>
              <p className="mt-2 text-[10px] tracking-widest" style={{ color: c.tagText }}>— Nghê Hải Hạ</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ Giới thiệu Nghê Hải Hạ ════════════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20" style={{ minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Master · 1953 – 2012</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-6 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                Thầy Nghê Hải Hạ
              </h2>
              <p className="max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: c.textSecond }}>
                Một trong những bậc thầy Trung y và thuật số có ảnh hưởng nhất trong giới người Hoa hiện đại<br />
                Người sáng lập Học viện Trung y Hán Đường (Mỹ) · để lại hai hệ thống giáo học lớn "Nhân Kỷ" và "Thiên Kỷ"
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-8 md:p-10 mb-8"
              style={{ border: `1px solid ${c.niBorder}`, background: c.niBg, boxShadow: c.cardShadow }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Sinh năm', value: '1954', sub: 'Đài Loan' },
                  { label: 'Qua đời', value: '2012', sub: '31/1 · hưởng thọ 58 tuổi' },
                  { label: 'Truyền thừa', value: 'Tử Vi Đẩu Số', sub: 'Kinh Phương Trung y · Kinh Dịch' },
                ].map(item => (
                  <div key={item.label} className="text-center rounded-xl px-4 py-3"
                    style={{ border: `1px solid ${c.niDivider}`, background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: c.textFaint }}>{item.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={{ color: c.goldSolid }}>{item.value}</div>
                    <div className="text-[11px]" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="h-px mb-8" style={{ background: c.niDivider }} />
              <div className="space-y-4 text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: c.textSecond }}>
                <p>
                  <strong style={{ color: c.goldSolid }}>Tiểu sử</strong>:
                  Ông Nghê Hải Hạ (1954–2012) sinh tại Đài Loan, thời trẻ theo học nhiều danh y Trung y, chuyên sâu phái Kinh Phương (truyền thừa của Thương Hàn Luận).
                  Trung niên sang Mỹ hành y, sáng lập <strong>Học viện Trung y Hán Đường</strong> tại Mỹ, hơn 20 năm truyền dạy có hệ thống Trung y và thuật số truyền thống.
                  Ông qua đời tại Đài Loan ngày 31 tháng 1 năm 2012 do ung thư gan, hưởng thọ 58 tuổi.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Hệ thống giáo học</strong>:
                  Thầy Nghê đã hệ thống hóa toàn bộ kiến thức cả đời thành hai chuỗi giáo học công khai lớn.
                  <strong>"Nhân Kỷ"</strong> bao gồm Châm Cứu Đại Thành, Thần Nông Bản Thảo Kinh, Hoàng Đế Nội Kinh, Thương Hàn Luận, Kim Quỹ Yếu Lược —
                  đây là "kỷ của con người", đặt nền tảng cho lộ trình học Trung y hoàn chỉnh;
                  <strong>"Thiên Kỷ"</strong> bao gồm Tử Vi Đẩu Số và Kinh Dịch — đây là "kỷ của trời", là thành quả hệ thống hóa nghiên cứu thuật số.
                  Hai hệ thống hợp lại là di sản truyền thừa hoàn chỉnh nhất mà thầy Nghê để lại cho hậu thế.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Lập trường về Tử Vi</strong>:
                  Về Tử Vi Đẩu Số, thầy Nghê thuộc rõ <strong>phái Tam Hợp Nam phái</strong>, chủ trương "lấy Cung Mệnh làm gốc, lấy Tam Phương Tứ Chính làm dụng, lấy Tứ Hóa làm cương lĩnh".
                  Trong khóa học Thiên Kỷ, ông nói rõ: "<em>Phi tinh (Tứ Hóa) bay đi bay lại quá phức tạp, tôi không theo cách đó, dù sao đại đạo chí giản</em>" —
                  lập trường này phân biệt rõ ông với phái Phi Tinh rườm rà.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Thái độ học thuật</strong>:
                  Thầy Nghê phản đối học vẹt công thức, nhấn mạnh "hiểu nguyên lý hơn là ghi nhớ thuộc lòng", "logic có thể kiểm chứng hơn là huyền học thần bí".
                  Thái độ này đã đưa Tử Vi Đẩu Số từ một hệ thống kín truyền miệng giữa thầy và trò, trở thành một hệ tri thức hiện đại có tính hệ thống, có thể kiểm chứng và có thể học được.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Ảnh hưởng đương đại</strong>:
                  Các video giảng dạy của thầy Nghê được lan truyền rộng rãi trên Bilibili, YouTube và nhiều nền tảng lớn, được công nhận là bài học nhập môn bắt buộc của thế hệ mới yêu thích luận mệnh và Trung y.
                  Ông không chỉ là người truyền thừa Tử Vi Đẩu Số, mà còn là một trong những nhân vật trọng yếu đưa luận mệnh và Trung y truyền thống vào hệ tri thức hiện đại.
                </p>
                <p style={{ fontSize: '11px', color: c.textMuted, fontStyle: 'italic', marginTop: '12px' }}>
                  Mọi luận giải trên nền tảng này được biên soạn dựa trên giáo trình công khai "Thiên Kỷ" của thầy Nghê, bản Minh của "Tử Vi Đẩu Số Toàn Thư", và cổ tịch truyền thống phái Tam Hợp,
                  chỉ nhằm mục đích tham khảo văn hóa và phát triển cá nhân. Thầy Nghê và nền tảng này không có bất kỳ liên quan thương mại nào.
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NI_TEACHINGS.map((teaching, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.08}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.1 }}
                  className="rounded-xl p-6 h-full"
                  style={{ border: `1px solid ${c.niCardBord}`, background: c.niCardBg, boxShadow: c.niCardShadow }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                      style={{ borderColor: c.goldLine }}>
                      <span className="text-[9px]" style={{ color: c.goldSolid }}>{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-medium leading-relaxed" style={{ color: c.goldSolid }}>{teaching.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed pl-8" style={{ color: c.textSecond }}>{teaching.body}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Cổng Hợp Hôn ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20">
        <div className="mx-auto" style={{ maxWidth: '1280px' }}>
          <div className="rounded-2xl p-10 md:p-14 text-center"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${c.cardBorder}`,
              boxShadow: c.cardShadow,
            }}>
            <FadeIn>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: c.goldLine }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Compatibility · Analysis</span>
                <div className="h-px w-8" style={{ background: c.goldLine }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
                Hợp Hôn Tử Vi
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: c.textSecond }}>
                Nhập thông tin sinh của hai người, AI dựa trên hệ thống Nghê Hải Hạ phân tích tương quan Cung Phu Thê, độ tương hợp Cung Mệnh và tương tác Tam Phương Tứ Chính,<br className="hidden md:block" />
                đưa ra mức độ hợp tình cảm, khả thi hợp tác và lời khuyên chung sống tốt nhất.
              </p>
              <div className="flex justify-center gap-3 flex-wrap mb-6">
                {['Phân tích độ hợp tình cảm', 'Đánh giá hợp tác khởi nghiệp', 'Luận giải duyên cha mẹ con cái', 'Đánh giá hợp trước hôn nhân'].map(item => (
                  <span key={item} style={{
                    fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                    background: theme === 'dark' ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.12)',
                    border: `1px solid ${c.goldLine}`,
                    color: c.goldSolid,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/heming')}
                className="px-10 py-3 font-medium text-sm tracking-widest rounded-full"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(140,100,20,0.1)',
                  border: `1px solid ${c.goldLine}`,
                  color: c.goldSolid,
                  cursor: 'pointer',
                }}>
                Bắt đầu phân tích hợp hôn
              </motion.button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ CTA cuối cùng ══════════════════════════════════════ */}
      <section className="relative z-10 py-40 px-6 text-center" style={{ background: c.altSection }}>
        <FadeIn>
          <p className="text-[10px] tracking-[0.6em] uppercase mb-6" style={{ color: c.tagText }}>Bắt đầu hành trình lá số của bạn</p>
          <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-8 tracking-tight leading-tight`}
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            Lá số Tử Vi của bạn<br />đang chờ được giải mã
          </h2>
          <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: c.textSecond }}>
            Nhập năm, tháng, ngày, giờ sinh để tạo lá số riêng của bạn trong vài giây<br />
            rồi để AI luận giải chuyên sâu cho bạn theo hệ thống Nghê Hải Hạ
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="px-14 py-4 font-semibold text-base tracking-widest rounded-full"
            style={{ background: c.ctaBg, color: c.ctaText }}>
            Lập lá số miễn phí
          </motion.button>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <motion.a
              href="/knowledge"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              ✦ Kho tri thức Tử Vi Đẩu Số →
            </motion.a>
            <motion.a
              href="/library"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              📜 Kho cổ tịch nguyên bản →
            </motion.a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6"
        style={{ borderTop: `1px solid ${c.niCardBord}` }}>

        {/* Placeholder điều hướng 4 học phần (đã ra mắt + sắp mở) */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-[9px] tracking-[0.3em] text-center mb-4 uppercase"
            style={{ color: c.textMuted, opacity: 0.6 }}>
            Phương pháp luận của thầy Nghê · Hệ thống học thuật
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {SECTIONS.map(s => {
              const ready = s.status === 'ready';
              return (
                <a
                  key={s.key}
                  href={ready ? '/chart' : undefined}
                  onClick={ready ? undefined : (e) => e.preventDefault()}
                  className="rounded-lg px-3 py-3 text-center transition-all"
                  style={{
                    background: ready ? c.starBg : 'transparent',
                    border: `1px ${ready ? 'solid' : 'dashed'} ${ready ? c.goldLine : c.navBorder}`,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    textDecoration: 'none',
                  }}
                >
                  <div className="text-base font-semibold mb-0.5 tracking-[0.1em]"
                    style={{ color: ready ? c.goldSolid : c.textMuted }}>
                    {s.name}
                  </div>
                  <div className="text-[9px] tracking-wider"
                    style={{ color: ready ? '#10b981' : c.textMuted }}>
                    {ready ? '✓ Đã ra mắt' : `Mở ${s.when}`}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] tracking-wider mb-3" style={{ color: c.footerText }}>
            Lá Số Tử Vi · Dựa trên hệ thống chính truyền Nghê Hải Hạ · Chỉ mang tính tham khảo, vận mệnh nằm trong tay bạn
          </p>
          <p className="text-[10px] tracking-wider mb-3 max-w-2xl mx-auto leading-relaxed"
            style={{ color: c.footerText, opacity: 0.85 }}>
            Nền tảng này dựa trên nghiên cứu văn hóa truyền thống Trung Hoa, chỉ cung cấp tài liệu tham khảo học tập.<br className="sm:hidden" />
            Không cấu thành bất kỳ lời khuyên y tế, đầu tư, pháp lý hay quyết định trọng đại nào.
          </p>
          <p className="text-[10px] tracking-wider" style={{ color: c.footerText }}>
            <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>Điều khoản dịch vụ</a>
            {' · '}
            <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>Chính sách bảo mật</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
