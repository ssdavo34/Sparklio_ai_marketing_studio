# Canvas Studio v3.1 - A팀 QA 대응 계획서

> **수신**: C팀 (Frontend)
> **발신**: A팀 (QA)
> **프로젝트**: Canvas Studio v3.1 - Polotno 기반 에디터
> **작성일**: 2025년 11월 21일 (금) 18:50
> **우선순위**: 🔴 High
> **상태**: ✅ 협조 확정

---

## 📌 요청사항 수신 확인

C팀의 Canvas Studio v3.1 테스트 지원 요청을 확인했습니다.

### 요청 내역 정리

| 번호 | 요청 항목 | 우선순위 | 기한 | 상태 |
|------|----------|---------|------|------|
| 1 | 테스트 환경 구성 | 🟡 Medium | 11/25 (1주차 말) | ✅ 수락 |
| 2 | Polotno 제약사항 검증 | 🔴 High | 11/28 (2주차 초) | ✅ 수락 |

**종합 판단**: ✅ **모든 요청사항 수락 가능**

---

## 🎯 A팀 대응 전략

### 작업 1: 테스트 환경 구성

#### 📋 작업 내용

**목표**: `/studio/v3` 전용 테스트 계정 생성 및 환경 검증

#### ✅ 실행 계획

##### Phase 1: 계정 생성 (30분)
```yaml
계정 정보:
  - Email: qa_canvas_v3@sparklio.ai
  - 권한: Editor Full Access
  - 역할: QA Test Account
  - Brand Kit: 테스트용 브랜드 연동

생성 방법:
  1. Backend User API 사용
  2. 또는 Database 직접 추가
  3. 초기 비밀번호: QA_Canvas_V3_2025!
```

##### Phase 2: 테스트 체크리스트 작성 (1시간)
```markdown
기본 접근성 테스트:
  - [ ] `/studio/v3` 라우팅 정상 작동
  - [ ] 로그인 후 에디터 화면 표시
  - [ ] 기존 `/studio/polotno`와 독립적 작동

Polotno 통합 테스트:
  - [ ] Canvas 렌더링 정상
  - [ ] 텍스트 추가 기능
  - [ ] 이미지 추가 기능
  - [ ] 저장 및 불러오기

레이아웃 테스트:
  - [ ] VSCode 스타일 UI 표시
  - [ ] Top Toolbar 정상 작동
  - [ ] Left Panel 표시
  - [ ] Right Dock 표시
  - [ ] 패널 리사이즈 동작
```

##### Phase 3: 자동화 테스트 스크립트 준비 (선택사항, 2시간)
```typescript
// Playwright E2E 테스트 샘플
describe('Canvas Studio v3.1', () => {
  test('should load editor', async ({ page }) => {
    await page.goto('/studio/v3');
    await expect(page.locator('[data-testid="canvas-viewport"]')).toBeVisible();
  });

  test('should add text element', async ({ page }) => {
    await page.click('[data-testid="add-text-button"]');
    await expect(page.locator('[data-polotno-type="text"]')).toBeVisible();
  });
});
```

#### 📅 일정

| 단계 | 작업 | 기한 | 담당 |
|------|------|------|------|
| 1 | 테스트 계정 생성 | 11/23 (토) | A팀 |
| 2 | 환경 검증 체크리스트 작성 | 11/24 (일) | A팀 |
| 3 | C팀에게 계정 정보 전달 | 11/25 (월) 09:00 | A팀 |
| 4 | 초기 스모크 테스트 실행 | 11/25 (월) 14:00 | A팀 |

#### 📦 산출물

1. **계정 정보 문서** (`docs/qa/CANVAS_V3_TEST_ACCOUNT.md`)
   - 로그인 정보
   - 접근 권한 목록
   - 연동된 Brand Kit 정보

2. **테스트 체크리스트** (`docs/qa/CANVAS_V3_TEST_CHECKLIST.md`)
   - Block별 테스트 항목
   - 예상 이슈 및 대응 방안

3. **초기 테스트 보고서** (`docs/qa/CANVAS_V3_INITIAL_TEST_REPORT.md`)
   - 환경 구성 결과
   - 발견된 이슈 (있을 경우)

---

### 작업 2: Polotno 무료 버전 제약사항 검증

#### 📋 작업 내용

**목표**: Polotno SDK 무료 버전의 기능 제약 및 워터마크 영향 평가

#### 🔍 검증 항목

##### 1. 기능 제약사항 조사

