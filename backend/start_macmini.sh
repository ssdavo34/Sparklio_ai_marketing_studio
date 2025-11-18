#!/bin/bash
# ============================================================================
# Sparklio V4 Backend - Mac mini M2 자동 시작 스크립트
# ============================================================================
# 작성일: 2025-11-18
# 목적: 매일 아침 Backend 서버 시작 시 필요한 모든 작업 자동화
# 실행 방법 (맥미니에서):
#   cd ~/sparklio_ai_marketing_studio/backend
#   ./start_macmini.sh
#
# 또는 노트북에서 원격 실행:
#   ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && ./start_macmini.sh"
# ============================================================================

set -e  # 에러 발생 시 즉시 중단

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Backend 자동 시작 스크립트 실행"
log_info "프로젝트 루트: $PROJECT_ROOT"
log_info "Backend 디렉토리: $SCRIPT_DIR"

# 1. Git Pull (최신 코드 동기화)
log_info "Step 1/5: Git Pull (최신 코드 동기화)"
cd "$PROJECT_ROOT"
git fetch origin
git pull origin master
log_info "✅ Git Pull 완료"

# 2. 가상환경 활성화
log_info "Step 2/5: 가상환경 활성화"
cd "$SCRIPT_DIR"
if [ ! -d ".venv" ]; then
    log_error "가상환경이 존재하지 않습니다. 생성합니다..."
    python3 -m venv .venv
fi
source .venv/bin/activate
log_info "✅ 가상환경 활성화 완료 (Python: $(python --version))"

# 3. 의존성 설치
log_info "Step 3/5: 의존성 설치 (pip install -r requirements.txt)"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
log_info "✅ 의존성 설치 완료"

# 4. 기존 서버 프로세스 종료
log_info "Step 4/5: 기존 Backend 서버 프로세스 확인 및 종료"
EXISTING_PID=$(pgrep -f "uvicorn app.main:app" || true)
if [ -n "$EXISTING_PID" ]; then
    log_warn "기존 uvicorn 프로세스 발견 (PID: $EXISTING_PID). 종료합니다..."
    pkill -f "uvicorn app.main:app" || true
    sleep 2
    log_info "✅ 기존 프로세스 종료 완료"
else
    log_info "✅ 실행 중인 Backend 서버 없음"
fi

# 5. Backend 서버 시작
log_info "Step 5/5: Backend FastAPI 서버 시작 (백그라운드)"
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/sparklio_backend.log 2>&1 &
SERVER_PID=$!
log_info "✅ Backend 서버 시작 완료 (PID: $SERVER_PID)"

# 6. Health Check 대기
log_info "Backend 서버 Health Check 대기 (최대 30초)..."
HEALTH_CHECK_URL="http://localhost:8000/health"
MAX_RETRIES=15
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s --connect-timeout 2 $HEALTH_CHECK_URL > /dev/null 2>&1; then
        log_info "✅ Backend 서버 Health Check 성공!"
        curl -s $HEALTH_CHECK_URL | python -m json.tool
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Backend 서버 Health Check 실패. 로그를 확인하세요:"
    log_error "tail -50 /tmp/sparklio_backend.log"
    exit 1
fi

# 7. 최종 상태 출력
echo ""
log_info "================================================"
log_info "🚀 Sparklio Backend 서버 시작 완료!"
log_info "================================================"
log_info "서버 URL: http://100.123.51.5:8000"
log_info "API 문서: http://100.123.51.5:8000/docs"
log_info "Health Check: http://100.123.51.5:8000/health"
log_info "프로세스 PID: $SERVER_PID"
log_info "로그 위치: /tmp/sparklio_backend.log"
log_info ""
log_info "로그 실시간 확인: tail -f /tmp/sparklio_backend.log"
log_info "서버 종료: pkill -f 'uvicorn app.main:app'"
log_info "================================================"
