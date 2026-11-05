/**
 * 紫微斗数合盘知识库
 * 基于倪海厦《天纪》体系 + 《紫微斗数全书》古典断语 + 全网专业资料整合
 * 供合盘 AI 分析使用
 */

// ─── 十四主星在夫妻宫的完整断语 ──────────────────────────

export const STAR_IN_FUQI_GU: Record<string, {
  summary: string;       // 一句话核心
  good: string;          // 吉象条件/表现
  bad: string;           // 凶象/注意事项
  spouse_traits: string; // 配偶外形性格
  timing: string;        // 婚期建议
  ni_quote?: string;     // 倪海厦原话
}> = {
  '紫微': {
    summary: 'Phối ngẫu kiêu hãnh tài cán, nên kết hôn muộn, tình cảm lấy tôn trọng làm nền tảng',
    good: 'Tam phương có Tả Phụ Hữu Bật giáp, phối ngẫu hiền năng có tài, sau khi kết hôn được quý nhân trợ giúp; tam hợp thấy Lộc chủ tài lộc song toàn',
    bad: 'Cô quân không có phụ tá, phối ngẫu mạnh mẽ khó giao tiếp; cung Thìn Tuất tình cảm phu thê nhạt nhòa; hội Phá Quân: trước hôn nhân có nhiều trắc trở',
    spouse_traits: 'Phối ngẫu khí chất kiêu hãnh, có chính kiến, lòng tự tôn cao, năng lực mạnh mẽ nhưng không dễ dàng bộc lộ tình cảm',
    timing: 'Nên kết hôn muộn (nam trên 30, nữ trên 27), kết hôn sớm nhiều trắc trở',
    ni_quote: 'Tử Vi tại cung Phu Thê, cô khắc, nên kết hôn muộn, tình cảm tốt nhưng chi phí giao tiếp thấu hiểu cao',
  },
  '天机': {
    summary: 'Hôn nhân nhiều biến động, nên chọn phối ngẫu chênh lệch tuổi tác lớn',
    good: 'Thấy Lộc Tồn hoặc Hóa Lộc: tình cảm tạm có thể duy trì; hội Thái Âm: gia tăng sự tinh tế dịu dàng',
    bad: 'Hóa Kỵ hoặc hội Sát: tình cảm biến động lớn, dễ có chia ly; Thiên Cơ thiện biến, phối ngẫu đối với tình cảm do dự bất định',
    spouse_traits: 'Phối ngẫu thông minh đa biến, tâm tư tinh tế, duyên phận sâu sắc với tôn giáo triết học, có phần mẫn cảm hay suy nghĩ',
    timing: 'Nên chênh lệch tuổi tác tương đối lớn (cách nhau từ 6 tuổi trở lên), có thể giảm thiểu xung đột biến đổi của hai bên',
    ni_quote: 'Thiên Cơ thiện biến, không nên độc tọa, hôn nhân ngập tràn biến động',
  },
  '太阳': {
    summary: 'Nam mệnh trợ thê, nữ mệnh vượng phu; lạc hãm Hóa Kỵ thì ngược lại chủ hình khắc',
    good: 'Miếu vượng (cung Mão đến Thân): phối ngẫu tài cán, nam mệnh có hiền nội trợ; nữ mệnh lấy được chồng vượng, hôn nhân mỹ mãn',
    bad: 'Lạc hãm (cung Dậu đến Dần): nam mệnh phối ngẫu ốm yếu, nữ mệnh lấy phải chồng tầm thường; Hóa Kỵ: nữ mệnh "thượng bất kiến phụ, hạ bất kiến tử, trung bất kiến phu" (trên không thấy cha, dưới không thấy con, giữa không thấy chồng), mười năm đó người chồng gặp đại nạn',
    spouse_traits: 'Phối ngẫu cởi mở hào phóng, có ý thức về hình ảnh công chúng, khẳng khái nhưng đôi khi quá mức mạnh mẽ áp đặt',
    timing: 'Xu hướng tình cảm trước nồng sau lạnh, nên giữ khoảng cách thích hợp để duy trì cảm giác tươi mới',
    ni_quote: 'Thái Dương Hóa Kỵ, trên không thấy cha, dưới không thấy con, giữa không thấy chồng —— nữ mệnh mười năm đó người chồng ắt gặp tai họa lớn',
  },
  '武曲': {
    summary: 'Sao quả tú cô quả, hôn nhân hình khắc, hết thảy đều nên kết hôn muộn',
    good: 'Vũ Khúc Hóa Lộc: phối ngẫu có năng lực tài chính, nhưng nam mệnh lại ngại vợ quá tài cán; thấy Lộc Tồn giáp phụ: hôn nhân vững chắc có tài lộc',
    bad: 'Hóa Kỵ: cô quả, khó kết hôn, hoặc phối ngẫu thân mang tàn tật; Vũ Khúc Thất Sát (cung Mão Dậu): điềm hôn nhân xấu xí; gặp bất kỳ sao nào trong Tứ Sát: chủ ly hôn; Vũ Khúc Phá Quân: thấy Sát Kỵ Hình diệu hôn nhân tất bất lợi',
    spouse_traits: 'Phối ngẫu cương liệt độc lập, ăn nói trực diện, không giỏi bày tỏ tình cảm, năng lực kinh tế mạnh nhưng tính cách khá cô khắc',
    timing: 'Hệ Vũ Khúc nhất luật kiến nghị kết hôn sau 30 tuổi, kết hôn sớm thì sớm tan',
    ni_quote: 'Vũ Khúc Hóa Kỵ, là sao hình tù, hệ Vũ Khúc hôn nhân nên muộn',
  },
  '天同': {
    summary: 'Phối ngẫu ôn hòa hưởng lạc, nên chênh lệch tuổi tác tương đối lớn, kết hôn muộn là cát',
    good: 'Thấy Lộc Tồn hoặc Hóa Lộc: phối ngẫu ôn hòa mang lại tài lộc, gia đình an ổn; đồng cung với Thái Âm: tình cảm dịu dàng ngọt ngào',
    bad: 'Hóa Kỵ: tình cảm lúc đầu còn được, dần dần nhạt phai, do thiếu hòa hợp mà sinh ra oán trách; gặp nhiều Sát: lười biếng biến thành gánh nặng',
    spouse_traits: 'Phối ngẫu ôn hòa thiện lương, lạc quan hòa đồng, nhưng có thể lười biếng, chủ nghĩa hưởng lạc khá nặng',
    timing: 'Nam cưới vợ kém tuổi, nữ lấy chồng hơn tuổi, chênh lệch tuổi từ 8 năm trở lên là kết tóc se duyên đẹp nhất',
  },
  '廉贞': {
    summary: 'Chính tinh bất ổn nhất tại cung Phu Thê, nguy cơ sinh ly tử biệt cao',
    good: 'Liêm Trinh Thiên Phủ (Tý Ngọ): phối ngẫu ôn hòa thanh tú, tình cảm tạm ổn, phối ngẫu phần nhiều là người làm công ăn lương',
    bad: 'Liêm Trinh Tham Lang: không sinh ly cũng tử biệt; Liêm Trinh Phá Quân: thủy trung tố phần mộ (chôn thân dưới nước); Liêm Trinh Thất Sát: bán lộ mai thi (chôn xác nửa đường); Hóa Kỵ: tình cảm quấy nhiễu không dứt, hợp tan luẩn quẩn; đồng cung với Hỏa Tinh: dẫu có cát diệu cũng ly cư phân phòng',
    spouse_traits: 'Phối ngẫu ngoại hình nổi bật, giỏi giao tế, mang lại giá trị cảm xúc cao nhưng thiếu ổn định; có thể xa nhiều gần ít',
    timing: 'Nam mệnh nên lấy vợ kém tuổi (trẻ hơn 6-12 tuổi), nữ mệnh nên lấy chồng lớn tuổi hơn',
    ni_quote: 'Liêm Trinh Tham Lang / Liêm Trinh Phá Quân tại cung Phu Thê, bất kể nam mệnh hay nữ mệnh, không sinh ly cũng tử biệt; Liêm Trinh Thất Sát —— bán lộ mai thi (chôn xác nửa đường); Liêm Trinh Phá Quân —— thủy trung tố trủng (làm mả dưới nước); Liêm Trinh Tham Lang —— hoành yểu (chết yểu)',
  },
  '天府': {
    summary: 'Thiện diệu, chủ sinh ly không tử biệt, tình cảm bình ổn nhưng bình đạm',
    good: 'Thấy Lộc Tồn hoặc Hóa Lộc: tài lộc song toàn, tình cảm vững bền; tam phương không có Sát: vợ chồng bình yên hòa hợp',
    bad: 'Tả Phụ Hữu Bật đơn tinh: dễ có cuộc hôn nhân thứ hai; gặp Tứ Sát: tình cảm lạnh nhạt, xác suất sinh ly gia tăng',
    spouse_traits: 'Phối ngẫu nhã nhặn lịch thiệp, sở thích rộng rãi, giữ tiền có nguyên tắc, năng lực làm việc mạnh, nhưng thiên về bảo thủ',
    timing: 'Nam mệnh phối ngẫu lớn tuổi hơn, nữ mệnh phối ngẫu nhỏ tuổi hơn; tình cảm ổn định nhưng cần chủ động vun đắp',
  },
  '太阴': {
    summary: 'Thích phối ngẫu thanh tú dịu dàng; lạc hãm gia Sát thì tình cảm nhiều trắc trở biến động',
    good: 'Miếu vượng (Tý đến Ngọ) thấy cát tinh: phối ngẫu tú khí có thành tựu, nam mệnh vợ đẹp; nữ mệnh: bản thân xinh đẹp có khí chất',
    bad: 'Lạc hãm (Mùi đến Hợi): tình cảm dễ biến động, sức khỏe phối ngẫu kém; Hóa Kỵ (nam mệnh đặc biệt kỵ): mẹ chồng nàng dâu bất hòa, vợ và mẹ tất sinh xung đột; gặp Hỏa Tinh Linh Tinh: tình cảm gặp biến cố lớn',
    spouse_traits: 'Phối ngẫu dịu dàng thanh tú, tinh tế nhạy cảm, trọng tình cảm, nhưng đôi khi cảm tính',
    timing: 'Không có ước thúc đặc thù, nhưng khi lạc hãm nên kết hôn muộn',
    ni_quote: 'Mạng người đàn ông sợ nhất là Thái Âm Hóa Kỵ, mẹ chồng nàng dâu bất hòa, vợ với mẹ nhất định sẽ bất hòa',
  },
  '贪狼': {
    summary: 'Đào hoa vượng nhất, hôn nhân bất ổn, nguy cơ ngoại tình cao',
    good: 'Hóa Lộc: phối ngẫu tài nghệ giỏi, phong tình vạn chủng, tình cảm ngọt ngào (nhưng nguy cơ ngoại tình không giảm); gặp Hóa Khoa: giảm bớt ngoại tình',
    bad: 'Hóa Kỵ: thường có lần hôn nhân thứ hai; Tử Vi Tham Lang (Mão Dậu): phối ngẫu thường hay đi xa, có điềm ngoại tình; gặp Tứ Sát: tất sinh ly; Tham Lang tại cung Ngọ (võ quan tinh): ngược lại chủ phối ngẫu làm việc võ chức, tương đối ổn định',
    spouse_traits: 'Phối ngẫu tài nghệ xuất chúng, năng lực xã giao mạnh, duyên với người khác giới cực tốt, nhưng dục vọng mãnh liệt, khó ước thúc',
    timing: 'Kết hôn sớm tình cảm nhiều biến động, nên kết hôn muộn; trước khi kết hôn nhất định phải tìm hiểu kỹ các mối quan hệ khác giới của đối phương',
    ni_quote: 'Tham Lang ngoài việc chỉ sao đào hoa, còn chỉ tửu sắc tài khí cờ bạc, thảy đều nằm trong Tham Lang; Tham Lang tại cung Ngọ là sao võ quan, chớ tùy tiện phê là đào hoa',
  },
  '巨门': {
    summary: 'Nhiều khẩu thiệt thị phi, vợ chồng dễ tranh cãi, cần Thái Dương hóa giải',
    good: 'Thái Dương miếu vượng tương hội: ngược lại chủ hôn nhân hòa thuận tốt đẹp, tài ăn nói biến thành lợi khí giao tiếp; Hóa Lộc: vợ hiền năng, đường tài lộc nhờ vợ mà hanh thông',
    bad: 'Hóa Kỵ: phối ngẫu cằn nhằn lắm lời, thị phi không dứt; đồng độ với Đà La: vợ chồng tự chuốc phiền muộn; độc thủ không có cát tinh: tình cảm ức chế, nhiều mâu thuẫn tầng sâu',
    spouse_traits: 'Phối ngẫu tài ăn nói tốt, lòng đố kỵ mạnh, để ý sĩ diện, đôi khi quá mức soi xét, nhưng nội tâm sâu sắc nghĩa tình',
    timing: 'Không có ước thúc đặc thù, nhưng cần chuẩn bị sẵn tâm lý thấu hiểu cọ xát lâu dài',
  },
  '天相': {
    summary: 'Lương duyên "thân càng thêm thân", phu xướng phụ tùy, mô hình hôn nhân hợp tác',
    good: 'Thấy Tả Phụ Hữu Bật song toàn: tình cảm trung thành, hôn nhân vững chắc; phối ngẫu chính trực chất phác; Thiên Tướng tam hợp thấy Lộc: tài lộc đáng kỳ vọng',
    bad: 'Tả Phụ hoặc Hữu Bật đơn tinh: có thể báo trước tái hôn; gặp nhiều Sát: trong tình cảm chịu nhiều ức chế tủi thân, không giỏi giãi bày',
    spouse_traits: 'Phối ngẫu chính trực chất phác, giữ chữ tín, không thích xung đột, giỏi điều hòa, là bạn đời tuyệt vời',
    timing: 'Phần nhiều phát triển từ mối quan hệ quen biết như bạn học, đồng nghiệp, láng giềng, vợ chồng rất nên hợp tác cùng làm việc',
  },
  '天梁': {
    summary: 'Thích phối ngẫu có tinh thần trách nhiệm cao hoặc lớn tuổi hơn, trước hôn nhân nhiều trắc trở sóng gió',
    good: 'Thấy Lộc: Phối ngẫu có phúc đức, tình cảm vững vàng chân thật; tam hợp phương có Cát tinh: Việc vun đắp tình cảm thận trọng và lý trí',
    bad: 'Hóa Kỵ hoặc thấy Sát tinh: Hay cằn nhằn lắm lời, thích áp đặt thuyết phục, tình cảm xa cách; Thiên Lương phối Thiên Mã: Vợ chồng vì hoàn cảnh mà ly tán phân cách; trước hôn nhân dễ thất bại mối tình đầu',
    spouse_traits: 'Phối ngẫu giàu tinh thần trách nhiệm, chững chạc già dặn, giỏi nói đạo lý, nhưng đôi lúc có xu hướng lên lớp dạy đời',
    timing: 'Trước hôn nhân nhiều trắc trở là chuyện thường tình, một khi đã kết hôn thì trái lại rất vững chắc; không có Sát tinh thì sau khi kết hôn tình cảm càng thêm sâu đậm',
  },
  '七杀': {
    summary: '"Uyên khâm bán lãnh" (chăn loan nửa lạnh) —— tụ ít xa nhiều, nên kết hôn muộn sau 30 tuổi',
    good: 'Miếu vượng (cung Dần Thân): Phối ngẫu tuy cương nghị nhưng rất mực trung thành, một khi đã dấn thân thì dốc lòng cống hiến; có Hóa Lộc tương trợ: Giảm bớt tính cô khắc',
    bad: 'Gặp Sát tinh: Tình cảm bề ngoài hòa thuận nhưng trong lòng bất mãn, nam mệnh chủ cưới vợ hai; nữ mệnh nên làm kế thất lương duyên muộn; cung Mão Dậu (Vũ Khúc Thất Sát): Vận hôn nhân xấu nhất',
    spouse_traits: 'Phối ngẫu cương nghị cô độc, yêu từ cái nhìn đầu tiên nhanh mà rời đi cũng nhanh, trong tình yêu nồng nhiệt hay nguội lạnh đều chóng vánh',
    timing: 'Nhất loạt nên kết hôn muộn, sau 30 tuổi hôn nhân tương đối vững bền; kết hôn sớm nhiều hình khắc',
    ni_quote: 'Thất Sát cư phu phụ nhi uyên khâm bán lãnh (cổ phú: Thất Sát ở cung Phu Thê chăn loan nửa lạnh); Nếu bạn cưới phải một cô vợ có Thất Sát nhập Mệnh, thì đời bạn coi như hỏng mất một nửa rồi, mệt mỏi vô cùng, lúc nào cũng như thấy cỏ cây đều là quân giặc (thảo mộc giai binh)',
  },
  '破军': {
    summary: 'Sao phá hao hôn nhân bậc nhất không ai bằng, theo đuổi tình cảm không chịu ràng buộc',
    good: 'Hóa Lộc: Phá rồi mới lập, tình cảm trải qua sóng gió trắc trở trái lại có thể đi được đến cuối cùng; Anh tinh nhập miếu: Phối ngẫu anh tuấn khí khái có cá tính',
    bad: 'Hóa Kỵ: Bị phá hoại triệt để, phần nhiều nhiều lần kết hôn hoặc không kết hôn; Tử Vi Phá Quân (Sửu Mùi): Không thêm Sát tinh cũng hình khắc, thêm Sát tinh ắt ly tán; hội cùng Liêm Trinh: Chôn mả dưới nước (thủy trung tố trủng); sau tuổi trung niên có tượng phân giường phân phòng',
    spouse_traits: 'Phối ngẫu theo đuổi tự do, ghét bị ràng buộc, dám đột phá, nhưng quan niệm hôn nhân mỏng manh, một đời nhiều biến động lớn',
    timing: 'Trước hôn nhân dễ trúng tiếng sét ái tình hoặc vội vã kết hôn thảo suất, nên kéo dài thời gian tìm hiểu tiếp xúc rồi mới quyết định',
    ni_quote: 'Liêm Trinh Phá Quân tại cung Phu Thê, chôn mả dưới nước (thủy trung tố trủng); Phá Quân là ngôi sao có sức tàn phá hôn nhân mạnh nhất',
  },
};

