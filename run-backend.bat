@echo off
echo Paper Agent Backend Starting...
echo GPU 모니터 창을 별도로 실행합니다...
start "GPU-Monitor" cmd /k "cd /d %~dp0 && gpu-monitor.bat"

cd /d "%~dp0apps\api"
"%USERPROFILE%\miniconda3\envs\geon-paper-agent\python.exe" -m uvicorn src.main:app --reload --port 8000
pause
