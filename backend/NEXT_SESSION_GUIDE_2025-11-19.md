# 다음 세션 작업 가이드 - 2025년 11월 19일

**작성일**: 2025-11-18 (월) 16:50
**작성자**: B팀 Backend (Claude)
**대상**: 다음 세션 담당자
**예상 소요 시간**: 약 4-6시간

---

## 🎯 **이 문서의 목적**

이 가이드는 오늘(11/18) 작업 내용을 완벽히 인수인계하여, 내일 새로운 세션 담당자가 **보고서만 읽고** 즉시 작업을 시작할 수 있도록 작성되었습니다.

---

## 📖 **5분 빠른 시작 가이드**

### 1단계: 오늘 작업 요약 읽기 (2분)
```
파일: EOD_REPORT_2025-11-18.md
위치: backend/EOD_REPORT_2025-11-18.md
```

**핵심 요약**:
- ✅ C팀 긴급 요청 2건 완료 (textBaseline, OpenAI Provider)
- ✅ Agent 확장 플랜 수립 완료 (8주 로드맵)
- ✅ 서버 정상 작동 중 (포트 8000)

### 2단계: 서버 상태 확인 (1분)
```bash
# Backend 서버 상태 확인
curl http://localhost:8000/health

# 예상 응답: {"status": "healthy"}
```

### 3단계: Agent 확장 플랜 검토 (20분)
```
파일: AGENT_EXPANSION_PLAN_2025-11-18.md
위치: backend/AGENT_EXPANSION_PLAN_2025-11-18.md
크기: 약 20KB
```

**중요 섹션**:
- Section 3: Gap 분석 (6개 → 20개 Agent)
- Section 4: 8주 로드맵 (Phase 1-4)
- Section 7: 우선순위 및 일정

### 4단계: 오늘의 작업 결정 (2분)
이 가이드의 **"우선순위별 작업 계획"** 섹션 참고

---

## 📊 **어제(11/18) 작업 요약**

### 완료된 작업 (3건)

#### 1. C팀 긴급 요청 대응 ✅
- **textBaseline 오류**: Backend 코드 검증 (이미 수정됨) + 서버 재시작
- **OpenAI Provider 수정**: 추상 메서드 구현 (vendor, supports_json, generate)
- **결과**: 서버 정상 작동, Generate API 활성화

#### 2. Agent 확장 플랜 수립 ✅
- **현재 상태**: 6개 Agent (30% 완료)
- **목표**: 20개 Agent (AGENTS_SPEC.md 기준)
- **계획**: 8주 로드맵, 4 Phase 구조
- **산출물**: AGENT_EXPANSION_PLAN_2025-11-18.md (20KB)

#### 3. 문서화 완료 ✅
- EOD 보고서
- 내일 작업 가이드 (이 문서)
- C팀 보고서 2건
- Git 커밋 준비 완료

---

## 🗂️ **중요 파일 위치**

### 오늘 생성한 문서 (5개)
```
backend/
├── EOD_REPORT_2025-11-18.md                     # 오늘 작업 완료 보고서 ⭐
├── NEXT_SESSION_GUIDE_2025-11-19.md              # 이 문서 ⭐
├── AGENT_EXPANSION_PLAN_2025-11-18.md            # Agent 확장 전체 로드맵 ⭐⭐⭐
├── C_TEAM_TEXTBASELINE_FIX_REPORT_2025-11-18.md  # textBaseline 수정 보고
└── OPENAI_PROVIDER_FIX_2025-11-18.md             # OpenAI Provider 수정 보고
```

### 오늘 수정한 코드 (1개)
```
backend/
└── app/services/llm/providers/openai_provider.py  # OpenAI Provider 표준화
```

### 확인한 코드 (수정 없음)
```
backend/
└── app/services/canvas/fabric_builder.py          # textBaseline 이미 수정됨
```

### 핵심 참고 문서
```
backend/
├── AGENTS_SPEC.md           # 20개 Agent 스펙 정의
├── GENERATORS_SPEC.md       # 8개 Generator 스펙
└── B_TEAM_WORK_ORDER.md     # B팀 작업 지시서
```

---

## 🎯 **우선순위별 작업 계획**

