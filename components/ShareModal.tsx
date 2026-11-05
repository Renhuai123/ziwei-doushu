'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import ShareCardCanvas, { captureShareCard, downloadDataURL } from './ShareCardCanvas';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  chart: ZiweiChart | null;
  birth: { year: string; month: string; day: string; hour: string; minute: string; gender: 'male' | 'female'; city?: string };
  highlight?: string;
}

export default function ShareModal({ open, onClose, shareUrl, chart, birth, highlight }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadImage = async () => {
    setDownloading(true);
    try {
      const dataURL = await captureShareCard();
      if (!dataURL) {
        alert('Không tạo được ảnh. Hãy chụp màn hình hoặc tải lại rồi thử lại.');
        return;
      }
      downloadDataURL(dataURL, `la-so-tu-vi_${Date.now()}.png`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={e => e.stopPropagation()}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* 顶部标题 */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(184,146,42,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3d2f10', letterSpacing: '0.12em' }}>
                ✦ Chia sẻ lá số
              </div>
              <button onClick={onClose}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.05)', color: '#666', fontSize: '16px',
                  cursor: 'pointer', lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* 卡片图预览（实际渲染） */}
            <div style={{ padding: '20px', background: '#fbf6e8', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              {chart && (
                <ShareCardCanvas chart={chart} birth={birth} highlight={highlight} />
              )}
            </div>

            <div style={{ padding: '0 20px 12px', textAlign: 'center', fontSize: '11px', color: '#a89b7c', letterSpacing: '0.05em' }}>
              ↑ Có thể chia sẻ ảnh lên các mạng xã hội
            </div>

            {/* 操作区 */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={downloadImage} disabled={downloading}
                style={{
                  padding: '14px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #d4a948 0%, #b8922a 100%)',
                  color: 'white', fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(184,146,42,0.3)',
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading ? 'Đang tạo ảnh…' : '⬇ Tải ảnh lá số'}
              </button>

              <button onClick={copyLink}
                style={{
                  padding: '14px', borderRadius: '10px',
                  border: '1px solid rgba(184,146,42,0.4)', background: 'white',
                  color: '#b8922a', fontSize: '14px', fontWeight: 500, letterSpacing: '0.12em',
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ Đã sao chép liên kết' : '🔗 Sao chép liên kết lá số'}
              </button>

              <div style={{
                fontSize: '11px', color: '#a89b7c', lineHeight: 1.7,
                padding: '10px 12px', background: 'rgba(184,146,42,0.05)',
                borderRadius: '8px', marginTop: '4px',
              }}>
                <div style={{ marginBottom: '4px', fontWeight: 600, color: '#8b6a14' }}>Cách chia sẻ:</div>
                · Tải ảnh để chia sẻ qua tin nhắn hoặc mạng xã hội<br />
                · Gửi liên kết cho bạn bè để mở biểu mẫu với thông tin sinh đã điền.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
