@echo off
chcp 65001 >nul
title Paper Agent - GPU Monitor
cd /d "%~dp0"

echo Paper Agent GPU 실시간 모니터 (2초마다 갱신)
echo 종료하려면 이 창을 닫으세요.
echo.

:loop
cls
echo [%date% %time%] GPU 상태
echo ----------------------------------------
where nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo nvidia-smi를 찾을 수 없습니다. NVIDIA 드라이버 경로를 확인하세요.
) else (
    nvidia-smi
)
echo ----------------------------------------
echo 2초 후 갱신...
timeout /t 2 /nobreak >nul
goto loop
