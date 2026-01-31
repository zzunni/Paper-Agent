import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "Paper Agent",
  description: "AI 논문 초안 작성 도우미",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
