# Sparklio Mac mini Docker Setup

**최종 업데이트**: 2025-11-14 (금요일) 18:10
**담당**: Team A

---

## 개요

Mac mini M2에서 실행되는 Sparklio의 핵심 인프라 서비스들입니다:

- **PostgreSQL 15**: 메인 데이터베이스
- **Redis 7**: 캐시 및 Celery 작업 큐
- **MinIO**: S3 호환 오브젝트 스토리지
- **pgAdmin** (선택): PostgreSQL 웹 관리 도구

---

## 🚀 Quick Start

### 1단계: 환경 변수 설정

```bash
cd docker/mac-mini
cp .env.example .env
nano .env  # 또는 vi, vim, code 등으로 편집
```

**중요**: 모든 `change-this-*` 패스워드를 강력한 랜덤 비밀번호로 변경하세요.

```bash
# 강력한 비밀번호 생성 (macOS/Linux)
openssl rand -base64 32
```

### 2단계: Docker Compose 실행

```bash
# 기본 서비스 (PostgreSQL, Redis, MinIO) 시작
docker-compose up -d

# pgAdmin도 함께 시작하려면
docker-compose --profile admin up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio
```

### 3단계: 서비스 상태 확인

```bash
# 모든 컨테이너 상태 확인
docker-compose ps

# 헬스체크 확인
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

---

## 📋 서비스 접속 정보

### PostgreSQL
- **호스트**: `localhost` (Mac mini에서) / `sparklio-macmini` (Tailscale VPN)
- **포트**: `5432` (기본값, .env에서 변경 가능)
- **데이터베이스**: `sparklio`
- **사용자**: `sparklio`
- **비밀번호**: `.env` 파일의 `POSTGRES_PASSWORD`

**연결 문자열 예시**:
```
postgresql://sparklio:PASSWORD@localhost:5432/sparklio
```

### Redis
- **호스트**: `localhost` (Mac mini에서) / `sparklio-macmini` (Tailscale VPN)
- **포트**: `6379` (기본값)
- **비밀번호**: `.env` 파일의 `REDIS_PASSWORD`

**연결 문자열 예시**:
```
redis://:PASSWORD@localhost:6379/0
```

### MinIO
- **API 엔드포인트**: `http://localhost:9000`
- **웹 콘솔**: `http://localhost:9001`
- **Access Key**: `.env` 파일의 `MINIO_ROOT_USER`
- **Secret Key**: `.env` 파일의 `MINIO_ROOT_PASSWORD`

**자동 생성되는 버킷**:
- `videos`: 생성된 영상 파일
- `images`: 생성된 이미지 파일
- `audio`: 오디오 파일 (BGM, 내레이션)
- `documents`: 문서 파일 (PDF, PPT 등)
- `brands`: 브랜드 에셋 (로고, LoRA 모델 등)

### pgAdmin (선택)
- **웹 콘솔**: `http://localhost:5050`
- **이메일**: `.env` 파일의 `PGADMIN_EMAIL`
- **비밀번호**: `.env` 파일의 `PGADMIN_PASSWORD`

---

## 🔧 관리 명령어

### 서비스 시작/중지

```bash
# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d postgres redis

# 모든 서비스 중지
docker-compose down

# 서비스 중지 + 볼륨 삭제 (데이터 완전 삭제)
docker-compose down -v

# 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart postgres
```

### 데이터 백업

```bash
# PostgreSQL 백업
docker exec sparklio-postgres pg_dump -U sparklio sparklio > backup_$(date +%Y%m%d).sql

# PostgreSQL 복원
cat backup_20251114.sql | docker exec -i sparklio-postgres psql -U sparklio sparklio

# MinIO 백업 (mc 클라이언트 사용)
docker run --rm --network sparklio-network \
  -v $(pwd)/minio-backup:/backup \
  minio/mc:latest \
  mirror sparklio/videos /backup/videos
```

### 로그 관리

