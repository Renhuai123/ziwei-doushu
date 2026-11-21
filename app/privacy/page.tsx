export const metadata = { title: '隐私政策 · 紫微命盘', description: '紫微命盘隐私政策', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>返回首页</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>紫微命盘</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>隐私政策</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最后更新：2026年4月</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 我们收集的信息</h2>
      <p>为提供紫微命盘排盘与解读服务，我们可能收集以下信息：</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>命盘必要信息</strong>：姓名（选填）、出生公历年月日、出生时辰、性别、出生地经度</li>
        <li><strong>账号信息（注册后）</strong>：手机号（用于短信验证与会员服务）</li>
        <li><strong>交互信息</strong>：你在站内的点击、浏览、命盘历史记录</li>
        <li><strong>反馈信息</strong>：你对解读内容的"准 / 不准"打分与文字反馈</li>
        <li><strong>支付信息</strong>：购买会员或单项服务时通过第三方支付（支付宝 / 微信支付）处理，本平台不存储完整卡号或密码</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 我们如何使用信息</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>命盘信息仅用于本次解读与你账号下的历史命盘记录</li>
        <li>手机号用于注册、登录、订单通知</li>
        <li>反馈信息用于持续改进命理内容质量（脱敏后聚合分析）</li>
        <li>聚合数据可能用于行业研究与平台优化</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 信息共享与第三方</h2>
      <p>除以下情形外，我们不会向第三方共享你的个人信息：</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>支付服务商（支付宝 / 微信支付）：处理订单结算</li>
        <li>短信服务商（如阿里云短信）：发送验证码</li>
        <li>云服务商（如 Vercel / Cloudflare / 阿里云）：技术承载</li>
        <li>AI 解读服务（如 Anthropic Claude）：处理你的"自由追问"对话（已做匿名化）</li>
        <li>司法机关或政府部门基于法律法规的合法要求</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. 信息安全</h2>
      <p>我们采取业界常见的技术与管理手段保护你的信息（HTTPS 传输加密、数据库加密存储、访问权限控制等）。但请注意，互联网传输无法保证 100% 安全。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. 你的权利</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>查询</strong>：可通过账号中心查看你的所有历史命盘与订单</li>
        <li><strong>删除</strong>：联系客服删除账号下指定命盘 / 注销账号</li>
        <li><strong>导出</strong>：可申请导出你的全部个人数据</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Cookie 与本地存储</h2>
      <p>本站使用 cookie / localStorage 用于：保存你的暗黑/亮色主题偏好、最近的命盘历史、会员登录状态。你可在浏览器设置中关闭，但部分功能可能受影响。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. 未成年人</h2>
      <p>本平台命理内容面向 18 岁以上成年用户。未成年人请在监护人同意下使用，并不得将解读用于重大人生决策。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. 政策变更</h2>
      <p>本政策可能不定期更新。重大变更将以显著方式通知。继续使用即表示同意更新后的版本。</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>服务条款</a> · <a href="/" style={{ color: 'var(--ac)' }}>返回首页</a>
        </p>
      </main>
    </>
  );
}
