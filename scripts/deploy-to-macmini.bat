@echo off
chcp 65001 > nul
title Sparklio - Mac mini 배포

echo ============================================
echo   Sparklio Mac mini 배포
echo   %date% %time%
echo ============================================
echo.

:: 1. Git 상태 확인
echo [1/4] Git 상태 확인...
cd /d K:\sparklio_ai_marketing_studio
git status --short
echo.

set /p CONTINUE="커밋되지 않은 변경사항이 있으면 먼저 커밋하세요. 계속하시겠습니까? (Y/N): "
if /i not "%CONTINUE%"=="Y" (
    echo 배포 취소됨
    pause
    exit /b 0
)

:: 2. Mac mini 연결 확인
echo.
echo [2/4] Mac mini 연결 확인...
ping -n 1 100.123.51.5 > nul
if errorlevel 1 (
    echo [ERROR] Mac mini 연결 불가!
    echo     Tailscale 연결을 확인하세요.
    pause
    exit /b 1
)
echo     연결: OK
echo.

:: 3. SSH로 배포 실행
echo [3/4] Mac mini에서 배포 실행...
echo.
echo     다음 명령어를 Mac mini에서 실행합니다:
echo     1. cd ~/sparklio
echo     2. git pull origin
echo     3. docker-compose -f docker/mac-mini/docker-compose.yml restart backend
echo.

ssh woosun@100.123.51.5 "cd ~/sparklio && git pull origin && export PATH='/opt/homebrew/bin:/usr/local/bin:$PATH' && cd docker/mac-mini && docker-compose restart backend"

if errorlevel 1 (
    echo.
    echo [ERROR] 배포 실패!
    pause
    exit /b 1
)

:: 4. 헬스체크
echo.
echo [4/4] 배포 후 헬스체크...
timeout /t 5 /nobreak > nul
curl -s http://100.123.51.5:8000/health
echo.

echo ============================================
echo   배포 완료!
echo ============================================
echo.
echo   확인 명령어:
echo   - 로그: ssh woosun@100.123.51.5 "docker logs sparklio-backend --tail 50"
echo   - API: curl http://100.123.51.5:8000/health
echo.

pause
