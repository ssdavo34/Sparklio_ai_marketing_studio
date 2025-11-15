# B팀 Phase 2 작업 계획서

**작성일**: 2025-11-15
**작성자**: B팀 (Backend Team)
**상태**: 준비 중

---

## 📋 현재 상황

### ✅ Phase 1 완료 (2025-11-15)
- Database Models (8개)
- JWT Authentication
- CRUD APIs (Users, Brands, Projects, Assets)
- Database Migration
- Backend 서버 실행 (http://100.123.51.5:8000)

### 🔄 진행 중
- C팀 API 테스트 진행 중
- A팀 SmartRouter API 대기 중

---

## 🎯 Phase 2 목표: Core Agents (2-3주)

### 구현할 Agents (6개)

1. **BriefAgent** - 사용자 요구사항 → Brief 생성
2. **BrandAgent** - BrandKit 조회 및 브랜드 분석
3. **StrategistAgent** - Brief → 마케팅 전략 수립
4. **CopywriterAgent** - Brief → 카피 생성
5. **VisionGeneratorAgent** - Brief + Copy → 이미지 생성
6. **ReviewerAgent** - 생성물 품질 검토

---

## 📅 작업 단계별 계획

### Step 1: 준비 작업 (C팀 테스트 중 - 충돌 없음)

**기간**: 2025-11-15 ~ C팀 테스트 완료 시까지

#### 1.1 테스트 인프라 구축
**위치**: `backend/tests/`

**작업 목록**:
- [ ] pytest 설정 파일 작성 (pytest.ini, conftest.py)
- [ ] 테스트 데이터베이스 설정
- [ ] API 테스트 템플릿 작성
- [ ] Agent 테스트 템플릿 작성

**예상 소요**: 2-3시간

#### 1.2 Agent 구조 템플릿
**위치**: `backend/app/agents/`

**작업 목록**:
- [ ] BaseAgent 클래스 작성
- [ ] 6개 Agent 스켈레톤 코드 작성
- [ ] A2A 프로토콜 스키마 정의

**예상 소요**: 3-4시간

#### 1.3 Schema 확장
**위치**: `backend/app/schemas/`

**작업 목록**:
- [ ] AgentRequest, AgentResponse 스키마
- [ ] WorkflowRequest, WorkflowResponse 스키마
- [ ] A2A 프로토콜 스키마

**예상 소요**: 2-3시간

#### 1.4 문서 작성
**위치**: `docs/`

**작업 목록**:
- [ ] Agent 구현 가이드
- [ ] A2A 프로토콜 상세 문서
- [ ] Phase 2 일일 작업 계획서 템플릿

**예상 소요**: 2시간

**Step 1 총 예상 소요**: 1-2일

---

### Step 2: Core Agents 구현 (C팀 테스트 완료 후)

**기간**: C팀 테스트 완료 후 2-3주

#### 2.1 BriefAgent (우선순위 1)
**이유**: 모든 Agent의 시작점

**작업 목록**:
- [ ] 사용자 입력 파싱
- [ ] Brief 템플릿 생성
- [ ] Ollama 연동 (자연어 → 구조화된 Brief)
- [ ] DB 저장 (projects.brief 필드)
- [ ] API 엔드포인트: POST /api/v1/agents/brief
- [ ] 단위 테스트

**예상 소요**: 2-3일

#### 2.2 BrandAgent (우선순위 2)
**이유**: Brief와 함께 전략 수립에 필요

**작업 목록**:
- [ ] BrandKit 조회 (DB)
- [ ] 브랜드 분석 로직
- [ ] Ollama 연동 (브랜드 특성 추출)
- [ ] API 엔드포인트: GET /api/v1/agents/brand/{brand_id}
- [ ] 단위 테스트

**예상 소요**: 2일

#### 2.3 StrategistAgent (우선순위 3)
**이유**: Brief + Brand → 전략 수립

**작업 목록**:
- [ ] Brief 분석 로직
- [ ] 타겟 오디언스 분석
- [ ] 채널 추천 로직
- [ ] Ollama 연동 (qwen2.5:14b 사용)
- [ ] API 엔드포인트: POST /api/v1/agents/strategist
- [ ] 단위 테스트

**예상 소요**: 3-4일

#### 2.4 CopywriterAgent (우선순위 4)
**작업 목록**:
- [ ] Brief + Strategy → 카피 생성
- [ ] 톤 매칭 로직
- [ ] 길이 조절 로직
- [ ] Ollama 연동
- [ ] API 엔드포인트: POST /api/v1/agents/copywriter
- [ ] 단위 테스트

**예상 소요**: 3-4일

#### 2.5 VisionGeneratorAgent (우선순위 5)
**작업 목록**:
- [ ] Brief + Copy → 이미지 프롬프트 생성
- [ ] ComfyUI 워크플로우 생성
- [ ] ComfyUI API 호출
- [ ] MinIO 업로드
- [ ] DB 저장 (generated_assets)
- [ ] API 엔드포인트: POST /api/v1/agents/vision
- [ ] 단위 테스트

**예상 소요**: 4-5일

#### 2.6 ReviewerAgent (우선순위 6)
**작업 목록**:
- [ ] 생성물 품질 평가 로직
- [ ] Brief 일치도 확인
- [ ] 피드백 생성
- [ ] Ollama 연동
- [ ] API 엔드포인트: POST /api/v1/agents/reviewer
- [ ] 단위 테스트

**예상 소요**: 2-3일

**Step 2 총 예상 소요**: 16-21일 (2-3주)

---

### Step 3: 통합 및 테스트

**작업 목록**:
- [ ] Agent 간 연동 테스트
- [ ] End-to-End 테스트
- [ ] 성능 테스트 (레이턴시, 동시 실행)
- [ ] API 문서 업데이트 (Swagger)
- [ ] C팀에게 새 API 공유

**예상 소요**: 2-3일

---

## 🔧 기술 스택

### LLM (Ollama)
- **qwen2.5:7b** - 빠른 응답용 (Brief, Brand, Reviewer)
- **qwen2.5:14b** - 고품질 생성용 (Strategist, Copywriter)

### 이미지 생성 (ComfyUI)
- Desktop GPU Worker (100.120.180.42:8188)
- A팀 통합 레이어 사용

### Database
- PostgreSQL (100.123.51.5:5432)
- JSONB 필드 활용 (agent_logs, workflow_nodes)

### Storage
- MinIO (100.123.51.5:9000)
- 이미지 자동 업로드 및 Presigned URL 생성

---

## 📝 개발 규칙

### Git 워크플로우
1. **브랜치**: `feature/phase2-agents`
2. **커밋 주기**: 각 Agent 완료 시마다
3. **Pull Request**: 3개 Agent 완료 시마다

### 테스트 규칙
- 모든 Agent는 **반드시** 단위 테스트 작성
- 테스트 커버리지 > 80%
- Mock을 사용한 Ollama/ComfyUI 테스트

### 코드 리뷰
- 각 Agent 구현 완료 후 팀 내 리뷰
- Lint (Black, Flake8) 통과 필수

---

## 🚨 리스크 및 대응

### 리스크 1: Ollama 응답 지연
**대응**:
- 타임아웃 설정 (30초)
- 재시도 로직 (3회)
- 경량 모델 (qwen2.5:7b) 우선 사용

### 리스크 2: ComfyUI 안정성
**대응**:
- A팀 통합 레이어 사용
- 에러 핸들링 철저히
- Fallback: 텍스트 프롬프트만 저장

### 리스크 3: C팀 작업과 충돌
**대응**:
- Step 1 작업은 기존 API 영향 없음
- Step 2 작업 전 C팀에 공지
- 새 엔드포인트는 `/api/v1/agents/` 네임스페이스 사용

---

## 📊 진척도 추적

### 일일 작업 계획서
- 위치: `backend/daily_logs/YYYY-MM-DD.md`
- 매일 작업 시작 전 작성
- 매일 작업 종료 시 업데이트

### 마일스톤
| 날짜 | 마일스톤 | 완료 |
|------|----------|------|
| 2025-11-15 | Step 1 시작 | [ ] |
| 2025-11-17 | Step 1 완료 (예상) | [ ] |
| C팀 테스트 완료 | Step 2 시작 | [ ] |
| +1주 | Agent 3개 완료 | [ ] |
| +2주 | Agent 6개 완료 | [ ] |
| +3주 | 통합 테스트 완료 | [ ] |

---

## ✅ Phase 2 완료 기준

- [ ] 6개 Core Agents 모두 구현 완료
- [ ] 각 Agent 단위 테스트 통과
- [ ] End-to-End 테스트 통과 (Brief → 이미지 생성)
- [ ] API 문서 업데이트 (Swagger)
- [ ] C팀에게 새 API 전달
- [ ] Git 커밋 및 Push 완료

---

**작성 완료**: 2025-11-15
**다음 업데이트**: Step 1 완료 시
