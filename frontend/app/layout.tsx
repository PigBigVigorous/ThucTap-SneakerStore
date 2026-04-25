import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "./Providers";
import Header from "./components/Header";
import ChatbotWidget from "./components/ChatbotWidget";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHOES. — Cửa hàng giày chính hãng",
  description: "Mua giày thể thao chính hãng Nike, Adidas, Puma... Giao hàng toàn quốc, freeship từ 5 triệu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body
        suppressHydrationWarning
        className={`${montserrat.className} antialiased bg-gray-50 text-gray-900 tracking-tight`}
      >
        <Providers>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
              },
            }}
          />

          {/* Header mới — tự ẩn trong /admin */}
          <Header />

          <div className="min-h-screen" suppressHydrationWarning>
            {children}
          </div>

          {/* Chatbot AI Widget — Tư vấn chọn giày, hiện trên mọi trang (trừ admin và shipper) */}
          <ChatbotWidget />
        </Providers>
      </body>
    </html>
  );
}