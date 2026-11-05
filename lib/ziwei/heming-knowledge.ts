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
    summary: '喜责任感强或年纪较长的配偶，婚前多波折',
    good: '见禄：配偶有福德，感情踏实；三合方有吉：感情经营稳重理智',
    bad: '化忌或见煞：爱唠叨，强势说服，感情疏离；天梁配天马：夫妻因环境分散；婚前易初恋失败',
    spouse_traits: '配偶责任感强���稳重老成，善讲道理，但偶有说教倾向',
    timing: '婚前多波折是常态，一旦结婚反而稳固；无煞婚后情缘更深',
  },
  '七杀': {
    summary: '"鸳衾半冷"——聚少离多，宜晚婚30岁后',
    good: '庙旺（寅申宫）：配偶虽刚强但忠诚，一旦投入则全力付出；化禄相助：减轻孤克',
    bad: '遇煞：感情表面和谐内心不满，男命主二娶；女命宜偏房继室；卯酉宫（武曲七杀）：婚姻运最差',
    spouse_traits: '配偶刚强孤僻，一见钟情快，离开也快，恋爱冷热均快',
    timing: '一律宜晚婚，30岁后婚姻较稳固；早婚多刑克',
    ni_quote: '七杀居夫妇而鸳衾半冷（古赋）；如果你娶个太太是七杀入命，那你就差不多毁了一半了，很累啊，草木皆兵',
  },
  '破军': {
    summary: '婚姻破耗之星，无人出其右，追求无约束感情',
    good: '化禄：破而后立，感情历经波折反而能走到最后；英星入庙：配偶英挺有个性',
    bad: '化忌：破坏殆尽，多一婚或不婚；紫微破军（丑未）：不加煞亦克，加煞必离；与廉贞：水中做坟墓；中年后有分床分居之象',
    spouse_traits: '配偶追求自由，不喜约束，勇于突破，但婚姻观念薄弱，一生变动大',
    timing: '婚前易一见钟情或草率结婚，宜拉长相处时间再做决定',
    ni_quote: '廉贞破军在夫妻宫，水中做坟墓；破军是婚姻破坏力最强的星',
  },
};

// ─── 四化在夫妻宫的完整断语 ──────────��─────────────────────

export const SIHUA_IN_FUQI_GU = {
  '化禄': '与配偶有先天缘分，配偶个性乐观，婚后感情更好，配偶越来越会赚钱，缘分深厚；自化禄则财来财去，感情有但难守',
  '化权': '婚姻多为主动争取而来，配偶掌握决策权，大部分事情配偶自行裁决，需学会放手；争取型婚姻，越强求越难得',
  '化科': '视为小禄，能与配偶和谐相处，有贵人缘，利于恋爱结婚；科在夫妻主配偶有名声或专业技能',
  '化忌': '欠下婚姻债务，早婚早离，建议晚婚或不婚；配偶对本人有怨言；化忌冲夫妻宫尤凶——生离死别之兆',
};

// ─── 合盘核心方法论 ─────────────────────────────────────────

