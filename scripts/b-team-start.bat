@echo off
chcp 65001 > nul
title Sparklio B팀 (Backend) - 시작

echo ============================================
echo   Sparklio B팀 (Backend) 작업 환경 시작
echo   %date% %time%
echo ============================================
echo.

:: 1. 작업 디렉토리 확인
echo [1/6] 작업 디렉토리 확인...
cd /d K:\sparklio_ai_marketing_studio
if errorlevel 1 (
    echo [ERROR] 프로젝트 폴더를 찾을 수 없습니다!
    pause
    exit /b 1
)
echo     현재 위치: %cd%
echo.

:: 2. Git 상태 확인
echo [2/6] Git 상태 확인...
git fetch origin
git status --short
echo     브랜치:
git branch --show-current
echo.

:: 3. Mac mini 연결 테스트
echo [3/6] Mac mini 연결 테스트...
ping -n 1 100.123.51.5 > nul
if errorlevel 1 (
    echo [WARNING] Mac mini (100.123.51.5) 연결 불가 - Tailscale 확인 필요
) else (
    echo     Mac mini 연결: OK
)
echo.

:: 4. 백엔드 API 헬스체크
echo [4/6] 백엔드 API 헬스체크...
curl -s http://100.123.51.5:8000/health > nul 2>&1
if errorlevel 1 (
    echo [WARNING] 백엔드 API 응답 없음
) else (
    echo     백엔드 API: OK
)
echo.

:: 5. 환경변수 파일 확인
echo [5/6] 환경변수 파일 확인...
if exist "backend\.env" (
    echo     backend/.env: OK
) else (
    echo [ERROR] backend/.env 파일 없음!
)
if exist "docker\mac-mini\.env" (
    echo     docker/mac-mini/.env: OK
) else (
    echo [WARNING] docker/mac-mini/.env 파일 없음
)
echo.

:: 6. CLAUDE.md 안내
echo [6/6] Claude 작업 규칙...
echo     CLAUDE.md 파일을 반드시 읽고 시작하세요!
echo     위치: K:\sparklio_ai_marketing_studio\CLAUDE.md
echo.

echo ============================================
echo   B팀 작업 환경 준비 완료!
echo ============================================
echo.
echo   주요 명령어:
echo   - Mac mini SSH: ssh woosun@100.123.51.5
echo   - 백엔드 시작: cd backend ^&^& uvicorn app.main:app --reload
echo   - 테스트: pytest backend/tests
echo.
echo   규칙 파일: CLAUDE.md
echo   보고서 폴더: docs/
echo.

pause
