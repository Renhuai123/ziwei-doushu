'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { viPalace, viStar, viSiHua } from '@/lib/i18n/vi';

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
  { key: 'overview',     label: 'Mệnh cách' },
  { key: 'love',        label: 'Tình cảm' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài vận' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

/** Mọi prompt đều yêu cầu trả lời bằng tiếng Việt. */
const VI_INSTRUCTION = 'Hãy trả lời hoàn toàn bằng tiếng Việt, dùng thuật ngữ Tử Vi Hán-Việt (ví dụ: cung Mệnh, Tử Vi, Hóa Lộc). Chỉ luận dựa trên lá số đang xem: mỗi nhận định phải chỉ ra sao, cung, tứ hóa hoặc đại hạn cụ thể trong lá số này.';

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `${VI_INSTRUCTION}
Hãy lập phần tổng quan mệnh cách theo cấu trúc sau:

**【Định tính mệnh cách】**
Một câu khái quát cách cục cốt lõi và khí chất của đương số.

**【Chính tinh cung Mệnh】**
Đặc tính cốt lõi của chính tinh thủ Mệnh.

**【Tam phương tứ chính】**
Phân tích liên động giữa Tài Bạch, Quan Lộc, Thiên Di và cách cục tổng thể.

**【Đại hạn hiện tại】**
Xu hướng vận trình của đại hạn hiện tại và điều đáng chú ý nhất.

**【Ưu điểm và lưu ý】**
Thiên phú nổi bật của lá số, cùng các rủi ro hoặc bài học cần lưu ý.`,

  love: `${VI_INSTRUCTION}
Hãy phân tích sâu vận tình cảm – hôn nhân theo cấu trúc sau:

**【Cách cục tình cảm】**
Một câu định tính mệnh cách tình cảm.

**【Cung Phu Thê】**
Chính tinh, tứ hóa của cung Phu Thê và ý nghĩa cụ thể.

**【Liên động tam phương】**
Ảnh hưởng của các cung liên quan đến tình cảm.

**【Tình cảm trong đại hạn hiện tại】**
Hướng đi tình cảm trong 10 năm hiện tại và các mốc then chốt.

**【Lời khuyên thực tế】**
Lời khuyên tình cảm cụ thể, khả thi.`,

  career: `${VI_INSTRUCTION}
Hãy phân tích sâu vận sự nghiệp theo cấu trúc sau:

**【Cách cục sự nghiệp】**
Một câu định tính: hợp làm công hay hợp khởi nghiệp.

**【Cung Quan Lộc】**
Chính tinh, tứ hóa của cung Quan Lộc và nhận định về cấu hình này.

**【Liên động cung Tài Bạch】**
Quan hệ giữa tài vận và sự nghiệp, nguồn thu nhập.

**【Sự nghiệp trong đại hạn hiện tại】**
Hướng đi sự nghiệp trong 10 năm hiện tại.

**【Lời khuyên thực tế】**
Ngành nghề, hướng đi và chiến lược phù hợp.`,

  wealth: `${VI_INSTRUCTION}
Hãy phân tích sâu tài vận theo cấu trúc sau:

**【Cách cục tài vận】**
Một câu định tính kiểu tài: chủ động cầu tài hay tài đến thụ động.

**【Cung Tài Bạch】**
Chính tinh, tứ hóa của cung Tài Bạch; nguồn gốc và dòng chảy tiền bạc.

**【Cung Điền Trạch (kho tài)】**
Khả năng tích lũy và vận bất động sản.

**【Tài vận đại hạn hiện tại】**
Xu hướng tài chính hiện tại và điểm cần lưu ý.

**【Lời khuyên quản lý tài chính】**
Lời khuyên tài chính cụ thể.`,

  health: `${VI_INSTRUCTION}
Hãy phân tích vận sức khỏe theo cấu trúc sau:

**【Sao cung Tật Ách】**
Các sao trong cung Tật Ách và ý nghĩa về sức khỏe.

**【Rủi ro chính】**
Những nguy cơ sức khỏe chính và bộ phận cơ thể cần chú ý.

**【Xu hướng sức khỏe theo đại hạn】**
Xu hướng hiện tại và các giai đoạn then chốt.

**【Lời khuyên phòng ngừa】**
Điều cần lưu ý và hướng dưỡng sinh cụ thể.`,

  personality: `${VI_INSTRUCTION}
Hãy phân tích sâu tính cách theo cấu trúc sau:

**【Tính cách theo chính tinh cung Mệnh】**
Đặc điểm tính cách cốt lõi của chính tinh thủ Mệnh.

**【Tổng hợp tam phương】**
Ảnh hưởng của Tài Bạch, Quan Lộc, Thiên Di lên tính cách — bức tranh toàn diện.

**【Cách giao tiếp, quan hệ】**
Cách tương tác với người khác và phong cách đối nhân xử thế.

**【Ưu điểm và bài học cuộc đời】**
Thiên phú nổi bật và những bài học cần đối mặt.`,
};