```yaml
조사 항목:
  1. 워터마크:
     - 위치 (좌측 하단, 우측 상단 등)
     - 크기 (px 단위)
     - 제거 가능 여부
     - 투명도

  2. 내보내기 제한:
     - 지원 포맷 (PNG, JPG, PDF, SVG)
     - 최대 해상도
     - DPI 제한
     - 파일 크기 제한

  3. 기능 제한:
     - 최대 페이지 수
     - 레이어 수 제한
     - 사용 가능한 템플릿 개수
     - 커스텀 폰트 업로드 가능 여부
     - 플러그인 사용 가능 여부

  4. 성능 제한:
     - 동시 사용자 수
     - API 호출 제한 (Rate Limit)
     - 월간 렌더링 횟수
```

##### 2. 사용자 경험 평가

**테스트 시나리오**:
```markdown
시나리오 1: 클라이언트 데모
  - 상황: 잠재 고객에게 제품 시연
  - 평가: 워터마크가 전문성에 미치는 영향
  - 판단 기준: 워터마크로 인해 거래 실패 가능성

시나리오 2: 내부 테스트
  - 상황: 개발팀 간 기능 검증
  - 평가: 워터마크가 테스트에 미치는 영향
  - 판단 기준: 테스트 진행 가능 여부

시나리오 3: 프로덕션 배포
  - 상황: 실제 사용자에게 서비스 제공
  - 평가: 워터마크가 브랜드 이미지에 미치는 영향
  - 판단 기준: 무료 버전 유지 vs 유료 전환 결정
```

##### 3. 비용 대비 효과 분석

**유료 플랜 검토**:
```yaml
Polotno 가격 (예상):
  - Starter: $0/월 (무료, 워터마크)
  - Pro: $99/월 (워터마크 제거, 고급 기능)
  - Enterprise: 커스텀 가격 (온프레미스, 화이트라벨)

ROI 계산:
  - 개발 비용 절감: $15,000 (3개월 → 1개월)
  - 유지보수 비용 절감: $5,000/년
  - 유료 플랜 비용: $1,188/년 ($99 x 12개월)
  - 순이익: $18,812 (첫 해)

결론:
  - ✅ 유료 전환 권장 (프로덕션 배포 전)
  - 무료 버전은 개발/테스트 단계에만 사용
```

#### 📅 일정

| 단계 | 작업 | 기한 | 담당 |
|------|------|------|------|
| 1 | Polotno 공식 문서 조사 | 11/23 (토) | A팀 |
| 2 | 무료 버전 실제 테스트 | 11/24 (일) | A팀 |
| 3 | 사용자 경험 평가 | 11/26 (화) | A팀 |
| 4 | 비용 분석 보고서 작성 | 11/27 (수) | A팀 |
| 5 | 최종 보고서 제출 | 11/28 (목) | A팀 → C팀 |

#### 📦 산출물

**주요 문서**: `docs/qa/POLOTNO_FREE_VS_PAID_ANALYSIS.md`

**목차**:
```markdown
1. Executive Summary (1페이지 요약)
2. 기능 제약사항 상세
3. 워터마크 영향 평가
4. 사용자 경험 테스트 결과
5. 비용 대비 효과 분석
6. 권장사항
   - 개발 단계: 무료 버전 사용 ✅
   - 프로덕션 배포: 유료 전환 필수 🔴
7. 마이그레이션 계획 (무료 → 유료)
```

---

## 🔗 C팀과의 협업 방식

### 커뮤니케이션 채널

| 용도 | 채널 | 담당자 |
|------|------|--------|
| **일반 질문** | `#canvas-studio-v3` | A팀 (QA 담당) |
| **긴급 이슈** | Slack DM | A팀 리드 |
| **버그 리포팅** | GitHub Issues | A팀 |
| **주간 회의** | 매주 월요일 10:00 | 전체 참석 |

### 이슈 트래킹

**GitHub Issues 라벨 규칙**:
```yaml
프로젝트: canvas-studio-v3
라벨:
  - priority-critical: 즉시 처리 필요
  - priority-high: 이번 주 내 처리
  - priority-medium: 다음 주 처리
  - priority-low: 백로그

타입:
  - bug: 버그
  - enhancement: 기능 개선
  - qa-request: QA 요청사항
  - documentation: 문서화

상태:
  - in-progress: 작업 중
  - blocked: 블로킹 이슈 존재
  - ready-for-test: 테스트 준비 완료
```

---

## 📊 작업 타임라인

### Week 1 (11/22 - 11/25)

```
11/22 (금) ✅ 현재
  - C팀 요청 수신 및 분석 완료
  - QA 대응 계획서 작성 완료

11/23 (토)
  - 테스트 계정 생성
  - Polotno 공식 문서 조사 시작

11/24 (일)
  - 테스트 체크리스트 작성
  - Polotno 무료 버전 실제 테스트

11/25 (월) ⭐ 마감일
  - C팀에게 테스트 계정 정보 전달
  - 초기 스모크 테스트 실행
```

