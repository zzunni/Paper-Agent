"use client";

import React from "react";
import { Candidate, Section } from "../lib/types";
import { FileCheck } from "lucide-react";

const label: Record<Section, string> = {
  introduction: "서론",
  dataset: "데이터셋",
  method: "방법",
  conclusion: "결론",
};

export default function Candidates({
  section,
  candidates,
  onSelect,
  busy,
}: {
  section: Section;
  candidates: Candidate[];
  onSelect: (candidateId: string) => void;
  busy: boolean;
}) {
  if (candidates.length === 0) {
    return (
      <div className="message message-assistant">
        <div className="message-avatar">
          <FileCheck size={18} color="white" />
        </div>
        <div className="message-body">
          <div className="message-role">Paper Agent</div>
          <div className="message-content text-muted">
            {busy
              ? "후보를 생성하고 있습니다... (50~60초 소요)"
              : "아직 후보가 없습니다. 생성 버튼을 눌러 후보를 만드세요."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message message-assistant">
      <div className="message-avatar">
        <FileCheck size={18} color="white" />
      </div>
      <div className="message-body">
        <div className="message-role">Paper Agent</div>
        <div className="message-content">
          <strong>{label[section]} 후보 3개</strong>를 생성했습니다. 하나를 선택하세요.
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {candidates.map((c) => (
            <div
              key={c.id}
              className={`card-modern candidate-card`}
              onClick={() => !busy && onSelect(c.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span className="text-sm text-muted">{c.id}</span>
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(c.id);
                  }}
                >
                  <FileCheck size={14} />
                  선택
                </button>
              </div>
              <div className="message-content" style={{ fontSize: 14 }}>
                {c.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
