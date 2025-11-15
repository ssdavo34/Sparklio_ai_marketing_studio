#!/bin/bash

##############################################################################
# Sparklio V4 맥미니 동기화 스크립트
#
# Windows (K:/) → Mac mini (100.123.51.5) 동기화
#
# 주의:
# - SSD 원본(K:/)에는 절대 push 금지!
# - 맥미니는 항상 SSD와 동기화 유지
#
# Usage:
#   ./sync_to_macmini.sh [--backend|--frontend|--docs|--all]
#
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
MAC_MINI_USER="woosun"
MAC_MINI_IP="100.123.51.5"
MAC_MINI_PATH="~/sparklio_ai_marketing_studio"
EXCLUDE_FILE="/tmp/rsync_exclude.txt"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create rsync exclude file
create_exclude_file() {
    cat > "$EXCLUDE_FILE" <<EOF
.git/
.venv/
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
node_modules/
.next/
.env.local
*.log
logs/
.DS_Store
Thumbs.db
EOF
}

# Sync function
sync_folder() {
    local folder=$1
    local source_path=$2
    local dest_path=$3

    log_info "Syncing $folder..."

    # Create tar archive (excluding venv, cache, etc)
    tar -czf "/tmp/${folder}_sync.tar.gz" \
        --exclude='.git' \
        --exclude='.venv' \
        --exclude='venv' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='*.log' \
        -C "$source_path" . 2>/dev/null || {
        log_warn "Some files were excluded (normal)"
    }

    # Transfer to Mac mini
    log_info "Transferring to Mac mini..."
    scp "/tmp/${folder}_sync.tar.gz" ${MAC_MINI_USER}@${MAC_MINI_IP}:~/

    # Extract on Mac mini
    log_info "Extracting on Mac mini..."
    ssh ${MAC_MINI_USER}@${MAC_MINI_IP} "
        mkdir -p ${dest_path} && \
        tar -xzf ~/${folder}_sync.tar.gz -C ${dest_path} && \
        rm ~/${folder}_sync.tar.gz
    "

    # Clean up local tar
    rm "/tmp/${folder}_sync.tar.gz"

    log_info "✓ $folder synced successfully"
}

# Sync backend
sync_backend() {
    log_info "=== Syncing Backend ==="
    sync_folder "backend" "K:/sparklio_ai_marketing_studio/backend" "${MAC_MINI_PATH}/backend"

    # Reinstall dependencies
    log_info "Installing Python dependencies..."
    ssh ${MAC_MINI_USER}@${MAC_MINI_IP} "
        cd ${MAC_MINI_PATH}/backend && \
        source .venv/bin/activate 2>/dev/null || python3 -m venv .venv && \
        source .venv/bin/activate && \
        pip install -q -r requirements.txt
    "
    log_info "✓ Backend dependencies installed"
}

# Sync frontend
sync_frontend() {
    log_info "=== Syncing Frontend ==="
    sync_folder "frontend" "K:/sparklio_ai_marketing_studio/frontend" "${MAC_MINI_PATH}/frontend"

    # Note: Frontend은 Laptop에서 실행하므로 맥미니에서는 의존성 설치 안함
    log_warn "Frontend runs on Laptop (192.168.0.101), not Mac mini"
}

# Sync docs
sync_docs() {
    log_info "=== Syncing Documentation ==="
    sync_folder "docs" "K:/sparklio_ai_marketing_studio/docs" "${MAC_MINI_PATH}/docs"
}

# Sync scripts
sync_scripts() {
    log_info "=== Syncing Scripts ==="
    sync_folder "scripts" "K:/sparklio_ai_marketing_studio/scripts" "${MAC_MINI_PATH}/scripts"

    # Make scripts executable
    ssh ${MAC_MINI_USER}@${MAC_MINI_IP} "chmod +x ${MAC_MINI_PATH}/scripts/*.sh"
}

# Test connection
test_connection() {
    log_info "Testing connection to Mac mini..."
    if ssh ${MAC_MINI_USER}@${MAC_MINI_IP} 'echo "Connection OK"' > /dev/null 2>&1; then
        log_info "✓ Mac mini connection successful"
        return 0
    else
        log_error "✗ Cannot connect to Mac mini (${MAC_MINI_IP})"
        exit 1
    fi
}

# Verify sync
verify_sync() {
    log_info "=== Verifying Sync ==="

    # Check backend files
    if ssh ${MAC_MINI_USER}@${MAC_MINI_IP} "test -d ${MAC_MINI_PATH}/backend/app"; then
        log_info "✓ Backend files exist"
    else
        log_error "✗ Backend files missing"
        return 1
    fi

    # Check requirements.txt
    if ssh ${MAC_MINI_USER}@${MAC_MINI_IP} "test -f ${MAC_MINI_PATH}/backend/requirements.txt"; then
        log_info "✓ requirements.txt exists"
    else
        log_error "✗ requirements.txt missing"
        return 1
    fi

    log_info "✓ Sync verification complete"
}

# Main
main() {
    local mode=${1:-all}

    echo "======================================"
    echo " Sparklio V4 맥미니 동기화"
    echo "======================================"
    echo "Mode: $mode"
    echo ""

    # Test connection first
    test_connection

    case "$mode" in
        --backend)
            sync_backend
            ;;
        --frontend)
            sync_frontend
            ;;
        --docs)
            sync_docs
            ;;
        --scripts)
            sync_scripts
            ;;
        --all)
            sync_backend
            sync_docs
            sync_scripts
            # sync_frontend  # Frontend은 Laptop에서 실행
            ;;
        --verify)
            verify_sync
            ;;
        *)
            echo "Usage: $0 [--backend|--frontend|--docs|--scripts|--all|--verify]"
            echo ""
            echo "Options:"
            echo "  --backend   Sync backend code only"
            echo "  --frontend  Sync frontend code only (to Laptop, not Mac mini)"
            echo "  --docs      Sync documentation only"
            echo "  --scripts   Sync scripts only"
            echo "  --all       Sync everything (default)"
            echo "  --verify    Verify sync status"
            exit 1
            ;;
    esac

    echo ""
    log_info "=== Sync Complete! ==="
    echo ""
    echo "Mac mini: ${MAC_MINI_IP}"
    echo "Path: ${MAC_MINI_PATH}"
    echo ""
    echo "Next steps:"
    echo "  1. Test backend: curl http://${MAC_MINI_IP}:8000/health"
    echo "  2. Start services: ssh ${MAC_MINI_USER}@${MAC_MINI_IP} 'cd ${MAC_MINI_PATH}/scripts && ./start_monitoring.sh'"
}

# Run
main "$@"
