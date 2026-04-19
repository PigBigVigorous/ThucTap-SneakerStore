"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number | null;
  image_url: string | null;
  in_stock: boolean;
  available_colors: string[];
  available_sizes: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number | null): string {
  if (!price) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  return (
    <a
      href={`/products/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">👟</div>
        )}
      </div>
      <div className="flex flex-col justify-between min-w-0">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold text-indigo-600">{formatPrice(product.price)}</span>
          {product.in_stock ? (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              Còn hàng
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
              Hết hàng
            </span>
          )}
        </div>
        {product.available_colors.length > 0 && (
          <p className="text-[10px] text-gray-400 truncate mt-0.5">
            Màu: {product.available_colors.join(", ")}
          </p>
        )}
        {product.available_sizes.length > 0 && (
          <p className="text-[10px] text-gray-400 truncate">
            Size: {product.available_sizes.join(", ")}
          </p>
        )}
      </div>
    </a>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
  // Render markdown-lite: **bold**
  const html = msg.content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return (
    <div className="flex flex-col gap-2">
      <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm">
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {msg.products && msg.products.length > 0 && (
        <div className="flex flex-col gap-2">
          {msg.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý tư vấn của **Sneaker Store** 👟\nBạn muốn tìm đôi giày nào hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Build history (last 10 turns) for API
    const history = next.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/chatbot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: history.slice(0, -1), // exclude current user msg (backend appends it)
          }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.success
            ? data.reply
            : data.message ?? "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
          products: data.products ?? null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Chat window ── */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-80 flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 bg-indigo-600 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">
              👟
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Sneaker Store AI</p>
              <p className="text-[11px] text-indigo-200">Tư vấn chọn giày 24/7</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4 space-y-3">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2 text-sm text-white">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <AssistantBubble key={i} msg={msg} />
              )
            )}
            {loading && (
              <div className="self-start flex gap-1 rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-3 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
              className="flex-1 rounded-full text-gray-900 border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95"
      >
        {open ? "✕" : "👟"}
      </button>
    </>
  );
}
