# Sparklio.ai — V4 PRD (Final, Chat‑Driven + Multi‑Agent A2A + Ops)

> 문서 상태: **Final v1.1**
> 날짜: 2025‑11‑14 (금요일) 16:35
> 최종 수정: 2025-11-14 (금요일) - V4.4 모델 통합 (VEo3, AnimateDiff, ComfyUI, GPT-4.1, GPT-4-Turbo 추가)
> 소유: Product/PMO
> 범위: 전략·시장·기능·아키텍처·운영·보안·QA/E2E·비용·확장까지 **처음부터 끝까지 실행 가능한 PRD**

---

## 0. Executive Summary

Sparklio.ai는 **챗 과 데이터(pdf, 브로셔, 홈페이지 url, 회의 녹음, 영상) 기반**으로 브랜드 분석 → 브리프 → 산출물(상품상세/브로셔, SNS, 프레젠테이션, 광고/쇼츠) 생성 → 각각은 **검토 범퍼(초안 승인)** → 통합 에디터/Video Studio 편집 → **자동 발행**까지 단일 경험을 제공하는 **AI 디자인·마케팅 OS**입니다.  
핵심 차별점은 **A2A 멀티에이전트**와 **One‑Page Unified Editor + Video Studio**, **Smart LLM Router(유저/자동 선택)**, **파일 인지형 RAG**입니다.

---
## 0-1. Scope (11 Core Modules)

0. 공통 기반(브랜드킷·RAG·Router·Editor·Publisher·Scheduler)
    
1. 브랜드 분석 자동화
    
2. 마케팅 브리프
    
3. 상품상세설명서/브로셔
    
4. SNS 마케팅
    
5. 프리젠테이션
    
6. 광고영상/쇼츠 제작
    
7. 발행·출력 관리
    
8. 블로그(워드프레스)
    
9. 트렌드 분석
    
10. 마케팅자료 자동 수집·학습
    
11. 마케팅 템플릿 자동 생성기
    

각 모듈은 **입력→처리→출력**, **주요 플로우**, **API 계약**, **편집기 인터페이스**, **수락 기준(AC)**, **KPI** 순으로 정의.

## 1. Market & Target (Who & Why)

### 1.1 초기 타겟 고객

- **T1: 1인/소규모 브랜드**(프리랜서·셀러·1~5인 스타트업): 빠른 생성·저비용이 핵심.
    
- **T2: 스타트업/SMB 마케팅팀**(5~50명): 팀 협업, 브랜드 일관성, 예약 발행이 핵심.
    
- **T3: 에이전시·프리랜스 디자이너**: 다계정 관리, 템플릿 재사용률, 버전 관리.
    

### 1.2 사용자 가치 제안 (Differentiation)

- **A2A 멀티에이전트** → 문서·이미지·영상 전 과정을 분업·병렬로 가속.
    
- **One‑Page UX + 통합 에디터** → 도구 전환 없이 초안→편집→발행까지 한 화면.
    
- **브랜드 가드**(톤/팔레트/폰트/금지어) → 모든 산출물의 일관성.
    
- **Smart Router** → 품질·속도·비용 균형 최적화(로컬+클라우드 하이브리드).
    
- **파일 인지형 생성** → 사용자가 가진 PDF/PPT/Excel/이미지에서 즉시 초안 생성.
    

### 1.3 가격 및 수익모델(안)

- **Starter(월)**: 저용량 + 로컬 모델 중심, 기본 발행, 크레딧 1만.
    
- **Pro(월)**: Router 자동, 모든 채널 발행, 팀원 3명, 크레딧 5만.
    
- **Studio(월)**: 고급 영상(클라우드 Sora2/NB) 포함, 팀원 10명, 크레딧 15만.
    
- **Add‑on**: 고가 영상 패스, 추가 크레딧, 프리미엄 템플릿 팩.  
    (요금은 CPI·GPU 원가 지표에 따라 가변; Router 대시보드로 비용 투명화)
    