export const HEMING_METHODOLOGY = `
## 合盘分析核心框架（倪海厦体系 + 《紫微斗数全书》综合）

### 一、双宫联参原则（倪海厦最重要的婚姻断法）

**核心口诀：「看婚姻，光看夫妻宫，大错特错，一定要同时看福德宫。」**

- **夫妻宫**：看配偶的星性、外形、性格、互动模式
- **福德宫**：代表夫妻深层感情、婚姻能否长久
- **倪师案例**：“有人夫妻宫很好，福德宫很烂，散！夫妻要散。”

**因此合盘时必须同时分析双方的：命宫 + 夫妻宫 + 福德宫**

---

### 二、天作之合的判断标准

**最高级匹配（天作之合）**：
- 甲方夫妻宫主星 = 乙方命宫主星
- 乙方夫妻宫主星 = 甲方命宫主星
- 两者互相对应，则为命中注定的一对

**次级良配**：
- 一方夫妻宫主星 = 对方命宫主星（单向对应）
- 双方命宫星性五行相生（如木命配土命、土命配水命）
- 双方大限同走旺运

**凶兆组合**：
- 双方互相化忌冲对方命宫（互为冤家）
- 一方化忌飞入另一方夫妻宫（带给对方婚姻伤害）
- 双方夫妻宫皆有重煞无吉星

---

### 三、完整合盘五步法

**第一步：评估双方命格基础**
- 双方命宫格局是否般配（同类型 or 互补型）
- 重点看：命宫 + 身宫 + 福德宫的星性搭配
- 警戒：双方皆为杀破狼格（两虎相争）；或一强一弱过度悬殊

**第二步：夫妻宫互参**
- 甲方夫妻宫主星 → 是否对应乙方命宫/三合方星？
- 乙方夫妻宫主星 → 是否对应甲方命宫/三合方星？
- 双方夫妻宫各自的四化状态（化禄/化忌影响最大）

**第三步：太阳太阴星象分析**
- 女命：太阳代表丈夫；太阳庙旺=旺夫，落陷化忌=克夫
- 男命：太阴代表妻子；太阴庙旺=妻美贤，化忌=婆媳不和
- 这两颗星在双方命盘中的状态，直接影响婚姻质量

**第四步：四化飞化互参（高级技法）**
- 甲方生年干 → 找到四化星 → 这些星落在乙方命盘哪个宫位
  - 化禄飞入乙方命宫/财帛宫：对乙方有正向帮助
  - 化忌飞入乙方夫妻宫：带给乙方婚姻伤害
  - 化忌飞入乙方命宫：自身给对方带来压力
- 乙方生年干 → 反向飞化分析甲方
- 形成”飞化互参“，判断双向的”缘分类型”

**第五步：大限同步分析**
- 双方当前大限是否同走旺运：俱旺=最佳时机，俱衰=共同挑战
- 一方旺一方衰：需有意识平衡双方状态
- 流年三合方桃花星聚集：当年结婚好时机

---

### 四、缘分类型判断

| 化缘类型 | 特征 |
|---------|------|
| 化禄引动 | 正缘、真爱，感情甜蜜顺遂 |
| 化权引动 | 主动争取的感情，有张力，有主导方 |
| 化科引动 | 和谐相处的缘分，互相尊重，白头偕老型 |
| 化忌引动 | 逆缘/冤家，彼此折磨但难以分离，需修行方可化解 |
| 双方互化忌 | “冤家路窄“型，感情强烈但痛苦并存，前世欠债型 |

---

### 五、婚期判断三层法

**第一层：本命盘格局**
- 夫妻宫无煞：宜早婚
- 夫妻宫有煞无吉：宜晚婚（男30以上，女27以上）
- 武曲、廉贞、七杀、破军在夫妻宫：一律建议晚婚

**第二层：大限**
- 大限夫妻宫吉星多：该十年有结婚机会
- 大限夫妻宫化忌：该十年感情受阻

**第三层：流年**
- 红鸾、天喜入命宫或夫妻宫：该年婚恋有动
- 流年宫位落到夫妻宫：该年婚姻是重点
- 流年三合方桃花星汇集：该年感情机遇多

---

### 六、各宫位结婚情形

| 流年宫位 | 结婚情形 |
|---------|---------|
| 夫妻宫 | 正常感情发展结婚 |
| 命宫 | 自己主动出击结婚 |
| 子女宫 | 奉子成婚（先上车后补票） |
| 田宅宫 | 因家庭、房产缘故结婚 |
| 父母宫 | 奉父母之命，经长辈介绍 |

---

### 七、克夫/克妻的具体标志

**克夫命（非传统含义）倪师定义**：
> “克夫的女孩子，就是太太在前面走，先生在后面满头大汗提着大包小包付钱，好不容易等到车，先生还要帮太太开门。这叫克夫。”
> “旺夫，一个太太完全让先生没有后顾之忧。”

**具体标志**：
- 夫妻宫廉贞+贪狼/破军/七杀（三凶组合）
- 太阳落陷化忌（女命）
- 太阴化忌（男命）
- 夫妻宫四煞齐聚无吉星
- 寡宿孤辰入命宫或夫妻宫
- 福德宫破军陷落 + 廉贞平（水中做冢格）

---

### 八、事业合作合盘判断

**主要参考宫位**：
- 官禄宫：双方事业宫星性是否兼容
- 兄弟宫（仆役宫）：代表合伙关系
- 福德宫：能否同甘共苦

**事业合作吉象**：
- 双方命宫互补（一谋一行）
- 一方官禄宫化禄飞入另一方官禄宫
- 兄弟宫有禄存无化忌冲

**事业合作凶象**：
- 双方化忌互冲官禄宫
- 对方命宫化忌飞入己方财帛宫（对方消耗自己钱财）
- 巨门在兄弟/仆役宫：倪师：”巨门在朋友宫，代表跟朋友合伙会朋友变仇人”

---

### 九、感情相位类型（命格兼容性速判）

| 双方组合 | 兼容性 | 说明 |
|---------|-------|------|
| 紫微 + 天府 | ★★★★★ | 帝星遇财库，相互成就，最稳定 |
| 天相 + 任何星 | ★★★★ | 印星佐才，天相适应性强 |
| 天梁 + 天同 | ★★★★ | 老成与温和互补，白头偕老型 |
| 太阳 + 太阴 | ★★★★ | 日月并明，经典互补，阴阳调和 |
| 七杀 + 七杀 | ★★ | 两虎相争，火花大，矛盾多 |
| 破军 + 破军 | ★★ | 双破，彼此破坏，婚姻不稳 |
| 廉贞 + 七杀/破军 | ★ | 三凶组合之二，生离死别风险最高 |
| 杀破狼 + 机月同梁 | ★★★ | 动静互补，但需磨合，一方开拓一方守成 |
| 紫破 + 廉府 | ★★★★ | 格局相当，互相吸引 |
| 武曲 + 天同 | ★★★ | 刚柔互济，武曲收敛遇天同温和，能互补 |

---

### 十、倪海厦合盘核心名言汇总

1. **“看婚姻，光看夫妻宫，大错特错，一定要同时看福德宫。”**
2. **“廉贞贪狼/廉贞破军在夫妻宫，不管男命女命，非生离即死别。”**
3. **“廉贞七杀——半路埋尸；廉贞破军——水中做冢；廉贞贪狼——横夭夭折。”**
4. **“太阳化忌，上不见父，下不见子，中不见夫。“（女命那十年配偶有重大灾难）**
5. **“男人的命，最怕太阴化忌，婆媳不和，太太跟妈妈一定不和。”**
6. **“旺夫，一个太太完全让先��没有后顾之忧；克夫是感情太好，完全以对方为主。”**
7. **“巨门在朋友宫，跟朋友合伙会朋友变仇人。”**
8. **“如果你娶个太太是七杀入命，那你差不多毁了一半了，很累啊，草木皆兵。”**
`;

