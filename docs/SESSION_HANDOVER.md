# 세션 인수인계 (2025-12-01 21:00 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `08a8561` - Polotno element compatibility - rect to svg conversion
- **Mac Mini 배포**: ⏳ 동기화 필요
- **서버 상태**: ✅ healthy

---

## 오늘 완료한 작업 (2025-12-01)

### B팀 - Presentation Agent V2 고도화

1. **LLM 프롬프트 개선** (`backend/app/services/agents/presentation.py`)
   - 제목 10자 이내, 불릿 15자 이내 규칙 추가
   - 5종 레이아웃 템플릿 정의 (title_center, two_column, three_bullets, full_image, stats)
   - 슬라이드별 레이아웃 매핑 가이드 추가

2. **API 응답 개선** (`backend/app/api/v1/endpoints/presentations.py`)
   - `visual_hint` 필드 추가 (Unsplash 이미지 검색용)
   - `design_guidelines` 필드 추가 (primary_color, secondary_color, font_style)
   - 레이아웃 정규화 로직 (기존 레이아웃 → 5종 템플릿 매핑)

### C팀 - Presentation Canvas 통합

1. **Polotno 요소 호환성 수정** (`frontend/lib/canvas/slidesTemplate.ts`)
   - **문제**: Polotno는 `type: 'rect'`를 직접 지원하지 않음
   - **해결**: `createRectSvg()` 헬퍼 함수로 모든 rect → svg 변환
   - 배경, 구분선, 카드박스, 원형 아이콘 등 모두 SVG로 변환

2. **상세 에러 로깅 추가** (`frontend/lib/canvas/slidesTemplate.ts:603-666`)
   - 각 슬라이드/요소 추가 시 콘솔 로그
   - 에러 발생 시 어느 요소에서 실패했는지 추적 가능

3. **PresentationTab 개선** (`frontend/components/canvas-studio/panels/left/tabs/PresentationTab.tsx`)
   - 페이지 삭제 로직 개선 (remove/delete 호환)
   - 단계별 콘솔 로깅 추가
   - 에러 시 토스트 메시지 표시

---

## 🔴 현재 알려진 문제 (BLOCKING)

### Presentation 12장 생성 ✅, 그러나 Canvas 연동 ❌

**현상:**
- 프레젠테이션 생성 API 호출 성공 (12장 슬라이드 반환)
- Pages 패널에 12개 페이지 썸네일 안 보임 (1개만 표시)
- 슬라이드 내 스크롤 발생 (페이지에 맞지 않음)
- Canvas에서 요소 편집 불가 (Polotno 연동 안됨)
- Chat ↔ Canvas 연결 안됨

**추정 원인:**
1. `getPolotnoStore()` deprecated 경고 → `getCanvasStore(type)` 사용 필요
2. Polotno Workspace size 0 경고 → 레이아웃/렌더링 문제
3. `addSlidesToCanvas` 호출 후 `[SlidesTemplate] ✅ Successfully added` 로그 안 나옴

**디버깅 로그 위치:**
- 콘솔에서 `[PresentationTab]`, `[SlidesTemplate]` 로그 확인
- 어느 단계에서 실패하는지 추적 가능

---

## 다음 작업 우선순위

### P0 (Critical) - Presentation Canvas 연동 수정
1. `getPolotnoStore()` → `getCanvasStore('presentation')` 마이그레이션
2. Polotno Workspace 크기 문제 해결
3. Pages 패널에 12개 썸네일 표시
4. 슬라이드 요소 편집 가능하게

### P1 (High)
5. Chat ↔ Canvas 연결
6. 슬라이드 내 스크롤 제거 (페이지에 맞게)

### P2 (Medium)
7. Unsplash 이미지 자동 삽입 (visual_hint 활용)
8. 디자인 가이드라인 적용 (design_guidelines 활용)

---

## 주요 파일 위치

| 파일 | 용도 |
|------|------|
| `frontend/lib/canvas/slidesTemplate.ts` | 슬라이드 → Polotno 변환 |
| `frontend/components/canvas-studio/panels/left/tabs/PresentationTab.tsx` | 프레젠테이션 생성 UI |
| `frontend/components/canvas-studio/polotno/polotnoStoreSingleton.ts` | Polotno Store 관리 |
| `backend/app/services/agents/presentation.py` | PresentationAgent (LLM) |
| `backend/app/api/v1/endpoints/presentations.py` | /generate API |

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"

# 헬스체크
curl http://100.123.51.5:8000/health
```

---

**마지막 업데이트**: 2025-12-01 21:00 by C팀/B팀
