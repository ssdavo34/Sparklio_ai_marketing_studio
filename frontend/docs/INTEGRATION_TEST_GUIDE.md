# 🧪 VisionGeneratorAgent 통합 테스트 가이드

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**버전**: 1.0

---

## 🎯 테스트 목표

VisionGeneratorAgent와 프론트엔드의 완전한 통합을 검증합니다.

---

## ✅ 사전 준비

### 1. 백엔드 서버 실행 확인

```bash
# 백엔드 디렉토리에서
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 다른 터미널에서 확인
curl http://localhost:8000/
# 예상 출력: {"service":"Sparklio V4 API","version":"4.0.0",...}

curl http://localhost:8000/api/v1/media/health
# 예상 출력: {"gateway":"healthy","providers":{...}}
```

### 2. 프론트엔드 개발 서버 실행 확인

```bash
# 프론트엔드 디렉토리에서
cd frontend
npm run dev

# 브라우저에서
# http://localhost:3000
```

### 3. 환경 변수 확인

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 이미지 생성 (Auto Provider)

#### 1.1. Canvas Studio 접속

1. 브라우저에서 `http://localhost:3000/studio/v3` 접속
2. 새 프로젝트 생성 또는 기존 템플릿 선택
3. "Canvas에서 편집" 클릭

#### 1.2. 플레이스홀더 이미지 확인

Canvas에 플레이스홀더 이미지가 있는지 확인:
- Instagram 템플릿: 1-2개의 이미지 플레이스홀더
- Shorts 템플릿: 3-5개의 이미지 플레이스홀더
- Slides 템플릿: 여러 페이지에 이미지 플레이스홀더

#### 1.3. AI 이미지 생성 패널 확인

Canvas 하단에 **"AI 이미지 생성"** 패널이 표시되는지 확인:

```
┌────────────────────────────────────────────────────┐
│ 🪄 AI 이미지 생성                      [전체 생성] │
│    5개의 플레이스홀더 감지됨  ✨ 자동 선택          │
└────────────────────────────────────────────────────┘
```

**확인 포인트**:
- ✅ 플레이스홀더 개수가 정확한지
- ✅ Provider 표시가 "자동 선택"인지

#### 1.4. 이미지 생성 실행

1. **"전체 생성"** 버튼 클릭
2. 개발자 도구 열기 (F12)
3. Console 탭에서 로그 확인

**예상 로그**:
```
[useImageGeneration] Starting batch generation: {count: 5, provider: 'auto', ...}
[VisionGeneratorAPI] Request: {url: 'http://localhost:8000/api/v1/agents/vision-generator/generate', ...}
```

4. Network 탭에서 요청 확인

**예상 요청**:
```
POST http://localhost:8000/api/v1/agents/vision-generator/generate

Request Payload:
{
  "prompts": [
    {
      "prompt_text": "A modern product photo...",
      "style": "realistic",
      "aspect_ratio": "1:1"
    },
    ...
  ],
  "provider": "auto",
  "batch_mode": true,
  "max_concurrent": 3
}
```

#### 1.5. 진행 상태 확인

생성 중 패널 변화 확인:

```
┌────────────────────────────────────────────────────┐
│ 🪄 AI 이미지 생성                           60% 완료│
│    5개의 플레이스홀더 감지됨  ⚡ NanoBanana 사용 중 │
│    3/5                                    [⚙️ 로딩]│
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]               │
└────────────────────────────────────────────────────┘
```

**확인 포인트**:
- ✅ 진행률 바가 움직이는지
- ✅ "NanoBanana 사용 중" 또는 다른 Provider 표시
- ✅ 개수 업데이트 (3/5)

#### 1.6. 결과 확인

생성 완료 후:

```
┌────────────────────────────────────────────────────┐
│ 🪄 AI 이미지 생성                        [초기화]  │
│    5개의 플레이스홀더 감지됨                        │
│                                                    │
│ ✅ 5개 성공                                         │
└────────────────────────────────────────────────────┘
```

