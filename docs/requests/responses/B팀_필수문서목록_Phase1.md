# B팀 필수 문서 목록 - Phase 1

**작성일**: 2025-11-16
**대상**: B팀 (Backend) 및 협업 팀
**목적**: Phase 1 작업 관련 필수 읽기 문서 정리

---

## 📚 작업 시작 전 반드시 읽을 문서

### ⭐ 최우선 필독 (익일 작업 시)

| 순서 | 문서 | 목적 | 중요도 |
|------|------|------|--------|
| 1 | [B팀 익일작업계획](./B팀_익일작업계획_2025-11-17.md) | 오늘 할 작업 전체 가이드 | ⭐⭐⭐ |
| 2 | [B팀 Phase1-3 완료보고](./B팀_Phase1-3_완료보고_2025-11-16.md) | 전일 작업 내용 및 이슈 | ⭐⭐⭐ |
| 3 | [ARCH-002](../architecture/ARCH-002-LLM_Gateway_Architecture.md) | LLM Gateway 아키텍처 | ⭐⭐⭐ |
| 4 | [SPEC-001](../architecture/SPEC-001-LLM_Gateway_API_Specification.md) | API 명세 및 규격 | ⭐⭐ |

---

## 📖 Phase 1 작업 히스토리

### Phase 1-1: Mock Provider 구현

**문서**: [B팀_Phase1-1_완료보고_2025-11-16.md](./B팀_Phase1-1_완료보고_2025-11-16.md)

**주요 내용**:
- Mock Provider 구현 및 테스트
- LLM Gateway 기본 구조
- Router 기본 구현
- Mock 모드 검증 완료

**커밋**: 643d6d8

**읽어야 할 시점**: Phase 1 전체 흐름 이해 필요 시

---

### Phase 1-2: Ollama Provider 초기 구현

**문서**: [B팀_Phase1-2_완료보고_2025-11-16.md](./B팀_Phase1-2_완료보고_2025-11-16.md)

**주요 내용**:
- Ollama Provider 구현
- Desktop GPU 서버 연결
- JSON 모드 지원
- 초기 Live 모드 테스트 (부분 성공)

**커밋**: 0d0d4ef, 4094100

**읽어야 할 시점**: Ollama Provider 코드 수정 시

---

### Phase 1-3: AsyncClient 리팩토링 및 디버깅 도구

**문서**: [B팀_Phase1-3_완료보고_2025-11-16.md](./B팀_Phase1-3_완료보고_2025-11-16.md) ⭐

**주요 내용**:
- AsyncClient 전역 인스턴스 → per-request 패턴 변경
- Debug 엔드포인트 3종 추가
- Windows 환경변수 이슈 발견 및 분석
- Gateway 로깅 강화

**커밋**: ee19f82

**읽어야 할 시점**:
- **익일 작업 시작 전 필수**
- 환경변수 이슈 디버깅 시
- AsyncClient 사용 패턴 참고 시

**핵심 교훈**:
- Pydantic 설정 우선순위: OS 환경변수 > .env > 기본값
- AsyncClient는 전역 재사용하지 말고 per-request로
- Debug 엔드포인트의 중요성

---

## 🏗️ 아키텍처 및 설계 문서

### ARCH-002: LLM Gateway Architecture

**경로**: `docs/architecture/ARCH-002-LLM_Gateway_Architecture.md`

**주요 섹션**:
1. Gateway 개요 및 목적
2. Provider 패턴
3. Router 역할
4. 설정 관리
5. 에러 핸들링

**읽어야 할 시점**:
- 새로운 Provider 추가 시
- Gateway 구조 이해 필요 시
- 아키텍처 논의 시

---

### SPEC-001: API Specification

**경로**: `docs/architecture/SPEC-001-LLM_Gateway_API_Specification.md`

**주요 섹션**:
1. 엔드포인트 명세
2. 요청/응답 포맷
3. 에러 코드 규격
4. 인증/인가 (향후)

**읽어야 할 시점**:
- API 응답 형식 확인 시
- 새로운 엔드포인트 추가 시
- 클라이언트 팀과 협업 시

---

## 💻 코드 참조 문서

### 주요 모듈별 README (향후 작성 예정)

| 모듈 | 경로 | 설명 |
|------|------|------|
| LLM Gateway | `app/services/llm/` | Gateway 및 Provider 전체 |
| Providers | `app/services/llm/providers/` | Mock, Ollama 등 Provider |
| Router | `app/services/llm/router.py` | 모델 선택 로직 |
| API Endpoints | `app/api/v1/endpoints/` | FastAPI 엔드포인트 |

---

## 🔧 환경 설정 관련

### 환경변수 우선순위 이해

