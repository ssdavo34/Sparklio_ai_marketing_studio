# Meeting AI & Brand Analyzer 테스트 가이드

## 📋 테스트 목적

**CORS credentials 추가 후 검증:**
- Meeting API YouTube 링크 분석 10% 멈춤 현상 해결 확인
- Brand Analyzer 업로드 후 자동 분석 동작 확인

---

## 🧪 Meeting AI 테스트

### 1. YouTube 링크 분석 테스트

**목표:** YouTube URL 입력 후 분석이 정상적으로 완료되는지 확인

**테스트 단계:**

1. **Studio V3 접속**
   ```
   http://localhost:3000/studio/v3
   ```

2. **Left Panel → Meeting Tab 이동**
   - Activity Bar에서 Meeting 아이콘 클릭

3. **YouTube URL 입력**
   ```
   예시 URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
   - URL 입력 필드에 YouTube 링크 입력
   - "Add" 버튼 클릭

4. **진행 상태 모니터링**
   - Meeting이 생성되고 자동으로 폴링 시작
   - 진행률 표시:
     - `created`: 10%
     - `downloading`: 30%
     - `caption_ready`: 50%
     - `ready_for_stt`: 60%
     - `transcribing`: 80%
     - `ready`: 100%

   **예상 동작:**
   - ✅ 10%에서 멈추지 않고 계속 진행
   - ✅ 3초마다 자동으로 상태 업데이트
   - ✅ `ready` 상태 도달 시 "✅ Meeting is ready!" 알림

5. **분석 결과 확인**
   - Meeting을 선택하고 "Analyze" 버튼 클릭
   - 분석 결과 표시 확인:
     - Summary
     - Campaign Ideas
     - Agenda, Decisions, Action Items

6. **Canvas로 전송 테스트**
   - "Send to Canvas" 버튼 클릭
   - Canvas에 분석 결과가 텍스트 요소로 표시되는지 확인

---

### 2. 파일 업로드 분석 테스트

**목표:** 오디오/비디오 파일 업로드 후 분석 동작 확인

**테스트 단계:**

1. **파일 선택**
   - "Click to upload" 영역 클릭
   - 또는 파일을 드래그 앤 드롭
   - 지원 형식: MP3, WAV, MP4, MOV (최대 100MB)

2. **Meeting 생성**
   - "Create Meeting" 버튼 클릭
   - Status: `uploaded`

3. **Transcribe & Analyze**
   - "Transcribe & Analyze" 버튼 클릭
   - 백엔드에서 STT → 분석 자동 실행
   - 완료 후 "✅ Transcribe & 분석 완료!" 알림

4. **결과 확인**
   - 분석 결과가 하단에 표시되는지 확인
   - Canvas로 전송 가능한지 확인

---

## 🎨 Brand Analyzer 테스트

### 1. 브랜드 이미지 업로드 및 자동 분석

**목표:** 브랜드 이미지 업로드 후 자동으로 분석이 시작되는지 확인

**테스트 단계:**

1. **Studio V3 접속**
   ```
   http://localhost:3000/studio/v3
   ```

2. **Left Panel → Brand Tab 이동**
   - Activity Bar에서 Brand 아이콘 클릭

3. **이미지 업로드**
   - "Click to upload" 또는 드래그 앤 드롭
   - 지원 형식: PNG, JPG, JPEG, GIF, WebP (최대 10MB)

4. **자동 분석 시작 확인**
   - 업로드 완료 후 자동으로 분석 시작되는지 확인
   - 로딩 인디케이터 표시 확인

5. **분석 결과 확인**
   - 색상 팔레트 추출
   - 브랜드 키워드
   - 분위기/스타일
   - 타겟 오디언스

6. **Vector DB 저장 확인**
   - 분석 결과가 `brand_embeddings` 테이블에 저장되는지 확인
   - 백엔드 로그에서 임베딩 생성 확인

---

## ✅ 검증 체크리스트

### Meeting AI

- [ ] YouTube URL 입력 후 10%에서 멈추지 않음
- [ ] 진행률이 정상적으로 업데이트됨 (10% → 30% → 50% → 60% → 80% → 100%)
- [ ] `ready` 상태 도달 시 알림 표시
- [ ] Analyze 버튼으로 분석 결과 생성
- [ ] 분석 결과가 Canvas로 정상 전송됨
- [ ] 파일 업로드 후 Transcribe & Analyze 동작
- [ ] CORS 에러 없이 API 호출 성공 (`credentials: 'include'` 정상 동작)

### Brand Analyzer

- [ ] 이미지 업로드 후 자동 분석 시작
- [ ] 분석 결과 표시 (색상, 키워드, 분위기 등)
- [ ] Vector DB에 임베딩 저장 확인
- [ ] CORS 에러 없이 API 호출 성공

---

## 🐛 알려진 이슈 (Before Fix)

### Meeting AI - YouTube 링크 10% 멈춤 현상

**증상:**
- YouTube URL 입력 후 `created` 상태(10%)에서 진행되지 않음
- 폴링은 계속 진행되지만 백엔드에서 상태 업데이트 없음

**원인:**
- CORS credentials 미설정으로 인한 세션 인증 실패
- 백엔드에서 `allow_credentials=True` 설정했으나 프론트엔드에서 `credentials: 'include'` 누락

**해결:**
```typescript
// lib/api/meeting-api.ts
const response = await fetch(`${MEETING_API_BASE}/meetings/url`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ✅ 추가
  body: JSON.stringify(data),
});
```

---

## 📊 B팀 완료 보고 (2025-11-28)

**완료 내용:**
- ✅ Unsplash API 프록시 구현 완료 (`/api/v1/unsplash/search`)
- ✅ Vector DB 테이블 생성 완료 (`brand_embeddings`, `concept_embeddings`, `document_chunks`)
- ✅ Embeddings API 완료 (`/api/v1/embeddings/*`)
- ✅ **Meeting API 정상 작동 확인** (YouTube 링크 분석 완료 데이터 2건 확인)
- ⏳ P3 작업 (Brand Learning Data 임베딩 자동화) 진행 예정

**검증 결과:**
- Meeting API에서 YouTube 링크 분석이 정상적으로 완료되었음을 확인 (2건 테스트 완료)
- CORS credentials 설정이 정상 동작함

---

## 📝 추가 테스트 시나리오

### Edge Cases

1. **잘못된 YouTube URL**
   - 유효하지 않은 URL 입력 시 에러 처리 확인

2. **네트워크 타임아웃**
   - 네트워크가 느릴 때 폴링 동작 확인

3. **대용량 파일**
   - 100MB 초과 파일 업로드 시 에러 메시지 확인

4. **동시 다중 Meeting**
   - 여러 Meeting을 동시에 생성했을 때 폴링 정상 동작 확인

---

## 🎯 다음 단계

1. **실제 브라우저 테스트 실행**
   - Chrome DevTools Network 탭에서 CORS 에러 없는지 확인
   - Meeting API 호출 시 `credentials: 'include'` 헤더 확인

2. **B팀과 협업 검증**
   - 백엔드 로그에서 Meeting 생성/처리 로그 확인
   - Vector DB 데이터 저장 확인

3. **문서화**
   - 테스트 결과를 일일 보고서에 반영
   - 발견된 이슈 ERROR_FIXES.md에 기록

---

## 📌 참고 자료

- **Meeting API 문서:** `/api/v1/meetings` (FastAPI Docs)
- **CORS 설정:** `backend/app/core/config.py` (`allow_credentials=True`)
- **프론트엔드 CORS:** `frontend/lib/api/meeting-api.ts` (`credentials: 'include'`)
- **Vector DB 스키마:** `backend/app/db/migrations/`

---

**작성자:** C팀 (Frontend Team)
**작성일:** 2025-11-28
**버전:** 1.0
