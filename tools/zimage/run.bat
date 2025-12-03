@echo off
REM Z-Image Server 실행 스크립트

cd /d D:\ai\zimage
call venv\Scripts\activate.bat

echo ========================================
echo Z-Image Server 시작
echo 포트: 7860
echo ========================================

python server.py
