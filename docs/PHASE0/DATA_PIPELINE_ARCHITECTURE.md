# docs/DATA_PIPELINE_ARCHITECTURE.md

# Sparklio V4 — Data Pipeline Architecture (v1.0)

- 문서명: DATA_PIPELINE_ARCHITECTURE.md
- 버전: v1.0
- 작성일: 2025-11-15
- 작성자: SeongEon Park (PM), ChatGPT(설계 보조)
- 상태: Draft

---

## 1. 개요 (Overview)

이 문서는 Sparklio V4에서 다음 기능들을 지탱하는 **데이터 파이프라인 구조**를 정의한다.

10. 마케팅자료 자동 수집·학습  
11. 마케팅 템플릿 자동 생성기  
12. (Admin) 대시보드 및 모니터링을 위한 데이터 제공  

핵심 목표:

- **마케팅 시장 데이터(외부)** + **사용자 생성 데이터(내부)** 를 수집·정제·학습
- 이를 통해 **템플릿, 프롬프트, RAG 컨텍스트**를 지속적으로 개선
- 최종적으로 에이전트 출력물의 품질을 **60점 → 85점 수준**으로 끌어올리는 “선순환 구조” 구축

---

## 2. 상위 레벨 아키텍처

### 2.1 주요 컴포넌트

1. **Collector (크롤러)**  
   - 외부 마케팅 자료 수집
   - 예: 광고 랜딩페이지, 제품 상세페이지, SNS 포스트, 캠페인 사례 등

2. **Cleaner & Normalizer**  
   - HTML/텍스트 정제, 중복 제거, 언어/문장 단위 분리
   - 공통 구조로 노멀라이즈: {title, body, meta, category, source, channel, locale}

3. **Tagger & Classifier**  
   - 업종, 채널(블로그/SNS/AD), 페르소나, 톤&매너 자동 태깅
   - 필요 시 LLM 기반 분류기 사용

4. **Template Pattern Miner**  
   - 좋은 성과를 낸 패턴(구조, 문장 흐름)을 추출
   - 템플릿 자동 생성기에 피드백

5. **Embedder & Indexer (RAG)**  
   - 텍스트를 벡터로 변환하여 벡터 DB/pgvector에 저장
   - Brand별 / Global 인덱스 관리

6. **Metrics Aggregator**  
   - 크롤링 수량, 성공률, 카테고리별 분포
   - Admin Superset/대시보드에 제공할 메트릭 계산

7. **Data Store**  
   - Raw Storage: MinIO / Object Storage
   - Structured: PostgreSQL (정제 데이터, 메타)
   - Vector: pgvector 또는 별도 벡터 DB

8. **Admin Data Lab (UI)**  
   - `/admin/data-lab`에서 위 파이프라인 상태 및 트리거 제어

---

## 3. 데이터 플로우 (10번: 마케팅자료 자동 수집·학습)

### 3.1 상위 흐름

```mermaid
flowchart LR
    A[Source List 정의] --> B[Collector 실행]
    B --> C[Raw Data 저장 (MinIO)]
    C --> D[Cleaner & Normalizer]
    D --> E[Tagger & Classifier]
    E --> F[Structured Store (PostgreSQL)]
    F --> G[Embedder & Indexer]
    G --> H[Vector Index (pgvector)]
    F --> I[Metrics Aggregator]
    I --> J[Superset / Admin Dashboard]
```
```
```

### 3.2 단계별 상세

#### 3.2.1 Source List 정의

- 내용:
    
    - URL 패턴, RSS, API Endpoints, 키워드 기반 검색 등
        
- 관리 위치:
    
    - Admin Console → `/admin/data-lab/crawlers`
        
- 예시 소스:
    
    - 국내/해외 마케팅 전문 블로그
        
    - 쇼핑몰/브랜드사의 공식 제품 상세페이지
        
    - 광고 사례(이미지+카피)를 수집하는 레퍼런스 사이트
        

#### 3.2.2 Collector

- 구현:
    
    - 배치 작업 (예: Celery Beat / Scheduler)
        
    - 크롤링 Job 단위로 실행
        
- 결과:
    
    - Raw HTML/JSON을 MinIO 또는 로컬 디스크에 저장
        
    - `raw_marketing_docs` 버킷
        

#### 3.2.3 Cleaner & Normalizer

- 기능:
    
    - HTML 태그 제거, 텍스트 추출
        
    - 메뉴/공통 영역(헤더/푸터) 제거
        
    - 언어 감지(ko/en 등)
        
