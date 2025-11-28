# B팀 긴급 요청서

**작성일**: 2025-11-28 (금요일) 10:15
**작성자**: C팀 (Frontend)
**요청 팀**: B팀 (Backend)
**긴급도**: 🔴 Critical

---

## 📋 요청 사항 요약

C팀에서 Frontend 작업 중 Backend 수정이 필요한 부분을 발견했습니다.
아래 3가지 항목은 **C팀 작업을 블로킹**하고 있어 긴급히 처리가 필요합니다.

---

## 🚨 Critical 요청 (즉시)

### 1. CORS 설정 추가 ⚡ 최우선

**파일**: `backend/app/main.py`
**작업 시간**: 0.5시간
**긴급도**: 🔴 Critical (C팀 블로킹)

**현재 문제**:
- Meeting AI에서 YouTube 링크 분석 시 10%에서 멈춤
- Brand Analyzer 실행 시 CORS 에러 발생
- Frontend에서 `credentials: 'include'` 사용 시 실패

**필요한 수정**:
```python
# backend/app/main.py (라인 35-45 근처)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://100.101.68.23:3000",  # Frontend Tailscale IP
    ],
    allow_credentials=True,  # ← 이 줄 추가 또는 True로 변경
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**확인 방법**:
```bash
# Mac mini에서
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://100.123.51.5:8000/api/v1/meetings

# 응답에 다음이 포함되어야 함:
# Access-Control-Allow-Credentials: true
```

---

### 2. Document API 응답 타입 검증 및 문서화

**파일**: `backend/app/api/v1/endpoints/documents.py`
**작업 시간**: 1시간
**긴급도**: 🟡 High (C팀 타입 정의 필요)

**현재 상황**:
- Frontend에서 Document API를 Mock으로 사용 중
- Backend 실제 응답 구조가 불확실

**요청 사항**:
1. **GET /api/v1/documents/{id}** 응답 구조 확인
2. **POST /api/v1/documents** 요청/응답 구조 확인
3. **PATCH /api/v1/documents/{id}** 요청/응답 구조 확인

**예상 응답 형식** (확인 부탁):
```typescript
// GET /api/v1/documents/{id}
{
  "document_id": "uuid",
  "workspace_id": "uuid",
  "project_id": "uuid",
  "title": "string",
  "content": {
    // Polotno JSON 구조
  },
  "thumbnail_url": "string",
  "version": 1,
  "created_at": "2025-11-28T10:00:00Z",
  "updated_at": "2025-11-28T10:00:00Z"
}

// POST /api/v1/documents (저장)
Request: {
  "workspace_id": "uuid",
  "project_id": "uuid",
  "title": "string",
  "content": { /* Polotno JSON */ }
}

Response: {
  "status": "created",
  "document_id": "uuid",
  "version": 1
}
```

**C팀에서 필요한 정보**:
- [ ] 실제 응답 구조 확인
- [ ] 에러 응답 형식 (400, 404, 500 등)
- [ ] 필수 필드 vs Optional 필드
- [ ] `content` 필드에 저장 가능한 최대 크기

---

### 3. File Upload API 엔드포인트 확인

**파일**: `backend/app/api/v1/endpoints/assets.py`
**작업 시간**: 1시간
**긴급도**: 🟡 High (C팀 구현 대기)

**현재 상황**:
- Frontend에서 파일 업로드 UI는 준비됨
- Backend 엔드포인트 존재 여부 불확실

**확인 필요**:
1. **POST /api/v1/assets** 엔드포인트 구현 여부
2. multipart/form-data 지원 여부
3. 지원 파일 형식 (이미지, 영상, 폰트 등)
4. 최대 파일 크기 제한

**예상 요청 형식**:
```typescript
// Frontend에서 전송
const formData = new FormData();
formData.append('file', file);  // File object
formData.append('brand_id', brandId);
formData.append('asset_type', 'image'); // 'image' | 'video' | 'font' | 'logo'

// POST /api/v1/assets
```

**필요한 응답 형식**:
```json
{
  "asset_id": "uuid",
  "url": "https://...",
  "file_name": "example.png",
  "file_size": 1024000,
  "mime_type": "image/png",
  "asset_type": "image",
  "created_at": "2025-11-28T10:00:00Z"
}
```

**만약 미구현이라면**:
- C팀에서 일단 Mock으로 작업 진행
- B팀 구현 완료 후 연동

---

## 📌 P1 요청 (이번 주 내)

### 4. IngestorAgent Vector DB 완성

**작업 시간**: 6시간
**긴급도**: 🟠 Medium

**현재 상황**:
- IngestorAgent 골격은 구현됨
- Vector DB (Qdrant) 연동 미완료

**요청 사항**:
- Brand 학습 데이터를 Vector DB에 저장
- RAG Agent가 참조할 수 있도록 임베딩 생성
- 테스트 케이스 작성

---

### 5. Brand Identity Canvas v2.0 구현

**작업 시간**: 5시간
**긴급도**: 🟠 Medium

**현재 상황**:
- Brand Identity Generator는 작동 중
- Canvas v2.0 템플릿이 더 풍부한 결과물 필요

**요청 사항**:
- 10개 이상의 Brand Identity 레이아웃 템플릿
- 컬러 팔레트 자동 생성 품질 향상
- 폰트 조합 추천 로직 개선

---

## 📊 우선순위 정리

| 순위 | 작업 | 예상 시간 | C팀 블로킹 | 완료 요청일 |
|------|------|---------|-----------|-----------|
| 🔴 P0-1 | CORS 설정 | 0.5h | ✅ Yes | 오늘 (11/28) |
| 🟡 P0-2 | Document API 문서화 | 1h | ⚠️ Partial | 11/29 (금) |
| 🟡 P0-3 | File Upload API 확인 | 1h | ⚠️ Partial | 11/29 (금) |
| 🟠 P1-1 | IngestorAgent Vector DB | 6h | ❌ No | 12/02 (월) |
| 🟠 P1-2 | Brand Identity Canvas v2.0 | 5h | ❌ No | 12/02 (월) |

---

## 🔄 C팀 작업 계획

**B팀 작업 완료 대기 중**:
- CORS 설정 → Meeting AI 완벽 연동 (C팀 2시간)
- Document API 문서화 → Document 실제 연동 (C팀 4시간)
- File Upload API → 파일 업로드 구현 (C팀 3시간)

**B팀 작업과 독립적으로 진행 가능**:
- Polotno Store 안정화 (2시간)
- Brand ID 연동 (1시간)
- Any 타입 제거 (3시간)
- Keyboard Shortcuts (3시간)
- Photos Tab (Unsplash) (4시간)
- Multi-page UI (5시간)

---

## 📞 커뮤니케이션

**응답 요청**:
- CORS 설정: 오늘 중 완료 가능 여부
- Document API: 현재 구현 상태 공유
- File Upload API: 구현 여부 확인

**회신 방법**:
- 이 문서에 댓글 또는
- `docs/B_TEAM_RESPONSE_2025-11-28.md` 파일 생성

---

**C팀 담당**: Claude (Frontend)
**작성 완료**: 2025-11-28 (금요일) 10:15

---

## ✅ 체크리스트 (B팀용)

**즉시 조치**:
- [ ] CORS 설정 추가 (0.5h)
- [ ] Mac mini Backend 재시작
- [ ] CORS 설정 확인 (curl 테스트)

**문서화**:
- [ ] Document API 응답 구조 확인
- [ ] File Upload API 구현 여부 확인
- [ ] C팀에 회신

**이번 주**:
- [ ] IngestorAgent Vector DB 완성
- [ ] Brand Identity Canvas v2.0 구현
