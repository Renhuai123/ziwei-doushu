/**
 * Nội dung pháp lý — bản địa hoá cho Việt Nam.
 *
 * Khác với bản gốc (viết cho thị trường Trung Quốc), nội dung dưới đây viện dẫn
 * pháp luật Việt Nam:
 *  - Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực 01/01/2026)
 *  - Nghị định 356/2025/NĐ-CP hướng dẫn Luật Bảo vệ dữ liệu cá nhân
 *  - Luật Bảo vệ quyền lợi người tiêu dùng
 *  - Luật Sở hữu trí tuệ
 *  - Bộ luật Hình sự (Điều 320 — tội hành nghề mê tín, dị đoan)
 *
 * Nguyên tắc: nội dung luận giải chỉ mang tính tham khảo, nền tảng không tổ chức
 * hoạt động mê tín dị đoan và không khuyến khích người dùng dùng nội dung để
 * trục lợi bất chính.
 */

import type { Locale } from './config';

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'note'; text: string };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const UPDATED_VI = 'Cập nhật lần cuối: 07/11/2026';

/* ────────────────────────────── Tiếng Việt ────────────────────────────── */

const TERMS_VI: LegalDocument = {
  title: 'Điều khoản sử dụng',
  updated: UPDATED_VI,
  intro:
    'Điều khoản này điều chỉnh việc bạn truy cập và sử dụng website Tử Vi Đẩu Số (sau đây gọi là “Nền tảng”). Khi sử dụng Nền tảng, bạn xác nhận đã đọc, hiểu và đồng ý với các nội dung dưới đây.',
  sections: [
    {
      heading: '1. Phạm vi dịch vụ',
      blocks: [
        {
          kind: 'p',
          text: 'Nền tảng cung cấp công cụ lập lá số Tử Vi Đẩu Số, nội dung tham khảo về hệ thống sao – cung vị – tứ hóa – đại hạn/lưu niên, và kho cổ tịch đã hết thời hạn bảo hộ quyền tác giả.',
        },
        {
          kind: 'p',
          text: 'Toàn bộ nội dung chỉ nhằm mục đích tham khảo, học tập và giải trí lành mạnh. Nền tảng không cung cấp dịch vụ y tế, đầu tư, pháp lý hay tâm lý; không đưa ra lời khuyên thay đổi vận mệnh và không tổ chức hoạt động mê tín dị đoan.',
        },
        {
          kind: 'note',
          text: 'Người dùng không được sử dụng nội dung của Nền tảng để hành nghề mê tín, dị đoan hoặc trục lợi bất chính — hành vi có thể bị xử lý theo Điều 320 Bộ luật Hình sự và các quy định về xử phạt vi phạm hành chính.',
        },
      ],
    },
    {
      heading: '2. Điều kiện sử dụng',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Bạn đủ 16 tuổi, hoặc sử dụng dưới sự đồng ý và giám sát của cha, mẹ hay người giám hộ.',
            'Thông tin ngày, giờ và nơi sinh bạn nhập là chính xác; sai lệch thông tin sẽ dẫn tới lá số không đúng và Nền tảng không chịu trách nhiệm cho hệ quả đó.',
            'Bạn tự bảo quản thiết bị, tài khoản và thông tin đăng nhập của mình.',
            'Bạn tự chịu trách nhiệm với các quyết định của bản thân; nội dung luận giải không phải là chỉ dẫn bắt buộc.',
          ],
        },
      ],
    },
    {
      heading: '3. Hành vi bị cấm',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Sử dụng Nền tảng cho mục đích trái pháp luật, lừa đảo, xâm phạm quyền và lợi ích hợp pháp của người khác.',
            'Dùng nội dung luận giải để trục lợi bất chính, gây hoang mang, ép buộc người khác làm theo.',
            'Thu thập dữ liệu tự động (crawler, bot, gọi API hàng loạt) hoặc gây quá tải hệ thống.',
            'Sao chép, bán lại, phân phối lại nội dung, giao diện hoặc mã nguồn của Nền tảng.',
            'Dùng dữ liệu, nội dung của Nền tảng để huấn luyện mô hình trí tuệ nhân tạo.',
            'Dịch ngược, can thiệp kỹ thuật, thử nghiệm xâm nhập khi chưa được phép bằng văn bản.',
            'Xử lý dữ liệu cá nhân của người khác mà không có sự đồng ý của họ.',
          ],
        },
      ],
    },
    {
      heading: '4. Quyền sở hữu trí tuệ',
      blocks: [
        {
          kind: 'p',
          text: 'Giao diện, mã nguồn, bản dịch, phần biên soạn và cấu trúc cơ sở dữ liệu của Nền tảng thuộc quyền của đơn vị vận hành và được bảo hộ theo Luật Sở hữu trí tuệ.',
        },
        {
          kind: 'p',
          text: 'Văn bản cổ tịch (Cốt Tủy Phú, Tử Vi Đẩu Số Toàn Tập, Tử Vi Đẩu Số Toàn Thư) là tác phẩm đã hết thời hạn bảo hộ, được cung cấp nguyên văn cho mục đích học tập.',
        },
        {
          kind: 'p',
          text: 'Khi phát hiện hành vi xâm phạm, đơn vị vận hành có quyền yêu cầu chấm dứt hành vi, gỡ bỏ nội dung và bồi thường thiệt hại theo quy định pháp luật.',
        },
      ],
    },
    {
      heading: '5. Dịch vụ trả phí và thanh toán',
      blocks: [
        {
          kind: 'p',
          text: 'Một số tính năng có thể thu phí. Giá được niêm yết bằng đồng Việt Nam (VND) và thanh toán qua cổng thanh toán hoạt động hợp pháp tại Việt Nam. Nền tảng không lưu trữ số thẻ hay mật khẩu thanh toán của bạn.',
        },
        {
          kind: 'p',
          text: 'Quyền và nghĩa vụ của người tiêu dùng được thực hiện theo Luật Bảo vệ quyền lợi người tiêu dùng. Chính sách hoàn tiền (nếu có) được công bố tại thời điểm bạn mua dịch vụ.',
        },
      ],
    },
    {
      heading: '6. Miễn trừ trách nhiệm',
      blocks: [
        {
          kind: 'p',
          text: 'Nội dung luận giải dựa trên tri thức cổ tịch và hệ thống lý thuyết truyền thống, không bảo đảm tính chính xác tuyệt đối và không thay thế ý kiến của chuyên gia trong bất kỳ lĩnh vực nào.',
        },
        {
          kind: 'p',
          text: 'Trong phạm vi pháp luật cho phép, đơn vị vận hành không chịu trách nhiệm với thiệt hại gián tiếp, mất lợi nhuận hoặc thiệt hại phát sinh từ quyết định của người dùng. Trách nhiệm (nếu có) không vượt quá số tiền bạn đã thanh toán cho dịch vụ trong 12 tháng gần nhất.',
        },
        {
          kind: 'note',
          text: 'Không nội dung nào trên Nền tảng thay thế chẩn đoán y khoa, tư vấn pháp lý hoặc quyết định đầu tư của người có chuyên môn.',
        },
      ],
    },
    {
      heading: '7. Thay đổi và tạm ngừng dịch vụ',
      blocks: [
        {
          kind: 'p',
          text: 'Chúng tôi có thể cập nhật, tạm ngừng hoặc chấm dứt một phần hay toàn bộ dịch vụ. Thay đổi quan trọng sẽ được thông báo trên Nền tảng hoặc qua email trước khi áp dụng, trừ trường hợp bất khả kháng hoặc theo yêu cầu của cơ quan có thẩm quyền.',
        },
      ],
    },
    {
      heading: '8. Luật áp dụng và giải quyết tranh chấp',
      blocks: [
        {
          kind: 'p',
          text: 'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết thông qua thương lượng trong thời hạn 30 ngày kể từ khi một bên thông báo.',
        },
        {
          kind: 'p',
          text: 'Nếu không đạt được thỏa thuận, một bên có thể yêu cầu Tòa án nhân dân có thẩm quyền tại Việt Nam giải quyết. Đối với người tiêu dùng, Tòa án nơi người tiêu dùng cư trú cũng có thẩm quyền theo quy định pháp luật.',
        },
      ],
    },
    {
      heading: '9. Liên hệ',
      blocks: [
        {
          kind: 'p',
          text: 'Mọi câu hỏi, góp ý hoặc khiếu nại vui lòng gửi tới địa chỉ email hỗ trợ được công bố trên Nền tảng. Chúng tôi tiếp nhận và phản hồi trong thời hạn pháp luật quy định.',
        },
      ],
    },
  ],
};

