/**
 * 解读文本的轻量渲染：整行 **【标题】** → 小节标题，行内 **粗体** → strong，其余每行一段。
 * 数据集解读、AI 命盘解读、AI 合盘分析共用这一个格式。
 */
export default function ReadingMarkdown({ text, streaming, compact }: {
  text: string;
  /** 流式输出中：末尾显示闪烁光标 */
  streaming?: boolean;
  /** 窄面板（AI 侧栏）里用的小字号版本 */
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'reading-prose is-compact' : 'reading-prose'}>
      {text.split('\n').map((line, i) => {
        const section = line.match(/^\*\*【(.+?)】\*\*$/);
        if (section) return <h3 key={i}>{section[1]}</h3>;
        if (line.trim() === '') return null;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <p key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {parts.map((part, j) => (j % 2 === 0 ? part : <strong key={j}>{part}</strong>))}
          </p>
        );
      })}
      {streaming && (
        <span aria-hidden className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm align-middle animate-pulse" style={{ background: 'var(--ac)' }} />
      )}
    </div>
  );
}
