# 세션 인수인계 (2025-12-02 21:50 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `722ee99` - Brief 입력 UI 추가 및 API 실제 연동
- **Mac Mini 배포**: ✅ 동기화 완료
- **서버 상태**: ✅ healthy (Frontend 3001, Backend 8000)

---

## 오늘 완료한 작업 (2025-12-02)

### 오전/오후 세션 (C팀)
- 풀셋 생성 기능 완전 구현
- Brand DNA + Brief 생성 흐름 통합 (`buildSharedContext()`)
- PresentationTab, SNSTab에 생성 데이터 표시 UI 추가

### 저녁 세션 (전체 팀) ✅

#### 1. P0: 실제 API 연동 완료
- **ConceptBoardTab.tsx**: `useMock: true` → `useMock: false` 전환
- Mac Mini Backend ConceptAgent API 정상 작동 확인
- 실제 API 응답으로 3개 컨셉 생성 테스트 완료

#### 2. P0: 캔버스 스크롤 문제 수정
- **PolotnoWorkspace.tsx** 레이아웃 개선
  - 불필요한 nested `flex flex-col` 제거
  - `absolute inset-0` 중첩 레이어 단순화
  - `minHeight: 500px` → `400px` 조정

#### 3. P1: Brief 입력 UI 추가
- **BriefTab.tsx** 신규 생성 (355 lines)
  - 캠페인 목표, 타겟 오디언스, 핵심 인사이트 입력
  - 핵심 메시지, 채널 선택, KPI 관리
  - useBriefStore 연동
  - 유효성 검사 UI (완성도 표시)
- **ActivityBar.tsx**: Brief 아이콘(ClipboardList) 추가
- **LeftPanel.tsx**: BriefTab import 및 라우팅 추가
- **useLeftPanelStore.ts**: 'brief' 탭 타입 추가

#### 4. P1: getPolotnoStore 마이그레이션 (부분)
- **PresentationTab.tsx**: `getPolotnoStore()` → `getOrCreateCanvasStore('presentation', apiKey)` 변경
- 나머지 파일들은 deprecated 경고 상태로 유지 (기능 정상 작동)

---

## 🟢 완료된 기능

### 메뉴 ↔ 캔버스 연동
| 기능 | 상태 | 비고 |
|------|------|------|
| 메뉴 선택 → Canvas 타입 자동 전환 | ✅ | useLeftPanelStore |
| Pages 패널 멀티캔버스 지원 | ✅ | getCanvasStore(activeCanvasType) |
| ConceptBoard 컨셉 생성 | ✅ | **실제 API 연동 완료** |
| 컨셉 → Canvas 렌더링 | ✅ | conceptTemplate.ts |
| 컨셉 영속화 (페이지 이동 시 유지) | ✅ | useGeneratedAssetsStore |
| Pages 패널 컨셉 선택/전환 | ✅ | selectedConceptId 동기화 |
| 풀셋 생성 (영상 제외) | ✅ | 슬라이드+상세페이지+SNS |
| 개별 채널 생성 + Canvas 렌더링 | ✅ | 각 버튼이 생성+렌더링 수행 |
| Brand DNA → 생성 흐름 통합 | ✅ | buildSharedContext() |
| Brief → 생성 흐름 통합 | ✅ | 목표, 타겟, KPI 반영 |
| **Brief 입력 UI** | ✅ | BriefTab 신규 추가 |

### Video6 Pipeline (이전 세션)
| 기능 | 상태 |
|------|------|
| 스크립트 생성 (GPT-4o) | ✅ |
| 이미지 생성 (ComfyUI) | ✅ |
| TTS 생성 (EdgeTTS) | ✅ |
| BGM 믹싱 | ✅ |
| 영상 렌더링 | ✅ |

### 로컬 GPU AI 서비스 (2025-12-03 추가)

| 서비스 | 포트 | Provider 파일 | 상태 |
|--------|------|--------------|------|
| **Z-Image** (이미지 생성) | 7860 | `zimage_provider.py` | ✅ 구현 완료 |
| **HunyuanVideo** (동영상 생성) | 8188 (ComfyUI) | `hunyuan_provider.py` | ✅ 구현 완료 |

**Z-Image 특징**:

- SDXL 모델 기반, 8스텝 빠른 생성
- 비용 없음 (로컬 GPU), 콘텐츠 필터 없음
- 설치 위치: `D:\ai\zimage\`

**HunyuanVideo 특징**:

- Text-to-Video: 텍스트 → 5초 영상
- Image-to-Video: 이미지 → 5초 영상
- ComfyUI 워크플로우 기반

---

## 🔴 남은 작업 (다음 세션)

### P1 (High)
1. **getPolotnoStore 마이그레이션 완료**
   - 아직 deprecated API 사용 중인 파일들:
     - `useBrandToCanvas.ts`
     - `ChatPanel.tsx`
     - `canvasOperations.ts`
     - `useEditorActions.ts`
     - `useChatStore.ts`
     - `PagesTab.tsx`

2. **Brief 입력 → ConceptBoard 연동 강화**
   - BriefTab에서 입력 → ConceptBoard 생성 시 Brief 데이터 자동 반영
   - 현재: Store에 저장됨, 생성 시 buildSharedContext()에서 사용

### P2 (Medium)
3. VEO3 테스트 - 이미지 → 동영상 변환
4. NanoBanana 이미지 생성 확인
5. Reviewer 일관성 검사 (추후)
6. TrendPipeline 연결 (추후)

---

## 주요 파일 위치

### 이번 세션 수정/생성 파일
| 파일 | 변경 내용 |
|------|----------|
| `panels/left/tabs/BriefTab.tsx` | **신규 생성** - Brief 입력 UI |
| `panels/left/tabs/ConceptBoardTab.tsx` | useMock: false 전환 |
| `polotno/PolotnoWorkspace.tsx` | 레이아웃 개선 |
| `panels/left/tabs/PresentationTab.tsx` | getOrCreateCanvasStore 마이그레이션 |
| `layout/ActivityBar.tsx` | Brief 아이콘 추가 |
| `panels/left/LeftPanel.tsx` | BriefTab import/라우팅 |
| `stores/useLeftPanelStore.ts` | brief 탭 타입 추가 |

### 관련 Store
| 파일 | 용도 |
|------|------|
| `stores/useBriefStore.ts` | Brief 저장 + 검증 |
| `stores/useBrandStore.ts` | Brand DNA 저장 |
| `stores/useGeneratedAssetsStore.ts` | 생성된 에셋 + 생성 함수 |
| `stores/useLeftPanelStore.ts` | 탭 → 캔버스 매핑 |

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

## Git 커밋 히스토리 (최근)

```
722ee99 [2025-12-02][C] feat: Brief 입력 UI 추가 및 API 실제 연동
6fdd9aa [2025-12-02][C] feat: Brand DNA + Brief 생성 흐름 통합 및 풀셋 생성 완성
91660ad fix: 동적 Mock 컨셉 생성 및 Canvas 디버깅 로그 추가
8ed6c46 docs: 세션 인수인계 문서 업데이트 (14:40)
088c3b2 fix: 컨셉 Canvas 렌더링 타이밍 개선
```

---

**마지막 업데이트**: 2025-12-02 21:50 by 전체 팀 (A/B/C)
