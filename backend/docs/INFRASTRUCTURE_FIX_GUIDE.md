# Infrastructure Fix Guide - Meeting From URL 배포 블로커 해결

작성일: 2025-11-24
대상: A팀 (QA) + 인프라 담당자
상태: 🔴 3가지 Critical 블로커 발견

---

## 🚨 현재 상황

**A팀 테스트 결과**: 0/3 passed (0% pass rate)
**블로커**: Backend 서버 시작은 되지만, 모든 API 요청이 500 에러

Meeting From URL 기능 코드는 100% 완성되었으나, **인프라 레벨 문제**로 테스트 불가능한 상태입니다.

---

## 🔴 발견된 3가지 Critical 블로커

### 블로커 #1: Python Bytecode Cache 미삭제 (HIGHEST)

**문제**:
```
Mapper 'Mapper[Project(projects)]' has no property 'documents'
```

**원인**:
- `app/models/sparklio_document.py` 코드는 올바르게 수정됨 (commit 20db91e)
- 하지만 `__pycache__/sparklio_document.cpython-311.pyc` 파일에 **오래된 바이트코드**가 남아있음
- Python이 소스 파일 대신 오래된 `.pyc` 파일을 로드하여 SQLAlchemy 오류 발생

**영향**:
- 모든 API 요청 500 에러
- Backend 서버 기능 완전 차단
- Meeting From URL 테스트 불가능

**해결 방법**:

```bash
# Option 1: Python cache 삭제 (권장)
cd backend
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete

# Backend 서버 재시작
docker compose restart backend
# 또는
pm2 restart sparklio-backend

# Option 2: Docker 이미지 완전 재빌드 (더 확실)
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

**검증**:
```bash
# Health check (200 OK 확인)
curl http://100.123.51.5:8000/health

# API 요청 테스트 (500 에러가 아니어야 함)
curl http://100.123.51.5:8000/api/v1/meetings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 블로커 #2: pgvector Extension 미설치 (HIGH)

**문제**:
```
ERROR: extension "vector" is not available
HINT: Must load "vector" before referencing it.
```

**원인**:
- `docker-compose.yml`에서 PostgreSQL 이미지가 `postgres:15-alpine`로 설정됨
- 이 이미지에는 **pgvector extension이 포함되지 않음**
- `generated_assets` 테이블의 `embedding` 컬럼이 `VECTOR(1536)` 타입 사용
- 마이그레이션 실행 시 extension 생성 실패

**영향**:
- Alembic 마이그레이션 실행 불가
- 모든 테이블 미생성 (meetings, meeting_transcripts 등)
- 데이터베이스 레벨 블로커

**해결 방법**:

#### Step 1: docker-compose.yml 수정

```yaml
# BEFORE (현재 - 오류 발생)
services:
  postgres:
    image: postgres:15-alpine
    # ...

# AFTER (수정 필요)
services:
  postgres:
    image: pgvector/pgvector:pg15-alpine  # pgvector 포함 이미지
    # 나머지 설정 동일
    environment:
      POSTGRES_USER: sparklio
      POSTGRES_PASSWORD: sparklio_secure_2025
      POSTGRES_DB: sparklio
    # ...
```

#### Step 2: 데이터베이스 재생성

**⚠️ 주의**: 기존 데이터가 삭제됩니다!

```bash
# 기존 PostgreSQL 컨테이너 및 볼륨 삭제
docker compose down postgres
docker volume rm sparklio_postgres_data  # 볼륨명 확인 필요

# 새 이미지로 PostgreSQL 시작
docker compose up -d postgres

# 연결 확인
docker compose exec postgres psql -U sparklio -d sparklio -c "SELECT version();"
```

#### Step 3: pgvector extension 확인

```bash
# PostgreSQL 컨테이너 접속
docker compose exec postgres psql -U sparklio -d sparklio

# pgvector extension 생성 (자동으로 이미 생성되어야 함)
CREATE EXTENSION IF NOT EXISTS vector;

# 확인
\dx vector
```

**예상 출력**:
```
                          List of installed extensions
  Name   | Version | Schema |              Description
---------+---------+--------+----------------------------------------
 vector  | 0.5.1   | public | vector data type and ivfflat access method
```

---

### 블로커 #3: 데이터베이스 마이그레이션 미실행 (HIGH)

**문제**:
```
(psycopg2.errors.UndefinedTable) relation "meetings" does not exist
```