**확인 포인트**:
- ✅ Canvas의 이미지가 실제 이미지로 교체되었는지
- ✅ 성공 개수가 정확한지
- ✅ 실패가 있다면 에러 메시지 표시

---

### 시나리오 2: Provider 수동 선택

#### 2.1. Settings 탭에서 Provider 변경

1. 우측 Dock에서 **"Settings"** 탭 클릭
2. **"Image LLM"** 드롭다운 찾기
3. 다른 Provider 선택:
   - `auto` → "자동 선택"
   - `nanobanana` → "NanoBanana"
   - `comfyui` → "ComfyUI"
   - `dalle` → "DALL-E"

#### 2.2. Provider 변경 확인

"AI 이미지 생성" 패널에서 Provider 표시 업데이트 확인:

```
Provider 선택: nanobanana
패널 표시: ✨ NanoBanana
```

#### 2.3. 선택한 Provider로 생성

1. 다시 "전체 생성" 클릭
2. Console에서 Provider 확인:

```javascript
[useImageGeneration] Starting batch generation: {provider: 'nanobanana', ...}
```

3. Network 요청에서 확인:

```json
{
  "provider": "nanobanana",  // 선택한 Provider
  ...
}
```

---

### 시나리오 3: 이미지 재생성 (Inspector)

#### 3.1. AI 생성 이미지 선택

1. Canvas에서 AI로 생성된 이미지 클릭
2. 우측 Dock에서 **"Inspector"** 탭 확인

#### 3.2. 이미지 메타데이터 확인

Inspector에 다음 정보가 표시되는지 확인:

```
┌─────────────────────────────────────┐
│ 🖼️ 이미지 편집                      │
│                                     │
│ 소스: 🤖 AI 생성                    │
│ 프롬프트: A modern product photo... │
│ 스타일: realistic                   │
│ 재생성 횟수: 0                      │
│                                     │
│ [AI 이미지 재생성]                  │
│ [Unsplash 검색]                     │
│ [이미지 업로드]                     │
└─────────────────────────────────────┘
```

**확인 포인트**:
- ✅ "AI 이미지 재생성" 버튼이 표시되는지 (AI 생성 이미지만)
- ✅ 메타데이터가 정확한지

#### 3.3. 재생성 실행

1. **"AI 이미지 재생성"** 버튼 클릭
2. 버튼 상태 변화 확인:

```
[⚙️ 재생성 중...]
```

3. Console 로그 확인:

```
[Inspector] Regenerating image via Agent: {
  prompt: "A modern product photo...",
  style: "realistic",
  previousSeed: 12345,
  provider: "auto"
}
```

4. 새 이미지로 교체 확인
5. 메타데이터 업데이트 확인:

```
재생성 횟수: 1  (증가)
```

---

### 시나리오 4: 에러 처리

#### 4.1. 백엔드 연결 실패 시뮬레이션

1. 백엔드 서버 중지:

```bash
# 백엔드 터미널에서 Ctrl+C
```

2. 프론트엔드에서 "전체 생성" 클릭
3. 에러 메시지 확인:

```
⚠️ 5/5개 이미지 생성 실패. 개별 편집에서 재시도하세요.

배치 생성 실패: 서비스를 일시적으로 사용할 수 없습니다.
```

4. Console 에러 확인:

```
[useImageGeneration] Batch generation failed: VisionGeneratorError: ...
[useImageGeneration] Falling back to sequential generation...
```

#### 4.2. 부분 성공 시나리오

백엔드가 일부 이미지만 생성에 성공하는 경우:

```
✅ 3개 성공
❌ 2개 실패

⚠️ 2/5개 이미지 생성 실패. 개별 편집에서 재시도하세요.
```

---

### 시나리오 5: 자동 모드 툴팁 확인

#### 5.1. 자동 모드 선택

1. Settings에서 Image LLM을 "auto"로 설정
2. "AI 이미지 생성" 패널 하단 확인

**예상 표시**:
```
┌────────────────────────────────────────────────────┐
│ 💡 자동 모드: Agent가 최적의 Provider를 자동으로   │
│    선택합니다 (Nano Banana → ComfyUI → DALL-E    │
│    순으로 폴백)                                     │
└────────────────────────────────────────────────────┘
```

