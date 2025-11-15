
# GENERATORS_SPEC.md

# Sparklio V4 — Generators Spec (v1.0)

- 문서명: GENERATORS_SPEC.md
- 버전: v1.0
- 작성일: 2025-11-15
- 작성자: SeongEon Park (PM), ChatGPT(설계 보조)
- 상태: Draft

---

## 1. 개요 (Overview)

이 문서는 Sparklio V4에서 제공하는 **각종 “생성기(Generators)”** 의 역할, 입력/출력, 내부 파이프라인, 에이전트 구성, One-Page Editor 연동 방식을 정의한다.

대상 Generator:

1. Brand Kit Generator
2. Marketing Brief Generator
3. Product Detail / Brochure Generator
4. SNS Content & Card Generator
5. Presentation Generator
6. Ad / Short-form Video Generator (스크립트·스토리보드 중심)
7. Meeting AI 기반 Generator (회의 → 문서/브리프/슬라이드)
8. (확장) Variant/Localization Generator

모든 Generator는 공통적으로:

- Chat UI에서 시작
- SmartRouter/Agents를 거쳐
- **텍스트 + 에디터 JSON(레이아웃)** 을 초안으로 생성
- 최종 수정은 One-Page Editor에서 수행

---

## 2. 공통 아키텍처

### 2.1 공통 플로우

```mermaid
flowchart LR
    U[User Chat Request] --> Q[Generation Request Builder]
    Q --> R[SmartRouter]
    R --> S[StrategistAgent]
    S --> D[DataFetcher/RAG (Brand + Trend)]
    D --> T[TemplateSelector]
    T --> C[CopywriterAgent]
    C --> L[LayoutDesignerAgent]
    L --> P[PostProcessor/Formatter]
    P --> O[Draft Result (Text + Editor JSON)]
    O --> E[One-Page Editor 로딩]
```

### 2.2 공통 인터페이스 (GenerationTask)

모든 Generator는 다음 공통 스키마를 따르는 `GenerationTask`를 입력으로 받는다.

`{   "taskId": "gen_123",   "kind": "product_detail",    "brandId": "brand_001",   "locale": "ko-KR",   "channel": "shop_detail",   "input": {     "product": {       "name": "...",       "features": ["...", "..."],       "price": 29000,       "target_audience": "...",       "usp": "..."     },     "constraints": {       "length": "medium",       "tone": "friendly",       "style": "magazine"     }   },   "context": {     "brand_kit_id": "bk_001",     "meeting_summary_id": "mtg_045",     "trend_context_id": "trend_202511"   } }`

출력은 최소 다음을 포함한다.

`{   "taskId": "gen_123",   "kind": "product_detail",   "textBlocks": { ... },    "editorDocument": { ... },    "meta": {     "templates_used": ["tpl_..."],     "agents_trace": [...],     "llm_cost": { "prompt_tokens": 1234, "completion_tokens": 2345 }   } }`

---

## 3. Generator 공통 구성 요소

### 3.1 StrategistAgent

- 역할:
    
    - 유저 요청을 해석하고 “어떤 구조/형식의 산출물을 만들지” 결정
        
    - 필요 시 질문을 되묻거나 선택지 제시
        
- 출력:
    
    - 구조 정의 (Section list, Slide list, 카드 수 등)
        
    - 필요한 데이터 필드 목록
        

### 3.2 DataFetcher / RAG

- Brand Learning Engine + Trend Pipeline + 외부 자료 RAG 활용
    
- 역할:
    
    - 브랜드 톤/가이드라인
        
    - 업종/채널별 모범 사례
        
    - 최신 트렌드 키워드/구조
        
- Generator는 이 RAG 결과를 바탕으로 더 도메인 특화된 콘텐츠 생성
    

### 3.3 TemplateSelector

- Data Pipeline/ Admin에서 관리되는 템플릿 중:
    
    - 업종, 채널, 페르소나, 목적에 맞는 템플릿 선택
        
- 템플릿 타입:
    
    - Layout Template (에디터용)
        
    - Content Template (LLM 텍스트용)
        

