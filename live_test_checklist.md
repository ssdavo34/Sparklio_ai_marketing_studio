# Live 테스트 체크리스트

## 🌐 서버 상태
- ✅ **백엔드**: http://localhost:8000 (실행 중, DB 연결 없음)
- ✅ **프론트엔드**: http://localhost:3001 (포트 변경됨)
- ✅ **모드**: GENERATOR_MODE=live

## 📝 브라우저에서 테스트할 항목

### 1. Canvas Studio 페이지 접속
- [ ] http://localhost:3001/studio 접속
- [ ] 페이지 정상 로드 확인
- [ ] Canvas 영역 표시 확인

### 2. Spark Chat 기능 테스트
- [ ] 우측 도크에서 "Spark Chat" 탭 클릭
- [ ] 입력창이 하단에 고정되어 있는지 확인
- [ ] LLM 선택 드롭다운 확인 (OpenAI, Gemini, Ollama 등)

### 3. Live LLM 테스트
#### OpenAI (GPT-4o-mini)
- [ ] LLM 선택: OpenAI
- [ ] 테스트 메시지: "안녕하세요, 테스트 메시지입니다"
- [ ] 응답 확인

#### Google Gemini
- [ ] LLM 선택: Gemini
- [ ] 테스트 메시지: "배경을 파란색으로 바꿔줘"
- [ ] 응답 확인 (500 에러 발생 가능)

#### Ollama (Qwen)
- [ ] LLM 선택: Ollama (Qwen)
- [ ] 테스트 메시지: "텍스트를 추가해줘"
- [ ] 응답 확인

### 4. 에러 확인
- [ ] 브라우저 콘솔 (F12) 에러 메시지 확인
- [ ] 네트워크 탭에서 API 요청/응답 확인
- [ ] 500 에러 발생 시 상세 내용 기록

### 5. Meeting AI 테스트
- [ ] Meeting AI 탭 접근
- [ ] 기본 UI 로드 확인

## 🔍 주요 확인 사항

1. **LLM Router 문제**
   - 현상: `gpt-4o` 모델을 Gemini Provider에 전달
   - 예상 에러: 500 Internal Server Error
   - 확인 위치: `/api/v1/chat/analyze` API

2. **Konva.js 경고**
   - Canvas 드래그 시 콘솔 경고 확인

3. **Redis 연결**
   - 무시 가능 (NO-REDIS 모드로 작동)

## 📊 테스트 결과 기록

### 성공한 기능:
-

### 실패한 기능:
-

### 발견한 버그:
-

### 개선 필요 사항:
-