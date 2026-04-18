'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatbotProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: number | null;
  image_url: string | null;
  in_stock: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  products?: ChatbotProduct[];
}

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function formatVND(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Very simple **bold** and newline → <br> renderer */
function renderMarkdown(text: string) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
  return { __html: html };
}

// ── Quick-reply chips ──────────────────────────────────────────────────────
const CHIPS = [
  { label: '👟 Nike dưới 2tr', msg: 'Tìm giày Nike dưới 2 triệu' },
  { label: '🔥 Adidas hot', msg: 'Giày Adidas đang bán chạy nhất' },
  { label: '🏃 Chạy bộ nam', msg: 'Gợi ý giày chạy bộ cho nam' },
  { label: '💰 Dưới 1.5tr', msg: 'Giày thể thao dưới 1 triệu 500 ngàn' },
];

// ── Greeting ───────────────────────────────────────────────────────────────
const GREETING: Message = {
  id: 'greeting',
  role: 'bot',
  text: 'Xin chào! 👋 Tôi là trợ lý AI của **Sneaker Store**.\n\nTôi có thể giúp bạn tìm giày theo thương hiệu, ngân sách hoặc mục đích sử dụng. Hãy cho tôi biết bạn đang tìm gì nhé!',
};

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
export default function ChatbotWidget() {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState<Message[]>([GREETING]);
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 320);
      setShowBadge(false);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  // ── Send message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Add user bubble
    const userMsg: Message = { id: uid(), role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);

    // Build history for API (previous turns only)
    const historyToSend: HistoryItem[] = [...history];
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message: msg, history: historyToSend }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = (err as { message?: string }).message;
        // Rate limit — show friendly message
        if (res.status === 429) {
          throw new Error(errMsg || 'Trợ lý AI đang bận. Vui lòng chờ vài giây và thử lại!');
        }
        throw new Error(errMsg || `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        success: boolean;
        reply: string;
        products?: ChatbotProduct[];
        message?: string;
      };

      if (!data.success) throw new Error(data.message || 'Lỗi không xác định');

      // Update conversation history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'assistant', content: data.reply },
      ]);

      // Add bot bubble
      const botMsg: Message = {
        id: uid(),
        role: 'bot',
        text: data.reply,
        products: data.products?.length ? data.products : undefined,
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      const isNetworkError = err instanceof Error && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'));
      const errorMsg: Message = {
        id: uid(),
        role: 'bot',
        text: isNetworkError
          ? '❌ Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
          : `❌ ${err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history]);

  // ── Key handler ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear chat ───────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([GREETING]);
    setHistory([]);
  };

  // ════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Toggle Button ─────────────────────────────────────────────── */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Đóng chatbot' : 'Mở chatbot tư vấn giày'}
        className={`
          fixed bottom-7 right-7 z-[9999] w-[60px] h-[60px] rounded-full border-0 cursor-pointer
          flex items-center justify-center
          bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
          shadow-[0_8px_32px_rgba(99,102,241,0.45)]
          transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          hover:scale-110 hover:shadow-[0_12px_40px_rgba(99,102,241,0.55)]
          ${!isOpen ? 'animate-[chatbot-pulse_2.5s_ease-in-out_infinite]' : ''}
        `}
        style={{ animationName: isOpen ? 'none' : undefined }}
      >
        {/* Badge */}
        {showBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white leading-none">
            1
          </span>
        )}
        {/* Icon */}
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M8 10H8.01M12 10H12.01M16 10H16.01M21 12C21 16.418 16.97 20 12 20C10.5 20 9.07 19.64 7.8 19.01L3 20L4.3 16.01C3.47 14.78 3 13.44 3 12C3 7.582 7.03 4 12 4C16.97 4 21 7.582 21 12Z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* ── Chat Window ───────────────────────────────────────────────── */}
      <div
        id="chatbot-window"
        role="dialog"
        aria-label="Cửa sổ tư vấn giày AI"
        aria-hidden={!isOpen}
        className={`
          fixed bottom-[104px] right-7 z-[9998]
          w-[380px] h-[580px] max-sm:w-[calc(100vw-24px)] max-sm:right-3 max-sm:bottom-[88px] max-sm:h-[70vh]
          bg-[#0f0f1a] rounded-[20px]
          border border-indigo-500/25
          shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]
          flex flex-col overflow-hidden
          transition-all duration-350 origin-bottom-right
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-[18px] py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4c1d95 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-xl flex-shrink-0">
            👟
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#1e1b4b]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 leading-none mb-0.5">Trợ lý AI — Sneaker Store</p>
            <p className="text-[11px] text-slate-400">Đang hoạt động · Tư vấn miễn phí</p>
          </div>
          {/* Clear button */}
          <button
            onClick={clearChat}
            title="Xóa lịch sử chat"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M3 6H21M19 6L18.1 19.1C18 20.2 17.1 21 16 21H8C6.9 21 6 20.2 5.9 19.1L5 6M10 11V17M14 11V17M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          id="chatbot-messages"
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}
          aria-live="polite"
        >
          {messages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-2">
              <MessageBubble msg={msg} />
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
              <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-bl-sm border border-indigo-500/20"
                style={{ background: 'linear-gradient(135deg,#1e1b4b,#1a1a2e)' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-[7px] h-[7px] rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick-reply chips */}
        <div className="flex gap-1.5 flex-wrap px-4 pb-3 flex-shrink-0">
          {CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.msg)}
              disabled={isLoading}
              className="text-[12px] px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/25 hover:text-indigo-300 transition-all whitespace-nowrap disabled:opacity-40"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2 items-end px-3.5 pb-3 flex-shrink-0 border-t border-indigo-500/15 pt-3"
          style={{ background: 'rgba(15,15,26,0.95)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập để hỏi tư vấn giày..."
            rows={1}
            disabled={isLoading}
            aria-label="Nhập tin nhắn"
            className="flex-1 bg-indigo-950/60 border border-indigo-500/25 rounded-xl px-3.5 py-2.5 text-slate-200 text-[13.5px] outline-none resize-none max-h-[100px] leading-[1.4] placeholder-slate-600 focus:border-indigo-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            aria-label="Gửi tin nhắn"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 hover:from-indigo-400 hover:to-purple-400 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes chatbot-pulse {
          0%,100% { box-shadow: 0 8px 32px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 8px 32px rgba(99,102,241,0.45), 0 0 0 12px rgba(99,102,241,0); }
        }
        #chatbot-messages::-webkit-scrollbar { width: 4px; }
        #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
        #chatbot-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.35); border-radius: 4px; }
      `}</style>
    </>
  );
}