// ─── 四化在夫妻宫的完整断语 ──────────────────────────────────

export const SIHUA_IN_FUQI_GU = {
  '化禄': 'Có nhân duyên tiền định với phối ngẫu, phối ngẫu tính tình lạc quan, sau kết hôn tình cảm càng mặn nồng hơn, phối ngẫu ngày càng giỏi kiếm tiền, duyên phận sâu đậm; nếu là Tự Hóa Lộc thì tiền tài đến rồi đi, tình cảm có nhưng khó gìn giữ',
  '化权': 'Hôn nhân phần nhiều do chủ động tranh đấu giành lấy mà nên, phối ngẫu nắm quyền quyết sách, đại đa số mọi việc đều do phối ngẫu tự quyết, bản thân cần học cách buông tay; kiểu hôn nhân tranh thủ, càng cưỡng cầu càng khó đạt được',
  '化科': 'Được xem như Tiểu Lộc, có thể chung sống hòa hợp với phối ngẫu, có duyên quý nhân, rất có lợi cho việc yêu đương kết hôn; Hóa Khoa tại Phu Thê chủ phối ngẫu có danh tiếng hoặc kỹ năng chuyên môn xuất chúng',
  '化忌': 'Mắc nợ duyên nghiệp hôn nhân, cưới sớm ly sớm, khuyên nên kết hôn muộn hoặc không kết hôn; phối ngẫu thường có lời oán trách bản thân; Hóa Kỵ xung Cung Phu Thê lại càng hung hại —— điềm báo sinh ly tử biệt',
};

