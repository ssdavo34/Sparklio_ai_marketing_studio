# B팀 일일 작업 보고서

**작성일**: 2025-11-28 (금요일)
**작성자**: B팀 (Backend)
**브랜치**: `feature/editor-migration-polotno`

---

## 오늘 완료한 작업

### 1. [P0] C팀 긴급 요청 처리 ✅

#### 1.1 CORS 설정 수정 (Critical)

**문제**: `allow_origins=["*"]`와 `allow_credentials=True` 조합이 브라우저에서 차단됨

**해결**:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://100.101.68.23:3000",  # Frontend Tailscale
    "http://100.123.51.5:3000",   # Mac mini
    "http://192.168.0.101:3000",  # Laptop
]
```

**커밋**: `2a6f754`
**배포**: Mac mini 완료 ✅

**테스트 결과**:
```
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:3000
```

#### 1.2 Document API 문서화 ✅

- `GET /api/v1/documents/{docId}` - 이미 구현됨
- `POST /api/v1/documents/{docId}/save` - 이미 구현됨
- `PATCH /api/v1/documents/{docId}` - 이미 구현됨
- `DELETE /api/v1/documents/{docId}` - 이미 구현됨

**스키마 문서화**: `B_TEAM_RESPONSE_2025-11-28.md`에 상세 작성

#### 1.3 File Upload API 확인 ✅

- `POST /api/v1/assets` - multipart/form-data 지원
- MinIO 연동 완료
- presigned_url 자동 생성

**스키마 문서화**: `B_TEAM_RESPONSE_2025-11-28.md`에 상세 작성

---

### 2. [P1] Concepts API 확인 ✅

어제 C팀 요청 `POST /api/v1/concepts/from-prompt`가 이미 구현되어 있음 확인

- **파일**: `backend/app/api/v1/concepts.py`
- **라우터 등록**: `backend/app/api/v1/router.py` (line 137)
- **스키마**: ConceptV1 (CONCEPT_SPEC.md 기준)

**API 테스트 결과**:
```json
GET /api/v1/concepts/health
{
  "status": "ok",
  "service": "concepts-api",
  "version": "v2.0",
  "schema": "ConceptV1"
}
```

---

### 3. [P2] Asset 생성 로직 확인 ✅

모든 Asset 생성 Agent가 이미 구현되어 있음 확인:

| Agent | 파일 | 상태 |
|-------|------|------|
| ShortsScriptAgent | `agents/shorts_script.py` | ✅ 구현됨 |
| PresentationAgent | `agents/presentation.py` | ✅ 구현됨 |
| ProductDetailAgent | `agents/product_detail.py` | ✅ 구현됨 |
| InstagramAdsAgent | `agents/instagram_ads.py` | ✅ 구현됨 |

**Demo 파이프라인 연동**:
- `demo.py`의 `_generate_all_assets_for_concepts()` 함수에서 모든 Agent 호출

---

### 4. [P3] IngestorAgent Vector DB (pgvector) 연동 ✅

**변경사항**: Qdrant 대신 pgvector 사용 (별도 인프라 불필요)

**구현 내용**:

1. ✅ pgvector 모델 정의 (`models/embedding.py`)
   - BrandEmbedding, ConceptEmbedding, DocumentChunk
   - Vector(1536) - OpenAI embeddings 호환

2. ✅ VectorDBService 구현 (`services/vector_db.py`)
   - store_brand_embedding / search_brand_embeddings
   - store_concept_embedding / search_similar_concepts
   - store_document_chunks / search_document_chunks

3. ✅ IngestorAgent 연동 (`services/agents/ingestor.py`)
   - `store_vector` task 추가
   - `search_vector` task 추가
   - `vector_stats` task 추가

4. ✅ REST API 엔드포인트 (`api/v1/endpoints/embeddings.py`)
   - `POST /api/v1/embeddings/store`
   - `POST /api/v1/embeddings/search`
   - `GET /api/v1/embeddings/stats`
   - `DELETE /api/v1/embeddings/brand/{brand_id}`

5. ✅ Alembic 마이그레이션 (`alembic/versions/2025_11_28_vector_db_tables.py`)
   - IVFFlat 인덱스 생성

**커밋**: `a634a4c`

---

### 5. [P3] Brand Identity Canvas v2.0 템플릿 추가 ✅

**구현 내용**:

1. ✅ 10가지 스타일의 Brand Identity Canvas 템플릿
   - Minimal, Premium, Startup, Luxury, Tech
   - Lifestyle, F&B, Fashion, Eco, Creative

2. ✅ 각 템플릿 5-7페이지 구성
   - 표지, 브랜드 에센스, 타겟 고객, 비주얼 아이덴티티
   - 컬러 & 타이포그래피, 브랜드 보이스, 요약

3. ✅ 10개 컬러 팔레트 정의
   - Modern Blue, Warm Coral, Nature Green, Luxury Gold
   - Tech Purple, Soft Pastel, Bold Contrast, Ocean Breeze
   - Sunset Gradient, Minimal Gray

4. ✅ TemplateService 연동

**파일**:

- `backend/app/services/editor/brand_identity_templates.py` (신규)
- `backend/app/services/editor/template_service.py` (수정)

**커밋**: `f287928`

---

## 미완료 작업

없음 - P3까지 모두 완료

---

## 서버 상태

| 항목 | 상태 |
|------|------|
| Mac mini Backend | ✅ healthy (v4.0.0) |
| PostgreSQL | ✅ ok |
| MinIO Storage | ✅ ok |
| 최신 커밋 | `c4ff9af` |

---

## 커밋 이력

| 시간 | 커밋 | 설명 |
|------|------|------|
| 10:16 | `2a6f754` | CORS 설정 수정 |
| 10:22 | `c4ff9af` | C팀 회신 문서 작성 |
| 11:30 | `a634a4c` | Vector DB (pgvector) 연동 구현 |
| 12:00 | `f287928` | Brand Identity Canvas v2.0 템플릿 추가 |

---

## C팀 연동 사항

### 완료된 요청

1. ✅ CORS 설정 → C팀 Meeting AI / Brand Analyzer 테스트 가능
2. ✅ Document API 문서화 → C팀 타입 정의 가능
3. ✅ File Upload API 문서화 → C팀 파일 업로드 구현 가능

### C팀 다음 단계

- Meeting AI 연동 재테스트
- Document API 연동 (Polotno 저장/로드)
- File Upload 연동

---

## 내일 작업 계획 (11/29 토요일)

1. **Vector DB 마이그레이션 적용**
   - Mac mini에서 alembic upgrade 실행
   - pgvector 확장 활성화 확인

2. **Vector DB 기능 테스트**
   - 임베딩 저장/검색 API 테스트
   - IngestorAgent store_vector/search_vector 테스트

3. **Brand Identity Canvas 추가 개선** (선택)
   - 폰트 조합 추천 로직 개선
   - 템플릿 미리보기 썸네일 생성

---

**작성 완료**: 2025-11-28 (금요일) 12:10
**B팀 담당**: Claude (Backend)

---

## 오후 추가 작업 (15:00 업데이트)

### 6. [P1] Unsplash API 완전 배포 ✅

| 항목 | 상태 | 설명 |
|------|------|------|
| Settings 추가 | ✅ | `config.py`에 `UNSPLASH_ACCESS_KEY` |
| Mac mini .env | ✅ | API 키 직접 추가 |
| docker-compose | ✅ | 환경변수 전달 설정 |
| 테스트 | ✅ | 10,000+ 검색 결과 확인 |

**커밋**: `2d6c9ce` - feat: Settings에 UNSPLASH_ACCESS_KEY 추가

### 7. Mac mini Anthropic API 키 추가 ✅

기존에 빈 값으로 설정되어 있던 `ANTHROPIC_API_KEY`를 실제 키로 업데이트

### 8. 팀 작업 자동화 시스템 ✅

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | 모든 Claude 세션의 규칙 파일 |
| `scripts/b-team-start.bat` | B팀 작업 시작 |
| `scripts/b-team-end.bat` | B팀 작업 종료 |
| `scripts/c-team-start.bat` | C팀 작업 시작 |
| `scripts/c-team-end.bat` | C팀 작업 종료 |
| `scripts/deploy-to-macmini.bat` | Mac mini 배포 |
| `scripts/HANDOVER_TEMPLATE.md` | 인수인계 문서 템플릿 |

**커밋**: `cfb4c8d` - feat: 팀 작업 자동화 스크립트 및 규칙 파일 추가

### 9. C팀 지원 문서 작성 ✅

| 문서 | 용도 |
|------|------|
| `B_TEAM_RESPONSE_TO_C_TEAM_2025-11-28_PM.md` | Vector DB, Unsplash 완료 알림 |
| `FILE_UPLOAD_API_GUIDE.md` | File Upload API 연동 가이드 |

---

## 오후 커밋 이력

| 시간 | 커밋 | 설명 |
|------|------|------|
| 12:30 | `cfb4c8d` | 팀 자동화 스크립트 추가 |
| 15:02 | `2d6c9ce` | UNSPLASH_ACCESS_KEY 추가 |

---

## Mac mini API 상태 (15:10 확인)

```bash
# 백엔드
curl http://100.123.51.5:8000/health
{"status":"healthy","services":{"api":"ok","database":"ok","storage":"ok"}}

