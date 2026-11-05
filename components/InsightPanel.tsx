'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { viTerm } from '@/lib/i18n/vi';
import type { TimeView } from './TimeNav';

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

const TOPICS = [
  { key: 'overview', label: 'Mệnh cách' },
  { key: 'love', label: 'Tình cảm' },
  { key: 'career', label: 'Sự nghiệp' },
  { key: 'wealth', label: 'Tài vận' },
  { key: 'health', label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy trình bày tổng quan mệnh cách theo cấu trúc sau:

**【Đặc điểm mệnh cách】**
Tóm tắt cách cục cốt lõi và khí chất của đương số trong một câu.

**【Luận chính tinh】**
Đặc trưng của chính tinh tại cung Mệnh; trích dẫn lời hoặc quan điểm của Nghê Hải Hạ.

**【Tam phương tứ chính】**
Phân tích liên hệ giữa Tài Bạch, Quan Lộc, Thiên Di và cách cục tổng thể.

**【Đại hạn hiện tại】**
Xu hướng vận trình trong đại hạn và những điều đáng chú ý.

**【Ưu điểm và lưu ý】**
Thế mạnh của lá số cùng những điểm cần lưu ý hoặc rèn luyện.`,

  love: `Hãy phân tích tình duyên, hôn nhân theo cấu trúc sau:

**【Cách cục tình cảm】**
Tóm tắt đặc điểm tình cảm trong một câu.

**【Cung Phu Thê】**
Chính tinh, Tứ Hóa và luận giải theo hệ thống Nghê Hải Hạ.

**【Liên hệ tam phương】**
Ảnh hưởng của các cung liên quan đối với tình cảm.

**【Tình cảm trong đại hạn】**
Xu hướng tình cảm trong mười năm hiện tại và các mốc đáng chú ý.

**【Gợi ý thực tế】**
Đưa ra những gợi ý cụ thể, có thể áp dụng.`,

  career: `Hãy phân tích sự nghiệp theo cấu trúc sau:

**【Cách cục sự nghiệp】**
Tóm tắt đặc điểm sự nghiệp, thiên về làm việc trong tổ chức hay khởi nghiệp.

**【Cung Quan Lộc】**
Chính tinh, Tứ Hóa và nhận định theo Nghê Hải Hạ.

**【Liên hệ cung Tài Bạch】**
Quan hệ giữa tài vận và sự nghiệp, nguồn thu nhập.

**【Sự nghiệp trong đại hạn】**
Xu hướng sự nghiệp của mười năm hiện tại.

**【Gợi ý thực tế】**
Hướng phát triển, ngành nghề và cách tiếp cận phù hợp.`,

  wealth: `Hãy phân tích tài vận theo cấu trúc sau:

**【Cách cục tài vận】**
Tóm tắt mô hình tài vận, thiên về nguồn thu chủ động hay thụ động.

**【Cung Tài Bạch】**
Chính tinh, Tứ Hóa, nguồn tài sản và cách tiền bạc lưu chuyển.

**【Cung Điền Trạch – tài khố】**
Khả năng tích lũy và vận trình bất động sản.

**【Tài vận trong đại hạn】**
Xu hướng tài vận hiện tại và các điểm cần lưu ý.

**【Gợi ý quản lý tài chính】**
Các gợi ý tài chính cụ thể.`,

  health: `Hãy phân tích sức khỏe theo cấu trúc sau:

**【Chính tinh cung Tật Ách】**
Các sao trong cung Tật Ách và ý nghĩa liên quan sức khỏe.

**【Điểm cần lưu ý】**
Dựa trên lý thuyết Tý Ngọ lưu chú của Nghê Hải Hạ, trình bày những vấn đề và bộ phận được bản luận nhắc tới.

**【Sức khỏe trong đại hạn】**
Xu hướng hiện tại và các giai đoạn đáng chú ý.

**【Gợi ý chăm sóc】**
Những điểm cần lưu ý và hướng dưỡng sinh.`,

  personality: `Hãy phân tích tính cách theo cấu trúc sau:

**【Tính cách theo chính tinh cung Mệnh】**
Những nét tính cách cốt lõi, dẫn lời Nghê Hải Hạ khi có nguồn.

**【Tổng hợp tam phương】**
Ảnh hưởng của Tài Bạch, Quan Lộc, Thiên Di đối với tính cách.

**【Quan hệ với người khác】**
Cách tương tác, đối nhân xử thế.

**【Thế mạnh và điều cần rèn luyện】**
Ưu điểm bẩm sinh và những bài học trong cuộc sống.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫': 'bản thân, tính cách, cách cục bẩm sinh',
  '兄弟宫': 'quan hệ anh chị em và đối tác',
  '夫妻宫': 'tình cảm và hôn nhân',
  '子女宫': 'duyên con cái và quan hệ cấp dưới',
  '财帛宫': 'nguồn tài vận và cách kiếm thu nhập',
  '疾厄宫': 'sức khỏe và tai nạn',
  '迁移宫': 'cơ hội bên ngoài và quan hệ xã hội',
  '交友宫': 'bạn bè, quý nhân và tiểu nhân',
  '官禄宫': 'thành tựu sự nghiệp và địa vị xã hội',
  '田宅宫': 'bất động sản và môi trường gia đình',
  '福德宫': 'đời sống tinh thần và phúc phần',
  '父母宫': 'quan hệ cha mẹ và văn thư, hợp đồng',
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
      ? majorStars.map(s => `${viTerm(s.name)}${s.siHua ? ' Hóa ' + viTerm(s.siHua) : ''}`).join(', ')
      : 'Vô chính diệu (mượn chính tinh đối cung)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `Hãy tập trung luận cung ${viTerm(selectedPalace.name)} (chủ về ${role}), có chính tinh ${starDesc}, theo cấu trúc sau:

**【Ý nghĩa cung】**
Ý nghĩa của ${viTerm(selectedPalace.name)} trong lá số và nhận định tổng thể về tổ hợp sao này.

**【Luận chính tinh】**
Luận chính tinh tại cung theo hệ thống Nghê Hải Hạ, nêu quan điểm cụ thể.

**【Liên hệ tam phương tứ chính】**
Ảnh hưởng của tam phương tứ chính đến cung này.

**【Gợi ý thực tế】**
Các gợi ý cụ thể dựa trên cung này.`;

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
    const palaceName = palaceOfStar?.name ?? 'Cung chưa xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại hạn' : 'Lưu niên';

    const prompt = `Hãy phân tích ảnh hưởng ${viewLabel}: ${viTerm(selectedSiHua.starName)} Hóa ${viTerm(selectedSiHua.siHua)}, theo cấu trúc sau:

**【Ý nghĩa cơ bản của Hóa ${viTerm(selectedSiHua.siHua)}】**
Ý nghĩa trong hệ thống Nghê Hải Hạ và ý nghĩa riêng khi ${viTerm(selectedSiHua.starName)} Hóa ${viTerm(selectedSiHua.siHua)}.

**【Ảnh hưởng tại cung】**
Sao này nằm ở ${viTerm(palaceName)}, ảnh hưởng thế nào đến lĩnh vực do cung quản và Nghê Hải Hạ luận ra sao.

**【Liên hệ Tứ Hóa với tam phương tứ chính】**
Ảnh hưởng liên đới đến đối cung và hai cung tam hợp.

**【Ảnh hưởng vận trình hiện tại】**
Ảnh hưởng cụ thể trong thời gian ${viewLabel} đối với đương số.

**【Gợi ý thực tế】**
Các gợi ý có thể áp dụng dựa trên Tứ Hóa này.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi' },
        body: JSON.stringify({ chart, messages: apiMessages.map((message, index) => index === apiMessages.length - 1 && message.role === 'user' ? { ...message, content: `${message.content}\n\nHãy trả lời hoàn toàn bằng tiếng Việt, dùng thuật ngữ Tử Vi Hán–Việt và giữ nguyên ý nghĩa của dữ liệu lá số.` } : message) }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('Yêu cầu không thành công');
      if (!res.body) throw new Error('Không có luồng phản hồi');

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
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Bản mã nguồn mở chưa có API luận giải AI (/api/interpret). Cần triển khai API này để sử dụng; xem phần Khởi động nhanh trong README. Việc lập lá số không cần API key.' : 'Chưa thể luận giải. Vui lòng thử lại sau.' }]);
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
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang tạo luận giải mệnh cách…</p>
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
                  Luận giải Tử Vi
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
            placeholder="Hỏi thêm, ví dụ: Năm nay có hợp đổi việc không?"
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
            {loading ? '…' : 'Hỏi thêm'}
          </button>
        </div>
      </div>

    </div>
  );
}
