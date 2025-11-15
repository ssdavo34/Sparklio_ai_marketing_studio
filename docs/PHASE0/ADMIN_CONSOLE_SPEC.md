# ADMIN_CONSOLE_SPEC

# Sparklio V4 — Admin Console Spec (v1.0)

- 문서명: ADMIN_CONSOLE_SPEC.md
- 버전: v1.0
- 작성일: 2025-11-15
- 작성자: SeongEon Park (PM), ChatGPT(설계 보조)
- 상태: Draft (P0 범위 확정용)

---

## 1. 개요 (Overview)

### 1.1 목적

이 문서는 **Sparklio V4 Admin Console**의 기능·정보 구조·우선순위를 정의한다.

- `/app` : **사용자(마케터/대표)** 가 사용하는 Studio
- `/admin` : **운영자(우리 팀)** 가 사용하는 Admin Console

Admin Console은 다음 세 가지 축의 기능을 제공한다.

1. **운영/모니터링**: 유저, 작업, 에이전트, 시스템 상태를 실시간 관리
2. **데이터·학습 관리(Data Lab)**: 마케팅 자료 크롤링, 데이터셋 관리, 인덱싱, 재학습
3. **지식·템플릿 관리**: 템플릿 자동 생성 결과를 검수·배포, 프롬프트/룰 관리

> 목표: **크롤링·자가학습·템플릿·모니터링**이 모두 Admin에서 하나의 “운영 도구”로 연결되도록 설계한다.

---

## 2. 범위 및 비범위 (Scope / Non-Goals)

### 2.1 이번 버전에서 다루는 범위 (P0 중심)

- `/admin` SPA 혹은 MPA 중 **라우팅 구조까지만 정의**, UI는 기본 Table/List 위주
- P0로 반드시 포함해야 하는 메뉴:
  - Users & Plans
  - Jobs & Queues
  - Agents Status
  - Logs & Errors
  - Data Lab (크롤링/데이터셋/인덱스)
  - Templates & Prompts
  - Feature Flags
  - (간단한) System Health 요약

### 2.2 이번 버전에서 제외되는 것 (P1 이상)

- 정교한 Billing/결제/인보이스 화면
- A/B 실험 관리(Experiment Console)
- 고급 Analytics(차트/그래프 위주 BI)
- 세밀한 Role/Permission 관리(UI)

---

## 3. 정보 구조 (Information Architecture)

### 3.1 라우팅 구조

- Base Path: `/admin`
- 네비게이션(좌측 사이드바) 1차 메뉴 구조 (버전 1.0 기준):

1. **Dashboard** *(P1)*  
   - `/admin` 또는 `/admin/dashboard`  
   - 전체 시스템 요약(유저 수, 오늘 작업 수, 실패율 등)  
   - P0에서는 생략 가능, P1에서 도입

2. **Users & Plans** *(P0)*  
   - `/admin/users`  
   - 회원/플랜/크레딧 관리

3. **Jobs & Queues** *(P0)*  
   - `/admin/jobs`  
   - 생성 작업/큐 상태 모니터링

4. **Agents Status** *(P0)*  
   - `/admin/agents`  
   - 에이전트별 성능/에러/응답속도

5. **Logs & Errors** *(P0)*  
   - `/admin/logs`  
   - 주요 에러 로그/이벤트 조회

6. **Data Lab** *(P0)*  
   - `/admin/data-lab`  
   - 크롤링 잡, 데이터셋, 인덱스, 재학습 트리거

7. **Templates & Prompts** *(P0)*  
   - `/admin/templates`  
   - 템플릿 자동 생성 결과 관리, 프롬프트/룰 관리

8. **Feature Flags** *(P0)*  
   - `/admin/feature-flags`  
   - INTERNAL_MODE, GENERATOR_SCOPE, EDITOR_SCOPE 등 토글

9. **System Health** *(P0 최소 버전)*  
   - `/admin/system-health`  
   - 노드/서비스 상태 요약(간단한 리스트/표 위주)

10. **Integrations** *(P1)*  
    - `/admin/integrations`  
    - 외부 채널(Naver, Meta, WordPress 등) 연결 상태

---

## 4. 모듈별 상세 스펙 (P0 기준)

### 4.1 Users & Plans

#### 4.1.1 목적