### 우선순위 P0 (필수, 즉시 착수)

#### Task 1: Agent 확장 플랜 검토 및 승인 (1-2시간)
**목표**: A팀, C팀과 확장 플랜 공유 및 피드백 수렴

**세부 작업**:
1. `AGENT_EXPANSION_PLAN_2025-11-18.md` 정독 (20분)
2. A팀, C팀에게 플랜 공유 (10분)
   - 이메일 또는 문서 링크 공유
   - 핵심 요약 작성 (Executive Summary)
3. 피드백 수렴 (1시간)
   - 우선순위 조정 필요 여부
   - 일정 조정 필요 여부
   - 추가 요구사항
4. 플랜 최종 확정 (30분)
   - 피드백 반영
   - AGENT_EXPANSION_PLAN_2025-11-18.md 업데이트

**산출물**:
- 최종 확정된 AGENT_EXPANSION_PLAN_2025-11-18.md (v2.0)
- 팀 간 합의 문서 (간단한 이메일 또는 회의록)

**완료 기준**:
- [ ] A팀, C팀 모두 플랜 확인 완료
- [ ] 우선순위 및 일정 합의 완료
- [ ] 플랜 최종 버전 커밋

---

### 우선순위 P1 (중요, 오늘 착수 권장)

#### Task 2: Phase 1 착수 준비 - VisionAnalyzerAgent (2-3시간)
**목표**: VisionAnalyzerAgent 설계 완료 및 Mock Provider 우선 구현

**배경**:
- AGENT_EXPANSION_PLAN에서 **Phase 1 (2주)**의 핵심 Agent
- 이미지 품질 평가 기능 (해상도, 선명도, 색감, 구도)
- Designer Agent의 출력물 검증용

**세부 작업**:

**Step 1: 요구사항 분석 (30분)**
- AGENTS_SPEC.md의 VisionAnalyzerAgent 섹션 정독
- 입력: Canvas JSON + 이미지 URL
- 출력: 품질 점수 (1-10) + 개선 제안
- 의존성: Vision API (OpenAI GPT-4V, Google Gemini Vision)

**Step 2: 인터페이스 설계 (30분)**
```python
# app/services/agents/vision_analyzer_agent.py 설계

from .base import AgentBase, AgentRequest, AgentResponse

class VisionAnalyzerAgent(AgentBase):
    """
    이미지 품질 평가 Agent

    입력:
    - image_url: str
    - canvas_json: Dict (optional)

    출력:
    - quality_score: float (1-10)
    - dimensions: {
          "resolution": float,
          "sharpness": float,
          "color_balance": float,
          "composition": float
        }
    - suggestions: List[str]
    """

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # Vision API 호출
        # 점수 계산
        # 제안 생성
        pass
```

**Step 3: Mock Provider 우선 구현 (1시간)**
```python
# app/services/vision/providers/mock_vision_provider.py

class MockVisionProvider(VisionProvider):
    """개발 및 테스트용 Mock Provider"""

    async def analyze_image(self, image_url: str) -> VisionAnalysisResult:
        # 랜덤 점수 반환 (7-9점 사이)
        # 고정된 제안 반환
        return VisionAnalysisResult(
            quality_score=8.5,
            dimensions={...},
            suggestions=[...]
        )
```

**Step 4: 단위 테스트 작성 (30분)**
```python
# tests/services/agents/test_vision_analyzer_agent.py

async def test_vision_analyzer_basic():
    agent = VisionAnalyzerAgent()
    request = AgentRequest(...)
    response = await agent.execute(request)

    assert response.status == "success"
    assert 1 <= response.output.quality_score <= 10
```

**산출물**:
- `app/services/agents/vision_analyzer_agent.py` (구현)
- `app/services/vision/providers/mock_vision_provider.py` (Mock)
- `tests/services/agents/test_vision_analyzer_agent.py` (테스트)
- 설계 문서: `VISION_ANALYZER_DESIGN_2025-11-19.md`

**완료 기준**:
- [ ] VisionAnalyzerAgent 클래스 구현 완료
- [ ] Mock Provider 작동 확인
- [ ] 단위 테스트 통과
- [ ] 설계 문서 작성 완료

