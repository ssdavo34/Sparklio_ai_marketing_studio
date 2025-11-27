# 업그레이드 및 고도화 원칙

**작성일**: 2025-11-27
**작성팀**: C팀 (Frontend)
**목적**: 향후 모든 Claude Code 세션에서 일관된 개발 원칙 준수

---

## 🎯 핵심 원칙: "개선이지 재창조가 아니다"

> **고도화 = 기존 시스템을 개선하여 고품질 결과물 생성**
> **고도화 ≠ 새로운 독립 시스템 생성**

---

## ❌ 절대 하지 말아야 할 것

### 1. 기능 분리 (Feature Splitting)

**잘못된 예시**:
```typescript
// ❌ 잘못된 접근: 새로운 모드/채널 생성
if (isConceptMode) {
  await generateConcepts(message, 3);  // 새로운 독립 채널
} else {
  await sendMessage(message);  // 기존 채널
}
```

**왜 잘못되었나**:
- 기존 시스템과 **단절된 독립 채널** 생성
- 다른 컴포넌트와 **연동 불가**
- 유지보수 복잡도 **2배 증가**
- 향후 개발자가 **혼란**

### 2. 중복 컴포넌트 생성

**잘못된 예시**:
- `ConceptBoardView` (기존) ← 정상 작동 중
- `ConceptV1BoardView` (신규) ← ❌ 중복 생성, 연동 안 됨

**올바른 접근**:
- `ConceptBoardView`를 **확장**하여 ConceptV1 데이터도 처리 가능하게

### 3. 데이터 플로우 단절

**잘못된 예시**:
```
기존: Chat → Backend → ConceptBoard → Canvas
신규: Chat(컨셉모드) → Backend → (어디로?) ← 단절됨
```

**올바른 접근**:
```
개선: Chat → Backend(ConceptAgent v2.0) → ConceptBoard(확장됨) → Canvas
```

---

## ✅ 올바른 고도화 방법

### 1. 기존 코드 확장 (Extend, Don't Replace)

**Backend 예시** (B팀의 올바른 접근):
```python
# concept.py - 기존 파일 수정
class ConceptV1(BaseModel):  # 새로운 스키마 추가
    """CONCEPT_SPEC.md 기준 완전 구현"""
    audience_insight: str
    core_promise: str
    # ... 10+ 새로운 필드

class ConceptOutput(BaseModel):  # 기존 스키마 유지 (하위 호환)
    """Legacy 스키마"""
    concept_name: str
    # ... 기존 필드

class ConceptAgent(AgentBase):  # 기존 Agent 개선
    def run(self, input):
        # v2.0 로직으로 업그레이드
        # 하지만 기존 인터페이스 유지
```

**Frontend에서 해야 했던 것**:
```typescript
// ✅ 올바른 접근: 기존 타입 확장
interface ConceptData {
  // 기존 필드 유지
  concept_id: string;
  concept_name: string;

  // 🆕 새로운 필드 추가 (optional로 하위 호환)
  audience_insight?: string;
  core_promise?: string;
  visual_world?: VisualWorld;
  // ...
}

// ✅ 기존 ConceptBoardView 확장
export function ConceptBoardView() {
  // 기존 로직 유지
  // + ConceptV1 데이터가 있으면 더 풍부하게 표시

  return (
    <div>
      {/* 기존 UI */}
      <h3>{concept.concept_name}</h3>

      {/* 🆕 추가 정보 (있으면 표시) */}
      {concept.audience_insight && (
        <div className="insight">
          {concept.audience_insight}
        </div>
      )}
    </div>
  );
}
```

### 2. 점진적 마이그레이션

**단계별 접근**:

1. **Phase 1**: 타입 확장 (하위 호환 유지)
2. **Phase 2**: UI 개선 (기존 데이터도 작동)
3. **Phase 3**: Backend 연동 (기존 API 확장)
4. **Phase 4**: 점진적 전환 (Legacy 지원 유지)

**예시**:
```typescript
// Phase 1: 타입에 optional 필드 추가
interface ConceptData {
  concept_name: string;  // 기존
  audience_insight?: string;  // 🆕 optional
}

// Phase 2: UI에서 optional 처리
{concept.audience_insight ? (
  <RichInsightDisplay />
) : (
  <BasicDisplay />  // 기존 UI 유지
)}

// Phase 3: Backend 응답이 새 필드 포함 시작
// Phase 4: 모든 데이터가 새 필드 포함하면 optional 제거
```

### 3. 기존 데이터 플로우 존중

**기존 플로우 파악**:
```typescript
// 1. 기존 코드 읽기
const existingFlow = `
  Chat Input
  → useChatStore.sendMessage()
  → Backend API
  → Response parsing
  → ConceptBoard 업데이트
  → Canvas 반영
`;

// 2. 흐름 유지하며 개선
// ✅ sendMessage()가 호출하는 Backend만 ConceptAgent v2.0으로 변경
// ✅ Response parsing 로직에 ConceptV1 필드 추가
// ✅ ConceptBoard UI에서 추가 필드 표시
```

---

## 📋 체크리스트: 작업 시작 전 필수 확인

### 고도화 작업을 시작하기 전:

- [ ] **기존 시스템 완전히 이해했는가?**
  - 현재 데이터 플로우는?
  - 어떤 컴포넌트들이 연결되어 있는가?
  - 기존 타입/인터페이스는?

- [ ] **Backend 팀과 정렬되었는가?**
  - Backend는 어떻게 구현했는가?
  - 새 API인가, 기존 API 확장인가?
  - 하위 호환성은 유지되는가?

