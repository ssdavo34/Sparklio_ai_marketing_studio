#!/bin/bash

##############################################################################
# Sparklio V4 Monitoring Infrastructure Startup Script
#
# This script starts all monitoring components:
# - FastAPI Backend (with Prometheus /metrics endpoint)
# - Prometheus Server
# - Grafana Dashboard
# - Apache Superset (optional)
#
# Usage:
#   ./start_monitoring.sh [--all|--backend|--prometheus|--grafana|--superset]
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
BACKEND_DIR="$PROJECT_ROOT/backend"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

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

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $service_name to start..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_info "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$service_name failed to start within timeout"
    return 1
}

##############################################################################
# Service Startup Functions
##############################################################################

start_backend() {
    log_info "Starting FastAPI Backend..."

    if check_port 8000; then
        log_warn "Port 8000 is already in use. Backend may already be running."
        return 0
    fi

    cd "$BACKEND_DIR"

    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    else
        log_error "Virtual environment not found. Run 'python -m venv venv' first."
        return 1
    fi

    # Start FastAPI server in background
    nohup python app/main.py > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"

    log_info "Backend started (PID: $BACKEND_PID)"

    # Wait for backend to be ready
    wait_for_service "http://localhost:8000/health" "Backend"

    # Test metrics endpoint
    if curl -s "http://localhost:8000/metrics" | grep -q "sparklio_"; then
        log_info "✓ Prometheus metrics endpoint is working"
    else
        log_warn "⚠ Metrics endpoint may not be working correctly"
    fi
}

start_prometheus() {
    log_info "Starting Prometheus..."

    if check_port 9090; then
        log_warn "Port 9090 is already in use. Prometheus may already be running."
        return 0
    fi

    # Check if Prometheus is installed
    if ! command -v prometheus &> /dev/null; then
        log_error "Prometheus is not installed. Install with: brew install prometheus"
        return 1
    fi

    # Check if prometheus.yml exists
    if [ ! -f "$MONITORING_DIR/prometheus.yml" ]; then
        log_warn "prometheus.yml not found. Creating default configuration..."
        create_prometheus_config
    fi

    # Start Prometheus
    nohup prometheus --config.file="$MONITORING_DIR/prometheus.yml" \
        --storage.tsdb.path="$MONITORING_DIR/prometheus_data" \
        --web.console.templates="$MONITORING_DIR/consoles" \
        --web.console.libraries="$MONITORING_DIR/console_libraries" \
        > "$LOG_DIR/prometheus.log" 2>&1 &

    PROMETHEUS_PID=$!
    echo $PROMETHEUS_PID > "$LOG_DIR/prometheus.pid"

    log_info "Prometheus started (PID: $PROMETHEUS_PID)"
    wait_for_service "http://localhost:9090/-/ready" "Prometheus"
}

start_grafana() {
    log_info "Starting Grafana..."

    if check_port 3001; then
        log_warn "Port 3001 is already in use. Grafana may already be running."
        return 0
    fi

    # Check if Grafana is installed
    if ! command -v grafana-server &> /dev/null; then
        log_error "Grafana is not installed. Install with: brew install grafana"
        return 1
    fi

    # Start Grafana
    nohup grafana-server \
        --homepath="$(brew --prefix grafana)/share/grafana" \
        --config="$(brew --prefix grafana)/etc/grafana/grafana.ini" \
        > "$LOG_DIR/grafana.log" 2>&1 &

    GRAFANA_PID=$!
    echo $GRAFANA_PID > "$LOG_DIR/grafana.pid"

    log_info "Grafana started (PID: $GRAFANA_PID)"
    log_info "Access Grafana at: http://localhost:3001"
    log_info "Default credentials: admin/admin"
}

