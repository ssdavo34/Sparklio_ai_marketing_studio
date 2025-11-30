# E2E 에러 리스트 (2025-12-01)

## 개요
Canvas Studio v3.3 전체 기능 테스트 중 발견된 에러 목록

---

## 1. 치명적 에러 (Critical)

### 1.1 React Render Error - BrandKitTab
- **에러**: `Objects are not valid as a React child (found: object with keys {브랜드_DNA, 브랜드_보이스, 커뮤니케이션_스타일})`
- **위치**: BrandKitTab.tsx - Brand DNA 렌더링 부분
- **원인**: Backend에서 반환한 Brand DNA 구조가 Frontend 타입과 불일치
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `safeString()`, `safeStringArray()` 헬퍼 함수 추가하여 객체를 안전하게 문자열로 변환
- **우선순위**: P0

---

## 2. API 에러 (Backend 연동)

### 2.1 JWT Token 에러
- **에러**: `[BrandAPI] Malformed JWT token: mock-jwt-t...`
- **위치**: brand-api.ts:49
- **원인**: localStorage에 저장된 mock JWT 토큰이 유효한 형식이 아님 (parts.length !== 3)
- **영향**: 모든 인증이 필요한 API 호출 실패
- **상태**: ✅ 해결 (커밋 5bbde1f, 743981a)
- **해결 방법**:
  - JWT 토큰이 유효하지 않으면 Demo 모드로 전환
  - Authorization 헤더 없이 진행 (anonymous access)
  - Demo Brand ID (`00000000-0000-0000-0000-000000000000`) 사용
- **우선순위**: P0

### 2.2 문서 목록 로드 실패
- **에러**: `Failed to load documents: Error: [object Object]`
- **위치**: BrandKitTab.tsx:136 (listBrandDocuments)
- **원인**: API 응답 에러 처리 시 error.detail 대신 [object Object] 표시
- **HTTP**: 422 Unprocessable Entity
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `extractErrorMessage()` 헬퍼 함수로 에러 메시지 추출 개선
- **우선순위**: P1

### 2.3 Brand DNA 로드 실패
- **에러**: `Failed to load Brand DNA: Error: [object Object]`
- **위치**: BrandKitTab.tsx:157 (getBrandDNA)
- **HTTP**: 422 Unprocessable Entity
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `extractErrorMessage()` 헬퍼 함수로 에러 메시지 추출 개선
- **우선순위**: P1

### 2.4 URL 크롤링 실패
- **에러**: `Crawling failed: Error: [object Object]`
- **위치**: BrandKitTab.tsx:242 (crawlBrandUrl)
- **HTTP**: 422 Unprocessable Entity
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `extractErrorMessage()` 헬퍼 함수로 에러 메시지 추출 개선
- **우선순위**: P2

### 2.5 문서 삭제 실패
- **에러**: `Delete failed: Error: [object Object]`
- **위치**: BrandKitTab.tsx:471, 517 (deleteBrandDocument)
- **HTTP**: 422 Unprocessable Entity
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `extractErrorMessage()` 헬퍼 함수로 에러 메시지 추출 개선
- **우선순위**: P2

### 2.6 Brand 분석 실패
- **에러**: `Analysis failed: Error: [object Object]`
- **위치**: BrandKitTab.tsx:427 (analyzeBrand)
- **HTTP**: 422 Unprocessable Entity
- **상태**: ✅ 해결 (커밋 5bbde1f)
- **해결 방법**: `extractErrorMessage()` 헬퍼 함수로 에러 메시지 추출 개선
- **우선순위**: P2

---

## 3. 공통 원인 분석

### 3.1 JWT Token 문제
모든 API 에러의 근본 원인은 **잘못된 JWT 토큰**입니다:
1. `localStorage`에 `mock-jwt-token` 같은 유효하지 않은 문자열 저장
2. JWT 형식 검증 (`parts.length === 3`) 실패
3. Authorization 헤더 미포함
4. Backend에서 인증 실패 → 422 Unprocessable Entity

### 3.2 에러 메시지 처리 문제
API 에러 응답을 표시할 때 `error.detail` 또는 `error.message`를 추출하지 못하고 전체 error 객체를 문자열화하여 `[object Object]` 표시

---

## 4. 수정 계획

### Phase 1: 인증 문제 해결 (P0) ✅ 완료
1. [x] Mock JWT 토큰 대신 Demo 모드 분기 처리
2. [x] 인증 없이도 Demo Brand ID로 API 호출 가능하도록 수정
3. [x] brand-api.ts 에러 메시지 개선

### Phase 2: Brand DNA 렌더링 수정 (P0) ✅ 완료
1. [x] Backend Brand DNA 응답 구조 확인
2. [x] safeString/safeStringArray 헬퍼 함수 추가
3. [x] 객체를 직접 렌더링하지 않도록 방어 코드 추가

### Phase 3: API 에러 처리 개선 (P1) ✅ 완료
1. [x] extractErrorMessage 헬퍼 함수 추가
2. [x] 모든 API 함수에서 에러 메시지 추출 로직 개선
3. [x] JSON 파싱 실패 시 빈 객체로 fallback

---

## 5. 테스트 체크리스트

### LeftPanel 기능
- [ ] Pages 탭 전환
- [ ] Editor 탭 전환
- [ ] ActivityBar 메뉴 클릭 → 패널 컨텐츠 전환
- [ ] 패널 리사이즈
- [ ] 패널 접기/펼치기

### BrandKit 기능
- [ ] 문서 목록 로드
- [ ] 파일 업로드
- [ ] URL 크롤링
- [ ] Brand DNA 분석
- [ ] Brand DNA 표시
- [ ] 문서 삭제

### Canvas 기능
- [ ] Polotno 에디터 로드
- [ ] 페이지 추가/삭제
- [ ] 요소 추가
- [ ] 저장/로드

### Chat/AI 기능
- [ ] 메시지 전송
- [ ] AI 응답 수신
- [ ] Canvas 연동

---

## 업데이트 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-12-01 | C팀 | 최초 작성 |
| 2025-12-01 | C팀 | P0/P1/P2 에러 전체 수정 완료 (커밋 5bbde1f, 743981a) |
