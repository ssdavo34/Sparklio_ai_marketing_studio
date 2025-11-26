# [Team C] 익일 작업 계획서 - Frontend Editor Migration

**작성 날짜**: 2025-11-26 (수요일)
**작성 시간**: 18:40
**작성자**: Team C (Claude Code - Opus 4.5)
**계획 대상**: 2025-11-27 (목요일)
**브랜치**: feature/editor-migration-polotno

---

## ✅ 오늘 완료한 작업 (3줄 요약)

1. **Pages 탭 실제 썸네일 캡처 기능 구현** - Polotno `toDataURL()` 활용, 자동 업데이트 로직 포함
2. **이전 세션 작업 연속성 유지** - ConceptBoard 자동 전환, 첫 컨셉 자동 선택, 비주얼 프리뷰 카드
3. **이슈 발견** - Pages 탭에서 ConceptBoard 뷰인데 "콘텐츠가 없습니다" 표시되는 문제

---

## 📋 내일 작업 목록 (우선순위 순)

### 🔴 우선순위 1 (긴급 - 핵심 버그) - 예상 2시간

#### 1-1. Chat → ConceptBoard 데이터 흐름 완전 수정

**문제**: Chat에서 생성된 "아이패드 m4" 데이터가 ConceptBoard에 반영되지 않고, 전혀 다른 내용("시간 절약 강조" 등) 표시됨

**원인 분석**:
- ChatPanel에서 LLM 응답을 `useCenterViewStore.setConceptBoardData()`로 저장
- PagesTab에서 `useGeneratedAssetsStore.conceptBoardData`를 읽음
- **서로 다른 Store 사용!**

**해결 방안**:
- PagesTab.tsx에서 `useCenterViewStore.conceptBoardData`를 읽도록 수정
- 또는 ChatPanel에서 양쪽 Store에 모두 저장

**확인 파일**:
- `ChatPanel.tsx` 라인 446: `useCenterViewStore.getState().setConceptBoardData(converted)`
- `PagesTab.tsx` 라인 27: `useGeneratedAssetsStore.conceptBoardData`

**예상 소요**: 1시간

#### 1-2. ConceptBoard 뷰 구조 변경

**문제**: 중앙 캔버스에 3개 컨셉 카드가 모두 표시됨

**올바른 구조**:
- 좌측 Pages 탭: 3개 컨셉 목록 (썸네일/카드)
- 중앙 캔버스: 선택된 1개 컨셉만 상세 표시

**해결 방안**:
- ConceptBoardView.tsx를 "선택된 컨셉 상세 뷰"로 변경
- 또는 새로운 ConceptDetailView 컴포넌트 생성

**확인 파일**: `ConceptBoardView.tsx`

**예상 소요**: 1시간

---

### 🟡 우선순위 2 (중요) - 예상 1.5시간

#### 2-1. 컨셉 차별화 검증 및 수정
- **목표**: 3개 컨셉이 서로 다른 헤드라인/서브헤드라인/CTA 가지도록 확인
- **확인 사항**:
  - 컨셉 1: "성능 강조" - 제품 특징 기반
  - 컨셉 2: "SNS 마케팅" - 소셜 미디어 헤드라인/키워드 기반
  - 컨셉 3: "감성 마케팅" - USP/감성적 접근
- **확인 파일**: `useGeneratedAssetsStore.ts` 라인 478-512
- **예상 소요**: 45분

#### 2-2. Pages 탭 썸네일 동작 검증
- **목표**: Canvas 뷰에서 실제 캔버스 캡처 이미지가 썸네일로 표시되는지 확인
- **테스트 시나리오**:
  1. Canvas 뷰로 전환
  2. Pages 탭에 로딩 스피너 → 썸네일 이미지 표시 확인
  3. 캔버스에서 도형/텍스트 추가 후 1.5초 대기
  4. 썸네일 자동 업데이트 확인
- **확인 파일**: `PagesTab.tsx` 라인 50-127, 454-513
- **예상 소요**: 45분

---

### 🟢 우선순위 3 (일반) - 예상 2시간

#### 3-1. ConceptBoard → Slides/Instagram/Shorts 생성 버튼 연동
- **목표**: 컨셉 카드의 "슬라이드", "인스타그램" 등 버튼 클릭 시 해당 콘텐츠 생성
- **확인 파일**: `ConceptBoardView.tsx`
- **예상 소요**: 1시간

#### 3-2. 생성된 콘텐츠 Pages 탭 연동
- **목표**: Slides/Instagram/Shorts 뷰에서도 Pages 탭에 해당 콘텐츠 목록 표시
- **확인 파일**: `PagesTab.tsx` 라인 72-122
- **예상 소요**: 1시간

---

## 🔗 의존성

| 의존 항목 | 상태 | 담당 |
|----------|------|------|
| Polotno Store 초기화 | ✅ 완료 | - |
| LLM API 연동 | ✅ 완료 | Backend |
| Zustand Store 구조 | ✅ 완료 | - |

---

## 📚 필요한 리소스

### 참고 문서
- `docs/WORK_REGULATIONS.md` - 작업 규정
- `docs/PHASE0/EDITOR_ENGINE_IMPLEMENTATION.md` - 에디터 구현 스펙

### 참고 코드
```
frontend/components/canvas-studio/
├── panels/left/tabs/PagesTab.tsx          # 페이지 목록 + 썸네일
├── components/ChatPanel.tsx               # LLM 연동 + 컨셉 생성
├── stores/useGeneratedAssetsStore.ts      # 생성 데이터 관리
├── stores/useCenterViewStore.ts           # 뷰 상태 관리
└── views/ConceptBoardView.tsx             # 컨셉 카드 UI
```

### 테스트 URL
- http://localhost:3000/studio/v3

---

## 🎯 작업 시작 체크리스트

다음 세션 시작 시 아래 순서로 진행:

```markdown
## 2025-11-27 (목요일) 작업 시작 체크리스트

- [ ] `npm run dev` 실행 (이미 실행 중이면 패스)
- [ ] http://localhost:3000/studio/v3 접속
- [ ] 브라우저 콘솔 열기 (F12)
- [ ] `localStorage.removeItem('GeneratedAssetsStore')` 실행
- [ ] 페이지 새로고침
- [ ] 콘솔에서 `[PagesTab]` 로그 확인
- [ ] Chat에서 테스트 프롬프트 입력하여 컨셉 생성
```

---

## 📝 특이사항

1. **개발 서버 상태**: Background로 `npm run dev` 실행 중 (bash_id: a36d63)
2. **스크린샷 분석 결과**: ConceptBoard 뷰는 정상 작동, Pages 탭 데이터 바인딩만 이슈
3. **코드 수정 완료 상태**: 모든 파일 수정은 완료, 동작 검증만 필요

---

**계획서 작성 완료**: 2025-11-26 (수요일) 18:40