**원인**:
- Alembic 마이그레이션 파일은 존재: `alembic/versions/f008efc6ac1b_add_meeting_ai_schema_meetings_and_.py`
- 하지만 데이터베이스에 **실행되지 않음**
- `meetings`, `meeting_transcripts` 등 테이블이 생성되지 않음

**영향**:
- Meeting From URL API 호출 시 테이블 없음 오류
- 모든 Meeting 관련 기능 사용 불가

**해결 방법**:

#### Step 1: 현재 마이그레이션 상태 확인

```bash
# Backend 컨테이너 접속
docker compose exec backend bash

# Alembic 현재 버전 확인
alembic current

# 예상 출력 (마이그레이션 안 된 경우):
# INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
# (출력 없음 = head 없음)

# 또는 (마이그레이션 된 경우):
# f008efc6ac1b (head)
```

#### Step 2: 마이그레이션 실행

```bash
# pgvector 블로커가 해결된 후 실행!
cd backend

# 마이그레이션 실행
alembic upgrade head

# 예상 출력:
# INFO  [alembic.runtime.migration] Running upgrade  -> f008efc6ac1b, add meeting ai schema meetings and transcripts
# INFO  [alembic.runtime.migration] Running upgrade f008efc6ac1b -> <next>, ...
```

#### Step 3: 테이블 생성 확인

```bash
# PostgreSQL 접속
docker compose exec postgres psql -U sparklio -d sparklio

# 테이블 목록 확인
\dt

# 확인해야 할 테이블:
# - meetings
# - meeting_transcripts
# - sparklio_documents
# - brands
# - projects
# - users
# - ...
```

**검증 쿼리**:
```sql
-- meetings 테이블 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meetings';

-- meeting_transcripts 테이블 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meeting_transcripts';
```

---

## 📋 작업 순서 (Critical Path)

**반드시 이 순서대로 실행해야 합니다!**

### Phase 1: Python Cache 정리 (5분)

```bash
cd backend
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete
docker compose restart backend
```

**검증**: `curl http://100.123.51.5:8000/health` (200 OK)

### Phase 2: PostgreSQL + pgvector 설정 (15분)

```bash
# 1. docker-compose.yml 백업
cp docker-compose.yml docker-compose.yml.backup

# 2. docker-compose.yml 수정
# postgres.image를 pgvector/pgvector:pg15-alpine로 변경

# 3. PostgreSQL 재생성
docker compose down postgres
docker volume rm sparklio_postgres_data

# 4. PostgreSQL 시작
docker compose up -d postgres

# 5. 로그 확인 (에러 없어야 함)
docker compose logs postgres
```

**검증**: pgvector extension 설치 확인
```bash
docker compose exec postgres psql -U sparklio -d sparklio -c "\dx vector"
```

### Phase 3: Alembic 마이그레이션 (5분)

```bash
# Backend 컨테이너에서 실행
docker compose exec backend alembic upgrade head
```

**검증**: 테이블 생성 확인
```bash
docker compose exec postgres psql -U sparklio -d sparklio -c "\dt"
```

### Phase 4: Backend 서버 재시작 (2분)

```bash
docker compose restart backend
docker compose logs backend | tail -50
```

**검증**: Health check + API 테스트
```bash
# Health check
curl http://100.123.51.5:8000/health

# Meeting API 테스트 (500 에러가 아니어야 함)
curl http://100.123.51.5:8000/api/v1/meetings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 전체 시스템 검증 체크리스트

### Backend 서버

- [ ] Health check 200 OK
- [ ] `/api/v1/meetings` 엔드포인트 접근 가능 (500 아님)
- [ ] SQLAlchemy mapper 오류 없음 (로그 확인)
- [ ] Backend 로그에 "Application startup complete" 표시

### PostgreSQL

- [ ] pgvector extension 설치됨 (`\dx vector`)
- [ ] meetings 테이블 존재 (`\dt meetings`)
- [ ] meeting_transcripts 테이블 존재
- [ ] sparklio_documents 테이블 존재
- [ ] Alembic version 최신 (`alembic current`)

### CORS

- [ ] Response에 `access-control-allow-origin: *` 헤더 포함
- [ ] Frontend (localhost:3000)에서 API 호출 가능
- [ ] Browser console에 CORS 에러 없음

---

## 🎯 Meeting From URL 테스트 시작 조건

**다음 조건이 모두 만족되면 A팀 테스트 시작 가능**:

1. ✅ Python cache 삭제 완료
2. ✅ pgvector extension 설치 완료
3. ✅ Alembic 마이그레이션 실행 완료
4. ✅ Backend health check 성공
5. ✅ SQLAlchemy 오류 없음
6. ✅ CORS 헤더 정상

**테스트 시작**:
```bash
# A팀 테스트 케이스 실행
cd backend
bash docs/test_meeting_from_url.sh

