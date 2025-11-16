# Sparklio V4 롤백 절차 (Rollback Procedures)

## 목차
- [개요](#개요)
- [롤백 레벨](#롤백-레벨)
- [사전 준비사항](#사전-준비사항)
- [긴급 롤백 절차](#긴급-롤백-절차)
- [일반 롤백 절차](#일반-롤백-절차)
- [데이터베이스 롤백](#데이터베이스-롤백)
- [검증 절차](#검증-절차)
- [롤백 후 조치](#롤백-후-조치)

---

## 개요

이 문서는 Sparklio V4 시스템의 롤백 절차를 정의합니다. 배포 실패, 심각한 버그, 성능 저하 등의 상황에서 안전하게 이전 버전으로 복구하는 방법을 제공합니다.

### 롤백 시나리오
1. **긴급 롤백**: 서비스 장애 (500 에러율 > 5%, 응답시간 > 30초)
2. **성능 롤백**: 성능 저하 (응답시간 2배 이상 증가, CPU/메모리 90% 이상)
3. **기능 롤백**: 주요 기능 오류 (Agent 실행 실패율 > 20%)
4. **보안 롤백**: 보안 취약점 발견

---

## 롤백 레벨

### Level 1: 애플리케이션 롤백 (5-10분)
- 백엔드/프론트엔드 코드만 롤백
- 데이터베이스 스키마 변경 없음
- 가장 빠르고 안전한 롤백

### Level 2: 설정 롤백 (2-5분)
- 환경 변수, 설정 파일만 롤백
- 코드 변경 없이 설정만 복구

### Level 3: 데이터베이스 스키마 롤백 (30-60분)
- 데이터베이스 마이그레이션 롤백
- 데이터 손실 위험 있음
- 신중한 검토 필요

### Level 4: 전체 시스템 롤백 (60분 이상)
- 모든 컴포넌트 롤백
- Ollama, ComfyUI, 인프라 설정 포함

---

## 사전 준비사항

### 1. 배포 전 백업
모든 배포 전에 아래 항목을 백업해야 합니다:

```bash
# 현재 버전 태그 생성
git tag -a v4.0.$(date +%Y%m%d-%H%M%S) -m "Deployment backup"
git push origin --tags

# 데이터베이스 백업
pg_dump sparklio_v4 > backups/db_$(date +%Y%m%d_%H%M%S).sql

# 환경 설정 백업
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
cp frontend/.env.local frontend/.env.local.backup.$(date +%Y%m%d_%H%M%S)

# Redis 백업
redis-cli SAVE
cp /var/lib/redis/dump.rdb backups/redis_$(date +%Y%m%d_%H%M%S).rdb

# MinIO 버킷 스냅샷 (중요 자산만)
mc cp --recursive minio/sparklio-assets minio/sparklio-assets-backup-$(date +%Y%m%d)
```

### 2. 롤백 체크리스트

```markdown
- [ ] 현재 Git 커밋 해시 기록
- [ ] 현재 배포된 버전 확인
- [ ] 롤백할 타겟 버전 확인
- [ ] 데이터베이스 마이그레이션 변경사항 확인
- [ ] 관련 팀원에게 롤백 계획 공지
- [ ] 모니터링 대시보드 준비
```

---

## 긴급 롤백 절차

### 1단계: 즉시 조치 (1-2분)

```bash
# A. 즉시 이전 버전으로 코드 롤백
cd ~/sparklio_ai_marketing_studio

# 마지막 안정 버전 태그 확인
git tag --sort=-creatordate | head -n 5

# 롤백 (예: v4.0.20250115-1430 버전으로)
git checkout v4.0.20250115-1430

# 또는 마지막 커밋 취소
# git reset --hard HEAD~1
```

### 2단계: 서비스 재시작 (3-5분)

```bash
# Backend 롤백 및 재시작
cd backend
source venv/bin/activate || source .venv/bin/activate

# 의존성 복구 (변경된 경우)
pip install -r requirements.txt

# 서비스 재시작
pkill -f "uvicorn app.main:app"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &

# Frontend 롤백 및 재시작
cd ../frontend

# 의존성 복구 (변경된 경우)
npm install

# 재빌드 및 재시작
npm run build
pm2 restart sparklio-frontend || npm run start &
```

### 3단계: 헬스체크 (2분)

```bash
# Backend 헬스체크
curl http://localhost:8000/health
# 기대 결과: {"status": "ok", "version": "4.0.0"}

# Frontend 헬스체크
curl http://localhost:3000
# 기대 결과: HTML response

# 주요 API 엔드포인트 테스트
curl http://localhost:8000/api/v1/router/health
# 기대 결과: {"status": "healthy"}

# Prometheus 메트릭 확인
curl http://localhost:8000/metrics | grep "sparklio_http_requests_total"
```

---

## 일반 롤백 절차

### 단계별 롤백 (계획된 롤백)

#### 1. 롤백 계획 수립

```markdown
## 롤백 계획서

### 기본 정보
- 롤백 사유: [예: Agent 실행 실패율 25%]
- 현재 버전: v4.0.20250115-1600
- 롤백 대상 버전: v4.0.20250115-1430
- 담당자: [이름]
- 예상 소요 시간: 15분
- 영향 범위: Backend API 일부 기능

### 롤백 범위
- [ ] Backend 코드
- [ ] Frontend 코드
- [ ] Database 스키마
- [ ] 환경 설정
- [ ] 외부 서비스 (Ollama, ComfyUI)

### 위험 요소
- 진행 중인 워크플로우 중단 가능
- 최근 1시간 생성된 자산 손실 가능성

### 복구 계획
- 롤백 실패 시: 긴급 핫픽스 배포
- 데이터 손실 시: 백업에서 복구
```

#### 2. 사용자 공지

```bash
# 시스템 공지 (Optional - 추후 구현)
# 롤백 전 사용자에게 점검 안내
```

#### 3. 트래픽 대기 (선택사항)

```bash
# 진행 중인 요청 완료 대기
# 새로운 요청 차단 (추후 Load Balancer 설정)

# 현재 활성 워크플로우 확인
curl http://localhost:8000/metrics | grep "sparklio_active_workflows"
# 0이 될 때까지 대기 (최대 5분)
```

#### 4. 코드 롤백

```bash
cd ~/sparklio_ai_marketing_studio

# 백업 브랜치 생성 (현재 상태 보존)
git branch backup-before-rollback-$(date +%Y%m%d-%H%M%S)

# 롤백
git checkout [TARGET_VERSION_TAG]

# 변경사항 확인
git log --oneline -10
git diff HEAD~5 HEAD
```

#### 5. 의존성 및 설정 복구

```bash
# Backend 의존성
cd backend
pip install -r requirements.txt

# Frontend 의존성
cd ../frontend
npm install

# 환경 변수 확인 (변경된 경우 복구)
diff .env .env.backup.[TIMESTAMP]
```

#### 6. 서비스 재시작

```bash
# Backend
cd ~/sparklio_ai_marketing_studio/backend
pkill -f "uvicorn"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &

# Frontend
cd ../frontend
pm2 restart sparklio-frontend || npm run start &
```

#### 7. 검증 (아래 "검증 절차" 참조)

---

## 데이터베이스 롤백

### ⚠️ 주의사항
- 데이터베이스 롤백은 **데이터 손실 위험**이 있습니다
- 반드시 **백업 확인** 후 진행하세요
- **Production 환경**에서는 DBA 승인 필요

### 1. 마이그레이션 히스토리 확인

```bash
cd backend

# Alembic 마이그레이션 현재 상태 확인
alembic current

# 마이그레이션 히스토리
alembic history --verbose

# 특정 버전으로 롤백할 마이그레이션 확인
alembic show [REVISION_ID]
```

### 2. 데이터베이스 백업

```bash
# 전체 백업 (롤백 전 필수!)
pg_dump sparklio_v4 > backups/pre_rollback_$(date +%Y%m%d_%H%M%S).sql

# 스키마만 백업
pg_dump --schema-only sparklio_v4 > backups/schema_$(date +%Y%m%d_%H%M%S).sql

# 데이터만 백업
pg_dump --data-only sparklio_v4 > backups/data_$(date +%Y%m%d_%H%M%S).sql
```

### 3. 마이그레이션 롤백

```bash
# 한 단계 롤백
alembic downgrade -1

# 특정 버전으로 롤백
alembic downgrade [REVISION_ID]

# 예: 2024년 1월 10일 마이그레이션으로 롤백
alembic downgrade abc123def456

# 전체 롤백 (주의!)
# alembic downgrade base
```

### 4. 데이터 정합성 확인

```bash
# PostgreSQL 연결
psql sparklio_v4

-- 테이블 존재 확인
\dt

-- 주요 테이블 레코드 수 확인
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'workflows', COUNT(*) FROM workflows
UNION ALL
SELECT 'agents', COUNT(*) FROM agents
UNION ALL
SELECT 'assets', COUNT(*) FROM assets;

-- 외래키 제약 확인
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

### 5. 롤백 실패 시 복구

```bash
# 백업에서 복구
psql sparklio_v4 < backups/pre_rollback_20250115_140000.sql

# 또는 특정 테이블만 복구
pg_restore -t users backups/pre_rollback_20250115_140000.sql
```

---

## 검증 절차

### 자동화된 검증 스크립트

```bash
#!/bin/bash
# scripts/validate_rollback.sh

echo "=== Sparklio V4 Rollback Validation ==="

# 1. 서비스 헬스체크
echo "1. Health Check..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/health | jq -r '.status')
if [ "$BACKEND_HEALTH" = "ok" ]; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
    exit 1
fi

# 2. 데이터베이스 연결
echo "2. Database Connection..."
if psql -U sparklio_user -d sparklio_v4 -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection OK"
else
    echo "✗ Database connection failed"
    exit 1
fi

# 3. Redis 연결
echo "3. Redis Connection..."
if redis-cli ping | grep -q "PONG"; then
    echo "✓ Redis is responding"
else
    echo "✗ Redis connection failed"
    exit 1
fi

# 4. 주요 API 엔드포인트 테스트
echo "4. API Endpoint Tests..."

# SmartRouter 헬스체크
ROUTER_STATUS=$(curl -s http://localhost:8000/api/v1/router/health | jq -r '.status')
if [ "$ROUTER_STATUS" = "healthy" ]; then
    echo "✓ SmartRouter is healthy"
else
    echo "✗ SmartRouter test failed"
    exit 1
fi

# 5. Prometheus 메트릭 확인
echo "5. Metrics Check..."
if curl -s http://localhost:8000/metrics | grep -q "sparklio_http_requests_total"; then
    echo "✓ Prometheus metrics available"
else
    echo "✗ Metrics endpoint failed"
    exit 1
fi

# 6. 에러율 확인
echo "6. Error Rate Check..."
ERROR_RATE=$(curl -s http://localhost:8000/metrics | grep "sparklio_http_requests_total.*status_code=\"5" | awk '{sum+=$2} END {print sum}')
TOTAL_REQUESTS=$(curl -s http://localhost:8000/metrics | grep "sparklio_http_requests_total" | awk '{sum+=$2} END {print sum}')

if [ -z "$TOTAL_REQUESTS" ] || [ "$TOTAL_REQUESTS" -eq 0 ]; then
    echo "⚠ No requests recorded yet"
else
    ERROR_PERCENTAGE=$(echo "scale=2; ($ERROR_RATE / $TOTAL_REQUESTS) * 100" | bc)
    echo "Error rate: $ERROR_PERCENTAGE%"

    if (( $(echo "$ERROR_PERCENTAGE < 5.0" | bc -l) )); then
        echo "✓ Error rate is acceptable"
    else
        echo "✗ Error rate is too high: $ERROR_PERCENTAGE%"
        exit 1
    fi
fi

# 7. 외부 서비스 연결
echo "7. External Services..."

# Ollama
if curl -s http://100.123.51.5:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama is reachable"
else
    echo "⚠ Ollama connection issue (non-critical)"
fi

# ComfyUI
if curl -s http://100.120.180.42:8188/system_stats > /dev/null 2>&1; then
    echo "✓ ComfyUI is reachable"
else
    echo "⚠ ComfyUI connection issue (non-critical)"
fi

echo ""
echo "=== Validation Complete ==="
echo "All critical checks passed ✓"
```

### 수동 검증 체크리스트

```markdown
## 롤백 검증 체크리스트

### 시스템 레벨
- [ ] Backend 서버 응답 (http://localhost:8000/health)
- [ ] Frontend 접근 가능 (http://localhost:3000)
- [ ] PostgreSQL 연결 정상
- [ ] Redis 연결 정상
- [ ] MinIO 접근 정상

### 기능 레벨
- [ ] SmartRouter 라우팅 정상
- [ ] Agent 실행 정상 (간단한 테스트)
- [ ] 워크플로우 생성 가능
- [ ] 자산 업로드/다운로드 정상

### 성능 레벨
- [ ] 응답 시간 < 3초 (평균)
- [ ] CPU 사용률 < 70%
- [ ] 메모리 사용률 < 80%
- [ ] 에러율 < 5%

### 데이터 레벨
- [ ] 사용자 데이터 무결성
- [ ] 워크플로우 히스토리 보존
- [ ] 자산 파일 접근 가능
- [ ] 브랜드 학습 데이터 보존
```

---

## 롤백 후 조치

### 1. 모니터링 강화

```bash
# Prometheus 대시보드에서 30분간 모니터링
# - HTTP 요청 수 및 에러율
# - Agent 실행 성공률
# - 응답 시간 추이
# - 리소스 사용률

# Grafana 대시보드 URL (추후 설정)
# http://localhost:3001/d/sparklio-v4
```

### 2. 원인 분석

```markdown
## 롤백 사후 분석 보고서

### 기본 정보
- 롤백 일시: YYYY-MM-DD HH:MM:SS
- 롤백 사유: [구체적 사유]
- 영향받은 버전: v4.0.YYYYMMDD-HHMM
- 복구된 버전: v4.0.YYYYMMDD-HHMM

### 문제 원인
1. **근본 원인**:
2. **트리거**:
3. **영향 범위**:

### 재발 방지 대책
1. [ ] 테스트 케이스 추가
2. [ ] CI/CD 파이프라인 개선
3. [ ] 모니터링 알림 추가
4. [ ] 배포 전 체크리스트 업데이트

### 학습 사항
-
```

### 3. 코드 수정 및 재배포 계획

```bash
# 새로운 브랜치에서 핫픽스 작업
git checkout -b hotfix/issue-description

# 문제 수정
# ... code changes ...

# 테스트
pytest tests/

# 커밋
git commit -m "hotfix: Fix [issue description]"

# 배포 준비 (별도 배포 프로세스 문서 참조)
```

### 4. 팀 공유

```markdown
## 롤백 완료 공지

**상황**: [문제 요약]
**조치**: 롤백 완료 (v4.0.20250115-1600 → v4.0.20250115-1430)
**현재 상태**: 시스템 정상 작동 중
**영향**: [사용자/기능 영향 범위]
**다음 단계**: 원인 분석 및 핫픽스 준비

자세한 내용: [링크 to 사후 분석 보고서]
```

---

## 부록: 빠른 참조

### 긴급 롤백 커맨드 (복사해서 사용)

```bash
# 1. 코드 롤백
cd ~/sparklio_ai_marketing_studio
git checkout [LAST_STABLE_TAG]

# 2. Backend 재시작
cd backend
source venv/bin/activate || source .venv/bin/activate
pkill -f "uvicorn"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &

# 3. Frontend 재시작
cd ../frontend
pm2 restart sparklio-frontend || npm run start &

# 4. 헬스체크
curl http://localhost:8000/health
```

### 주요 연락처

| 역할 | 이름 | 연락처 |
|------|------|--------|
| 시스템 관리자 | [이름] | [연락처] |
| Backend 책임자 | [이름] | [연락처] |
| Frontend 책임자 | [이름] | [연락처] |
| DBA | [이름] | [연락처] |

---

**문서 버전**: 1.0
**최종 수정일**: 2025-01-15
**작성자**: A팀 (Infrastructure Team)