---

#### Task 3: Generate API 안정화 및 테스트 (1-2시간)
**목표**: OpenAI Provider 수정 후 E2E 테스트 완료

**배경**:
- 어제 OpenAI Provider 수정 완료
- 아직 실제 Generate API E2E 테스트 미실시

**세부 작업**:

**Step 1: OpenAI Provider 단독 테스트 (30분)**
```python
# tests/services/llm/providers/test_openai_provider.py

async def test_openai_provider_generate():
    provider = OpenAIProvider(api_key="...")

    response = await provider.generate(
        prompt="테스트 프롬프트",
        role="copywriter",
        task="product_detail",
        mode="json"
    )

    assert response.provider == "openai"
    assert response.model == "gpt-4o-mini"
    assert response.output.type == "json"
    assert response.usage["total_tokens"] > 0
```

**Step 2: Generate API E2E 테스트 (1시간)**
```bash
# API 호출 테스트
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "brand_demo",
    "input": {
      "product_name": "무선 이어폰",
      "features": ["노이즈 캔슬링", "30시간 배터리"],
      "target_audience": "20-30대 직장인"
    },
    "options": {
      "provider": "openai"
    }
  }'
```

**검증 항목**:
- [ ] 200 OK 응답
- [ ] Canvas JSON 포함
- [ ] textBaseline: "alphabetic" 값 사용
- [ ] LLM 사용자 입력 반영 ("무선 이어폰" 포함)
- [ ] 응답 시간 < 10초 (OpenAI는 Ollama보다 빠름)
- [ ] tokens_used > 0

**Step 3: C팀 최종 검증 요청 (30분)**
- Frontend에서 실제 Canvas 렌더링 테스트
- Console 에러 0개 확인
- 보고서 작성: `C_TEAM_FINAL_VERIFICATION_2025-11-19.md`

**산출물**:
- `tests/services/llm/providers/test_openai_provider.py`
- E2E 테스트 결과 문서
- C팀 검증 요청 문서

**완료 기준**:
- [ ] OpenAI Provider 단위 테스트 통과
- [ ] Generate API E2E 테스트 통과
- [ ] C팀 Frontend 검증 완료 (에러 0개)

---

### 우선순위 P2 (선택, 여유 있을 시)

#### Task 4: Database Schema 확장 설계 (1-2시간)
**목표**: Intelligence Agents (Phase 3)를 위한 DB 스키마 설계

**배경**:
- Phase 3 (TrendCollector, DataCleaner, Embedder, RAG)는 DB 의존성 높음
- 미리 스키마 설계해두면 Phase 3 착수 시 빠른 진행 가능

**세부 작업**:
1. `trends` 테이블 설계 (TrendCollector용)
2. `embeddings` 테이블 설계 (Embedder용, pgvector 사용)
3. `knowledge_base` 테이블 설계 (RAG용)
4. ERD 다이어그램 작성
5. Migration 스크립트 초안 작성

**산출물**:
- `DB_SCHEMA_DESIGN_PHASE3_2025-11-19.md`
- `migrations/versions/xxxx_add_intelligence_tables.py` (초안)

---

#### Task 5: Redis Caching 전략 수립 (1시간)
**목표**: Agent 응답 캐싱으로 성능 개선

**배경**:
- 동일한 프롬프트 반복 호출 시 LLM 비용 낭비
- Redis 캐싱으로 응답 시간 단축 (16초 → 1초)

**세부 작업**:
1. 캐싱 대상 결정 (Agent 응답, Canvas JSON)
2. 캐시 키 전략 설계 (hash of prompt + options)
3. TTL 전략 (1시간? 1일?)
4. Redis 연결 설정 (`app/core/redis.py`)

**산출물**:
- `REDIS_CACHING_STRATEGY_2025-11-19.md`
- `app/core/redis.py` (초안)

---

## 🔧 **서버 상태 및 환경 정보**

### Backend 서버
```
URL: http://localhost:8000
Status: ✅ Running (포트 8000)
Mode: --reload (자동 재로드)
Health Check: http://localhost:8000/health

# 서버 재시작 방법 (필요 시)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### LLM Provider 설정
```
Primary: Ollama (Tailscale 100.86.145.98:11434)
Model: qwen2.5:7b
Fallback: OpenAI GPT-4o-mini (수정 완료 ✅)

