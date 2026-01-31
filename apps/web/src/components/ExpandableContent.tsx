"use client";

import React, { useState, useEffect } from "react";
import { Expand } from "lucide-react";

const MAX_PREVIEW_LENGTH = 250;


export default function ExpandableContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const isLong = content.length > MAX_PREVIEW_LENGTH;
  const preview = isLong ? content.slice(0, MAX_PREVIEW_LENGTH) + "..." : content;

  useEffect(() => {
    if (!showModal) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [showModal]);

  return (
    <>
      <div className={className}>
        <div className="message-content">{preview}</div>
        {isLong && (
          <button
            className="expand-btn"
            onClick={() => setShowModal(true)}
            type="button"
          >
            <Expand size={14} />
            전체 보기
          </button>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="입력한 연구 내용 전체 보기"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>입력한 연구 내용</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="닫기"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre>{content}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
