요약하면, **“지금 상태 설명은 잘 되어 있는데, Sparklio 비전 프리젠테이션을 기본 과제로 삼기에는 스펙 정의가 아직 반쪽짜리”**입니다.  
C팀 문서를 “프론트엔드 구현 가이드 + B팀 협업 스펙” 수준까지 한 번만 더 다듬으면, 바로 실행 가능한 설계가 됩니다.

아래에서 항목별로 짚어볼게요.

---

## 1. 문서가 잘 잡힌 지점 👍

이 문서는 C팀 입장에서 보면 꽤 탄탄합니다.

1. **파일 단위 맵핑이 명확함**
    
    - 핵심 파일 15개를 “뷰 / 템플릿 / 스토어 / 패널 / Mock / 백엔드”로 정리한 건 좋습니다.
        
    - C팀이 “어디를 건드리면 무엇이 영향을 받는지” 전체 구조를 한눈에 볼 수 있습니다.
        
2. **데이터 플로우가 잘 그려져 있음**
    
    - `PresentationAgent → useGeneratedAssetsStore.slidesData → SlidesPreviewView → addSlidesToCanvas → Polotno`  
        이 흐름이 텍스트/다이어그램으로 정리된 건 상당히 좋습니다.
        
    - 나중에 멀티 에이전트(Strategist, Copywriter 등)로 확장해도, **최종 출력이 `slidesData`로 모인다는 기준점**이 이미 정의되어 있어서 유리합니다.
        
3. **현재 기능/부분 구현/미구현의 경계가 분명함**
    
    - ✅ / ⚠️ / ❌ 구분이 잘 되어 있어서,  
        P1·P2·P3 우선순위 논의에 바로 쓸 수 있는 구조입니다.
        
    - 특히 **“ExportDialog는 UI만 있고, 실제 PNG/PDF/PPTX는 없음”**을 명시한 것,  
        **“저장은 JSON 직렬화만 있고, 백엔드 연동 없음”**을 적어둔 것 모두 좋습니다.
        
4. **DEMO용 문서 연결이 되어 있음**
    
    - `DEMO_SCENARIO_SCRIPT`, `DEMO_QA_CHECKLIST`, `BACKEND_DEMO_APIS`, `INTEGRATION_TEST_REPORT`까지 언급한 건  
        “데모 한 사이클”을 엮어서 생각하고 있는 거라서 방향이 좋습니다.
        

👉 정리하면,  
**“현재 있는 기능을 설명하는 문서”로서는 합격**입니다.  
이제 필요한 건, **“Sparklio 비전 프리젠테이션”이라는 목표에 맞춘 요구사항을 이 위에 덧씌우는 것**이에요.

---

## 2. Sparklio 비전 프리젠테이션 관점에서의 부족한 지점 🔍

### (1) 슬라이드 구조 스펙이 “6장 Mock”에 묶여 있음

- 지금 문서의 구체 구조는 **6장 Mock(cover/problem/solution/features/benefits/cta)** 기준입니다.
    
- 그런데 Sparklio 비전은 최소 12~15장까지 가야 한다고 이미 이야기하셨죠:
    
    - 비전, 문제, 솔루션, 시스템 구조, 에이전트, 기술 스택, 로드맵, 비즈니스 모델, 팀, CTA …
        

➡️ 이 말은 곧,

- **C팀 문서에 “슬라이드 타입 확장 계획”이 없다**는 뜻입니다.
    
- `slidesTemplate.ts`와 `presentation-sample.json`이 **“6장 전용”에 가깝게 느껴지는 상태**라서,
    
    - 새 타입(vision, tech, roadmap, agents, meeting-to-assets 등)을 담기엔 스펙이 부족합니다.
        

> ✅ 해야 할 일
> 
> - “Sparklio Vision Deck”용 슬라이드 타입 리스트를 문서에 추가
>     
>     - 예: `vision`, `system_architecture`, `agents_overview`, `pipeline`, `roadmap`, `business_model` 등
>         
> - `slidesData` 구조에 `type`/`layout` 필드 명세를 추가하고,  
>     “새 타입이 오면 프론트에서 어떻게 렌더링할지” 규칙을 문서에 써 주는 것
>     

---

### (2) Brand Kit / Theme 연동이 설계에 없음

지금 템플릿 설명을 보면:

- 상단 그라디언트 `#6366F1 → #8B5CF6`
    
- 타이틀 64px, 기본 폰트 등
    

→ 완전히 **“고정 디자인”**입니다.

하지만 Sparklio 비전에서는:

- 브랜드 키트(컬러, 폰트, 로고)를 기반으로  
    **“각 브랜드의 프레젠테이션”이 나와야 하는 게 최종 그림**이죠.
    

> ✅ 해야 할 일
> 
> - 문서에 아래 내용을 추가:
>     
>     - `slidesTemplate`가 **BrandKitStore / ThemeStore**로부터
>         
>         - primaryColor / accentColor / fontFamily / logoImage 를 받아 적용하도록 설계
>             
>     - C팀 범위:
>         
>         - `slidesTemplate.ts`에 `options.brand` 파라미터 정의
>             
>         - BrandKitStore에서 값을 읽어오는 부분의 인터페이스만 먼저 명시
>             
>     - B/A팀 범위:
>         
>         - BrandKit을 채우는 각각의 기능(분석, 편집)은 별도 문서에서 담당
>             

지금 문서에는 “브랜드별로 어떤 식으로 커스터마이즈될지”에 대한 언급이 없어서,  
**Sparklio “비전”이라는 테마와 연결이 약하게 느껴집니다.**

---

### (3) 저장/복구 스펙이 너무 약함

문서에서 저장은 이렇게 적혀 있습니다.

- “저장: JSON 직렬화만, 백엔드 API 연동 필요”
    

즉:

- 새로고침하면 날아가고
    
- URL 공유도 안 되고
    
- “이번 Sparklio 비전 프리젠테이션 v3” 같은 **버전 개념도 없음**
    

데모/학원 발표/투자자 피치덱 용도로 쓸 거라면 최소:

- **자동 저장** (예: 3초 debounce)
    
- **프로젝트 단위 ID** (예: `/studio/v3?projectId=xxx&type=presentation`)
    
- 나중에 “템플릿으로 저장 → 재사용”까지 염두
    

> ✅ 해야 할 일 (C팀 문서에 명시)
> 
> - C팀:
>     
>     - `savePresentation(projectId, slidesData)`를 호출하는 추상 함수 설계
>         
>     - `useSaveStatusIndicator` 같은 훅 정의 (저장 중 / 저장됨 / 에러)
>         
>     - TopToolbar에 저장 상태 배치 위치 명시 (이미 고민하셨던 부분 반영)
>         
> - B팀 의존:
>     
>     - `/api/v1/presentations/{projectId}` REST 스펙 정의는 B팀 문서로 넘기기
>         

지금 문서는 “저장 안되면 어떤 문제가 생기는지”까지는 안 적혀 있어서,  
C팀 기준으로 리스크 인식이 약하게 보일 수 있습니다.

---

### (4) SlidesPreviewView의 역할 정의가 “뷰어”에 머물러 있음

문서에 적힌 SlidesPreviewView 기능:

- 슬라이드 탐색 (이전/다음)
    
- 발표자 노트 표시
    
- [Canvas에서 편집] 버튼
    

⚠️ 문제:

- 사용성 관점에서 보면,
    
    - 프리뷰 화면에서 **텍스트 정도는 바로 수정**할 수 있어야 자연스럽습니다.
        
    - 특히 “비전 프레젠테이션”은 **디테일 워딩 튜닝이 핵심**이라,  
        매번 Canvas로 넘어갔다 돌아오는 UX는 꽤 답답합니다.
        

> ✅ 문서에 추가되면 좋은 방향
> 
> - SlidesPreviewView의 역할을 “뷰어(Viewer)”가 아니라 **“라이트 에디터(Light Editor)”**로 정의:
>     
>     - 제목/본문/노트를 inline edit
>         
>     - 우측 InspectorPanel과 연동(선택 슬라이드/텍스트 블럭 기준)
>         
> - Canvas는 “레이아웃/디자인 편집용”으로 포지셔닝
>     

지금 문서는 이 부분을 “P2: SlidesPreviewView에서 직접 편집”이라고만 적어두고 있어서,  
**얼마나 중요한 목표인지가 드러나지 않습니다.**  
Sparklio 비전용이라면 사실상 P1에 가깝습니다.

---

### (5) C팀 vs B팀 책임 범위가 한 문서 안에서 섞여 있음

현황 표와 설명 안에:

- `backend/.../presentation.py` (PresentationAgent)
    
- 클라우드 LLM 선택, Claude 3.5 Haiku로 변경 등
    

이게 같이 들어가 있어서,  
**“이 문서를 보고 C팀이 어디까지 책임지고, 어디서부터는 B팀에 요구해야 하는지”가 애매**합니다.

