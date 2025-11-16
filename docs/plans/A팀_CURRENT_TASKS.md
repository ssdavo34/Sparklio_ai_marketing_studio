---
doc_id: PLAN-A001
title: A팀 현재 작업 목록 (B팀 Phase 1 진행 중)
created: 2025-11-16
updated: 2025-11-16 16:30
status: active
priority: P0
team: A팀 (QA & Testing)
period: 2025-11-16 ~ 2025-11-22 (Week 1)
context: B팀 LLM Gateway Phase 1-4 진행 중
related:
  - PLAN-B001: B팀 작업 지시 회신
  - STATUS-CURRENT: CURRENT_PHASE.md
  - ARCH-002: Gateway Pattern
---

# A팀 현재 작업 목록

**작성**: A팀 (QA & Testing)
**기간**: 2025-11-16 ~ 2025-11-22 (Week 1)
**상황**: B팀이 LLM Gateway Phase 1-4 작업 중

---

## 📋 TL;DR (30초 요약)

**A팀의 역할**:
- B팀 작업 **모니터링** (진행 상황 체크, 블로커 해결 지원)
- **인프라 준비** (Desktop Ollama/ComfyUI 상태 확인)
- **문서 유지** (CURRENT_PHASE.md 일일 업데이트)
- **테스트 준비** (Phase별 검증 시나리오 작성)

**B팀과의 관계**: 🚫 방해하지 않기, ✅ 질문 있을 때 즉시 응답

---

## 🎯 A팀 핵심 원칙

### ✅ 해야 할 것

1. **모니터링**: B팀 진행 상황 파악 (Daily 18:00 체크인 수신)
2. **지원**: B팀 질문/블로커 발생 시 즉시 응답
3. **인프라**: Desktop Ollama/ComfyUI 상태 확인 및 유지
4. **문서화**: 진행 상황 기록 (CURRENT_PHASE.md)
5. **테스트 준비**: Phase별 검증 시나리오 작성

### ❌ 절대 금지

1. **B팀 작업 중단시키기**: "지금 이것도 해주세요" 금지
2. **요구사항 변경**: Phase 1-4 중 스펙 변경 금지
3. **직접 구현**: Gateway 코드 작성은 B팀 담당
4. **과도한 체크인**: 18:00 외 추가 체크인 최소화

---

## 📅 주간 작업 계획 (2025-11-16 ~ 2025-11-22)

### 🔴 P0: 긴급/중요 (매일)

| 작업 | 담당 | 시간 | 완료 기준 |
|------|------|------|----------|
| Desktop 인프라 상태 확인 | A팀 | 매일 09:00 | Ollama/ComfyUI 정상 동작 ✅ |
| B팀 Daily 체크인 수신 | A팀 | 매일 18:00 | 슬랙 3줄 보고 확인 ✅ |
| CURRENT_PHASE.md 업데이트 | A팀 | 매일 18:30 | B팀 진행 상황 반영 ✅ |
| B팀 질문/블로커 응답 | A팀 | 발생 시 즉시 | 30분 내 응답 ✅ |

### 🟡 P1: 중요 (이번 주)

| 작업 | 담당 | 마감 | 완료 기준 |
|------|------|------|----------|
| Phase 1-1 검증 시나리오 작성 | A팀 | 2025-11-16 | 디렉토리 구조 체크리스트 ✅ |
| Phase 1-2 검증 시나리오 작성 | A팀 | 2025-11-17 | Mock 응답 테스트 스크립트 ✅ |
| Phase 1-3 검증 시나리오 작성 | A팀 | 2025-11-18 | Ollama 연결 확인 스크립트 ✅ |
| Phase 1-4 검증 시나리오 작성 | A팀 | 2025-11-19 | Media Gateway 체크리스트 ✅ |

### 🟢 P2: 보통 (여유 있을 때)

| 작업 | 담당 | 마감 | 완료 기준 |
|------|------|------|----------|
| C팀 문서 체계 적용 확인 | A팀 | 2025-11-18 | C팀 첫 문서 작성 확인 ✅ |
| E2E 테스트 시나리오 Draft | A팀 | 2025-11-20 | Phase 3 준비 완료 ✅ |
| 문서 체계 리뷰 | A팀 | 2025-11-22 | 00_INDEX.md 정확성 확인 ✅ |

---

## 🔍 오늘 작업 (2025-11-16 오후)

### 즉시 실행 (30분)

- [x] B팀 작업 지시 회신 완료
- [x] C팀 문서 체계 안내 완료
- [x] A팀 작업 목록 정리 (이 문서)
- [ ] Desktop 인프라 상태 확인 (Ollama/ComfyUI)

### 오늘 마감 (18:00까지)

