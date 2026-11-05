'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { starName, paName, sihuaName } from '@/lib/ziwei/display-vi';

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

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Xin tạo tổng quan Mệnh cách, xuất kết quả theo cấu trúc sau:

**【Định tính Mệnh cách】**
Khái quát cách cục cốt lõi của lá số và khí chất mệnh chủ trong một câu.

**【Luận giải chính tinh】**
Đặc tính cốt lõi của chính tinh Cung Mệnh, trích dẫn nguyên văn hoặc quan điểm của Nghê Hải Hạ.

**【Tam Phương Tứ Chính】**
Phân tích liên kết giữa ba cung Tài, Quan, Di và cách cục tổng thể.

**【Đại Hạn hiện tại】**
Xu hướng vận thế Đại Hạn hiện tại và những điểm đáng lưu ý nhất.

**【Ưu thế và lưu ý】**
Ưu thế thiên phú của lá số, cùng rủi ro hoặc bài học cuộc đời cần chú ý.`,

  love: `Xin phân tích chuyên sâu vận tình cảm hôn nhân, xuất kết quả theo cấu trúc sau:

**【Cách cục tình cảm】**
Định tính mệnh cách tình cảm trong một câu.

**【Phân tích Cung Phu Thê】**
Chính tinh Cung Phu Thê, Tứ Hóa, và luận giải cụ thể theo hệ thống của Nghê Hải Hạ.

**【Liên kết tam phương】**
Ảnh hưởng của các cung vị liên quan đến tình cảm.

**【Vận tình cảm Đại Hạn hiện tại】**
Xu hướng tình cảm 10 năm hiện tại và các mốc thời gian then chốt.

**【Lời khuyên thực tế】**
Lời khuyên tình cảm cụ thể, khả thi.`,

  career: `Xin phân tích chuyên sâu vận sự nghiệp, xuất kết quả theo cấu trúc sau:

**【Cách cục sự nghiệp】**
Định tính mệnh cách sự nghiệp trong một câu, hợp làm công hưởng lương hay tự khởi nghiệp.

**【Phân tích Cung Quan Lộc】**
Chính tinh Cung Quan Lộc, Tứ Hóa, và nhận định của thầy Nghê về cách phối hợp này.

**【Liên kết Cung Tài Bạch】**
Mối quan hệ giữa tài vận và sự nghiệp, phân tích nguồn tiền tài.

**【Vận sự nghiệp Đại Hạn hiện tại】**
Xu hướng sự nghiệp 10 năm hiện tại.

**【Lời khuyên thực tế】**
Phương hướng, ngành nghề và chiến lược phù hợp.`,

  wealth: `Xin phân tích chuyên sâu tài vận, xuất kết quả theo cấu trúc sau:

**【Cách cục tài vận】**
Định tính mô hình tài vận trong một câu, là tài chủ động hay tài thụ động.

**【Phân tích Cung Tài Bạch】**
Chính tinh Cung Tài Bạch, Tứ Hóa, nguồn gốc của cải và mô hình luân chuyển.

**【Cung Điền Trạch (Kho tiền)】**
Phân tích năng lực tích lũy và vận thế bất động sản.

**【Tài vận Đại Hạn hiện tại】**
Xu hướng tài vận hiện tại và các điểm cần lưu ý.

**【Lời khuyên quản lý tài chính】**
Lời khuyên tài chính cụ thể.`,

  health: `Xin phân tích vận thế sức khỏe, xuất kết quả theo cấu trúc sau:

**【Chính tinh Cung Tật Ách】**
Tinh diệu Cung Tật Ách và hàm ý sức khỏe.

**【Rủi ro chính】**
Kết hợp lý thuyết Tý Ngọ Lưu Chú của Nghê Hải Hạ, phân tích các nguy cơ sức khỏe tiềm ẩn chính và bộ phận cần lưu ý.

**【Xu hướng sức khỏe Đại Hạn】**
Xu hướng sức khỏe hiện tại và các khoảng thời gian then chốt.

**【Lời khuyên phòng ngừa】**
Lưu ý cụ thể và định hướng dưỡng sinh.`,

  personality: `Xin phân tích chuyên sâu đặc điểm tính cách, xuất kết quả theo cấu trúc sau:

**【Tính cách chính tinh Cung Mệnh】**
Đặc điểm tính cách cốt lõi của chính tinh Cung Mệnh, trích dẫn nguyên văn của thầy Nghê.

**【Tổng hợp tính cách tam phương】**
Ảnh hưởng của ba cung Tài, Quan, Di đến tính cách, khắc họa bức tranh toàn cảnh.

**【Mô hình quan hệ nhân tế】**
Phương thức tương tác với người khác, phong cách đối nhân xử thế.