### 3.4 CopywriterAgent

- 선택된 템플릿과 브랜드/제품 정보를 기반으로 실제 카피 생성
    
- 역할:
    
    - 섹션별 텍스트 블록
        
    - 카드별 메시지, 슬라이드별 문구, 광고 스크립트 등
        

### 3.5 LayoutDesignerAgent

- 선택된 Layout Template + Copywriter 결과를 결합해  
    **Editor JSON** 형태의 문서 생성
    
- 역할:
    
    - 텍스트를 적절한 Text Layer에 할당
        
    - Placeholder 이미지 자리에 브랜드 이미지/기본 이미지 매핑
        

### 3.6 PostProcessor / ReviewerAgent

- 언어·문맥·브랜드 일관성 검토
    
- 레이아웃에 텍스트가 과도하게 넘치지 않는지 체크
    
- 필요 시 자동 축약/조정
    

---

## 4. 개별 Generator 정의

---

### 4.1 Brand Kit Generator

#### 4.1.1 목적

- 브랜드의 **색/폰트/로고/톤/메시지** 를 정리된 형태로 생성
    
- 이후 모든 Generator와 One-Page Editor에서 참조
    

#### 4.1.2 입력

- 브랜드 기본 정보:
    
    - 회사명, 브랜드명, 슬로건(있다면)
        
    - 제품/서비스 설명, 타깃, 경쟁사
        
- 업로드 자료:
    
    - 기존 로고, 컬러 히스토리, 웹사이트 URL 등
        

#### 4.1.3 출력

- Brand Kit JSON:
    
    - Primary/Secondary Colors
        
    - Font Families & 스타일 프리셋
        
    - Tone of Voice 정의
        
    - Logo & 아이콘 경로
        
- 브랜드 소개용 시각 자료 초안:
    
    - 브랜드 카드, 간단 소개 슬라이드 등(에디터 JSON 포함)
        

---

### 4.2 Marketing Brief Generator

#### 4.2.1 목적

- 캠페인/콘텐츠 제작을 위한 **단일 브리프 문서** 생성
    
- 이후 Product Detail, SNS, Presentation, Ad Generator가 이 브리프를 그대로 재사용
    

#### 4.2.2 입력

- 캠페인 목표, 예산(선택), 기간, 채널
    
- 핵심 메시지/제약 사항(있다면)
    
- Meeting AI 요약(있다면) / 기존 자료
    

#### 4.2.3 출력

- Brief JSON:
    
    - Campaign Objective
        
    - Target Audience Profile
        
    - Key Messages (1~3개)
        
    - Required Deliverables (상품 상세, SNS 5장, 프레젠테이션 10장 등)
        
- 브리프 요약 카드(에디터 JSON):
    
    - One-Page Editor에서 수정 가능한 브리프 카드/표
        

---

### 4.3 Product Detail / Brochure Generator

#### 4.3.1 목적

- 쇼핑몰용 상품 상세페이지/브로셔 초안 생성
    
- Sparklio의 핵심 사용 시나리오 중 하나
    

#### 4.3.2 입력

- Product 정보:
    
    - 이름, 카테고리, 주요 기능/장점, 스펙, 가격, 타깃, 경쟁사
        
- Brand Kit, Brief 참조
    
- 채널:
    
    - 자사몰, 쿠팡/네이버, 오프라인 브로셔 등
        

#### 4.3.3 출력

- Text Blocks:
    
    - 한 줄 카피, 스토리형 본문, 스펙 표, 구매 포인트 요약
        
- Editor Document:
    
    - Layout Template에 매핑된 상세페이지 레이아웃
        
    - PC/Mobile 버전(필요 시 두 버전 생성)
        
- 메타:
    
    - 사용한 템플릿 ID, 추천 대체 문구 등
        

---

### 4.4 SNS Content & Card Generator

#### 4.4.1 목적

- 인스타그램/블로그용 카드뉴스, 피드 이미지, 썸네일 등 생성
    

#### 4.4.2 입력

