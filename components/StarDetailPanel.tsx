'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import { viStar, viSiHua } from '@/lib/i18n/vi';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// Giải thích chi tiết từng sao theo hệ thống Nghê Hải Hạ (tham khảo Cố Tường Hoằng và Nam Bắc Sơn Nhân)
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
    niHaixia: 'Thầy Nghê nhận định Tử Vi là sao Hoàng Đế, người an Mệnh tại cung này có khí chất cô ngạo, thích ở một mình, không thích bị người khác quản. Tử Vi cần có Tả Phù Hữu Bật kẹp hai bên mới phát huy được khí chất đế vương, nếu không chỉ là vua cô độc, giàu mà không quý. Tử Vi tại Thìn Tuất là tốt nhất, hội cùng Thiên Phủ tạo thành cách cục song tinh, tài quan lưỡng mỹ, có thể ra tướng vào tướng. Tử Vi sợ nhất Hỏa Tinh, Linh Tinh, Kình Dương, Đà La đồng cung, gặp sát tinh thì cô quý, có quyền mà không có tài.',
    classical: 'Cổ quyết: "Tử Vi đế tọa lâm mệnh chủ tôn quý, thống lĩnh chúng tinh, tọa mệnh giả chủ quyền uy hiển đạt." Nam Bắc Sơn Nhân chú: "Tử Vi thủ mệnh tại cung Thìn, tài quan lưỡng mỹ, ra tướng vào tướng, vị chí tam công; an mệnh tại cung Tý thì giàu sang không bền."',
    bestPalace: 'Mệnh (Thìn Tuất), Quan Lộc',
    worstPalace: 'Tật Ách, Phu Thê',
    career: 'Chính trường, quản lý, khởi nghiệp độc lập — thiên phú đế vương khí, phù hợp vị trí lãnh đạo độc lập',
    relationship: 'Thụ động trong tình cảm, tự trọng cao, cần đối phương chủ động, có xu hướng cô độc, lấy muộn thì tốt',
    wealth: 'Tài vận ổn định, giữ của hơn tiến công; Thìn Tuất tài quan lưỡng mỹ, phù hợp đầu tư tích lũy',
    health: 'Thuộc Thổ, lưu ý tỳ vị và hệ tiêu hóa. Tránh làm việc quá sức, nên duy trì giờ giấc điều độ',
  },
  '天机': {
    niHaixia: 'Thầy Nghê nói Thiên Cơ là sao tham mưu, thông minh nhất nhưng thông minh lộ ngoài thì hại thân. Thiên Cơ Hóa Kỵ rắc rối nhất, đại diện cho thông minh bị thông minh hại. Thiên Cơ thuộc Mộc, linh hoạt biến ảo, người an Mệnh tại đây tư duy nhanh nhạy nhưng thường nhiều mưu ít quyết, cần rời quê hương ra xa mới có thể phát triển.',
    classical: 'Cổ quyết: "Vi nhân sinh tinh hoạt, tự hảo tác kinh doanh, Thiên Cơ tinh thuộc Mộc, thương mãi giai đa cơ kiến, ly tông tất viễn thân." Nam Bắc Sơn Nhân chú: "Thiên Cơ cư miếu vượng địa, chủ nhân sinh tinh minh, thiện sách hoạch; cư hãm địa tắc ám đạm."',
    bestPalace: 'Mệnh (cung Mão), Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Chuyên gia kỹ thuật, mưu sĩ, nghiên cứu viên, IT, lập kế hoạch — dùng trí hơn tay chân, phù hợp phát triển xa quê',
    relationship: 'Tình cảm hay thay đổi, nhiều suy nghĩ, khó chung thủy, nên lấy muộn, sau hôn nhân cần học buông bỏ',
    wealth: 'Kiếm tiền bằng trí tuệ và kỹ năng, không giỏi giữ của; làm việc chuyên môn thì tài vận ổn định',
    health: 'Thuộc Mộc, lưu ý gan mật, hệ thần kinh. Tâm tư nặng nề dễ mất ngủ, nên luyện thiền định',
  },
  '太阳': {
    niHaixia: 'Thầy Nghê nhận định Thái Dương là sao đại nam nhân chủ nghĩa, từ cung Mão đến Ngọ thì nhập miếu, quang minh chính đại; sau Ngọ dần lạc hãm. Người an Mệnh Thái Dương hào phóng trọng thể diện, hợp nam mệnh, nữ mệnh thì quá mạnh. Thái Dương đại diện cho cha và bậc trưởng thượng, ở Mệnh chủ tính cách hướng ngoại vui vẻ, thích được mọi người nhìn thấy, hợp nhất với công chức hoặc sự nghiệp công cộng. Lạc hãm thì chăm chỉ trước lười biếng sau, cô quả lao lực.',
    classical: 'Cổ quyết: "Thái Dương cư Ngọ vi nhập miếu, quang huy đại phóng, chủ quý hiển, nam mệnh tốt nhất; lạc hãm tắc cô quả lao lực." Nam Bắc Sơn Nhân chú: "Thái Dương tại cung Ngọ thủ mệnh, tài quan lưỡng mỹ, ra tướng vào tướng; Thìn vị an mệnh, trung niên tài quan biến mỹ."',
    bestPalace: 'Mệnh (Mão đến Ngọ), Quan Lộc',
    worstPalace: 'Phu Thê (nữ mệnh), Tật Ách',
    career: 'Công chức, chính trường, quản lý, quan hệ công chúng, giáo dục, truyền thông — thích đứng trước đám đông',
    relationship: 'Nam mệnh duyên tốt nhưng đa tình, nữ mệnh độc lập mạnh mẽ, hôn nhân cần mài giũa, nên chọn bạn đời dịu dàng',
    wealth: 'Tài vận nhờ cố gắng, hào phóng hay cho, không giỏi tích lũy; nhập miếu tài vận thịnh, lạc hãm tài vận thất thường',
    health: 'Thuộc Hỏa, lưu ý tim và mắt. Lạc hãm dễ làm việc quá sức, cần chú ý nghỉ ngơi đầy đủ',
  },
  '武曲': {
    niHaixia: 'Thầy Nghê xem Vũ Khúc là chính tinh Tài Bạch, cứng rắn không khuất phục, sợ nhất cô khắc. Người an Mệnh Vũ Khúc ý chí kiên định, phù hợp tài chính, lý tài, nhưng trong tình cảm quá thẳng thắn, dễ làm tổn thương người. Vũ Khúc Hóa Kỵ cần cẩn thận tai nạn huyết quang. Vũ Khúc tại Thìn Tuất Sửu Mùi đắc vượng địa, hội cùng Thất Sát có thể thành Tướng Tài cách, là cách cục tài phú cực tốt.',
    classical: 'Cổ quyết: "Vũ Khúc thuộc Kim, cương cường chi tính, nhất sinh đa hình khắc; thủ mệnh tại vượng địa, ra tướng vào tướng." Nam Bắc Sơn Nhân chú: "Vũ Khúc thủ mệnh, tam phương tứ chính đều cát, tài quan lưỡng mỹ; hội Tả Phù Hữu Bật Văn Xương Văn Khúc cũng chủ đại quý; đồng cung Thất Sát thành Tướng Tài cách, chủ đại phú."',
    bestPalace: 'Mệnh (Thìn Tuất Sửu Mùi), Tài Bạch, Quan Lộc',
    worstPalace: 'Phu Thê',
    career: 'Tài chính, quân cảnh, kế toán, kỹ thuật — năng lực thực thi cực mạnh, phù hợp lĩnh vực cần quyết đoán và khí phách',
    relationship: 'Tình cảm thẳng thắn, thiếu tình tứ, cần bạn đời dịu dàng bù đắp, tránh tình cảm cô khắc',
    wealth: 'Tài tinh bản mệnh, tài vận cực mạnh, năng lực lý tài xuất chúng; Thìn Tuất tài quan lưỡng mỹ',
    health: 'Thuộc Kim, lưu ý phổi, hệ hô hấp, răng. Hóa Kỵ cần đề phòng tai nạn huyết quang',
  },
  '天同': {
    niHaixia: 'Thầy Nghê nói Thiên Đồng là sao Phúc Đức, sao lười nhất. Người an Mệnh Thiên Đồng thích hưởng phúc, không thích cạnh tranh, hợp công việc ổn định. Thiên Đồng hội cùng Thiên Lương là tốt nhất, vừa hưởng phúc lại có bảo đảm. Thiên Đồng Hóa Lộc là Hóa Lộc đẹp nhất, chủ cả đời no đủ sung sướng. Thiên Đồng sợ lạc hãm, lạc hãm thì giảm phúc, cần hóa giải cùng hung tinh.',
    classical: 'Cổ quyết: "Thiên Đồng vi Phúc Đức chi tinh, tọa mệnh giả hưởng phúc hữu dư, chủ nhất sinh tiêu dao tự tại." Nam Bắc Sơn Nhân chú: "Thiên Đồng thủ mệnh, tam phương vô sát, nhất sinh khoái lạc, y thực phong túc; gia cát tinh tắc phú quý song toàn."',
    bestPalace: 'Mệnh, Phúc Đức',
    worstPalace: 'Quan Lộc',
    career: 'Dịch vụ, giải trí, ẩm thực, văn nghệ — môi trường thoải mái vui vẻ là phù hợp nhất, tránh áp lực cạnh tranh cao',
    relationship: 'Tình cảm ôn hòa, không chủ động, dễ bị động chấp nhận, hôn nhân khá ổn định, tính cách dễ mến',
    wealth: 'Tài vận không nổi bật, dựa vào lương ổn định, không giỏi đầu cơ, no đủ nhưng khó giàu lớn',
    health: 'Thuộc Thủy, lưu ý thận, bàng quang. Thể chất hơi yếu, nên vận động điều độ, giữ tâm thái nhẹ nhàng',
  },
  '廉贞': {
    niHaixia: 'Thầy Nghê nhận định Liêm Trinh là thứ đào hoa, tài hoa hơn người nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ cực hung, đại diện cho kiện tụng, tù ngục, tai nạn. Liêm Trinh hội cùng Thiên Tướng thì hóa hung thành cát, trở thành cách cục hành chính ấn thụ. Liêm Trinh ngũ hành thuộc Hỏa, tính cách cứng rắn, một đời nhiều thăng trầm, tài nghệ xuất chúng, nếu giữ chính nghiệp thì có thể thành đại khí.',
    classical: 'Cổ quyết: "Liêm Trinh vi thứ đào hoa, tài hoa hơn người, tình cảm đa ba chiết; Liêm Tướng đồng cung, hóa hung thành cát, thành hành chính ấn thụ cách, có thể nắm quyền." Nam Bắc Sơn Nhân chú: "Liêm Trinh thủ mệnh, kiến cát tinh tắc tài hoa xuất chúng; Hóa Kỵ tắc quan tụng triền thân, chủ huyết quang chi tai."',
    bestPalace: 'Quan Lộc (phối Thiên Tướng), Mệnh (khi Hóa Lộc)',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Phu Thê',
    career: 'Nghệ thuật, giải trí, luật pháp, công chức (phối Thiên Tướng) — tài nghệ xuất chúng, giữ chính nghiệp mới bền lâu',
    relationship: 'Đào hoa nhiều, tình cảm phức tạp, dễ gặp rắc rối tình ái, nên lấy muộn, chọn bạn đời đứng đắn',
    wealth: 'Tài vận thất thường, kiếm tiền bằng tài nghệ; Hóa Kỵ cần đề phòng tranh chấp tài chính và rủi ro pháp lý',
    health: 'Thuộc Hỏa, lưu ý tim, máu, gan. Hóa Kỵ cần đề phòng tai nạn và phẫu thuật, chú ý huyết quang',
  },
  '天府': {
    niHaixia: 'Thầy Nghê nói Thiên Phủ là sao Tài Khố, sao giữ gìn, không chủ động phát tài nhưng có thể giữ được của. Người an Mệnh Thiên Phủ ổn trọng bảo thủ, nữ mệnh tốt nhất, có thể vượng phu hưng gia. Thiên Phủ thích nhất Tử Vi đồng cung hoặc đối chiếu, tạo thành cách cục song tinh, tài quan lưỡng mỹ. Thiên Phủ sợ Địa Không Địa Kiếp kẹp, gặp Không Kiếp thì kho tài bị trống, giữ không được của.',
    classical: 'Cổ quyết: "Thiên Phủ vi tài khố chi tinh, thủ mệnh giả ổn trọng bảo thủ, chủ tích tài vượng gia; nữ mệnh phùng chi, năng vượng phu ích tử, gia đạo hưng long." Nam Bắc Sơn Nhân chú: "Thiên Phủ thủ mệnh, tam phương cát tụ, tài quan lưỡng mỹ, phú quý an khang; ngộ Không Kiếp tắc tài khố phá lậu, nan dĩ tích tài."',
    bestPalace: 'Mệnh, Tài Bạch, Điền Trạch',
    worstPalace: 'Thiên Di',
    career: 'Hành chính quản lý, tài chính, bảo hiểm, bất động sản — cầu ổn không mạo hiểm, phù hợp nghề nghiệp giữ gìn',
    relationship: 'Tình cảm ổn định, trọng gia đình, là bạn đời tốt, coi trọng an toàn tài chính và cảm giác bình yên',
    wealth: 'Tài vận cực tốt, năng lực giữ của mạnh, phù hợp nhất đầu tư tích lũy và bất động sản',
    health: 'Thuộc Thổ, lưu ý tỳ vị và tiêu hóa. Thể chất ổn định, nên duy trì ăn uống và sinh hoạt điều độ',
  },
  '太阴': {
    niHaixia: 'Thầy Nghê nhận định Thái Âm là tài tinh, lợi nữ mệnh, cũng là sao đại diện cho mẹ và vợ của nam mệnh. Thái Âm nhập miếu thì tài vận cực tốt, lạc địa thì tài vận bị cản. Thái Âm Hóa Kỵ cần chú ý vấn đề của người thân nữ. Thái Âm tại Hợi Tý nhập miếu, quang huy toàn chiếu, đại diện cho sự thanh lịch tế nhị, tình cảm phong phú, coi trọng nội tâm và đời sống tinh thần.',
    classical: 'Cổ quyết: "Thái Âm vi tài tinh, lợi nữ mệnh; Hợi Tý nhập miếu, quang huy toàn chiếu, tài vận cực vượng; Ngọ vị lạc hãm, ưu uất đa tình." Nam Bắc Sơn Nhân chú: "Thái Âm thủ mệnh, nhập miếu giả tài phú ưu hậu, nữ mệnh vưu gia; lạc hãm giả cần nỗ lực mới có thể phát tài."',
    bestPalace: 'Mệnh (Hợi Tý), Tài Bạch',
    worstPalace: 'Mệnh (Ngọ vị lạc hãm)',
    career: 'Tài chính, bất động sản, nghệ thuật, giáo dục — tế nhị kiên nhẫn, phù hợp nghề cần thẩm mỹ và sự dịu dàng',
    relationship: 'Tình cảm dịu dàng tế nhị, coi trọng nội tâm, cần mối quan hệ ổn định có cảm giác an toàn',
    wealth: 'Nhập miếu tài vận cực thịnh, lạc hãm thì cần cố gắng; lý tài cẩn thận, giỏi tích lũy, không thích mạo hiểm',
    health: 'Thuộc Thủy, lưu ý thận, tử cung (nữ mệnh). Cảm xúc thất thường ảnh hưởng sức khỏe, nên giữ tâm trạng thoải mái',
  },
  '贪狼': {
    niHaixia: 'Thầy Nghê nói Tham Lang là sao đa tài đa nghệ nhất, đào hoa nặng nhất. Tham Lang Hóa Lộc nhập Mệnh thì sức hút bốn phương, ai cũng yêu quý. Tham Lang là sao phát muộn, trung niên trở đi mới thực sự phát đạt. Tham Lang tại Dần Thân nhập miếu tốt nhất, đào hoa thịnh, tài nghệ siêu quần; Hóa Lộc sau đó tài vận đại phát, nhưng gặp Không Kiếp thì một đời nhiều ba chiết, khó tụ tài.',
    classical: 'Cổ quyết: "Tham Lang phát phúc hanh thông, đa tài đa nghệ, đào hoa trọng nhất; nhưng khó qua ba mươi tuổi, phát muộn giả nhiều." Nam Bắc Sơn Nhân chú: "Tham Lang thủ mệnh, ngộ cát tắc phúc lộc đa thọ, phát phúc hanh thông; nhưng lâu sau không được thiện chung, cần tu thân dưỡng đức mới có thể thiện chung."',
    bestPalace: 'Mệnh (Hóa Lộc), Phúc Đức, Thiên Di',
    worstPalace: 'Tật Ách',
    career: 'Nghệ thuật, giải trí, quan hệ công chúng, bán hàng, phong thủy ngũ thuật — dựa vào nhân mạch và tài nghệ',
    relationship: 'Đào hoa cực thịnh, tình cảm đa dạng, nên lấy muộn, sau hôn nhân cần kiềm chế đào hoa mới có thể đầu bạc bên nhau',
    wealth: 'Kiếm tiền bằng nhân mạch và tài nghệ, tài vận trung vãn niên mới ổn; Hóa Lộc thì tài nguyên rộng mở, sớm nên thủ',
    health: 'Thuộc Mộc (kèm Thủy), lưu ý gan, thận. Đào hoa quá thịnh dễ hao tổn tinh lực, nên tiết chế điều dưỡng',
  },
  '巨门': {
    niHaixia: 'Thầy Nghê nhận định Cự Môn là sao khẩu thiệt thị phi, nhưng Hóa Lộc Hóa Quyền sau đó trở thành cách cục kiếm tiền bằng khẩu tài. Người an Mệnh Cự Môn đa nghi, biện luận tốt, phù hợp luật sư, giáo viên, bán hàng. Cự Môn sợ nhất Hóa Kỵ, chủ khẩu thiệt thị phi không ngừng, thậm chí dẫn đến kiện tụng. Cự Môn tại Tý Ngọ thì khá tốt, miệng lưỡi tốt, chủ lập thân bằng ngôn ngữ.',
    classical: 'Cổ quyết: "Cự Môn vi ám diệu, chủ khẩu thiệt thị phi; Hóa Lộc Quyền tắc chuyển vi dĩ khẩu tài mưu sinh, chủ phú quý." Nam Bắc Sơn Nhân chú: "Cự Môn thủ mệnh, phùng Hóa Lộc Quyền, dĩ khẩu thiệt vi nghiệp giả đại cát; Hóa Kỵ tắc khẩu thiệt liên lụy, quan tụng triền thân."',
    bestPalace: 'Quan Lộc (Hóa Lộc Quyền), Mệnh (Tý Ngọ)',
    worstPalace: 'Phu Thê, Tật Ách (Hóa Kỵ)',
    career: 'Luật sư, giáo viên, bán hàng, MC, chuyên gia đàm phán — khẩu tài là năng lực cạnh tranh cốt lõi',
    relationship: 'Đa nghi đa lự, dễ suy nghĩ nhiều, giao tiếp là chìa khóa hôn nhân, cần chọn bạn đời kiên nhẫn',
    wealth: 'Kiếm tiền bằng khẩu tài và kỹ năng chuyên môn; Hóa Lộc thì tài vận khá tốt; Hóa Kỵ cần đề phòng tranh chấp tài chính',
    health: 'Thuộc Thủy, lưu ý thận, tai, miệng. Suy nghĩ nhiều dễ hại thân, nên học cách thư giãn giảm áp',
  },
  '天相': {
    niHaixia: 'Thầy Nghê nói Thiên Tướng là sao ấn thụ, phụ trách hành chính sự vụ. Người an Mệnh Thiên Tướng khuôn phép quy củ, phù hợp công chức hành chính. Thiên Tướng cần có sao mạnh đi kèm mới phát huy được, đơn độc tọa Mệnh thì khá bình thường. Thiên Tướng thích nhất Liêm Trinh hội, tạo thành Liêm Tướng cách, có thể nắm đại quyền hành chính; sợ nhất Phá Quân đồng cung, tạo thành Hình Kỵ Giáp Ấn cách, chủ hung hiểm.',
    classical: 'Cổ quyết: "Thiên Tướng vi ấn thụ chi tinh, chủ hành chính thứ vụ; Liêm Tướng đồng cung, hóa hung thành cát, chưởng hành chính đại quyền." Nam Bắc Sơn Nhân chú: "Thiên Tướng thủ mệnh, khuôn phép quy củ, thích hợp công chức; đắc Liêm Trinh tương phối, có thể thành quốc gia đống lương; Phá Quân đồng thủ, tắc hình khắc nan miễn."',
    bestPalace: 'Quan Lộc, Mệnh (phối Liêm Trinh)',
    worstPalace: 'Tài Bạch, Mệnh (phối Phá Quân thì Hình Kỵ Giáp Ấn)',
    career: 'Công chức, hành chính quản lý, thư ký, trợ lý — giỏi vai trò hỗ trợ, cần sao mạnh dẫn đường',
    relationship: 'Tình cảm ổn định, trung hậu thành thật, là bạn đời tốt, nhưng cần đối phương định hướng',
    wealth: 'Tài vận bình ổn, dựa vào tích lũy lương bổng, không phù hợp đầu tư mạo hiểm, lý tài thủ thành là tốt nhất',
    health: 'Thuộc Thủy, lưu ý thận, hệ bạch huyết. Thể chất trung bình, nên duy trì thói quen sinh hoạt điều độ',
  },
  '天梁': {
    niHaixia: 'Thầy Nghê nhận định Thiên Lương là sao âm đức, có thể bảo hộ người khác, cũng đại diện cho y dược tôn giáo. Người an Mệnh Thiên Lương có duyên với bậc trưởng thượng, thuở nhỏ nhiều gian nan, vãn niên hưởng phúc. Thiên Lương sợ nhất Hóa Kỵ, đại diện cho vấn đề sức khỏe của trưởng bối. Thiên Lương hội cùng Thái Dương là tốt nhất, nhật nguyệt tịnh minh, quý nhân che chở, cả đời có quý nhân giúp đỡ.',
    classical: 'Cổ quyết: "Thiên Lương vi âm tinh, chủ tỳ âm bảo hộ; tọa mệnh giả hữu trưởng bối duyên, sớm thụ ma luyện, vãn niên hưởng thanh phúc." Nam Bắc Sơn Nhân chú: "Thiên Lương thủ mệnh, cần phùng cát tinh mới phát đạt; ngộ Thái Dương đồng cung, nhật nguyệt tịnh minh, chủ quý hiển, nhất sinh đa quý nhân tương trợ."',
    bestPalace: 'Mệnh, Phụ Mẫu, Phúc Đức',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Tài Bạch',
    career: 'Y tế, tôn giáo, luật pháp, công tác xã hội, từ thiện — thích giúp đỡ người khác, có lòng âm đức',
    relationship: 'Tình cảm thường với người chênh lệch tuổi tác, hoặc duyên đến muộn, cần kiên nhẫn chờ đợi mới có nhân duyên tốt',
    wealth: 'Tài vận nhờ quý nhân trợ giúp; sớm tài vận không tốt, vãn niên mới ổn định; nên thủ không nên xung',
    health: 'Thuộc Thổ, lưu ý tỳ vị, xương cốt. Cần chú trọng sức khỏe lúc lớn tuổi, nên phòng ngừa và điều dưỡng sớm',
  },
  '七杀': {
    niHaixia: 'Thầy Nghê nói Thất Sát là sao Tướng Quân, quả quyết xung khí mạnh, nhưng có tính cô khắc. Thất Sát tọa Mệnh cần có sao phụ hóa giải cô tính, nếu không thì lục thân duyên mỏng. Thất Sát hội cùng Vũ Khúc là Tướng Tài cách, cực tốt. Thất Sát sợ nhất Trúc La Tam Hạn (Kình Dương Đà La Hỏa Linh hội chiếu), chủ đại hung, cần phòng tai nạn. Thất Sát Hóa Lộc sau đó phản vi cát, có thể thành đại tướng chi tài.',
    classical: 'Cổ quyết: "Thất Sát vi tướng quân chi tinh, quả quyết xung khí mạnh; thủ mệnh giả cô khắc tính trọng, lục thân duyên mỏng." Nam Bắc Sơn Nhân chú: "Thất Sát thủ mệnh, tam hợp cát tụ tắc đại quý; ngộ Trúc La Tam Hạn, chủ đại hung, phòng tai nạn, phòng hình khắc."',
    bestPalace: 'Mệnh (có sao phụ), Quan Lộc',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Quân cảnh, khởi nghiệp, giao dịch tài chính, lĩnh vực độc lập — cần quyết đoán nhanh và khí phách',
    relationship: 'Tình cảm cô khắc, khó tìm bạn đời phù hợp, cần người bao dung tính cách mạnh mẽ, nên lấy muộn',
    wealth: 'Tài vận biến động lớn, có cơ hội đại phú nhưng cũng đại khởi đại lạc; Vũ Khúc đồng cung có thể thành Tướng Tài cách đại quý',
    health: 'Thuộc Kim, lưu ý phổi, đại tràng. Tính khí nóng nảy dễ hại thân, nên học kiểm soát cảm xúc và tu dưỡng',
  },
  '破军': {
    niHaixia: 'Thầy Nghê nói Phá Quân là sao phá cũ lập mới nhất, cũng là một trong những sao cô khắc nhất. Phá Quân Hóa Lộc sau đó mới trở nên tốt, đại diện cho phá rồi lập. Người an Mệnh Phá Quân lục thân duyên mỏng nhưng năng lực khai sáng cực mạnh. Phá Quân phù hợp nhất cải cách, sáng tạo; Hóa Lộc thì tài vận chuyển thịnh, phá một lập một, cuối cùng có thể thành tựu sự nghiệp.',
    classical: 'Cổ quyết: "Phá Quân vi tối năng phá cũ lập mới chi tinh, tọa mệnh giả cô khắc, lục thân duyên mỏng, nhiên khai sáng năng lực siêu cường; Hóa Lộc giả, phá nhi hậu lập, có thể thành đại nghiệp." Nam Bắc Sơn Nhân chú: "Phá Quân thủ mệnh, nhất sinh đa ba chiết; Hóa Lộc giả, phá tài chi hậu mới có thể trùng kiến, tài vận chung quy hảo chuyển, chủ vãn niên thành tựu."',
    bestPalace: 'Quan Lộc (Hóa Lộc), Thiên Di',
    worstPalace: 'Phu Thê, Phụ Mẫu',
    career: 'Sự nghiệp khai sáng, quân cảnh, cải cách, quản lý thay đổi — phù hợp người tiên phong không ngừng mở lãnh địa mới',
    relationship: 'Tình cảm nhiều ba chiết, ly hợp bất định, lục thân duyên mỏng, cần chọn bạn đời độc lập và bao dung',
    wealth: 'Tài vận thất thường lớn; Hóa Lộc sau đó tài vận chuyển tốt; thủ thành thì tài lui, cần không ngừng khai sáng mới có thể tích tài',
    health: 'Thuộc Thủy, lưu ý thận, bàng quang, hệ sinh sản. Thể chất thất thường, nên duy trì thói quen vận động điều độ',
  },
};

