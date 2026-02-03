# Paper Agent

AI 기반 학술 논문 초안 작성 도우미. 반도체 공정 분석 및 수율 예측 분야 논문을 **서론 → 데이터셋 → 방법 → 결론** 순서로 단계별 생성합니다.

---

## 1. 하드웨어 및 LLM

### 하드웨어
| 항목 | 사양 |
|------|------|
| **GPU** | NVIDIA RTX A6000 × 2장 |
| **VRAM** | 48GB × 2 = 96GB |
| **모델 병렬화** | `device_map="balanced"` 로 두 GPU에 균등 분배 |

### LLM
| 항목 | 내용 |
|------|------|
| **모델** | [LGAI-EXAONE/EXAONE-4.0-32B](https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-32B) |
| **프레임워크** | Hugging Face Transformers |
| **정밀도** | bfloat16 (기본) |
| **컨텍스트** | 131,072 토큰 |
| **언어** | 한국어, 영어, 스페인어 지원 |

환경 변수 `EXAONE_MODEL_ID`로 모델을 변경할 수 있습니다. (예: FP8 양자화 버전 `EXAONE-4.0-32B-FP8`)

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14, React 18)                                 │
│  - ChatGPT 스타일 UI, Paper Agent 브랜딩                          │
│  - http://localhost:3000                                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────────┐
│  Backend (FastAPI, Python)                                       │
│  - /project (생성, 조회)                                          │
│  - /project/{id}/generate (후보 3개 생성)                          │
│  - /project/{id}/select (후보 선택 → 다음 단계)                     │
│  http://localhost:8000                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Corpus Index  │   │ Prompt Builder  │   │ EXAONE LLM      │
│ (스타일 검색)  │   │ (섹션별 규칙)    │   │ (32B, 2×GPU)    │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 3. 논문 생성 로직

### 3.1 전체 흐름
1. 사용자가 구현한 연구 내용 입력
2. **서론** 후보 3개 생성 → 사용자 1개 선택
3. **데이터셋** 후보 3개 생성 → 선택
4. **방법** 후보 3개 생성 → 선택
5. **결론** 후보 3개 생성 → 선택
6. 선택된 초안이 우측 패널에 누적 표시

### 3.2 코퍼스 검색 (Retrieval)
- **위치**: `data/corpus/parsed/` 내 `.txt` 파일
- **역할**: 스타일 참고용 문장만 추출 (사실 정보는 사용자 입력·선택본만 사용)
- **방식**: 
  - 사용자 입력 + 이전 선택본을 쿼리로 사용
  - BM25 스타일 키워드 매칭 (`_score`)으로 관련 파일 검색
  - 인용·숫자·구체적 수치 제거 후 일반적인 문장만 스니펫으로 반환 (`_style_sanitize`)
  - 상위 5개 파일 × 최대 6문장씩 프로프트에 주입

### 3.3 프로프트 구성 (Prompt Builder)
- **섹션별 규칙**: `section_rules.py`에 문장 수, 포커스 항목 정의
- **사실 제약**: 사용자 입력·이전 선택본만 사실로 허용, 코퍼스는 스타일 전용
- **구성 요소**:
  - 사용자 구현 설명
  - 이전 선택 섹션들 (선택된 서론, 데이터셋, 방법)
  - 코퍼스 스니펫 (스타일 모방용)
  - 섹션별 포커스 포인트

### 3.4 LLM 생성
- **후보 수**: 3개
- **온도**: 0.3, 0.7, 0.95 (다양한 스타일 확보)
- **파라미터**: `top_p=0.9`, `repetition_penalty=1.05`, `no_repeat_ngram_size=3`
- **재시도**: 없음 (품질 판단은 사용자에게 위임)
- **예상 소요 시간**: 5~15분/섹션 (32B, A6000 2장 기준)

---

## 4. 디렉터리 구조

```
paper-agent/
├── apps/
│   ├── api/                    # 백엔드 (FastAPI)
│   │   ├── src/
│   │   │   ├── main.py         # 앱 진입점
│   │   │   ├── routes/         # project, generate, select
│   │   │   ├── services/
│   │   │   │   ├── agent/      # orchestrator, prompt_builder, section_rules
│   │   │   │   ├── llm/        # exaone_client
│   │   │   │   ├── retrieval/  # corpus_index
│   │   │   │   └── storage/    # project_store, corpus_store
│   │   │   └── schemas/
│   │   └── requirements.txt
│   └── web/                    # 프론트엔드 (Next.js)
│       └── src/
│           ├── app/
│           ├── components/
│           └── lib/
├── data/
│   ├── corpus/parsed/          # 코퍼스 .txt (스타일 참고)
│   └── projects/               # 프로젝트 상태 (JSON)
├── run-backend.bat             # 백엔드 + GPU 모니터 실행
├── gpu-monitor.bat             # nvidia-smi 실시간 모니터
└── install-torch-cuda.bat      # PyTorch CUDA 설치
```

---

## 5. 실행 방법

### 5.1 사전 요구사항
- Python 3.11+ (Conda/Miniconda 권장)
- Node.js 18+
- NVIDIA GPU 2장 (32B 모델용, FP8 또는 양자화 시 1장 가능)
- PyTorch CUDA 버전 (`pip install torch --index-url https://download.pytorch.org/whl/cu121`)

### 5.2 코퍼스 준비
```
data/corpus/parsed/ 아래에 .txt 파일 최소 1개
```
- 없어도 동작하지만, 검색 결과가 비어 스타일 참고가 줄어듭니다.

### 5.3 백엔드 실행
```bash
cd apps/api
conda activate geon-paper-agent
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
또는 프로젝트 루트에서 `run-backend.bat` 실행 (GPU 모니터 자동 실행)

### 5.4 프론트엔드 실행
```bash
cd apps/web
npm install
npm run dev
```
→ http://localhost:3000

### 5.5 환경 변수 (apps/api/.env)
| 변수 | 설명 | 기본값 |
|------|------|--------|
| `LLM_MODE` | local \| stub | local |
| `EXAONE_MODEL_ID` | Hugging Face 모델 ID | LGAI-EXAONE/EXAONE-4.0-32B |
| `TORCH_DTYPE` | bfloat16 \| float16 \| float32 | bfloat16 |
| `MAX_NEW_TOKENS` | 최대 생성 토큰 수 | 10000 |
| `MIN_CANDIDATE_CHARS` | 후보 최소 글자 수 (필터용) | 250 |

---

## 6. 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | FastAPI, Uvicorn, Pydantic |
| LLM | Transformers, Accelerate, PyTorch (CUDA) |
| Frontend | Next.js 14, React 18, TypeScript |
| UI | ChatGPT 스타일, Lucide React 아이콘 |

---

## 7. 라이선스 및 참고

- EXAONE 4.0: [LG AI Research](https://huggingface.co/LGAI-EXAONE)  
- 본 프로젝트: 학술 논문 초안 작성 보조 도구 (생성 텍스트는 사용자 검토 필수)