- 포스트 목적:
    
    - 정보 공유/브랜드 홍보/프로모션/이벤트 등
        
- 포맷:
    
    - 단일 이미지, 3~10장 카드뉴스, 썸네일(16:9 등)
        
- Brief/Brand Kit 참조
    

#### 4.4.3 출력

- Text Blocks:
    
    - 카드별 헤드라인/서브텍스트/해시태그
        
- Editor Document:
    
    - 슬라이드(다중 페이지) 구조 JSON
        
    - 각 카드 레이아웃 템플릿 적용 (잡지형/심플형 등)
        

---

### 4.5 Presentation Generator

#### 4.5.1 목적

- 피치덱/제안서/리포트 형식 프리젠테이션 초안 생성
    

#### 4.5.2 입력

- 목적:
    
    - 투자 피치/내부 보고/클라이언트 제안 등
        
- 페이지 수 목표 (예: 10~15장)
    
- Brief/Meeting summary 참조
    

#### 4.5.3 출력

- Slide List:
    
    - 각 슬라이드의 제목, 포인트, 메모
        
- Editor Document:
    
    - 슬라이드별 레이아웃(1~2 컬럼, 리스트, 차트 Placeholder 등)
        
- PPTX Export는 P1에서 One-Page Editor와 연동
    

---

### 4.6 Ad / Short-form Video Generator

> 이 Generator는 **비디오 에디터**와 더 깊게 연결되지만,  
> 이 문서에서는 “스크립트/스토리보드 생성” 역할에 초점을 맞춘다.

#### 4.6.1 목적

- 광고 스크립트, 컷 나누기, 씬별 설명, 자막/오버레이 카피 생성
    

#### 4.6.2 입력

- 광고 목적, 채널(YouTube Shorts, Reels, TikTok 등)
    
- 길이(15초/30초/60초)
    
- Brief/Brand Kit
    

#### 4.6.3 출력

- Script JSON:
    
    - 씬/컷 별 대사, 나레이션, 화면 설명
        
- Overlay Text Blocks:
    
    - 오버레이 카피 리스트
        
- Storyboard Layout:
    
    - 각 씬을 카드 형태로 표현한 에디터 JSON (One-Page Editor에서 이미지 기반 스토리보드로 사용)
        

---

### 4.7 Meeting AI 기반 Generator

> **⚠️ 중요**: Meeting AI는 **P1 범위**이며, **독립 서비스 + Generator 브리지** 구조입니다.

#### 4.7.1 아키텍처 명확화

Meeting AI는 두 가지 역할을 수행합니다:

**1. 독립 서비스로서의 Meeting AI**
- 회의 녹음/텍스트 → 요약/액션 아이템 추출
- 별도 API/UI 제공 (`/meeting-ai/*`)
- Generator와 **독립적으로 동작 가능**

**2. Generator 브리지 역할**
- Meeting AI 결과 → Marketing Brief Generator 입력으로 변환
- 회의 내용 → 프레젠테이션 초안 자동 생성

#### 4.7.2 입력

**Meeting AI 자체 입력**:
- 회의 녹음 파일 (MP3, WAV 등)
- 또는 Transcription 텍스트
- 회의 목적 태그 (예: "신제품 기획 회의", "마케팅 캠페인 브레인스토밍")

**Generator 브리지 입력**:
- Meeting Summary ID (Meeting AI에서 생성한 요약 ID)
- Generator 타입 (brief, presentation, product_detail 등)

#### 4.7.3 출력

**Meeting AI 자체 출력**:
- Meeting Summary JSON
  - 회의 요약 (1-3 문단)
  - 주요 결정사항
  - 액션 아이템 (담당자, 마감일 포함)
  - 태그/키워드
- Extracted Requirements
  - 제품 기능 리스트
  - 타겟 페르소나
  - 핵심 메시지 포인트

**Generator 브리지 출력**:
- Marketing Brief 초안 (Brief Generator로 전달)
- Presentation 초안 (Presentation Generator로 전달)

#### 4.7.4 P0에서 제외된 이유

