# apps/api/src/schemas/section.py
from pydantic import BaseModel
from typing import List, Optional
from src.schemas.candidate import Candidate

class SectionState(BaseModel):
    candidates: List[Candidate] = []
    selected_id: Optional[str] = None
    selected_text: Optional[str] = None  # ✅ 후보 목록이 바뀌어도 유지
