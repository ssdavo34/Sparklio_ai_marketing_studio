# LLM Gateway 구축 - A팀/B팀 업무 분담 계획서

**작성일**: 2025-11-16
**프로젝트**: Sparklio v4 - LLM/Media Gateway 구축
**총 예상 기간**: 4일
**우선순위**: 🔴 **최고** (테스트 타임아웃 해결 및 실제 LLM 연결)

---

## 📋 프로젝트 개요

### 목표
현재 Backend API 테스트 타임아웃 문제를 해결하고, LLM/ComfyUI를 실제로 연결하여 동작하는 AI 생성 시스템 구축

### 배경
- **현재 문제**: 189개 테스트 중 대부분 타임아웃 (Generator API가 LLM/ComfyUI 미연결)
- **근본 원인**: Gateway 레이어 부재, Mock/Live 모드 미분리
- **해결 방안**: 006번 방식 - 2개 Gateway + 6개 Agent + Mock/Live 분리

### 성공 지표 (4일 후)
- [ ] LLM Gateway + Media Gateway가 Mock/Live 양쪽 동작
- [ ] 6개 Agent가 Gateway 기반으로 리팩터링 완료
- [ ] P0 E2E "상품 상세 + 이미지 1장" 성공 (실제 생성)
- [ ] 기존 189개 테스트가 Mock 모드로 2분 이내 완료
- [ ] Live E2E 테스트 5개가 각각 120초 이내 완료

---

## 🎯 Phase별 업무 분담

### Phase 1: Gateway 기초 구축 (1-2일)

**목표**: LLM Gateway + Media Gateway가 Ollama/ComfyUI와 실제 통신

#### B팀 작업 (Backend 구현)
**예상 시간**: 1.5-2일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| B1-1 | Backend 디렉토리 구조 생성 | 🔴 최고 | 0.5시간 |
| B1-2 | GENERATOR_MODE 환경변수 추가 (.env) | 🔴 최고 | 0.5시간 |
| B1-3 | LLM Gateway API 엔드포인트 구현 | 🔴 최고 | 4시간 |
| B1-4 | OllamaProvider 구현 (실제 Ollama 연결) | 🔴 최고 | 3시간 |
| B1-5 | LLM Router 구현 (role/task → model 선택) | 🟡 중간 | 2시간 |
| B1-6 | Media Gateway API 엔드포인트 구현 | 🔴 최고 | 3시간 |
| B1-7 | ComfyUIProvider 구현 (실제 ComfyUI 연결) | 🔴 최고 | 4시간 |
| B1-8 | Mock 응답 구현 (LLM + Media) | 🟡 중간 | 2시간 |

**총 예상**: 19시간 (2.5일, 여유 포함)

#### A팀 작업 (검증 및 테스트)
**예상 시간**: 0.5일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| A1-1 | Ollama Docker 컨테이너 상태 확인 | 🔴 최고 | 0.5시간 |
| A1-2 | ComfyUI 실행 상태 확인 및 워크플로 준비 | 🔴 최고 | 1시간 |
| A1-3 | Gateway Mock 모드 수동 테스트 (Postman) | 🟡 중간 | 1시간 |
| A1-4 | Gateway Live 모드 수동 테스트 (Postman) | 🔴 최고 | 1.5시간 |
| A1-5 | 테스트 결과 문서화 및 이슈 리포트 | 🟡 중간 | 0.5시간 |

**총 예상**: 4.5시간

---

### Phase 2: Agent 리팩터링 (1일)

**목표**: 6개 Agent가 Gateway만 사용하도록 수정

#### B팀 작업 (Agent 리팩터링)
**예상 시간**: 1일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| B2-1 | LLMGatewayClient 공통 클라이언트 구현 | 🔴 최고 | 2시간 |
| B2-2 | MediaGatewayClient 공통 클라이언트 구현 | 🔴 최고 | 1.5시간 |
| B2-3 | BriefAgent 리팩터링 (Gateway 사용) | 🔴 최고 | 1시간 |
| B2-4 | BrandAgent 리팩터링 (Gateway 사용) | 🔴 최고 | 1시간 |
| B2-5 | StrategistAgent 리팩터링 (Gateway 사용) | 🔴 최고 | 1시간 |
| B2-6 | CopywriterAgent 리팩터링 (Gateway 사용) | 🔴 최고 | 1시간 |
| B2-7 | VisionGeneratorAgent 리팩터링 (LLM+Media) | 🔴 최고 | 1.5시간 |
| B2-8 | ReviewerAgent 리팩터링 (Gateway 사용) | 🟡 중간 | 1시간 |

**총 예상**: 10시간 (1.25일, 여유 포함)

#### A팀 작업 (검증)
**예상 시간**: 0.25일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| A2-1 | Agent별 단위 테스트 (Mock 모드) | 🟡 중간 | 1.5시간 |
| A2-2 | Agent별 단위 테스트 (Live 모드) | 🔴 최고 | 1시간 |
| A2-3 | 직접 Ollama/ComfyUI 호출 코드 제거 확인 | 🔴 최고 | 0.5시간 |