- Meeting AI 자체가 별도 복잡도 높은 서비스
- STT (Speech-to-Text) 연동 필요
- P0에서는 **수동 브리프 입력**으로 대체
- P1에서 Meeting AI → Generator 브리지 구현

#### 4.7.5 P1 구현 시 통합 방식

```python
# P1 예시: Meeting AI → Generator 브리지
POST /api/v1/meeting-to-brief
{
  "meetingSummaryId": "meeting_123",
  "generatorType": "marketing_brief"
}

# Meeting AI가 추출한 내용을 Brief Generator 입력으로 변환
{
  "kind": "marketing_brief",
  "brandId": "brand_001",
  "input": {
    "campaignObjective": "[Meeting AI 추출]",
    "targetAudience": "[Meeting AI 추출]",
    "keyMessages": ["[Meeting AI 추출]", ...]
  }
}
```
        

---

### 4.8 Variant / Localization Generator (확장)

#### 4.8.1 목적

- 하나의 생성물(상품 상세, 카드뉴스 등)을
    
    - 다른 채널/비율/언어로 자동 변형
        

#### 4.8.2 입력

- 기존 Editor Document + Text Blocks
    
- 타겟 채널/언어/비율
    

#### 4.8.3 출력

- 새 Editor Document (새로운 레이아웃 템플릿 + 번역/로컬라이징된 카피)
    
- 기존 문서와의 연결 관계(variantOf)
    

---

## 5. 템플릿/데이터 의존성

### 5.1 Data Pipeline과 연계

- 모든 Generator는 **Data Pipeline** 에서 제공하는 다음 요소를 사용:
    
    - 마케팅 문서 RAG (업종/채널별 모범 사례)
        
    - 텍스트 패턴 기반 Content Templates
        
    - 이미지/레이아웃 기반 Layout Templates
        

### 5.2 Admin Templates & Prompts 연계

- TemplateSelector는 `/admin/templates`에서 Approved된 템플릿만 사용
    
- Prompt/룰은 `/admin/prompts`에서 관리
    
- Generator별 기본 템플릿 세트:
    
    - Product Detail: 3~5개 레이아웃 템플릿 + 2~3개 카피 스타일 템플릿
        
    - SNS: 카드형/매거진형/텍스트 강조형 등
        

---

## 6. 품질 관리 및 피드백 루프

### 6.1 ReviewerAgent

- 모든 Generator 결과에 대해:
    
    - 문법/오타
        
    - 브랜드 톤 일관성
        
    - 금지어/리스크 표현 필터링
        
- 결과:
    
    - 수정된 텍스트 블록
        
    - 품질 점수(Score)와 코멘트
        

### 6.2 유저 피드백 기반 개선 (P1 이후)

- 유저가 결과에 대해:
    
    - 👍 / 👎 피드백
        
    - “마음에 든 이유/싫은 이유” 간단 설문
        
- 이 피드백을 Data Pipeline에 축적
    
    - 향후 템플릿/프롬프트 선택 가중치에 반영
        

---

## 7. 설정·확장성

### 7.1 Feature Flag

- 각 Generator는 Feature Flag로 on/off 가능
    
    - 예: `GEN_PRODUCT_DETAIL_V1`, `GEN_SNS_V1`, `GEN_MEETING_AI_V1`
        
- Admin Console에서 제어:
    
    - 내부 테스트/베타 그룹에만 특정 Generator 노출
        

### 7.2 LLM 라우팅

- SmartRouter가 Generator별로:
    
    - 어떤 모델을 우선 사용하는지 정의
        
    - 예:
        
        - CopywriterAgent: 고품질 모델
            
        - LayoutDesignerAgent: 경량 모델
            
- 비용/성능은 `LLM_ROUTER_POLICY.md`에 따름
    

### 7.3 새로운 Generator 추가 패턴

- 새로운 Generator 추가 시:
    
    - `kind` 값 추가 (예: `email_campaign`)
        
    - 공통 파이프라인(Strategist → DataFetcher → TemplateSelector → Copywriter → LayoutDesigner) 재사용
        
    - 필요한 경우 전용 Agent 추가
```