---

## 2. Scope (11 Modules)

0. 공통(브랜드킷/RAG/Router/Editor/Video Studio/Publisher/Scheduler)
    
1. 브랜드 분석 자동화 2) 마케팅 브리프 3) 상품상세/브로셔 4) SNS 5) 프리젠테이션
    
2. 광고영상/쇼츠 7) 발행 관리 8) 블로그(WP) 9) 트렌드 분석 10) 자료 수집·학습
    
3. 템플릿 자동 생성기  
    **원칙**: 모든 생성물은 **초안→유저수정→[생성] 확정**의 검토 범퍼를 통과.
    

---

## 3. UX: Chat‑Driven Creation + Review Buffer

### 3.1 플로우

1. 유저가 **단어/문장 입력 또는 파일 업로드**(txt, md, pdf, jpeg, png, webp, ppt, xlsx).
    
2. 챗봇이 **메뉴별 질문 세그먼트** 제시(수정 가능) 또는 **바로 생성** 옵션 제공.
    
3. AI가 **초안**을 중앙 에디터(또는 Video Studio)에 **Preview 상태**로 렌더.
    
4. 유저가 **수정/보완** → **[생성] 버튼** 클릭 시 최종화(버전 기록).
    
5. 발행 관리로 전송(즉시/예약 게시).
    

### 3.2 Review Buffer UI

- 캔버스 상단에 **Draft Ribbon** + **[수정] [재생성] [생성]** 버튼.
    
- 초안 단계 편집은 **임시 레이어**로 기록되며, [생성] 시 **승격(Commit)**.
    
- [재생성]은 동일 파라미터/모델로 재시도(이전 버전은 히스토리 보관).
    

### 3.3 Chat↔Editor 상태 동기화 (Source of Truth)

- **Source of Truth: Asset JSON (server)**.
    
- 에디터 조작은 **Action DSL** 로 서버에 전송→버전 증가(OT/CRDT 적용).
    
- 챗 명령은 **동일 DSL** 로 변환되어 같은 경로로 적용.
    
- 충돌: 타임스탬프/버전 비교→**최신 승리 + 충돌 로그**(필요시 머지 규칙).
    

---

## 4. Architecture & Infra

### 4.1 소프트웨어 스택

- **Frontend**: Next.js, React, Fabric.js, WebSocket(EventStream).
    
- **Backend**: FastAPI(REST), Celery(Queue), APScheduler, FFmpeg Pipeline.
    
- **Data**: PostgreSQL(+pgvector), Redis(Cache/Queue), Object Storage(S3/MinIO).
    
- **RAG**: Cleaner→Chunker→Embedder→pgvector.
    
- **LLM Router**: 로컬(Llama3.1, Qwen2, Mistral) + 클라우드(GPT‑5, Claude, Gemini, Pi, DALL·E, NanoBanana, Sora2).
    

### 4.2 하드웨어(3‑노드, Tailscale)

- **집 데스크탑(주말/고부하)**: i5‑10600K, **RTX 4070 SUPER**, RAM 32GB, NVMe 2TB  
    ‣ Stable Diffusion/오픈소스 LLM 7B~13B, 영상 합성 가속 담당.
    
- **학원 노트북(평일/발표)**: Ryzen 7 8845HS, **RTX 4060 Laptop**, RAM 32GB, 512GB SSD.
    
- **Mac mini M2(서버)**: M2 + NE, RAM 16GB, SSD 512GB  
    ‣ FastAPI, Redis, PostgreSQL, Celery, Scheduler 24/7.
    
- **동기화·전송**: Tailscale 연결 + **S3/MinIO 오브젝트 스토리지**(대용량 영상) + rsync(FS 동기화) + 공유 볼륨(선택).
    

### 4.3 확장성·가용성·DR

- **스케일 아웃**: API/Worker **stateless** → 노드 추가.
    