- [ ] Phase 1-1 검증 시나리오 작성
- [ ] B팀 첫 체크인 수신 확인
- [ ] CURRENT_PHASE.md 업데이트 (Phase 1-1 시작 기록)

---

## 🖥️ Desktop 인프라 상태 확인 (매일 09:00)

### 체크리스트

**Ollama (Desktop)**:
- [ ] Desktop PC 전원 ON
- [ ] Docker Desktop 실행 중
- [ ] Ollama 컨테이너 실행 중
- [ ] `curl http://100.120.180.42:11434/api/tags` 응답 정상
- [ ] `qwen2.5:7b`, `qwen2.5:14b` 모델 존재 확인

**ComfyUI (Desktop)**:
- [ ] ComfyUI 프로세스 실행 중
- [ ] `curl http://100.120.180.42:8188` 응답 정상
- [ ] 필수 모델 존재 확인 (SD 1.5/XL, ControlNet 등)

**Mac mini (Backend API)**:
- [ ] Backend API 실행 중
- [ ] `curl http://localhost:8001/health` 응답 정상
- [ ] Database 연결 정상

### 문제 발생 시 대응

| 문제 | 조치 | 비고 |
|------|------|------|
| Ollama 컨테이너 중지 | `docker start ollama` | - |
| ComfyUI 중지 | ComfyUI 재시작 | Desktop에서 수동 실행 |
| 모델 누락 | 모델 다운로드 | B팀에게 알림 (작업 블로커) |
| 네트워크 불통 | 라우터/방화벽 확인 | 긴급 (B팀 작업 중단) |

---

## 📊 B팀 진행 상황 모니터링

### Daily 체크인 수신 (매일 18:00)

**수신 방법**: 슬랙 #sparklio-backend 채널

**기대 포맷**:
```
Phase X 진행 상황:
- ✅ 완료: ...
- 🔄 진행 중: ...
- ⏳ 다음: ...
```

**A팀 확인 사항**:
- [ ] 체크인 메시지 수신 확인
- [ ] 완료 항목이 예상과 일치하는지 확인
- [ ] 블로커 있는지 확인 (있으면 즉시 지원)
- [ ] CURRENT_PHASE.md 업데이트

### Phase별 검증 시점

| Phase | B팀 완료 예정 | A팀 검증 시점 | 검증 방법 |
|-------|--------------|--------------|----------|
| **Phase 1-1** | 2025-11-16 18:00 | 18:30 | Git 커밋 확인, 디렉토리 구조 체크 |
| **Phase 1-2** | 2025-11-17 18:00 | 18:30 | Mock API 테스트 스크립트 실행 |
| **Phase 1-3** | 2025-11-18 18:00 | 18:30 | Ollama 연결 확인 스크립트 실행 |
| **Phase 1-4** | 2025-11-19 18:00 | 18:30 | Media Gateway 테스트 |
| **Phase 2** | 2025-11-20 18:00 | 18:30 | Agent 리팩터링 확인 |
| **Phase 3** | 2025-11-21 18:00 | 18:30 | E2E 스크립트 실행 |

---

## ✅ Phase별 검증 시나리오 작성

### Phase 1-1: 디렉토리 구조 생성 (오늘)

**검증 파일**: `tests/phase1_1_verify.md`

**체크리스트**:
```markdown
## Phase 1-1 검증 (2025-11-16)

### 디렉토리 구조
- [ ] `backend/app/api/v1/endpoints/` 존재
- [ ] `backend/app/services/llm/providers/` 존재
- [ ] `backend/app/services/media/providers/` 존재
- [ ] `backend/app/services/clients/` 존재

### 파일 존재
- [ ] `app/services/llm/providers/base.py` (Provider 인터페이스)
- [ ] `app/core/config.py` (설정 업데이트)
- [ ] `.env` (환경 변수 추가)

### 코드 검증
- [ ] `base.py`에 `LLMProvider` ABC 클래스 존재
- [ ] `LLMProviderResponse` Pydantic 모델 존재
- [ ] `config.py`에 `GENERATOR_MODE` 설정 추가
- [ ] `.env`에 `OLLAMA_BASE_URL`, `COMFYUI_BASE_URL` 추가

### Git 확인
- [ ] 커밋 메시지 명확 (예: "feat: Add LLM Gateway directory structure")
- [ ] feature/llm-gateway-phase1 브랜치에 푸시
```

**A팀 작업**: 이 체크리스트 작성 후 B팀에게 공유 (참고용)

### Phase 1-2: LLM Gateway API Mock (내일)

**검증 파일**: `tests/phase1_2_verify.sh`