---

## 📊 테스트 체크리스트

### 기본 기능

- [ ] 백엔드 서버 실행 및 health check
- [ ] 프론트엔드 Canvas Studio 접속
- [ ] 플레이스홀더 이미지 감지
- [ ] AI 이미지 생성 패널 표시
- [ ] "전체 생성" 버튼 동작
- [ ] 진행 상태 바 업데이트
- [ ] 생성된 이미지로 교체
- [ ] 성공/실패 카운트 정확성

### Provider 선택

- [ ] Settings에서 Image LLM Provider 선택 가능
- [ ] 선택한 Provider가 패널에 표시
- [ ] 선택한 Provider로 요청 전송
- [ ] 자동 모드 툴팁 표시

### 재생성 기능

- [ ] Inspector에서 AI 생성 이미지 메타데이터 표시
- [ ] "AI 이미지 재생성" 버튼 표시 (AI 이미지만)
- [ ] 재생성 실행 및 새 이미지로 교체
- [ ] 재생성 횟수 증가

### 에러 처리

- [ ] 백엔드 연결 실패 시 에러 메시지
- [ ] 부분 성공 시 상태 표시
- [ ] Console에 에러 로그 출력
- [ ] fallback to sequential generation

### UI/UX

- [ ] Provider 이름 한글화 (NanoBanana, ComfyUI, DALL-E)
- [ ] 실시간 Provider 상태 표시
- [ ] 로딩 아이콘 애니메이션
- [ ] 진행률 바 smooth transition

---

## 🐛 알려진 이슈 및 해결방법

### Issue 1: 백엔드 Image.save format 에러

**증상**:
```
Media generation failed: Image.save() got an unexpected keyword argument 'format'
```

**원인**: 백엔드 Nano Banana Provider 구현 버그

**임시 해결**: B팀에 버그 수정 요청

**프론트엔드 영향**: 없음 (에러 처리가 올바르게 동작함)

---

### Issue 2: CORS 에러

**증상**:
```
Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**해결**:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 3: 인증 토큰 없음

**증상**:
```
401 Unauthorized
```

**임시 해결**:
프론트엔드 API 클라이언트가 인증 토큰 없이도 동작하도록 구현됨.
실제 배포 시 JWT 토큰 연동 필요.

---

## 📝 테스트 결과 보고 템플릿

### 테스트 환경

- OS: Windows 10
- 브라우저: Chrome 120
- Node.js: v18.17.0
- Python: 3.11
- 백엔드 버전: v4.0.0

### 테스트 결과

| 시나리오 | 상태 | 비고 |
|---------|------|------|
| 기본 이미지 생성 | ⚠️ | 백엔드 버그로 실패, 에러 처리는 정상 |
| Provider 수동 선택 | ✅ | 정상 동작 |
| 이미지 재생성 | ⚠️ | 백엔드 버그로 실패 |
| 에러 처리 | ✅ | 정상 동작 |
| UI/UX | ✅ | 정상 동작 |

### 발견된 버그

1. **백엔드**: Nano Banana Provider의 Image.save format 인자 오류
   - 파일: `backend/app/services/media/providers/nanobanana.py`
   - 수정 필요: B팀

2. **프론트엔드**: (없음)

### 권장 사항

1. ✅ 프론트엔드 구현은 완전함
2. 🔲 백엔드 Nano Banana Provider 버그 수정 필요
3. 🔲 CORS 설정 확인 필요
4. 🔲 인증 시스템 통합 필요

---

## 🎯 다음 단계

### 즉시

1. B팀에 백엔드 버그 리포트
2. CORS 설정 확인 요청
3. Mock Provider로 테스트 (임시)

### 단기

1. 백엔드 버그 수정 후 재테스트
2. Provider 폴백 시나리오 테스트
3. 성능 측정 (생성 시간, 성공률)

### 중기

1. 인증 시스템 통합
2. 프로덕션 환경 테스트
3. 사용자 인수 테스트 (UAT)

---

**최종 업데이트**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**리뷰어**: -