**참고**: [Phase 1-3 완료보고 - 근본 원인 분석](./B팀_Phase1-3_완료보고_2025-11-16.md#-근본-원인-분석)

**Pydantic 로딩 순서**:
1. **OS 환경변수** (User/System) ← 최우선
2. `.env` 파일
3. `config.py` 기본값

**중요**:
- Windows 환경변수가 `.env` 파일을 오버라이드함
- 로컬 개발 시 OS 환경변수 설정 지양
- `.env` 파일로 관리 권장

### 설정 파일 위치

```
backend/
├── .env              # 환경별 설정 (git ignore)
├── .env.example      # 설정 템플릿
└── app/
    └── core/
        └── config.py # 설정 클래스 정의
```

---

## 🧪 테스트 가이드

### Debug 엔드포인트 사용법

**참고**: [Phase 1-3 완료보고 - 완료된 작업](./B팀_Phase1-3_완료보고_2025-11-16.md#-완료된-작업)

```bash
# 1. 현재 설정 확인
curl http://localhost:8000/api/v1/debug/settings | python -m json.tool

# 2. Ollama 연결 테스트
curl http://localhost:8000/api/v1/debug/ollama | python -m json.tool

# 3. 실제 생성 테스트
curl http://localhost:8000/api/v1/debug/ollama/generate | python -m json.tool
```

### E2E 테스트 시나리오

**참고**: [익일 작업계획 - Task 4](./B팀_익일작업계획_2025-11-17.md#task-4-live-모드-e2e-테스트-1시간)

---

## 🤝 협업 문서

### A팀 (Frontend) 관련

| 문서 | 목적 | 협업 시점 |
|------|------|-----------|
| API 명세 (SPEC-001) | API 인터페이스 공유 | API 통합 시 |
| 에러 코드 규격 | 에러 처리 방식 통일 | 에러 핸들링 구현 시 |
| 응답 포맷 | 데이터 구조 이해 | 화면 개발 시 |

### C팀 (Design/Content) 관련

| 문서 | 목적 | 협업 시점 |
|------|------|-----------|
| LLM 출력 포맷 | 생성 콘텐츠 구조 | 템플릿 설계 시 |
| 프롬프트 엔지니어링 | 품질 개선 | 콘텐츠 품질 이슈 시 |

---

## 📊 보고서 템플릿

### 일일 작업 완료 보고서 구조

**참고**: Phase 1-1, 1-2, 1-3 완료보고서

**기본 구성**:
1. 작업 개요
2. 완료된 작업 (상세)
3. 테스트 결과
4. 변경 사항 요약
5. 근본 원인 분석 (이슈 발생 시)
6. 다음 단계
7. 참고 문서
8. 교훈 및 개선사항
9. 커밋 정보

---

## 🔍 문제 해결 가이드

### 자주 묻는 질문 (FAQ)

#### Q1: "설정값이 예상과 다르게 로드됩니다"

**참고**: [Phase 1-3 완료보고 - 환경 설정 관리](./B팀_Phase1-3_완료보고_2025-11-16.md#1-환경-설정-관리)

1. `/debug/settings` 엔드포인트로 실제 로드된 값 확인
2. Windows 환경변수 확인
3. `.env` 파일 내용 확인
4. `config.py` 기본값 확인

#### Q2: "Ollama 연결이 실패합니다"

**참고**: [익일 작업계획 - Task 2](./B팀_익일작업계획_2025-11-17.md#task-2-ollama-연결-테스트-30분)

1. Desktop GPU 서버 상태 확인
2. Tailscale VPN 연결 확인
3. `/debug/ollama` 엔드포인트로 진단
4. 직접 curl 테스트: `curl http://100.120.180.42:11434/api/tags`

#### Q3: "AsyncClient 에러가 발생합니다"

**참고**: [Phase 1-3 완료보고 - AsyncClient 리팩토링](./B팀_Phase1-3_완료보고_2025-11-16.md#1-ollamaprovider-asyncclient-리팩토링)

- 전역 인스턴스 사용하지 말 것
- `async with httpx.AsyncClient() as client:` 패턴 사용
- 예제: `ollama.py` 참조

---

## 📅 문서 업데이트 이력

| 날짜 | 문서 | 변경 내용 |
|------|------|-----------|
| 2025-11-16 | Phase 1-1 완료보고 | 최초 작성 |
| 2025-11-16 | Phase 1-2 완료보고 | 최초 작성 |
| 2025-11-16 | Phase 1-3 완료보고 | 최초 작성 |
| 2025-11-16 | 익일작업계획 (11/17) | 최초 작성 |
| 2025-11-16 | 필수문서목록 | 최초 작성 |

---

## ✅ 문서 체크리스트

작업 시작 전:
- [ ] 익일 작업계획 읽기
- [ ] 전일 완료보고 읽기
- [ ] ARCH-002 재확인
- [ ] SPEC-001 필요 시 참조

작업 중:
- [ ] 막히는 부분 있으면 관련 문서 먼저 확인
- [ ] API 변경 시 SPEC-001 업데이트 필요성 검토
- [ ] 새로운 이슈 발견 시 문서화

작업 완료 후:
- [ ] 완료 보고서 작성
- [ ] 익일 작업계획 작성
- [ ] 필요시 아키텍처 문서 업데이트

---

## 🔗 빠른 링크

### Phase 1 완료보고서
- [Phase 1-1](./B팀_Phase1-1_완료보고_2025-11-16.md)
- [Phase 1-2](./B팀_Phase1-2_완료보고_2025-11-16.md)
- [Phase 1-3](./B팀_Phase1-3_완료보고_2025-11-16.md) ⭐ 최신

### 작업 계획
- [익일 작업계획 (2025-11-17)](./B팀_익일작업계획_2025-11-17.md) ⭐ 다음 작업

### 아키텍처
- [ARCH-002](../architecture/ARCH-002-LLM_Gateway_Architecture.md)
- [SPEC-001](../architecture/SPEC-001-LLM_Gateway_API_Specification.md)

---

**작성자**: B팀 (Backend)
**최종 업데이트**: 2025-11-16
**다음 리뷰**: 2025-11-17
