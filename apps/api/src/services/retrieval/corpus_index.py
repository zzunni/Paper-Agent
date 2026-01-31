# apps/api/src/services/retrieval/corpus_index.py
import re
from typing import List, Tuple
from src.services.storage.corpus_store import corpus_all


def _score(text: str, query: str) -> int:
    q = [w for w in query.lower().split() if len(w) >= 2]
    t = text.lower()
    return sum(t.count(w) for w in q)


def _remove_citations(s: str) -> str:
    # (Author, 2020), [12], (2020) 같은 인용 흔적 제거
    s = re.sub(r"\[[0-9,\s]+\]", "", s)
    s = re.sub(r"\([^)]*\d{4}[^)]*\)", "", s)
    return s


def _remove_numbers(s: str) -> str:
    # 숫자/퍼센트/단위 같은 강한 사실 힌트 제거
    s = re.sub(r"\b\d+(\.\d+)?\b", "", s)
    s = re.sub(r"%", "", s)
    s = re.sub(r"\s{2,}", " ", s)
    return s.strip()


def _looks_too_specific(s: str) -> bool:
    # "We use 12,345 samples", "achieves 95%", "dataset X" 같은 문장 걸러내기
    low = s.lower()
    if re.search(r"\d", s):
        return True
    if any(k in low for k in ["accuracy", "f1", "auc", "mape", "rmse", "precision", "recall", "map@"]):
        return True
    if any(k in low for k in ["dataset", "benchmark", "hyperparameter", "learning rate", "epochs", "batch size"]):
        return True
    if any(k in low for k in ["we achieve", "we outperform", "significant improvement", "state-of-the-art"]):
        return True
    return False


def _split_sentences(text: str) -> List[str]:
    # 아주 단순 문장 분리 (영문 논문 기준)
    # 너무 공격적으로 자르지 않고 대략적인 구분만
    parts = re.split(r"(?<=[.!?])\s+", text.replace("\r\n", "\n"))
    out = []
    for p in parts:
        p = " ".join(p.strip().split())
        if len(p) < 60:
            continue
        out.append(p)
    return out


def _style_sanitize(text: str) -> List[str]:
    # 텍스트에서 "스타일 참고용 문장"만 추려내기
    text = _remove_citations(text)
    sents = _split_sentences(text)

    cleaned: List[str] = []
    for s in sents:
        s2 = _remove_numbers(s)
        if not s2:
            continue
        if _looks_too_specific(s2):
            continue
        # 너무 긴 문장은 잘라서 안정화
        if len(s2) > 220:
            s2 = s2[:220].rstrip() + "..."
        cleaned.append(s2)

    # 중복 제거(간단)
    uniq = []
    seen = set()
    for s in cleaned:
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        uniq.append(s)

    return uniq[:12]  # 한 파일에서 최대 12문장만 사용


def search_corpus(query: str, top_k: int = 5) -> List[Tuple[str, str]]:
    """
    returns: list of (filename, STYLE_SNIPPET)
    - raw content가 아니라 '스타일 전용'으로 정제된 문장 묶음만 반환
    """
    data = corpus_all()
    if not data:
        return []

    scored = []
    for fn, txt in data.items():
        s = _score(txt, query)
        if s <= 0:
            continue

        # 스타일 전용 문장 추출
        style_sents = _style_sanitize(txt)
        if not style_sents:
            continue

        snippet = " ".join(style_sents[:6])  # 파일당 6문장 정도만
        scored.append((fn, snippet, s))

    scored.sort(key=lambda x: x[2], reverse=True)
    return [(fn, snip) for fn, snip, _ in scored[:top_k]]