# 다음 작업 계획서 (Next Tasks)

> **작성일**: 2025-11-14 (목요일)
> **상태**: Team A 작업 진행 중 (3/8 완료)

---

## 📋 작업 현황 요약

### ✅ 완료된 작업 (3/8)

1. **BRAND_KIT_SPEC.md 작성 완료**
   - 브랜드 키트 시스템 전체 스펙
   - 색상, 폰트, 로고, 톤앤매너 관리
   - 브랜드 토큰 시스템

2. **RAG_SYSTEM_SPEC.md 작성 완료**
   - RAG 파이프라인 아키텍처
   - 벡터 검색 및 재랭킹 전략
   - 브랜드 맞춤 검색 시스템

3. **ONE_PAGE_EDITOR_SPEC.md v1.1 통합 완료** ⭐ **대규모 업데이트**
   - Canva 2025 대비 차별화 포인트 비교표 추가
   - AI 이미지 편집 파이프라인 확장 (생성/스타일변경/Inpaint/Outpaint/배경제거/세트동기화)
   - 반응형 레이아웃 & 멀티포맷 변환 시스템 (Frame 기반, 앵커 좌표, Magic Switch 대응, DocumentSet 동기화, 접근성 WCAG 체크)
   - 브랜드 가드레일 & 권한 시스템 (브랜드 룰 엔진, 잠금 레이어, 역할 기반 권한, AI 가드레일 준수)
   - **추가된 분량**: 약 1,457줄

---

## 🔄 진행 중인 작업 (0/8)

현재 진행 중인 작업 없음.

---

## 📌 대기 중인 작업 (5/8)

### 우선순위 1: LLM 및 브랜드 학습 시스템

#### 4. **LLM_ROUTER_POLICY.md 확장** (P2-A3)
**목표**: LLM 라우터에 비용 추적 로직 추가

**추가할 내용**:
- 모델별 비용 계산 (input/output 토큰 단가)
- 브랜드별 월간 비용 추적 및 알림
- 비용 최적화 전략 (캐싱, 모델 다운그레이드)
- 비용 리포트 생성 로직

**예상 작업 시간**: 2-3시간

**참고 문서**:
- 기존 LLM_ROUTER_POLICY.md
- P2-A3 요구사항

---

#### 5. **BRAND_LEARNING_ENGINE.md 업데이트** (P2-A1)
**목표**: 브랜드 학습 엔진에 재학습 트리거 추가

**추가할 내용**:
- 재학습 트리거 조건 정의 (새 콘텐츠 N개 누적, 성과 데이터 변화, 사용자 피드백)
- 증분 학습 (Incremental Learning) vs 전체 재학습 전략
- 재학습 스케줄링 및 자동화
- 학습 데이터 버전 관리

**예상 작업 시간**: 3-4시간

**참고 문서**:
- 기존 BRAND_LEARNING_ENGINE.md
- P2-A1 요구사항

---

### 우선순위 2: 발행 및 자동화 시스템

#### 6. **PUBLISHER_SPEC.md 생성**
**목표**: 멀티채널 발행 시스템 스펙 작성

**포함할 내용**:
- 발행 채널 정의 (SNS, 블로그, 이메일, 상세페이지 등)
- 채널별 포맷 변환 로직 (ONE_PAGE_EDITOR와 연동)
- 발행 스케줄링 및 예약 발행
- 발행 승인 워크플로우 (권한 시스템 연동)
- 발행 후 성과 추적 (조회수, 클릭수, 전환율)
- 롤백 및 버전 관리

**예상 작업 시간**: 4-5시간

**연관 문서**:
- ONE_PAGE_EDITOR_SPEC.md (멀티포맷 변환)
- BRAND_KIT_SPEC.md (브랜드 일관성)

---

#### 7. **SNS_AUTOMATION_SPEC.md 생성**
**목표**: SNS 마케팅 자동화 시스템 스펙 작성

**포함할 내용**:
- SNS 플랫폼 연동 (Instagram, Facebook, LinkedIn, Twitter/X)
- 자동 포스팅 스케줄러
- 해시태그 자동 생성 및 추천
- 댓글 자동 응답 (AI 기반)
- 성과 분석 및 최적 포스팅 시간 추천
- A/B 테스트 자동화 (여러 버전 동시 발행 및 성과 비교)