# Vector DB
curl http://100.123.51.5:8000/api/v1/embeddings/health
{"status":"ok","service":"embeddings-api","storage":"pgvector","dimensions":1536}

# Unsplash
curl http://100.123.51.5:8000/api/v1/unsplash/health
{"status":"ok","service":"unsplash-proxy","api_configured":true}
```

---

## 오늘 전체 완료 요약

| 우선순위 | 작업 | 상태 |
|---------|------|------|
| P0 | CORS 설정, Document API 문서화 | ✅ |
| P1 | Concepts API 확인 | ✅ |
| P1 | Unsplash API 프록시 + 배포 | ✅ |
| P2 | Asset Agent 확인 | ✅ |
| P3 | Vector DB (pgvector) 연동 | ✅ |
| P3 | Brand Identity Canvas v2.0 | ✅ |
| - | 팀 자동화 시스템 | ✅ |
| - | Mac mini API 키 정리 | ✅ |

---

## 저녁 추가 작업 (16:30 업데이트)

### 10. [P1] YouTube 10% 멈춤 이슈 해결 ✅

**문제**: YouTube URL 처리 시 10%에서 멈추는 현상

**원인**: yt-dlp에서 JavaScript 런타임 미인식
- "No supported JavaScript runtime could be found" 경고
- YouTube SABR 스트리밍 강제 적용으로 포맷 누락

**해결**:
1. `yt-dlp-ejs>=0.1.0` 플러그인 추가 (requirements.txt)
2. Dockerfile에 npm 및 Node.js stable 설치 추가
3. `--extractor-args` 옵션 제거 (JS 런타임 사용 시 불필요)

**테스트 결과**:
```
[jsc:node] Solving JS challenges using node
[info] dQw4w9WgXcQ: Downloading 1 format(s): 251
```

**커밋**: `0fc2dd3`

### 11. [P2] Alembic 마이그레이션 문제 해결 ✅

**문제**: DATABASE_URL의 % 문자가 configparser에서 interpolation 에러 발생

**해결**: `env.py`에서 `%` → `%%` 이스케이프 처리
```python
db_url = settings.DATABASE_URL.replace("%", "%%")
config.set_main_option("sqlalchemy.url", db_url)
```

**커밋**: `b6f3ca0`

### 12. [P2] Vector DB 실제 데이터 테스트 ✅

**문제**: SQLAlchemy `text()` 쿼리에서 PostgreSQL `::` 형변환 문법이 bindparam과 충돌

**해결**: `::vector` → `CAST(:param AS vector)` 변경

**테스트 결과**:
```bash
# 임베딩 저장
curl -X POST /api/v1/embeddings/auto-embed
{"success":true,"id":"8321b4b5-...","embedding_dimensions":1536}

# 유사도 검색
curl -X POST /api/v1/embeddings/auto-search
{"results":[{"content_text":"...혁신적인...","similarity":0.55}],"count":1}
```

**커밋**: `27440ab`, `28b6f14`

### 13. [P3] Gemini API 동작 확인 ✅

```python
>>> model.generate_content("Say just one word: OK")
"OK"
```

---

## 저녁 커밋 이력

| 시간 | 커밋 | 설명 |
|------|------|------|
| 16:08 | `0fc2dd3` | YouTube 다운로드 이슈 해결 (yt-dlp-ejs) |
| 16:10 | `b6f3ca0` | Alembic env.py % 이스케이프 처리 |
| 16:16 | `28b6f14` | Embeddings API agent.execute() 호출 수정 |
| 16:25 | `27440ab` | Vector DB 검색 쿼리 CAST 사용 |

---

## 미해결 이슈 현황

| 이슈 | 상태 | 비고 |
|------|------|------|
| YouTube 10% 멈춤 | ✅ 해결 | yt-dlp-ejs 플러그인 추가 |
| Thumbnail 시각적 불일치 | ⚠️ C팀 확인 필요 | Canvas와 썸네일 간 차이 |

---

**최종 업데이트**: 2025-11-28 16:30
