# A팀 배포 요청서

**작성일**: 2025-11-15
**작성자**: B팀 (Backend Team)
**요청 사항**: Mac mini 서버 코드 동기화 및 FastAPI 재시작

---

## 📋 요청 내용

B팀에서 **통합 Generator API (`/api/v1/generate`)** 구현을 완료했습니다.
Mac mini 서버(100.123.51.5:8000)에 새로운 코드를 반영하고 FastAPI를 재시작해주시기 바랍니다.

---

## ✅ 구현 완료 사항

### 1. 새로 추가된 파일

```
backend/
├── app/
│   ├── generators/                    # 신규 디렉토리
│   │   ├── __init__.py               # Generators 패키지
│   │   ├── base.py                   # BaseGenerator 클래스
│   │   └── brand_kit.py              # BrandKitGenerator 구현
│   └── api/v1/endpoints/
│       └── generate.py                # 통합 Generator API (신규)
└── test_generate_api.py              # E2E 테스트 스크립트 (신규)
```

### 2. 수정된 파일

```
backend/app/api/v1/router.py          # /generate 엔드포인트 라우터 등록
```

### 3. 새로운 API 엔드포인트

- **`POST /api/v1/generate`** (공식 외부 API)
  - P0 범위: `kind="brand_kit"` 지원
  - P1 범위: `product_detail`, `sns`, `presentation` 추가 예정

- **`/api/v1/agents/*`** (기존 엔드포인트)
  - 내부 전용으로 변경 (Swagger tags: "agents (deprecated)")
  - 향후 제거 예정

---

## 🔧 배포 절차

### Step 1: 코드 동기화

```bash
# Mac mini 서버에서 실행
cd /path/to/sparklio_ai_marketing_studio/backend

# K 드라이브(Windows)에서 최신 코드 pull 또는 sync
# (sync_to_macmini.sh 스크립트 사용 또는 수동 rsync)
git pull origin master
# 또는
rsync -av /mnt/k_drive/sparklio_ai_marketing_studio/backend/ ./
```

### Step 2: 의존성 확인 (필요 시)

```bash
# 새로운 패키지가 추가되지 않았으므로 skip 가능
# pip install -r requirements.txt
```

### Step 3: FastAPI 서버 재시작

```bash
# 현재 실행 중인 uvicorn 프로세스 종료
pkill -f "uvicorn app.main:app"

# 또는 systemd 사용 시
sudo systemctl restart sparklio-backend

# 또는 screen/tmux 세션에서 재시작
# (기존 방식에 따라 재시작)
```

### Step 4: 서버 정상 동작 확인

```bash
# API 문서 확인
curl http://100.123.51.5:8000/docs

# /generate 엔드포인트 확인
curl http://100.123.51.5:8000/openapi.json | grep -A 5 "/api/v1/generate"
```

---

## 🧪 테스트 방법

배포 후 다음 테스트 스크립트를 실행하여 검증해주세요:

```bash
cd /path/to/sparklio_ai_marketing_studio/backend
python test_generate_api.py
```

### 예상 결과

```
================================================================================
Brand Kit Generator E2E 테스트
================================================================================

[1] 사용자 등록...
✅ 사용자 등록 성공 (또는 이미 존재)

[2] 로그인...
✅ 로그인 성공, token: eyJhbGci...

[3] /api/v1/generate 호출 (kind=brand_kit)...

Status Code: 200

================================================================================
✅ Generator 실행 성공!
================================================================================

[Task ID] gen_abc123...
[Kind] brand_kit

[Text Blocks]
  - slogan: 자연주의 스킨케어 A - 자연의 시작
  - mission: ...
  - values: 자연, 건강, 지속가능성
  ...

[Editor Document]
  - documentId: doc_xyz789
  - type: brand_kit
  - brandId: brand_test_001
  - pages: 1개

  [Page 1]
    - id: page_1
    - name: Brand Kit Overview
    - size: 1080x1350
    - objects: 7개
      - BRAND_NAME: text
      - SLOGAN: text
      - MISSION: text
      - VALUES: text
      - TONE_OF_VOICE: text
      - COLOR_PRIMARY: shape
      - COLOR_SECONDARY: shape

💾 결과 저장: test_result_brand_kit.json
```

---

## 📚 참고 문서

- `docs/B_TEAM_WORK_ORDER.md` - B팀 작업 지시서 v2.0
- `docs/SYSTEM_ARCHITECTURE.md` - 시스템 아키텍처 (섹션 5.1.3)
- `docs/PHASE0/GENERATORS_SPEC.md` - Generator 스펙 (섹션 2, 3, 4.1)
- `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` - Editor JSON 구조 (섹션 5.2)

---

## ⚠️ 주의 사항

1. **프론트엔드는 수정 불필요**
   - 프론트엔드 코드(`frontend/lib/api-client.ts`)는 이미 `/api/v1/generate` API를 사용하도록 구현되어 있음
   - 백엔드만 재시작하면 즉시 통합 가능

2. **기존 `/agents/*` API**
   - 내부 전용으로 유지 (삭제하지 않음)
   - Swagger에서 "agents (deprecated)" 태그로 표시됨
   - P1에서 완전히 제거 예정

3. **Database 마이그레이션 불필요**
   - 신규 테이블 추가 없음 (P0 범위)
   - P1에서 `generation_jobs`, `documents`, `templates` 테이블 추가 예정

---

## 🚀 배포 완료 후 연락 주세요

테스트 결과 및 서버 상태를 확인 후 B팀에 연락 부탁드립니다.

**연락처**: B팀 채널 또는 이슈 트래커

---

**감사합니다!**
B팀 드림