- 전체 회원을 조회하고, 각 유저의 **플랜/크레딧/사용량**을 관리
- CS 대응, 플랜 업/다운그레이드, 과다 사용 모니터링에 활용

#### 4.1.2 화면 구성

1) 목록 화면 `/admin/users`

- 필터/검색
  - 검색: 이메일, 이름
  - 필터: 플랜(Free/Pro/Enterprise), 상태(Active/Blocked), 최근 접속(7/30/90일)
- 컬럼 예시
  - 이름 / 이메일
  - 가입일 / 최근 접속일
  - 플랜 / 플랜 만료일
  - 크레딧 잔량
  - 총 생성 요청 수 / 실패 비율(%) 요약

2) 상세 화면 `/admin/users/{userId}`

- 기본 정보
  - 이름, 이메일, 회사, 직책
- 계정 상태
  - Active / Blocked 토글
  - 이메일 인증 여부
- 플랜 & 크레딧
  - 현재 플랜, 만료일
  - 크레딧 잔량 (+ / - 수동 조정)
- 사용 기록 요약
  - 최근 10개 작업: 타입, 상태, 생성일, 실패 사유
  - 연결된 채널(WordPress, SNS, Ads 등) 리스트
- 운영자 액션
  - 비밀번호 초기화 메일 보내기
  - 계정 강제 로그아웃(토큰 무효화)
  - 계정 삭제(Soft delete)

#### 4.1.3 의존 API

- `GET /admin/users`
- `GET /admin/users/{id}`
- `PATCH /admin/users/{id}`
- `POST /admin/users/{id}/credit-adjust`
- 등 (백엔드와 별도 API 설계 문서에서 정의)

---

### 4.2 Jobs & Queues

#### 4.2.1 목적

- Sparklio 내 모든 생성 작업(브리프, 상세페이지, SNS, 프레젠테이션, 광고영상 등)의 상태 관리
- Celery/Redis Queue 상태 모니터링

#### 4.2.2 화면 구성

1) 작업 목록 `/admin/jobs`

- 필터
  - 상태: Queued / Running / Succeeded / Failed
  - 작업 타입: BrandKit, ProductDetail, SNS, Presentation, Video, etc.
  - 생성일 범위
- 컬럼
  - Job ID, User, Job Type
  - 상태, 생성일, 완료일, 소요 시간
  - Worker 노드 (Mac mini / Desktop / etc.)

2) 큐 상태 `/admin/jobs/queues`

- 큐별 현재 대기 작업 수
- 최근 10분/1시간 처리량
- 워커별 처리 속도

3) 작업 상세 `/admin/jobs/{jobId}`

- Job 메타 정보
- 입력 파라미터(브리프 요약 등)
- 결과 링크(생성된 자산 ID)
- 에러 메시지 (실패 시)
- 재시도 버튼

---

### 4.3 Agents Status

#### 4.3.1 목적

- 16~24개 에이전트의 **성공률, 응답속도, 에러 패턴**을 한 곳에서 파악
- 성능 저하/에러율 증가 에이전트 탐지 → 개선 대상 선정

#### 4.3.2 화면 구성

1) 에이전트 리스트 `/admin/agents`

- 컬럼
  - Agent 이름 (예: BrandStrategist, Copywriter, VideoDirector 등)
  - 최근 24h 호출 수
  - 성공률 (%)
  - 평균 응답 시간
  - 에러율 및 주요 에러 코드 Top3

2) 에이전트 상세 `/admin/agents/{agentName}`

- 최근 호출 로그 샘플
- 에러 로그 Top N
- 사용 모델(LLM) 현황
- 관련 Feature Flag / 라우팅 정책 링크

---

### 4.4 Logs & Errors

#### 4.4.1 목적

- “유저가 에러를 만났다”고 했을 때, 빠르게 재현/조사할 수 있는 도구 제공

#### 4.4.2 화면 구성

- 필터
  - 기간, 심각도(Level), 서비스(API/Worker/LLM), 유저 ID
- 로그 리스트
  - 시간, Level, 서비스, 요약 메시지
- 상세
  - 전체 Stack Trace, 관련 Job ID, 관련 User ID 링크

> 구현은 중앙 로그(Prometheus/Grafana/ELK 등)와 연동하거나, 최소한 DB에 저장된 ErrorLog 테이블 조회 방식으로 시작.