/** Khóa theo tên cung tiếng Việt (viPalace) */
const PALACE_ROLES: Record<string, string> = {
  'Mệnh':       'bản thân, tính cách, cách cục bẩm sinh',
  'Huynh Đệ':   'anh chị em, đối tác',
  'Phu Thê':    'tình cảm, hôn nhân',
  'Tử Tức':     'con cái, cấp dưới',
  'Tài Bạch':   'nguồn tiền, cách kiếm tiền',
  'Tật Ách':    'sức khỏe, tai nạn',
  'Thiên Di':   'đi xa, cơ hội bên ngoài, quan hệ xã hội',
  'Nô Bộc':     'bạn bè, quý nhân, tiểu nhân',
  'Quan Lộc':   'sự nghiệp, địa vị xã hội',
  'Điền Trạch': 'nhà đất, môi trường gia đình',
  'Phúc Đức':   'đời sống tinh thần, phúc phần',
  'Phụ Mẫu':    'cha mẹ, giấy tờ, hợp đồng',
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
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  // Gợi ý luận giải từ thao tác trên lá số — chỉ gửi khi người dùng bấm
  const [suggestion, setSuggestion] = useState<{ label: string; prompt: string } | null>(null);
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Gom mọi câu hỏi trong một lần mở lá số thành một session trong tracing (Langfuse).
  const sessionId = useRef(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()));

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Palace selected → offer analysis (no auto-call)
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${viStar(s.name)}${s.siHua ? ' Hóa ' + viSiHua(s.siHua) : ''}`).join(', ')
      : 'vô chính diệu (mượn sao cung đối)';
    const palaceVi = viPalace(selectedPalace.name);
    const role = PALACE_ROLES[palaceVi] ?? '';

    const prompt = `${VI_INSTRUCTION}
Hãy phân tích trọng tâm cung 【${palaceVi}】 (chủ về: ${role}); chính tinh của cung là ${starDesc}. Trình bày theo cấu trúc sau:

**【Định tính cung】**
Ý nghĩa của cung ${palaceVi} trong lá số và nhận định tổng thể về cấu hình sao này.

**【Giải chính tinh】**
Ý nghĩa của chính tinh khi tọa thủ tại cung này.

**【Liên động tam phương tứ chính】**
Ảnh hưởng của các cung tam phương tứ chính lên cung này.

**【Lời khuyên thực tế】**
Lời khuyên cụ thể dựa trên cung này.`;

    setSuggestion({ label: `Luận giải cung ${palaceVi}`, prompt });
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tứ hóa selected → offer analysis (no auto-call)
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar ? viPalace(palaceOfStar.name) : 'cung không xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại hạn' : 'Lưu niên';
    const star = viStar(selectedSiHua.starName);
    const hua = `Hóa ${viSiHua(selectedSiHua.siHua)}`;

    const prompt = `${VI_INSTRUCTION}
Hãy phân tích ảnh hưởng phi hóa của 【${viewLabel}: ${star} ${hua}】 theo cấu trúc sau:

**【Ý nghĩa cơ bản của ${hua}】**
Ý nghĩa cốt lõi của ${hua}, và ý nghĩa riêng khi ${star} ${hua}.

**【Ảnh hưởng tại cung】**
${star} ${hua} rơi vào cung 【${palaceName}】 — lĩnh vực cung này chủ quản bị ảnh hưởng ra sao.

**【Đường phi hóa tam phương tứ chính】**
Sau khi ${hua} nhập cung ${palaceName}, ảnh hưởng liên động lên tam phương tứ chính (cung đối và hai cung tam hợp).

**【Ảnh hưởng vận trình hiện tại】**
Trong khung thời gian ${viewLabel.toLowerCase()}, ${hua} này tác động cụ thể thế nào đến vận gần đây.

**【Lời khuyên thực tế】**
Lời khuyên cụ thể, có thể hành động dựa trên tứ hóa này.`;

    setSuggestion({ label: `Luận giải ${viewLabel}: ${star} ${hua}`, prompt });
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages, sessionId: sessionId.current }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) {
        const detail = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(detail?.error ? `server:${detail.error}` : 'request-failed');
      }
      if (!res.body) throw new Error('no-stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = ''; // giữ lại dòng SSE chưa trọn giữa hai lần read()

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
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
      const serverMsg = e instanceof Error && e.message.startsWith('server:') ? e.message.slice(7) : null;
      setMessages(prev => [...prev, { role: 'assistant', content: serverMsg ? `⚠ ${serverMsg}` : missing ? 'Bản mã nguồn mở không kèm API luận giải AI (/api/interpret) — bạn cần tự triển khai, xem README phần «Quick start». Việc lập lá số không cần API key.' : 'Luận giải thất bại, vui lòng thử lại sau.' }]);
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

  const handleSuggestionClick = () => {
    if (!suggestion || loadingRef.current) return;
    sendMessage(suggestion.prompt, true);
    setSuggestion(null);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[min(44rem,80dvh)] min-h-0 min-w-0 rounded-xl overflow-hidden card-glass">

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 min-h-0">

        {/* Empty state — nothing is generated until the user asks */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px]" style={{ color: 'var(--t-faint)' }}>Chọn một chủ đề ở trên hoặc đặt câu hỏi để bắt đầu luận giải.</p>
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
                  Luận giải
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        {suggestion && (
          <div className="flex items-center gap-1.5 mb-2">
            <button
              onClick={handleSuggestionClick}
              disabled={loading}
              className="flex-1 min-w-0 truncate text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-all disabled:opacity-40"
              style={{
                background: 'rgba(212,168,67,0.08)',
                border: '1px dashed rgba(212,168,67,0.3)',
                color: 'var(--t-gold)',
              }}
            >
              ✦ {suggestion.label}
            </button>
            <button
              onClick={() => setSuggestion(null)}
              aria-label="Bỏ gợi ý"
              className="px-1.5 text-[11px]"
              style={{ color: 'var(--t-faint)' }}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi thêm, ví dụ: Năm nay có nên đổi việc không?"
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
            {loading ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