start_superset() {
    log_info "Starting Apache Superset..."

    if check_port 8088; then
        log_warn "Port 8088 is already in use. Superset may already be running."
        return 0
    fi

    # Check if Superset is installed
    if ! command -v superset &> /dev/null; then
        log_error "Superset is not installed. See MONITORING_INFRASTRUCTURE_SETUP.md"
        return 1
    fi

    # Start Superset
    nohup superset run -h 0.0.0.0 -p 8088 --with-threads --reload \
        > "$LOG_DIR/superset.log" 2>&1 &

    SUPERSET_PID=$!
    echo $SUPERSET_PID > "$LOG_DIR/superset.pid"

    log_info "Superset started (PID: $SUPERSET_PID)"
    log_info "Access Superset at: http://localhost:8088"
}

##############################################################################
# Configuration Helpers
##############################################################################

create_prometheus_config() {
    mkdir -p "$MONITORING_DIR"

    cat > "$MONITORING_DIR/prometheus.yml" <<EOF
# Prometheus Configuration for Sparklio V4

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'sparklio-v4'

scrape_configs:
  # Sparklio Backend FastAPI
  - job_name: 'sparklio-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Optional: Add Celery worker metrics if available
  # - job_name: 'celery-workers'
  #   static_configs:
  #     - targets: ['localhost:9999']
EOF

    log_info "Created default prometheus.yml"
}

##############################################################################
# Service Status
##############################################################################

show_status() {
    echo ""
    log_info "=== Sparklio V4 Monitoring Status ==="
    echo ""

    # Check Backend
    if check_port 8000; then
        echo -e "${GREEN}✓${NC} Backend:     http://localhost:8000 (running)"
        echo -e "  Metrics:    http://localhost:8000/metrics"
    else
        echo -e "${RED}✗${NC} Backend:     Not running"
    fi

    # Check Prometheus
    if check_port 9090; then
        echo -e "${GREEN}✓${NC} Prometheus:  http://localhost:9090 (running)"
    else
        echo -e "${RED}✗${NC} Prometheus:  Not running"
    fi

    # Check Grafana
    if check_port 3001; then
        echo -e "${GREEN}✓${NC} Grafana:     http://localhost:3001 (running)"
    else
        echo -e "${RED}✗${NC} Grafana:     Not running"
    fi

    # Check Superset
    if check_port 8088; then
        echo -e "${GREEN}✓${NC} Superset:    http://localhost:8088 (running)"
    else
        echo -e "${RED}✗${NC} Superset:    Not running"
    fi

    echo ""

    # Show PIDs
    if [ -f "$LOG_DIR/backend.pid" ]; then
        echo "Backend PID:    $(cat $LOG_DIR/backend.pid)"
    fi
    if [ -f "$LOG_DIR/prometheus.pid" ]; then
        echo "Prometheus PID: $(cat $LOG_DIR/prometheus.pid)"
    fi
    if [ -f "$LOG_DIR/grafana.pid" ]; then
        echo "Grafana PID:    $(cat $LOG_DIR/grafana.pid)"
    fi
    if [ -f "$LOG_DIR/superset.pid" ]; then
        echo "Superset PID:   $(cat $LOG_DIR/superset.pid)"
    fi

    echo ""
}

##############################################################################
# Main Script
##############################################################################

case "${1:-all}" in
    --backend)
        start_backend
        show_status
        ;;
    --prometheus)
        start_prometheus
        show_status
        ;;
    --grafana)
        start_grafana
        show_status
        ;;
    --superset)
        start_superset
        show_status
        ;;
    --all)
        log_info "Starting all monitoring services..."
        start_backend
        start_prometheus
        start_grafana
        # start_superset  # Optional - uncomment if you want Superset
        show_status
        ;;
    --status)
        show_status
        ;;
    *)
        echo "Usage: $0 [--all|--backend|--prometheus|--grafana|--superset|--status]"
        echo ""
        echo "Options:"
        echo "  --all         Start all services (default)"
        echo "  --backend     Start FastAPI backend only"
        echo "  --prometheus  Start Prometheus only"
        echo "  --grafana     Start Grafana only"
        echo "  --superset    Start Apache Superset only"
        echo "  --status      Show service status"
        exit 1
        ;;
esac

log_info "Monitoring startup complete!"
log_info "Logs available in: $LOG_DIR"