// ─── 合盘核心方法论 ─────────────────────────────────────────

export const HEMING_METHODOLOGY = `
## Khung cốt lõi phân tích hợp bàn (Hệ thống Nghê Hải Hạ + Tổng hợp 《Tử Vi Đẩu Số Toàn Thư》)

### I. Nguyên tắc liên tham song cung (Phương pháp đoán định hôn nhân quan trọng nhất của thầy Nghê)

**Khẩu quyết cốt lõi: "Xem hôn nhân mà chỉ nhìn mỗi Cung Phu Thê là đại sai lầm, nhất thiết phải đồng thời xem cả Cung Phúc Đức."**

- **Cung Phu Thê**: Xem tinh tính, ngoại hình, tính cách và mô thức tương tác của phối ngẫu
- **Cung Phúc Đức**: Đại diện cho tình cảm tầng sâu của vợ chồng, hôn nhân liệu có thể bền lâu
- **Công án thực tế của thầy Nghê**: "Có người Cung Phu Thê rất tốt, nhưng Cung Phúc Đức lại nát bét, tan! Vợ chồng ắt phải tan đàn xẻ nghé."

**Vì vậy khi hợp bàn nhất thiết phải đồng thời phân tích tam cung của cả hai bên: Cung Mệnh + Cung Phu Thê + Cung Phúc Đức**

---

### II. Tiêu chuẩn phán đoán thiên tác chi hợp

**Phối hợp cao cấp nhất (Thiên tác chi hợp)**:
- Chính tinh Cung Phu Thê của bên A = Chính tinh Cung Mệnh của bên B
- Chính tinh Cung Phu Thê của bên B = Chính tinh Cung Mệnh của bên A
- Hai bên tương hỗ đối ứng chuẩn xác, chính là một cặp trời sinh định mệnh

**Lương duyên thứ cấp**:
- Chính tinh Cung Phu Thê một bên = Chính tinh Cung Mệnh đối phương (đối ứng đơn chiều)
- Tinh tính Cung Mệnh đôi bên ngũ hành tương sinh (như mệnh Mộc phối mệnh Thổ, mệnh Thổ phối mệnh Thủy)
- Đôi bên Đại Hạn cùng bước vào vận thịnh vượng

**Tổ hợp hung triệu**:
- Đôi bên cùng có Hóa Kỵ xung vào Cung Mệnh của nhau (đích thị oan gia)
- Hóa Kỵ của một bên phi nhập vào Cung Phu Thê bên kia (mang lại tổn thương hôn nhân cho đối phương)
- Cung Phu Thê đôi bên đều hội ngộ trọng Sát mà không có Cát tinh tọa hộ

---

### III. Phương pháp hợp bàn năm bước hoàn chỉnh

**Bước 1: Đánh giá nền tảng mệnh cách đôi bên**
- Cách cục Cung Mệnh đôi bên có xứng đôi vừa lứa hay không (cùng loại hình hay tương bổ cho nhau)
- Trọng tâm xem xét: Sự phối hợp tinh tính giữa Cung Mệnh + Cung Thân + Cung Phúc Đức
- Cảnh giới: Đôi bên đều là cách Sát Phá Tham (hai hổ tranh hùng); hoặc một bên quá mạnh một bên quá yếu chênh lệch quá mức

**Bước 2: Đối sánh tương hỗ Cung Phu Thê**
- Chính tinh Cung Phu Thê bên A → Có đối ứng với các sao Cung Mệnh / Tam hợp phương của bên B không?
- Chính tinh Cung Phu Thê bên B → Có đối ứng với các sao Cung Mệnh / Tam hợp phương của bên A không?
- Trạng thái Tứ Hóa tại Cung Phu Thê của mỗi bên (Hóa Lộc / Hóa Kỵ có ảnh hưởng lớn nhất)

**Bước 3: Phân tích tinh tượng Thái Dương và Thái Âm**
- Nữ mệnh: Thái Dương đại diện cho người chồng; Thái Dương miếu vượng = vượng phu, lạc hãm Hóa Kỵ = khắc phu
- Nam mệnh: Thái Âm đại diện cho người vợ; Thái Âm miếu vượng = vợ đẹp hiền thục, Hóa Kỵ = mẹ chồng nàng dâu bất hòa
- Trạng thái của hai ngôi sao này trên lá số đôi bên ảnh hưởng trực tiếp đến chất lượng hôn nhân

**Bước 4: Phi hóa Tứ Hóa tương tham (Kỹ pháp cao cấp)**
- Can năm sinh của bên A → Tìm các sao Tứ Hóa → Xem các sao này rơi vào cung vị nào trên lá số của bên B:
  - Hóa Lộc phi nhập Cung Mệnh / Cung Tài Bạch bên B: Mang lại trợ giúp tích cực cho bên B
  - Hóa Kỵ phi nhập Cung Phu Thê bên B: Gây tổn thương hôn nhân cho bên B
  - Hóa Kỵ phi nhập Cung Mệnh bên B: Bản thân tạo áp lực nặng nề cho đối phương
- Can năm sinh của bên B → Phi hóa ngược lại để phân tích bên A
- Tạo thành thế "phi hóa tương tham", từ đó đoán định "loại hình duyên phận" hai chiều

**Bước 5: Phân tích đồng bộ Đại Hạn**
- Đại Hạn hiện tại đôi bên có cùng đi vào vận thịnh vượng không: Cùng vượng = Thời cơ đẹp nhất, cùng suy = Thử thách chung cần đồng lòng
- Một bên vượng một bên suy: Cần có ý thức điều hòa cân bằng trạng thái đôi bên
- Tam phương hội hợp Lưu Niên quy tụ các sao Đào hoa: Năm đó là thời cơ vàng để thành hôn

---

### IV. Phán đoán loại hình duyên phận

| Loại hình hóa duyên | Đặc trưng |
|---|---|
| Hóa Lộc dẫn động | Chính duyên, chân ái, tình cảm ngọt ngào thuận hòa êm thấm |
| Hóa Quyền dẫn động | Tình cảm do chủ động tranh thủ, có lực hút mạnh mẽ, có bên giữ thế chủ đạo |
| Hóa Khoa dẫn động | Duyên phận chung sống hòa hợp, tôn trọng lẫn nhau, mẫu hình bạc đầu giai lão |
| Hóa Kỵ dẫn động | Nghịch duyên / oan gia, dằn vặt lẫn nhau nhưng khó lòng chia lìa, cần tu dưỡng mới mong hóa giải |
| Song phương tương hỗ Hóa Kỵ | Kiểu "oan gia ngõ hẹp", tình cảm mãnh liệt nhưng nỗi đau giằng xé song hành, thuộc dạng nợ nần tiền kiếp |

---

### V. Phương pháp 3 tầng phán đoán hôn kỳ

**Tầng thứ nhất: Cách cục bản mệnh bàn**
- Cung Phu Thê không có Sát tinh: Nên kết hôn sớm
- Cung Phu Thê có Sát tinh mà không có Cát tinh: Nên kết hôn muộn (nam trên 30 tuổi, nữ trên 27 tuổi)
- Vũ Khúc, Liêm Trinh, Thất Sát, Phá Quân tại Cung Phu Thê: Nhất loạt khuyên nên kết hôn muộn

**Tầng thứ hai: Đại Hạn**
- Cung Phu Thê Đại Hạn nhiều Cát tinh: Trong mười năm đó có cơ hội kết hôn
- Cung Phu Thê Đại Hạn ngộ Hóa Kỵ: Trong mười năm đó tình cảm trắc trở, ngưng trệ

**Tầng thứ ba: Lưu Niên**
- Hồng Loan, Thiên Hỷ nhập Cung Mệnh hoặc Cung Phu Thê: Năm đó chuyện hôn luyến tình duyên có biến chuyển
- Cung vị Lưu Niên rơi vào Cung Phu Thê: Năm đó việc kết hôn là trọng tâm
- Tam phương hội hợp Lưu Niên quy tụ nhiều sao Đào hoa: Năm đó có nhiều cơ duyên tình cảm

---

### VI. Tình hình kết hôn tại các cung vị

| Cung vị Lưu Niên | Tình hình kết hôn |
|---|---|
| Cung Phu Thê | Tình cảm phát triển thuận theo tự nhiên rồi kết hôn |
| Cung Mệnh | Bản thân chủ động theo đuổi, tấn công mà thành hôn |
| Cung Tử Nữ | Cưới vì có con (có bầu trước cưới sau) |
| Cung Điền Trạch | Vì lý do gia đình, an cư hoặc nhà cửa điền sản mà kết hôn |
| Cung Phụ Mẫu | Vâng mệnh cha mẹ, do bề trên trưởng bối mai mối giới thiệu |

---

### VII. Dấu hiệu cụ thể khắc phu / khắc thê

**Mệnh khắc phu (theo định nghĩa phi truyền thống của thầy Nghê)**:
> "Người phụ nữ khắc phu, chính là người vợ sải bước thảnh thơi đi đằng trước, còn người chồng mồ hôi nhễ nhại xách túi lớn túi nhỏ đằng sau kiêm trả tiền; mãi mới đợi được xe thì người chồng lại phải tất tả mở cửa xe cho vợ. Đó gọi là khắc phu."
> "Vượng phu, là người vợ khiến cho người chồng hoàn toàn an tâm, không còn chút âu lo vướng bận phía sau."

**Dấu hiệu cụ thể**:
- Cung Phu Thê có Liêm Trinh hội ngộ Tham Lang / Phá Quân / Thất Sát (tổ hợp tam hung)
- Thái Dương lạc hãm Hóa Kỵ (đối với nữ mệnh)
- Thái Âm Hóa Kỵ (đối với nam mệnh)
- Cung Phu Thê Tứ Sát tề tụ, không có Cát tinh
- Cô Thần, Quả Tú nhập Cung Mệnh hoặc Cung Phu Thê
- Cung Phúc Đức Phá Quân lạc hãm + Liêm Trinh bình hòa (cách cục Thủy Trung Tố Trủng - chôn mả dưới nước)

---

### VIII. Phán đoán hợp bàn hợp tác sự nghiệp

**Các cung vị tham khảo chủ yếu**:
- Cung Quan Lộc: Tinh tính cung sự nghiệp đôi bên có tương dung, hòa hợp hay không
- Cung Huynh Đệ (Cung Bộc Dịch / Giao Hữu): Đại diện cho mối quan hệ hợp tác làm ăn
- Cung Phúc Đức: Có thể đồng cam cộng khổ cùng nhau hay không

**Cát tượng trong hợp tác sự nghiệp**:
- Cung Mệnh đôi bên tương bổ cho nhau (người giỏi mưu lược, kẻ giỏi hành động)
- Cung Quan Lộc một bên Hóa Lộc phi nhập vào Cung Quan Lộc bên kia
- Cung Huynh Đệ có Lộc Tồn tọa thủ, không bị Hóa Kỵ xung phá

**Hung tượng trong hợp tác sự nghiệp**:
- Đôi bên có Hóa Kỵ tương xung Cung Quan Lộc của nhau
- Cung Mệnh của đối phương Hóa Kỵ phi nhập Cung Tài Bạch của mình (đối phương làm hao tổn tiền của của mình)
- Cự Môn tại Cung Huynh Đệ / Bộc Dịch: Thầy Nghê dạy: "Cự Môn tại cung bạn bè (Bộc Dịch), đại diện cho việc hợp tác làm ăn với bạn bè thì bạn bè sẽ hóa thành kẻ thù"

---

### IX. Các loại tương vị tình cảm (Phán đoán nhanh mức độ tương thích mệnh cách)

| Tổ hợp đôi bên | Mức độ tương thích | Thuyết minh luận đoán |
|---|---|---|
| Tử Vi + Thiên Phủ | ★★★★★ | Đế tinh tương phùng Tài khố, tương trợ thành tựu lẫn nhau, vững vàng bền chặt nhất |
| Thiên Tướng + Bất kỳ sao nào | ★★★★ | Ấn tinh tá tài, Thiên Tướng có tính thích ứng cực kỳ mạnh mẽ |
| Thiên Lương + Thiên Đồng | ★★★★ | Lão luyện từng trải bổ khuyết cho nhu hòa điềm đạm, mẫu hình bạc đầu giai lão |
| Thái Dương + Thái Âm | ★★★★ | Nhật Nguyệt tịnh minh, kinh điển tương bổ, âm dương điều hòa viên mãn |
| Thất Sát + Thất Sát | ★★ | Hai hổ tranh hùng, va chạm nảy lửa, mâu thuẫn tranh chấp nhiều |
| Phá Quân + Phá Quân | ★★ | Song Phá gặp nhau, phá phách lẫn nhau, hôn nhân bất ổn rung lắc |
| Liêm Trinh + Thất Sát / Phá Quân | ★ | Hai trong ba tổ hợp tam hung, nguy cơ sinh ly tử biệt cao nhất |
| Sát Phá Tham + Cơ Nguyệt Đồng Lương | ★★★ | Động tĩnh tương bổ, nhưng cần cọ xát thích nghi, một bên khai phá xông pha, một bên gìn giữ thủ thành |
| Tử Phá + Liêm Phủ | ★★★★ | Cách cục tương đương xứng tầm, thu hút lẫn nhau mạnh mẽ |
| Vũ Khúc + Thiên Đồng | ★★★ | Cương nhu tương tế, tính thu liễm của Vũ Khúc gặp nét ôn hòa của Thiên Đồng, có thể bổ khuyết tương trợ |

---

### X. Tổng hợp danh ngôn hợp bàn cốt lõi của thầy Nghê Hải Hạ

1. **"Xem hôn nhân mà chỉ nhìn mỗi Cung Phu Thê là sai lầm hoàn toàn, nhất thiết phải đồng thời xem cả Cung Phúc Đức."**
2. **"Liêm Trinh Tham Lang / Liêm Trinh Phá Quân tại Cung Phu Thê, bất kể nam mệnh hay nữ mệnh, không sinh ly thì cũng tử biệt."**
3. **"Liêm Trinh Thất Sát —— nửa đường chôn xác (bán lộ mai thi); Liêm Trinh Phá Quân —— chôn mả dưới nước (thủy trung tố trủng); Liêm Trinh Tham Lang —— hoạnh tử chết yểu (hoành yểu)."**
4. **"Thái Dương Hóa Kỵ, trên không thấy cha, dưới không thấy con, giữa không thấy chồng." (Nữ mệnh trong mười năm đó người chồng gặp đại nạn)**
5. **"Mạng người đàn ông sợ nhất là Thái Âm Hóa Kỵ, mẹ chồng nàng dâu bất hòa, người vợ với người mẹ nhất định sẽ bất hòa."**
6. **"Vượng phu, là người vợ khiến người chồng hoàn toàn không còn chút âu lo vướng bận phía sau; còn khắc phu là tình cảm quá mức sâu đậm, hoàn toàn chỉ biết xoay quanh đối phương."**
7. **"Cự Môn tại Cung Bộc Dịch (bạn bè), hợp tác làm ăn với bạn bè thì bạn bè sẽ hóa thành kẻ thù."**
8. **"Nếu bạn cưới phải một cô vợ có Thất Sát nhập Mệnh, thì đời bạn coi như hỏng mất một nửa rồi, mệt mỏi vô cùng, lúc nào cũng như thấy cỏ cây đều là quân giặc (thảo mộc giai binh)."**
`;

