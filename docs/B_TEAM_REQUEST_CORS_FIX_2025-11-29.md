# B팀 요청서: Video Pipeline V2 프로젝트 생성 에러 수정

**작성일**: 2025-11-29
**작성자**: C팀 (Frontend)
**우선순위**: 🔴 P0 (Blocking)
**상태**: 대기중

---

## 요청 요약

Video Pipeline V2 End-to-End 테스트 진행 중 프로젝트 생성 API에서 500 Internal Server Error 발생.
**원인: Foreign Key Violation** - 더미 `brand_id`가 DB에 존재하지 않음.

---

## 에러 상세

### 브라우저 콘솔 (CORS로 표시됨)
```
Access to fetch at 'http://100.123.51.5:8000/api/v1/video6/projects'
from origin 'http://localhost:3001' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST http://100.123.51.5:8000/api/v1/video6/projects net::ERR_FAILED 500 (Internal Server Error)
```

### 실제 원인 (백엔드 로그)
```
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation)
insert or update on table "project_outputs" violates foreign key constraint "project_outputs_brand_id_fkey"

DETAIL: Key (brand_id)=(00000000-0000-0000-0000-000000000001) is not present in table "brands".
```

### 요청 본문
```json
{
  "brand_id": "00000000-0000-0000-0000-000000000001",
  "name": "핸드크림 겨울 할인 이벤트"
}
```

---

## 문제 분석

### CORS 테스트 결과
```bash
# Preflight 요청 - 성공 ✅
curl -X OPTIONS "http://100.123.51.5:8000/api/v1/video6/projects" \
  -H "Origin: http://localhost:3001" ...

# 응답: access-control-allow-origin: http://localhost:3001 ✅
```

### 실제 POST 요청 결과
```bash
curl -X POST "http://100.123.51.5:8000/api/v1/video6/projects" \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "00000000-0000-0000-0000-000000000001", "name": "Test Project"}'

# 응답: HTTP/1.1 500 Internal Server Error
# (500 에러 시 CORS 헤더가 없어서 브라우저는 CORS 에러로 표시)
```

---

## 요청 사항

### 방법 1: 테스트용 Brand 데이터 추가 (권장)
```sql
-- brands 테이블에 테스트용 레코드 추가
INSERT INTO brands (id, name, workspace_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Brand',
  (SELECT id FROM workspaces LIMIT 1),  -- 기존 workspace 사용
  NOW(),
  NOW()
);
```

### 방법 2: API에서 brand_id를 Optional로 변경
```python
# backend/app/schemas/video_timeline.py
class VideoProjectCreateRequest(BaseModel):
    brand_id: Optional[UUID] = None  # 필수 → Optional
    # ...
```

### 방법 3: 기존 Brand ID 조회 후 사용 (프론트엔드 수정)
```typescript
// 프론트엔드에서 실제 brand_id 조회 후 사용
const brands = await getBrands();
const brandId = brands[0]?.id;
```

---

## 현재 DB 상태 확인 명령

```bash
# brands 테이블 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-postgres psql -U sparklio -d sparklio_db -c 'SELECT id, name FROM brands LIMIT 5;'"

# 더미 brand_id 존재 여부 확인
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-postgres psql -U sparklio -d sparklio_db -c \"SELECT id FROM brands WHERE id = '00000000-0000-0000-0000-000000000001';\""
```

---

## 영향 범위

| 기능 | 상태 | 비고 |
|------|------|------|
| Video6 프로젝트 생성 | ❌ 차단 | FK Violation |
| Video6 PLAN 모드 | ❌ 차단 | 프로젝트 생성 실패로 진행 불가 |
| Video6 RENDER 모드 | ❌ 차단 | 프로젝트 생성 실패로 진행 불가 |
| CORS 설정 | ✅ 정상 | Preflight 통과 확인 |

---

## 빠른 해결을 위한 제안

**가장 빠른 방법**: DB에 테스트용 Brand 직접 추가

```bash
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-postgres psql -U sparklio -d sparklio_db -c \"
INSERT INTO brands (id, name, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Brand for Video6', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
\""
```

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 환경**: Windows Laptop (`localhost:3001`)
- **대상 서버**: Mac mini (`100.123.51.5:8000`)