**예상 작업 시간**: 4-5시간

**연관 문서**:
- PUBLISHER_SPEC.md
- ONE_PAGE_EDITOR_SPEC.md (SNS 세트 생성)

---

### 우선순위 3: 인프라 및 아키텍처

#### 8. **TECH_DECISION_v1.md 확장** (P2-A2)
**목표**: Multi-Node 인프라 세부사항 추가

**추가할 내용**:
- Multi-Node 아키텍처 다이어그램
- 노드 간 통신 프로토콜 (gRPC, Message Queue)
- 로드 밸런싱 전략 (라운드 로빈, 최소 부하, 지역 기반)
- 장애 복구 (Failover, Health Check)
- 수평 확장 (Auto Scaling) 정책
- 데이터 일관성 보장 (분산 트랜잭션, Eventual Consistency)

**예상 작업 시간**: 3-4시간

**참고 문서**:
- 기존 TECH_DECISION_v1.md
- P2-A2 요구사항

---

## 🎯 다음 세션 작업 추천 순서

### 세션 1 (4-5시간): LLM 및 브랜드 학습
1. LLM_ROUTER_POLICY.md 확장 (비용 추적)
2. BRAND_LEARNING_ENGINE.md 업데이트 (재학습 트리거)

### 세션 2 (4-5시간): 발행 시스템
3. PUBLISHER_SPEC.md 생성

### 세션 3 (4-5시간): 자동화 및 인프라
4. SNS_AUTOMATION_SPEC.md 생성
5. TECH_DECISION_v1.md 확장

---

## 📝 참고사항

### 문서 작성 원칙 (중요!)
- **모든 문서는 한글로 작성** (사용자 명시 요구사항)
- TypeScript 인터페이스 및 코드 예시 포함
- 실제 사용 시나리오 및 예시 제공
- 다른 문서와의 통합 포인트 명시

### 완료된 문서 위치
```
K:\sparklio_ai_marketing_studio\docs\PHASE0\
├── ONE_PAGE_EDITOR_SPEC.md (v1.1) ✅
├── BRAND_KIT_SPEC.md ✅
├── RAG_SYSTEM_SPEC.md ✅
├── BRAND_LEARNING_ENGINE.md (업데이트 필요)
├── LLM_ROUTER_POLICY.md (확장 필요)
└── TECH_DECISION_v1.md (확장 필요)
```

### 생성해야 할 문서
```
K:\sparklio_ai_marketing_studio\docs\PHASE0\
├── PUBLISHER_SPEC.md (신규)
└── SNS_AUTOMATION_SPEC.md (신규)
```

---

## ✨ 최근 주요 성과

### ONE_PAGE_EDITOR_SPEC.md v1.1 업데이트 하이라이트

1. **Canva 2025 경쟁 분석**
   - 8개 항목 비교표 작성
   - Sparklio의 차별화 포인트 명확화

2. **AI 이미지 편집 파이프라인**
   - 7개 하위 시스템 설계
   - Inpaint/Outpaint/배경제거 등 고급 편집 기능

3. **반응형 레이아웃 시스템**
   - Frame 기반 아키텍처
   - 앵커 포인트 & 상대 좌표 시스템
   - Magic Switch 대응 자동 변환

4. **브랜드 가드레일**
   - 브랜드 룰 엔진 (실시간 검사)
   - 잠금 레이어 시스템
   - 역할 기반 권한 관리
   - AI 에이전트 가드레일 준수

**총 추가된 분량**: 약 1,457줄의 상세한 스펙 문서

---

## 🚀 예상 완료 일정

- **세션 1 (LLM & 브랜드 학습)**: 다음 작업 세션
- **세션 2 (발행 시스템)**: 세션 1 완료 후
- **세션 3 (자동화 & 인프라)**: 세션 2 완료 후

**전체 완료 예상**: 3-4개 작업 세션 (총 12-15시간)

---

**작성자**: Claude (Sparklio AI Marketing Studio Team)
**다음 업데이트**: 다음 작업 세션 시작 시
