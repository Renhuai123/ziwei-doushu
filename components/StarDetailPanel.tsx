'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import { starName, paName, sihuaName, elementName } from '@/lib/ziwei/display-vi';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// Luận giải chi tiết các tinh diệu theo hệ thống Nghê Hải Hạ (Tham khảo Cố Tường Hoằng《Phi Tinh Tử Vi Đẩu Số Toàn Thư》và Nam Bắc Sơn Nhân《Tử Vi Đẩu Số Toàn Thư》)
const STAR_DETAIL: Record<string, {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}> = {
  '紫微': {
    niHaixia: 'Thầy Nghê cho rằng Tử Vi là sao Hoàng Đế, tọa Cung Mệnh có khí chất cô ngạo, thích ở một mình, không thích bị người khác quản thúc. Tử Vi cần có Tả Phụ Hữu Bật giáp cung mới phát huy được khí chất đế vương, bằng không chỉ là "cô quân" (vua đơn độc), phú mà không quý. Tử Vi tại hai cung Thìn Tuất là tốt nhất, cùng Thiên Phủ tạo thành cách cục song tinh, tài quan song mỹ, có thể xuất tướng nhập tướng. Tử Vi sợ nhất Hỏa Tinh, Linh Tinh, Kình Dương, Đà La đồng cung, gia sát tinh thì cô quý, có quyền mà không có tài.',
    classical: 'Cổ quyết: "Tử Vi đế tọa lâm mệnh chủ tôn quý, thống lĩnh chúng tinh, tọa mệnh giả chủ quyền uy hiển đạt." Nam Bắc Sơn Nhân chú: "Tử Vi thủ mệnh vu Thìn vị, tài quan song mỹ, xuất tướng nhập tướng, vị chí tam công; Tý cung an mệnh giả, phú quý bất nại cửu, nhật hậu bất mỹ."',
    bestPalace: 'Cung Mệnh (Thìn, Tuất), Cung Quan Lộc',
    worstPalace: 'Cung Tật Ách, Cung Phu Thê',
    career: 'Chính giới, cấp quản lý, khởi nghiệp độc lập, trời sinh khí chất đế vương, phù hợp vị trí lãnh đạo một phương',
    relationship: 'Tình cảm bị động, lòng tự trọng cao, cần đối phương chủ động, có xu hướng cô độc, kết hôn muộn thì tốt',
    wealth: 'Tài vận ổn định, thủ thành mạnh hơn tiến thủ, vị trí Thìn Tuất tài quan song mỹ, thích hợp nhất là đầu tư tích lũy',
    health: 'Thuộc tính Thổ, chú ý tỳ vị, hệ tiêu hóa. Kỵ làm việc quá sức, nên duy trì sinh hoạt điều độ',
  },
  '天机': {
    niHaixia: 'Thầy Nghê nói Thiên Cơ là sao tham mưu, là sao thông minh nhất, nhưng thông minh lộ ra ngoài lại tổn hại bản thân. Thiên Cơ Hóa Kỵ là phiền toái nhất, tượng trưng cho thông minh phản bị thông minh hại. Thiên Cơ thuộc Mộc, thiện biến linh hoạt, người có sao này ở Cung Mệnh tư duy nhanh nhạy, nhưng thường mưu nhiều quyết ít, cần rời xa quê hương phát triển mới thành tựu, quyền biến ứng sự, tùy cơ ứng biến là đặc tính lớn nhất.',
    classical: 'Cổ quyết: "Vi nhân sinh tinh hoạt, tự hảo tác kinh doanh, Thiên Cơ tinh thuộc Mộc, thương mãi giai đa cơ kiến, ly tông tất viễn thân, cơ mưu tất viễn ly thân." Nam Bắc Sơn Nhân chú: "Thiên Cơ cư Miếu Vượng địa, chủ nhân sinh tinh minh, thiện sách hoạch; cư Hãm địa tắc ám đạm, nhân nhân giai tòng thương vi nghiệp."',
    bestPalace: 'Cung Mệnh (vị trí Mão), Cung Quan Lộc',
    worstPalace: 'Cung Phu Thê',
    career: 'Chuyên gia kỹ thuật, mưu sĩ, nghiên cứu viên, IT, hoạch định sách lược, dùng trí óc hơn dùng sức, thích hợp phát triển xa quê',
    relationship: 'Tình cảm nhiều biến động, suy nghĩ quá nhiều, khó chuyên nhất, nên kết hôn muộn, sau hôn nhân cần học cách buông bỏ ưu tư',
    wealth: 'Kiếm tiền nhờ trí tuệ và kỹ năng, không giỏi giữ của, lấy kỹ thuật chuyên môn làm nghề thì tài vận ổn định',
    health: 'Thuộc tính Mộc, chú ý can đởm, hệ thần kinh. Tâm tư suy nghĩ quá nhiều dễ mất ngủ, nên luyện tập tĩnh tâm thiền định',
  },
  '太阳': {
    niHaixia: 'Thầy Nghê cho rằng Thái Dương là sao có tính đại trượng phu (nam quyền), từ Mão đến Ngọ nhập Miếu, quang minh chính đại; sau giờ Ngọ dần lạc Hãm. Người có Thái Dương tọa Mệnh tính tình hào phóng, trọng thể diện, nam mệnh rất hợp, nữ mệnh thì quá mạnh mẽ. Thái Dương đại diện cho cha và bậc trưởng bối, đóng ở Cung Mệnh chủ tính cách hướng ngoại cởi mở, thích được mọi người chú ý, thích hợp nhất theo công chức hoặc sự nghiệp công cộng. Lạc Hãm thì trước siêng sau lười, cô quả nhọc nhằn.',
    classical: 'Cổ quyết: "Thái Dương cư Ngọ vi nhập Miếu, quang huy đại phóng, chủ quý hiển, nam mệnh tối giai; lạc Hãm tắc cô quả lao lục, tiên cần hậu lãn." Nam Bắc Sơn Nhân chú: "Thái Dương tại Ngọ cung thủ mệnh, tài quan song mỹ, xuất tướng nhập tướng; Thìn vị an mệnh, trung niên tài quan biến mỹ, Ất niên sinh nhân ngộ hung diệc đại lợi."',
    bestPalace: 'Cung Mệnh (từ Mão đến Ngọ), Cung Quan Lộc',
    worstPalace: 'Cung Phu Thê (nữ mệnh), Cung Tật Ách',
    career: 'Công chức, chính giới, quản lý, quan hệ công chúng (PR), giáo dục, truyền thông, thích đứng trước đám đông, thích hợp sự nghiệp đại chúng',
    relationship: 'Nam mệnh nhân duyên tốt nhưng dễ đào hoa, nữ mệnh độc lập mạnh mẽ, hôn nhân cần dung hòa, nên tìm bạn đời dịu dàng chu đáo',
    wealth: 'Tài vận nhờ nỗ lực, hào phóng thích bố thí, không giỏi tích lũy; nhập Miếu tài vận vượng, lạc Hãm tài vận thăng trầm',
    health: 'Thuộc tính Hỏa, chú ý tim mạch, mắt. Ở vị trí lạc Hãm dễ làm việc quá sức, cần chú ý nghỉ ngơi đầy đủ',
  },
  '武曲': {
    niHaixia: 'Thầy Nghê coi Vũ Khúc là chủ tinh Cung Tài Bạch, cương nghị bất khuất, sợ nhất cô khắc. Người Vũ Khúc tọa Mệnh ý chí kiên định, thích hợp ngành tài chính, quản lý tài sản, nhưng trong tình cảm lại quá thẳng thắn, dễ làm tổn thương người khác. Vũ Khúc Hóa Kỵ cần cẩn trọng tai nạn huyết quang bất ngờ. Vũ Khúc tại Thìn Tuất Sửu Mùi đắc Vượng địa, đồng cung với Thất Sát tạo thành Tướng Tài Cách, là cách cục tài phú vô cùng tốt đẹp.',
    classical: 'Cổ quyết: "Vũ Khúc thuộc Kim, cương cường chi tính, nhất sinh đa hình khắc; thủ mệnh vu Vượng địa, xuất tướng nhập tướng." Nam Bắc Sơn Nhân chú: "Vũ Khúc thủ mệnh, tam phương tứ chính câu cát, tài quan song mỹ, vũ chức gia Phụ Bật Xương Khúc, diệc chủ đại quý; dữ Thất Sát đồng cung, vi Tướng Tài Cách, chủ đại phú."',
    bestPalace: 'Cung Mệnh (Thìn, Tuất, Sửu, Mùi), Cung Tài Bạch, Cung Quan Lộc',
    worstPalace: 'Cung Phu Thê',
    career: 'Tài chính, quân cảnh, kế toán, kỹ thuật công trình, khả năng thực thi cực mạnh, thích hợp lĩnh vực đòi hỏi khí phách và sự quyết đoán',
    relationship: 'Tình cảm thẳng thắn bộc trực, thiếu phần thi vị, cần bạn đời dịu dàng bù đắp, kỵ tình cảm cô khắc',
    wealth: 'Tài tinh bản mệnh, tài vận cực mạnh, năng lực quản lý tài chính vượt trội, tại vị trí Thìn Tuất tài quan song mỹ',
    health: 'Thuộc tính Kim, chú ý phổi, hệ hô hấp, răng miệng. Khi Hóa Kỵ cần đề phòng tai nạn huyết quang bất ngờ',
  },
  '天同': {
    niHaixia: 'Thầy Nghê nói Thiên Đồng là phúc tinh, cũng là sao lười nhất. Thiên Đồng tọa Mệnh thích hưởng phúc, không ưa cạnh tranh, thích hợp công việc ổn định. Thiên Đồng đồng cung với Thiên Lương là tốt nhất, vừa được hưởng phúc lại vừa có chỗ dựa an toàn. Thiên Đồng Hóa Lộc là Hóa Lộc đẹp đẽ nhất, chủ một đời áo cơm không lo, thảnh thơi vui vẻ. Thiên Đồng kỵ lạc Hãm, lạc Hãm thì phúc giảm, khi gặp hung tinh cần phải hóa giải.',
    classical: 'Cổ quyết: "Thiên Đồng vi phúc đức chi tinh, tọa mệnh giả hưởng phúc hữu dư, chủ nhất sinh tiêu dao tự tại, bất tất lao khổ." Nam Bắc Sơn Nhân chú: "Thiên Đồng thủ mệnh, tam phương vô sát, nhất sinh khoái lạc, y thực phong túc; gia cát tinh tắc phú quý song toàn, vi nhân ôn hòa, đa nhân duyên."',
    bestPalace: 'Cung Mệnh, Cung Phúc Đức',
    worstPalace: 'Cung Quan Lộc',
    career: 'Ngành dịch vụ, giải trí, ẩm thực, văn nghệ, môi trường thoải mái vui tươi là thích hợp nhất, kỵ cạnh tranh áp lực cao',
    relationship: 'Tình cảm ôn hòa, không chủ động, dễ bị động đón nhận, hôn nhân tương đối ổn định, tính tình hòa nhã dễ gần',
    wealth: 'Tài vận không nổi trội, nhờ vào lương bổng ổn định, không giỏi đầu cơ, áo cơm không lo nhưng khó đại phú',
    health: 'Thuộc tính Thủy, chú ý thận, bàng quang. Thể chất tương đối yếu, nên vận động điều độ, giữ tâm thái nhẹ nhàng',
  },
  '廉贞': {
    niHaixia: 'Thầy Nghê cho rằng Liêm Trinh là thứ đào hoa, tài hoa xuất chúng nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ vô cùng hung hiểm, đại diện cho kiện tụng, lao tù, tai họa bất ngờ. Liêm Trinh đồng cung với Thiên Tướng thì hóa hung thành cát, trở thành cách cục Hành Chính Ấn Thụ. Liêm Trinh ngũ hành thuộc Hỏa, tính tình cương liệt, đời người nhiều thăng trầm, tài nghệ xuất chúng, nếu giữ mình chính đạo không tà vạy thì ắt thành đại khí.',
    classical: 'Cổ quyết: "Liêm Trinh vi thứ đào hoa, tài hoa hoành dật, cảm tình đa ba triết; Liêm Tướng đồng cung, hóa hung vi cát, thành Hành Chính Ấn Thụ Cách, khả chưởng quyền bính." Nam Bắc Sơn Nhân chú: "Liêm Trinh thủ mệnh, kiến cát tinh tắc tài hoa xuất chúng, Hóa Kỵ tắc quan ty triền thân, chủ huyết quang chi tai, tu phòng."',
    bestPalace: 'Cung Quan Lộc (hội Thiên Tướng), Cung Mệnh (khi Hóa Lộc)',
    worstPalace: 'Cung Mệnh (khi Hóa Kỵ), Cung Phu Thê',
    career: 'Nghệ thuật, giải trí, pháp luật, công chức (hội Thiên Tướng), tài nghệ xuất chúng, nên theo đuổi chính nghiệp mới có thể bền lâu',
    relationship: 'Nhiều đào hoa, tình cảm phức tạp, dễ vướng vào tranh chấp tình cảm, nên kết hôn muộn, chọn bạn đời chín chắn vững vàng',
    wealth: 'Tài vận thăng trầm, kiếm tiền nhờ tài nghệ, khi Hóa Kỵ cần phòng tranh chấp tài chính và rủi ro pháp lý',
    health: 'Thuộc tính Hỏa, chú ý tim mạch, tuần hoàn máu, gan. Khi Hóa Kỵ phòng ngừa tai nạn và phẫu thuật, chú ý huyết quang',
  },
  '天府': {
    niHaixia: 'Thầy Nghê nói Thiên Phủ là sao tài khố, là sao thủ thành, không chủ động phát tài nhưng giữ của rất giỏi. Người Thiên Phủ tọa Mệnh tính tình đĩnh đạc thận trọng, nữ mệnh tốt nhất, có thể vượng phu ích tử, hưng thịnh gia môn. Thiên Phủ thích nhất đồng cung hoặc đối chiếu với Tử Vi tạo thành cách cục song tinh, tài quan song mỹ. Thiên Phủ sợ bị Không Kiếp giáp mệnh, thấy Không Kiếp thì kho tài cạn đáy, không giữ được tiền của.',
    classical: 'Cổ quyết: "Thiên Phủ vi tài khố chi tinh, thủ mệnh giả ổn trọng bảo thủ, chủ tích tài vượng gia; nữ mệnh phùng chi, năng vượng phu ích tử, gia đạo hưng long." Nam Bắc Sơn Nhân chú: "Thiên Phủ thủ mệnh, tam phương cát tụ, tài quan song mỹ, phú quý an khang; ngộ Không Kiếp, tắc tài khố phá lậu, nan dĩ tích tài."',
    bestPalace: 'Cung Mệnh, Cung Tài Bạch, Cung Điền Trạch',
    worstPalace: 'Cung Thiên Di',
    career: 'Quản lý hành chính, tài chính, bảo hiểm, bất động sản, cầu ổn định không mạo hiểm, phù hợp nghề nghiệp mang tính gìn giữ duy trì',
    relationship: 'Tình cảm ổn định, chu toàn cho gia đình, là bạn đời lý tưởng, coi trọng cảm giác an toàn và sự bảo đảm kinh tế',
    wealth: 'Tài vận cực tốt, năng lực giữ của mạnh, thích hợp nhất là đầu tư tích lũy và tích sản bất động sản',
    health: 'Thuộc tính Thổ, chú ý tỳ vị, tiêu hóa. Thể chất vững vàng, nên duy trì ăn uống và nếp sống có quy luật',
  },
  '太阴': {
    niHaixia: 'Thầy Nghê cho rằng Thái Âm là tài tinh, lợi cho nữ mệnh, cũng là sao đại diện cho mẹ và vợ của nam mệnh. Thái Âm nhập Miếu thì tài vận cực tốt, tại Hãm địa thì tài vận gặp trắc trở. Thái Âm Hóa Kỵ cần chú ý các vấn đề của người thân phái nữ. Thái Âm tại hai vị trí Hợi, Tý nhập Miếu, ánh sáng tỏa chiếu trọn vẹn, đại diện cho nét trang nhã tinh tế, tình cảm phong phú, coi trọng thế giới nội tâm và đời sống tinh thần.',
    classical: 'Cổ quyết: "Thái Âm vi tài tinh, lợi nữ mệnh; Hợi Tý nhập Miếu, quang huy toàn chiếu, tài vận cực vượng; Ngọ vị lạc Hãm, ưu uất đa tình, tài vận bình đạm." Nam Bắc Sơn Nhân chú: "Thái Âm thủ mệnh, nhập Miếu giả tài phú ưu hậu, nữ mệnh ưu giai; lạc Hãm giả tu nỗ lực phương năng trí phú, tình cảm tế nhị."',
    bestPalace: 'Cung Mệnh (Hợi, Tý), Cung Tài Bạch',
    worstPalace: 'Cung Mệnh (Hãm địa tại Ngọ)',
    career: 'Tài chính, ngân hàng, bất động sản, nghệ thuật, giáo dục, tỉ mỉ kiên nhẫn, thích hợp ngành nghề đòi hỏi khiếu thẩm mỹ và sự dịu dàng',
    relationship: 'Tình cảm dịu dàng tinh tế, coi trọng cảm nhận nội tâm, cần một mối quan hệ ổn định mang lại cảm giác an toàn',
    wealth: 'Nhập Miếu tài vận cực vượng, lạc Hãm thì cần phải nỗ lực; quản lý tài chính chu đáo, giỏi tích lũy, không thích mạo hiểm',
    health: 'Thuộc tính Thủy, chú ý thận, tử cung (nữ mệnh). Biến động cảm xúc ảnh hưởng tới sức khỏe, nên giữ tâm trạng thư thái',
  },
  '贪狼': {
    niHaixia: 'Thầy Nghê nói Tham Lang là sao đa tài đa nghệ nhất, đào hoa nặng nhất. Tham Lang Hóa Lộc nhập Mệnh thì sức hút ngời sáng, ai gặp cũng quý mến. Tham Lang thuộc sao phát muộn, sau tuổi trung niên mới thực sự phát đạt. Tham Lang tại vị trí Dần Thân nhập Miếu là tốt nhất, đào hoa vượng thịnh, tài nghệ siêu quần; sau khi Hóa Lộc thì tài vận phát lớn, nhưng nếu gặp Không Kiếp thì đời người nhiều sóng gió trắc trở, khó tụ tài.',
    classical: 'Cổ quyết: "Tham Lang phát phúc hanh thông, đa tài đa nghệ, đào hoa tối trọng; nhiên nan quá tam thập tuế, vãn phát giả chúng. Lạc Hãm ngộ sát phản cát, thử hệ Tham Lang lạc Hãm chi lý." Nam Bắc Sơn Nhân chú: "Tham Lang thủ mệnh, ngộ cát tắc phúc lộc đa thọ, phát phúc hanh thông; đản cửu hậu bất đắc thiện chung, cố nghi tu thân dưỡng đức, phương khả thiện chung."',
    bestPalace: 'Cung Mệnh (Hóa Lộc), Cung Phúc Đức, Cung Thiên Di',
    worstPalace: 'Cung Tật Ách',
    career: 'Nghệ thuật, giải trí, quan hệ công chúng, kinh doanh bán hàng, phong thủy ngũ thuật, dựa vào mối quan hệ và tài nghệ, thuộc mẫu người đa tài đa nghệ',
    relationship: 'Đào hoa cực vượng, tình cảm đa dạng, nên kết hôn muộn, sau hôn nhân cần tiết chế đào hoa mới có thể bách niên giai lão',
    wealth: 'Kiếm tiền nhờ nhân mạch và tài nghệ, tài vận trung và vãn niên mới vững, sau khi Hóa Lộc thì nguồn tài dồi dào, thời trẻ nên thủ vững',
    health: 'Thuộc tính Mộc (đới Thủy), chú ý gan, thận. Đào hoa quá vượng dễ hao tổn tinh lực, nên tiết chế điều dưỡng',
  },
  '巨门': {
    niHaixia: 'Thầy Nghê cho rằng Cự Môn là sao khẩu thiệt thị phi, nhưng sau khi Hóa Lộc Hóa Quyền sẽ chuyển cát, biến thành cách cục kiếm tiền nhờ tài ăn nói. Cự Môn tọa Mệnh tính tình đa nghi, thiện biện, thích hợp luật sư, giáo viên, bán hàng. Cự Môn kỵ nhất Hóa Kỵ, chủ thị phi miệng tiếng không ngớt, thậm chí dẫn đến kiện tụng tố tụng. Cự Môn tại hai vị trí Tý Ngọ khá tốt, tài ăn nói giỏi, chủ nhờ lời nói mà lập thân.',
    classical: 'Cổ quyết: "Cự Môn vi ám diệu, chủ khẩu thiệt thị phi; Hóa Lộc Quyền tắc chuyển vi dĩ khẩu tài mưu sinh, chủ phú quý." Nam Bắc Sơn Nhân chú: "Cự Môn thủ mệnh, phùng Hóa Lộc Quyền, dĩ khẩu thiệt vi nghiệp giả đại cát; Hóa Kỵ tắc khẩu thiệt liên lụy, quan ty triền thân, tu cẩn thận ngôn ngữ."',
    bestPalace: 'Cung Quan Lộc (Hóa Lộc, Hóa Quyền), Cung Mệnh (Tý, Ngọ)',
    worstPalace: 'Cung Phu Thê, Cung Tật Ách (khi Hóa Kỵ)',
    career: 'Luật sư, giáo viên, kinh doanh bán hàng, người dẫn chương trình, chuyên gia đàm phán, tài ăn nói là năng lực cạnh tranh cốt lõi',
    relationship: 'Đa nghi hay lo, dễ suy nghĩ quá nhiều, giao tiếp là chìa khóa hôn nhân, cần chọn bạn đời có lòng kiên nhẫn',
    wealth: 'Kiếm tiền nhờ tài ăn nói và kỹ năng chuyên môn, sau khi Hóa Lộc tài vận khá tốt, khi Hóa Kỵ phòng tranh chấp tài chính và vạ miệng liên lụy',
    health: 'Thuộc tính Thủy, chú ý thận, tai, khoang miệng. Lo nghĩ quá nhiều dễ tổn hại thân thể, nên học cách thư giãn giảm bớt áp lực',
  },
  '天相': {
    niHaixia: 'Thầy Nghê nói Thiên Tướng là sao ấn thụ, phụ trách công việc hành chính sự vụ. Người Thiên Tướng tọa Mệnh quy củ đứng đắn, thích hợp làm hành chính công chức. Thiên Tướng rất cần có sao mạnh mẽ đi cùng mới phát huy được tác dụng, đứng một mình tọa Mệnh thì tương đối bình đạm. Thiên Tướng thích nhất có Liêm Trinh đi kèm tạo thành Liêm Tướng Cách, có thể nắm giữ đại quyền hành chính; sợ nhất đồng cung với Phá Quân hoặc rơi vào Hình Kỵ Giáp Ấn Cách, chủ nhiều hung hiểm.',
    classical: 'Cổ quyết: "Thiên Tướng vi ấn thụ chi tinh, chủ hành chính thứ vụ; Liêm Tướng đồng cung, hóa hung vi cát, chưởng hành chính đại quyền." Nam Bắc Sơn Nhân chú: "Thiên Tướng thủ mệnh, trung quy trung củ, thích hợp công chức; đắc Liêm Trinh tương phối, khả thành quốc gia đống lương; Phá Quân đồng thủ, tắc hình khắc nan miễn."',
    bestPalace: 'Cung Quan Lộc, Cung Mệnh (phối cùng Liêm Trinh)',
    worstPalace: 'Cung Tài Bạch, Cung Mệnh (phối cùng Phá Quân thành Hình Kỵ Giáp Ấn)',
    career: 'Công chức, quản lý hành chính, thư ký, trợ lý, sở trường vai trò hỗ trợ hậu cần, cần có minh tinh dẫn đường',
    relationship: 'Tình cảm ổn định, đôn hậu thật thà, là bạn đời tốt, nhưng cần đối phương chủ đạo định hướng',
    wealth: 'Tài vận bình ổn, tích lũy bằng đồng lương, không thích hợp đầu tư mạo hiểm, quản lý tài chính kiểu thủ thành là phù hợp nhất',
    health: 'Thuộc tính Thủy, chú ý thận, hệ bạch huyết. Thể chất bậc trung, nên duy trì thói quen sinh hoạt điều độ',
  },
  '天梁': {
    niHaixia: 'Thầy Nghê cho rằng Thiên Lương là ấm tinh, che chở bảo bọc người khác, cũng đại diện cho y dược tôn giáo. Người Thiên Lương tọa Mệnh có duyên với bậc trưởng bối, thời trẻ nhiều gian nan trắc trở, tuổi già được hưởng phúc. Thiên Lương sợ nhất Hóa Kỵ, đại diện cho vấn đề liên quan đến trưởng bối hoặc sức khỏe. Thiên Lương đồng cung với Thái Dương là tốt nhất, Nhật Nguyệt Tịnh Minh, quý nhân chở che, trọn đời có quý nhân tương trợ, sau cùng đều đắc bình an.',
    classical: 'Cổ quyết: "Thiên Lương vi ấm tinh, chủ tý ấm bảo hộ; tọa mệnh giả hữu trưởng bối duyên, tảo niên thụ ma luyện, vãn niên hưởng thanh phúc." Nam Bắc Sơn Nhân chú: "Thiên Lương thủ mệnh, tu phùng cát tinh phương năng phát đạt; ngộ Thái Dương đồng cung, Nhật Nguyệt Tịnh Minh, chủ quý hiển, nhất sinh đa quý nhân tương trợ."',
    bestPalace: 'Cung Mệnh, Cung Phụ Mẫu, Cung Phúc Đức',
    worstPalace: 'Cung Mệnh (khi Hóa Kỵ), Cung Tài Bạch',
    career: 'Y tế, tôn giáo, pháp luật, công tác xã hội, từ thiện, thích giúp đỡ người khác, có tâm nguyện che chở muôn người',
    relationship: 'Tình duyên thường chênh lệch tuổi tác tương đối lớn, hoặc duyên đến muộn, cần kiên nhẫn chờ đợi mới gặp lương duyên',
    wealth: 'Tài vận nhờ quý nhân tương trợ, thời trẻ tài vận không thuận, về già tài vận mới vững vàng, nên thủ không nên nóng vội xông xáo',
    health: 'Thuộc tính Thổ, chú ý tỳ vị, xương cốt. Cần chú trọng chăm sóc sức khỏe lúc tuổi già, nên phòng ngừa điều dưỡng từ sớm',
  },
  '七杀': {
    niHaixia: 'Thầy Nghê nói Thất Sát là sao tướng quân, quả quyết giàu nhuệ khí, nhưng mang bản tính cô khắc. Thất Sát tọa Mệnh tất phải có phụ tinh hóa giải tính cô khắc, bằng không lục thân duyên phận mỏng manh. Thất Sát đồng cung với Vũ Khúc là Tướng Tài Cách, vô cùng tốt đẹp. Thất Sát sợ nhất Trúc La Tam Hạn (Dương Đà Hỏa Linh tề chiếu), chủ đại hung, phải đề phòng bất trắc. Thất Sát sau khi Hóa Lộc lại chuyển cát, có thể thành bậc đại tướng tài ba.',
    classical: 'Cổ quyết: "Thất Sát vi tướng quân chi tinh, quả quyết xung kình cường; thủ mệnh giả cô khắc tính trọng, lục thân duyên bạc." Nam Bắc Sơn Nhân chú: "Thất Sát thủ mệnh, tam hợp cát tụ tắc đại quý; ngộ Trúc La Tam Hạn (Dương Đà Hỏa Linh), chủ đại hung, phòng ý ngoại chi tai, phòng hình khắc."',
    bestPalace: 'Cung Mệnh (khi có phụ tinh), Cung Quan Lộc',
    worstPalace: 'Cung Phu Thê, Cung Phụ Mẫu',
    career: 'Quân cảnh, khởi nghiệp, giao dịch tài chính, các lĩnh vực độc lập tác chiến, đòi hỏi quyết đoán nhanh chóng và khí phách',
    relationship: 'Tình cảm cô khắc, khó tìm được bạn đời thích hợp, cần đối phương biết bao dung tính cách mạnh mẽ, nên kết hôn muộn',
    wealth: 'Tài vận biến động lớn, có cơ hội đại phú, cũng có thăng trầm sóng gió; đồng cung Vũ Khúc có thể thành Tướng Tài Cách đại quý',
    health: 'Thuộc tính Kim, chú ý phổi, đại tràng. Tính tình nóng nảy dễ tổn hại thân thể, nên học cách kiềm chế cảm xúc và tu dưỡng tâm tính',
  },
  '破军': {
    niHaixia: 'Thầy Nghê nói Phá Quân là sao có khả năng phá cũ lập mới mạnh mẽ nhất, cũng là một trong những sao cô khắc nhất. Phá Quân chỉ khi Hóa Lộc mới trở nên tốt đẹp, tượng trưng cho phá vỡ rồi mới kiến thiết. Phá Quân tọa Mệnh duyên phận lục thân mỏng manh, nhưng năng lực khai sáng cực kỳ mạnh mẽ. Phá Quân thích hợp nhất với cải cách, đổi mới sáng tạo; khi Hóa Lộc thì tài vận chuyển biến mạnh mẽ, một phá một lập, sau cùng ắt thành đại nghiệp.',
    classical: 'Cổ quyết: "Phá Quân vi tối năng phá cựu lập tân chi tinh, tọa mệnh giả cô khắc, lục thân duyên bạc, nhiên khai sáng năng lực siêu cường; Hóa Lộc hậu phá nhi hậu lập, khả thành đại nghiệp." Nam Bắc Sơn Nhân chú: "Phá Quân thủ mệnh, nhất sinh đa ba triết; Hóa Lộc giả, phá tài chi hậu phương năng trùng kiến, tài vận chung quy hảo chuyển, chủ vãn niên thành tựu."',
    bestPalace: 'Cung Quan Lộc (khi Hóa Lộc), Cung Thiên Di',
    worstPalace: 'Cung Phu Thê, Cung Phụ Mẫu',
    career: 'Sự nghiệp mang tính khai sáng, quân cảnh, cải cách, quản trị thay đổi, thích hợp công việc tiên phong không ngừng khai phá lĩnh vực mới',
    relationship: 'Tình cảm nhiều thăng trầm, hợp tan bất định, lục thân duyên bạc, cần chọn bạn đời độc lập và có sức bao dung lớn',
    wealth: 'Tài vận trồi sụt lớn, sau khi Hóa Lộc tài vận chuyển biến tốt; chỉ thủ thành thì tài hao thoái, cần không ngừng mở mang thế cục mới tích lũy được của cải',
    health: 'Thuộc tính Thủy, chú ý thận, bàng quang, hệ sinh dục. Thể chất thất thường, nên duy trì thói quen tập luyện thể thao điều độ',
  },
};

