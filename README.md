CMD 열어서
setx PYTHONUTF8 1
그 후 닫고 새창 띄워서 밑에거 실행


3-1) 코퍼스 텍스트 넣기

data/corpus/parsed/ 아래에 .txt 파일 최소 1개라도 넣어줘
(없어도 동작은 하지만 검색 히트가 “없음”으로 뜸)

3-2) 백엔드 실행
cd paper-draft-agent/apps/api
conda activate geon-paper-agent
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

3-3) 프론트 실행
cd paper-draft-agent/apps/web
npm install
npm run dev