**테스트 스크립트**:
```bash
#!/bin/bash
# Phase 1-2 검증: Mock 모드 LLM Gateway API

echo "=== Phase 1-2 검증 시작 ==="

# 1. 환경 변수 확인
if [ "$GENERATOR_MODE" != "mock" ]; then
  echo "❌ GENERATOR_MODE=mock 설정 필요"
  exit 1
fi

# 2. Mock API 호출
echo "Mock LLM Gateway 테스트..."
response=$(curl -s -X POST http://localhost:8001/api/v1/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "copywriter",
    "task": "product_detail",
    "mode": "json",
    "payload": {"brief": "테스트 브리프"}
  }')

# 3. 응답 확인
if echo "$response" | jq -e '.provider' > /dev/null; then
  echo "✅ Mock 응답 정상"
  echo "$response" | jq .
else
  echo "❌ Mock 응답 오류"
  echo "$response"
  exit 1
fi

echo "=== Phase 1-2 검증 완료 ==="
```

**A팀 작업**: 내일(2025-11-17) 오전에 이 스크립트 작성

### Phase 1-3: Ollama 연결 (모레)

**검증 파일**: `tests/phase1_3_verify.sh`

**테스트 스크립트**:
```bash
#!/bin/bash
# Phase 1-3 검증: Live 모드 Ollama 연결

echo "=== Phase 1-3 검증 시작 ==="

# 1. 환경 변수 확인
export GENERATOR_MODE=live

# 2. Ollama 상태 확인
echo "Ollama 상태 확인..."
if ! curl -s http://100.120.180.42:11434/api/tags > /dev/null; then
  echo "❌ Ollama 연결 불가"
  exit 1
fi

# 3. Live API 호출
echo "Live LLM Gateway 테스트..."
response=$(curl -s -X POST http://localhost:8001/api/v1/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "copywriter",
    "task": "product_detail",
    "mode": "json",
    "payload": {"brief": "테스트 브리프"}
  }')

# 4. 응답 확인
if echo "$response" | jq -e '.provider == "ollama"' > /dev/null; then
  echo "✅ Ollama 연결 성공"
  echo "$response" | jq .
else
  echo "❌ Ollama 연결 오류"
  echo "$response"
  exit 1
fi

echo "=== Phase 1-3 검증 완료 ==="
```

**A팀 작업**: 2025-11-18 오전에 작성

---

## 🔧 B팀 지원 (질문/블로커 대응)

### 예상 질문 목록

**Q**: Provider 인터페이스 구현 시 에러 처리는?
**A**: `try-except` → `LLMProviderError` 발생, Gateway에서 표준 포맷으로 변환

**Q**: Router에서 모델 선택 로직은?
**A**: `provider_config.yaml` 참조, role+task 기반 매핑

**Q**: Mock 응답 데이터는 어디에?
**A**: `tests/fixtures/mock_responses.json` (A팀이 작성 예정)

**Q**: 타임아웃 설정은?
**A**: `OLLAMA_TIMEOUT=120`, `COMFYUI_TIMEOUT=300` (.env)

### 블로커 대응 프로세스

1. **B팀 블로커 발생**: 슬랙 즉시 공유
2. **A팀 확인**: 30분 내 응답
3. **해결 방법**:
   - 문서 오류 → 즉시 수정
   - 인프라 문제 → Desktop 점검
   - 설계 변경 필요 → PM 에스컬레이션
4. **기록**: 블로커 내용 + 해결책 → CURRENT_PHASE.md

---

## 📝 문서 유지 관리

### CURRENT_PHASE.md 업데이트 (매일 18:30)

**업데이트 항목**:
- 현재 Phase 상태
- B팀 오늘 완료 작업
- A팀 오늘 완료 작업
- 블로커 발생/해결 기록
- 내일 계획

**템플릿**:
```markdown
## 📅 2025-11-16 (토) - Day 0

### B팀 진행 상황
- ✅ Phase 1-1 완료: 디렉토리 구조 생성
- ✅ Provider 인터페이스 작성
- ⏳ 다음: Phase 1-2 (LLM Gateway API)

### A팀 진행 상황
- ✅ B팀 작업 지시 회신
- ✅ C팀 문서 체계 안내
- ✅ Phase 1-1 검증 완료
- ⏳ 다음: Phase 1-2 검증 시나리오 작성

### 블로커
- 없음

### 내일 계획
- B팀: Phase 1-2 구현
- A팀: Phase 1-2 검증 스크립트 작성
```

### 00_INDEX.md 업데이트 (주 1회)

**업데이트 시점**: 매주 금요일 17:00

**확인 사항**:
- 새 문서 추가되었는지 확인
- 문서 링크 유효성 확인
- 타임라인 업데이트

---

## 🧪 테스트 준비

### Mock 응답 데이터 작성

**파일**: `tests/fixtures/mock_responses.json`

**A팀 작업**: 2025-11-17 오전

