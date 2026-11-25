import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: '隐私政策 · 紫微命盘',
  description: '紫微命盘如何处理你的出生信息：排盘在浏览器完成，最近排过的记录只存本机，AI 解读时才把命盘发给 AI 服务商。',
  alternates: { canonical: '/privacy' },
};

const REPO = 'https://github.com/Renhuai123/ziwei-doushu';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="隐私政策"
      updated="2026年11月"
      other={{ href: '/terms', label: '服务条款' }}
      intro="本站不设账号、不收费、没有广告。下面按实际代码说明你的数据去了哪里。"
    >
      <h2>1. 出生信息与排盘</h2>
      <p>
        你填写的姓名（选填）、公历出生日期与时间、性别、出生地，<strong>在你的浏览器里直接排盘</strong>，
        排盘这一步不会把它们发到本站服务器。
      </p>

      <h2>2. 只存在你这台设备上的数据</h2>
      <p>本站用浏览器的 localStorage 保存两样东西，不使用 cookie：</p>
      <ul>
        <li><strong>主题偏好</strong>：暗色或亮色。</li>
        <li><strong>最近排过</strong>：最近 6 组出生信息，用于在排盘页、合盘页一键重排。可以在排盘页逐条删除或「全部清除」。</li>
      </ul>
      <p>这些数据不会上传；清除浏览器的网站数据也会一并删除。</p>
      <p>
        排盘或合盘后，地址栏 <code>#</code> 后面会带上这组出生信息，用于刷新后恢复命盘。浏览器不会把 <code>#</code> 之后的内容发给服务器；
        但你复制、分享这个链接时，收到的人能看到其中的出生信息（含填写的姓名）。点「重新起盘」会清掉它。
      </p>

      <h2>3. 使用 AI 解读时</h2>
      <p>
        只有当你主动使用 AI 解读（命盘页的 AI 侧栏、合盘分析）时，命盘内容才会经本站服务器转发给站长配置的 AI 服务商
        （本项目支持 Anthropic Claude、DeepSeek 等，具体由部署者在服务器环境变量中选择）。发送的内容包括：
      </p>
      <ul>
        <li>出生日期、时辰、性别，以及由此排出的农历、四柱、十二宫星曜与四化；</li>
        <li>你在对话框里输入的问题和此前的对话。</li>
      </ul>
      <p>
        你填写的<strong>姓名不会写进发给 AI 的内容</strong>。本站服务器只转发请求，不保存对话记录。
        AI 服务商如何处理收到的数据，以其各自的隐私政策为准。
      </p>

      <h2>4. 访问统计</h2>
      <p>
        站点部署在 Vercel 时会启用 Vercel Web Analytics，统计匿名的页面访问量（访问了哪个页面、来源、设备与浏览器类型、国家或地区），
        不使用 cookie，不包含你填写的出生信息。服务器与网络服务商也可能按常规记录访问日志（如 IP 地址、访问时间）。
      </p>

      <h2>5. 自行部署的站点</h2>
      <p>
        本站代码以 MIT 协议开源（<a href={REPO}>{REPO.replace('https://', '')}</a>）。
        他人部署的站点可能改动了代码或接入了其他服务，其数据处理以该站点的说明为准。
      </p>

      <h2>6. 未成年人</h2>
      <p>命理内容面向成年人。未成年人请在监护人陪同下使用，不要把解读当作重大决定的依据。</p>

      <h2>7. 政策变更与联系</h2>
      <p>
        数据处理方式改变时会更新本页，并修改顶部的日期。有疑问请在 <a href={`${REPO}/issues`}>GitHub Issues</a> 提出。
      </p>
    </LegalPage>
  );
}