const levelConfig = {
  major: { label: 'Chính tinh', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: 'Cát tinh', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: 'Sát tinh', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: 'Tạp diệu', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

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
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{viStar(star.name)}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  Hóa {viSiHua(star.siHua)}
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
                  `Ngũ Hành · ${desc.element}`,
                  `Tính chất · ${desc.nature}`,
                  ...(palaceName ? [`Vị trí · ${palaceName}`] : []),
                  ...(star.brightness ? [star.brightness === 'bright' ? 'Miếu Vượng' : star.brightness === 'dim' ? 'Lạc Hãm' : 'Bình Hòa'] : []),
                ].map(tag => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.includes('Miếu') ? '#eab308' : tag.includes('Lạc') ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* Từ khóa đặc tính */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>Đặc tính sao</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cổ thư nguyên văn */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  Cổ thư nguyên văn
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* Nghê Hải Hạ luận giải */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    Thầy Nghê Hải Hạ luận giải
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Hướng sự nghiệp', value: detail.career, icon: '◈' },
                    { label: 'Đặc tính tình cảm', value: detail.relationship, icon: '♡' },
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
                    <div className="text-emerald-500 mb-0.5 font-medium">Cung tốt nhất</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">Cung cần lưu ý</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* Giải thích cát tinh / sát tinh */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && 'Văn Xương nhập cung, chủ học nghiệp thi cử thuận lợi, văn thư ấn tín có lợi, nên làm việc liên quan đến văn chữ. Cổ quyết: "Văn Xương khoa giáp, chủ văn chương hiển đạt, phùng khảo tất đệ."'}
                    {star.name === '文曲' && 'Văn Khúc nhập cung, chủ tài nghệ xuất chúng, khẩu tài tốt, giỏi biểu đạt, thiên phú nghệ thuật mạnh. Cổ quyết: "Văn Khúc vi tài nghệ chi tinh, năng văn năng võ, khẩu tài thắng nhân."'}
                    {star.name === '左辅' && 'Tả Phù nhập cung, chủ quý nhân tương trợ, có người đề bạt, cung vị đó được thiện ý phù trợ. Cổ quyết: "Tả Phù vi trợ lực chi tinh, tọa mệnh tắc quý nhân đa, phùng hung hóa cát."'}
                    {star.name === '右弼' && 'Hữu Bật nhập cung, chủ quý nhân tương trợ, nhiều quý nhân nữ, cung vị đó có người hiệp trợ. Cổ quyết: "Hữu Bật vi âm trợ chi tinh, đa nữ tính quý nhân, hóa hiểm vi di."'}
                    {star.name === '天魁' && 'Thiên Khôi nhập cung, chủ quý nhân sinh ban ngày, nhiều quý nhân nam, có lực phùng hung hóa cát. Cổ quyết: "Thiên Khôi vi thiên ất quý nhân, phùng chi tất hữu quý nhân phù trì."'}
                    {star.name === '天钺' && 'Thiên Việt nhập cung, chủ quý nhân sinh ban đêm, nhiều quý nhân nữ, thêm khí cát tường. Cổ quyết: "Thiên Việt vi ngọc đường quý nhân, chủ âm trợ, nữ quý nhân đa."'}
                    {star.name === '禄存' && 'Lộc Tồn nhập cung, chủ tài lộc thủ thành, cung vị đó có tài khí, nhưng thuộc loại tài vận bảo thủ. Cổ quyết: "Lộc Tồn vi tài lộc chi tinh, chủ thủ tài hữu dư, tiến tài ổn kiện."'}
                    {star.name === '天马' && 'Thiên Mã nhập cung, chủ bôn ba động đãng, động trung cầu tài, nên chủ động xuất kích, không nên thủ cũ. Cổ quyết: "Thiên Mã chủ động, phùng lộc tắc tài lộc song toàn, động trung sinh tài."'}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && 'Địa Không nhập cung, chủ cung vị đó có cảm giác hư không, tinh thần hao tán, nên chú ý sức khỏe tâm lý. Cổ quyết: "Địa Không chủ hư hao, nhập mệnh cung giả đa tinh thần mê mang, tu phòng không tưởng."'}
                    {star.name === '地劫' && 'Địa Kiếp nhập cung, chủ cung vị đó có tổn thất bất ngờ, tài vật cần thận trọng, phòng tiểu nhân. Cổ quyết: "Địa Kiếp chủ kiếp tài, nhập mệnh cung giả tài vận thụ tổn, phòng ý ngoại chi thất."'}
                    {star.name === '火星' && 'Hỏa Tinh nhập cung, chủ cung vị đó nóng vội xung động, cảm xúc biến động; nhưng nếu gặp Tham Lang thì phản cát. Cổ quyết: "Hỏa Tinh chủ cấp táo, nhiên ngộ Tham Lang đồng cung, phản vi Hỏa Tham cách, chủ bạo phát."'}
                    {star.name === '铃星' && 'Linh Tinh nhập cung, chủ cung vị đó có ngầm trở ngại, phòng tiểu nhân phía sau, làm việc nên thấp điệu. Cổ quyết: "Linh Tinh chủ ám sát, nhập mệnh giả đa ám trung thụ địch, tu phòng bối hậu thị phi."'}
                    {star.name === '擎羊' && 'Kình Dương nhập cung, chủ hình khắc, cung vị đó nhiều ba chiết, có huyết quang hoặc tai nạn. Cổ quyết: "Kình Dương vi hình khắc chi tinh, nhập mệnh cung giả đa hình khắc, tu phòng ý ngoại huyết quang."'}
                    {star.name === '陀罗' && 'Đà La nhập cung, chủ thị phi triền thân, cung vị đó trì trệ không quyết, làm gì cũng nên chuẩn bị sớm. Cổ quyết: "Đà La chủ thị phi trì diên, nhập mệnh cung giả làm việc chậm chạp, tu phòng vướng vít không rõ."'}
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
