@echo off
chcp 65001 > nul
title Sparklio C팀 (Frontend) - 종료

echo ============================================
echo   Sparklio C팀 (Frontend) 작업 종료
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

:: 4. 빌드 테스트
echo [4/5] 빌드 상태 확인...
echo     (빌드 테스트는 시간이 걸리므로 수동 실행 권장)
echo     명령어: cd frontend ^&^& npm run build
echo.

:: 5. 인수인계 체크리스트
echo [5/5] 인수인계 체크리스트...
echo ============================================
echo   세션 종료 전 확인 사항:
echo ============================================
echo.
echo   [ ] 모든 변경사항 커밋했나요?
echo   [ ] TypeScript 에러 없나요?
echo   [ ] ESLint 에러 없나요?
echo   [ ] 일일 보고서 작성했나요? (docs/C_TEAM_*.md)
echo   [ ] CLAUDE.md 업데이트 필요한가요?
echo   [ ] B팀에 요청할 사항 정리했나요?
echo.
echo   보고서 템플릿: docs/C_TEAM_DAILY_FRONTEND_REPORT_YYYY-MM-DD.md
echo.
echo ============================================

pause
