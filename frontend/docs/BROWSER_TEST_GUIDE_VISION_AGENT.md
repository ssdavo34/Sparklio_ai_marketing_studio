# 🌐 VisionGeneratorAgent 브라우저 테스트 가이드

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**목적**: VisionGeneratorAgent 통합 End-to-End 브라우저 테스트

---

## 📋 테스트 환경

```
프론트엔드: http://localhost:3001/studio/v3
백엔드: http://100.123.51.5:8000 (맥미니 도커)
브라우저: Chrome 또는 Edge 권장
```

### 사전 확인

1. **프론트엔드 서버 실행 확인**
   ```bash
   # frontend 디렉토리에서
   npm run dev
   # http://localhost:3001 에서 실행되고 있어야 함
   ```

2. **백엔드 서버 상태 확인**
   - 맥미니 도커에서 백엔드가 실행 중이어야 함
   - B팀이 NanoBanana Provider 버그를 수정했는지 확인

3. **.env.local 확인**
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_API_BASE_URL=http://100.123.51.5:8000
   ```

---

## 🧪 테스트 시나리오

### Test 1: Settings에서 Provider 선택 ✅

**목적**: Image LLM Provider 선택 UI 확인

**단계**:
1. 브라우저에서 Canvas Studio 열기
   ```
   http://localhost:3001/studio/v3
   ```

2. 우측 상단 **Settings 버튼** (톱니바퀴 아이콘) 클릭

3. **"대화 설정"** 탭으로 이동

4. **"Image LLM"** 섹션 찾기

5. Dropdown에서 Provider 선택 시도
   - 옵션: Auto (자동 선택), Nano Banana, ComfyUI, DALL-E

**예상 결과**:
- ✅ Dropdown에 4가지 옵션 표시
- ✅ 선택 시 즉시 반영
- ✅ Settings 닫고 다시 열어도 선택 유지 (Zustand 상태 저장)

**스크린샷 위치**: Settings → 대화 설정 → Image LLM

---

### Test 2: 이미지 생성 패널 표시 확인 ✅

**목적**: 플레이스홀더 감지 및 패널 표시

**단계**:
1. Canvas에 텍스트 요소 추가
   - 좌측 툴바 → Text 추가

2. 텍스트 선택

3. 우측 **Chat 패널**에서 ConceptAgent 활성화
   - "AI 이미지 생성" 버튼 클릭

4. ConceptAgent가 컨셉을 생성하면 플레이스홀더 이미지 추가됨

5. **우측 하단**에 "AI 이미지 생성" 패널이 나타나는지 확인

**예상 결과**:
- ✅ 패널 타이틀: "AI 이미지 생성"
- ✅ "N개의 플레이스홀더 감지됨" 표시
- ✅ Provider 이름 표시:
  - Auto 선택 시: "✨ 자동 선택"
  - 특정 Provider 선택 시: Provider 이름 (예: "Nano Banana")
- ✅ "전체 생성" 버튼 활성화
- ✅ Auto 모드일 경우 하단에 툴팁 표시:
  ```
  💡 자동 모드: Agent가 최적의 Provider를 자동으로 선택합니다
  (Nano Banana → ComfyUI → DALL-E 순으로 폴백)
  ```

**코드 위치**: [ImageGenerationPanel.tsx](../components/canvas-studio/components/ImageGenerationPanel.tsx)

---

### Test 3: Auto Mode 이미지 생성 🎯

**목적**: 자동 Provider 선택 모드 테스트

**단계**:
1. Settings → Image LLM → **"Auto (자동 선택)"** 선택

2. Canvas에 플레이스홀더 이미지가 있는 상태

3. "AI 이미지 생성" 패널에서 **"전체 생성"** 클릭

4. 진행 상태 관찰
   - 프로그레스 바 (0% → 100%)
   - "N% 완료" 표시
   - "M/N" (완료 개수/전체 개수) 표시
   - **실제 사용 중인 Provider 이름 표시**
     - 예: "🔄 Nano Banana 사용 중"

5. 완료 후 결과 확인
   - 성공 개수
   - 실패 개수 (있을 경우)

**예상 결과**:

**✅ 성공 시**:
- 진행률 100% 도달
- 생성된 이미지가 Canvas에 표시
- 결과 요약: "N개 성공"
- Canvas에서 이미지 확인 가능

**⚠️ 부분 성공 시**:
- 일부 이미지만 생성
- 결과: "3개 성공, 2개 실패"
- 에러 메시지: "2/5개 이미지 생성 실패. 개별 편집에서 재시도하세요."

**❌ 실패 시** (모든 Provider 실패):
- 에러 메시지 표시
- 사용자 친화적인 에러 설명
- "초기화" 버튼으로 재시도 가능

**브라우저 Console 확인**:
```javascript
// DevTools Console에서 확인
// [useImageGeneration] 로그 확인
// - Starting batch generation
// - Provider 선택
// - 진행 상태
// - 완료 또는 에러
```

---

### Test 4: 특정 Provider 선택 모드 🎯

**목적**: 수동 Provider 선택 테스트

**단계**:
1. Settings → Image LLM → **"Nano Banana"** 선택

2. Canvas에 플레이스홀더 이미지 준비

3. "AI 이미지 생성" 패널 확인
   - Provider 이름이 "Nano Banana"로 표시되는지 확인

4. **"전체 생성"** 클릭

5. 진행 상태 관찰
   - "Nano Banana 사용 중" 표시 확인

**예상 결과**:
- ✅ 선택한 Provider로만 생성 시도
- ✅ 실패 시 다른 Provider로 폴백하지 않음 (수동 선택 모드)
- ✅ 에러 발생 시 명확한 에러 메시지

**다른 Provider 테스트**:
- "ComfyUI" 선택 후 동일 테스트
- "DALL-E" 선택 후 동일 테스트

---

### Test 5: Inspector 패널 재생성 🔄

**목적**: 개별 이미지 재생성 기능 테스트

**단계**:
1. Canvas에서 **생성된 이미지 선택**
   - 이미지 메타데이터가 있는 이미지여야 함

2. 우측 패널 → **Inspector 탭** 이동

3. 이미지 정보 섹션에서 메타데이터 확인
   - Original Prompt
   - Style
   - Seed
   - Provider
   - 생성 시간

4. **"재생성"** 버튼 클릭

5. 진행 상태 관찰
   - 버튼이 로딩 상태로 변경
   - 새 이미지 생성

**예상 결과**:
- ✅ 같은 prompt와 style 사용
- ✅ 같은 seed 사용 (variation 생성)
- ✅ ChatConfig의 Provider 사용
- ✅ 새 이미지가 Canvas에 반영
- ✅ 메타데이터 업데이트:
  - Regeneration Count 증가
  - 새 생성 시간 기록

**실패 시**:
- ❌ 에러 메시지 표시
- 이미지는 기존 것 유지

**코드 위치**: [RightDock.tsx:412-450](../components/canvas-studio/panels/right/RightDock.tsx#L412-L450)

---

### Test 6: 에러 처리 테스트 ❌

**목적**: 에러 상황에서 UI 동작 확인

**시나리오 A: 백엔드 서버 다운**
1. 백엔드 서버 중지 (B팀 협조 필요)
2. 이미지 생성 시도
3. 에러 메시지 확인

**예상 결과**:
- ❌ "서비스를 일시적으로 사용할 수 없습니다."
- 사용자 친화적인 에러 메시지
- 재시도 가능

**시나리오 B: Provider 실패 (Auto 모드)**
1. Auto 모드에서 생성
2. Nano Banana 실패 시 자동으로 ComfyUI로 폴백
3. 최종 성공 또는 실패

**예상 결과**:
- ✅ 자동 폴백 동작
- 성공 시: 이미지 생성
- 모든 Provider 실패 시: 에러 메시지

**시나리오 C: 네트워크 에러**
1. 네트워크 탭에서 Offline 모드 설정
2. 이미지 생성 시도

**예상 결과**:
- ❌ "이미지 생성 중 알 수 없는 오류가 발생했습니다."
- 에러 로그 출력 (Console)

---

## 🔍 디버깅 도구

### Browser Console 명령어

```javascript
// Zustand Store 확인
window.__ZUSTAND_STORES__?.chat.getState().chatConfig.imageLLM
// 현재 선택된 Image LLM Provider 확인

