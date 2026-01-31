// apps/web/src/lib/api.ts
import { Section, ProjectState } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function createProject(user_input: string): Promise<ProjectState> {
  const res = await fetch(`${API_BASE}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `서버 오류 (${res.status})`);
  }
  return data;
}

const GENERATE_TIMEOUT_MS = 20 * 60 * 1000; // 20분 (32B 모델 3개 생성에 5~15분 소요)

export async function generateCandidates(project_id: string, section: Section) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${API_BASE}/project/${project_id}/generate?section=${section}`,
      { method: "POST", signal: controller.signal }
    );
    let data: any;
    try {
      data = await res.json();
    } catch {
      return { error: `서버 응답 파싱 실패 (${res.status})` };
    }
    if (!res.ok) {
      return { error: data?.error || data?.detail || `서버 오류 (${res.status})` };
    }
    return data;
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === "AbortError") {
        return { error: "생성 시간이 초과되었습니다. (최대 20분) 잠시 후 다시 시도해주세요." };
      }
      return { error: e.message || "네트워크 오류가 발생했습니다." };
    }
    return { error: "알 수 없는 오류가 발생했습니다." };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function selectCandidate(project_id: string, section: Section, candidate_id: string): Promise<ProjectState> {
  const res = await fetch(`${API_BASE}/project/${project_id}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, candidate_id }),
  });
  return await res.json();
}
