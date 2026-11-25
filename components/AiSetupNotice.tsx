/** AI 服务商未配置时的说明：标题 + 一句不受影响的部分 + 后端给出的配置提示。 */
export default function AiSetupNotice({ title, unaffected, hint }: { title: string; unaffected: string; hint: string }) {
  return (
    <div className="max-w-[68ch]">
      <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--tx-0)' }}>{title}</p>
      <p className="text-[13px] sm:text-[14px] leading-[1.8] mb-4" style={{ color: 'var(--tx-2)' }}>
        {unaffected}要开启这项功能，需要在服务端配置一个 AI 服务商。
      </p>
      <p
        className="text-[12px] leading-[1.7] rounded-lg p-3 font-mono break-words"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr)', color: 'var(--tx-2)' }}
      >
        {hint}
      </p>
    </div>
  );
}
