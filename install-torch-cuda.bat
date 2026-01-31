@echo off
echo PyTorch CUDA 12.1 설치 중... (약 2.4GB, 시간이 걸릴 수 있습니다)
echo.

call "%USERPROFILE%\miniconda3\Scripts\activate.bat" "%USERPROFILE%\miniconda3"
call conda activate geon-paper-agent

pip uninstall -y torch torchvision torchaudio 2>nul
pip install torch --index-url https://download.pytorch.org/whl/cu121

echo.
echo 설치 완료. GPU 확인 중...
python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPUs:', torch.cuda.device_count())"
echo.
pause