const PRIVACY_VI: LegalDocument = {
  title: 'Chính sách quyền riêng tư',
  updated: UPDATED_VI,
  intro:
    'Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của bạn, phù hợp với Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026), Nghị định 356/2025/NĐ-CP và pháp luật Việt Nam có liên quan.',
  sections: [
    {
      heading: '1. Dữ liệu cá nhân chúng tôi xử lý',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Dữ liệu bạn chủ động cung cấp: họ tên (không bắt buộc), ngày – giờ sinh, giới tính, nơi sinh (dùng để quy đổi giờ thật theo kinh độ và múi giờ Việt Nam).',
            'Dữ liệu liên hệ (nếu bạn tạo tài khoản hoặc đăng ký nhận tin): email, số điện thoại.',
            'Dữ liệu kỹ thuật: địa chỉ IP, loại thiết bị và trình duyệt, thời điểm truy cập, mã định danh phiên.',
            'Dữ liệu tương tác: lá số đã lập, lịch sử xem, đánh giá và câu hỏi bạn gửi.',
          ],
        },
        {
          kind: 'note',
          text: 'Nền tảng không thu thập dữ liệu cá nhân nhạy cảm (quan điểm chính trị, tín ngưỡng – tôn giáo, dữ liệu sức khỏe, sinh trắc học, thông tin tài khoản ngân hàng). Mục “sức khỏe” trong lá số là nội dung tham khảo, không phải dữ liệu sức khỏe của bạn.',
        },
      ],
    },
    {
      heading: '2. Mục đích và căn cứ xử lý',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Lập lá số và hiển thị kết quả theo yêu cầu của bạn.',
            'Lưu lịch sử để bạn tra cứu lại — trên cơ sở sự đồng ý của bạn.',
            'Phân tích tổng hợp, đã ẩn danh, nhằm cải thiện chất lượng nội dung.',
            'Bảo đảm an toàn thông tin, phòng chống gian lận và xử lý sự cố.',
            'Thông báo cho bạn khi chính sách hoặc dịch vụ có thay đổi quan trọng.',
          ],
        },
      ],
    },
    {
      heading: '3. Thời gian lưu trữ',
      blocks: [
        {
          kind: 'p',
          text: 'Dữ liệu lá số được lưu tối đa 24 tháng kể từ lần truy cập cuối cùng, hoặc ngắn hơn nếu bạn yêu cầu xóa. Dữ liệu kỹ thuật phục vụ an ninh được lưu tối đa 12 tháng. Hết thời hạn, dữ liệu được xóa hoặc ẩn danh hóa.',
        },
      ],
    },
    {
      heading: '4. Chia sẻ dữ liệu và chuyển dữ liệu ra nước ngoài',
      blocks: [
        {
          kind: 'p',
          text: 'Chúng tôi chỉ chia sẻ dữ liệu ở mức tối thiểu cần thiết với các bên sau:',
        },
        {
          kind: 'ul',
          items: [
            'Nhà cung cấp hạ tầng lưu trữ và mạng phân phối nội dung.',
            'Cổng thanh toán hoạt động hợp pháp tại Việt Nam, khi bạn mua dịch vụ.',
            'Nhà cung cấp mô hình trí tuệ nhân tạo, để xử lý câu hỏi tự do của bạn.',
            'Cơ quan nhà nước có thẩm quyền, khi có yêu cầu hợp pháp bằng văn bản.',
          ],
        },
        {
          kind: 'p',
          text: 'Một số nhà cung cấp có máy chủ đặt ngoài lãnh thổ Việt Nam. Khi chuyển dữ liệu cá nhân ra nước ngoài, chúng tôi thực hiện đánh giá tác động và lập hồ sơ theo Luật Bảo vệ dữ liệu cá nhân cùng văn bản hướng dẫn thi hành.',
        },
        { kind: 'note', text: 'Chúng tôi không bán dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào.' },
      ],
    },
    {
      heading: '5. Bảo mật thông tin',
      blocks: [
        {
          kind: 'p',
          text: 'Dữ liệu được truyền qua HTTPS, lưu trữ có mã hóa; quyền truy cập nội bộ được giới hạn theo vai trò và ghi nhật ký truy cập.',
        },
        {
          kind: 'p',
          text: 'Khi xảy ra sự cố lộ hoặc mất dữ liệu, chúng tôi thông báo cho cơ quan có thẩm quyền và người bị ảnh hưởng trong thời hạn luật định, đồng thời áp dụng biện pháp khắc phục cần thiết.',
        },
      ],
    },
    {
      heading: '6. Quyền của bạn',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Được biết về hoạt động xử lý dữ liệu cá nhân của mình.',
            'Đồng ý hoặc rút lại sự đồng ý bất kỳ lúc nào.',
            'Truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu.',
            'Hạn chế hoặc phản đối việc xử lý dữ liệu.',
            'Yêu cầu cung cấp dữ liệu, khiếu nại và yêu cầu bồi thường thiệt hại.',
          ],
        },
        {
          kind: 'p',
          text: 'Bạn gửi yêu cầu tới địa chỉ email hỗ trợ được công bố trên Nền tảng; chúng tôi xác minh danh tính và phản hồi trong thời hạn pháp luật quy định. Bạn cũng có quyền khiếu nại tới cơ quan quản lý về bảo vệ dữ liệu cá nhân (Bộ Công an).',
        },
      ],
    },
    {
      heading: '7. Cookie và bộ nhớ cục bộ',
      blocks: [
        {
          kind: 'p',
          text: 'Nền tảng dùng cookie và localStorage để ghi nhớ ngôn ngữ, giao diện sáng/tối và các lá số gần đây. Dữ liệu này nằm trên thiết bị của bạn và có thể xóa bất cứ lúc nào trong cài đặt trình duyệt; một số tính năng có thể bị ảnh hưởng khi bạn xóa.',
        },
      ],
    },
    {
      heading: '8. Người chưa thành niên',
      blocks: [
        {
          kind: 'p',
          text: 'Nền tảng dành cho người từ đủ 16 tuổi. Người dưới 16 tuổi chỉ được sử dụng khi có sự đồng ý của cha, mẹ hoặc người giám hộ, và không dùng nội dung luận giải cho các quyết định quan trọng trong cuộc sống.',
        },
      ],
    },
    {
      heading: '9. Thay đổi chính sách',
      blocks: [
        {
          kind: 'p',
          text: 'Chính sách có thể được cập nhật để phù hợp với pháp luật và hoạt động thực tế. Thay đổi quan trọng sẽ được thông báo trên Nền tảng trước ngày có hiệu lực. Việc tiếp tục sử dụng sau ngày đó nghĩa là bạn chấp nhận bản cập nhật.',
        },
      ],
    },
  ],
};