**【Ưu thế và bài học cuộc đời】**
Ưu thế thiên phú, cùng những bài học cuộc đời cần đối diện.`,
};

const PALACE_ROLES: Record<string, string> = {
  // Có hậu tố 宫
  '命宫':   'Bản thân, tính cách, cách cục tiên thiên',
  '兄弟宫': 'Quan hệ anh em, đối tác',
  '夫妻宫': 'Quan hệ tình cảm, trạng thái hôn nhân',
  '子女宫': 'Duyên phận con cái, quan hệ cấp dưới',
  '财帛宫': 'Nguồn tài vận, phương thức thu nhập',
  '疾厄宫': 'Sức khỏe cơ thể, tai nạn bất ngờ',
  '迁移宫': 'Cơ hội xuất ngoại, cách cục giao tế',
  '交友宫': 'Bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'Thành tựu sự nghiệp, địa vị xã hội',
  '田宅宫': 'Bất động sản, môi trường gia đình',
  '福德宫': 'Hưởng thụ tinh thần, phúc phận nội tâm',
  '父母宫': 'Quan hệ cha mẹ, văn thư khế ước',
  // Không hậu tố 宫 (theo tên palace của iztro)
  '兄弟': 'Quan hệ anh em, đối tác',
  '夫妻': 'Quan hệ tình cảm, trạng thái hôn nhân',
  '子女': 'Duyên phận con cái, quan hệ cấp dưới',
  '财帛': 'Nguồn tài vận, phương thức thu nhập',
  '疾厄': 'Sức khỏe cơ thể, tai nạn bất ngờ',
  '迁移': 'Cơ hội xuất ngoại, cách cục giao tế',
  '交友': 'Bạn bè, quý nhân, tiểu nhân',
  '仆役': 'Bạn bè, quý nhân, tiểu nhân',
  '官禄': 'Thành tựu sự nghiệp, địa vị xã hội',
  '田宅': 'Bất động sản, môi trường gia đình',
  '福德': 'Hưởng thụ tinh thần, phúc phận nội tâm',
  '父母': 'Quan hệ cha mẹ, văn thư khế ước',
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
      ? majorStars.map(s => `${starName(s.name)}${s.siHua ? ' ' + sihuaName(s.siHua.startsWith('化') ? s.siHua : '化' + s.siHua) : ''}`).join(', ')
      : 'Cung trống (mượn cung đối diện)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';
    const pName = paName(selectedPalace.name);

    const prompt = `Xin phân tích trọng điểm 【${pName}】 (Chủ quản: ${role}), chính tinh cung này là ${starDesc}, xuất kết quả theo cấu trúc sau:

**【Định tính cung vị】**
Ý nghĩa của ${pName} trong lá số, cùng nhận định tổng thể về phối cách tinh diệu này.

**【Luận giải chính tinh】**
Luận giải về chính tinh tại cung này theo hệ thống của Nghê Hải Hạ, trích dẫn quan điểm cụ thể.

**【Liên kết Tam Phương Tứ Chính】**
Ảnh hưởng của các cung vị trong Tam Phương Tứ Chính đến cung này.

**【Lời khuyên thực tế】**
Lời khuyên cụ thể dựa trên cung vị này.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject phân tích Tứ Hóa phi hóa
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // Tìm cung vị mà sao này tọa thủ
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar ? paName(palaceOfStar.name) : 'Cung không xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại Hạn' : 'Lưu Niên';
    const sName = starName(selectedSiHua.starName);
    const shName = sihuaName(selectedSiHua.siHua.startsWith('化') ? selectedSiHua.siHua : '化' + selectedSiHua.siHua);

    const prompt = `Xin phân tích ảnh hưởng phi hóa của 【${viewLabel} ${sName} ${shName}】, xuất kết quả theo cấu trúc sau:

**【Ý nghĩa cơ bản của ${shName}】**
Ý nghĩa cốt lõi của ${shName} trong hệ thống của Nghê Hải Hạ, cùng ý nghĩa đặc thù của ${sName} ${shName}.

**【Ảnh hưởng khi tọa cung】**
Khi ${sName} ${shName} tọa tại 【${palaceName}】, lĩnh vực do cung này chủ quản chịu ảnh hưởng ra sao, thầy Nghê luận giải như thế nào.

**【Đường bay phi hóa Tam Phương Tứ Chính】**
Sau khi ${shName} nhập ${palaceName}, ảnh hưởng liên kết tới Tam Phương Tứ Chính (cung đối diện, hai cung tam hợp).

**【Ảnh hưởng vận thế hiện tại】**
Dưới góc độ thời gian ${viewLabel}, ${shName} này ảnh hưởng cụ thể thế nào đến vận thế gần đây của mệnh chủ.

**【Lời khuyên thực tế】**
Lời khuyên hành động cụ thể dựa trên Tứ Hóa này.`;

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
      if (!res.ok) throw new Error('Yêu cầu thất bại');
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
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Bản mã nguồn mở không kèm API luận giải AI (/api/interpret), bạn cần tự triển khai để sử dụng, chi tiết xem mục "Bắt đầu nhanh" trong README. Bản thân việc lập lá số không cần bất kỳ API Key nào.' : 'Luận giải thất bại, vui lòng thử lại sau.' }]);
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
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang tạo luận giải Mệnh cách…</p>
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
                  Luận giải mệnh lý
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
            placeholder="Hỏi tiếp, ví dụ: Năm nay có thích hợp chuyển việc không?"
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
            {loading ? '…' : 'Hỏi tiếp'}
          </button>
        </div>
      </div>

    </div>
  );
}
