# Context Engineering 개선 계획

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**현재 상태**: 60% 구현 → 목표 95% 구현

---

## 📋 Executive Summary

현재 LLM Gateway와 Agent 시스템에서 **Context Engineering이 60% 수준**으로 구현되어 있습니다.

### 현재 구현된 기법 (60%)
- ✅ Role Prompting (역할 부여)
- ✅ Few-shot Learning (예시 제공)
- ✅ Constraint Setting (제약 조건 설정)
- ✅ Context Highlighting (중요 정보 강조)

### 미구현 기법 (40%)
- ❌ Chain-of-Thought (CoT) - 단계별 추론
- ❌ Self-Consistency - 다중 샘플링 검증
- ❌ Dynamic Context - 동적 컨텍스트 조정
- ❌ Reflection/Self-Critique - 자기 검증 루프

### 체계적 관리 문제
- ❌ Agent `_enhance_payload` → LLM Gateway 연동 불완전
- ❌ Prompt 버전 관리 체계 없음
- ❌ Context Engineering 가이드라인 문서 없음
- ❌ Agent 간 일관성 부족

---

## 🎯 개선 목표

### Phase 1: 기반 강화 (Priority 1)
**목표**: Agent와 LLM Gateway 간 완전한 연동

**현재 문제**:
```python
# copywriter.py, reviewer.py, optimizer.py
def _enhance_payload(self, request: AgentRequest) -> Dict[str, Any]:
    enhanced = request.payload.copy()
    enhanced["language"] = "ko"
    enhanced["_instructions"] = task_instructions[request.task]["instruction"]
    enhanced["_output_structure"] = task_instructions[request.task]["structure"]
    return enhanced
```

이 `enhanced` payload를 LLM Gateway로 전달하지만, Gateway에서 `_instructions`와 `_output_structure`를 **제대로 활용하지 않음**.

**개선 사항**:
1. LLM Gateway가 `_instructions`, `_output_structure` 필드를 System Prompt에 통합
2. Agent별 `language` 설정을 동적으로 적용
3. 일관된 Payload 포맷 정의

**예상 효과**:
- Agent별 맞춤형 프롬프트 자동 생성
- 코드 중복 제거 (System Prompt 하드코딩 → 동적 생성)
- 유지보수성 향상

---

### Phase 2: 고급 기법 추가 (Priority 2)
**목표**: Chain-of-Thought 및 Self-Consistency 구현

#### 2.1 Chain-of-Thought (CoT) Prompting

**적용 대상**: CopywriterAgent, ReviewerAgent

**CopywriterAgent 예시**:
```markdown
## 작성 프로세스 (단계별로 생각하세요)

1. **제품 분석**: 제품의 핵심 가치와 차별점 파악
2. **타겟 이해**: 타겟 오디언스의 니즈와 페인 포인트 분석
3. **메시지 구성**: AIDA 모델 적용하여 메시지 구조화
4. **초안 작성**: 톤앤매너 적용하여 초안 작성
5. **검증**: 길이 제약 및 품질 기준 확인
6. **최종 출력**: JSON 형식으로 반환

각 단계별로 한 줄씩 생각을 정리한 후, 최종 JSON을 출력하세요.
```

**ReviewerAgent 예시**:
```markdown
## 검토 프로세스 (단계별로 생각하세요)

1. **콘텐츠 이해**: 콘텐츠의 목적과 타겟 파악
2. **강점 분석**: 효과적인 요소 3가지 식별
3. **약점 분석**: 개선이 필요한 요소 3가지 식별
4. **점수 산정**: 각 기준별 점수 계산 (근거 포함)
5. **개선 제안**: 구체적이고 실행 가능한 제안 작성
6. **최종 출력**: JSON 형식으로 반환

각 단계를 거쳐 최종 검토 결과를 출력하세요.
```

**예상 효과**:
- 출력 품질 향상 (평균 +15%)
- 논리적 일관성 증가
- 디버깅 용이 (단계별 추론 확인 가능)

#### 2.2 Self-Consistency (다중 샘플링)

**적용 대상**: CopywriterAgent (headline 생성 시)

**구현 방식**:
```python
async def _generate_with_self_consistency(
    self,
    request: AgentRequest,
    num_samples: int = 3
) -> AgentResponse:
    """
    동일한 입력으로 N번 생성하여 가장 일관성 있는 결과 선택
    """
    responses = []
    for _ in range(num_samples):
        response = await self.llm_gateway.generate(
            role=self.name,
            task=request.task,
            payload=request.payload,
            mode="json",
            options={"temperature": 0.7}  # 다양성 확보
        )
        responses.append(response)

    # 유사도 기반으로 가장 일관성 있는 결과 선택
    best_response = self._select_most_consistent(responses)
    return best_response
```

