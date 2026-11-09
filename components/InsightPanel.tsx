'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { useLanguage } from '@/components/LanguageProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
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

// 话题按钮文案见 messages/*.json → chart.topics
const TOPICS = ['overview', 'love', 'career', 'wealth', 'health', 'personality'] as const;const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy tổng hợp tóm tắt mệnh cách, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Định tính mệnh: một câu khái quát cơ cấu chính và khí chất của người này.
- Giải chính tinh: đặc tính cốt lõi của chính tinh ở Mệnh cung, dẫn ý hoặc quan điểm của thầy Nghê Hải Hạ nếu có.
- Tam phương tứ chính: phân tích tương tác giữa Tài Bạch, Quan Lộc, Thiên Di và cơ cấu tổng thể.
- Đại hạn hiện tại: hướng vận trong thập niên hiện tại và điểm đáng chú ý nhất.
- Điểm mạnh và lưu ý: năng lực bẩm sinh, cùng rủi ro hoặc bài học cần quan tâm.`,
  love: `Hãy phân tích sâu vận tình cảm và hôn nhân, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Tình cảm: một câu định tính vận mệnh cảm xúc của người này.
- Cung Phu Thê: chính tinh và Tứ Hóa ở Phu Thê cung, cùng解读 cụ thể theo hệ Nghê Hải Hạ nếu có.
- Tương tác tam phương: các cung liên quan ảnh hưởng tình cảm thế nào.
- Đại hạn tình cảm hiện tại: hướng感情 trong 10 năm nay và các thời điểm then chốt.
- Lời khuyên thực tế: đề xuất concrete trong tình cảm.`,
  career: `Hãy phân tích sâu vận sự nghiệp, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Sự nghiệp: một câu定性 liệu thích hợp làm nhân viên hay khởi nghiệp.
- Cung Quan Lộc: chính tinh và Tứ Hóa ở Quan Lộc, cùng đánh giá của thầy Nghê về方式配置 này.
- Liên động Tài Bạch: mối liên hệ giữa tài vận và sự nghiệp, nguồn thu nhập.
- Đại hạn sự nghiệp hiện tại: hướng事业 trong thập niên hiện tại.
- Lời khuyên thực tế: hướng, ngành và chiến lược phù hợp.`,
  wealth: `Hãy phân tích sâu vận tài, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Tài vận: một câu定性 mẫu tài vận, chủ động hay被 động.
- Cung Tài Bạch: chính tinh và Tứ Hóa ở Tài Bạch, nguồn tài và cách lưu chuyển.
- Cung Điền Trạch: khả năng tích lũy và vận thế bất động产.
- Đại hạn tài vận hiện tại: hướng tài trong thập niên nay và lưu ý.
- Lời khuyên kiếm tiền: đề xuất financial cụ thể.`,
  health: `Hãy phân tích vận khỏe, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Chính tinh ở Tật Ách: star và ý nghĩa健康ở Tật Ách.
- Nguy cơ chính: kết hợp lý thuyết子午流注 của thầy Nghê, phỏng đoán hidden health và vùng cần quan tâm.
- Đại hạn sức khỏe: xu hướng健康 tại và thời điểm quan trọng.
- Lời khuyên phòng ngừa: đề xuất chăm sóc sức khỏe cụ thể.`,
  personality: `Hãy phân tích sâu tính cách, trả lời bằng tiếng Việt, theo cấu trúc sau:
- Chính tinh ở Mệnh: đặc tính cốt lõi của chính tinh ở Mệnh cung, dẫn ý thầy Nghê.
- Tam phương tính cách: tài, quan, di ảnh hưởng tính cách total.
- Mô thức giao tiếp: cách tương tác với người và phong cách ứng xử.
- Những điểm mạnh và bài học: điểm mạnh bẩm sinh, và bài học cần đối mặt.`,
};


const PALACE_ROLES: Record<string, string> = {
  '命宫':   'Tự tôi, tính cách, cơ cấu bẩm sinh',
  '兄弟宫': 'Quan hệ anh em, đối tác',
  '夫妻宫': 'Quan hệ tình cảm, tình trạng hôn nhân',
  '子女宫': 'Duyên con cái, quan hệ cấp dưới',
  '财帛宫': 'Nguồn tài, cách thu nhập',
  '疾厄宫': 'Sức khỏe, tình huống bất ngờ',
  '迁移宫': 'Cơ hội ra ngoài, võng mạng giao tiếp',
  '交友宫': 'Mạng bạn bè, kim tinh, ngu nhiệt',
  '官禄宫': 'Thành tựu sự nghiệp, vị thế xã hội',
  '田宅宫': 'Bất động sản, môi trường gia đình',
  '福德宫': 'Thỏa thích tinh thần, phúc đức nội tâm',
  '父母宫': 'Quan hệ cha mẹ, giấy tờ hợp đồng',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  // 界面文案统一取自 messages/*.json → chart
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
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

    const prompt = `Hãy phân tích chuyên sâu cung ${selectedPalace.name} (chức năng: ${role}). Chính tinh tại cung này là ${starDesc}. Trả lời bằng tiếng Việt, theo cấu trúc sau:
- Định tính cung: ý nghĩa của ${selectedPalace.name} trong lá số và đánh giá tổng thể về配置 tinh hoa này.
- Giải chính tinh所在宫:解读 chính tinh ở cung này theo hệ Nghê Hải Hạ, dẫn cụ thể.
- Tương tác tam phương tứ chính: các cung tam phương tứ chính ảnh hưởng đến cung này.
- Lời khuyên thực tế: dựa vào cung này, đề xuất cụ thể.`;

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

    const prompt = `Hãy phân tích ảnh hưởng flying transformation của ${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}. Trả lời bằng tiếng Việt, theo cấu trúc sau:
- Ý nghĩa của化${selectedSiHua.siHua}: ý nghĩa cốt lõi của化${selectedSiHua.siHua} trong hệ Nghê Hải Hạ và đặc điểm của${selectedSiHua.starName}化${selectedSiHua.siHua}.
- Ảnh hưởng khi落宫: ${selectedSiHua.starName}化${selectedSiHua.siHua} rơi vào ${palaceName}, lĩnh vực do cung này主管 chịu ảnh hưởng thế nào, thầy Nghê如何解读.
- Đường飞化 tam phương tứ chính: sau khi化${selectedSiHua.siHua} vào${palaceName}, ảnh hưởng liên động đến对宫 và hai tam hợp cung.
- Ảnh hưởng vận势 hiện tại: trong khoảng thời gian ${viewLabel}, ảnh hưởng cụ thể của hóa${selectedSiHua.siHua} này đến vận势 gần đây của命主.
- Lời khuyên thực tế: dựa vào此四化, đề xuất có thể操作.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('请求失败');
      if (!res.body) throw new Error('无响应流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? t('chart.errors.apiMissing') : t('chart.errors.failed') }]);
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
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(topic => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t(`chart.topics.${topic}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-4 min-h-0"
      >

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>{t('chart.generating')}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  {t('chart.reading')}
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t('chart.followUpPlaceholder')}
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : t('chart.followUp')}
          </button>
        </div>
      </div>

    </div>
  );
}