// ─── 婚姻判断辅助表 ─────────────────────────────────────────

export const MARRIAGE_STARS_BRIEF: Record<string, string> = {
  '红鸾': 'Chính duyên hôn luyến, nhập Mệnh Thân chủ động thành hôn; Lưu Niên gặp Hồng Loan năm đó chuyện tình cảm hôn nhân có động tĩnh khởi sắc',
  '天喜': 'Hôn hỷ, cùng Hồng Loan tương hỗ dẫn động, chủ có việc vui mừng hỷ sự đến',
  '天姚': 'Đào hoa tài nghệ, cơ duyên tình cảm; trong tình duyên gặp Thiên Diêu dễ có tao ngộ lãng mạn bất ngờ',
  '咸池': 'Đào hoa mạnh mẽ, cần lưu ý rắc rối tình ái nhiễu nhương; hội Tham Lang thì đào hoa vượng nhất',
  '孤辰': 'Sao cô khắc, nam mệnh nhập Cung Mệnh chủ tự lập tốt, nhưng nhập Cung Phu Thê chủ duyên phận nhạt nhòa',
  '寡宿': 'Sao cô khắc, nữ mệnh nhập Mệnh hoặc Cung Phu Thê chủ hôn nhân trắc trở, gần ít xa nhiều',
  '天哭': 'Cô khắc hình thương, nhập Cung Phu Thê chủ phối ngẫu gặp tai họa nghiêm trọng',
  '天虚': 'Sao hao hụt hư hao, nhập Cung Phu Thê chủ tình cảm tiêu hao uổng phí',
  '天巫': 'Kết hôn muộn, di sản, tôn giáo; nhập Cung Phu Thê chủ kết hôn muộn là cát, kết hôn sớm nhiều trắc trở',
};

export const HEMING_SCORE_CRITERIA = {
  '五星': 'Cung Phu Thê đôi bên tương ánh tạo nên thiên tác chi hợp, Tứ Hóa tương hỗ bổ ích cho nhau, Đại Hạn cùng bước vào vận thịnh vượng, Cung Phúc Đức đôi bên đều cát lành',
  '四星': 'Cung Phu Thê một bên tương ứng với Cung Mệnh đối phương, Tứ Hóa chủ đạo là Hóa Lộc và Hóa Khoa, nền tảng tình cảm vững chắc',
  '三星': 'Mệnh cách tương phối nhưng đôi bên đều có góc cạnh tôi rèn, cần cọ xát thích nghi, xét về lâu dài thì ổn định',
  '二星': 'Cung Phu Thê đôi bên đều có Sát tinh, Hóa Kỵ xung phá, tình cảm trồi sụt thăng trầm lớn, cần hai bên chủ động vun đắp duy trì',
  '一星': 'Hung tinh tụ hội tại Cung Phu Thê, hoặc xuất hiện tổ hợp tam hung của Liêm Trinh, nguy cơ sinh ly tử biệt rất cao',
};
