# 다음 작업자를 위한 즉시 실행 가이드

**작성일:** 2025-11-18
**대상:** 2025-11-19 (화) 첫 작업자 (A팀/C팀)

---

## 🚀 시작하기 (3분 안에!)

### 1️⃣ Frontend 서버 시작

```bash
# ⚠️ 중요: 반드시 이 명령어로 시작!
cd k:\sparklio_ai_marketing_studio\frontend
unset NEXT_PUBLIC_API_BASE_URL
npm run dev
```

**예상 출력:**
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.2s
```

### 2️⃣ 브라우저에서 테스트

1. **브라우저 열기**
   - Chrome 또는 Edge (시크릿 모드 권장)
   - 주소: http://localhost:3000

2. **Canvas Studio 페이지 이동**
   - 좌측 메뉴에서 "Canvas Studio" 클릭

3. **Generate 테스트**
   - Kind: "Product Detail" 선택
   - Prompt: "지성 피부용 진정 토너" 입력
   - "Generate" 버튼 클릭

### 3️⃣ 성공 확인 체크리스트

**브라우저 콘솔 (F12)에서 확인:**

✅ **1단계: API 연결 확인**
```
[API Client] API_BASE_URL = http://100.123.51.5:8000
```
- ❌ `localhost:8001`이 보이면 → 서버 재시작 (unset 명령어 다시 실행)
- ✅ `100.123.51.5:8000`이 보이면 → 정상!

✅ **2단계: Sanitize 작동 확인**
```
[Fabric Adapter] 🔧 Fixing textBaseline: "alphabetical" → "alphabetic" for object: text
```
- 이 메시지가 여러 번 나타나야 함 (text 객체 개수만큼)

✅ **3단계: Canvas 로딩 확인**
```
[Fabric Adapter] ✅ Canvas loaded successfully
```

✅ **4단계: Canvas 화면 확인**
- Canvas 영역(우측)에 회색 배경 보임
- Text 객체들이 표시됨
- "${initial.product_name}" 같은 placeholder 텍스트 보임

---

## 🔍 문제 해결

### 문제 1: `localhost:8001` 연결 오류

**증상:**
```
POST http://localhost:8001/api/v1/generate net::ERR_CONNECTION_REFUSED
```

**해결:**
```bash
# 1. 모든 Node 프로세스 종료
taskkill /F /IM node.exe

# 2. .next 폴더 삭제
cd k:\sparklio_ai_marketing_studio\frontend
rm -rf .next