// Canvas Store 확인
window.__ZUSTAND_STORES__?.canvas
// Polotno Store 상태 확인

// Network 탭 필터
// POST /api/v1/agents/vision-generator/generate
// Request body와 Response 확인
```

### 네트워크 요청 확인

**VisionGeneratorAgent 요청**:
```json
// POST http://100.123.51.5:8000/api/v1/agents/vision-generator/generate

{
  "prompts": [
    {
      "prompt_text": "A beautiful sunset over mountains",
      "style": "realistic",
      "aspect_ratio": "1:1",
      "quality": "high"
    }
  ],
  "provider": "auto",  // 또는 "nanobanana", "comfyui", "dalle"
  "batch_mode": true,
  "max_concurrent": 3
}
```

**예상 응답** (성공):
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "image_id": "...",
        "image_url": "https://...",
        "prompt_text": "A beautiful sunset over mountains",
        "width": 1024,
        "height": 1024,
        "seed_used": 12345,
        "generation_time": 5.2,
        "status": "completed"
      }
    ],
    "total_requested": 1,
    "total_generated": 1,
    "total_failed": 0,
    "total_time": 5.2
  }
}
```

---

## ✅ 테스트 체크리스트

### UI 통합
- [ ] Settings에서 Provider 선택 UI 표시
- [ ] Provider 선택 시 Zustand에 저장
- [ ] 이미지 생성 패널 표시
- [ ] 플레이스홀더 개수 정확히 감지
- [ ] Provider 이름 정확히 표시
- [ ] Auto 모드 툴팁 표시