# Ollama 연결 확인
curl http://100.86.145.98:11434/api/tags
```

### 데이터베이스
```
현재: SQLite (개발용)
계획: PostgreSQL + pgvector (Phase 3)
```

---

## 🐛 **알려진 이슈 및 해결 방법**

### 이슈 1: Fabric.js textBaseline 버그
**상태**: ✅ 해결 완료 (C팀 Frontend 대응)

**내용**:
- Fabric.js 5.3.0 라이브러리 자체에 `textBaseline: 'alphabetical'` 하드코딩 버그
- Backend는 올바른 값(`"alphabetic"`) 반환 중 ✅

**해결**:
- C팀이 Frontend에서 Sanitize 함수로 임시 해결 완료 ✅
- 장기적으로 Fabric.js 업그레이드 필요 (C팀 담당)

**참고**: `frontend/FABRIC_BUG_REPORT.md`

---

### 이슈 2: OpenAI Provider 초기 구현 미비
**상태**: ✅ 해결 완료

**내용**:
- LLMProvider 추상 클래스의 필수 메서드 미구현
- `vendor`, `supports_json` 속성 없음
- `generate()` 메서드 시그니처 불일치

**해결**:
- `vendor` 속성 추가 ✅
- `supports_json` 속성 추가 ✅
- `generate()` 시그니처 수정 ✅

**참고**: `OPENAI_PROVIDER_FIX_2025-11-18.md`

---

### 이슈 3: Agent 확장 시 병목 예상
**상태**: ⏳ 계획 단계

**내용**:
- Phase 3 (Intelligence Agents)는 데이터 파이프라인 의존성 높음
- DB, Redis, Celery 등 인프라 확장 필요

**해결 계획**:
- Phase 2에서 인프라 설계 완료
- Phase 3 착수 전 인프라 배포
- Celery Task Queue 도입

**참고**: `AGENT_EXPANSION_PLAN_2025-11-18.md` Section 8 (리스크)

---

## 📞 **팀 간 협업 현황**

### C팀 (Frontend)
**최근 협업**:
- ✅ textBaseline 오류 긴급 대응 완료
- ✅ Backend API 정상화 확인
- ✅ Fabric.js 버그 근본 원인 발견 (C팀)
- ✅ Frontend 임시 해결 완료 (Sanitize 함수)

**다음 협업**:
- ⏳ Generate API E2E 테스트 (Frontend에서 Canvas 렌더링)
- ⏳ VisionAnalyzerAgent 구현 후 Frontend 연동

---

### A팀 (QA/테스트)
**최근 협업**:
- 없음

**다음 협업**:
- ⏳ Agent 확장 플랜 공유
- ⏳ VisionAnalyzerAgent QA 테스트 계획 수립

---

## 🎯 **성공 기준 (오늘의 목표)**

### 필수 목표 (P0)
- [ ] Agent 확장 플랜 A팀, C팀 공유 완료
- [ ] 피드백 수렴 및 플랜 최종 확정
- [ ] EOD 보고서 작성 (오늘 작업 내용)

### 권장 목표 (P1)
- [ ] VisionAnalyzerAgent 설계 완료
- [ ] Mock Provider 구현 및 테스트 통과
- [ ] Generate API E2E 테스트 완료
- [ ] C팀 Frontend 검증 완료 (에러 0개)

### 선택 목표 (P2)
- [ ] Database Schema 확장 설계 완료
- [ ] Redis Caching 전략 수립

---

## 📚 **참고 자료**

### 핵심 문서 (반드시 읽기)
1. `EOD_REPORT_2025-11-18.md` - 어제 작업 완료 보고서
2. `AGENT_EXPANSION_PLAN_2025-11-18.md` - 8주 확장 로드맵
3. `AGENTS_SPEC.md` - 20개 Agent 스펙 정의
4. `GENERATORS_SPEC.md` - 8개 Generator 스펙

### 참고 문서
5. `B_TEAM_WORK_ORDER.md` - B팀 작업 지시서
6. `OPENAI_PROVIDER_FIX_2025-11-18.md` - OpenAI Provider 수정 내역
7. `C_TEAM_TEXTBASELINE_FIX_REPORT_2025-11-18.md` - textBaseline 수정 보고
8. `frontend/FABRIC_BUG_REPORT.md` - Fabric.js 버그 분석

### 코드 참고
9. `app/services/agents/base.py` - Agent 기본 구조
10. `app/services/llm/providers/base.py` - LLM Provider 인터페이스
11. `app/services/orchestrator/workflows.py` - Workflow 패턴

---

## ⚡ **빠른 명령어 모음**

### 서버 관련
```bash
# 서버 시작
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 헬스 체크
curl http://localhost:8000/health