- **DB**: PITR 백업(시간당 스냅샷), 주기적 dump → 외부 스토리지.
    
- **Redis**: AOF 지속화, 장애 시 cold‑standby.
    
- **Object**: 버전닝, 지역 복제.
    
- **SPOF 회피**: Mac mini 부하 급증 시 클라우드 Postgres/Redis 전환 Runbook.
    

---

## 5. Smart LLM Router (Auto/Manual)

### 5.1 모델 카탈로그

#### 텍스트 LLM
|모델|분류|강점|주요 용도|비용/1K토큰|
|---|---|---|---|---|
|**GPT-5**|클라우드|최고 품질|전략/복잡한 추론|$0.015|
|**GPT-4.1**|클라우드|Complex reasoning|고난도 분석|$0.012|
|**GPT-4-Turbo**|클라우드|Complex reasoning|복잡한 작업|$0.01|
|**GPT-4o**|클라우드|균형/멀티모달|범용 작업|$0.005|
|**GPT-4o-mini**|클라우드|빠른 응답|초안/빠른 작업|$0.0015|
|**Claude 3.5 Sonnet**|클라우드|톤 안정/긴문서|브리프/상품상세|$0.003|
|**Claude 3.5 Haiku**|클라우드|빠른 작업|간단한 작업|$0.0008|
|**Gemini 2.5 Pro**|클라우드|멀티모달|다양한 작업|$0.0025|
|**Gemini 2.5 Flash**|클라우드|초고속/저비용|요약/SNS/실시간 챗|$0.0003|
|**Pi**|클라우드|대화형|가벼운 어시스트|$0.0002|
|**Llama 3.1 70B**|로컬|프라이버시|민감 데이터 처리|$0.0001*|
|**Llama 3.1 8B**|로컬|균형|프리젠테이션/요약|$0.00005*|
|**Qwen2 14B**|로컬|가성비/길이|템플릿/프리젠테이션|$0.00008*|
|**Mistral 7B**|로컬|경량/속도|트렌드 분석|$0.00005*|

#### 이미지 생성
|모델|분류|강점|주요 용도|비용/이미지|
|---|---|---|---|---|
|**DALL-E 3**|클라우드|최고 품질|브랜드 메인 이미지|$0.04|
|**DALL-E 2**|클라우드|표준 품질|일반 이미지|$0.02|
|**Midjourney v6**|클라우드|예술적|캠페인 메인|$0.03|
|**NanoBanana**|클라우드|빠름/창의적|썸네일/아이디어|$0.01|
|**ComfyUI (SDXL)**|로컬|LoRA+ControlNet+IPAdapter|브랜드 특화|$0.001*|
|**SD XL**|로컬|브랜드 LoRA|맞춤 이미지|$0.001*|
|**SD 1.5**|로컬|빠른 로컬|빠른 생성|$0.0005*|

#### 영상 생성
|모델|분류|강점|주요 용도|비용/초|
|---|---|---|---|---|
|**VEo3**|클라우드/로컬 Adapter|광고/쇼츠|메인 광고 영상|$0.40|
|**AnimateDiff**|로컬 (ComfyUI 통합)|이미지→모션|씬별 모션 클립|$0.005*|
|**Sora2**|클라우드|최고 품질|프리미엄 광고|$0.50|
|**Runway Gen-3**|클라우드|속도/안정|SNS 영상|$0.30|
|**Pika Labs**|클라우드|빠른 초안|빠른 초안|$0.20|

*로컬 모델 비용은 전기료 및 하드웨어 상각 기준 추정값
*ComfyUI는 SDXL + LoRA + ControlNet + IPAdapter를 통합한 워크플로우 시스템
*AnimateDiff는 ComfyUI와 통합하여 SDXL 이미지에 모션을 추가하는 로컬 파이프라인

**상세 모델 정책 및 선택 로직**: `docs/PHASE0/LLM_ROUTER_POLICY.md` 참조