const levelConfig = {
  major: { label: 'Chính tinh', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: 'Cát tinh', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: 'Sát tinh', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: 'Tạp tinh', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

const NATURE_VI: Record<string, string> = {
  '中性偏吉': 'Trung tính thiên cát',
  '吉星': 'Cát tinh',
  '中性': 'Trung tính',
  '凶中带吉': 'Hung mang cát',
  '凶星': 'Hung tinh',
};

const BRIGHTNESS_NAME_VI: Record<string, string> = {
  '庙': 'Miếu',
  '旺': 'Vượng',
  '得': 'Đắc',
  '利': 'Lợi',
  '平': 'Bình',
  '不': 'Bất',
  '闲': 'Nhàn',
  '陷': 'Hãm',
  '地': 'Địa',
};

const KEYWORD_VI: Record<string, string> = {
  '帝王': 'Đế vương',
  '尊贵': 'Tôn quý',
  '独立': 'Độc lập',
  '智慧': 'Trí tuệ',
  '机变': 'Linh hoạt',
  '谋略': 'Mưu lược',
  '阳刚': 'Dương cương',
  '官贵': 'Quan quý',
  '慷慨': 'Hào phóng',
  '财富': 'Tài phú',
  '刚毅': 'Cương nghị',
  '果断': 'Quả đoán',
  '温和': 'Ôn hòa',
  '享福': 'Hưởng phúc',
  '随缘': 'Tùy duyên',
  '才艺': 'Tài nghệ',
  '刑囚': 'Hình tù',
  '桃花': 'Đào hoa',
  '财库': 'Tài kho',
  '稳重': 'Vững vàng',
  '保守': 'Thận trọng',
  '柔美': 'Nhu mỹ',
  '阴柔': 'Âm nhu',
  '欲望': 'Dục vọng',
  '多才': 'Đa tài',
  '口舌': 'Khẩu thiệt',
  '是非': 'Thị phi',
  '善辩': 'Hùng biện',
  '辅佐': 'Phụ tá',
  '行政': 'Hành chính',
  '印绶': 'Ấn thụ',
  '荫护': 'Che chở',
  '医药': 'Y dược',
  '长辈': 'Trưởng bối',
  '将星': 'Tướng tinh',
  '果决': 'Quả quyết',
  '孤克': 'Cô khắc',
  '开创': 'Khai sáng',
  '变动': 'Biến động',
  '破坏': 'Phá cách',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

  const brightnessLabel = star
    ? star.brightnessRaw
      ? (BRIGHTNESS_NAME_VI[star.brightnessRaw] ?? star.brightnessRaw)
      : star.brightness === 'bright'
      ? 'Miếu'
      : star.brightness === 'dim'
      ? 'Hãm'
      : star.brightness
      ? 'Bình'
      : null
    : null;

  const isBright = brightnessLabel ? ['Miếu', 'Vượng', 'Đắc', 'Lợi'].includes(brightnessLabel) : false;
  const isDim = brightnessLabel ? ['Hãm'].includes(brightnessLabel) : false;
  const brightnessColor = isBright ? '#eab308' : isDim ? '#ef4444' : 'var(--t-text2)';

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* Thanh tiêu đề */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{starName(star.name)}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  {sihuaName('化' + star.siHua)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* Thông tin cơ bản */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { text: `Ngũ Hành · ${elementName(desc.element)}` },
                  { text: `Tính chất · ${NATURE_VI[desc.nature] ?? desc.nature}` },
                  ...(palaceName ? [{ text: `Vị trí · ${paName(palaceName)}` }] : []),
                  ...(brightnessLabel ? [{ text: brightnessLabel, color: brightnessColor }] : []),
                ].map(tag => (
                  <div key={tag.text} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.color ?? 'var(--t-text2)',
                    }}>
                    {tag.text}
                  </div>
                ))}
              </div>
            )}

            {/* Từ khóa */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>Đặc tính tinh diệu</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {KEYWORD_VI[k.trim()] ?? k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nguyên văn cổ thư */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  Nguyên văn cổ thư
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* Luận giải của Thầy Nghê Hải Hạ */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    Luận giải của Thầy Nghê Hải Hạ
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Định hướng sự nghiệp', value: detail.career, icon: '◈' },
                    { label: 'Đặc điểm tình cảm', value: detail.relationship, icon: '♡' },
                    { label: 'Phân tích tài vận', value: detail.wealth, icon: '◆' },
                    { label: 'Lưu ý sức khỏe', value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">Cung vị đắc địa nhất</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">Cung vị cần lưu ý</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* Giải nghĩa phụ tinh / sát tinh */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && 'Văn Xương nhập cung, chủ học nghiệp thi cử thuận lợi, giấy tờ ấn tín hanh thông, thích hợp theo công việc liên quan đến chữ nghĩa văn chương. Cổ quyết: "Văn Xương khoa giáp, chủ văn chương hiển đạt, phùng khảo tất đệ."'}
                    {star.name === '文曲' && 'Văn Khúc nhập cung, chủ tài nghệ xuất chúng, khiếu ăn nói tốt, giỏi biểu đạt, năng khiếu nghệ thuật phong phú. Cổ quyết: "Văn Khúc vi tài nghệ chi tinh, năng văn năng vũ, khẩu tài thắng nhân."'}
                    {star.name === '左辅' && 'Tả Phụ nhập cung, chủ có quý nhân tương trợ, có người nâng đỡ, các việc thuộc cung vị này nhận được sự hỗ trợ thiện chí. Cổ quyết: "Tả Phụ vi trợ lực chi tinh, tọa mệnh tắc quý nhân đa, phùng hung hóa cát."'}
                    {star.name === '右弼' && 'Hữu Bật nhập cung, chủ có quý nhân tương trợ, phần nhiều là quý nhân phái nữ, các việc thuộc cung vị này có người giúp sức. Cổ quyết: "Hữu Bật vi âm trợ chi tinh, đa nữ tính quý nhân, hóa hiểm vi di."'}
                    {star.name === '天魁' && 'Thiên Khôi nhập cung, chủ quý nhân sinh ban ngày, quý nhân nam giới nhiều, mang lại sức mạnh chuyển hung thành cát. Cổ quyết: "Thiên Khôi vi Thiên Ất quý nhân, phùng chi tất hữu quý nhân phù trì."'}
                    {star.name === '天钺' && 'Thiên Việt nhập cung, chủ quý nhân sinh ban đêm, quý nhân nữ giới nhiều, tăng thêm hòa khí cát lành. Cổ quyết: "Thiên Việt vi Ngọc Đường quý nhân, chủ âm trợ, nữ quý nhân đa."'}
                    {star.name === '禄存' && 'Lộc Tồn nhập cung, chủ tài lộc thủ thành gìn giữ, cung vị này tụ khí tài lộc, nhưng thuộc dạng tài vận bảo thủ chắc chắn. Cổ quyết: "Lộc Tồn vi tài lộc chi tinh, chủ thủ tài hữu dư, tiến tài ổn kiện."'}
                    {star.name === '天马' && 'Thiên Mã nhập cung, chủ bôn ba biến động, kiếm tiền trong dịch chuyển, nên chủ động tiến bước, không nên ôm cây đợi thỏ. Cổ quyết: "Thiên Mã chủ động, phùng Lộc tắc tài lộc song toàn, động trung sinh tài."'}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && 'Địa Không nhập cung, chủ sự việc thuộc cung vị này dễ hụt hẫng hư không, tinh thần tiêu hao, nên chú ý sức khỏe tâm lý. Cổ quyết: "Địa Không chủ hư hao, nhập Mệnh cung giả đa tinh thần mê mang, tu phòng không tưởng."'}
                    {star.name === '地劫' && 'Địa Kiếp nhập cung, chủ sự việc thuộc cung vị này dễ gặp tổn thất bất ngờ, tiền của cần cẩn trọng gìn giữ, phòng tiểu nhân. Cổ quyết: "Địa Kiếp chủ kiếp tài, nhập Mệnh cung giả tài vận thụ tổn, phòng ý ngoại chi thất."'}
                    {star.name === '火星' && 'Hỏa Tinh nhập cung, chủ sự việc thuộc cung vị này dễ nóng vội xung động, cảm xúc thất thường biến động, nhưng nếu gặp Tham Lang lại phản vi cát cục. Cổ quyết: "Hỏa Tinh chủ cấp táo, nhiên ngộ Tham Lang đồng cung, phản vi Hỏa Tham Cách, chủ bạo phát."'}
                    {star.name === '铃星' && 'Linh Tinh nhập cung, chủ sự việc thuộc cung vị này dễ gặp cản trở ngầm, phòng tiểu nhân sau lưng, phàm việc gì cũng nên khiêm nhường kín đáo. Cổ quyết: "Linh Tinh chủ ám sát, nhập mệnh giả đa ám trung thụ địch, tu phòng bối hậu thị phi."'}
                    {star.name === '擎羊' && 'Kình Dương nhập cung, chủ hình khắc, sự việc thuộc cung vị này nhiều trắc trở sóng gió, dễ có tai ương huyết quang hoặc sự cố bất ngờ. Cổ quyết: "Kình Dương vi hình khắc chi tinh, nhập Mệnh cung giả đa hình khắc, tu phòng ý ngoại huyết quang."'}
                    {star.name === '陀罗' && 'Đà La nhập cung, chủ thị phi bám víu, sự việc thuộc cung vị này trì trệ dây dưa khó quyết, việc gì cũng nên chuẩn bị từ sớm. Cổ quyết: "Đà La chủ thị phi trì diên, nhập Mệnh cung giả tác sự trì hoãn, tu phòng cưu triền bất thanh."'}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
