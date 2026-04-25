'use client';

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

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
      href={`/product/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-50 group-hover:scale-105 transition-transform">
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
        <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[13px] font-extrabold text-indigo-600">{formatPrice(product.price)}</span>
          {product.in_stock ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
              Còn hàng
            </span>
          ) : (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-600 uppercase tracking-wider">
              Hết hàng
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
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
  // KHAI BÁO TẤT CẢ HOOKS Ở ĐẦU TIÊN (QUY TẮC BẮT BUỘC)
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý tư vấn của **Sneaker Store** 👟\nBạn muốn tìm đôi giày nào hôm nay?",
    },
  ]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // SAU KHI GỌI HOOKS MỚI ĐƯỢC KIỂM TRA ĐIỀU KIỆN RETURN
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/chatbot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: next.slice(-11, -1).map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );
      const data = await res.json();
      await new Promise(r => setTimeout(r, 600));

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
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-80 flex-col rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20 bg-white/95 backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
          style={{ height: "550px" }}
        >
          <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-xl shadow-inner">
                  👟
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-indigo-700 bg-emerald-400"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-white tracking-tight">Trợ lý Sneaker Store</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[11px] text-indigo-100 font-medium">Sẵn sàng tư vấn</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-all">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent px-4 py-6 space-y-5">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13.5px] text-white">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i}>
                  <AssistantBubble msg={msg} />
                </div>
              )
            )}
            {loading && <div className="p-3 text-xs text-gray-400">Đang trả lời...</div>}
            <div ref={bottomRef} className="h-2" />
          </div>

          <div className="border-t border-gray-100 bg-white/50 p-4">
            <div className="relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Hỏi bất cứ điều gì..."
                disabled={loading}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none"
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-indigo-600 text-white p-2 rounded-xl">➔</button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-3xl shadow-lg hover:scale-110 transition-all"
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
