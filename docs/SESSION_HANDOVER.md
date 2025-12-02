# 세션 인수인계 (2025-12-02 14:40 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `088c3b2` - fix: 컨셉 Canvas 렌더링 타이밍 개선
- **Mac Mini 배포**: ⏳ 동기화 필요
- **서버 상태**: ✅ healthy (Frontend 3001, Backend 8000)

---

## 오늘 완료한 작업 (2025-12-02)

### C팀 - 컨셉 Canvas 렌더링 및 영속화 구현 ✅

#### Phase 4: 컨셉 Canvas 렌더링

1. **useGeneratedAssetsStore 확장**
   - `conceptsV1: ConceptV1[] | null` 추가 (영속 저장)
   - `selectedConceptId: string | null` 추가
   - `setConceptsV1()`, `setSelectedConceptId()` 액션 추가
   - persist partialize에 추가하여 페이지 이동 시에도 유지

2. **conceptTemplate.ts 신규 생성**
   - ConceptV1 → Polotno Canvas 변환 템플릿
   - 각 컨셉이 별도 페이지로 생성
   - 컨셉 카드 레이아웃 (이름, 핵심 약속, 인사이트, 타겟, 톤, 컬러 팔레트)
   - SVG 인코딩 수정 (btoa → encodeURIComponent)

3. **ConceptBoardTab 개선**
   - 컨셉 생성 시 Store에 영속 저장
   - Canvas 타입을 'concept'로 전환
   - PolotnoWorkspace가 Store 생성 후 폴링 방식으로 렌더링
   - Store 직접 생성 대신 PolotnoWorkspace에 위임

4. **CollapsiblePagesPanel 개선**
   - 컨셉 페이지일 때 컨셉 이름 및 뱃지 표시
   - 페이지 선택 시 `setSelectedConceptId()` 동기화
   - `canvases` Map 구독으로 변경 감지 개선
   - Store 재시도 로직 추가

5. **useCanvasStore 확장**
   - `setActiveCanvasType` 액션 추가 (alias for setActiveCanvas)

---

## 🟢 완료된 기능

### 메뉴 ↔ 캔버스 연동
| 기능 | 상태 | 비고 |
|------|------|------|
| 메뉴 선택 → Canvas 타입 자동 전환 | ✅ | useLeftPanelStore |
| Pages 패널 멀티캔버스 지원 | ✅ | getCanvasStore(activeCanvasType) |
| ConceptBoard 컨셉 생성 | ✅ | 3개 컨셉 AI 생성 |
| **컨셉 → Canvas 렌더링** | ✅ | conceptTemplate.ts |
| **컨셉 영속화 (페이지 이동 시 유지)** | ✅ | useGeneratedAssetsStore |
| **Pages 패널 컨셉 선택/전환** | ✅ | selectedConceptId 동기화 |
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

## 🟡 진행 중인 작업

### P0 (Critical)
1. **컨셉 Canvas 렌더링 확인** - 실제 테스트 필요
   - ConceptBoardTab에서 컨셉 생성 → Canvas에 3페이지 표시 확인
   - Pages 패널에서 3개 페이지 표시 및 선택 동작 확인

2. **Brand DNA + 캠페인 목표 실제 연동** - 현재 Mock 데이터 사용 중
   - `useConceptGenerate` 훅의 `useMock: true` → `false`로 전환 필요
   - API 연동 시 Brand DNA 컨텍스트 실제 전달

3. **Chat에서 컨셉 생성 기능 추가** - 채팅창에서 직접 컨셉 생성

---

## 🔴 현재 알려진 문제

### 1. Deprecated Warning
- `[PolotnoMultiCanvas] getPolotnoStore is deprecated. Use getCanvasStore(type)`
- PresentationTab 등에서 아직 `getPolotnoStore()` 사용 중 → 마이그레이션 필요

### 2. Fast Refresh Runtime Error
- 컴파일 후 간헐적으로 발생하지만 full reload로 복구됨

### 3. 캔버스 스크롤 문제 (보고됨)
- 컨셉 캔버스 하단이 안보이고 스크롤도 안되는 문제 보고됨
- PolotnoWorkspace 또는 Layout 문제일 수 있음

---

## 다음 작업 우선순위

### P0 (Critical)
1. **컨셉 Canvas 렌더링 테스트** - 실제 동작 확인
2. **Brand DNA + 캠페인 목표 실제 연동** (Mock → Real API)
3. **Chat에서 컨셉 생성 기능 추가**

### P1 (High)
4. 캔버스 스크롤 문제 확인 및 수정
5. VEO3 테스트 - 이미지 → 동영상 변환 테스트
6. PresentationTab getPolotnoStore 마이그레이션
7. SNSTab 생성된 데이터 표시 (DetailTab과 유사하게)

### P2 (Medium)
8. 각 채널별 Canvas에 생성된 콘텐츠 렌더링
9. NanoBanana 이미지 생성 확인

---

## 주요 파일 위치

### 오늘 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `frontend/lib/canvas/conceptTemplate.ts` | ConceptV1 → Polotno 변환, SVG 인코딩 수정 |
| `frontend/components/canvas-studio/stores/useGeneratedAssetsStore.ts` | conceptsV1, selectedConceptId 추가 |
| `frontend/components/canvas-studio/stores/useCanvasStore.ts` | setActiveCanvasType 액션 추가 |
| `frontend/components/canvas-studio/panels/left/tabs/ConceptBoardTab.tsx` | Canvas 렌더링 폴링 방식, Store 연동 |
| `frontend/components/canvas-studio/panels/left/CollapsiblePagesPanel.tsx` | canvases 구독, 재시도 로직 |

### 관련 Store/Hook
| 파일 | 용도 |
|------|------|
| `stores/useCanvasStore.ts` | 캔버스 상태 관리 (멀티 캔버스) |
| `stores/useLeftPanelStore.ts` | 탭 → 캔버스 매핑 |
| `stores/useGeneratedAssetsStore.ts` | 생성된 에셋 관리 (conceptsV1 포함) |
| `hooks/useConceptGenerate.ts` | 컨셉 생성 훅 (Mock 모드) |
| `polotno/polotnoStoreSingleton.ts` | 멀티캔버스 매니저 |
| `polotno/PolotnoWorkspace.tsx` | 실제 Canvas 렌더링 컴포넌트 |

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

**마지막 업데이트**: 2025-12-02 14:40 by C팀
