"use client";

import React from "react";
import { ProjectState, Section } from "../lib/types";
import { FileText } from "lucide-react";

const order: Section[] = ["introduction", "dataset", "method", "conclusion"];
const label: Record<Section, string> = {
  introduction: "서론",
  dataset: "데이터셋",
  method: "방법",
  conclusion: "결론",
};

export default function SelectedDraft({ state }: { state: ProjectState | null }) {
  return (
    <div className="draft-panel">
      <div className="draft-panel-header">
        <FileText size={18} />
        선택된 초안
      </div>
      {!state ? (
        <p className="text-muted text-sm">프로젝트를 시작하면 여기에 초안이 표시됩니다.</p>
      ) : (
        order.map((sec) => (
          <div key={sec} className="draft-section">
            <div className="draft-section-title">{label[sec]}</div>
            <div className="draft-section-content">
              {state.sections[sec].selected_text ?? "(아직 선택되지 않음)"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
