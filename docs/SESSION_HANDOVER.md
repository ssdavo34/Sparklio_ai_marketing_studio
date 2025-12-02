# 세션 인수인계 (2025-12-02 12:10 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `22b2801` - feat: ConceptBoard 컨셉 생성 UI 및 채널 연동 개선
- **Mac Mini 배포**: ⏳ 동기화 필요
- **서버 상태**: ✅ healthy (Frontend 3001, Backend 8000)

---

## 오늘 완료한 작업 (2025-12-02)

### C팀 - 채팅-메뉴 연동 시스템 구현 ✅

#### Phase 1: Pages ↔ Canvas 연동
1. **CollapsiblePagesPanel 멀티캔버스 지원**
   - `getPolotnoStore()` → `getCanvasStore(activeCanvasType)` 변경
   - 캔버스 타입 변경 시 썸네일 자동 리셋
   - 캔버스 타입 배지 표시 (헤더에 표시)

2. **Navigation 개선**
   - Studio 메뉴 → `/studio/v3` 직접 연결
   - Admin 페이지에 INTERNAL_MODE 에디터 선택 섹션 추가

#### Phase 2: ConceptBoard 컨셉 생성 UI
1. **ConceptBoardTab 전면 개편** (v2.0)
   - 캠페인 목표 입력 → AI가 3개 컨셉 생성
   - `useConceptGenerate` 훅 활용 (Mock 모드)
   - Brand DNA 자동 연동 (BrandKitTab에서 전송된 데이터)
   - 생성된 컨셉 카드 UI (선택/확장 가능)
   - 컬러 팔레트 미리보기

2. **풀셋 생성 기능** (영상 제외)
   - 슬라이드, 상세페이지, SNS 동시 생성
   - 개별 채널 버튼 (로딩 상태 표시)
   - Video6는 별도 관리 (터치하지 않음)

#### Phase 3: 채널 페이지 연동
1. **DetailTab 전면 개편** (v2.0)
   - 생성된 상세페이지 섹션별 표시
   - 섹션 타입별 컬러 라벨 (hero, solution, benefits 등)
   - 컨셉 기반 생성 및 직접 생성 지원
   - Canvas에서 편집 버튼

---

## 🟢 완료된 기능

### 메뉴 ↔ 캔버스 연동
| 기능 | 상태 | 비고 |
|------|------|------|
| 메뉴 선택 → Canvas 타입 자동 전환 | ✅ | useLeftPanelStore |
| Pages 패널 멀티캔버스 지원 | ✅ | getCanvasStore(activeCanvasType) |
| ConceptBoard 컨셉 생성 | ✅ | 3개 컨셉 AI 생성 |
| 풀셋 생성 (영상 제외) | ✅ | 슬라이드+상세페이지+SNS |
| DetailTab 개편 | ✅ | 생성된 데이터 표시 |

### Video6 Pipeline (이전 세션)
| 기능 | 상태 |
|------|------|
| 스크립트 생성 (GPT-4o) | ✅ |
| 이미지 생성 (ComfyUI) | ✅ |
| TTS 생성 (EdgeTTS) | ✅ |
| BGM 믹싱 | ✅ |
| 영상 렌더링 | ✅ |

---

## 🔴 현재 알려진 문제

### 1. Deprecated Warning
- `[PolotnoMultiCanvas] getPolotnoStore is deprecated. Use getCanvasStore(type)`
- PresentationTab 등에서 아직 `getPolotnoStore()` 사용 중 → 마이그레이션 필요

### 2. Fast Refresh Runtime Error
- 컴파일 후 간헐적으로 발생하지만 full reload로 복구됨

---

## 다음 작업 우선순위

### P0 (Critical)
1. **VEO3 테스트** - 이미지 → 동영상 변환 테스트
2. **PresentationTab getPolotnoStore 마이그레이션**

### P1 (High)
3. SNSTab 생성된 데이터 표시 (DetailTab과 유사하게)
4. 각 채널별 Canvas에 생성된 콘텐츠 렌더링

### P2 (Medium)
5. NanoBanana 이미지 생성 확인
6. 프로젝트 DB와 Asset 연결

---

## 주요 파일 위치

### 오늘 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `frontend/components/Layout/Navigation.tsx` | Studio → /studio/v3 |
| `frontend/app/admin/page.tsx` | INTERNAL_MODE 에디터 선택 |
| `frontend/components/canvas-studio/panels/left/CollapsiblePagesPanel.tsx` | 멀티캔버스 지원 |
| `frontend/components/canvas-studio/panels/left/tabs/ConceptBoardTab.tsx` | 컨셉 생성 UI v2.0 |
| `frontend/components/canvas-studio/panels/left/tabs/DetailTab.tsx` | 상세페이지 UI v2.0 |

### 관련 Store/Hook
| 파일 | 용도 |
|------|------|
| `stores/useCanvasStore.ts` | 캔버스 상태 관리 |
| `stores/useLeftPanelStore.ts` | 탭 → 캔버스 매핑 |
| `stores/useGeneratedAssetsStore.ts` | 생성된 에셋 관리 |
| `hooks/useConceptGenerate.ts` | 컨셉 생성 훅 |
| `polotno/polotnoStoreSingleton.ts` | 멀티캔버스 매니저 |

---

## 중요: Video6는 건들지 마세요!

> "아 영상은 건들이지 말고 하자. 또 작업하다가 잘 되던 것도 안되면 안되니까"

Video6 관련 파일들은 이미 잘 작동하고 있으므로 수정하지 않습니다.

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"

# Backend 재시작
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 헬스체크
curl http://100.123.51.5:8000/health
```

---

**마지막 업데이트**: 2025-12-02 12:10 by C팀