- [ ] **확장 vs 재창조 구분했는가?**
  - 새 파일/컴포넌트가 정말 필요한가?
  - 기존 것을 확장할 수 없는가?
  - 독립 채널이 필요한가, 기존 채널 개선인가?

- [ ] **하위 호환성 고려했는가?**
  - 기존 데이터도 작동하는가?
  - optional 필드 처리했는가?
  - 기존 사용자 흐름이 깨지지 않는가?

---

## 🚨 Warning Signs (경고 신호)

다음과 같은 생각이 들면 **잘못된 방향**:

1. **"새로운 모드를 추가하자"**
   - → 기존 모드를 개선할 수 없는가?

2. **"독립적인 채널을 만들자"**
   - → 기존 채널을 확장할 수 없는가?

3. **"V2 컴포넌트를 새로 만들자"**
   - → V1 컴포넌트를 업그레이드할 수 없는가?

4. **"기존 코드를 건드리지 말고 추가만 하자"**
   - → 이것이 **기술 부채**를 만드는 가장 큰 원인

---

## 🎓 학습 사례: ConceptV1 고도화 실패 사례

### 잘못된 접근 (2025-11-27, C팀 실패 사례)

**상황**:
- Backend: ConceptAgent를 v2.0으로 **업그레이드** (정상)
- Frontend: 완전히 **새로운 시스템** 생성 (실패)

**무엇이 잘못되었나**:

1. **모드 토글 추가**
   ```typescript
   // ❌ 카피생성/컨셉생성 분리
   const [isConceptMode, setIsConceptMode] = useState(false);
   ```

2. **독립 Hook 생성**
   ```typescript
   // ❌ 기존 sendMessage와 별개
   const { generateConcepts } = useConceptGenerate();
   ```

3. **중복 View 생성**
   ```typescript
   // ❌ ConceptBoardView는 그대로 두고
   // ConceptV1BoardView를 새로 생성
   ```

**결과**:
- Chat과 ConceptBoard **단절**
- 기존 Canvas 연동 **불가**
- 2개의 독립 시스템 공존 → 혼란
- 향후 유지보수 **악몽**

### 올바른 접근 (해야 했던 것)

1. **기존 ConceptData 타입 확장**
   ```typescript
   // ✅ types/demo.ts 수정
   interface ConceptData {
     concept_name: string;  // 기존
     audience_insight?: string;  // 🆕
     core_promise?: string;  // 🆕
     visual_world?: VisualWorld;  // 🆕
   }
   ```

2. **기존 ConceptBoardView 개선**
   ```typescript
   // ✅ ConceptBoardView.tsx 수정
   function ConceptCard({ concept }) {
     return (
       <div>
         {/* 기존 UI */}
         <h3>{concept.concept_name}</h3>

         {/* 🆕 추가 정보 */}
         {concept.audience_insight && (
           <div className="insight-section">
             <p>{concept.audience_insight}</p>
           </div>
         )}
       </div>
     );
   }
   ```

3. **기존 Chat 플로우 유지**
   ```typescript
   // ✅ useChatStore.ts - sendMessage() 개선
   // Backend가 ConceptV1 응답하면 자동으로 풍부한 데이터 표시
   ```

---

## 📚 참고 자료

- **Backend 고도화 사례**: `backend/app/services/agents/concept.py`
  - ConceptV1 추가하면서 ConceptOutput(legacy) 유지
  - 하위 호환성 유지하며 점진적 전환

- **올바른 Frontend 고도화 예시**: (이 문서 작성 후 구현 예정)
  - `types/demo.ts` - 타입 확장
  - `ConceptBoardView.tsx` - UI 개선
  - 기존 플로우 유지

---

## ⚡ 즉시 실행 규칙

### 새로운 고도화 요청을 받으면:

1. **STOP** - 코드 작성 전 이 문서 읽기
2. **분석** - 기존 시스템 완전히 이해
3. **계획** - 확장 vs 재창조 구분
4. **확인** - Backend 팀과 정렬 확인
5. **실행** - 기존 코드 수정으로 시작

### 금지 패턴:

```typescript
// ❌ 절대 금지
if (isNewMode) { /* 새로운 독립 로직 */ }
else { /* 기존 로직 */ }

// ❌ 절대 금지
const NewV2Component = () => { /* 중복 컴포넌트 */ };

// ❌ 절대 금지
const useNewFeature = () => { /* 독립 Hook */ };
```

### 권장 패턴:

```typescript
// ✅ 권장: 기존 타입 확장
interface ExistingType {
  old_field: string;
  new_field?: NewType;  // optional로 추가
}

// ✅ 권장: 기존 컴포넌트 개선
function ExistingComponent({ data }: { data: ExistingType }) {
  return (
    <>
      {/* 기존 UI */}
      {data.new_field && <EnhancedUI />}  {/* 조건부 추가 */}
    </>
  );
}
```

---

## 📌 요약

| 항목 | ❌ 하지 말 것 | ✅ 해야 할 것 |
|------|-------------|-------------|
| **컴포넌트** | 새로 만들기 | 기존 것 확장 |
| **타입** | 새 인터페이스 | 기존에 optional 추가 |
| **플로우** | 독립 채널 | 기존 채널 개선 |
| **호환성** | 무시 | 반드시 유지 |
| **Backend** | 따로 구현 | 정렬 확인 |

---

**이 문서를 위반하는 PR은 자동 반려됩니다.**

**모든 Claude Code 세션은 작업 시작 전 이 문서를 읽어야 합니다.**
