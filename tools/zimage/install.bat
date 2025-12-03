@echo off
REM Z-Image Server 설치 스크립트
REM 설치 위치: D:\ai\zimage
REM RTX 4070 GPU 최적화

echo ========================================
echo Z-Image Server 설치 시작
echo 설치 위치: D:\ai\zimage
echo ========================================

REM 설치 디렉토리 생성
if not exist "D:\ai" mkdir "D:\ai"
if not exist "D:\ai\zimage" mkdir "D:\ai\zimage"

cd /d D:\ai\zimage

REM Python 가상환경 생성
echo [1/5] Python 가상환경 생성...
python -m venv venv
call venv\Scripts\activate.bat

REM PyTorch 설치 (CUDA 12.1)
echo [2/5] PyTorch 설치 (CUDA 12.1)...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

REM 기본 패키지 설치
echo [3/5] 기본 패키지 설치...
pip install diffusers transformers accelerate safetensors
pip install fastapi uvicorn python-multipart pillow
pip install xformers

REM 서버 파일 복사
echo [4/5] 서버 파일 복사...
copy /Y "%~dp0server.py" "D:\ai\zimage\server.py"
copy /Y "%~dp0run.bat" "D:\ai\zimage\run.bat"
copy /Y "%~dp0requirements.txt" "D:\ai\zimage\requirements.txt"

REM 모델 디렉토리 생성
echo [5/5] 모델 디렉토리 생성...
if not exist "D:\ai\zimage\models" mkdir "D:\ai\zimage\models"

echo ========================================
echo 설치 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. D:\ai\zimage\run.bat 실행하여 서버 시작
echo 2. http://localhost:7860 에서 API 사용 가능
echo.
echo 첫 실행 시 SDXL 모델이 자동 다운로드됩니다 (~6GB)
echo ========================================

pause