- 결과 구조 예:
    
    `{   "title": "...",   "body": "...",   "source_url": "...",   "channel": "blog|sns|ad|landing",   "locale": "ko-KR",   "collected_at": "2025-11-15T12:00:00Z" }`
    

#### 3.2.4 Tagger & Classifier

- LLM/ML 모델을 사용해 태깅:
    
    - 업종: F&B, Fashion, Healthcare, SaaS 등
        
    - 페르소나: 엄마/아빠, 직장인, 학생, 창업자 등
        
    - 톤: 친근함, 전문적, 유머러스, 감성적 등
        
- 결과:
    
    - `marketing_docs` 테이블에 저장
        

#### 3.2.5 Embedder & Indexer

- 역할:
    
    - `body`, `title`, 중요 문단을 벡터로 변환
        
    - Global Index, Industry별 Index, Channel별 Index 등
        
- 용도:
    
    - 에이전트가 브리프/상세페이지/SNS/프레젠테이션을 만들 때  
        **“이 업종에서 실제로 잘 쓰이는 표현/구조”를 참고하게 하는 RAG 컨텍스트로 사용**
        

#### 3.2.6 Metrics Aggregator & Dashboard

- Aggregation 예:
    
    - 업종별 문서 수
        
    - 채널별 비율
        
    - 최근 7일 신규 데이터 수
        
- 결과:
    
    - Superset 등 BI 도구에서 시각화
        
    - Admin의 `/admin/data-lab` 및 `/admin/system-health`와 연동
        

---

## 4. 템플릿 자동 생성기 (11번 기능)와의 연결

### 4.1 개념

- 데이터 파이프라인에서 추출된 **패턴(구조/문장 흐름)** 을 기반으로  
    “템플릿 후보”를 자동 생성하고, 이를 운영자가 Admin에서 검수·승인하는 구조.
    

`flowchart LR     A[Structured Marketing Docs] --> B[Pattern Miner]     B --> C[Template Candidate Generator]     C --> D[Template Store (Draft)]     D --> E[Admin 검수/승인]     E --> F[Approved Templates]     F --> G[Agents & /app에서 사용]`

### 4.2 Pattern Miner

- 기능:
    
    - 상위 성과(예: CTR 높은 카피, 자주 등장하는 구조)를 나중에 연동 예정
        
    - 현재는 **빈도 기반 + LLM 기반 요약**으로 “공통 구조”를 추출
        
- 예:
    
    - 제품 상세페이지 구조:
        
        - 문제 제기 → 공감 → 솔루션 제시 → 상세 스펙 → 리뷰/사회적 증거 → CTA
            
    - SNS 포스트 구조:
        
        - Hook → 메시지 → 혜택/이벤트 → CTA → 해시태그
            

### 4.3 Template Candidate Generator

- 입력:
    
    - 특정 업종/채널/목표(예: “스킨케어 브랜드 상세페이지”) 조건
        
    - 충분히 축적된 마케팅 문서 데이터
        
- 출력:
    
    - 템플릿 초안 (섹션 구조 + 필드명 + 예시 카피)
        
- 저장:
    
    - `template_candidates` 테이블 (상태: Draft)
        

### 4.4 Admin 연계

- Admin Console `/admin/templates`에서:
    
    - 자동 생성된 템플릿 후보 리스트 확인
        
    - 내용 수정/보완
        
    - 상태를 `Draft → Approved`로 변경
        
- Approved 템플릿은:
    
    - `/app`의 생성 화면에서 “추천 템플릿” 목록으로 제공
        
    - 에이전트가 System Prompt 또는 RAG 컨텍스트로 활용
        

### 4.5 레이아웃 이미지 기반 템플릿 생성 (Magazine Cover → Template)

> **⚠️ 중요**: 이미지 기반 템플릿 자동 생성은 **P1 범위**입니다.
> P0에서는 **수동으로 제작한 템플릿 (origin: `manual`)**만 사용합니다.

텍스트 기반 패턴 분석 이외에,
"Sparklio One-Page Editor"에서 바로 사용할 수 있는 템플릿을
**이미지 레이아웃 분석**으로부터 자동 생성하는 경로를 추가한다.

**P0 vs P1 구분**:
- **P0**: 수동 제작 템플릿 (디자이너가 직접 에디터에서 제작)
- **P1**: 이미지 분석 자동 생성 템플릿 (이 섹션의 기능)

#### 4.5.1 상위 플로우