### 5.2 자동 선택 규칙(가중치 스코어)

`Score = wC*Cost + wL*Latency + wQ*Quality + wR*Resource + wS*Sensitivity`

- **Cost(C)**: 토큰·분당/영상 크레딧.
    
- **Latency(L)**: 목표 T90.
    
- **Quality(Q)**: 내부 벤치마크/A/B 점수.
    
- **Resource(R)**: 로컬 GPU 사용 가능(=감점) vs 혼잡도.
    
- **Sensitivity(S)**: 민감 데이터면 로컬 우선/클라우드 제한.  
    **프리셋**: _Draft Fast_, _Balanced_, _High‑Fidelity_.  
    **수동 선택**: 모델 드롭다운(자동/개별 모델/고급 파라미터).  
    **비용 경보**: 영상·대용량 작업은 예상 비용/시간을 팝업으로 고지 후 진행.
    

---

## 6. Data & File‑Aware Intelligence

### 6.1 파이프라인

`Collector → Cleaner → Parser → Chunker → Embedder → Ingestor(pgvector)`

- **PDF**: pdfminer + 레이아웃 분석, 이미지 OCR 혼합.
    
- **PPTX**: python‑pptx로 슬라이드 트리(마스터/레이어/도형) 추출, 노트/순서 보존.
    
- **XLSX**: openpyxl → 표 스키마/관계 보존, tabular‑to‑json 변환.
    
- **Image**: OCR + CLIP, dominant color, layout hint.
    
- **모든 업로드는 JSON 중간 표현**으로 표준화 후 임베딩.
    

### 6.2 프레젠테이션 생성 전략

- **레이아웃 템플릿**(그리드/타이포 시스템) + **콘텐츠 토큰 바인딩**.
    
- 슬라이드 타입: Title, Section, Bullets, Visual, Data, Quote, CTA.
    
- 브랜드 가드로 폰트/컬러 100% 준수.
    

---

## 7. Multi‑Agent A2A

### 7.1 프로토콜

- 입력 `{message_id, timestamp, payload}` → 출력 `{message_id, timestamp, status, payload, error}`.
    
- WebSocket EventBus + Celery Queue(우선순위: P0/P1/P2).
    
- **Idempotency‑Key**: 재시도 안전.
    
- **Dead‑Letter Queue**: 실패 누적 시 수동 조사.
    

### 7.2 에이전트(전체 목록)

**A. Creation Agents (콘텐츠 생성)** — 9개
- **StrategistAgent**: 캠페인 전략·구조 설계
- **CopywriterAgent**: 브랜드 톤 기반 카피 생성
- **VisionGeneratorAgent**: 이미지 생성 (DALL-E/SDXL/ComfyUI)
- **VisionAnalyzerAgent**: 생성 이미지 품질 검증
- **ScenePlannerAgent**: 영상 씬 구성 설계
- **StoryboardBuilderAgent**: 스토리보드 조립
- **VideoDirectorAgent**: 영상 연출 지시
- **VideoReviewerAgent**: 영상 품질 검토
- **TemplateAgent**: 템플릿 자동 생성·커스터마이징

**B. Intelligence Agents (데이터·학습·분석)** — 11개
- **TrendCollectorAgent**: 트렌드 데이터 수집
- **DataCleanerAgent**: 수집 데이터 정제
- **EmbedderAgent**: 텍스트/이미지 임베딩
- **IngestorAgent**: pgvector DB 저장
- **RAGAgent**: 브랜드 컨텍스트 검색
- **ReviewerAgent**: 산출물 품질 평가
- **PerformanceAnalyzerAgent**: 발행 성과 분석
- **SelfLearningAgent**: 브랜드 학습 루프 관리
- **BrandModelUpdaterAgent**: 브랜드 LoRA/프롬프트 업데이트
- **TrendAgent**: 트렌드 분석 인사이트
- **DataCollectorAgent**: 마케팅 자료 수집 (TrendCollectorAgent와 통합 예정)