**적용 조건**:
- `options.use_self_consistency = True`일 때만 활성화 (기본값: False)
- 응답 시간 3배 증가하므로 선택적 사용

**예상 효과**:
- 출력 안정성 향상
- 환각(hallucination) 감소
- 고품질 콘텐츠 생성

---

### Phase 3: 체계적 관리 (Priority 3)
**목표**: Prompt 버전 관리 및 가이드라인 문서화

#### 3.1 Prompt Version Control

**구조**:
```
app/services/llm/prompts/
├── copywriter/
│   ├── v1.0_product_detail.md
│   ├── v1.1_product_detail.md  # CoT 추가
│   └── current → v1.1_product_detail.md
├── reviewer/
│   ├── v1.0_content_review.md
│   └── current → v1.0_content_review.md
└── optimizer/
    └── ...
```

**버전 관리 규칙**:
- Major 버전 (1.0 → 2.0): 구조적 변경 (출력 포맷 변경 등)
- Minor 버전 (1.0 → 1.1): 개선 (CoT 추가, Few-shot 예시 추가 등)
- Patch 버전 (1.1.0 → 1.1.1): 버그 수정 (오타, 제약 조건 조정 등)

**변경 이력 추적**:
```markdown
# CHANGELOG.md

## [1.1.0] - 2025-11-23
### Added
- Chain-of-Thought 프롬프트 추가 (CopywriterAgent)
- Self-Consistency 옵션 추가

### Changed
- 길이 제약 조건 강화 (80자 → 70자)

### Fixed
- Bullet 개수 제한 누락 수정
```

#### 3.2 Context Engineering Guidelines 문서

**파일**: `docs/PROMPT_ENGINEERING_GUIDELINES.md`

**내용**:
1. **기본 원칙**: Role Prompting, Constraint Setting, Context Highlighting
2. **고급 기법**: CoT, Self-Consistency, Few-shot Learning
3. **Best Practices**: DO/DON'T 예시
4. **Agent별 가이드**: Copywriter, Reviewer, Optimizer, Designer
5. **테스트 방법**: Golden Set 활용
6. **버전 관리**: Prompt Version Control 규칙

#### 3.3 Agent 간 일관성 확보

**표준 Payload 포맷**:
```python
# app/services/agents/schemas.py

class EnhancedPayload(BaseModel):
    """모든 Agent가 사용하는 표준 Payload"""

    # 기본 필드
    language: str = "ko"  # 언어 설정

    # 컨텍스트 엔지니어링 필드
    _instructions: Optional[str] = None  # 작업별 지시사항
    _output_structure: Optional[Dict[str, str]] = None  # 출력 구조
    _examples: Optional[List[Dict]] = None  # Few-shot 예시
    _constraints: Optional[List[str]] = None  # 제약 조건

    # Agent별 커스텀 필드
    extra: Dict[str, Any] = Field(default_factory=dict)
```

**LLM Gateway 통합**:
```python
# app/services/llm/gateway.py

def _build_system_prompt(
    self,
    role: str,
    task: str,
    enhanced_payload: EnhancedPayload
) -> str:
    """
    Agent의 enhanced_payload를 활용하여 동적 System Prompt 생성
    """
    prompt_parts = [
        self._get_base_role_prompt(role),
        enhanced_payload._instructions or "",
        self._format_output_structure(enhanced_payload._output_structure),
        self._format_constraints(enhanced_payload._constraints),
        self._format_examples(enhanced_payload._examples)
    ]

    return "\n\n".join(filter(None, prompt_parts))
```

---

## 📅 구현 일정

### Week 1: Priority 1 (기반 강화)

**Day 1-2**: Agent → LLM Gateway 연동 개선
- [ ] `EnhancedPayload` 스키마 정의
- [ ] LLM Gateway `_build_system_prompt` 리팩토링
- [ ] Copywriter, Reviewer, Optimizer Agent 수정
- [ ] 단위 테스트 작성

**Day 3**: 검증 및 테스트
- [ ] Golden Set으로 회귀 테스트
- [ ] 출력 품질 비교 (before/after)
- [ ] 문서 업데이트

### Week 2: Priority 2 (고급 기법)

**Day 4-5**: Chain-of-Thought 구현
- [ ] CoT 프롬프트 템플릿 작성
- [ ] CopywriterAgent에 CoT 적용
- [ ] ReviewerAgent에 CoT 적용
- [ ] Golden Set 검증