// ─── 婚姻判断辅助表 ───────────��─────────────────────────────

export const MARRIAGE_STARS_BRIEF: Record<string, string> = {
  '红鸾': '婚恋正缘，入命身主动成婚；流年逢红鸾该年婚恋有动',
  '天喜': '婚喜，与红鸾相互引动，主喜事到来',
  '天姚': '才艺桃花，感情机遇；婚恋中遇天姚易有浪漫邂逅',
  '咸池': '强力桃花，注意感情纷扰；遇贪狼则桃花最旺',
  '孤辰': '孤克之星，男命入命宫主独立好，但入夫妻宫主缘浅',
  '寡宿': '孤克之星，女命入命或夫妻宫，主婚姻不顺聚少离多',
  '天哭': '孤克刑伤，入夫妻宫主配偶有重大灾祸',
  '天虚': '空耗之星，入夫妻宫主感情虚耗',
  '天巫': '晚婚遗产宗教；入夫妻宫主晚婚为吉，早婚多波折',
};

export const HEMING_SCORE_CRITERIA = {
  '五星': '双方夫妻宫互映天作之合，四化相互补益，大限同走旺运，福德宫双吉',
  '四星': '一方夫妻宫对应对方命宫，四化以禄科为主，感情基础扎实',
  '三星': '命格相配但各有棱角，需磨合，长期来看稳定',
  '二星': '夫妻宫各有煞星，化忌有冲，感情起伏大，需双方主动经营',
  '一星': '凶星汇聚夫妻宫，或廉贞三凶组合，生离死别风险高',
};