```mermaid
flowchart LR
    U[사용자 또는 운영자]
      --> A[참고 이미지 업로드 (잡지 표지/포스터/배너)]
    A --> B[Image Preprocessor (리사이즈/정규화)]
    B --> C[Layout Analyzer (텍스트/요소 감지)]
    C --> D[Semantic Role Tagger (제목/부제/메인비주얼/배지/CTA 등)]
    D --> E[Editor Template Generator (에디터 JSON DSL 변환)]
    E --> F[layout_template_candidates (Draft)]
    F --> G[Admin Templates 화면에서 검수/승인]
    G --> H[Approved Templates → /app 에디터에서 사용]
```
```
```
#### 4.5.2 주요 단계

1. Image Preprocessor
    

- 입력: PNG/JPEG 등 잡지 표지 유사 이미지
    
- 역할:
    
    - 해상도 표준화 (예: 1080x1350, 1:1 등)
        
    - 색공간/포맷 정규화
        
- 저장:
    
    - MinIO `template_ref_images/` 버킷에 원본 + 전처리본 저장
        

2. Layout Analyzer
    

- 기능:
    
    - **텍스트 블록 감지**: OCR + 영역 검출 (제목, 부제, 소제목 등)
        
    - **비텍스트 요소 감지**: 메인 이미지, 배지/스티커, 로고, 아이콘 등
        
    - **레이어/그룹 후보 생성**:
        
        - 상단 헤더 영역
            
        - 좌/우 컬럼
            
        - 중앙 메인 비주얼
            
        - 하단 정보/CTA 영역 등
            
- 결과:
    
    `{   "blocks": [     {"type": "text", "bbox": [...], "content_ocr": "..."},     {"type": "image", "bbox": [...]},     {"type": "shape", "bbox": [...], "style": {...}},     ...   ] }`
    

3. Semantic Role Tagger
    

- 각 block을 **역할(Role)** 로 태깅:
    
    - `TITLE`, `SUBTITLE`, `TAGLINE`, `BADGE`, `PRICE_TAG`,
        
    - `MAIN_VISUAL`, `LOGO`, `CTA_BUTTON`, `INFO_TEXT` 등
        
- 규칙 + LLM 조합:
    
    - 위치/크기/폰트 사이즈·굵기 등 시각적 특징
        
    - OCR된 텍스트 내용(숫자, 할인, 브랜드명 등)을 함께 고려
        

4. Editor Template Generator
    

- 위 역할 정보를 기반으로,  
    Sparklio One-Page Editor가 사용하는 **캔버스 JSON DSL**(예: Fabric.js 호환)을 생성.
    
- 예시:
    
    - TITLE → 큰 텍스트 레이어, 상단 중앙 정렬, “제목” 플레이스홀더
        
    - MAIN_VISUAL → 이미지 Placeholder 레이어
        
    - BADGE → 원/다각형 + 텍스트 Placeholder
        
- 결과:
    
    - `layout_template_candidates` 테이블에 Draft 상태로 저장
        
    - MinIO의 레퍼런스 이미지 경로도 함께 연결
        

5. Admin 검수 & 승인
    

- Admin Console `/admin/templates`에서:
    
    - 해당 레이아웃 템플릿 Preview(실제 에디터 화면과 유사)
        
    - 필요 시:
        
        - Playgrounds(“이 레이아웃으로 샘플 상세페이지/포스터 생성”) 버튼
            
    - 승인 시:
        
        - `templates` 테이블로 승격 (Status: Approved)
            
        - `/app` 에디터의 “레이아웃 템플릿 추천” 목록에 노출
            

#### 4.5.3 데이터 저장 구조 (추가)

- `layout_template_candidates`
    
    - id
        
    - ref_image_path (MinIO 경로)
        
    - editor_json (에디터용 JSON 구조)
        
    - roles_summary (TITLE/BADGE/MAIN_VISUAL 등 요약)
        
    - status (Draft/Rejected)
        
    - created_at, created_by
        
- 기존 `templates`와 연동:
    
    - Approved 시 `templates`로 복사 또는 링크
        
    - `origin = 'image_layout' | 'text_pattern'` 등으로 구분
---

## 5. 사용자 플로우와의 연결 (품질 선순환 구조)

### 5.1 전체 선순환

`flowchart LR     U[사용자] --> A[브리프 / 생성 요청]     A --> B[Agent + LLM + RAG + Templates]     B --> C[생성 결과물]     C --> D[사용/발행/성과 데이터]     D --> E[성과 기반 패턴 분석 (향후)]     E --> F[템플릿/프롬프트 개선]     F --> B     subgraph Offline         G[크롤링/데이터파이프라인] --> H[템플릿 후보 생성]         H --> F     end`

### 5.2 지금 단계에서 현실적인 연결

P0 단계에서는:

