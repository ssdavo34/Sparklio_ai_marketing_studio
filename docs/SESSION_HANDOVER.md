# 세션 인수인계 (2025-12-02 18:10 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: (이 세션에서 커밋 예정)
- **Mac Mini 배포**: ⏳ 동기화 필요
- **서버 상태**: ✅ healthy (Frontend 3001, Backend 8000)

---

## 오늘 완료한 작업 (2025-12-02)

### C팀 - 풀셋 생성 및 Brand DNA 통합 ✅

#### 1. 풀셋 생성 기능 완전 구현
- **ConceptBoardTab.tsx** 대규모 개선
  - `handleGenerateFullSet()` - 슬라이드/상세페이지/SNS 병렬 생성
  - `handleOpenSlides()` - 개별 슬라이드 생성 + Canvas 렌더링
  - `handleOpenDetail()` - 개별 상세페이지 생성 + Canvas 렌더링
  - `handleOpenInstagram()` - 개별 SNS 생성 + Canvas 렌더링
  - 각 함수가 데이터 생성 후 **실제 Canvas에 렌더링**까지 수행
  - 탭 자동 전환 (`setActiveTab`)

#### 2. 각 채널 탭에 생성된 데이터 표시
- **PresentationTab.tsx** - slidesData 표시 UI 추가
  - 슬라이드 목록 펼침/접기
  - 슬라이드 번호, 제목, 내용 미리보기
- **SNSTab.tsx** - instagramData 표시 UI 추가
  - 광고 목록 펼침/접기
  - 해시태그, 광고타입, 헤드라인, CTA 표시
- **DetailTab.tsx** - 이미 구현되어 있었음 (변경 없음)

#### 3. Brand DNA + Brief 생성 흐름 통합 ✅ (핵심!)
- **useGeneratedAssetsStore.ts** 수정
  - `useBrandStore`, `useBriefStore` import 추가
  - `buildSharedContext()` 헬퍼 함수 신규 추가
    - Brand DNA에서 톤, 핵심 메시지, Do's/Don'ts 추출
    - Brief에서 목표, 타겟, 인사이트, KPI 추출
    - 모든 생성 함수에서 동일한 컨텍스트 공유
  - 4개 생성 함수 모두 수정:
    - `generateSlidesFromConcept()` - Brand DNA + Brief 반영
    - `generateDetailFromConcept()` - Brand DNA + Brief 반영
    - `generateInstagramFromConcept()` - Brand DNA + Brief 반영
    - `generateShortsFromConcept()` - Brand DNA + Brief 반영

---

## 🟢 완료된 기능

### 메뉴 ↔ 캔버스 연동
| 기능 | 상태 | 비고 |
|------|------|------|
| 메뉴 선택 → Canvas 타입 자동 전환 | ✅ | useLeftPanelStore |
| Pages 패널 멀티캔버스 지원 | ✅ | getCanvasStore(activeCanvasType) |
| ConceptBoard 컨셉 생성 | ✅ | 3개 컨셉 AI 생성 |
| 컨셉 → Canvas 렌더링 | ✅ | conceptTemplate.ts |
| 컨셉 영속화 (페이지 이동 시 유지) | ✅ | useGeneratedAssetsStore |
| Pages 패널 컨셉 선택/전환 | ✅ | selectedConceptId 동기화 |
| **풀셋 생성 (영상 제외)** | ✅ | 슬라이드+상세페이지+SNS |
| **개별 채널 생성 + Canvas 렌더링** | ✅ | 각 버튼이 생성+렌더링 수행 |
| **PresentationTab 생성 데이터 표시** | ✅ | slidesData UI |
| **SNSTab 생성 데이터 표시** | ✅ | instagramData UI |
| **Brand DNA → 생성 흐름 통합** | ✅ | buildSharedContext() |
| **Brief → 생성 흐름 통합** | ✅ | 목표, 타겟, KPI 반영 |

### Video6 Pipeline (이전 세션)
| 기능 | 상태 |
|------|------|
| 스크립트 생성 (GPT-4o) | ✅ |
| 이미지 생성 (ComfyUI) | ✅ |
| TTS 생성 (EdgeTTS) | ✅ |
| BGM 믹싱 | ✅ |
| 영상 렌더링 | ✅ |