**총 예상**: 3시간

---

### Phase 3: P0 E2E 구현 (1일)

**목표**: "상품 상세 + 이미지 1장" 전체 플로우 성공

#### B팀 작업 (E2E 스크립트)
**예상 시간**: 0.75일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| B3-1 | P0 E2E 스크립트 골격 작성 | 🔴 최고 | 1.5시간 |
| B3-2 | 6개 Agent 순차 호출 구현 | 🔴 최고 | 2시간 |
| B3-3 | 중간 결과 저장 및 에러 핸들링 | 🟡 중간 | 1.5시간 |
| B3-4 | 최종 JSON 출력 포맷 정리 | 🟡 중간 | 1시간 |

**총 예상**: 6시간

#### A팀 작업 (E2E 테스트 및 검증)
**예상 시간**: 0.5일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| A3-1 | Mock 모드 E2E 테스트 (구조 검증) | 🟡 중간 | 1시간 |
| A3-2 | Live 모드 E2E 테스트 (실제 생성) | 🔴 최고 | 2시간 |
| A3-3 | 생성된 이미지 품질 검증 | 🟡 중간 | 1시간 |
| A3-4 | E2E 결과 문서화 및 개선사항 도출 | 🟡 중간 | 0.5시간 |

**총 예상**: 4.5시간

---

### Phase 4: 테스트 정리 (0.5일)

**목표**: 기존 189개 테스트를 Mock/Live로 분리

#### A팀 작업 (테스트 리팩터링)
**예상 시간**: 0.5일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| A4-1 | 기존 테스트 분석 및 Mock/Live 분류 | 🔴 최고 | 1시간 |
| A4-2 | Mock 모드 테스트 파일 작성 (189개) | 🔴 최고 | 2시간 |
| A4-3 | Live 모드 E2E 테스트 파일 작성 (5-10개) | 🟡 중간 | 1.5시간 |
| A4-4 | package.json 스크립트 추가 | 🟡 중간 | 0.5시간 |

**총 예상**: 5시간

#### B팀 작업 (지원)
**예상 시간**: 0.25일

| 작업 ID | 작업 내용 | 우선순위 | 예상 시간 |
|--------|---------|---------|----------|
| B4-1 | Mock 응답 데이터 품질 개선 | 🟡 중간 | 1.5시간 |
| B4-2 | 타임아웃 설정 최적화 | 🟡 중간 | 0.5시간 |

**총 예상**: 2시간

---

## 📊 팀별 총 작업량 요약

### B팀 (Backend 개발)

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | Gateway 구축 | 19시간 (2.5일) | 🔴 최고 |
| Phase 2 | Agent 리팩터링 | 10시간 (1.25일) | 🔴 최고 |
| Phase 3 | E2E 스크립트 | 6시간 (0.75일) | 🔴 최고 |
| Phase 4 | 테스트 지원 | 2시간 (0.25일) | 🟡 중간 |
| **총계** | | **37시간 (4.75일)** | |

**권장 일정**: 5일 (여유 20% 포함)

### A팀 (QA & Testing)

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 인프라 확인 및 검증 | 4.5시간 | 🔴 최고 |
| Phase 2 | Agent 검증 | 3시간 | 🟡 중간 |
| Phase 3 | E2E 테스트 | 4.5시간 | 🔴 최고 |
| Phase 4 | 테스트 정리 | 5시간 | 🔴 최고 |
| **총계** | | **17시간 (2일)** | |

**권장 일정**: 2.5일 (여유 25% 포함)

---

## 🔄 협업 포인트

### B팀 → A팀 전달 사항

1. **Phase 1 완료 시**:
   - Gateway API 엔드포인트 URL 및 스펙
   - Mock/Live 모드 테스트 가이드
   - Postman Collection

2. **Phase 2 완료 시**:
   - Agent별 입력/출력 JSON 샘플
   - Gateway Client 사용 예시 코드

3. **Phase 3 완료 시**:
   - E2E 스크립트 실행 방법
   - 예상 실행 시간 및 리소스 사용량

### A팀 → B팀 피드백

1. **Phase 1 중간**:
   - Ollama/ComfyUI 연결 상태 리포트
   - Gateway 수동 테스트 결과

2. **Phase 2 중간**:
   - Agent별 테스트 결과
   - 발견된 버그 및 개선사항

3. **Phase 3 완료 시**:
   - E2E 품질 평가
   - 생성물 품질 검증 결과

---

## ⚠️ 리스크 관리

### 고위험 항목