- 외부 크롤링 데이터 기반 템플릿 후보 생성
- Admin이 수동으로 품질 확인 후 Approved 템플릿을 생성
- 에이전트는 다음을 활용:
  - "업종/채널별 Approved 템플릿"을 System Prompt에서 참고
  - 필요 시 RAG로 "유사 업종 사례" 검색 후 카피 생성에 반영

성과 데이터(CTR, 전환율 등)는
외부 채널 연동이 본격화된 이후 P1~P2에서 선순환 루프에 추가.

#### 5.2.1 Data Pipeline 실행 스케줄 (P0)

| 작업 | 실행 주기 | 실행 시간 | 담당 | 설명 |
|------|-----------|-----------|------|------|
| **크롤링 (Crawler)** | 주 1회 | 일요일 02:00 | Celery Beat | 마케팅 문서, 블로그, 광고 크리에이티브 수집 |
| **데이터 정제 (Cleaner)** | 크롤링 직후 | 자동 트리거 | Celery Worker | 중복 제거, 포맷 정규화, 저품질 필터링 |
| **업종/채널 태깅 (Tagger)** | 정제 직후 | 자동 트리거 | Celery Worker | Industry, Channel, Persona 자동 태깅 |
| **Vector Embedding** | 태깅 직후 | 자동 트리거 | Celery Worker | ChromaDB/Qdrant에 벡터 저장 |
| **텍스트 패턴 분석** | 주 1회 | 월요일 03:00 | Celery Beat | 문장 구조 패턴 추출 |
| **템플릿 후보 생성** | 패턴 분석 직후 | 자동 트리거 | Celery Worker | Content Template 초안 생성 |
| **Admin 검수** | 수동 | - | 운영자 | `/admin/templates`에서 Draft 검토 |
| **Template 승인/배포** | 수동 | - | 운영자 | Status: Draft → Approved, Redis 캐시 갱신 |
| **인덱스 재빌드** | 월 1회 | 1일 04:00 | Celery Beat | Vector DB 전체 재인덱싱 (성능 최적화) |

**주요 의존성**:
```
크롤링 → 정제 → 태깅 → Vector Embedding (체인 실행)
                          ↓
                    RAG 조회 준비 완료

패턴 분석 → 템플릿 후보 생성 → Admin 검수 → 승인/배포
```

**모니터링**:
- `/admin/data-lab/jobs`: 각 작업 실행 상태 모니터링
- Prometheus 메트릭: `data_pipeline_crawl_success_total`, `template_approval_rate`

---

## 6. 데이터 스키마 개략 (간략 버전)

### 6.1 주요 테이블 예시

- `raw_marketing_docs`
    
    - id, source_type, raw_path, collected_at, status
        
- `marketing_docs`
    
    - id, title, body, source_url, channel, industry, persona, tone, locale, collected_at
        
- `marketing_doc_embeddings`
    
    - id, marketing_doc_id, vector, created_at
        
- `template_candidates`
    
    - id, type, industry, channel, persona, content, status(Draft/Rejected), created_at
        
- `templates`
    
    - id, type, industry, channel, persona, content, status(Approved/Deprecated), version
        

---

## 7. Admin Console과의 경계

- 이 문서에서 정의한 파이프라인은 **백엔드/배치/데이터 레이어**에 집중한다.
    
- Admin Console과의 연결점은 다음과 같다.
    

1. `/admin/data-lab`
    
    - 크롤링 잡, 데이터셋, 인덱스 상태 조회 및 수동 트리거
        
2. `/admin/templates`
    
    - 템플릿 후보(자동 생성) 검수/승인
        
3. `/admin/system-health` / `/admin/dashboard`
    
    - 크롤링/인덱싱 진행 상황, 데이터 축적 현황 요약
        

> 즉, **데이터 파이프라인은 “엔진”이고**,  
> Admin Console은 이 엔진을 “조작하고 상태를 보는 운전석” 역할을 한다.

---

## 8. 단계별 구현 우선순위

### P0 (지금 필요한 최소 구조)

- 최소 1~2개 소스 크롤링 파이프라인 구축
    
- Cleaner/Normalizer, 기본 Tagger
    
- PostgreSQL에 정제 데이터 저장
    
- 간단한 Embedding + Global Index
    
- Template Candidate Generator 초기 버전
    
- Admin Data Lab & Templates 화면에서 **상태 조회 + 승인/비승인** 가능하게
    

### P1 이후

- 업종/채널 다양화
    
- 성과 데이터(CTR, 전환율)와 연동된 패턴 분석
    
- A/B 테스트 기반 템플릿 성능 비교
    
- 대규모 데이터셋 관리 및 모니터링 고도화
```
