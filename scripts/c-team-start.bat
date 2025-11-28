@echo off
chcp 65001 > nul
title Sparklio C팀 (Frontend) - 시작

echo ============================================
echo   Sparklio C팀 (Frontend) 작업 환경 시작
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

:: 3. Node.js 버전 확인
echo [3/6] Node.js 환경 확인...
node --version
npm --version
echo.

:: 4. 백엔드 API 연결 테스트
echo [4/6] 백엔드 API 연결 테스트...
curl -s http://100.123.51.5:8000/health > nul 2>&1
if errorlevel 1 (
    echo [WARNING] 백엔드 API 응답 없음 - B팀 확인 필요
) else (
    echo     백엔드 API: OK
)
echo.

:: 5. 프론트엔드 환경 확인
echo [5/6] 프론트엔드 환경 확인...
if exist "frontend\.env.local" (
    echo     frontend/.env.local: OK
) else (
    echo [WARNING] frontend/.env.local 파일 없음
)
if exist "frontend\node_modules" (
    echo     node_modules: OK
) else (
    echo [WARNING] node_modules 없음 - npm install 필요
)
echo.

:: 6. CLAUDE.md 안내
echo [6/6] Claude 작업 규칙...
echo     CLAUDE.md 파일을 반드시 읽고 시작하세요!
echo     위치: K:\sparklio_ai_marketing_studio\CLAUDE.md
echo.

echo ============================================
echo   C팀 작업 환경 준비 완료!
echo ============================================
echo.
echo   주요 명령어:
echo   - 개발 서버: cd frontend ^&^& npm run dev
echo   - 빌드: cd frontend ^&^& npm run build
echo   - 린트: cd frontend ^&^& npm run lint
echo.
echo   주요 작업 폴더:
echo   - components/canvas-studio/  (Polotno 에디터)
echo   - hooks/                      (React Hooks)
echo   - lib/                        (유틸리티)
echo.
echo   규칙 파일: CLAUDE.md
echo   보고서 폴더: docs/
echo.

pause