/* ─────────────────────────────── English ─────────────────────────────── */

const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  updated: 'Last updated: 07/11/2026',
  intro:
    'These terms govern your access to and use of the Zi Wei Dou Shu website (the “Platform”). By using the Platform you confirm that you have read and agree to the terms below.',
  sections: [
    {
      heading: '1. Scope of the service',
      blocks: [
        {
          kind: 'p',
          text: 'The Platform provides a Zi Wei Dou Shu chart generator, reference material on stars, palaces, the four transformations and decade/annual cycles, plus a library of public-domain classical texts.',
        },
        {
          kind: 'p',
          text: 'All content is provided for reference, study and entertainment only. The Platform does not provide medical, investment, legal or psychological services, does not promise to change your destiny, and does not organise superstitious practices.',
        },
        {
          kind: 'note',
          text: 'You may not use the content to practise superstition for profit; such conduct may be sanctioned under Article 320 of the Vietnamese Penal Code and related administrative regulations.',
        },
      ],
    },
    {
      heading: '2. Conditions of use',
      blocks: [
        {
          kind: 'ul',
          items: [
            'You are at least 16 years old, or use the Platform with the consent and supervision of a parent or guardian.',
            'The birth date, time and place you enter are accurate; inaccurate input produces an incorrect chart and the Platform is not responsible for that outcome.',
            'You keep your device, account and credentials secure.',
            'You remain responsible for your own decisions; readings are not binding instructions.',
          ],
        },
      ],
    },
    {
      heading: '3. Prohibited conduct',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Using the Platform for unlawful purposes, fraud, or to infringe the rights of others.',
            'Using readings to extract illicit profit or to coerce or frighten other people.',
            'Automated data collection (crawlers, bots, bulk API calls) or any action that overloads the service.',
            'Copying, reselling or redistributing the content, interface or source code.',
            'Using Platform data or content to train artificial-intelligence models.',
            'Reverse engineering, technical interference, or unauthorised penetration testing.',
            'Processing another person’s personal data without their consent.',
          ],
        },
      ],
    },
    {
      heading: '4. Intellectual property',
      blocks: [
        {
          kind: 'p',
          text: 'The interface, source code, translations, editorial work and database structure belong to the operator and are protected under the Law on Intellectual Property of Vietnam.',
        },
        {
          kind: 'p',
          text: 'The classical texts (Gu Sui Fu, Zi Wei Dou Shu Quan Ji, Zi Wei Dou Shu Quan Shu) are works whose copyright has expired and are provided in the original language for study.',
        },
        {
          kind: 'p',
          text: 'Where infringement is detected, the operator may demand that it stop, request removal of the material and claim damages under applicable law.',
        },
      ],
    },
    {
      heading: '5. Paid features and payment',
      blocks: [
        {
          kind: 'p',
          text: 'Some features may be paid. Prices are listed in Vietnamese dong (VND) and charged through payment gateways licensed in Vietnam. The Platform does not store card numbers or payment passwords.',
        },
        {
          kind: 'p',
          text: 'Consumer rights and obligations follow the Law on Protection of Consumer Rights. Any refund policy is published at the time of purchase.',
        },
      ],
    },
    {
      heading: '6. Disclaimer',
      blocks: [
        {
          kind: 'p',
          text: 'Readings are based on classical sources and traditional theory. They are not guaranteed to be accurate and never replace advice from a qualified professional in any field.',
        },
        {
          kind: 'p',
          text: 'To the extent permitted by law, the operator is not liable for indirect loss, lost profit or harm arising from your decisions. Any liability is limited to the amount you paid for the service in the preceding 12 months.',
        },
        { kind: 'note', text: 'Nothing on the Platform replaces medical diagnosis, legal advice or a professional investment decision.' },
      ],
    },
    {
      heading: '7. Changes and suspension of the service',
      blocks: [
        {
          kind: 'p',
          text: 'We may update, suspend or discontinue part or all of the service. Material changes will be announced on the Platform or by email before they take effect, except in emergencies or where required by a competent authority.',
        },
      ],
    },
    {
      heading: '8. Governing law and disputes',
      blocks: [
        {
          kind: 'p',
          text: 'These terms are governed by the laws of Vietnam. Disputes should first be resolved through negotiation within 30 days of notice by either party.',
        },
        {
          kind: 'p',
          text: 'Failing agreement, either party may bring the matter before a competent People’s Court in Vietnam. For consumers, the court where the consumer resides also has jurisdiction under Vietnamese law.',
        },
      ],
    },
    {
      heading: '9. Contact',
      blocks: [
        {
          kind: 'p',
          text: 'Questions, feedback or complaints may be sent to the support email published on the Platform. We respond within the periods required by law.',
        },
      ],
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: 'Privacy Policy',
  updated: 'Last updated: 07/11/2026',
  intro:
    'This policy explains how we collect, use, store and protect your personal data in line with Vietnam’s Law on Personal Data Protection No. 91/2025/QH15 (in force from 01/01/2026), Decree 356/2025/ND-CP and related Vietnamese law.',
  sections: [
    {
      heading: '1. Personal data we process',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Data you provide: name (optional), date and time of birth, gender, place of birth (used to correct solar time for Vietnamese coordinates and time zone).',
            'Contact data, if you create an account or subscribe: email address and phone number.',
            'Technical data: IP address, device and browser type, access time, session identifier.',
            'Interaction data: charts generated, viewing history, ratings and questions you submit.',
          ],
        },
        {
          kind: 'note',
          text: 'We do not collect sensitive personal data (political views, religion, health data, biometrics, bank account details). The “health” section of a chart is reference content, not your health data.',
        },
      ],
    },
    {
      heading: '2. Purposes and legal bases',
      blocks: [
        {
          kind: 'ul',
          items: [
            'Generating charts and showing results at your request.',
            'Keeping history so you can revisit charts, based on your consent.',
            'Aggregated, anonymised analysis to improve content quality.',
            'Security, fraud prevention and incident handling.',
            'Informing you of material changes to the policy or service.',
          ],
        },
      ],
    },
    {
      heading: '3. Retention',
      blocks: [
        {
          kind: 'p',
          text: 'Chart data is kept for at most 24 months after your last visit, or less if you request deletion. Security logs are kept for at most 12 months. After that, data is deleted or anonymised.',
        },
      ],
    },
    {
      heading: '4. Sharing and cross-border transfer',
      blocks: [
        { kind: 'p', text: 'We share only the minimum data necessary with:' },
        {
          kind: 'ul',
          items: [
            'Hosting and content-delivery providers.',
            'Payment gateways licensed in Vietnam, when you buy a service.',
            'AI model providers that process your free-form questions.',
            'Competent authorities, upon a lawful written request.',
          ],
        },
        {
          kind: 'p',
          text: 'Some providers operate servers outside Vietnam. For cross-border transfers we carry out an impact assessment and maintain the required records under the Law on Personal Data Protection and its guiding decree.',
        },
        { kind: 'note', text: 'We never sell your personal data.' },
      ],
    },
    {
      heading: '5. Security',
      blocks: [
        {
          kind: 'p',
          text: 'Data is transmitted over HTTPS and stored encrypted; internal access is role-limited and logged.',
        },
        {
          kind: 'p',
          text: 'If data is breached or lost, we notify the competent authority and affected users within the statutory period and apply remedial measures.',
        },
      ],
    },
    {
      heading: '6. Your rights',
      blocks: [
        {
          kind: 'ul',
          items: [
            'To be informed about how your data is processed.',
            'To give or withdraw consent at any time.',
            'To access, rectify or request deletion of your data.',
            'To restrict or object to processing.',
            'To request a copy of your data, lodge a complaint and claim compensation.',
          ],
        },
        {
          kind: 'p',
          text: 'Send requests to the support email published on the Platform; we verify identity and respond within the statutory period. You may also complain to Vietnam’s data-protection authority (the Ministry of Public Security).',
        },
      ],
    },
    {
      heading: '7. Cookies and local storage',
      blocks: [
        {
          kind: 'p',
          text: 'We use cookies and localStorage to remember your language, light/dark theme and recent charts. This data stays on your device and can be cleared in your browser settings, though some features may then be affected.',
        },
      ],
    },
    {
      heading: '8. Minors',
      blocks: [
        {
          kind: 'p',
          text: 'The Platform is intended for users aged 16 and over. Users under 16 may use it only with the consent of a parent or guardian, and should not base important life decisions on readings.',
        },
      ],
    },
    {
      heading: '9. Changes to this policy',
      blocks: [
        {
          kind: 'p',
          text: 'We may update this policy to reflect changes in law or in our operations. Material changes are announced on the Platform before taking effect; continued use afterwards means you accept the updated version.',
        },
      ],
    },
  ],
};