**내용 예시**:
```json
{
  "llm": {
    "copywriter": {
      "product_detail": {
        "provider": "mock",
        "model": "mock-llm",
        "usage": {
          "prompt_tokens": 100,
          "completion_tokens": 200,
          "total_tokens": 300
        },
        "output": {
          "title": "Mock 상품 제목",
          "description": "Mock 상품 설명...",
          "features": ["특징1", "특징2"]
        },
        "meta": {
          "latency_ms": 50
        }
      }
    }
  }
}
```

### E2E 시나리오 Draft

**파일**: `tests/e2e/P0_SCENARIO.md`

**A팀 작업**: 2025-11-20

**내용**:
```markdown
# P0 E2E 시나리오: 상품 상세 + 이미지 1장

## 목표
- 브리프 생성 → 카피라이팅 → 이미지 생성 → 검토
- 전체 시간: 5분 이내
- 성공률: 100%

## 단계
1. BriefAgent → 마케팅 브리프 생성
2. CopywriterAgent → 상품 상세 카피 생성
3. VisionGeneratorAgent → 이미지 프롬프트 생성
4. Media Gateway → 이미지 생성
5. ReviewerAgent → 최종 검토

## 검증
- 각 단계 응답 시간 측정
- 에러 발생 여부 확인
- 최종 산출물 품질 확인
```

---

## 🎯 주간 목표 (Week 1)

### 2025-11-16 (토) - Day 0
- [x] B팀 작업 지시 회신
- [x] C팀 문서 체계 안내
- [x] A팀 작업 목록 정리
- [ ] Phase 1-1 검증
- [ ] Desktop 인프라 확인

### 2025-11-17 (일) - Day 1
- [ ] Phase 1-2 검증 스크립트 작성
- [ ] Mock 응답 데이터 작성
- [ ] B팀 Daily 체크인 수신
- [ ] CURRENT_PHASE.md 업데이트

### 2025-11-18 (월) - Day 2
- [ ] Phase 1-3 검증 스크립트 작성
- [ ] Ollama 연결 테스트
- [ ] C팀 문서 작성 확인
- [ ] B팀 Daily 체크인 수신

### 2025-11-19 (화) - Day 3
- [ ] Phase 1-4 검증
- [ ] Media Gateway 테스트
- [ ] B팀 Daily 체크인 수신

### 2025-11-20 (수) - Day 4
- [ ] Phase 2 검증 (Agent 리팩터링)
- [ ] E2E 시나리오 Draft 작성
- [ ] B팀 Daily 체크인 수신

### 2025-11-21 (목) - Day 5
- [ ] Phase 3 검증 (E2E 테스트)
- [ ] E2E 스크립트 실행
- [ ] B팀 Daily 체크인 수신

### 2025-11-22 (금) - Day 6
- [ ] Phase 4 전체 검증
- [ ] 문서 체계 리뷰
- [ ] 주간 회고 작성

---

## 📞 커뮤니케이션

### B팀과의 소통

**채널**: 슬랙 #sparklio-backend

**타이밍**:
- Daily 체크인: 18:00 (B팀 → A팀)
- 질문 응답: 30분 내
- 블로커 공유: 즉시

**톤**: 지원적, 비방해적
- ✅ "궁금한 점 있으면 언제든 물어보세요"
- ❌ "왜 아직 안 끝났나요?"

### C팀과의 소통

**채널**: 슬랙 #sparklio-frontend

**타이밍**:
- 문서 체계 안내 확인: 2025-11-18
- 첫 문서 작성 확인: 2025-11-20

### PM과의 소통

**타이밍**:
- 주간 요약: 매주 금요일 17:00
- 긴급 사항: 즉시

---

## ✅ 완료 체크리스트 (오늘)

**2025-11-16 18:00까지**:
- [x] B팀 작업 지시 회신 완료
- [x] C팀 문서 체계 안내 완료
- [x] A팀 작업 목록 작성 (이 문서)
- [ ] Desktop 인프라 상태 확인
- [ ] Phase 1-1 검증 시나리오 작성
- [ ] B팀 첫 체크인 수신 (18:00)
- [ ] CURRENT_PHASE.md 업데이트 (18:30)

---

## 📚 참고 문서

- [B팀 작업 지시 회신](../requests/2025-11-16_B팀_작업지시_회신.md)
- [C팀 문서 체계 안내](../requests/2025-11-16_C팀_문서체계_안내.md)
- [CURRENT_PHASE.md](./CURRENT_PHASE.md)
- [Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)
- [LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)

---

**작성**: A팀 (QA & Testing)
**작성일**: 2025-11-16 16:30
**다음 업데이트**: 매일 18:30 (B팀 체크인 후)

**핵심 메시지**: B팀이 집중할 수 있도록 **지원**하되 **방해하지 않기** 🚀
