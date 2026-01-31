# apps/api/src/routes/generate.py
from fastapi import APIRouter, Query

from src.services.storage.project_store import load_project, save_project
from src.services.agent.orchestrator import get_selected_texts
from src.services.agent.prompt_builder import build_prompt
from src.services.retrieval.corpus_index import search_corpus
from src.services.llm.exaone_client import generate_3_candidates

from src.schemas.candidate import Candidate

router = APIRouter()

@router.post("/{project_id}/generate")
def generate(
    project_id: str,
    section: str = Query(..., description="introduction|dataset|method|conclusion"),
):
    state = load_project(project_id)
    if not state:
        return {"error": "project not found"}

    # stage 강제: 현재 단계만 생성
    if section != state.stage:
        return {"error": f"invalid section. current stage is '{state.stage}'"}

    selected = get_selected_texts(state)

    # 검색 쿼리: 사용자 입력 + (서론 선택되면) 서론 일부
    query_seed = state.user_input
    if selected.get("introduction"):
        query_seed = selected["introduction"][:500] + " " + state.user_input[:500]

    hits = search_corpus(query_seed, top_k=5)

    prompt = build_prompt(
        section=section,
        user_input=state.user_input,
        selected_sections=selected,
        corpus_hits=hits,
    )

    texts = generate_3_candidates(section, prompt)

    candidates = [
        Candidate(id=f"{section}_1", text=texts[0]),
        Candidate(id=f"{section}_2", text=texts[1]),
        Candidate(id=f"{section}_3", text=texts[2]),
    ]

    state.sections[section].candidates = candidates  # type: ignore
    save_project(state)

    return {
        "project_id": project_id,
        "section": section,
        "stage": state.stage,
        "candidates": [c.model_dump() for c in candidates],
    }