### 이미지 생성 (Auto 모드)
- [ ] "전체 생성" 버튼 클릭 가능
- [ ] 진행률 표시 (0% → 100%)
- [ ] 완료 개수 표시 (M/N)
- [ ] 실제 사용 중인 Provider 이름 표시
- [ ] 프로그레스 바 애니메이션
- [ ] 생성 완료 후 이미지 Canvas에 표시
- [ ] 결과 요약 (성공/실패 개수)

### 이미지 생성 (수동 Provider 선택)
- [ ] Nano Banana 선택 후 생성
- [ ] ComfyUI 선택 후 생성
- [ ] DALL-E 선택 후 생성
- [ ] 각 Provider 이름 정확히 표시

### Inspector 재생성
- [ ] 이미지 선택 시 메타데이터 표시
- [ ] "재생성" 버튼 동작
- [ ] 로딩 상태 표시
- [ ] 새 이미지 생성 및 반영
- [ ] 메타데이터 업데이트

### 에러 처리
- [ ] 백엔드 에러 시 에러 메시지 표시
- [ ] Provider 실패 시 폴백 (Auto 모드)
- [ ] 네트워크 에러 시 에러 메시지
- [ ] 부분 성공 시 결과 요약
- [ ] 재시도 가능 ("초기화" 버튼)

### 상태 관리
- [ ] ChatConfig 업데이트
- [ ] Hook 상태 정확히 업데이트
- [ ] Canvas 상태 동기화
- [ ] 메타데이터 저장 및 복원

---

## 🐛 예상 이슈 및 해결

### Issue 1: 이미지가 생성되지 않음

**증상**:
- "전체 생성" 클릭 후 아무 일도 일어나지 않음
- 또는 즉시 에러 발생

**원인**:
- 백엔드 서버 다운
- Nano Banana Provider 버그 미수정
- 네트워크 연결 문제

**해결**:
1. 백엔드 서버 상태 확인 (B팀)
2. Console 에러 로그 확인
3. Network 탭에서 요청/응답 확인

---

### Issue 2: Provider 이름이 표시되지 않음

**증상**:
- 패널에 "undefined" 또는 빈 문자열 표시

**원인**:
- ChatConfig에 imageLLM 값이 없음
- IMAGE_LLM_INFO 매핑 오류

**해결**:
```javascript
// Console에서 확인
window.__ZUSTAND_STORES__?.chat.getState().chatConfig.imageLLM
// undefined면 Settings에서 Provider 선택 필요
```

---

### Issue 3: Auto 모드가 작동하지 않음

**증상**:
- Auto 선택 시 특정 Provider만 시도
- 폴백이 일어나지 않음

**원인**:
- 백엔드 VisionGeneratorAgent 폴백 로직 문제

**해결**:
- B팀에 확인 요청
- 백엔드 로그 확인

---

## 📊 테스트 결과 기록 양식

```markdown
## 테스트 결과

**테스트 일시**: 2025-11-28 HH:MM
**테스터**: 이름
**브라우저**: Chrome 120 / Edge 120
**환경**: localhost:3001 → Mac Mini (100.123.51.5:8000)

### Test 1: Settings Provider 선택
- 결과: ✅ 성공 / ❌ 실패
- 비고:

### Test 2: 이미지 생성 패널 표시
- 결과: ✅ 성공 / ❌ 실패
- 비고:

### Test 3: Auto Mode 이미지 생성
- 결과: ✅ 성공 / ❌ 실패
- Provider: Nano Banana / ComfyUI / DALL-E
- 생성 시간: X.X초
- 비고:

### Test 4: 특정 Provider 선택
- Nano Banana: ✅ / ❌
- ComfyUI: ✅ / ❌
- DALL-E: ✅ / ❌
- 비고:

### Test 5: Inspector 재생성
- 결과: ✅ 성공 / ❌ 실패
- 비고:

### Test 6: 에러 처리
- 백엔드 다운: ✅ / ❌
- Provider 실패: ✅ / ❌
- 네트워크 에러: ✅ / ❌
- 비고:

### 종합 평가
- 전체 성공률: X/6
- 주요 이슈:
- 권장 사항:
```

---

## 📞 문제 발생 시

**프론트엔드 이슈**:
- GitHub Issue 생성
- [BACKEND_BUG_REPORT_2025-11-28.md](./BACKEND_BUG_REPORT_2025-11-28.md) 참고

**백엔드 이슈**:
- B팀에 보고
- 에러 로그 첨부
- 재현 단계 명시

**협업 필요**:
- C팀 + B팀 페어 테스팅
- 실시간 디버깅

---

## 🎯 성공 기준

**최소 요구사항** (MVP):
- ✅ Settings에서 Provider 선택 가능
- ✅ Auto 모드에서 이미지 생성 성공
- ✅ 진행률 및 상태 표시
- ✅ 에러 시 사용자 친화적 메시지

**추가 목표**:
- ✅ 모든 Provider (Nano Banana, ComfyUI, DALL-E) 테스트
- ✅ Inspector 재생성 동작
- ✅ 부분 성공 시나리오 처리
- ✅ 에러 복구 (재시도)

---

**테스트 작성일**: 2025-11-28
**업데이트**: B팀 버그 수정 후
**다음 단계**: 브라우저 테스트 수행 → 결과 문서화