```bash
# 최근 100줄 로그 확인
docker-compose logs --tail=100

# 실시간 로그 스트리밍
docker-compose logs -f

# 특정 시간 이후 로그
docker-compose logs --since="2025-11-14T10:00:00"

# 로그 파일로 저장
docker-compose logs > sparklio_logs_$(date +%Y%m%d).log
```

---

## 🔍 문제 해결

### PostgreSQL 연결 오류

```bash
# 컨테이너 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 헬스체크 수동 실행
docker exec sparklio-postgres pg_isready -U sparklio

# 컨테이너 재시작
docker-compose restart postgres
```

### Redis 연결 오류

```bash
# Redis CLI 접속 테스트
docker exec -it sparklio-redis redis-cli -a YOUR_PASSWORD
> PING
PONG

# 메모리 사용량 확인
docker exec sparklio-redis redis-cli -a YOUR_PASSWORD INFO memory
```

### MinIO 접속 오류

```bash
# MinIO 헬스체크
curl http://localhost:9000/minio/health/live

# MinIO 로그 확인
docker-compose logs minio

# 버킷 목록 확인
docker run --rm --network sparklio-network \
  minio/mc:latest \
  ls sparklio --insecure
```

### 디스크 공간 부족

```bash
# 볼륨 사용량 확인
docker system df -v

# 사용하지 않는 이미지/컨테이너 정리
docker system prune -a

# 특정 볼륨 크기 확인
docker volume inspect sparklio-minio-data
```

---

## 🔐 보안 권장사항

1. **강력한 비밀번호 사용**: 모든 서비스에 32자 이상의 랜덤 비밀번호 설정
2. **방화벽 설정**: 외부 접근 차단, Tailscale VPN을 통해서만 접근
3. **.env 파일 보호**: `.env` 파일을 절대 Git에 커밋하지 않기
4. **정기 백업**: 매일 자동 백업 스크립트 설정
5. **로그 모니터링**: 의심스러운 접근 시도 감시
6. **Docker 이미지 업데이트**: 정기적으로 최신 보안 패치 적용

```bash
# Docker 이미지 업데이트
docker-compose pull
docker-compose up -d
```

---

## 📊 성능 모니터링

### 리소스 사용량 확인

```bash
# 모든 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너만 모니터링
docker stats sparklio-postgres sparklio-redis sparklio-minio
```

### 데이터베이스 성능 확인

```bash
# PostgreSQL 슬로우 쿼리 확인
docker exec sparklio-postgres psql -U sparklio sparklio -c \
  "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 현재 실행 중인 쿼리
docker exec sparklio-postgres psql -U sparklio sparklio -c \
  "SELECT pid, query, state, wait_event FROM pg_stat_activity WHERE state != 'idle';"
```

---

## 🔄 업그레이드 가이드

### PostgreSQL 메이저 버전 업그레이드

```bash
# 1. 현재 데이터 백업
docker exec sparklio-postgres pg_dump -U sparklio sparklio > pre_upgrade_backup.sql

# 2. 서비스 중지
docker-compose down

# 3. docker-compose.yml에서 이미지 버전 변경
# postgres:15-alpine -> postgres:16-alpine

# 4. 볼륨 삭제 (주의: 데이터 삭제됨)
docker volume rm sparklio-postgres-data

# 5. 새 버전으로 시작
docker-compose up -d postgres

# 6. 데이터 복원
cat pre_upgrade_backup.sql | docker exec -i sparklio-postgres psql -U sparklio sparklio
```

---

## 📞 지원

문제가 발생하면:
1. [MASTER_TODO.md](../../docs/WORK_PLANS/MASTER_TODO.md) 확인
2. [시스템 셋업 가이드](../../docs/WORK_PLANS/2025-11-15_SETUP_PLAN.md) 참조
3. GitHub Issues에 문제 보고

---

**작성자**: Team A
**참조 문서**: [2025-11-15_SETUP_PLAN.md](../../docs/WORK_PLANS/2025-11-15_SETUP_PLAN.md)
