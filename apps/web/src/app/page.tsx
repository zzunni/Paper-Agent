"use client";

import React, { useMemo, useState } from "react";
import { FileText, User } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import Candidates from "../components/Candidates";
import SelectedDraft from "../components/SelectedDraft";
import ExpandableContent from "../components/ExpandableContent";
import { createProject, generateCandidates, selectCandidate } from "../lib/api";
import { ProjectState, Section } from "../lib/types";

const SECTION_ORDER: Section[] = ["introduction", "dataset", "method", "conclusion"];
const SECTION_LABELS: Record<Section, string> = {
  introduction: "서론",
  dataset: "데이터셋",
  method: "방법",
  conclusion: "결론",
};

function isSectionDone(section: Section, current: Section): boolean {
  return SECTION_ORDER.indexOf(section) < SECTION_ORDER.indexOf(current);
}

export default function Page() {
  const [input, setInput] = useState("");
  const [project, setProject] = useState<ProjectState | null>(null);
  const [busy, setBusy] = useState(false);

  const currentStage: Section = useMemo(() => (project ? project.stage : "introduction"), [project]);
  const currentCandidates = useMemo(() => {
    if (!project) return [];
    return project.sections[currentStage].candidates ?? [];
  }, [project, currentStage]);

  function handleNewProject() {
    setProject(null);
    setInput("");
  }

  async function generateCurrentStage() {
    if (!project) return;

    const gen = await generateCandidates(project.project_id, project.stage);
    if (gen?.error) {
      alert(gen.error);
      return;
    }
    if (!gen?.candidates?.length) {
      alert("후보가 생성되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [prev.stage]: {
            ...prev.sections[prev.stage],
            candidates: gen.candidates,
          },
        },
      };
    });
  }

  async function onGenerate() {
    setBusy(true);
    try {
      if (!project) {
        let p: ProjectState;
        try {
          p = await createProject(input.trim());
        } catch (e) {
          alert(e instanceof Error ? e.message : "프로젝트 생성 실패");
          return;
        }
        setProject(p);

        const gen = await generateCandidates(p.project_id, p.stage);
        if (gen?.error) {
          alert(gen.error);
          return;
        }
        if (!gen?.candidates?.length) {
          alert("후보가 생성되지 않았습니다. 백엔드 서버와 연결을 확인해주세요.");
          return;
        }
        setProject({
          ...p,
          sections: {
            ...p.sections,
            [p.stage]: { ...p.sections[p.stage], candidates: gen.candidates },
          },
        });
      } else {
        await generateCurrentStage();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onSelect(candidateId: string) {
    if (!project) return;
    setBusy(true);
    try {
      const updated = await selectCandidate(project.project_id, project.stage, candidateId);
      if ((updated as any)?.error) {
        alert((updated as any).error);
        return;
      }
      setProject(updated);

      const gen = await generateCandidates(updated.project_id, updated.stage);
      if (gen?.error) return;

      setProject({
        ...updated,
        sections: {
          ...updated.sections,
          [updated.stage]: { ...updated.sections[updated.stage], candidates: gen.candidates ?? [] },
        },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <Sidebar onNewProject={handleNewProject} />

      <div className="main">
        <div className="main-content">
          {!project ? (
            <div className="welcome">
              <div className="welcome-icon">
                <FileText size={32} color="white" />
              </div>
              <h1>Paper Agent</h1>
              <p>
                구현한 연구 내용을 입력하면 AI가 논문 초안을 단계별로 생성해드립니다.
                <br />
                서론 → 데이터셋 → 방법 → 결론 순서로 진행됩니다.
              </p>
              <div style={{ maxWidth: 560, margin: "0 auto" }}>
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onGenerate={onGenerate}
                  disabled={busy}
                  placeholder="예: 반도체 수율 예측을 위한 딥러닝 모델을 구현했습니다. WM-811K 데이터셋과 Carinthia SEM 이미지를 사용했고, CNN 기반 분류기를 적용했습니다..."
                />
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {/* User input message */}
              <div className="message message-user">
                <div className="message-avatar">
                  <User size={18} color="white" />
                </div>
                <div className="message-body">
                  <div className="message-role">나</div>
                  <ExpandableContent content={project.user_input} />
                </div>
              </div>

              {/* Stage indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                  padding: "8px 0",
                }}
              >
                <span className="text-muted text-sm">현재 단계:</span>
                <div className="stage-stepper">
                  {SECTION_ORDER.map((s) => (
                    <span
                      key={s}
                      className={`stage-chip ${
                        s === currentStage ? "active" : isSectionDone(s, currentStage) ? "done" : ""
                      }`}
                    >
                      {SECTION_LABELS[s]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Candidates */}
              <Candidates
                section={currentStage}
                candidates={currentCandidates}
                onSelect={onSelect}
                busy={busy}
              />
            </div>
          )}
        </div>

        {project && (
          <div className="input-area">
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={onGenerate}
                disabled={busy}
                title="현재 단계 후보 다시 생성"
              >
                <FileText size={16} />
                {busy ? "생성 중... (50~60초)" : "다시 생성"}
              </button>
            </div>
          </div>
        )}
      </div>

      {project && (
        <aside className="draft-panel-wrap" style={{ flexShrink: 0 }}>
          <SelectedDraft state={project} />
        </aside>
      )}
    </div>
  );
}