| 리스크 | 영향도 | 발생 확률 | 대응 방안 | 담당 팀 |
|-------|-------|----------|----------|---------|
| Ollama 연결 실패 | 높음 | 중간 | Desktop Docker 재시작, 네트워크 점검 | A팀 |
| ComfyUI 워크플로 오류 | 중간 | 중간 | 간단한 워크플로부터 시작 | A팀 + B팀 |
| Agent 리팩터링 범위 과다 | 중간 | 낮음 | 3개 Agent만 먼저 완성 | B팀 |
| E2E 타임아웃 | 낮음 | 낮음 | Live 모드 타임아웃 180초로 늘림 | A팀 + B팀 |

### 일정 지연 대응

**1일 지연 시**:
- Phase 2와 Phase 3 병렬 진행 (Agent 리팩터링 중 E2E 스크립트 작성)

**2일 지연 시**:
- Agent를 6개 → 3개로 축소 (Brief, Strategist, Vision만)
- E2E 시나리오 간소화

**3일 이상 지연 시**:
- Gateway만 먼저 완성하여 수동 테스트 가능 상태로 전환
- Agent 리팩터링은 다음 스프린트로 이월

---

## 📅 권장 일정표

### B팀 일정 (5일)

| 날짜 | 오전 (4h) | 오후 (4h) | 완료 기준 |
|-----|----------|----------|----------|
| **Day 1** | B1-1, B1-2, B1-3 시작 | B1-3 완료, B1-4 시작 | LLM Gateway API 동작 |
| **Day 2** | B1-4, B1-5 완료 | B1-6, B1-7 시작 | Ollama 연결 성공 |
| **Day 3** | B1-7, B1-8 완료 | B2-1, B2-2, B2-3 | Media Gateway 완성 |
| **Day 4** | B2-4~B2-8 완료 | B3-1~B3-4 | 6개 Agent 리팩터링 완료 |
| **Day 5** | B3-4 최종 검토 | B4-1, B4-2 | E2E 스크립트 완성 |

### A팀 일정 (2.5일)

| 날짜 | 오전 (4h) | 오후 (4h) | 완료 기준 |
|-----|----------|----------|----------|
| **Day 1** | A1-1, A1-2 | A1-3 | 인프라 준비 완료 |
| **Day 2** | A1-4, A1-5 | A2-1, A2-2 시작 | Gateway Live 검증 |
| **Day 3** | A2-2, A2-3 완료 | A3-1, A3-2 | Agent 검증 완료 |
| **Day 4** | A3-3, A3-4 | A4-1, A4-2 시작 | E2E 성공 |
| **Day 5** | A4-2~A4-4 완료 | 최종 검증 | 테스트 정리 완료 |

---

## ✅ 완료 체크리스트

### Phase 1 완료 조건
- [ ] `/api/v1/llm/generate` Mock 모드 동작
- [ ] `/api/v1/llm/generate` Live 모드로 Ollama 호출 성공
- [ ] `/api/v1/media/image/generate` Mock 모드 동작
- [ ] `/api/v1/media/image/generate` Live 모드로 ComfyUI 호출 성공
- [ ] Postman Collection으로 4가지 모두 테스트 완료

### Phase 2 완료 조건
- [ ] 6개 Agent 모두 Gateway Client 사용
- [ ] Agent 코드에서 직접 Ollama/ComfyUI import 제거
- [ ] 각 Agent Mock 모드 단위 테스트 통과
- [ ] 각 Agent Live 모드 단위 테스트 통과

### Phase 3 완료 조건
- [ ] E2E 스크립트 Mock 모드 30초 이내 완료
- [ ] E2E 스크립트 Live 모드 3분 이내 완료
- [ ] 최종 JSON에 6개 Agent 결과 모두 포함
- [ ] 생성된 이미지 URL 접근 가능
- [ ] 이미지 품질 육안 검증 통과

### Phase 4 완료 조건
- [ ] Mock 모드 테스트 189개 2분 이내 완료
- [ ] Live 모드 E2E 테스트 5-10개 각 120초 이내
- [ ] npm 스크립트 정상 동작 (`test:backend`, `test:backend:live`)
- [ ] CI/CD에서 Mock 테스트 자동 실행

---

## 📚 참고 문서

### 필수 읽기 (B팀)
1. [LLM_CONNECTION_ANALYSIS_REPORT.md](../reports/LLM_CONNECTION_ANALYSIS_REPORT.md)
2. [002. LLM Gateway Spec v1.0.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\002. LLM Gateway Spec v1.0.md)
3. [003. Media Gateway Spec v1.0.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\003. Media Gateway Spec v1.0.md)
4. [006. 005의 축소버젼.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\006. 005의 축소버젼.md)

### 필수 읽기 (A팀)
1. [A_TEAM_QA_WORK_ORDER.md](../A_TEAM_QA_WORK_ORDER.md)
2. [LLM_CONNECTION_ANALYSIS_REPORT.md](../reports/LLM_CONNECTION_ANALYSIS_REPORT.md)

---

**다음 문서**: [B팀 상세 작업 지시서](./BACKEND_LLM_GATEWAY_WORK_ORDER.md)

**작성 완료**: 2025-11-16
**승인 필요**: PM 확인 후 B팀 전달