---

### 4.5 Data Lab

> **핵심**: 여기서 10번(마케팅자료 자동 수집·학습)과 11번(템플릿 자동 생성기)의 “데이터 기반”이 관리된다.

#### 4.5.1 목적

- 마케팅 시장 데이터 크롤링/수집
- 데이터셋 버전 관리(예: `marketing_corpus_v1`, `v2`…)
- 인덱싱/RAG 상태 관리
- 재학습/재인덱싱 트리거

#### 4.5.2 화면 구성

1) 크롤링 잡 관리 `/admin/data-lab/crawlers`

- 크롤러 목록: 소스(블로그, 뉴스, 광고 크리에이티브 등), 상태, 최근 실행
- 각 크롤러별:
  - 실행 주기, 총 수집 문서 수
  - 최근 에러 요약
  - 수동 실행 버튼(“Run Now”)

2) 데이터셋 관리 `/admin/data-lab/datasets`

- 데이터셋 리스트
  - 이름, 버전, 문서 수, 상태(Active/Deprecated), 생성일
- 상세:
  - 샘플 문서 미리보기
  - 태깅 상태(업종/페르소나/채널)

3) 인덱스/RAG 관리 `/admin/data-lab/indexes`

- 인덱스 리스트:
  - Brand/Global, Dataset Version, 벡터 수, 마지막 빌드 시간
- 액션:
  - Rebuild Index
  - Delete Index

---

### 4.6 Templates & Prompts (수정/확장)

#### 4.6.2 화면 구성 (추가 포인트)

1) 템플릿 리스트 `/admin/templates`

- 기존 필터 + 컬럼에 아래 필드 추가:
  - Origin: `text_pattern` / `image_layout` / `manual`
- 상단 액션 버튼:
  - [New Template] (수동 작성)
  - [Generate from Data] (크롤링·패턴 기반 후보 생성)
  - **[Generate from Image] (이미지 업로드 기반 레이아웃 템플릿 생성)** ⬅️ NEW

2) "Generate from Image" 플로우

- 경로: `/admin/templates/new-from-image`
- 단계:
  1. 이미지 업로드 (잡지 표지/포스터/배너 등)
  2. 업종/채널/용도 선택:
     - 업종: F&B, Fashion, Beauty, SaaS 등
     - 채널: 상세페이지, SNS 카드뉴스, 썸네일, 광고 배너 등
  3. [레이아웃 분석 시작] 버튼 클릭
  4. 백엔드:
     - Image Preprocessor → Layout Analyzer → Semantic Role Tagger → Editor Template Generator
  5. 결과 Preview:
     - 좌측: 원본 이미지
     - 우측: 에디터 Canvas Preview(Placeholder 텍스트/이미지로 표시)
  6. Admin이:
     - 텍스트 Placeholder 이름 조정 (예: "제품명", "한 줄 카피" 등)
     - 불필요한 요소 삭제, 위치/크기 미세 조정
  7. [Approve & Save] 클릭 시:
     - `templates`에 저장 (Origin: `image_layout`, Status: Approved)

8) 템플릿 상세 `/admin/templates/{id}` (이미지 기반 템플릿의 경우)

- 기본 정보 + 추가 필드:
  - Origin: image_layout
  - Reference Image Thumbnail
- Actions:
  - [Open in Editor Playground]  
    → One-Page Editor를 Admin 모드로 열어,  
      이 템플릿을 기반으로 테스트 콘텐츠를 바로 생성/수정해볼 수 있게.

---

### 4.7 Feature Flags

**경로**: `/admin/feature-flags`

**목적**: 런타임에 기능 on/off 제어, 베타 테스트, 점진적 롤아웃

#### 4.7.1 P0 필수 Feature Flags

| Flag 이름 | 타입 | 기본값 | 설명 |
|-----------|------|--------|------|
| `INTERNAL_MODE` | boolean | true | 내부 테스트 모드 (외부 접근 차단) |
| `GEN_BRAND_KIT_ENABLED` | boolean | true | Brand Kit Generator 활성화 |
| `GEN_PRODUCT_DETAIL_ENABLED` | boolean | true | Product Detail Generator 활성화 |
| `GEN_SNS_ENABLED` | boolean | true | SNS Generator 활성화 |
| `GEN_PRESENTATION_ENABLED` | boolean | false | Presentation Generator (P1) |
| `GEN_MEETING_AI_ENABLED` | boolean | false | Meeting AI Generator (P1) |
| `EDITOR_AUTO_SAVE_ENABLED` | boolean | true | Editor 자동 저장 (30초마다) |
| `TEMPLATE_CACHE_ENABLED` | boolean | true | Redis 템플릿 캐싱 활성화 |
| `DATA_PIPELINE_CRAWL_ENABLED` | boolean | true | 자동 크롤링 스케줄 활성화 |

