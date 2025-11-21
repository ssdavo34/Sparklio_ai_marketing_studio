# 📚 Backend 문서 구조 현황 보고서

**작성일**: 2025-11-20
**작성자**: B팀 (Backend)
**목적**: 현재 backend 폴더 내 문서 현황 정리

---

## 📂 문서 분류

### 1. 일일 보고서 (EOD Reports)
- `EOD_REPORT_2025-11-16.md`
- `EOD_REPORT_2025-11-16_Phase2-1.md`
- `EOD_REPORT_2025-11-17_P0_GENERATOR.md`
- `EOD_REPORT_2025-11-17_Phase2-2.md`
- `EOD_REPORT_2025-11-17_Phase2-3.md`
- `EOD_REPORT_2025-11-18.md`
- `EOD_REPORT_2025-11-19.md`
- `EOD_REPORT_2025-11-19_EVENING.md`
- `EOD_REPORT_2025-11-19_NIGHT.md`

### 2. B팀 작업 문서
- `B_TEAM_DAILY_REPORT_2025-11-15.md` - 일일 작업 보고
- `B_TEAM_WORK_PLAN_2025-11-18.md` - 작업 계획
- `B_TEAM_LLM_ROUTER_FIX_REPORT_2025-11-20.md` - LLM Router 버그 수정 보고

### 3. C팀 관련 문서
- `C_TEAM_COORDINATION_REQUEST_2025-11-19.md` - 협업 요청
- `C_TEAM_FEEDBACK_REVIEW_2025-11-19.md` - 피드백 검토
- `C_TEAM_INTEGRATION_REVIEW_2025-11-19.md` - 통합 검토
- `C_TEAM_TEXTBASELINE_FIX_REPORT_2025-11-18.md` - 텍스트 베이스라인 수정

### 4. 기술 사양 문서 (⚠️ 코드에서 참조 중)
- `GENERATORS_SPEC.md` - Generator 사양 (base.py, brand_kit.py 등에서 참조)
- `ONE_PAGE_EDITOR_SPEC.md` - Editor 사양 (generator 코드에서 참조)
- `AGENTS_SPEC.md` - Agents 사양
- `SYSTEM_ARCHITECTURE.md` - 시스템 아키텍처
- `LLM_PROVIDER_SPEC.md` - LLM Provider 사양

### 5. Phase별 문서
- `PHASE_1_API_V1.md` - Phase 1 API 문서
- `PHASE_1_P0_GENERATOR_PLAN.md` - P0 Generator 계획
- `PHASE_2-1_PLAN.md` - Phase 2-1 계획
- `PHASE_2-2_PLAN.md` - Phase 2-2 계획
- `PHASE_2-3_PLAN.md` - Phase 2-3 계획

### 6. 기타 가이드 문서
- `CELERY_SETUP_GUIDE.md` - Celery 설정 가이드
- `DEPLOYMENT_REQUEST_TO_A_TEAM.md` - A팀 배포 요청
- `README.md` - 프로젝트 README

### 7. 통합/연동 문서
- `LLM_CONNECTION_STATUS_2025-11-20.md` - LLM 연결 상태
- `PHASE_2_INTEGRATION_STATUS.md` - Phase 2 통합 상태
- `PHASE_3_INTEGRATION_STATUS.md` - Phase 3 통합 상태

### 8. 작업 계획/확장 문서
- `AGENT_EXPANSION_PLAN_2025-11-18.md` - Agent 확장 계획
- `P0_GENERATOR_STATUS_2025-11-17.md` - P0 Generator 상태
- `SPARKLIO_EDITOR_PLAN_v1.1.md` - Sparklio Editor 계획

---

## ⚠️ 중요 사항

1. **코드 의존성**: 많은 Python 파일들이 MD 문서를 직접 참조하고 있음
   - 특히 GENERATORS_SPEC.md, ONE_PAGE_EDITOR_SPEC.md
   - 이동 시 코드 수정 필요

2. **팀 간 협업**: 다른 팀(A팀, C팀)이 참조하는 문서들이 있음
   - 위치 변경 시 사전 공지 필요

3. **현재 위치 유지 권장**:
   - 코드와 문서의 긴밀한 연결
   - 개발 중 빠른 참조 필요
   - 버전 관리 용이성

---

## 💡 제안사항

1. **현재 구조 유지**: 코드 참조 및 팀 협업을 위해 현 위치 유지
2. **인덱스 파일 생성**: 문서 목록과 설명을 담은 INDEX.md 생성
3. **정기 정리**: 프로젝트 마일스톤 완료 후 일괄 정리
4. **명명 규칙 준수**: 날짜_팀_주제 형식 유지

---

## 📊 통계

- 총 MD 파일 수: 약 40개
- 일일 보고서: 9개
- 기술 사양 문서: 5개
- Phase 관련: 8개
- 팀 협업 문서: 7개

현재 backend 폴더의 MD 문서들은 **활발한 개발 과정을 반영**하고 있으며,
코드와의 긴밀한 연결로 인해 **현재 위치에서 관리하는 것이 적절**합니다.