// ── Sub-component: Single message bubble ───────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === 'bot';

  return (
    <>
      <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
        {/* Avatar (bot only) */}
        {isBot && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
        )}

        {/* Bubble */}
        <div
          className={`max-w-[78%] px-3.5 py-2.5 text-[13.5px] leading-[1.5] rounded-2xl word-break-all ${
            isBot
              ? 'rounded-bl-sm border border-indigo-500/20 text-slate-200'
              : 'rounded-br-sm text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
          }`}
          style={
            isBot
              ? { background: 'linear-gradient(135deg,#1e1b4b 0%,#1a1a2e 100%)' }
              : { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }
          }
          dangerouslySetInnerHTML={renderMarkdown(msg.text)}
        />
      </div>

      {/* Product cards */}
      {msg.products && msg.products.length > 0 && (
        <ProductGrid products={msg.products} />
      )}
    </>
  );
}

// ── Sub-component: Product cards grid ─────────────────────────────────────
function ProductGrid({ products }: { products: ChatbotProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-1 ml-9">
      {products.slice(0, 4).map(p => (
        <a
          key={p.id}
          href={`/product/${p.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title={p.name}
          className="block rounded-xl border border-indigo-500/20 overflow-hidden bg-[#1a1a2f] hover:border-indigo-400/50 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)] transition-all no-underline"
        >
          {/* Image */}
          <div className="w-full aspect-square bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center text-3xl overflow-hidden">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).textContent = '👟'; }}
              />
            ) : '👟'}
          </div>
          {/* Info */}
          <div className="px-2.5 py-2">
            <p className="text-[10px] text-indigo-400 leading-none mb-0.5">{p.brand}</p>
            <p className="text-[11px] font-semibold text-slate-200 leading-snug truncate mb-1">{p.name}</p>
            <p className="text-[12px] font-bold text-purple-400 leading-none">
              {p.price ? formatVND(p.price) : 'Liên hệ'}
            </p>
            <p className={`text-[9px] mt-1 ${p.in_stock ? 'text-green-400' : 'text-red-400'}`}>
              {p.in_stock ? '✓ Còn hàng' : 'Hết hàng'}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