# 3. 올바른 명령어로 재시작
unset NEXT_PUBLIC_API_BASE_URL
npm run dev
```

### 문제 2: `textBaseline 'alphabetical'` 에러 계속 발생

**증상:**
```
The provided value 'alphabetical' is not a valid enum value of type CanvasTextBaseline.
```

**확인 사항:**
1. 서버 재시작 했는지?
2. 브라우저 하드 리프레시 (Ctrl+Shift+R)
3. 시크릿 모드로 테스트

**여전히 안 되면:**
- [EOD_REPORT_2025-11-18.md](./EOD_REPORT_2025-11-18.md) 읽기
- [FABRIC_BUG_REPORT.md](./FABRIC_BUG_REPORT.md) 확인

### 문제 3: Backend 연결 안 됨

**증상:**
```
Failed to fetch
```

**확인:**
```bash
# Backend 서버 상태 확인
curl http://100.123.51.5:8000/api/v1/health
```

**예상 응답:**
```json
{"status":"healthy","version":"4.0.0"}
```

**안 되면:**
- Mac Mini M2 서버(집)가 켜져 있는지 확인
- Tailscale 연결 확인
- B팀에게 Backend 서버 상태 문의

---

## 📋 오늘 할 일 (우선순위)

### 🔴 P0 - 반드시 완료 (30분)

- [ ] Frontend 서버 정상 시작 확인
- [ ] Canvas 렌더링 성공 확인
- [ ] Sanitize 함수 작동 확인 (콘솔 경고 메시지)
- [ ] A팀(QA)에게 테스트 요청

### 🟡 P1 - 가능하면 완료 (1~2시간)

- [ ] LLM 사용자 입력 반영 확인
  - "지성 피부용 진정 토너" 입력 시
  - 생성된 콘텐츠에 "지성 피부" 키워드 포함되는지
- [ ] 다양한 프롬프트로 테스트
  - SNS 게시글
  - Presentation

### 🟢 P2 - 여유 있으면 (2~3시간)

- [ ] Fabric.js 6.9.0 업그레이드 계획 수립
  - 별도 브랜치 생성
  - Breaking Changes 문서 읽기
  - 테스트 계획 작성

---

## 🎯 작업 완료 기준

### ✅ 성공 시나리오

1. Canvas에 Text 객체가 정상적으로 표시됨
2. 에러 메시지 없음
3. Backend API 정상 호출
4. Sanitize 경고 메시지 확인

**→ A팀에게 QA 요청하고 다음 작업 진행!**

### ⚠️ 실패 시나리오

1. Canvas가 비어있음
2. `textBaseline` 에러 계속 발생
3. Backend 연결 실패

**→ [EOD_REPORT_2025-11-18.md](./EOD_REPORT_2025-11-18.md) 정독 후 재시도**
**→ 30분 이상 막히면 팀원 또는 Claude Code에게 도움 요청**

---

## 📞 도움 요청 방법

### Claude Code 사용 시

```
안녕하세요!

어제(2025-11-18) EOD 보고서를 읽었습니다.

Frontend 서버를 시작했는데 [문제 설명]이 발생합니다.

EOD_REPORT_2025-11-18.md와 FABRIC_BUG_REPORT.md를 참고했지만
해결되지 않았습니다.

도와주세요!
```

### 팀원에게 요청 시

1. **[EOD_REPORT_2025-11-18.md](./EOD_REPORT_2025-11-18.md)** 읽었는지 확인
2. **브라우저 콘솔 스크린샷** 공유
3. **실행한 명령어** 공유
4. **에러 메시지 전체** 복사

---

## 🎓 배경 지식 (필요 시 참고)

### 왜 이런 문제가 발생했나?

1. **Fabric.js 5.3.0 버그**
   - 라이브러리 자체에 `textBaseline: 'alphabetical'` 하드코딩됨
   - HTML5 표준은 `'alphabetic'` (끝에 'c')를 요구
   - 현대 브라우저가 거부

2. **Shell 환경변수 충돌**
   - 이전 작업자가 `export NEXT_PUBLIC_API_BASE_URL=localhost:8001` 설정
   - `.env.local`보다 Shell 환경변수가 우선순위 높음
   - `unset`으로 제거 필요

### 해결 방법 요약

- **임시 해결:** Sanitize 안전장치 (이미 구현됨)
- **장기 해결:** Fabric.js 6.9.0 업그레이드 (P2 작업)

자세한 내용: [FABRIC_BUG_REPORT.md](./FABRIC_BUG_REPORT.md)

---

## 📚 관련 문서

1. **[EOD_REPORT_2025-11-18.md](./EOD_REPORT_2025-11-18.md)** - 어제 작업 상세 보고
2. **[FABRIC_BUG_REPORT.md](./FABRIC_BUG_REPORT.md)** - 버그 분석 및 해결 방안
3. **.env.local** - 환경 변수 설정
4. **components/canvas-studio/adapters/response-to-fabric.ts** - Sanitize 구현

---

## 🎉 마무리

**이 가이드만 따라하면 5분 안에 작업을 시작할 수 있습니다!**

문제가 생기면 당황하지 말고:
1. 이 문서의 "문제 해결" 섹션 확인
2. EOD 보고서 읽기
3. 팀원 또는 Claude Code에게 도움 요청

**화이팅! 🚀**

---

**작성자:** Claude Code with C팀
**최종 업데이트:** 2025-11-18 18:00