> ✅ 개선 제안 (문서 구조 레벨)
> 
> 1. 문서 하단에 섹션 추가:
>     
>     - `## C팀 책임 범위`
>         
>     - `## B팀 의존 사항`
>         
> 2. 예시:
>     
>     - **C팀**
>         
>         - SlidesPreviewView / PolotnoWorkspace / ExportDialog 실제 로직
>             
>         - slidesTemplate 레이아웃/테마 적용
>             
>         - 저장/복구 프론트훅 + UI
>             
>     - **B팀**
>         
>         - PresentationAgent (LLM 프롬프트 + Haiku로 변경)
>             
>         - /presentations API
>             
>         - 이미지 생성 파이프라인 연동 (VisionGenerator)
>             

이렇게 쪼개두면, 나중에 A팀이 QA 문서 만들 때도 바로 레퍼런스로 쓸 수 있습니다.

---

## 3. “Sparklio 비전 프리젠테이션” 기준으로 정리하면 생길 TODO ✅

문서를 검토한 관점에서,  
**“지금 그대로도 돌아가긴 하는데, Sparklio 비전 데크를 기본 과제로 삼기에는 이 정도는 더 필요하다”**를 정리해보면:

### C팀 TODO (프론트 기준)

1. **슬라이드 타입 확장 스펙 추가**
    
    - `slidesData`에 `type` 목록을 Sparklio 전용으로 확장:
        
        - `vision`, `system_architecture`, `agents_overview`, `pipeline`, `roadmap`, `business_model` 등
            
    - 각 타입 → 어떤 레이아웃/요소를 쓰는지 표로 정리
        
2. **BrandKit 연동 설계**
    
    - `slidesTemplate`에 `brand` 옵션 추가
        
    - colors / fonts / logo를 어디서 가져오는지 인터페이스만 명시
        
3. **저장/복구 + SaveStatusIndicator 설계**
    
    - “프로젝트 단위 프리젠테이션” 개념
        
    - 자동 저장(디바운스) + 저장 상태 UI
        
    - `/presentations/{projectId}` 호출을 추상화한 훅 정의
        
4. **SlidesPreviewView → 라이트 에디터로 승격**
    
    - 텍스트/노트 inline 편집
        
    - Polotno 페이지와 동기화 전략 정리 (어느 쪽이 소스인지)
        
5. **Export MVP 확정**
    
    - P1: 다중 PNG (페이지별 이미지) 또는 긴 PNG (전체)
        
    - P2: PDF
        
    - P3: PPTX
        

### B팀에 넘겨야 할 포인트 (문서에 의존 항목으로 명시)

1. `PresentationAgent`를 Claude 3.5 Haiku 기반으로 재설계
    
    - Sparklio 비전용 12–15장 구조 고정 프롬프트
        
    - 슬라이드 타입/필드 스키마를 C팀 스펙과 맞추기
        
2. `/presentations` API
    
    - 생성, 불러오기, 업데이트, 버저닝까지 갈지 여부 결정
        
3. 이미지/아이콘/차트 생성 파이프라인
    
    - VisualPrompt + VisionGenerator 파이프라인과의 연결
        

---

## 4. 결론

- 지금 C팀 문서는  
    **“현재 돌아가는 프리젠테이션 기능 현황 보고서”**로는 아주 잘 정리되어 있습니다.
    
- 다만 **“Sparklio 비전 프리젠테이션을 기본 과제/대표 데모로 삼겠다”**는 관점에서 보면,
    
    - 슬라이드 구조 스펙
        
    - BrandKit 연동
        
    - 저장/복구
        
    - 프리뷰에서의 직접 편집
        
    - C/B팀 책임 구분  
        이 다섯 가지가 아직 문서에 충분히 녹아 있지 않습니다.
        

👉 제안드리면,

1. **지금 이 문서를 그대로 두고**,
    
2. 상단에 한 섹션만 추가하는 방식으로 다듬으면 좋아요:
    

> `## Sparklio Vision Deck용 추가 요구사항 (C팀 관점)`
> 
> - 슬라이드 타입 확장 …
>     
> - BrandKit 연동 …
>     
> - 저장/복구 …
>     
> - Preview 라이트 에디터 …
>     
> - Export MVP …
>     

이렇게만 추가해도,  
**“이 문서 그대로 B/C팀 공용 기준 문서로 써도 되겠다”** 수준이 됩니다.

원하시면,  
지금 보내주신 내용을 바탕으로 **“수정본 전체 텍스트(복붙용)”** 형태로 다시 재작성해 드릴게요.