**C. System Agents (시스템 관리)** — 4개
- **PMAgent**: 워크플로우 조율·상태 관리
- **SecurityAgent**: 콘텐츠 정책·민감정보 필터
- **BudgetAgent**: LLM/GPU 비용 추적·경보
- **ADAgent**: PPC 광고 캠페인 관리

**총 24개 에이전트**

**각 Agent 상세 사양은 `docs/PHASE0/AGENTS_SPEC.md` 참조**: I/O 스키마, 프롬프트, KPI, Fallback, 샘플 포함.
    

### 7.3 오류 처리 & 복구

- 부분 실패 시 **Saga 패턴**으로 보정/보류.
    
- 동시 수정 충돌: 에디터 락(soft) + 버전 비교 병합.
    
- 재시도 전략: 지수 백오프(최대 3회), 회로차단기 적용.
    

---

## 8. Publisher & Channels

- SNS(API), WordPress(REST), 파일 Export(PDF/PNG/MP4).
    
- 예약/재시도/중복 방지/콜백 로그.
    
- 채널 토큰은 Vault 보관, 최소 권한.

### 8.1 PPC Ads Publishing (신규)

**목표**: Google Ads / Microsoft Ads / 네이버 검색광고 / 카카오모먼트 등 **CPC/PPC 기반 광고**를 PRD의 "발행·출력 관리" 범위에서 **자동 생성·검수·집행·모니터링**까지 지원.

**입력**

- 캠페인 목적(트래픽/리드/구매), 예산(일/총), 지역/언어, 기간, 입찰전략(자동/수동), UTM 규칙
    
- 랜딩 URL(워드프레스 게시물/외부 URL), 전환 이벤트(GA4/GTM), 키워드 세트(브리프/트렌드에서 추천)
    
- 소재(헤드라인/설명/이미지/동영상) — 생성 또는 수동 업로드
    

**처리(주요 플로우)**

1. **정책 가드**: 플랫폼 금지어/문구 길이/문장규칙/상표권 체크
    
2. **캠페인 설계**: 네트워크/지역/일정/예산/입찰전략 매핑
    
3. **광고그룹/키워드**: 매칭옵션(정확/구문/확장) 자동 제안 + 음수키워드 추천
    
4. **소재 생성/매핑**: Responsive Search/Display/Video 포맷 규격화
    
5. **검토 범퍼**: 초안 플랜(예산/구조/소재/키워드) 미리보기 → 유저 승인 후 집행
    
6. **집행 & 스케줄**: 즉시/예약, 주간/일간 예산 분배
    
7. **관측/최적화 루프**: CTR/CPC/CPA/ROAS 수집 → 자동 제안(키워드/소재/입찰 조정)
    
8. **이상징후 제어**: 비용 급증/전환 0 상황 **자동 일시중지** + 알림
    

**출력**

- 플랫폼별 캠페인/그룹/광고 ID, 상태, 성과 지표(CTR/CPC/CPA/ROAS)
    
- 게시 링크/리포트, 변동 이력(예산/입찰/키워드/소재)
    

**API 계약(대표)**

- `POST /publish/ppc/plan` → (입력 파라미터를 바탕으로) 캠페인 설계 **초안** 생성
    
- `POST /publish/ppc/execute` → 초안 승인 후 실제 집행 (플랫폼: `google|msads|naver|kakao`)
    
- `GET /publish/ppc/stats?campaign_id=...` → 기간별 성과
    
- `POST /publish/ppc/pause` / `resume` / `adjust_budget`
    

**편집기 인터페이스**

- 에디터 우측 **Ads 탭**: 키워드/문구/확장소재 편집, 정책 위반 실시간 경고
    
- **플랜 미리보기 카드**: 예산·입찰·예상 도달/클릭·키워드/소재 목록
    
