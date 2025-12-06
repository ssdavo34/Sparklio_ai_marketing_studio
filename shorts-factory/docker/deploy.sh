#!/bin/bash
# Shorts Factory 배포 스크립트
# Mac mini에서 실행

set -e

echo "=== Shorts Factory 배포 시작 ==="

# 프로젝트 디렉토리
PROJECT_DIR=~/sparklio_ai_marketing_studio/shorts-factory
DOCKER_DIR=$PROJECT_DIR/docker

cd $PROJECT_DIR

# Git Pull
echo "[1/4] Git Pull..."
git pull origin feature/editor-migration-polotno

# Docker Build
echo "[2/4] Docker Build..."
cd $DOCKER_DIR
/usr/local/bin/docker compose build

# Docker Stop (기존 컨테이너)
echo "[3/4] Docker Stop (if running)..."
/usr/local/bin/docker compose down 2>/dev/null || true

# Docker Start
echo "[4/4] Docker Start..."
/usr/local/bin/docker compose up -d

# 상태 확인
echo ""
echo "=== 배포 완료 ==="
/usr/local/bin/docker ps --filter "name=shorts-factory"

echo ""
echo "헬스체크: curl http://localhost:8002/health"