# Swagger UI 열기
open http://localhost:8000/docs
```

### Git 관련
```bash
# 변경사항 확인
git status
git diff

# 커밋 (어제 이미 완료됨)
git log -1

# 최신 변경사항 Pull
git pull origin main
```

### 테스트 관련
```bash
# 단위 테스트 실행
pytest tests/services/agents/

# 특정 테스트 실행
pytest tests/services/llm/providers/test_openai_provider.py -v

# 커버리지 확인
pytest --cov=app tests/
```

### 문서 검색
```bash
# Agent 관련 파일 찾기
find . -name "*agent*" -type f

# TODO 찾기
grep -r "TODO" app/

# FIXME 찾기
grep -r "FIXME" app/
```

---

## 💡 **인수인계 팁**

### 1. 처음 5분은 문서만 읽기
- 코드 보지 말고 문서부터 읽으세요
- `EOD_REPORT_2025-11-18.md` → `AGENT_EXPANSION_PLAN_2025-11-18.md` 순서

### 2. 서버 상태 확인부터
- Backend 서버 정상 작동 여부 확인
- 이상 있으면 즉시 재시작

### 3. 우선순위 준수
- P0 → P1 → P2 순서로 진행
- 시간 부족하면 P0만 완료해도 OK

### 4. 문서화 습관
- 모든 작업은 보고서로 남기기
- 코드 수정 시 주석 작성
- 중요 결정사항은 `DECISION_LOG.md`에 기록

### 5. 막히면 물어보기
- A팀, C팀과 적극 소통
- 혼자 고민하지 말고 협업

---

## 📊 **예상 작업 시간**

| 작업 | 우선순위 | 예상 시간 | 누적 시간 |
|-----|---------|----------|-----------|
| Agent 확장 플랜 검토 및 승인 | P0 | 1-2시간 | 2시간 |
| VisionAnalyzerAgent 설계 | P1 | 2-3시간 | 5시간 |
| Generate API 안정화 | P1 | 1-2시간 | 7시간 |
| Database Schema 설계 | P2 | 1-2시간 | 9시간 |
| Redis Caching 전략 | P2 | 1시간 | 10시간 |

**권장 일정**:
- 오전 (4시간): P0 완료 + P1 착수
- 오후 (4시간): P1 완료 + P2 착수 (여유 있으면)

---

## ✅ **세션 시작 체크리스트**

다음 세션 시작 시 아래 항목을 확인하세요:

- [ ] `EOD_REPORT_2025-11-18.md` 읽기 완료
- [ ] `AGENT_EXPANSION_PLAN_2025-11-18.md` 읽기 완료
- [ ] Backend 서버 정상 작동 확인
- [ ] Git 최신 상태 확인 (`git pull`)
- [ ] 오늘의 우선순위 작업 파악
- [ ] A팀, C팀 협업 필요 사항 확인

---

## 🎉 **마무리**

이 가이드를 따라 진행하시면, 오늘 작업을 원활하게 시작하실 수 있습니다.

**핵심 메시지**:
1. 문서부터 읽으세요 (코드 X)
2. 우선순위를 지키세요 (P0 → P1 → P2)
3. 문서화를 생활화하세요 (EOD 보고서)
4. 팀과 소통하세요 (A팀, C팀)

**Good Luck!** 🚀

---

**작성자**: Claude (B팀 Backend 개발)
**다음 검토자**: 내일 세션 담당자
**최종 업데이트**: 2025-11-18 16:50