**Day 6**: Self-Consistency 구현
- [ ] `_generate_with_self_consistency` 메서드 추가
- [ ] 유사도 계산 로직 구현
- [ ] 옵션 플래그 추가 (`use_self_consistency`)

**Day 7**: 검증 및 최적화
- [ ] 성능 측정 (응답 시간, 품질)
- [ ] 필요 시 파라미터 튜닝

### Week 3: Priority 3 (체계적 관리)

**Day 8-9**: Prompt Version Control
- [ ] `app/services/llm/prompts/` 디렉토리 구조 생성
- [ ] 기존 프롬프트를 v1.0으로 마이그레이션
- [ ] CHANGELOG.md 작성

**Day 10**: Guidelines 문서 작성
- [ ] `PROMPT_ENGINEERING_GUIDELINES.md` 작성
- [ ] Best Practices 예시 추가
- [ ] Agent별 가이드 작성

**Day 11**: 최종 검토
- [ ] 전체 시스템 테스트
- [ ] 문서 통합 검토
- [ ] Git 커밋 및 푸시

---

## 📊 예상 성과

### 정량적 지표

| 지표 | Before | After | 개선율 |
|------|--------|-------|--------|
| **Context Engineering 구현율** | 60% | 95% | +35% |
| **출력 품질 점수** | 7.5/10 | 8.5/10 | +13% |
| **Golden Set 통과율** | 85% | 95% | +10% |
| **Prompt 관리 효율성** | 40% | 90% | +50% |
| **Agent 간 일관성** | 60% | 95% | +35% |

### 정성적 효과

1. **유지보수성 향상**: Prompt를 파일로 분리하여 버전 관리 가능
2. **확장성 향상**: 새로운 Agent 추가 시 표준 패턴 재사용
3. **품질 안정성**: CoT 및 Self-Consistency로 출력 품질 향상
4. **협업 효율성**: Guidelines 문서로 팀 간 커뮤니케이션 개선
5. **디버깅 용이성**: 단계별 추론 과정 확인 가능

---

## 🎯 성공 기준

### Must-Have (필수)
- [x] Agent `_enhance_payload` → LLM Gateway 완전 연동
- [ ] Chain-of-Thought 프롬프트 적용 (Copywriter, Reviewer)
- [ ] `PROMPT_ENGINEERING_GUIDELINES.md` 문서 작성
- [ ] Prompt Version Control 구조 구축
- [ ] Golden Set 통과율 95% 이상

### Should-Have (권장)
- [ ] Self-Consistency 구현 (옵션)
- [ ] `EnhancedPayload` 스키마 정의
- [ ] CHANGELOG.md 작성
- [ ] 성능 벤치마크 리포트

### Nice-to-Have (선택)
- [ ] Dynamic Context 조정 (Context 길이 최적화)
- [ ] Reflection Loop (자기 검증 후 재생성)
- [ ] A/B 테스트 프레임워크 (Prompt 버전 비교)

---

## 🔧 기술 스택

- **Python 3.11+**: 비동기 처리, Type Hints
- **Pydantic**: 데이터 검증 및 스키마 정의
- **difflib.SequenceMatcher**: 유사도 계산 (Self-Consistency)
- **Markdown**: Prompt 템플릿 포맷
- **Git**: 버전 관리

---

## 📝 관련 문서

1. **AGENT_SPECIFICATIONS.md**: Agent 스펙 문서
2. **LLM_INTEGRATION_GUIDE.md**: LLM 통합 가이드
3. **copywriter_golden_set.json**: Golden Set
4. **golden_set_validator.py**: 자동 검증 스크립트

---

## 🚀 시작하기

### Step 1: Priority 1 구현 시작

```bash
# 1. EnhancedPayload 스키마 정의
vim app/services/agents/schemas.py

# 2. LLM Gateway 리팩토링
vim app/services/llm/gateway.py

# 3. Agent 수정
vim app/services/agents/copywriter.py
vim app/services/agents/reviewer.py
vim app/services/agents/optimizer.py

# 4. 테스트
python tests/golden_set_validator.py --agent copywriter
```

### Step 2: 문서 작성

```bash
# Guidelines 문서 작성
vim docs/PROMPT_ENGINEERING_GUIDELINES.md

# CHANGELOG 작성
vim app/services/llm/prompts/CHANGELOG.md
```

### Step 3: Git 커밋

```bash
git add .
git commit -m "feat: Context Engineering 고도화 (Agent↔Gateway 연동 + CoT)"
git push origin feature/context-engineering-enhancement
```

---

**작성자**: B팀 (Backend)
**작성일**: 2025-11-23
**검토자**: A팀 (QA)
**예상 완료일**: 2025-12-14 (3주)

**Status**: 🟡 **READY TO START**
