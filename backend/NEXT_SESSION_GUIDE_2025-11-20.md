# 다음 세션 작업 가이드 - 2025년 11월 20일

**대상**: 다음 세션을 담당할 Claude AI
**이전 작업자**: B팀 Backend (2025-11-19 학원 노트북)
**작성일**: 2025-11-19 15:00
**최종 업데이트**: 2025-11-19 15:00

---

## ⚠️ 중요: 오늘(2025-11-19) 작업 완료

### 완료된 작업 (오전 + 오후)

**오전 작업**
- ✅ LLM Provider 구조적 버그 수정 (Anthropic, Gemini, Novita)
- ✅ Prompt 자동 변환 기능 구현 (`_prepare_workflow_payload()`)
- ✅ LLM 한국어 응답 강제 (system prompt 수정)

**오후 작업 (P0 + P1 전체 완료)**
- ✅ Backend Canvas Abstract Spec v2.0 완성 (800+ 줄 문서)
- ✅ Pydantic 스키마 구현 (350+ 줄)
- ✅ Abstract Canvas Builder 구현 (600+ 줄)
- ✅ 샘플 데이터 작성 (product_detail, sns_feed_set)
- ✅ Generator Service v2.0 통합
- ✅ TypeScript 타입 자동 생성 (250+ 줄)
- ✅ Agent 확장 플랜 검토

**Git 커밋**:
- `e899b3b` - LLM Provider 수정 + Prompt 변환
- `7b76994` - Canvas Abstract Spec v2.0 (P0)
- `49d35c9` - Generator Service v2.0 (P1)

**총 작업량**: 16개 파일, 2,400+ 줄 신규 코드

자세한 내용은 `EOD_REPORT_2025-11-19.md` 참고

---

## 🎯 세션 시작 시 필수 확인사항

### 1. 환경 확인
```bash
# 현재 날짜/시간 확인
date

# 작업 위치 확인 (집 서버 vs 학원 노트북)
# 집 서버: Mac mini (Redis 사용 가능)
# 학원 노트북: Redis 연결 불가 (100.123.51.5:6379)
```

### 2. Git 상태 확인
```bash
# 최근 커밋 확인
git log --oneline -5

# 예상 출력:
# 49d35c9 feat(backend): Generator Service v2.0 완성
# 7b76994 feat(backend): Canvas Abstract Spec v2.0 완성
# e899b3b fix(backend): LLM Provider 구조적 결함 수정

# 변경사항 확인
git status
```

### 3. 서버 상태 확인 (집 서버인 경우)
```bash
# 포트 8000 확인
netstat -ano | findstr ":8000"

# 서버 시작 (필요시)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 필수 문서 읽기
1. `EOD_REPORT_2025-11-19.md` - 오늘 작업 내용
2. `docs/BACKEND_CANVAS_SPEC_V2.md` - 새로 작성된 Canvas 추상 스펙
3. `AGENT_EXPANSION_PLAN_2025-11-18.md` - Agent 확장 로드맵
4. 이 문서 - 다음 작업 계획

---

## 📋 작업 계획 (우선순위)

### P0: 긴급 - 당장 해야 할 일

#### 1. VisionAnalyzerAgent 구현 시작 (Agent 확장 Phase 1) 🎯

**목표**: 이미지 품질 자동 평가 Agent 구현

**작업 순서**:

**STEP 1: Agent 클래스 구현 (3일 예상)**
- 파일: `app/services/agents/vision_analyzer.py`
- 클래스: `VisionAnalyzerAgent`
- Input 스키마: `VisionAnalysisInput`
- Output 스키마: `VisionAnalysisOutput`

```python
# app/services/agents/vision_analyzer.py 구조
class VisionAnalyzerAgent(BaseAgent):
    """이미지 품질 평가 Agent"""

    async def execute(
        self,
        image_input: Union[str, bytes],  # URL or base64
        criteria: Dict[str, bool],
        brand_guidelines: Optional[Dict] = None
    ) -> VisionAnalysisOutput:
        """
        Returns:
            quality_score: 0-1 (종합 점수)
            composition: 구도 분석 (score, analysis, issues)
            color_harmony: 색상 조화 (score, analysis, issues)
            brand_consistency: 브랜드 일관성 (score, matches, deviations)
            technical_quality: 기술적 품질 (score, resolution, clarity)
            improvements: 개선 제안 리스트
            overall_verdict: excellent/good/fair/poor
            requires_regeneration: bool
        """