---

## 🟡 해결됨 (이번 세션)

### Brand DNA 생성 흐름 미연결 → 해결됨 ✅
- 이전: Brand DNA가 Store에만 저장되고 생성 시 사용되지 않음
- 이후: `buildSharedContext()`가 모든 생성 함수에서 Brand DNA 주입

### Brief → Agent 미연결 → 해결됨 ✅
- 이전: Brief 데이터가 생성 호출에 전달되지 않음
- 이후: Brief의 goal, target, insight, keyMessages, kpis가 프롬프트에 포함

### 산출물 일관성 문제 → 기초 해결됨 ✅
- 이전: 각 채널별로 독립적으로 생성되어 톤/메시지 불일치 가능
- 이후: 동일한 `sharedContext`를 모든 생성 함수가 공유

---

## 🔴 남은 작업 (다음 세션)

### P0 (Critical)
1. **실제 API 연동 테스트**
   - `useConceptGenerate` 훅의 `useMock: true` → `false`로 전환
   - Backend API 연동 시 실제 Brand DNA/Brief 전달 확인

2. **캔버스 스크롤 문제 확인**
   - 컨셉 캔버스 하단이 안보이는 문제 보고됨
   - PolotnoWorkspace 또는 Layout 확인 필요

### P1 (High)
3. **Planner/Strategist 레이어 추가** (Optional)
   - Brief → Strategist → ConceptAgent 흐름 구축
   - 현재는 직접 생성으로 우회

4. **Brief 입력 UI 추가**
   - 현재 Brief Store는 있지만 입력 UI 없음
   - BriefPanel 또는 BriefTab 필요

5. **getPolotnoStore 마이그레이션**
   - Deprecated warning 해결
   - PresentationTab 등에서 `getCanvasStore(type)` 사용으로 변경

### P2 (Medium)
6. VEO3 테스트 - 이미지 → 동영상 변환
7. NanoBanana 이미지 생성 확인
8. Reviewer 일관성 검사 (추후)
9. TrendPipeline 연결 (추후)

---

## 주요 파일 위치

### 이번 세션 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `stores/useGeneratedAssetsStore.ts` | Brand DNA + Brief 통합, buildSharedContext() 추가 |
| `panels/left/tabs/ConceptBoardTab.tsx` | 풀셋 생성, 개별 채널 생성+렌더링 |
| `panels/left/tabs/PresentationTab.tsx` | slidesData 표시 UI |
| `panels/left/tabs/SNSTab.tsx` | instagramData 표시 UI |

### 관련 Store
| 파일 | 용도 |
|------|------|
| `stores/useBrandStore.ts` | Brand DNA 저장 |
| `stores/useBriefStore.ts` | Brief 저장 + 검증 |
| `stores/useGeneratedAssetsStore.ts` | 생성된 에셋 + 생성 함수 |
| `stores/useLeftPanelStore.ts` | 탭 → 캔버스 매핑 |

---

## 중요: Video6는 건들지 마세요!

> "아 영상은 건들이지 말고 하자. 또 작업하다가 잘 되던 것도 안되면 안되니까"

Video6 관련 파일들은 이미 잘 작동하고 있으므로 수정하지 않습니다.

---

## buildSharedContext() 구조

```typescript
function buildSharedContext(concept: GeneratedConcept): string {
  // 1. Brand DNA 컨텍스트
  [브랜드 가이드라인]
  - 브랜드 톤앤매너
  - 핵심 메시지
  - 타겟 고객
  - Do's / Don'ts

  // 2. Brief 컨텍스트
  [캠페인 브리프]
  - 캠페인 목표 (goal)
  - 타겟 오디언스 (target)
  - 핵심 인사이트 (insight)
  - 핵심 메시지 (keyMessages)
  - KPI

  // 3. 컨셉 컨텍스트
  [선택된 컨셉]
  - 컨셉명, 설명, 헤드라인...
}
```

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

**마지막 업데이트**: 2025-12-02 18:10 by C팀