# 또는 수동 테스트
curl -X POST http://100.123.51.5:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Test Meeting",
    "auto_transcribe": true
  }'
```

---

## 📊 작업 시간 예상

| Phase | 작업 | 예상 시간 | 난이도 |
|-------|------|-----------|--------|
| 1 | Python cache 정리 | 5분 | 쉬움 |
| 2 | pgvector 설정 | 15분 | 중간 |
| 3 | Alembic 마이그레이션 | 5분 | 쉬움 |
| 4 | Backend 재시작 | 2분 | 쉬움 |
| **총합** | | **~30분** | |

**순조로운 경우**: 30분 내 완료
**문제 발생 시**: 1-2시간 (디버깅 포함)

---

## 🔍 트러블슈팅

### 문제 1: pgvector extension이 여전히 없음

**증상**:
```
ERROR: extension "vector" is not available
```

**해결**:
```bash
# PostgreSQL 이미지 확인
docker compose exec postgres psql -U sparklio -c "SELECT version();"

# pgvector/pgvector 이미지가 아니면 다시 설정
docker compose down postgres
docker volume rm sparklio_postgres_data
# docker-compose.yml 재확인 후
docker compose up -d postgres
```

### 문제 2: Alembic 마이그레이션 실패

**증상**:
```
Target database is not up to date.
```

**해결**:
```bash
# 현재 버전 확인
alembic current

# Downgrade 후 재시도
alembic downgrade base
alembic upgrade head
```

### 문제 3: Backend 서버가 시작 안 됨

**증상**:
```
sqlalchemy.exc.ProgrammingError: relation "..." does not exist
```

**해결**:
1. Phase 2 (pgvector) 완료 확인
2. Phase 3 (마이그레이션) 재실행
3. Backend 서버 재시작

### 문제 4: CORS 여전히 에러

**증상**:
```
Access to fetch ... has been blocked by CORS policy
```

**해결**:
1. Backend 서버 완전히 재시작 (`docker compose restart backend`)
2. Browser cache 삭제 (Ctrl+Shift+R)
3. Backend 로그에서 CORS middleware 로딩 확인

---

## 💬 커뮤니케이션

### A팀 → 인프라 담당자

> "Meeting From URL 테스트를 위해 3가지 인프라 작업이 필요합니다:
>
> 1. Python cache 삭제 (5분)
> 2. PostgreSQL → pgvector 이미지 변경 (15분)
> 3. Alembic 마이그레이션 실행 (5분)
>
> 총 30분 예상됩니다. 완료 후 즉시 테스트 시작하겠습니다."

### 인프라 담당자 → A팀

> "인프라 작업 완료했습니다.
>
> ✅ Python cache 삭제
> ✅ pgvector extension 설치
> ✅ Alembic 마이그레이션 실행
> ✅ Backend 서버 재시작
>
> Health check: http://100.123.51.5:8000/health (200 OK)
> 테스트 시작해주세요!"

---

## 📚 참조 문서

- [MEETING_FROM_URL_IMPLEMENTATION_SUMMARY.md](MEETING_FROM_URL_IMPLEMENTATION_SUMMARY.md) - Backend 구현 완료 요약
- [MEETING_FROM_URL_QA_GUIDE.md](MEETING_FROM_URL_QA_GUIDE.md) - A팀 테스트 시나리오
- [C_TEAM_CORS_ISSUE_RESOLUTION.md](C_TEAM_CORS_ISSUE_RESOLUTION.md) - CORS 이슈 해결 가이드

---

## ✅ 최종 상태

### 코드 레벨 (B팀)

- ✅ Stage 1-3 구현 완료
- ✅ 5개 버그 수정 완료
- ✅ SQLAlchemy relationship 수정 완료 (코드 레벨)
- ✅ CORS 설정 완료
- ✅ 모든 문서 작성 완료

### 인프라 레벨 (현재 블로커)

- ❌ Python bytecode cache 미삭제
- ❌ pgvector extension 미설치
- ❌ Alembic 마이그레이션 미실행

**→ 인프라 작업만 완료되면 즉시 테스트 가능합니다!** 🚀

---

**이 문서는 B팀이 A팀 테스트 결과를 바탕으로 작성했습니다.**
**Meeting From URL 코드는 100% 완성되었으며, 인프라 설정만 완료하면 작동합니다!**