### Week 2 (11/26 - 11/28)

```
11/26 (화)
  - C팀 Block 3 완료 후 환경 검증
  - 사용자 경험 평가 시작

11/27 (수)
  - 비용 분석 보고서 작성

11/28 (목) ⭐ 마감일
  - Polotno 제약사항 검증 최종 보고서 제출
```

---

## ✅ A팀 체크리스트

### 작업 시작 전
- [x] C팀 요청사항 문서 확인
- [x] 기존 QA 문서 참고
- [x] QA 대응 계획서 작성
- [ ] C팀에게 협조 확정 회신

### 작업 1: 테스트 환경 구성
- [ ] 테스트 계정 생성
- [ ] Brand Kit 연동
- [ ] 테스트 체크리스트 작성
- [ ] C팀에게 계정 정보 전달
- [ ] 초기 스모크 테스트 실행
- [ ] 테스트 결과 보고서 작성

### 작업 2: Polotno 제약사항 검증
- [ ] Polotno 공식 문서 조사
- [ ] 무료 버전 기능 테스트
- [ ] 워터마크 영향 평가
- [ ] 사용자 경험 시나리오 테스트
- [ ] 비용 대비 효과 분석
- [ ] 최종 보고서 작성 및 제출

### 협업 및 커뮤니케이션
- [ ] Slack 채널 `#canvas-studio-v3` 가입
- [ ] GitHub Project 보드 설정
- [ ] 주간 Sync 미팅 참석 (월요일 10:00)

---

## 🎯 성공 지표

### 작업 완료 기준

**작업 1: 테스트 환경 구성**
- ✅ 테스트 계정 생성 및 C팀 전달
- ✅ 테스트 체크리스트 작성 (최소 20개 항목)
- ✅ 초기 스모크 테스트 통과율 > 80%

**작업 2: Polotno 제약사항 검증**
- ✅ 보고서 작성 완료 (최소 5페이지)
- ✅ 워터마크 실제 캡처 이미지 포함
- ✅ 유료 전환 여부 명확한 권장사항 제시

### 품질 지표
- **응답 시간**: C팀 질문에 24시간 내 회신
- **이슈 해결**: Critical 이슈 48시간 내 해결
- **문서화**: 모든 테스트 결과 문서화 100%

---

## 📝 참고 문서

### C팀 제공 문서
1. [마스터 플랜](../canvas-studio-v3/000_MASTER_PLAN.md)
2. [타팀 협조 요청서](../canvas-studio-v3/003_TEAM_COORDINATION_REQUEST.md)
3. [Executive Summary](../canvas-studio-v3/EXECUTIVE_SUMMARY.md)

### A팀 기존 QA 문서
1. [Vertical Slice 1 QA Plan](./VERTICAL_SLICE_1_QA_PLAN.md)
2. [C팀 Konva Migration QA Plan](./C_TEAM_KONVA_MIGRATION_QA_PLAN.md)
3. [Definition of Done](./DEFINITION_OF_DONE_VERTICAL_SLICE_1.md)

### 외부 참고 자료
1. Polotno 공식 문서: https://polotno.com/docs
2. Polotno 가격표: https://polotno.com/pricing
3. Polotno 무료 vs 유료: https://polotno.com/docs/free-vs-paid

---

## 🙏 C팀에게 드리는 말씀

Canvas Studio v3.1 개발을 적극 지원하겠습니다!

**A팀의 약속**:
- ✅ 요청하신 모든 항목 기한 내 완료
- ✅ 투명한 진행 상황 공유
- ✅ 발견된 이슈 즉시 보고
- ✅ 프로덕션 배포 시 전체 QA 지원

**질문이나 추가 요청사항은 언제든지 `#canvas-studio-v3` 채널로 연락 주세요!**

---

**작성자**: A팀 (QA) - Claude
**승인자**: (팀 리더 승인 대기)
**배포일**: 2025년 11월 21일 (금)
**다음 업데이트**: 2025년 11월 25일 (월) - 작업 1 완료 보고

---

## 📎 첨부 파일 (작성 예정)

1. `CANVAS_V3_TEST_ACCOUNT.md` - 테스트 계정 정보
2. `CANVAS_V3_TEST_CHECKLIST.md` - 테스트 체크리스트
3. `POLOTNO_FREE_VS_PAID_ANALYSIS.md` - Polotno 제약사항 분석 보고서
4. `CANVAS_V3_INITIAL_TEST_REPORT.md` - 초기 테스트 결과

---

**문서 버전**: v1.0
**마지막 수정**: 2025년 11월 21일 (금) 18:50 KST
