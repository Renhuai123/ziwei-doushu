'use client';
import { useState, useRef, useEffect } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { readNotConfiguredNotice, readRateLimitNotice } from '@/lib/ai/not-configured';
import { readSseText } from '@/lib/ai/read-sse';
import { fitHistory } from '@/lib/ai/history';
import ReadingMarkdown from './ReadingMarkdown';
import SkeletonLines from './SkeletonLines';
import AiSetupNotice from './AiSetupNotice';
import type { TimeView } from './TimeNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
  local?: boolean;  // 前端自己生成的提示（如失败），不作为对话上下文发给 AI
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: '命格' },
  { key: 'love',        label: '感情' },
  { key: 'career',      label: '事业' },
  { key: 'wealth',      label: '财运' },
  { key: 'health',      label: '健康' },
  { key: 'personality', label: '性格' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `请生成命格总览，按以下结构输出：

**【命格定性】**
用一句话概括这个命盘的核心格局与命主气质。

**【主星解读】**
命宫主星的核心特质，引用倪海厦原话或观点。

**【三方四正】**
财、官、迁三宫的联动分析及整体格局。

**【当前大限】**
当下大限运势方向与最值得关注的事项。

**【优势与注意】**
命盘天赋优势，以及需要注意的风险或功课。`,

  love: `请深度分析感情婚姻运，按以下结构输出：

**【感情格局】**
一句话定性感情命格。

**【夫妻宫分析】**
夫妻宫主星、四化，以及倪海厦体系的具体解读。

**【三方联动】**
相关宫位对感情的影响。

**【当前大限感情运】**
当下10年感情走向与关键节点。

**【实际建议】**
具体可行的感情建议。`,

  career: `请深度分析事业运，按以下结构输出：

**【事业格局】**
一句话定性事业命格，宜任职或宜创业。

**【官禄宫分析】**
官禄宫主星、四化，以及倪师对这种配置的判断。

**【财帛宫联动】**
财运与事业的关系，财路来源分析。

**【当前大限事业运】**
当下10年事业走向。

**【实际建议】**
适合的方向、行业与策略。`,

  wealth: `请深度分析财运，按以下结构输出：

**【财运格局】**
一句话定性财运模式，是主动财还是被动财。

**【财帛宫分析】**
财帛宫主星、四化，财富来源与流动模式。

**【田宅宫（财库）】**
积蓄能力与不动产运势分析。

**【当前大限财运】**
当下财运走向与注意事项。

**【理财建议】**
具体的财务建议。`,

  health: `请分析健康运势，按以下结构输出：

**【疾厄宫主星】**
疾厄宫星曜与健康含义。

**【主要风险】**
结合倪海厦子午流注理论，分析主要健康隐患与需关注的部位。

**【大限健康走势】**
当下健康趋势与关键时间段。

**【预防建议】**
具体注意事项与养生方向。`,

  personality: `请深度解析性格特质，按以下结构输出：

**【命宫主星性格】**
命宫主星的核心性格特质，引用倪师原话。

**【三方性格综合】**
财、官、迁三宫对性格的影响，全貌描绘。

**【人际关系模式】**
与他人互动方式、待人处世风格。

**【优势与人生课题】**
天赋优势，以及需要面对的人生功课。`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   '自我、性格、先天格局',
  '兄弟宫': '兄弟关系、合伙人',
  '夫妻宫': '感情关系、婚姻状态',
  '子女宫': '子女缘分、下属关系',
  '财帛宫': '财运来源、收入方式',
  '疾厄宫': '身体健康、意外',
  '迁移宫': '外出机遇、人际格局',
  '交友宫': '朋友圈、贵人、小人',
  '官禄宫': '事业成就、社会地位',
  '田宅宫': '不动产、家庭环境',
  '福德宫': '精神享受、内心福分',
  '父母宫': '父母关系、文书契约',
};

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const [setupHint, setSetupHint] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      const notice = await readNotConfiguredNotice(res);
      if (notice) {
        setSetupHint(notice);
        return;
      }
      const limitNotice = readRateLimitNotice(res);
      if (limitNotice) {
        setMessages(prev => [...prev, { role: 'assistant', content: limitNotice, local: true }]);
        return;
      }
      if (!res.ok) throw new Error('请求失败');
      if (!res.body) throw new Error('无响应流');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      await readSseText(res.body, text => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: text };
          return updated;
        });
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '解读失败，请稍后重试。', local: true }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = fitHistory(
      [...messagesRef.current, userMsg]
        .filter(m => !m.local)
        .map(m => ({ role: m.role, content: m.content })),
    );

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  // 以下 effect 调用 sendMessage，放在它的定义之后
  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : '空宫（借对宫）';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `请重点分析【${selectedPalace.name}】（主管：${role}），该宫主星为${starDesc}，按以下结构输出：

**【宫位定性】**
${selectedPalace.name}在命盘中的意义，以及这种星曜配置的整体判断。

**【主星解读】**
主星在此宫的倪海厦体系解读，引用具体观点。

**【三方四正联动】**
三方四正宫位对此宫的影响。

**【实际建议】**
基于此宫的具体建议。`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? '未知宫位';
    const viewLabel = selectedSiHua.view === 'daxian' ? '大限' : '流年';

    const prompt = `请分析【${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}】的飞化影响，按以下结构输出：

**【化${selectedSiHua.siHua}基本含义】**
化${selectedSiHua.siHua}在倪海厦体系中的核心含义，以及${selectedSiHua.starName}化${selectedSiHua.siHua}的特殊含义。

**【落宫影响】**
${selectedSiHua.starName}化${selectedSiHua.siHua}落在【${palaceName}】，该宫主管的领域受到何种影响，倪师如何解读。

**【三方四正飞化路径】**
化${selectedSiHua.siHua}入${palaceName}后，对其三方四正（对宫、两个三合宫）的联动影响。

**【当前运势影响】**
在${viewLabel}时间维度下，此化${selectedSiHua.siHua}对命主近期运势的具体影响。

**【实际建议】**
基于此四化的具体可操作建议。`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className={`flex flex-col ${setupHint ? 'h-auto' : 'h-[min(44rem,80dvh)]'} min-h-0 min-w-0 rounded-2xl overflow-hidden card-glass`}>

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-3 pt-3 pb-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--tx-0)' }}>AI 解读</span>
          <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>点宫位可单独分析</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading || !!setupHint}
                aria-pressed={isActive}
                className="py-1.5 text-[12px] font-medium rounded-lg transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isActive ? 'var(--ac-bg)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--ac-bdr)' : 'var(--bdr)'}`,
                  color: isActive ? 'var(--ac)' : 'var(--tx-3)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {setupHint ? (
          <div className="flex flex-col justify-center h-full px-2">
            <div
              aria-hidden
              className="mb-4 grid h-10 w-10 place-items-center rounded-full text-[16px]"
              style={{ border: '1px solid var(--ac-bdr)', background: 'var(--ac-bg)', color: 'var(--ac)' }}
            >
              ✦
            </div>
            <AiSetupNotice title="AI 解读未启用" unaffected="命盘与下方十三个主题的解读都可正常查看。" hint={setupHint} />
          </div>
        ) : messages.length === 0 && (
          <div className="pt-1"><SkeletonLines thin widths={[70, 100, 92, 100, 64]} label="命格解读生成中" /></div>
        )}

        {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <div key={i} className="anim-rise flex justify-end">
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[13px]"
                    style={{
                      background: 'var(--ac-bg)',
                      border: '1px solid var(--ac-bdr)',
                      color: 'var(--tx-0)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <div key={i} className="anim-rise">
                <div
                  className="text-[11px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--tx-3)' }}
                >
                  <span style={{ color: 'var(--ac)' }}>✦</span>
                  命理解读
                </div>
                <ReadingMarkdown compact text={msg.content} streaming={loading && isLastMsg} />
              </div>
            );
          })}
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-3" style={{ borderTop: '1px solid var(--bdr)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={setupHint ? '配置 AI 后可追问' : '继续追问，如：今年适合换工作吗？'}
            aria-label="追问内容"
            disabled={loading || !!setupHint}
            className="flex-1 min-w-0 rounded-lg px-3 h-10 text-[13px] outline-none transition-colors focus:border-[var(--ac-bdr)] disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--bdr-med)',
              color: 'var(--tx-0)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !!setupHint}
            className="px-4 h-10 rounded-lg text-[13px] font-medium transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: 'var(--ac)',
              color: 'var(--bg-0)',
            }}
          >
            {loading ? '…' : '追问'}
          </button>
        </div>
      </div>

    </div>
  );
}