```

**STEP 2: Vision API 통합 (2일 예상)**
- LLM Gateway에 Vision 지원 추가
- Vision-capable 모델 선택 로직
  - Primary: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
  - Fallback: GPT-4o (`gpt-4o`)
- 이미지 입력 처리 (URL/base64 지원)
- Prompt Engineering (분석 정확도 최적화)

**STEP 3: 품질 평가 로직 구현 (2일 예상)**
- Composition 분석 (배치, 균형, 시선 흐름)
- Color Harmony 분석 (색상 조화, 대비, 가독성)
- Brand Consistency 체크 (컬러, 폰트, 스타일)
- Technical Quality 평가 (해상도, 선명도)
- 종합 점수 계산 알고리즘

**STEP 4: 통합 테스트 (2일 예상)**
- Unit Test 작성
- Workflow 통합 (Designer → VisionAnalyzer)
- 샘플 이미지 테스트
- KPI 검증 (분석 정확도 >95%)

**STEP 5: 문서화 (1일 예상)**
- Agent 사용 가이드
- API 명세 업데이트
- 샘플 코드 작성

**총 예상 기간**: 10일 (2주)

**성공 기준**:
- [ ] VisionAnalyzerAgent 클래스 구현 완료
- [ ] Vision API 통합 완료 (Claude/GPT-4o)
- [ ] 품질 평가 로직 구현 완료
- [ ] 테스트 통과 (정확도 >95%)
- [ ] 문서 작성 완료

---

### P1: 중요 - 빠르게 완료하면 좋은 일

#### 2. AGENTS_SPEC.md 작성

**목표**: 모든 Agent의 명세를 하나의 문서로 통합

**내용**:
- 현재 구현된 6개 Agent 상세 명세
  - CopywriterAgent
  - StrategistAgent
  - DesignerAgent
  - ReviewerAgent
  - OptimizerAgent
  - EditorAgent
- 계획된 14개 Agent 개요
- Input/Output 스키마
- 사용 예시
- 제약사항

**예상 소요 시간**: 2시간

---

#### 3. GENERATORS_SPEC.md 작성

**목표**: 모든 Generator의 명세를 하나의 문서로 통합

**내용**:
- Generator 종류 및 용도
- Workflow 구조
- Input/Output 형식
- Canvas 생성 규칙 (v1.0 Legacy vs v2.0 Abstract)

**참고 파일**:
- `app/services/generator/service.py`
- `app/services/orchestrator/workflows.py`
- `app/services/canvas/`

**예상 소요 시간**: 2시간

---

### P2: 보통 - 시간이 남으면 하면 좋은 일

#### 4. LLM 한국어 응답 안정성 테스트

**목표**: 한국어 강제 prompt가 제대로 작동하는지 검증

**조건**: 집 서버 환경 필요 (Redis 접근 가능)

**테스트 케이스**:
```bash
# 1. Product Detail 생성
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_brand",
    "input": {"prompt": "지성 피부용 진정 토너"}
  }'

# 2. 응답에서 중국어 포함 여부 확인
# 3. 100% 한국어 응답 확인
```

**예상 소요 시간**: 1시간

---

#### 5. NanoBanana Provider 활성화

**목표**: Gemini Image Generation 기능 활성화

**작업 순서**:
```bash
# 1. 패키지 설치
pip install google-genai==1.50.1

# 2. .env 파일 확인
# GOOGLE_API_KEY 존재 여부 체크

# 3. 서버 재시작 및 로그 확인
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# "NanoBanana Provider initialized successfully" 확인
```

**예상 소요 시간**: 30분

---

## 🚧 알려진 이슈 및 제약사항

### 1. 환경 관련
- **노트북 환경**: Redis 연결 불가 (Mac mini 서버 100.123.51.5:6379)
- **LLM 테스트**: 서버 환경에서만 가능

### 2. LLM Provider 관련
- **NanoBanana**: `google-genai` 미설치로 비활성화 상태
- **Novita**: API 키가 placeholder (`your-novita-api-key-here`)

### 3. Canvas 관련
- **v1.0 (Fabric.js)**: Legacy, 하위 호환성 유지만
- **v2.0 (Abstract)**: 신규 구현 완료, 프론트엔드 통합 대기

### 4. Workflow 관련
- ProductContentWorkflow가 Reviewer, Optimizer 호출하지만 결과 미사용
- 불필요한 Agent 호출로 비용/시간 낭비 가능성

---

## 📚 참고 문서

### 프로젝트 개요
- `README.md` - 프로젝트 전체 구조

### 최근 작업 보고
- `EOD_REPORT_2025-11-19.md` - 오늘(11/19) 작업 내용
- `EOD_REPORT_2025-11-18.md` - 11/18 작업 내용

### 기술 스펙
- `docs/BACKEND_CANVAS_SPEC_V2.md` - Canvas 추상 스펙 v2.0
- `docs/OPENAPI_SPEC_V4_AGENT.md` - Agent API 명세
- `AGENT_EXPANSION_PLAN_2025-11-18.md` - Agent 확장 로드맵

### 팀 협업
- `C_TEAM_COORDINATION_REQUEST_2025-11-19.md` - C팀 조율 요청
- `C_TEAM_FEEDBACK_REVIEW_2025-11-19.md` - C팀 피드백 분석

---

## 🔧 개발 환경

### Python 환경
```bash
Python 3.11.8
pyenv-win (Windows)
```

### 주요 패키지
```bash
fastapi==0.121.2
uvicorn[standard]==0.38.0
openai==2.8.1
anthropic==0.73.0
google-generativeai==0.8.5
sqlalchemy==2.0.23
redis==5.0.1
pydantic==2.10.5
```

### 환경 변수
```bash
# .env 파일 위치: backend/.env
GENERATOR_MODE=live
LOG_LEVEL=INFO
OLLAMA_BASE_URL=http://100.120.180.42:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:7b

