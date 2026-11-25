import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: '服务条款 · 紫微命盘',
  description: '紫微命盘服务条款：命理内容仅供参考；代码、数据与古籍原文的开源授权说明。',
  alternates: { canonical: '/terms' },
};

const REPO = 'https://github.com/Renhuai123/ziwei-doushu';

export default function TermsPage() {
  return (
    <LegalPage
      title="服务条款"
      updated="2026年11月"
      other={{ href: '/privacy', label: '隐私政策' }}
      intro="紫微命盘是一个免费、开源的紫微斗数排盘与学习站点。使用本站即表示你同意以下条款。"
    >
      <h2>1. 服务内容</h2>
      <p>
        本站基于倪海厦《天纪》紫微斗数体系与《紫微斗数全集》《全书》《骨髓赋》等古籍，提供排盘、合盘、星曜知识、古籍检索与 AI 解读。
        所有命理内容仅供参考，<strong>不构成医疗、投资、法律、心理咨询或任何重大决定的建议</strong>。
      </p>

      <h2>2. 使用规范</h2>
      <ul>
        <li>请以合法目的使用本站；</li>
        <li>不要以高频请求、攻击等方式干扰站点运行，或滥用 AI 解读接口；</li>
        <li>解读依赖你填写的出生信息，信息有误会导致结果不准。</li>
      </ul>

      <h2>3. 开源与授权</h2>
      <p>本站源码与数据公开在 <a href={REPO}>GitHub</a>，按以下协议授权（以仓库中的协议文件为准）：</p>
      <ul>
        <li><strong>代码</strong>：MIT License，可自由使用、修改、商用，保留 LICENSE 即可；</li>
        <li><strong>数据集</strong>（Releases 中的样本数据集与解读数据集）：CC BY 4.0，可商用，需注明来源；</li>
        <li><strong>古籍原文</strong>：公有领域；</li>
        <li><strong>倪海厦老师原话</strong>：CC BY-NC-SA 4.0，可引用、转载并注明出处，<strong>不得商用</strong>，改编须沿用同一协议。</li>
      </ul>

      <h2>4. 免责声明</h2>
      <p>
        本站内容是传统紫微斗数与倪海厦体系的知识整理，<strong>不保证准确</strong>。AI 解读由第三方大模型生成，可能出错或前后不一。
        请理性看待，不要过度依赖任何单一命理判断。
      </p>
      <p>因使用本站内容产生的后果（包括决策失误、心理影响、关系变化等），由使用者自行承担。</p>

      <h2>5. 服务变更</h2>
      <p>本站可能随时调整、暂停或终止部分功能，条款变化会更新本页并修改顶部日期。</p>

      <h2>6. 法律适用</h2>
      <p>本条款适用中华人民共和国法律。发生争议时，双方应友好协商；协商不成的，提交本站运营者所在地有管辖权的人民法院诉讼解决。</p>

      <h2>7. 联系</h2>
      <p>问题、勘误或建议，请在 <a href={`${REPO}/issues`}>GitHub Issues</a> 提出。</p>
    </LegalPage>
  );
}
