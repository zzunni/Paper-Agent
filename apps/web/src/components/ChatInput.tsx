"use client";

import React from "react";
import { Send } from "lucide-react";

export default function ChatInput({
  value,
  onChange,
  onGenerate,
  disabled,
  placeholder = "구현한 연구 내용을 입력하세요...",
}: {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onGenerate();
    }
  };

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={onGenerate}
          disabled={disabled || !value.trim()}
          title="생성"
        >
          <Send size={18} />
          {disabled ? "생성 중..." : "생성"}
        </button>
      </div>
      <p className="text-muted text-sm" style={{ marginTop: 8, marginBottom: 0 }}>
        Enter로 전송 · Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
