import type { Metadata, Viewport } from "next";
import "./globals.css";

// 使用系统默认字体，避免从Google Fonts获取
const inter = { variable: "" };
const jetBrainsMono = { variable: "" };

export const metadata: Metadata = {
  title: "我的博客",
  description: "一个使用Next.js和React构建的现代博客应用",
};

// 使用单独的viewport导出，符合Next.js 16要求
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