- **한‑클릭 승인**: [수정] [재생성] [생성(집행)]
    

**수락 기준(AC)**

- 플랫폼 정책 위반 0건으로 초안 통과(자동 사전검증)
    
- 집행 API 성공률 ≥ 99%, 중복 캠페인 생성 방지
    
- 전환 추적(UTM/GA4/GTM) 누락 0건
    
- 자동 이상징후 제어(일시중지) 트리거 동작 검증
    

**KPI**

- 초안→승인까지 평균 소요 ≤ 10분
    
- CTR 개선 제안 채택률 ≥ 30%
    
- 비정상 지출 방지로 절감된 비용(월간) 리포트화
    
- 캠페인 생성 실패율 < 1%
    

**구현 가능성(Feasibility)**

- **공식 API 연동**: Google Ads API, Microsoft Advertising API, 네이버 검색광고 API, 카카오모먼트 API 등 연동으로 **완전 자동화 가능**(권한/OAuth/쿼터 필요).
    
- **제약**: 일부 계정/광고주 검수 필요, 이미지/상표 심사 지연, 플랫폼별 Rate Limit.
    
- **대응**: 샌드박스/테스트 계정 지원, 재시도/백오프, 정책 템플릿 지속 업데이트, 비용 상한/일시중지 룰 내장.
    

**보안/컴플라이언스**

- OAuth 토큰 **Vault** 보관, 최소 스코프, 정기 로테이션
    
- 광고주 권한 검증(계정 매핑), 감사로그 `{who, what, budget_change}` 저장
    
- 개인정보/전환 데이터는 익명화·집계 수준으로만 표시

---

## 9. Security, Privacy, Compliance

- **데이터 정책**: 개인정보 최소 수집, 임시 파일 TTL, 고객 자료 **모델 재학습에 사용 안 함(Opt‑in 별도)**.
    
- **저작권/침해**: 업로드 저작권 경고, 생성물 이용 약관 고지, 이미지/폰트 라이선스 트래킹.
    
- **API Rate**: 한도 초과 시 큐 보류 + 사용자 안내.
    
- **접근성**: 키보드 내비게이션, 캔버스 ARIA 라벨, 색 대비 AA.
    
- **감사 로그**: `{who, what, when, cost, model}` 전 트랜잭션 기록.
    

---

## 10. KPIs & Observability

- **측정 항목**: `{model, tokens_in/out, cost, latency, quality_score}` per Agent.
    
- **대시보드**: Router 비용/속도 히트맵, 큐 대기시간, 발행 성공률, 에디터 충돌률.
    
- **품질 지표**:  
    ‣ 브랜딩 톤: 휴리스틱 + 인하우스 라벨러 5점척도, 주간 샘플 n≥50.  
    ‣ 색상/폰트 일치율: 규칙 매칭율.  
    ‣ 사용자 만족: 승인까지 수정 라운드 수, 5점 설문.
    

---

## 11. User Stories & Acceptance

### 11.1 공통

- **US‑001**: “사용자로서, 키워드와 PDF를 올리면 3분 내 초안을 보고 싶다.”  
    **AC**: 180s 이내 Preview 렌더, 금지어 0건, 톤 위반 < 1건.
    
- **US‑002**: “수정하고 [생성]으로 확정하고 싶다.”  
    **AC**: 히스토리 기록, 재생성 시 이전 버전 보관.
    

### 11.2 모듈별(예)

- **상품상세**: 스펙 필드 누락 0, 표/이미지 깨짐 0, SEO 메타 자동.
    
- **SNS**: 채널별 길이/해시 준수, 예약 성공률 ≥99%.
    
- **영상**: 30초 쇼츠 T90 ≤120s, 오디오 ‑14 LUFS±2.
    

(전체 목록은 _E2E_TEST_PLAN.md_ 참조)

---

## 12. API & Data Contracts (샘플)

