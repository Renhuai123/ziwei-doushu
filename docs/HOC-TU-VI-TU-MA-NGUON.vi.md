# Học Tử Vi từ mã nguồn `ziwei-doushu`

**Tài liệu tiếng Việt để đọc, học và đối chiếu với nguồn.**

Nguồn: kho `cm-d80/ziwei-doushu`, nền mã `a600484a49255039d0725f1ba9e11ca81a948f97`, được khảo sát ngày 05/11/2026. Tài liệu này được tạo riêng; không thay thế hay chỉnh sửa kho kiến thức tiếng Trung của ứng dụng.

Đây là **bản dịch tuyển chọn và giải thích kiến thức thể hiện trong repo**, không phải bản dịch toàn bộ 1.848 trích dẫn Thiên Kỷ, toàn văn cổ thư hay kho luận đoán riêng của website gốc. Phần ví dụ được đối chiếu với thuật toán đang có trong repo.

## Mục lục

1. [Nguồn kiến thức và cách đọc tài liệu](#1-nguồn-kiến-thức-và-cách-đọc-tài-liệu)
2. [Lá số gồm những gì?](#2-lá-số-gồm-những-gì)
3. [Thiên Can, Địa Chi và ngũ hành cục](#3-thiên-can-địa-chi-và-ngũ-hành-cục)
4. [Mười hai cung và cung Thân](#4-mười-hai-cung-và-cung-thân)
5. [Mười bốn chính tinh](#5-mười-bốn-chính-tinh)
6. [Phụ tinh, cát tinh và sát tinh](#6-phụ-tinh-cát-tinh-và-sát-tinh)
7. [Miếu, vượng, đắc, hãm](#7-miếu-vượng-đắc-hãm)
8. [Tam phương tứ chính, giáp cung và vô chính diệu](#8-tam-phương-tứ-chính-giáp-cung-và-vô-chính-diệu)
9. [Tứ Hóa và bảng tra theo Thiên Can](#9-tứ-hóa-và-bảng-tra-theo-thiên-can)
10. [Học cách cục bằng điều kiện cụ thể](#10-học-cách-cục-bằng-điều-kiện-cụ-thể)
11. [Đại hạn, lưu niên và các lớp thời gian](#11-đại-hạn-lưu-niên-và-các-lớp-thời-gian)
12. [Vì sao ngày giờ sinh và quy ước lập lá số quan trọng?](#12-vì-sao-ngày-giờ-sinh-và-quy-ước-lập-lá-số-quan-trọng)
13. [Một lá số ví dụ chạy từ mã nguồn](#13-một-lá-số-ví-dụ-chạy-từ-mã-nguồn)
14. [Quy trình tự học và bài tập](#14-quy-trình-tự-học-và-bài-tập)
15. [Những điểm trong nguồn cần đối chiếu](#15-những-điểm-trong-nguồn-cần-đối-chiếu)
16. [Bản đồ tệp nguồn và thuật ngữ](#16-bản-đồ-tệp-nguồn-và-thuật-ngữ)
17. [Trích dịch Thiên Kỷ có nguồn đối chiếu](#17-trích-dịch-thiên-kỷ-có-nguồn-đối-chiếu)
18. [Xuất xứ, phạm vi và điều kiện sử dụng](#18-xuất-xứ-phạm-vi-và-điều-kiện-sử-dụng)

## 1. Nguồn kiến thức và cách đọc tài liệu

Dự án giới thiệu mình là hệ thống Tử Vi Đẩu Số dựa trên cách giảng của **Nghê Hải Hạ — 倪海厦**, đặc biệt phần Tử Vi trong **Thiên Kỷ — 天纪**. Tuy nhiên, nội dung thực tế trong repo được tạo thành từ nhiều lớp:

| Lớp nguồn | Có gì trong repo? | Cách dùng để học |
|---|---|---|
| Bài giảng Thiên Kỷ | 1.848 trích dẫn ngắn, có số tập và thời điểm video | Đối chiếu lời giảng và ngữ cảnh |
| Cổ thư | Các bản nội dung tuyển chọn mang tên Toàn Thư, Toàn Tập và Cốt Tủy Phú | Đọc luận điểm, so sánh cách diễn giải |
| Mô tả sao | Từ khóa và các đoạn luận giải tĩnh do dự án tổng hợp | Học vốn thuật ngữ, ý nghĩa khái quát |
| Thư viện `iztro` | Cơ sở tính và an sao được `algorithm.ts` sử dụng | Hiểu cách biến dữ liệu sinh thành cấu trúc lá số |
| Bảng quy tắc riêng | Độ sáng sao, quy ước trường phái, một số phép điều chỉnh vị trí sao | Biết lá số đang theo hệ quy chiếu nào |
| Bộ nhận diện cách cục | Các điều kiện viết bằng code trong `patterns.ts` | Học cách kiểm chứng một nhận định bằng điều kiện |
| Kho luận đoán chi tiết | `STAR_DB` đang để trống | Không suy đoán nội dung riêng mà repo chưa cung cấp |

Trong tài liệu này:

- **“Dịch ý từ nguồn”** là diễn đạt tiếng Việt của nội dung có sẵn; không mặc định đó là lời nguyên văn của cổ nhân.
- **“Code kiểm tra”** mô tả đúng điều kiện của hàm, có thể hẹp hoặc rộng hơn câu chú thích phía trên hàm.
- **“Ví dụ minh họa”** giúp hiểu khái niệm; nếu không ghi là kết quả chạy thật thì không phải một lá số đã được tính.

Khi gặp một câu rất mạnh như “chắc chắn đại phú”, hãy xem đó là văn phong luận đoán của nguồn. Nhãn `excellent`, `good`, `neutral`, `caution` trong chương trình là mức phân loại do tác giả đặt; chúng không phải xác suất hay số liệu nghiệm lý.

Nguồn: [README tiếng Anh](../README.en.md), [mục lục Thiên Kỷ](./tianji-ziwei/README.md), [cổ thư](../lib/classics/index.ts), [kho luận đoán](../lib/ziwei/db-analysis.ts).

## 2. Lá số gồm những gì?

Có thể đọc cấu trúc lá số của dự án theo chuỗi:

> Thông tin sinh → quy đổi ngày giờ → xác định Mệnh/Thân và cục → an sao vào 12 cung → gắn Tứ Hóa và độ sáng → xét liên hệ giữa các cung → nhận diện cách cục → xem thêm vận hạn.

Đầu vào chính là **ngày tháng năm dương lịch, giờ địa chi và giới tính**. Biểu mẫu còn có nơi sinh và kinh độ để hiệu chỉnh giờ.

Kết quả `ZiweiChart` chứa:

| Tên trong code | Ý nghĩa khi đọc lá số |
|---|---|
| `birthInfo` | Thông tin sinh dùng để lập lá số, có thể đã đổi ngày theo quy tắc giờ Tý |
| `lunarInfo` | Ngày âm lịch, Can Chi và thông tin tứ trụ |
| `mingGongBranch` | Địa chi nơi an cung Mệnh |
| `shenGongBranch` | Địa chi nơi an cung Thân |
| `wuxingJuName` | Tên ngũ hành cục |
| `palaces` | Danh sách 12 cung; mỗi cung chứa các sao |
| `daXians` | Các khoảng đại hạn và cung tương ứng |
| `mingZhu`, `shenZhu` | Mệnh chủ và Thân chủ; đây là tên sao được tra theo bảng riêng |

**Cung Mệnh, Mệnh chủ và chính tinh ở Mệnh là ba khái niệm khác nhau.** `mingZhu` là một trường tra bảng; `mingGongBranch` là vị trí cung; còn chính tinh ở Mệnh nằm trong danh sách sao của cung ấy. Cũng cần phân biệt tương tự giữa cung Thân và Thân chủ.

Nguồn: [kiểu dữ liệu](../lib/ziwei/types.ts), [`generateChart()`](../lib/ziwei/algorithm.ts).

## 3. Thiên Can, Địa Chi và ngũ hành cục

### 3.1. Mười Thiên Can

| Chữ Hán | Hán–Việt | Chỉ số trong code |
|---|---|---:|
| 甲 | Giáp | 0 |
| 乙 | Ất | 1 |
| 丙 | Bính | 2 |
| 丁 | Đinh | 3 |
| 戊 | Mậu | 4 |
| 己 | Kỷ | 5 |
| 庚 | Canh | 6 |
| 辛 | Tân | 7 |
| 壬 | Nhâm | 8 |
| 癸 | Quý | 9 |

Thiên Can được dùng để tra Tứ Hóa, Can cung và nhiều bảng an sao. Trong hàm `calcYinYangGender()`, chỉ số Can chẵn được gắn Dương, chỉ số lẻ được gắn Âm; kết hợp với nam/nữ thành Dương nam, Âm nam, Dương nữ, Âm nữ.

### 3.2. Mười hai Địa Chi và giờ sinh

| Chữ Hán | Hán–Việt | Chỉ số | Khoảng giờ ghi trong `SHICHEN` |
|---|---|---:|---|
| 子 | Tý | 0 | 23:00–01:00 |
| 丑 | Sửu | 1 | 01:00–03:00 |
| 寅 | Dần | 2 | 03:00–05:00 |
| 卯 | Mão | 3 | 05:00–07:00 |
| 辰 | Thìn | 4 | 07:00–09:00 |
| 巳 | Tỵ | 5 | 09:00–11:00 |
| 午 | Ngọ | 6 | 11:00–13:00 |
| 未 | Mùi | 7 | 13:00–15:00 |
| 申 | Thân | 8 | 15:00–17:00 |
| 酉 | Dậu | 9 | 17:00–19:00 |
| 戌 | Tuất | 10 | 19:00–21:00 |
| 亥 | Hợi | 11 | 21:00–23:00 |

Khoảng giờ nên hiểu theo đầu khoảng được tính, cuối khoảng chuyển sang giờ kế tiếp. Quy tắc hiệu chỉnh kinh độ và đổi ngày cần được xử lý trước khi chốt giờ địa chi.

**Điểm dễ nhầm:** `hour: 4` nghĩa là **giờ Thìn**, không phải 4 giờ sáng. Trường `clockHour` trên biểu mẫu mới là giờ đồng hồ.

### 3.3. Ngũ hành cục

| Tên cục | Số cục trong code |
|---|---:|
| Thủy nhị cục — 水二局 | 2 |
| Mộc tam cục — 木三局 | 3 |
| Kim tứ cục — 金四局 | 4 |
| Thổ ngũ cục — 土五局 | 5 |
| Hỏa lục cục — 火六局 | 6 |

Cục là một phần của việc lập lá số và tính khoảng hạn. Không nên đồng nhất “cục” với ngũ hành của một sao, hoặc chỉ nhìn tên cục để kết luận toàn bộ tính cách. Dự án lấy kết quả cục từ lá số do `iztro` tạo rồi chuyển về cấu trúc riêng.

Nguồn: [các hằng số](../lib/ziwei/constants.ts), [thuật toán](../lib/ziwei/algorithm.ts).

## 4. Mười hai cung và cung Thân

Bảng dưới đây dịch ý các lĩnh vực mà nội dung trong repo gắn với từng cung. Đây là cách phân chia chủ đề để đọc lá số.

| Cung | Chữ Hán | Lĩnh vực được nguồn đề cập |
|---|---|---|
| Mệnh | 命宫 | Bản thân, khí chất, tính cách và cách cục nền tảng |
| Huynh Đệ | 兄弟宫 | Anh chị em; một số đoạn còn liên hệ người hợp tác |
| Phu Thê | 夫妻宫 | Quan hệ tình cảm, hôn nhân, hình tượng người phối ngẫu |
| Tử Tức | 子女宫 | Con cái; trong phần diễn giải còn mở rộng tới cấp dưới |
| Tài Bạch | 财帛宫 | Nguồn thu, cách tạo và sử dụng tiền bạc |
| Tật Ách | 疾厄宫 | Các chủ đề sức khỏe, thể chất và bất trắc trong hệ thống luận của nguồn |
| Thiên Di | 迁移宫 | Môi trường bên ngoài, đi xa, cơ hội và quan hệ khi ra ngoài |
| Nô Bộc | 交友宫 / 仆役宫 | Bạn bè, cộng sự, người trợ giúp hoặc gây trở ngại |
| Quan Lộc | 官禄宫 | Công việc, nghề nghiệp, trách nhiệm và địa vị xã hội |
| Điền Trạch | 田宅宫 | Nhà cửa, tài sản cố định và môi trường gia đình |
| Phúc Đức | 福德宫 | Đời sống tinh thần, sự an hưởng, cảm nhận nội tâm |
| Phụ Mẫu | 父母宫 | Cha mẹ, trưởng bối; phần lời nhắc trong ứng dụng còn đề cập văn thư, hợp đồng |

### Cung Thân nằm ở đâu?

Trong cấu trúc chương trình, **Thân là một vị trí được đánh dấu trong hệ 12 cung**, không phải ô thứ 13. Một cung có thể đồng thời mang tên chức năng như Tài Bạch và được đánh dấu là nơi an Thân.

Đừng nhầm **địa chi Thân — 申** với **cung Thân — 身宫**. Trong một câu “Thân an tại Tỵ”, chữ Thân đầu tiên là 身, còn Tỵ là địa chi vị trí.

### Cùng một sao, khác cung thì câu hỏi khác

Ví dụ minh họa: khi thấy Vũ Khúc, trước hết nhận biết lớp ý nghĩa tài lộc, cương nghị và quyết đoán mà repo gắn cho sao. Sau đó mới xét nó đang ở cung Mệnh, Tài Bạch hay Phu Thê. Tính chất của sao và lĩnh vực của cung phải được đọc cùng nhau; không nên lấy một câu mô tả tính cách để áp cho mọi cung.

Nguồn: [thứ tự 12 cung](../lib/ziwei/constants.ts), [các đoạn tuyển chọn Toàn Thư](../lib/classics/data/quanshu.ts), [mô hình cung](../lib/ziwei/types.ts), [các lĩnh vực mở rộng trong `PALACE_ROLES`](../components/InsightPanel.tsx).

## 5. Mười bốn chính tinh

### 5.1. Bảng học nhanh từ `STAR_DESCRIPTIONS`

Bảng này dịch các từ khóa và ngũ hành được tác giả ghi trực tiếp trong mã. “Ngũ hành” ở đây là thuộc tính tác giả gán cho sao trong bảng này.

| Chính tinh | Chữ Hán | Hành trong bảng | Từ khóa dịch từ nguồn |
|---|---|---|---|
| Tử Vi | 紫微 | Thổ | Đế vương, tôn quý, độc lập |
| Thiên Cơ | 天机 | Mộc | Trí tuệ, linh hoạt, mưu lược |
| Thái Dương | 太阳 | Hỏa | Dương cương, quan quý, hào sảng |
| Vũ Khúc | 武曲 | Kim | Tài lộc, cương nghị, quyết đoán |
| Thiên Đồng | 天同 | Thủy | Ôn hòa, hưởng phúc, tùy duyên |
| Liêm Trinh | 廉贞 | Hỏa | Tài nghệ, hình tù, đào hoa |
| Thiên Phủ | 天府 | Thổ | Kho tài, điềm tĩnh, thận trọng |
| Thái Âm | 太阴 | Thủy | Dịu dàng, tài lộc, âm nhu |
| Tham Lang | 贪狼 | Mộc | Ham muốn, đào hoa, đa tài |
| Cự Môn | 巨门 | Thủy | Khẩu thiệt, thị phi, giỏi biện luận |
| Thiên Tướng | 天相 | Thủy | Phò tá, hành chính, ấn thụ |
| Thiên Lương | 天梁 | Thổ | Che chở, y dược, trưởng bối |
| Thất Sát | 七杀 | Kim | Tướng tinh, quả quyết, cô khắc |
| Phá Quân | 破军 | Thủy | Khai phá, biến động, phá bỏ |

Nguồn trực tiếp: [`STAR_DESCRIPTIONS`](../lib/ziwei/constants.ts). Các bảng khác hoặc trường phái khác có thể trình bày chi tiết khác; bảng này chỉ ghi đúng dữ liệu của repo đang học.

### 5.2. Dịch ý các mô tả chính tinh để dễ nhớ

Các đoạn dưới đây rút ý từ `STAR_DETAIL` và các mô tả cách cục trong repo. Đây là **bản diễn giải tuyển chọn**, không phải lời trích nguyên văn Thiên Kỷ.

Tên trường `niHaixia` là nhãn tác giả đặt cho một nhóm đoạn diễn giải; các đoạn ấy chưa kèm số tập/thời điểm để xác minh như corpus Thiên Kỷ. Comment trên `STAR_DETAIL` còn ghi tham khảo Cố Tường Hoằng — 顾祥弘, *Phi Tinh Tử Vi Đẩu Số Toàn Thư*, và Nam Bắc Sơn Nhân — 南北山人, *Tử Vi Đẩu Số Toàn Thư*. Vì vậy không gán mọi câu trong component thành lời nguyên văn hoặc quy tắc độc quyền của Nghê Hải Hạ.

**Tử Vi:** nguồn dùng hình tượng người đứng đầu, có tự trọng và nhu cầu tự chủ. Khi học cần đặt cạnh Tả Phụ, Hữu Bật và các sao hội chiếu: bộ nhận diện Quân thần khánh hội yêu cầu điều kiện hỗ trợ cụ thể, không chỉ có riêng Tử Vi.

**Thiên Cơ:** thiên về suy nghĩ, xoay xở, tính toán và thích ứng. Các đoạn diễn giải đặt cạnh nó khả năng lập kế hoạch và mặt trái là suy tính nhiều, khó quyết. Để hiểu cách cục, hãy xem thêm Cơ Nguyệt Đồng Lương.

**Thái Dương:** nguồn gắn với tính công khai, hào sảng, vai trò trước tập thể và danh vị. Các hàm nhận diện còn kiểm tra độ sáng của Thái Dương; vì vậy không phải cứ nhìn thấy tên sao là có cùng một mức đánh giá.

**Vũ Khúc:** được mô tả bằng hình tượng tài tinh, thực tế, cứng rắn, quyết đoán. Khi gặp Hóa Lộc hoặc phối với Tham Lang, chương trình dùng thêm điều kiện để đưa ra những cách cục và đoạn mô tả khác.

**Thiên Đồng:** gắn với sự ôn hòa, dễ thích nghi và xu hướng an hưởng. Nguồn mô tả cả mặt dễ chịu lẫn mặt ngại áp lực; cần xét sao phối hợp và cung đang đóng thay vì chỉ ghi nhớ chữ “phúc”.

**Liêm Trinh:** nguồn đặt cạnh sao này tài nghệ, đào hoa, quy củ và hình tù. Đây là ví dụ cho một sao không được tóm bằng một nhãn đơn giản: trong bảng tác giả ghi “trong hung có cát”, còn cách cục có thể phụ thuộc Thiên Tướng, Thất Sát hoặc sát tinh đi kèm.

**Thiên Phủ:** hình tượng kho tàng, giữ gìn, quản lý và ổn định. Hai chủ đề dễ học là Tử Phủ đồng cung và Phủ Tướng triều viên; điều kiện phối sao quan trọng hơn một câu “có Thiên Phủ là giàu”.

**Thái Âm:** nguồn liên hệ âm nhu, sự tinh tế, tài sản và tích lũy. Những đoạn về nghề nghiệp/tài sản là cách diễn giải của tác giả; về mặt cấu trúc, hãy kiểm tra thêm vị trí, độ sáng và Tứ Hóa của sao.

**Tham Lang:** nguồn nhấn mạnh ham muốn, giao tiếp, nhiều tài và đào hoa. Nó xuất hiện trong Vũ Tham, Hỏa Tham/Linh Tham và Sát Phá Tham. Mỗi tổ hợp có điều kiện và mặt thuận/nghịch riêng.

**Cự Môn:** hình tượng lời nói, tranh luận, nghi vấn và thị phi. Nguồn nêu cả khả năng biện luận lẫn xung đột bằng lời; khi học hãy luôn đặt hai mặt cạnh nhau.

**Thiên Tướng:** được mô tả bằng sự phò tá, điều phối, quản lý và ấn thụ. Trong Phủ Tướng triều viên, chương trình xét Thiên Tướng và Thiên Phủ ở các vị trí khác nhau trong tam phương tứ chính.

**Thiên Lương:** gắn với che chở, trưởng bối, nguyên tắc và y dược trong ngôn ngữ biểu tượng của nguồn. Nó tham gia Dương Lương Xương Lộc và Cơ Nguyệt Đồng Lương; không thể dùng một từ khóa để thay thế toàn bộ cấu trúc ấy.

**Thất Sát:** nguồn dùng hình tượng tướng tinh, quyết liệt, độc lập và chịu thử thách. Học nó cùng Phá Quân, Tham Lang sẽ thấy cách tác giả mô tả nhóm thiên về biến động, khai phá.

**Phá Quân:** gắn với phá bỏ khuôn cũ, thay đổi và tạo dựng lại. Trong cách cục Sát Phá Tham, chương trình còn xét Lộc/Quyền, Phụ/Bật và mức sát tinh để mô tả điều kiện thuận hay bất lợi.

Nguồn: [mô tả chi tiết sao trong giao diện](../components/StarDetailPanel.tsx), [các bộ nhận diện cách cục](../lib/ziwei/patterns.ts). Những mô tả vị trí đặc biệt không nhất quán trong nguồn được nêu riêng ở mục 15.

## 6. Phụ tinh, cát tinh và sát tinh

### 6.1. Ba cặp thường xuất hiện khi xét cách cục

| Cặp sao | Chữ Hán | Ý nghĩa được nguồn thường gắn với chúng |
|---|---|---|
| Tả Phụ – Hữu Bật | 左辅 – 右弼 | Trợ lực, cộng sự, người nâng đỡ |
| Văn Xương – Văn Khúc | 文昌 – 文曲 | Học vấn, văn tài, diễn đạt, tài nghệ |
| Thiên Khôi – Thiên Việt | 天魁 – 天钺 | Quý nhân, cơ hội được hỗ trợ |

Các hàm `detectFuBiJiaMing`, `detectChangQuJiaMing`, `detectKuiYueJiaMing` kiểm tra xem hai sao trong từng cặp có nằm ở hai cung kề Mệnh hay không. Có đủ tên hai sao ở đâu đó trên lá số chưa đủ để gọi là “giáp Mệnh”.

### 6.2. Lộc Tồn và Thiên Mã

- **Lộc Tồn — 禄存:** được nguồn liên hệ với của cải và tích lũy. Đây là tên một sao.
- **Thiên Mã — 天马:** được nguồn liên hệ với di chuyển và hoạt động. Cần xét nó ở cung nào và phối với sao nào.

**Lộc Tồn khác Hóa Lộc.** Một bên là sao; một bên là thuộc tính Tứ Hóa được gắn lên một sao. Song Lộc triều viên đòi hỏi cả hai loại “Lộc” trong vùng hội chiếu được xét.

### 6.3. Nhóm sát tinh được bộ nhận diện dùng

Trong `patterns.ts`:

- `SHA_HARD` gồm Kình Dương, Đà La, Hỏa Tinh, Linh Tinh.
- `SHA_KONG` gồm Địa Không và Địa Kiếp.
- `SHA_NAMES` ghép hai nhóm trên thành sáu sao.

Phân loại `sha` trong `algorithm.ts` rộng hơn sáu sao này, còn có một số tạp diệu. Vì vậy câu “có ba sát tinh” trong một hàm phải được hiểu theo **danh sách mà hàm ấy thực sự đếm**, không tự mở rộng sang mọi sao bị tô màu bất lợi trên giao diện.

Nguồn: [`patterns.ts`](../lib/ziwei/patterns.ts), [`mapStarType()` và các tập sao](../lib/ziwei/algorithm.ts).

## 7. Miếu, vượng, đắc, hãm

Nguồn dùng “độ sáng” để biểu thị trạng thái của một sao tại vị trí nhất định. Đây là thuật ngữ của hệ thống luận sao, không phải phép đo độ sáng thiên văn.

| Ký hiệu | Cách đọc tiếng Việt |
|---|---|
| 庙 | Miếu |
| 旺 | Vượng |
| 得 | Đắc |
| 利 | Lợi |
| 平 | Bình |
| 不 | Bất đắc |
| 陷 | Hãm |
| 闲 | Nhàn — cũng được kiểu dữ liệu hỗ trợ |
| 地 | Địa — có trong một số bảng mở rộng |

Một số comment gọi là “7 bậc”, nhưng kiểu `StarBrightness` hiện chấp nhận cả chín ký hiệu trên. Khi mô tả dữ liệu hiện tại, cần theo danh sách hợp lệ trong code.

### Độ sáng chi tiết và độ sáng rút gọn

Trong `algorithm.ts`, `mapBrightness()` rút gọn thành:

| Giá trị thô | Giá trị rút gọn |
|---|---|
| Miếu, Vượng | `bright` |
| Hãm, Bất đắc, Nhàn | `dim` |
| Những giá trị còn lại, hoặc thiếu giá trị | `normal` |

Do đó **Đắc không được hàm này gộp vào `bright`**. Một điều kiện `isBright()` trong bộ nhận diện chỉ đúng với nhóm được ánh xạ thành `bright`, không phải mọi mức mà người đọc cảm thấy “tốt”.

Mặc định bảng độ sáng hiện tại được `setBrightnessSchool()` quy về bảng **QS / Toàn Thư**. Repo còn giữ các lựa chọn trường phái khác. Hai lá số cùng thông tin sinh nhưng khác bảng độ sáng có thể có chữ miếu/vượng khác nhau và ảnh hưởng đến một số điều kiện cách cục.

Nguồn: [`StarBrightness`](../lib/ziwei/types.ts), [`mapBrightness()`, `setBrightnessSchool()`](../lib/ziwei/algorithm.ts), [bảng trường phái](../lib/ziwei/school-data.ts).

## 8. Tam phương tứ chính, giáp cung và vô chính diệu

### 8.1. Tam phương tứ chính

Với cung ở địa chi có chỉ số `b`, code xét bốn vị trí:

- Chính cung: `b`.
- Hai cung tam hợp: `(b + 4) % 12` và `(b + 8) % 12`.
- Đối cung: `(b + 6) % 12`.

Đối với Mệnh, bốn cung được nguồn thường gọi chung là **Mệnh – Tài Bạch – Quan Lộc – Thiên Di**.

Ví dụ hình học: nếu Mệnh ở Tý (`b = 0`), hai vị trí tam hợp là Thìn (`4`) và Thân (`8`), đối cung là Ngọ (`6`). Đừng nhầm một tên địa chi như “Thìn” với tên chức năng cung như “Quan Lộc”: địa chi là vị trí, chức năng cung được an lên vị trí ấy.

### 8.2. Giáp cung

“Giáp” trong các hàm nhận diện là hai cung kề trước và kề sau:

- `(b + 11) % 12`.
- `(b + 1) % 12`.

Nếu Tả Phụ ở một bên, Hữu Bật ở bên còn lại của Mệnh thì hàm có thể nhận diện Phụ Bật giáp Mệnh. Cả hai sao cùng ở Mệnh không đáp ứng phép kiểm tra “giáp” này.

### 8.3. Vô chính diệu và phép mượn đối cung

Một cung được đánh dấu `isEmpty` khi **không có sao loại `major`**. Cung ấy vẫn có thể chứa nhiều phụ tinh, không phải hoàn toàn trống.

Thuật toán ghi thêm:

- Đối cung là cung nào.
- Tên cung đối diện.
- Danh sách chính tinh ở đối cung để tham khảo.

**Code không chuyển các sao đối cung sang danh sách sao thật của cung vô chính diệu.** Nó chỉ lưu `borrowedStars` và các trường liên quan. Bởi vậy, một hàm chỉ kiểm tra sao đóng trực tiếp ở chính cung có thể không nhận sao được “mượn” là sao tại cung ấy.

Nguồn: [các helper hình học](../lib/ziwei/patterns.ts), [đánh dấu vô chính diệu trong thuật toán](../lib/ziwei/algorithm.ts), [bố cục và đường nối lá số](../components/ChartBoard.tsx).

## 9. Tứ Hóa và bảng tra theo Thiên Can

### 9.1. Bốn loại Hóa

Dịch ý từ nội dung giới thiệu trong repo:

| Hóa | Chữ Hán | Ý nghĩa khái quát trong nguồn |
|---|---|---|
| Hóa Lộc | 化禄 | Gia tăng, cơ hội, tài lộc, thuận lợi |
| Hóa Quyền | 化权 | Quyền chủ động, kiểm soát, vai trò và sức quyết định |
| Hóa Khoa | 化科 | Danh tiếng, học hành, sự công nhận và hỗ trợ |
| Hóa Kỵ | 化忌 | Vướng mắc, trở ngại, chấp niệm hoặc chủ đề cần chú ý |

Đây là từ khóa để bắt đầu đọc. Trong nguồn, Hóa Kỵ cũng có đoạn được giải thích là năng lượng/chủ đề cần quan tâm, không tự động biến mọi trường hợp thành cùng một kết luận xấu.

### 9.2. Tứ Hóa là thuộc tính của sao

Trong dữ liệu:

```ts
{ name: '天梁', siHua: '科' }
```

Nghĩa là **Thiên Lương Hóa Khoa**. Không có một sao riêng tên “Hóa Khoa” nằm cạnh Thiên Lương.

Điều này rất quan trọng khi đọc cách cục. “Tam phương có Hóa Khoa” nghĩa là trong các sao ở vùng đó có ít nhất một sao mang `siHua === '科'`.

### 9.3. Bảng Tứ Hóa trong `SI_HUA_TABLE`

Thứ tự bốn cột là **Lộc – Quyền – Khoa – Kỵ**:

| Can | Hóa Lộc | Hóa Quyền | Hóa Khoa | Hóa Kỵ |
|---|---|---|---|---|
| Giáp | Liêm Trinh | Phá Quân | Vũ Khúc | Thái Dương |
| Ất | Thiên Cơ | Thiên Lương | Tử Vi | Thái Âm |
| Bính | Thiên Đồng | Thiên Cơ | Văn Xương | Liêm Trinh |
| Đinh | Thái Âm | Thiên Đồng | Thiên Cơ | Cự Môn |
| Mậu | Tham Lang | Thái Âm | Hữu Bật | Thiên Cơ |
| Kỷ | Vũ Khúc | Tham Lang | Thiên Lương | Văn Khúc |
| Canh | Thái Dương | Vũ Khúc | Thái Âm | Thiên Đồng |
| Tân | Cự Môn | Thái Dương | Văn Khúc | Văn Xương |
| Nhâm | Thiên Lương | Tử Vi | Tả Phụ | Vũ Khúc |
| Quý | Phá Quân | Cự Môn | Thái Âm | Tham Lang |

Bảng này là bảng cụ thể trong repo, không thay cho mọi truyền thống Tử Vi. Các kiểu cấu hình có nhắc biến thể của năm Canh; muốn biết một đường chạy đang dùng biến thể nào phải kiểm tra bảng/hàm mà nó gọi, không chỉ nhìn danh sách lựa chọn.

Trong bảng trên không có Tử Vi Hóa Kỵ và không có Thất Sát nhận Tứ Hóa. Cần phân biệt câu “một sao tự Hóa Kỵ” với “một sao gặp sao khác Hóa Kỵ”. Khi văn bản không nói rõ, không tự thêm một phép Hóa mới vào bảng của engine.

Nguồn: [`SI_HUA_TABLE`](../lib/ziwei/constants.ts), [các hàm tra Tứ Hóa](../lib/ziwei/sihua.ts), [kiểm tra hồi quy Tứ Hóa trong cách cục](../scripts/regression/patterns-sihua-bonus.test.ts).

## 10. Học cách cục bằng điều kiện cụ thể

### 10.1. Một cách cục trong chương trình có cấu trúc gì?

`Pattern` có tên, mức đánh giá, mô tả, cung liên quan, nguồn trích và ba nhóm điều kiện:

| Trường | Cách đọc |
|---|---|
| `required` | Điều kiện nền tảng để nhận diện |
| `bonus` | Yếu tố tăng trợ lực trong mô tả |
| `breaking` | Điều kiện giảm lực hoặc phá cách |

Các mức `excellent`, `good`, `neutral`, `caution` là nhãn của chương trình. Có điều kiện phá cách không nhất thiết làm một cách cục biến mất: nhiều hàm vẫn trả cách cục và chỉ đổi mức hoặc thêm ghi chú. Thậm chí có hàm giữ nguyên mức dù có cảnh báo; hãy xem từng trường thay vì chỉ xem màu nhãn.

### 10.2. Quân thần khánh hội — 君臣庆会

**Code kiểm tra:** Tử Vi đóng Mệnh; Tả Phụ và Hữu Bật đều có mặt trong tam phương tứ chính của Mệnh.

**Điểm cộng:** có Xương hoặc Khúc; có Khôi hoặc Việt; Tử Vi Hóa Quyền.

**Điều kiện giảm lực:** bộ đếm Không/Kiếp trong vùng xét đạt ít nhất hai. Chú ý câu mô tả trong code có chữ “giáp”, nhưng phép kiểm tra ở đây là đếm trong vùng hội chiếu, không dùng phép tìm hai cung kề.

**Dịch ý:** hình tượng người đứng đầu có người trợ giúp phù hợp. Bài học về phương pháp là phải xét đủ bộ hỗ trợ, không chỉ thuộc câu “Tử Vi là đế tinh”.

Hàm: `detectJunChenQingHui()`.

### 10.3. Tử Phủ đồng cung — 紫府同宫

**Code kiểm tra:** Tử Vi và Thiên Phủ nằm cùng một cung. Hàm phân biệt trường hợp đồng cung ngay tại Mệnh với trường hợp ở cung khác.

**Điểm cộng:** Phụ/Bật cùng hội; có Xương hoặc Khúc trong vùng xét của Mệnh.

**Giảm lực:** cung Tử Phủ có Không/Kiếp, hoặc có ít nhất hai sao trong nhóm Kình/Đà/Hỏa/Linh.

Chú thích trên hàm nói tới Dần/Thân, nhưng thân hàm không có lệnh kiểm tra địa chi Dần/Thân riêng; nó dựa vào cấu trúc an sao rồi so vị trí hai sao. Vì vậy cần phân biệt kiến thức cấu trúc sao với điều kiện được viết trực tiếp.

Hàm: `detectZiFu()`.

### 10.4. Phủ Tướng triều viên — 府相朝垣

**Code kiểm tra:** Thiên Phủ và Thiên Tướng ở hai cung khác nhau, đều nằm trong tam phương tứ chính của Mệnh.

**Điểm cộng:** Mệnh có Lộc Tồn hoặc một sao Hóa Lộc; có thêm Tả Phụ trong vùng hội chiếu.

**Giảm lực:** Mệnh có Kình/Đà/Hỏa/Linh; hoặc tổng số các sao thuộc nhóm đó trong vùng xét từ ba trở lên.

**Dịch ý:** sự kết hợp giữa hình tượng kho tàng/quản lý của Thiên Phủ và phò tá/ấn thụ của Thiên Tướng. Câu luận “địa vị, thực lộc” trong nguồn được chương trình đặt trên những điều kiện phối sao này.

Hàm: `detectFuXiangChaoYuan()`.

### 10.5. Dương Lương Xương Lộc — 阳梁昌禄

**Code kiểm tra:** trong tam phương tứ chính của Mệnh có đủ Thái Dương, Thiên Lương, Văn Xương và Lộc Tồn.

**Điểm cộng:** Thái Dương hoặc Thiên Lương thuộc nhóm `bright`; có Hóa Khoa trong vùng xét.

**Giảm lực:** Thái Dương thuộc nhóm `dim`; hoặc nhóm Kình/Đà/Hỏa/Linh trong vùng xét có ít nhất hai sao.

**Dịch ý:** nguồn liên hệ tổ hợp với học hành, danh vị, văn giáo và chuyên môn. Một sao Hóa Lộc không tự thay thế được Lộc Tồn trong điều kiện bắt buộc của hàm này.

Hàm: `detectYangLiangChangLu()`.

### 10.6. Hỏa Tham và Linh Tham — 火贪 / 铃贪

**Code kiểm tra:** Tham Lang cùng cung, tam hợp hoặc đối cung với Hỏa Tinh/Linh Tinh; đồng thời Tham Lang phải nằm trong tam phương tứ chính của Mệnh.

**Điểm cộng:** Tham Lang thuộc nhóm `bright`; Tham Lang Hóa Lộc hoặc Hóa Quyền.

**Giảm lực:** tại cung Tham Lang có Kình/Đà hoặc Không/Kiếp.

**Dịch ý:** nguồn dùng hình tượng cơ hội hay thành quả đến nhanh. Để học đúng điều kiện, cần thấy cả phần được tăng trợ lực lẫn phần làm giảm lực; không biến mô tả này thành lời khuyên đầu cơ.

Hàm: `detectHuoTanLingTan()`.

### 10.7. Sát Phá Tham — 杀破狼

Tên chữ Hán gọi tắt Thất Sát, Phá Quân và Tham Lang. Tài liệu dùng tên quen thuộc tiếng Việt là **Sát Phá Tham**; có thể gặp cách đọc sát chữ “Sát Phá Lang”.

**Code kiểm tra:** đủ cả ba sao trong tam phương tứ chính của Mệnh.

**Điểm cộng:** có Hóa Lộc hoặc Hóa Quyền; có cả Phụ và Bật.

**Giảm lực:** nhóm Kình/Đà/Hỏa/Linh có ít nhất ba sao trong vùng xét; hoặc Mệnh có Không/Kiếp.

**Dịch ý:** nguồn mô tả khuynh hướng khai phá, thay đổi và không muốn ở yên. Các yếu tố đi kèm được dùng để phân biệt có trợ lực hay biến động vất vả.

Hàm: `detectShaPoLang()`.

### 10.8. Cơ Nguyệt Đồng Lương — 机月同梁

**Code kiểm tra:** đủ Thiên Cơ, Thái Âm, Thiên Đồng và Thiên Lương trong tam phương tứ chính của Mệnh.

**Điểm cộng:** Xương hoặc Khúc; Hóa Khoa.

**Giảm lực:** ít nhất ba sao trong nhóm Kình/Đà/Hỏa/Linh ở vùng xét; hoặc có sao thuộc nhóm đó ngay tại Mệnh.

**Dịch ý:** nguồn gắn với sự tích lũy, chuyên môn, văn giáo và công việc ổn định. Hàm `detectJiYueTongLiangPartial()` còn nhận diện một tổ hợp chưa đủ bốn sao; không được đánh đồng kết quả “ba sao hội” với cách cục đủ bộ.

Hàm: `detectJiYueTongLiang()` và `detectJiYueTongLiangPartial()`.

### 10.9. Nhật Nguyệt đồng cung — 日月同宫

**Code kiểm tra:** Thái Dương và Thái Âm cùng cung, tại Sửu hoặc Mùi.

Hàm còn phân biệt sao ở Mệnh hay ở cung khác, thêm ghi chú cho Mùi, xét Xương/Khúc và sát tinh tại cung Nhật Nguyệt.

Điểm cần ghi nhớ là cặp sao ở đây là **Thái Dương + Thái Âm**, không phải Cự Môn + Thái Dương. Có đoạn tuyển chọn trong thư viện dùng tên lẫn lộn, xem mục 15.

Hàm: `detectRiYueTongGong()`.

### 10.10. Song Lộc triều viên — 双禄朝垣

**Code kiểm tra:** có ít nhất một sao Hóa Lộc và có Lộc Tồn trong tam phương tứ chính của Mệnh.

Nếu Mệnh có Không/Kiếp, hàm thêm cảnh báo “tài đến tài đi”. Tuy vậy, hàm vẫn đặt `level: 'excellent'`. Đây là ví dụ cụ thể cho việc mức đánh giá không tự giảm theo mọi dòng cảnh báo.

Hàm: `detectShuangLuChaoYuan()`.

### 10.11. Tam Kỳ gia hội — 三奇加会

**Code kiểm tra:** trong tam phương tứ chính của Mệnh có đủ ba thuộc tính Hóa Lộc, Hóa Quyền và Hóa Khoa. Ba thuộc tính có thể nằm trên những sao khác nhau và ở các cung khác nhau trong vùng xét.

Hàm này không tự thêm điều kiện độ sáng hoặc sát tinh để hủy kết quả. Nếu muốn đánh giá toàn cục, phải đọc thêm các sao và kết quả khác mà chương trình trả về.

Hàm: `detectSanQiJiaHui()`.

### 10.12. Các nhóm khác để học tiếp

Trong file còn có Vũ Tham, Liêm Tướng, Vũ Khúc Thất Sát, Đồng Lương, Nhật Nguyệt giáp Mệnh, Cự Nhật đồng cung, Thạch trung ẩn ngọc, Minh châu xuất hải, các cách giáp Mệnh, và các tổ hợp Dương Đà, Hỏa Linh, Không Kiếp.

Khi đọc một hàm mới, ghi thành bốn dòng: **cung/vùng xét → sao bắt buộc → điểm cộng → điều kiện giảm lực**. Sau đó mới đọc phần mô tả và nguồn trích.

Nguồn chung cho mục 10: [`patterns.ts`](../lib/ziwei/patterns.ts). Tên cổ thư trong trường `source` là xuất xứ tác giả khai báo; tài liệu này chưa xác minh từng câu với bản cổ thư gốc.

## 11. Đại hạn, lưu niên và các lớp thời gian

| Thuật ngữ | Ý nghĩa trong cấu trúc repo |
|---|---|
| Bản mệnh | Lá số nền được tạo từ thông tin sinh |
| Đại hạn | Một khoảng tuổi gắn với một cung; các khoảng được lấy từ lá số `iztro` |
| Lưu niên | Lớp xét theo năm được chọn |
| Lưu nguyệt | Lớp xét theo tháng âm lịch |
| Lưu nhật | Lớp xét theo ngày |
| Lưu thời | Lớp xét theo giờ |

Giao diện demo chủ yếu đưa ra Bản mệnh, Đại hạn và Lưu niên. Việc helper cho lưu nguyệt/lưu nhật/lưu thời tồn tại không có nghĩa mọi chức năng đó đều được trang demo nối đầy đủ.

### Tuổi dùng để xét hạn

Thuật toán ưu tiên lấy `nominalAge` của `iztro`, tức cách tính tuổi danh nghĩa/tuổi mụ tương ứng với hệ thống khoảng đại hạn. Các helper trong `yunxian-context.ts` dùng năm âm lịch sinh để quy đổi lưu niên sang tuổi. Không lấy tuổi dương lịch theo sinh nhật để thay thẳng vào mọi phép tra.

### Cần phân biệt Tứ Hóa nền và lớp phủ vận hạn

Có ba sự thật cùng tồn tại trong repo:

1. `generateChart()` không còn gán các trường Tứ Hóa riêng vào từng phần tử `daXians`; comment nói theo lập trường luận của Nghê Hải Hạ.
2. `patterns.ts` chủ yếu xét thuộc tính `siHua` có trên các sao của lá số được đưa vào, không nhận một lớp phủ đại hạn riêng làm tham số.
3. `ChartBoard` và `TimeNav` vẫn tạo **lớp phủ Tứ Hóa đại hạn từ Can của cung đại hạn**, và lớp phủ lưu niên từ Can năm được chọn. `sihua.ts` cũng có các helper tương ứng.

Vì vậy, không nên kết luận “repo hoàn toàn không dùng Tứ Hóa vận hạn”, cũng không nên cho rằng mọi mô tả cách cục bản mệnh đều đã được tính lại theo lớp phủ đang nhìn. Khi tự học, luôn ghi rõ đang xét **bản mệnh hay lớp thời gian nào**.

Nguồn: [đại hạn trong thuật toán](../lib/ziwei/algorithm.ts), [helper Tứ Hóa](../lib/ziwei/sihua.ts), [điều hướng thời gian](../components/TimeNav.tsx), [lớp phủ trên lá số](../components/ChartBoard.tsx), [ngữ cảnh vận hạn](../lib/ziwei/yunxian-context.ts).

## 12. Vì sao ngày giờ sinh và quy ước lập lá số quan trọng?

### 12.1. Năm âm lịch khác năm dương lịch

Thuật toán cấu hình `iztro` với `yearDivide: 'normal'`, lấy mốc đổi năm theo Tết âm lịch cho lá số. Bởi vậy sinh ngày 01/01/1990 dương lịch chưa chắc mang Can Chi Canh Ngọ trong lá số; ví dụ chạy ở mục 13 vẫn là năm Kỷ Tỵ.

Repo còn lưu cả tứ trụ theo tiết khí và theo lịch âm. Hai trường có thể khác nhau ở vùng giáp ranh; đó là hai quy ước đang được lưu, không nên ghép tùy ý thành một bộ tứ trụ mới.

### 12.2. Tháng nhuận

| Chính sách | Cách helper xử lý tháng nhuận |
|---|---|
| `split` | Ngày 1–15 dùng số tháng gốc; sau ngày 15 chuyển sang tháng tiếp theo |
| `prev-month` | Dùng số tháng gốc như tháng thường tương ứng |
| `next-month` | Chuyển cả tháng nhuận sang tháng tiếp theo |
| `origin-month` | Giữ dấu tháng nhuận |

`generateChart()` dùng mặc định **`split`** thông qua `DEFAULT_LEAP_MONTH`. Riêng khi gọi trực tiếp `resolveEffectiveLunarDate()` mà không truyền chính sách, tham số mặc định của helper còn là `prev-month`. Hai đường gọi khác nhau nên có thể cho kết quả khác nhau.

### 12.3. Giờ Tý muộn và đổi ngày

`formToBirthInfo()` dùng thời gian đã hiệu chỉnh kinh độ để xác định địa chi giờ và quy tắc đổi ngày. Hàm gọi `resolveZiweiDayOffset()` mà không truyền `lateZishi`, nên dùng mặc định `next-day`: trường hợp Tý muộn được xếp sang ngày lập lá số tiếp theo.

Kiểu cấu hình có lựa chọn giữ ngày hiện tại, nhưng lựa chọn ấy chưa được truyền vào đường chuyển đổi biểu mẫu này. Comment còn gắn nhãn “phái Nghê” khác nhau cho hai cách xử lý; phần có thể xác nhận là hành vi hàm hiện chạy, không phải phán quyết về toàn bộ một trường phái.

Nếu chọn “không biết giờ”, biến `hour` trong đường chuyển đổi này vẫn để giá trị tạm `0`. Điều đó không phải bằng chứng người ấy sinh giờ Tý; không nên học từ lá số ấy như một trường hợp đã biết đủ giờ sinh.

Ví dụ ghi ngay trong nguồn:

- Giờ đồng hồ 23:30, kinh độ 100°Đ.
- So với kinh tuyến chuẩn 120°Đ, độ lệch là `(100 − 120) × 4 = −80 phút`.
- Thời gian hiệu chỉnh thành 22:10, thuộc Hợi.
- Vì chưa phải Tý muộn sau hiệu chỉnh, không được tự đổi sang ngày kế tiếp chỉ vì đồng hồ đã qua 23:00.

### 12.4. Hiệu chỉnh kinh độ và phương trình thời gian

Trong repo có hai mức xử lý cần phân biệt:

- Đường chuyển đổi biểu mẫu ở `share.ts` hiện dùng độ lệch kinh độ so với 120°Đ, tức giả định nền giờ chuẩn UTC+8.
- Hàm `calculateTrueSolarTime()` ở `true-solar-time.ts` có thêm phương trình thời gian theo ngày và nhận `utcOffsetMinutes` để tính kinh tuyến chuẩn của múi giờ khác.

Không nên đọc năng lực của helper tổng quát rồi khẳng định biểu mẫu demo đang gọi đầy đủ helper đó. Khi áp dụng cho nơi sinh ở Việt Nam hoặc một múi giờ khác, cần kiểm tra đúng đường chuyển đổi đang dùng; đổi ngôn ngữ giao diện không tự đổi hệ múi giờ của thuật toán.

### 12.5. Giờ mùa hè

`dst-cn.ts` chứa dữ liệu nhận diện giờ mùa hè tại Trung Quốc. Repo không tự động trừ giờ mùa hè trong mọi đường lập lá số. `clock-adjust.ts` cung cấp phép dịch giờ có kiểm tra; README nhấn mạnh cần xác nhận việc chuyển đổi trước khi áp dụng.

Nguồn: [chính sách tháng nhuận và giờ Tý](../lib/ziwei/school-config.ts), [chuyển đổi biểu mẫu](../lib/ziwei/share.ts), [hiệu chỉnh giờ](../lib/ziwei/true-solar-time.ts), [giờ mùa hè](../lib/ziwei/dst-cn.ts), [dịch giờ đồng hồ](../lib/ziwei/clock-adjust.ts).

## 13. Một lá số ví dụ chạy từ mã nguồn

Ví dụ này được tạo trực tiếp bằng `generateChart()`; không phải một đoạn luận do AI sinh.

### 13.1. Đầu vào

```ts
generateChart({
  year: 1990,
  month: 1,
  day: 1,
  hour: 4,       // giờ Thìn, không phải 04:00
  gender: 'male'
});
```

Đây là lời gọi trực tiếp với ngày lập lá số và giờ địa chi, không chạy biểu mẫu hoặc một phép hiệu chỉnh nơi sinh khác.

### 13.2. Kết quả nền

| Trường | Kết quả |
|---|---|
| Dương lịch đầu vào | 01/01/1990 |
| Âm lịch theo engine | Ngày 5, tháng 12, năm 1989 âm lịch |
| Can Chi năm | Kỷ Tỵ |
| Âm dương/giới tính | Âm nam |
| Cung Mệnh | Dậu |
| Cung Thân | Tỵ, trùng vị trí cung Tài Bạch |
| Ngũ hành cục | Kim tứ cục |

### 13.3. Các cung và chính tinh

| Cung | Địa chi | Chính tinh do engine trả về |
|---|---|---|
| Mệnh | Dậu | Thái Dương, Thiên Lương Hóa Khoa |
| Huynh Đệ | Thân | Vũ Khúc Hóa Lộc, Thiên Tướng |
| Phu Thê | Mùi | Thiên Đồng, Cự Môn |
| Tử Tức | Ngọ | Tham Lang Hóa Quyền |
| Tài Bạch | Tỵ | Thái Âm |
| Tật Ách | Thìn | Liêm Trinh, Thiên Phủ |
| Thiên Di | Mão | Vô chính diệu; ghi tham khảo Thái Dương, Thiên Lương ở đối cung |
| Nô Bộc | Dần | Phá Quân |
| Quan Lộc | Sửu | Vô chính diệu; ghi tham khảo Thiên Đồng, Cự Môn ở đối cung |
| Điền Trạch | Tý | Tử Vi |
| Phúc Đức | Hợi | Thiên Cơ |
| Phụ Mẫu | Tuất | Thất Sát |

Bảng chỉ liệt kê chính tinh nên không thể hiện mọi phụ tinh hoặc đủ cả bốn Hóa. Ví dụ năm Kỷ còn có Văn Khúc Hóa Kỵ, cần xem toàn bộ danh sách sao để xác định vị trí.

### 13.4. Tập đọc cấu trúc trước khi viết lời luận

1. Mệnh ở Dậu, nên tam phương tứ chính nằm ở Dậu – Sửu – Tỵ – Mão: tương ứng Mệnh – Quan Lộc – Tài Bạch – Thiên Di.
2. Nhận biết bộ sao trực tiếp của bốn cung này. Không tự chuyển sao “mượn” thành sao đóng thật.
3. Can năm là Kỷ, nên theo bảng Tứ Hóa: Vũ Khúc Lộc, Tham Lang Quyền, Thiên Lương Khoa, Văn Khúc Kỵ.
4. Mệnh có Thiên Lương Hóa Khoa nhưng chưa đủ để gọi Dương Lương Xương Lộc: vẫn phải kiểm tra Văn Xương và Lộc Tồn có nằm đúng vùng xét không.
5. Thân ở Tỵ là vị trí đánh dấu trên cung Tài Bạch; đó không phải thêm một cung nữa.
6. Sau khi ghi cấu trúc mới đọc các mô tả sao và cách cục. Không suy ra nghề nghiệp, tài sản hay hôn nhân chỉ từ bảng chính tinh.

Đại hạn hiện tại và tuổi hiện tại phụ thuộc ngày chạy chương trình. Tài liệu không đóng đinh chúng thành thuộc tính bất biến của ví dụ.

## 14. Quy trình tự học và bài tập

### 14.1. Gợi ý bảy buổi học

| Buổi | Nội dung | Sản phẩm tự ghi lại |
|---|---|---|
| 1 | Can Chi, 12 cung, Mệnh và Thân | Một trang thuật ngữ; phân biệt vị trí và chức năng cung |
| 2 | 14 chính tinh | Mỗi sao ba từ khóa và một mặt cần xét thêm |
| 3 | Phụ/Bật, Xương/Khúc, Khôi/Việt, sát tinh | Bảng các nhóm sao mà code thật sự dùng |
| 4 | Tam phương tứ chính, giáp cung, vô chính diệu | Vẽ bốn vị trí xét từ một cung bất kỳ |
| 5 | Tứ Hóa theo Can | Tự tra năm Kỷ, Giáp và Quý |
| 6 | Ba cách cục | Viết lại điều kiện bắt buộc, điểm cộng, giảm lực |
| 7 | Ví dụ thực tế và đối chiếu nguồn | Một bản ghi cấu trúc lá số có dẫn nguồn, chưa vội viết lời đoán |

### 14.2. Bài tập tự kiểm tra

**Bài 1.** `hour: 7` là giờ nào? Có phải 07:00 không?

**Bài 2.** Nếu Mệnh ở Dậu (`9`), các địa chi tam phương tứ chính là gì?

**Bài 3.** Một cung không có chính tinh nhưng có Văn Xương và Lộc Tồn có được đánh dấu vô chính diệu không?

**Bài 4.** Mệnh có Tử Vi, cả Tả Phụ và Hữu Bật nằm ngoài tam phương tứ chính của Mệnh. Hàm Quân thần khánh hội có nhận diện không?

**Bài 5.** Trong vùng xét có một sao Hóa Lộc nhưng không có Lộc Tồn. Có đủ điều kiện Song Lộc triều viên không?

**Bài 6.** Có Thái Dương, Thiên Lương, Văn Xương và một sao Hóa Lộc, nhưng không có Lộc Tồn. Hàm Dương Lương Xương Lộc có đủ điều kiện không?

**Bài 7.** Sao có `brightnessRaw: '得'` có được `mapBrightness()` trả về `bright` không?

**Bài 8.** Sinh đầu tháng 1 dương lịch, có thể lấy Can của năm dương lịch để gắn thẳng Tứ Hóa bản mệnh không?

**Bài 9.** Vì helper có chức năng tính phương trình thời gian, có thể kết luận mọi biểu mẫu đều dùng chức năng ấy không?

### 14.3. Đáp án và giải thích

1. **Giờ Mùi**, chỉ số 7. Không phải 07:00.
2. Dậu (`9`), Sửu (`1`), Tỵ (`5`), Mão (`3`).
3. **Có.** `isEmpty` chỉ xét có sao loại `major` hay không.
4. **Không.** Cả Phụ và Bật phải có trong vùng xét của Mệnh.
5. **Không.** Cần cả Lộc Tồn và một sao Hóa Lộc.
6. **Không.** Điều kiện bắt buộc của hàm nêu đúng tên Lộc Tồn.
7. **Không.** Đắc được gộp vào `normal` trong cách ánh xạ hiện tại.
8. **Không tự lấy thẳng.** Phải xác định Can năm theo quy ước lịch âm của engine.
9. **Không.** Phải xem hàm nào thực sự được biểu mẫu gọi.

### 14.4. Mẫu ghi chép một lá số

```text
Dữ liệu sinh và quy ước ngày giờ:
Năm âm lịch / Can Chi:
Vị trí Mệnh / Thân / ngũ hành cục:
Chính tinh đóng Mệnh:
Chính tinh ở Tài – Quan – Di:
Cung vô chính diệu và chính tinh đối cung:
Tứ Hóa bản mệnh:
Phụ/Bật – Xương/Khúc – Khôi/Việt:
Nhóm sát tinh đang được xét:
Cách cục: bắt buộc / điểm cộng / giảm lực:
Lớp thời gian đang xem:
Tệp hoặc đoạn trích làm căn cứ:
Điểm còn chưa chắc hoặc mâu thuẫn trong nguồn:
```

## 15. Những điểm trong nguồn cần đối chiếu

Đây là những khác biệt có thể quan sát ngay trong repo, không phải kết luận rằng một trường phái Tử Vi nào đúng hay sai.

| Điều gặp trong nguồn | Điều cần phân biệt khi học |
|---|---|
| Đoạn `gsf-2-4` nói “Tử Vi Hóa Kỵ”; `gsf-3-3` nói “Thất Sát gặp Hóa Lộc/Hóa Kỵ” | Tử Vi Hóa Kỵ không có trong bảng. Thất Sát cũng không tự nhận Tứ Hóa theo bảng; chữ “gặp” có thể nói tới sao khác mang Hóa, nhưng đoạn văn không giải thích rõ. Không tự thêm phép Hóa cho Thất Sát |
| Đoạn `qj-3-4` trong Toàn Tập gắn Cự Môn/Thái Dương tại Sửu/Mùi với tên cách cục Nhật Nguyệt phản bối | Cần đối chiếu lại cấu trúc sao; hàm Nhật Nguyệt đồng cung kiểm tra Thái Dương + Thái Âm ở Sửu/Mùi |
| Mô tả chi tiết Tử Vi nói vị trí Thìn/Tuất và ghép hình tượng với Thiên Phủ | Không dùng câu mô tả ấy thay cho điều kiện Tử Phủ đồng cung; đối chiếu vị trí hai sao do engine tính |
| Comment hoặc kiểu dữ liệu còn nhắc cung Can tự Hóa là “cốt lõi” | `generateChart()` hiện không tạo dữ liệu tự Hóa; helper và trường kiểu có thể còn tồn tại từ thiết kế khác |
| Comment nói Tứ Hóa luôn cố định | Bản mệnh và các lớp phủ vận hạn là hai tầng; giao diện vẫn có lớp phủ Tứ Hóa đại hạn/lưu niên |
| Comment cũ ghi tháng nhuận mặc định là `prev-month` | Đường gọi `generateChart()` hiện dùng `DEFAULT_LEAP_MONTH = 'split'` |
| Comment gọi độ sáng là bảy bậc | Danh sách giá trị hiện chấp nhận thêm Nhàn và Địa |
| Có nguồn trích là tên sách hoặc nhãn “lá số chuẩn” | Nhãn đó cho biết cách tác giả mô tả xuất xứ; chưa đủ để tự kiểm chứng toàn bộ quá trình biên soạn |

Một nguyên tắc học hữu ích: **khi câu mô tả, comment và thân hàm khác nhau, ghi riêng cả ba lớp**. Muốn biết chương trình chạy thế nào thì ưu tiên thân hàm; muốn kiểm chứng lời của Nghê Hải Hạ thì quay về đoạn trích và video; muốn xác minh cổ thư thì cần bản văn gốc tương ứng.

Nguồn để đối chiếu: [Cốt Tủy Phú tuyển chọn](../lib/classics/data/gusuifu.ts), [Toàn Tập tuyển chọn](../lib/classics/data/quanji.ts), [mô tả sao](../components/StarDetailPanel.tsx), [bảng Tứ Hóa](../lib/ziwei/constants.ts), [thuật toán](../lib/ziwei/algorithm.ts).

## 16. Bản đồ tệp nguồn và thuật ngữ

### 16.1. Đọc tệp nào cho mục đích nào?

| Muốn học | Nơi nên đọc |
|---|---|
| Tên cung, Can Chi, giờ địa chi, bảng Tứ Hóa | [`lib/ziwei/constants.ts`](../lib/ziwei/constants.ts) |
| Lá số được biểu diễn ra sao | [`lib/ziwei/types.ts`](../lib/ziwei/types.ts) |
| Luồng lập lá số và điều chỉnh sao | [`lib/ziwei/algorithm.ts`](../lib/ziwei/algorithm.ts) |
| Điều kiện cụ thể của cách cục | [`lib/ziwei/patterns.ts`](../lib/ziwei/patterns.ts) |
| Tứ Hóa các lớp thời gian | [`lib/ziwei/sihua.ts`](../lib/ziwei/sihua.ts) |
| Tháng nhuận và lựa chọn trường phái | [`lib/ziwei/school-config.ts`](../lib/ziwei/school-config.ts) |
| Độ sáng và các bảng tra | [`lib/ziwei/school-data.ts`](../lib/ziwei/school-data.ts) |
| Hiệu chỉnh giờ và ngày lập lá số | [`lib/ziwei/share.ts`](../lib/ziwei/share.ts), [`true-solar-time.ts`](../lib/ziwei/true-solar-time.ts) |
| Mô tả sao do tác giả tổng hợp | [`components/StarDetailPanel.tsx`](../components/StarDetailPanel.tsx) |
| Các đoạn cổ thư tuyển chọn | [`lib/classics/data`](../lib/classics/data/) |
| Trích dẫn Thiên Kỷ có thời điểm video | [`docs/tianji-ziwei`](./tianji-ziwei/README.md) |
| Kết quả hồi quy mà tác giả dùng để kiểm tra code | [`scripts/regression`](../scripts/regression/) |

### 16.2. Bảng thuật ngữ đọc nguồn tiếng Trung

| Chữ Hán | Tiếng Việt |
|---|---|
| 紫微斗数 | Tử Vi Đẩu Số |
| 排盘 / 起盘 | Lập lá số |
| 命盘 | Lá số |
| 安星 | An sao |
| 主星 | Chính tinh |
| 辅星 | Phụ tinh |
| 吉星 / 煞星 | Cát tinh / sát tinh |
| 同宫 | Đồng cung |
| 对宫 | Đối cung |
| 三合 | Tam hợp |
| 三方四正 | Tam phương tứ chính |
| 会照 | Hội chiếu |
| 夹命 | Giáp Mệnh |
| 空宫 | Cung vô chính diệu trong cách dùng của engine |
| 借星 | Mượn sao |
| 四化 | Tứ Hóa |
| 格局 | Cách cục |
| 破格 | Phá cách / điều kiện làm giảm lực |
| 大限 / 流年 | Đại hạn / lưu niên |
| 闰月 | Tháng nhuận |
| 晚子时 | Giờ Tý muộn |
| 真太阳时 | Giờ Mặt Trời thực; cần phân biệt cách tính cụ thể của từng hàm |
| 虚岁 | Tuổi mụ / tuổi danh nghĩa theo hệ lịch đang dùng |
| 天纪 | Thiên Kỷ |

## 17. Trích dịch Thiên Kỷ có nguồn đối chiếu


Nguồn của cả năm mục: [`entries.jsonl`](./tianji-ziwei/entries.jsonl), nhập từ `Renhuai123/nihai-tianji-corpus`, commit `462faa4` theo README của repo. “Dòng” bên dưới là thứ tự bản ghi tính từ 1 trong tệp JSONL hiện tại. Bản Việt là dịch từ bản chép trong repo, chưa đối chiếu độc lập với âm thanh video.

### 17.1. Mệnh là tiên thiên — dòng 38, phần video 3, 00:12:09

> 我们在看命宫的时候，命宫讲的是就是你本人你自己，讲的你的先天。什么叫做先天，生下来你是什么咖，讲的是先天。

**Dịch:** Khi xem cung Mệnh, điều nói đến là chính bản thân bạn, là phần tiên thiên của bạn. Tiên thiên nghĩa là khi sinh ra bạn vốn là người như thế nào.

[Đối chiếu video tại 00:12:09](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=729).

### 17.2. Xem Mệnh phải đồng thời xét Tài, Quan, Di — dòng 41, phần video 3, 00:12:58

> 我们看命宫的时候一定要同时兼看另外三个宫。一个叫做财帛，一个叫做官禄，一个叫做迁移。看命宫的时候一定兼看这三个宫。

**Dịch:** Khi xem cung Mệnh, nhất định phải đồng thời xét thêm ba cung: Tài Bạch, Quan Lộc và Thiên Di. Xem Mệnh phải xét kèm cả ba cung này.

[Đối chiếu video tại 00:12:58](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=778). Bản ghi có chú thích đính chính chữ “命官” thành “命宫”.

### 17.3. Giới hạn mà chính người giảng nêu về lục thân — dòng 73, phần video 3, 00:25:03

> 兄弟和父母，这就是所谓的六亲。那六亲对斗数来说，它批六亲的时候并不是很准。

**Dịch:** Anh chị em và cha mẹ thuộc phần gọi là lục thân. Đối với Đẩu Số, khi luận về lục thân thì không phải lúc nào cũng thật chuẩn xác.

[Đối chiếu video tại 00:25:03](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=1503).

### 17.4. Quan điểm sao cố định, lưu niên di chuyển — dòng 188, phần video 5, 00:01:31

> 我们每年的时候是流年在动，其实那些星都不动，流年在动而已。

**Dịch:** Qua mỗi năm, phần di chuyển là lưu niên. Thực ra các sao ấy không di chuyển; chỉ lưu niên di chuyển mà thôi.

[Đối chiếu video tại 00:01:31](https://www.bilibili.com/video/BV1KJsLekEfA?p=5&t=91). Đây là quan điểm được phần lời giảng nêu; cần phân biệt với những helper hoặc lớp hiển thị Tứ Hóa vận hạn vẫn còn trong code.

### 17.5. Thân cung nói về hậu thiên — dòng 487, phần video 9, 00:12:22

> 看看到上面有一个叫做身宫看到没有，原来我就很想跟诸位介绍身宫，可是我就觉得说，批的时候再跟诸位介绍比较好，我们这个身宫啊，身宫的定义是什么，我们简单讲就是后天，什么叫后天

**Dịch:** Các bạn nhìn phía trên sẽ thấy một chỗ gọi là Thân cung. Tôi vốn muốn giới thiệu từ trước, nhưng nghĩ nên giới thiệu khi luận lá số thì tốt hơn. Thân cung được định nghĩa thế nào? Nói đơn giản, đó là phần hậu thiên. Hậu thiên là gì…

[Đối chiếu video tại 00:12:22](https://www.bilibili.com/video/BV1KJsLekEfA?p=9&t=742). Câu được cắt ở chỗ đang chuyển sang giải thích tiếp; không nên tự thêm phần kết vào dấu trích dẫn.

## 18. Xuất xứ, phạm vi và điều kiện sử dụng

### Phần có thể và chưa thể xác minh từ repo

Tài liệu này dịch và giải thích nội dung tác giả đã lưu trong repo. Các điều kiện thuật toán đã được đối chiếu với thân hàm; ví dụ lá số ở mục 13 đã được tạo bằng engine. Các đoạn Thiên Kỷ ở mục 17 đã được đối chiếu với bản ghi JSONL và giữ liên kết video để người đọc kiểm tra.

Việc đọc repo chưa xác minh độc lập mọi bản chép bài giảng với âm thanh, mọi trích dẫn cổ thư với ấn bản gốc, hoặc khả năng nghiệm lý của các câu luận. Các đoạn mang tên cổ thư trong `lib/classics/data` tự ghi là tuyển chọn; trường `wordCount` không chứng minh checkout chứa trọn tác phẩm.

Phần luận đoán chi tiết trong `STAR_DB` đang để trống. Tập dữ liệu luận giải mà README giới thiệu nằm ở Releases và là kết quả được sinh bằng engine cùng kho luận riêng. Tài liệu này không tải tập dữ liệu ấy và không nhận mình đã khôi phục kho luật chưa công khai.

### Ghi công và giấy phép của phần trích dịch

- **Code và phần tài liệu theo code:** dự án ghi giấy phép MIT, bản quyền © 2026 紫微研究; xem [LICENSE](../LICENSE).
- **Phần trích bài giảng Thiên Kỷ:** tác giả bài giảng là Nghê Hải Hạ. Các trích dẫn được kho [Renhuai123/nihai-tianji-corpus](https://github.com/Renhuai123/nihai-tianji-corpus) cấu trúc hóa và được repo này nhập lại; README ghi mốc `462faa4`.
- **Các trích dẫn và bản dịch phái sinh ở mục 17:** theo **CC BY-NC-SA 4.0** — ghi công, sử dụng phi thương mại, chia sẻ cùng điều kiện. Xem [giấy phép của thư mục Thiên Kỷ](./tianji-ziwei/LICENSE.md) và [toàn văn giấy phép](https://creativecommons.org/licenses/by-nc-sa/4.0/). Phần này không tự động nhận MIT của code hay CC BY 4.0 của tập dữ liệu.
- **Bản tiếng Việt trong tài liệu này:** được dịch và biên soạn để học từ bản nguồn trong repo; các đoạn không được đánh dấu trích nguyên văn là phần dịch ý/chú giải, không nên gán ngược thành nguyên văn của Nghê Hải Hạ hoặc cổ thư.

Khi ghi chép tiếp, hãy giữ ba thứ bên cạnh mỗi nhận định: **nguyên tắc đang theo, nguồn cụ thể và điều kiện áp dụng**.