/* ─────────────────────────────── 简体中文 ─────────────────────────────── */

const TERMS_ZH: LegalDocument = {
  title: '服务条款',
  updated: '最后更新：2026 年 11 月 7 日',
  intro:
    '本条款适用于您访问和使用紫微斗数网站（下称“本平台”）。使用本平台即表示您已阅读、理解并同意以下内容。',
  sections: [
    {
      heading: '1. 服务范围',
      blocks: [
        {
          kind: 'p',
          text: '本平台提供紫微斗数排盘工具、星曜—宫位—四化—大限流年的参考资料，以及已进入公有领域的古籍原文库。',
        },
        {
          kind: 'p',
          text: '所有内容仅供学习、参考与健康娱乐。本平台不提供医疗、投资、法律或心理咨询服务，不承诺改变命运，也不组织迷信活动。',
        },
        {
          kind: 'note',
          text: '用户不得利用本平台内容从事以营利为目的的迷信活动；此类行为可能依越南《刑法》第 320 条及相关行政处罚规定处理。',
        },
      ],
    },
    {
      heading: '2. 使用条件',
      blocks: [
        {
          kind: 'ul',
          items: [
            '您已满 16 周岁，或在父母、监护人同意与监督下使用。',
            '您填写的出生日期、时辰、地点真实准确；信息有误将导致命盘不准，本平台不对此承担责任。',
            '您应自行妥善保管设备、账号与登录信息。',
            '您对自己的决定负责，解读内容不构成强制指令。',
          ],
        },
      ],
    },
    {
      heading: '3. 禁止行为',
      blocks: [
        {
          kind: 'ul',
          items: [
            '将本平台用于违法目的、欺诈或侵害他人合法权益。',
            '利用解读内容牟取不正当利益，或以此恐吓、胁迫他人。',
            '使用爬虫、机器人、批量调用接口等方式自动采集数据，或造成系统过载。',
            '复制、转售、再分发本平台内容、界面或源代码。',
            '将本平台数据、内容用于训练人工智能模型。',
            '反向工程、技术干扰，或未经书面许可进行渗透测试。',
            '未经他人同意处理其个人数据。',
          ],
        },
      ],
    },
    {
      heading: '4. 知识产权',
      blocks: [
        {
          kind: 'p',
          text: '本平台的界面、源代码、译文、编纂内容与数据库结构归运营方所有，受越南《知识产权法》保护。',
        },
        {
          kind: 'p',
          text: '古籍原文（《骨髓赋》《紫微斗数全集》《紫微斗数全书》）著作权保护期已届满，以原文形式提供，仅供学习。',
        },
        {
          kind: 'p',
          text: '发现侵权行为时，运营方有权要求停止侵害、删除内容并依法主张损害赔偿。',
        },
      ],
    },
    {
      heading: '5. 付费功能与支付',
      blocks: [
        {
          kind: 'p',
          text: '部分功能可能收费。价格以越南盾（VND）标示，并通过在越南合法运营的支付网关结算。本平台不存储卡号或支付密码。',
        },
        {
          kind: 'p',
          text: '消费者的权利与义务依越南《消费者权益保护法》执行；退款政策（如有）在购买时公布。',
        },
      ],
    },
    {
      heading: '6. 免责声明',
      blocks: [
        {
          kind: 'p',
          text: '解读内容基于古籍与传统理论，不保证完全准确，也不能替代任何领域专业人士的意见。',
        },
        {
          kind: 'p',
          text: '在法律允许的范围内，运营方不对间接损失、利润损失或因用户决定产生的损害承担责任；如有责任，以您近 12 个月为该服务支付的金额为上限。',
        },
        { kind: 'note', text: '本平台任何内容均不能替代医学诊断、法律意见或专业人士的投资决策。' },
      ],
    },
    {
      heading: '7. 服务变更与中止',
      blocks: [
        {
          kind: 'p',
          text: '我们可能更新、暂停或终止部分或全部服务。重大变更将在生效前通过站内公告或邮件通知，不可抗力或主管机关要求的情形除外。',
        },
      ],
    },
    {
      heading: '8. 适用法律与争议解决',
      blocks: [
        {
          kind: 'p',
          text: '本条款适用越南法律。争议应先由双方在通知后 30 日内协商解决。',
        },
        {
          kind: 'p',
          text: '协商不成的，任何一方可向越南有管辖权的人民法院提起诉讼。对消费者而言，消费者住所地法院依法亦有管辖权。',
        },
      ],
    },
    {
      heading: '9. 联系方式',
      blocks: [
        {
          kind: 'p',
          text: '如有疑问、建议或投诉，请发送至本平台公布的支持邮箱。我们将在法律规定的期限内答复。',
        },
      ],
    },
  ],
};