#### 4.7.2 화면 구성

**목록 뷰** (`/admin/feature-flags`):
- Flag 이름, 현재 값 (On/Off 토글), 설명, 마지막 변경 시간
- 검색/필터: Category별 (Generator, Editor, Data Pipeline, System)

**상세 뷰** (`/admin/feature-flags/{flagName}`):
- 현재 값 (토글 스위치)
- 설명 (마크다운 지원)
- 변경 이력 (누가, 언제, 어떤 값으로)
- 영향 범위: "이 플래그를 끄면 Product Detail Generator가 비활성화됩니다"
- 저장 버튼

#### 4.7.3 Backend 연동

**API**:
```
GET  /admin/feature-flags
GET  /admin/feature-flags/{flagName}
POST /admin/feature-flags/{flagName}
{
  "value": true,
  "reason": "베타 테스트 종료"
}
```

**구현**:
- Redis에 저장: `feature_flags:{flagName}` → boolean 값
- TTL 없음 (영구 저장)
- 변경 시 Audit Log 기록

#### 4.7.4 SYSTEM_ARCHITECTURE.md 연동

Feature Flags는 다음 위치에서 사용됩니다:
- **Generator 라우팅** (SYSTEM_ARCHITECTURE.md 5.1.3):
  ```python
  if not feature_flags.get("GEN_PRODUCT_DETAIL_ENABLED"):
      raise HTTPException(403, "Generator disabled")
  ```
- **Template 캐싱** (SYSTEM_ARCHITECTURE.md 5.2.2):
  ```python
  if feature_flags.get("TEMPLATE_CACHE_ENABLED"):
      return redis.get(cache_key)
  ```
- **Data Pipeline** (DATA_PIPELINE_ARCHITECTURE.md 5.2.1):
  ```python
  if feature_flags.get("DATA_PIPELINE_CRAWL_ENABLED"):
      celery_beat.start_crawler()
  ```

---

### 4.8 System Health (간단 버전, P0)

- `/admin/system-health`
- 노드/서비스 상태 요약:
  - Mac mini (API/DB/Redis/MinIO)
  - Desktop (ComfyUI/LLM Worker)
  - 기타 노드
- 각 노드:
  - Alive/Down, 간단한 CPU/메모리, 최근 Heartbeat 시간만 우선 표시

---

## 5. 권한·보안

- v1.0 기준:
  - Admin 전체 접근은 내부 계정만 (별도 Admin 로그인)
  - Role은 `SuperAdmin` 1종으로 시작 (세분화는 P1에서)
- 모든 주요 액션(크레딧 변경, 플랜 변경, 템플릿 상태 변경 등)에 Audit Log 기록 필요
  - 별도 `ADMIN_AUDIT_LOG` 테이블 고려

---

## 6. 기술 스택 및 구현 가이드

- Frontend:
  - 기존 `Sparklio Studio`와 동일 리포 내 `/admin` Route로 구현 권장
  - 혹은 `/admin`용 별도 App도 허용 (팀 구성에 따라 선택)
- Backend:
  - 모든 Admin API는 `/admin/api/...` 네임스페이스 사용
  - 공용 서비스 코드 재사용

---

## 7. 우선순위 정리 (P0 / P1)

**P0 (지금 반드시 구현 기준)**

- Users & Plans (기본 버전)
- Jobs & Queues
- Agents Status (요약 버전)
- Logs & Errors (간단 필터)
- Data Lab (크롤러/데이터셋/인덱스 기본 뷰)
- Templates & Prompts (기본 승인/비승인)
- Feature Flags
- System Health (Alive/Down 수준)

**P1 이후**

- Admin Dashboard(차트)
- Integrations
- Billing/Subscription 세부 관리
- Role/Permission 세분화
- Experiment Console

---

(끝)