```http
POST /briefs/generate
{ "brand_id": "...", "goal": "launch", "audience": [...], "channels": ["ig","wp"] }
→ 201 { "brief_id": "...", "draft": {...} }
```

```http
POST /assets/product-detail/generate
{ "brief_id": "...", "product": {...}, "template_id": "opt" }
→ 202 { "asset_id": "...", "status": "draft" }
```

```http
POST /editor/actions
[{ "target": "layer:2", "op": "style", "args": {"fontSize": "+4"}}]
→ 200 { "version": 17 }
```

---

## 13. Work Queue & Task Orchestration

- **우선순위 큐**: P0(인터랙티브) / P1(배치) / P2(학습).
    
- **Idempotency‑Key**로 중복 방지.
    
- **스케줄링**: APScheduler(발행/리포트/트렌드).
    
- **리소스 게이팅**: 로컬 GPU Busy 시 **클라우드로 자동 오프로딩**(Router 규칙).
    
- **작업 큐 관리 대시보드**: 대기/실행/실패, 재시도/취소.
    

---

## 14. Roadmap & MVP

### 14.1 MVP v0 (출시 목표)

- 챗봇 + 브랜드킷 + 브리프 + 상품상세 + 블로그/발행 + Review Buffer.
    
- 템플릿/프레젠테이션(경량), SNS(기본), Router(초기 정책), 로컬 LLM.
    

### 14.2 v1.1

- 영상/쇼츠(FFmpeg 우선), Sora2/NanoBanana 어댑터 베타.
    
- 트렌드 분석 + 자료 수집 고도화.
    

### 14.3 v1.2

- 팀 협업(코멘트/권한) + 고급 에디터 명령(자연어‑>DSL 강화).
    
- KPI/비용 대시보드 공개.
    

---

## 15. Governance: Versioning & Release

- **에이전트 버전**: `agent@major.minor.patch` 레지스트리, 롤백 가능.
    
- **프롬프트 거버넌스**: 템플릿 Git 관리, 변경 시 A/B 체크.
    
- **Feature Flags**: INTERNAL_MODE, GENERATOR_SCOPE, EDITOR_SCOPE.
    

---

## 16. Risks & Contingency

- **벤더 의존**(OpenAI/Sora2 등): 대체 모델/클라우드 준비, 계약/가격 변동 모니터.
    
- **Mac mini 병목**: 부하 임계시 클라우드 DB/Worker 전환.
    
- **자료 저작권/민감정보**: 경고/마스킹/보존주기(기본 90일) 정책.
    
- **라운드트립 지연**: 로컬 우선 라우팅, 배치 예약 옵션 제공.
    

---

## 17. Definition of Done

- 모든 모듈 **초안→검토→생성** 플로우 정상.
    
- Router 자동/수동 동작 + 비용 경보.
    
- A2A 이벤트/재시도/Dead‑Letter 정책 준수.
    
- E2E 시나리오(Green) + 대시보드 지표 수집.
    
- 보안/라이선스/접근성 체크리스트 통과.
    

---

## 18. Appendices

- **Action DSL 예시**: `{ "target":"layer:3", "op":"replaceImage", "args": {"src":"s3://..."}}`
    
- **FFmpeg Preset**: 1080x1920@30, vbr 6Mbps, aac 128kbps, ‑14 LUFS.
    
- **톤 가드 룰**: 금지어 리스트, 톤 예시코퍼스, 위반시 알림.
    
- **백업 주기**: DB 시간당 스냅샷, 일일 전체 백업, 30일 보존.
    

> 상세 I/O 스키마, 프롬프트, 테스트 케이스는 별첨 문서:  
> _AGENTS_SPEC.md · E2E_TEST_PLAN.md · LLM_ROUTER_POLICY.md · DATA_PIPELINE_PLAN.md · UX_FLOW_SPEC.md · OBSERVABILITY_SPEC.md · SECURITY_POLICY.md_