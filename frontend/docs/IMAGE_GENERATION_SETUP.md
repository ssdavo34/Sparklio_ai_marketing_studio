# 🎨 이미지 생성 기능 설정 가이드

Canvas Studio의 AI 이미지 생성 및 편집 기능을 사용하기 위한 환경 설정 가이드입니다.

## 📋 개요

Canvas Studio는 두 가지 이미지 소스를 지원합니다:
- **Nano Banana AI**: 텍스트 프롬프트로 이미지 생성 (기본)
- **Unsplash**: 고품질 무료 스톡 사진 검색

---

## 🔑 필요한 API 키

### 1. Nano Banana API Key (필수)

AI 이미지 생성 기능을 사용하려면 Nano Banana API 키가 필요합니다.

**발급 방법:**
1. [Nano Banana 웹사이트](https://nanobanana.ai) 방문
2. 회원가입 및 로그인
3. API 키 생성
4. 키 복사

**사용되는 곳:**
- 자동 이미지 생성 (플레이스홀더 → 실제 이미지)
- Inspector에서 AI 이미지 재생성
- 이미지 변형 (Variation)

### 2. Unsplash Access Key (선택)

스톡 사진 검색 기능을 사용하려면 Unsplash Access Key가 필요합니다.

**발급 방법:**
1. [Unsplash Developers](https://unsplash.com/developers) 방문
2. 회원가입 및 로그인
3. "New Application" 생성
4. Access Key 복사

**사용되는 곳:**
- Inspector에서 Unsplash 검색
- 이미지를 스톡 사진으로 교체

---

## ⚙️ 환경 변수 설정

### `.env.local` 파일 생성

프로젝트 루트의 `frontend` 디렉토리에 `.env.local` 파일을 생성합니다:

```bash
# frontend/.env.local

# Nano Banana AI (필수)
NEXT_PUBLIC_NANO_BANANA_API_URL=https://api.nanobanana.ai
NEXT_PUBLIC_NANO_BANANA_API_KEY=your_nano_banana_api_key_here

# Unsplash (선택)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### 환경 변수 설명

| 변수명 | 필수 여부 | 기본값 | 설명 |
|--------|-----------|--------|------|
| `NEXT_PUBLIC_NANO_BANANA_API_URL` | 선택 | `https://api.nanobanana.ai` | Nano Banana API 엔드포인트 |
| `NEXT_PUBLIC_NANO_BANANA_API_KEY` | **필수** | - | Nano Banana API 인증 키 |
| `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` | 선택 | - | Unsplash API Access Key |

---

## 🚀 사용 방법

### 1. 개발 서버 재시작

환경 변수를 설정한 후, 개발 서버를 재시작합니다:

```bash
npm run dev
```

### 2. Canvas Studio 접속

브라우저에서 다음 URL로 접속:
```
http://localhost:3000/studio/v3
```

### 3. 기능 테스트

#### ✅ 자동 이미지 생성 테스트
1. Preview 화면에서 생성물을 "Canvas에서 편집" 클릭
2. Canvas 하단에 "AI 이미지 생성" 패널이 나타나는지 확인
3. "전체 생성" 버튼 클릭
4. 진행 상태와 결과 확인

#### ✅ AI 재생성 테스트
1. Canvas에서 이미지 요소 선택
2. 우측 Inspector 탭 → "이미지 편집" 섹션 확인
3. "AI 이미지 재생성" 버튼 클릭 (AI 생성 이미지만 표시됨)
4. 새로운 variation 생성 확인

#### ✅ Unsplash 검색 테스트
1. Canvas에서 이미지 요소 선택
2. Inspector 탭 → "Unsplash 검색" 버튼 클릭
3. 검색 모달이 열리는지 확인
4. 키워드 검색 및 이미지 선택

---

## 🔍 문제 해결

### API 키가 설정되지 않았습니다

**증상:**
```
Nano Banana API Key가 설정되지 않았습니다
```

**해결:**
1. `.env.local` 파일이 `frontend/` 디렉토리에 있는지 확인
2. `NEXT_PUBLIC_NANO_BANANA_API_KEY` 변수가 정확히 설정되었는지 확인
3. 개발 서버 재시작
4. 브라우저 캐시 삭제 후 새로고침

### 이미지 생성이 실패합니다

**가능한 원인:**
1. **API 키 오류**: API 키가 잘못되었거나 만료됨
2. **네트워크 오류**: API 서버에 접근 불가
3. **Rate Limiting**: API 사용량 초과
4. **프롬프트 오류**: 부적절하거나 너무 긴 프롬프트

**해결:**
1. 브라우저 Console (F12) 확인
2. 에러 메시지 확인
3. API 키 유효성 재확인
4. 개별 이미지를 Inspector에서 재시도

### Unsplash 검색이 작동하지 않습니다

**해결:**
1. `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` 설정 확인
2. Unsplash Application이 활성화되어 있는지 확인
3. 개발 서버 재시작

---

## 📊 API 사용량 모니터링

### Nano Banana
- [Nano Banana Dashboard](https://nanobanana.ai/dashboard)에서 사용량 확인
- 이미지 생성 횟수, 잔여 크레딧 확인

### Unsplash
- [Unsplash Application Dashboard](https://unsplash.com/oauth/applications)에서 확인
- 무료 플랜: 월 50회 API 요청 제한
- 다운로드 트리거는 필수 (자동 처리됨)

---

## 🏗️ 아키텍처

### 이미지 메타데이터 구조

모든 Canvas 이미지는 메타데이터를 저장합니다:

```typescript
{
  source: 'nano_banana' | 'unsplash' | 'upload' | 'placeholder',
  originalPrompt: '이미지 생성 프롬프트',
  style: 'realistic' | 'artistic' | ...,
  seed: 12345,
  regenerationCount: 2,
  unsplashAttribution: { ... },
  createdAt: '2025-11-28T...',
  updatedAt: '2025-11-28T...'
}
```

### 이미지 생성 플로우

```
1. Template → Canvas 변환
   ↓
2. 플레이스홀더 생성 (메타데이터 포함)
   ↓
3. ImageGenerationPanel에서 감지
   ↓
4. "전체 생성" 클릭
   ↓
5. useImageGeneration hook 실행
   ↓
6. Nano Banana API 호출 (배치)
   ↓
7. 각 이미지 element 업데이트
   ↓
8. 메타데이터 저장 (source: 'nano_banana')
```

---

## 📝 모범 사례

### 프롬프트 작성 팁
- **구체적으로**: "비즈니스 미팅 장면, 밝은 사무실, 3명의 사람들"
- **스타일 명시**: "사실적인 사진 스타일" 또는 "미니멀한 일러스트"
- **품질 키워드**: "고품질", "전문적인", "8K 해상도"

### 성능 최적화
- 한 번에 많은 이미지 생성 시 순차 처리됨 (API rate limit 고려)
- 실패한 이미지는 개별로 재생성 권장
- 플레이스홀더로 먼저 레이아웃 확인 후 생성

### 비용 절약
- 재생성 기능을 활용하여 만족스러운 결과가 나올 때까지 시도
- Unsplash를 우선 검색하여 무료 스톡 사진 활용
- 테스트 시에는 소수의 이미지로 먼저 확인

---

## 🆘 지원

문제가 지속되면:
1. GitHub Issues에 문제 보고
2. Console 로그 첨부
3. 환경 정보 (OS, 브라우저) 포함

---

**최종 업데이트**: 2025-11-28
**작성자**: C팀 (Frontend Team)
