#!/bin/bash

##############################################################################
# Sparklio V4 Monitoring Infrastructure Shutdown Script
#
# This script stops all monitoring components gracefully
#
# Usage:
#   ./stop_monitoring.sh [--all|--backend|--prometheus|--grafana|--superset]
#
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

stop_service() {
    local service_name=$1
    local pid_file="$LOG_DIR/${service_name}.pid"

    if [ ! -f "$pid_file" ]; then
        log_warn "No PID file found for $service_name"
        return 1
    fi

    local pid=$(cat "$pid_file")

    if ps -p $pid > /dev/null 2>&1; then
        log_info "Stopping $service_name (PID: $pid)..."
        kill $pid

        # Wait for process to terminate
        local timeout=10
        local elapsed=0
        while ps -p $pid > /dev/null 2>&1 && [ $elapsed -lt $timeout ]; do
            sleep 1
            elapsed=$((elapsed + 1))
        done

        if ps -p $pid > /dev/null 2>&1; then
            log_warn "$service_name did not stop gracefully. Force killing..."
            kill -9 $pid
        fi

        log_info "$service_name stopped successfully"
    else
        log_warn "$service_name (PID: $pid) is not running"
    fi

    rm -f "$pid_file"
}

stop_by_port() {
    local port=$1
    local service_name=$2

    log_info "Checking for $service_name on port $port..."

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local pids=$(lsof -Pi :$port -sTCP:LISTEN -t)
        for pid in $pids; do
            log_info "Stopping $service_name (PID: $pid) on port $port..."
            kill $pid
            sleep 2
        done
        log_info "$service_name stopped"
    else
        log_warn "$service_name not running on port $port"
    fi
}

##############################################################################
# Main Script
##############################################################################

case "${1:-all}" in
    --backend)
        stop_service "backend"
        ;;
    --prometheus)
        stop_service "prometheus"
        ;;
    --grafana)
        stop_service "grafana"
        ;;
    --superset)
        stop_service "superset"
        ;;
    --all)
        log_info "Stopping all monitoring services..."
        stop_service "backend" || true
        stop_service "prometheus" || true
        stop_service "grafana" || true
        stop_service "superset" || true

        # Fallback: stop by port if PID files are missing
        log_info "Checking ports for any remaining services..."
        stop_by_port 8000 "Backend" || true
        stop_by_port 9090 "Prometheus" || true
        stop_by_port 3001 "Grafana" || true
        stop_by_port 8088 "Superset" || true

        log_info "All services stopped"
        ;;
    *)
        echo "Usage: $0 [--all|--backend|--prometheus|--grafana|--superset]"
        echo ""
        echo "Options:"
        echo "  --all         Stop all services (default)"
        echo "  --backend     Stop FastAPI backend only"
        echo "  --prometheus  Stop Prometheus only"
        echo "  --grafana     Stop Grafana only"
        echo "  --superset    Stop Apache Superset only"
        exit 1
        ;;
esac