const PRIVACY_ZH: LegalDocument = {
  title: '隐私政策',
  updated: '最后更新：2026 年 11 月 7 日',
  intro:
    '本政策说明我们如何收集、使用、存储与保护您的个人数据，符合越南《个人数据保护法》第 91/2025/QH15 号（2026 年 1 月 1 日生效）、第 356/2025/NĐ-CP 号议定及相关法律。',
  sections: [
    {
      heading: '1. 我们处理的个人数据',
      blocks: [
        {
          kind: 'ul',
          items: [
            '您主动提供的数据：姓名（选填）、出生日期与时辰、性别、出生地（用于按越南经度与时区换算真太阳时）。',
            '联系数据（注册账号或订阅时）：邮箱、手机号。',
            '技术数据：IP 地址、设备与浏览器类型、访问时间、会话标识。',
            '互动数据：已生成的命盘、浏览记录、评价与您提交的问题。',
          ],
        },
        {
          kind: 'note',
          text: '本平台不收集敏感个人数据（政治观点、宗教信仰、健康数据、生物识别信息、银行账户信息）。命盘中的“健康”栏目为参考资料，并非您的健康数据。',
        },
      ],
    },
    {
      heading: '2. 处理目的与依据',
      blocks: [
        {
          kind: 'ul',
          items: [
            '按您的请求排盘并展示结果。',
            '在您同意的基础上保存历史记录，便于再次查看。',
            '以匿名汇总方式分析，改进内容质量。',
            '保障信息安全、防范欺诈与处理事件。',
            '在政策或服务发生重大变化时通知您。',
          ],
        },
      ],
    },
    {
      heading: '3. 保存期限',
      blocks: [
        {
          kind: 'p',
          text: '命盘数据自最后一次访问起最多保存 24 个月，您要求删除时更短；安全日志最多保存 12 个月。期限届满后数据将被删除或匿名化。',
        },
      ],
    },
    {
      heading: '4. 数据共享与跨境传输',
      blocks: [
        { kind: 'p', text: '我们仅在必要范围内与以下各方共享数据：' },
        {
          kind: 'ul',
          items: [
            '存储与内容分发服务商。',
            '在越南合法运营的支付网关（购买服务时）。',
            '处理您自由提问的人工智能模型服务商。',
            '依合法书面要求行事的国家机关。',
          ],
        },
        {
          kind: 'p',
          text: '部分服务商的服务器位于越南境外。跨境传输个人数据时，我们依《个人数据保护法》及配套议定进行影响评估并建立相关档案。',
        },
        { kind: 'note', text: '我们不会向任何第三方出售您的个人数据。' },
      ],
    },
    {
      heading: '5. 信息安全',
      blocks: [
        {
          kind: 'p',
          text: '数据传输使用 HTTPS，存储加密；内部访问按角色限制并留存日志。',
        },
        {
          kind: 'p',
          text: '发生数据泄露或丢失时，我们在法定期限内通知主管机关与受影响用户，并采取补救措施。',
        },
      ],
    },
    {
      heading: '6. 您的权利',
      blocks: [
        {
          kind: 'ul',
          items: [
            '知悉个人数据处理情况。',
            '随时同意或撤回同意。',
            '访问、更正或要求删除数据。',
            '限制或反对数据处理。',
            '要求提供数据副本、提出投诉与索赔。',
          ],
        },
        {
          kind: 'p',
          text: '请将请求发送至本平台公布的支持邮箱，我们核实身份后在法定期限内答复。您也可向越南个人数据保护主管机关（公安部）投诉。',
        },
      ],
    },
    {
      heading: '7. Cookie 与本地存储',
      blocks: [
        {
          kind: 'p',
          text: '本平台使用 cookie 与 localStorage 记住语言、明暗主题与最近命盘。这些数据保存在您的设备上，可在浏览器设置中随时清除，清除后部分功能可能受影响。',
        },
      ],
    },
    {
      heading: '8. 未成年人',
      blocks: [
        {
          kind: 'p',
          text: '本平台面向 16 周岁及以上用户。未满 16 周岁者须经父母或监护人同意方可使用，且不应依据解读内容作出重大人生决定。',
        },
      ],
    },
    {
      heading: '9. 政策变更',
      blocks: [
        {
          kind: 'p',
          text: '我们可能根据法律与运营情况更新本政策。重大变更将在生效前于站内公告；生效后继续使用即视为接受更新版本。',
        },
      ],
    },
  ],
};

export const TERMS: Record<Locale, LegalDocument> = {
  vi: TERMS_VI,
  en: TERMS_EN,
  'zh-CN': TERMS_ZH,
};

export const PRIVACY: Record<Locale, LegalDocument> = {
  vi: PRIVACY_VI,
  en: PRIVACY_EN,
  'zh-CN': PRIVACY_ZH,
};
