@echo off
chcp 65001 > nul
title Sparklio B팀 (Backend) - 종료

echo ============================================
echo   Sparklio B팀 (Backend) 작업 종료
echo   %date% %time%
echo ============================================
echo.

cd /d K:\sparklio_ai_marketing_studio

:: 1. 변경 파일 확인
echo [1/5] 변경된 파일 확인...
git status --short
echo.

:: 2. 커밋 안 된 변경 확인
echo [2/5] 커밋되지 않은 변경사항...
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if %CHANGES% GTR 0 (
    echo [WARNING] 커밋되지 않은 변경사항 %CHANGES%개 있음!
    echo     git add . ^&^& git commit -m "메시지" 실행 필요
) else (
    echo     모든 변경사항 커밋됨: OK
)
echo.

:: 3. 오늘 커밋 이력
echo [3/5] 오늘 커밋 이력...
git log --oneline --since="midnight" --author="" | head -10
echo.

:: 4. Mac mini 배포 상태
echo [4/5] Mac mini 배포 상태 확인...
curl -s http://100.123.51.5:8000/health > nul 2>&1
if errorlevel 1 (
    echo [WARNING] 백엔드 API 응답 없음 - 배포 확인 필요
) else (
    echo     백엔드 API 작동 중: OK
)
echo.

:: 5. 인수인계 체크리스트
echo [5/5] 인수인계 체크리스트...
echo ============================================
echo   세션 종료 전 확인 사항:
echo ============================================
echo.
echo   [ ] 모든 변경사항 커밋했나요?
echo   [ ] Mac mini에 배포했나요?
echo   [ ] 일일 보고서 작성했나요? (docs/B_TEAM_*.md)
echo   [ ] CLAUDE.md 업데이트 필요한가요?
echo   [ ] 다음 작업 TODO 정리했나요?
echo.
echo   보고서 템플릿: docs/B_TEAM_DAILY_BACKEND_REPORT_YYYY-MM-DD.md
echo.
echo ============================================

pause
