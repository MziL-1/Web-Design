import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Blog Platform", template: "%s | Blog Platform" },
  description: "搭建你的个人博客，分享你的故事",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