# Vision API 권장 설정
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # VisionAnalyzer용
OPENAI_MODEL=gpt-4o  # VisionAnalyzer Fallback
```

---

## 💡 유용한 명령어

### 서버 관련
```bash
# 서버 시작
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 모든 Python 프로세스 종료 (Windows)
taskkill //F //IM python.exe //T

# 캐시 삭제
find app -type d -name __pycache__ -exec rm -rf {} +
```

### 테스트 관련
```bash
# Health Check
curl http://localhost:8000/health

# Generator 테스트
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d @test_request.json

# 설정 확인
curl http://localhost:8000/api/v1/debug/settings
```

### Git 관련
```bash
# 현재 브랜치 확인
git branch

# 변경사항 확인
git status

# 스테이징
git add .

# 커밋
git commit -m "feat: commit message"

# 푸시
git push origin main
```

### TypeScript 타입 재생성
```bash
# Pydantic 스키마 변경 후 실행
python scripts/generate_types.py
```

---

## 🎯 성공 기준

### 필수 (Must Have)
- [ ] VisionAnalyzerAgent 구현 시작 (STEP 1-2 완료)
- [ ] Agent 클래스 기본 구조 완성
- [ ] Vision API 통합 완료

### 권장 (Should Have)
- [ ] AGENTS_SPEC.md 작성 완료
- [ ] GENERATORS_SPEC.md 작성 완료
- [ ] VisionAnalyzerAgent STEP 3-4 완료 (평가 로직, 테스트)

### 선택 (Nice to Have)
- [ ] LLM 한국어 응답 안정성 테스트
- [ ] NanoBanana Provider 활성화
- [ ] VisionAnalyzerAgent 문서화 완료

---

## 🚨 트러블슈팅 가이드

### 문제: 서버가 시작되지 않음
```bash
# 해결 1: 포트 충돌 확인
netstat -ano | findstr ":8000"

# 해결 2: 이전 프로세스 종료
taskkill //F //IM python.exe //T

# 해결 3: 캐시 삭제 후 재시작
find app -type d -name __pycache__ -exec rm -rf {} +
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 문제: Import Error
```bash
# 해결: 패키지 재설치
pip install -r requirements.txt
```

### 문제: Redis Connection Error (노트북 환경)
```
ConnectionRefusedError: [WinError 10061]
```
**해결**: 정상 동작 - 노트북에서는 Redis 접근 불가
- Mock 모드로 테스트: `GENERATOR_MODE=mock`
- 또는 집 서버에서 작업

### 문제: Vision API 호출 실패
```bash
# 확인 1: API 키 존재 여부
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# 확인 2: 모델 설정
# .env에서 claude-3-5-sonnet-20241022 또는 gpt-4o 사용 확인

# 확인 3: 로그 확인
# LOG_LEVEL=DEBUG로 설정 후 재시작
```

---

## 📞 도움이 필요할 때

### 사용자에게 물어봐야 하는 경우
1. Vision API 키 확인 (Anthropic, OpenAI)
2. Agent 확장 우선순위 변경 필요 시
3. 프론트엔드 팀(C팀)과 연동 테스트 일정

### 문서를 참고해야 하는 경우
1. Agent 동작 원리 → `app/services/agents/` 코드
2. Workflow 구조 → `app/services/orchestrator/workflows.py`
3. Canvas 스펙 → `docs/BACKEND_CANVAS_SPEC_V2.md`
4. 전체 아키텍처 → EOD Report 파일들 시간순 확인

---

## ✅ 세션 종료 전 체크리스트

- [ ] EOD 보고서 작성 완료
- [ ] 다음 세션 가이드 업데이트 완료
- [ ] Git 커밋 및 푸시 완료
- [ ] 서버 정상 작동 확인 (집 서버인 경우)
- [ ] 중요 파일 백업 확인

---

**작성 완료**: 2025-11-19 15:00
**다음 리뷰**: 2025-11-20 EOD

**Note**: VisionAnalyzerAgent 구현이 다음 세션의 핵심 작업입니다. Agent 확장 Phase 1의 P0 우선순위 작업이며, C팀과 충돌 없이 진행 가능합니다.
