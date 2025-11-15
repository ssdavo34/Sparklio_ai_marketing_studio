# Concept Board 신규 기능 추가 - 요약 지침서

**작성일**: 2025-11-15
**작성자**: A팀 (PM)
**대상**: B팀장, C팀장
**우선순위**: P1 (현재 P0 Generator 완료 후 진행)

---

## 1. 개요

Sparklio에 **Concept Board** 기능을 추가합니다. Mixboard 스타일의 무드보드 기능으로, 브랜드별 시각적 컨셉을 탐색하고 Brand Kit에 저장할 수 있는 기능입니다.

**핵심 목적**:
- 브랜드 담당자가 자연어 프롬프트로 다양한 이미지를 생성
- 3×3 또는 4×4 타일 그리드로 시각적 컨셉 탐색
- 마음에 드는 타일을 선택하여 Brand Kit의 "Brand Visual Style"로 저장
- Product Detail, SNS, Presentation 등 Generator에서 해당 스타일 활용

---

## 2. 구현 전략: Phase 1 (Mock) → Phase 2 (실제 API)

### Phase 1: Mock Provider 기반 (우선 구현)
- **목적**: UX/API 테스트, 나노바나나 API 스펙 검증 없이 진행 가능
- **방법**: PIL/Pillow로 더미 이미지 생성 (색상 블록 + 텍스트)
- **기간**: 1-2주
- **산출물**:
  - DB 스키마 구축
  - 4개 API 엔드포인트 구현
  - Frontend UI/UX 완성
  - Mock 이미지로 전체 플로우 검증

### Phase 2: 나노바나나 API 연동 (향후)
- **목적**: 실제 Gemini 2.5 Flash 기반 이미지 생성
- **선행 조건**: 나노바나나 API 스펙 확보 및 계약
- **작업**: MockImageProvider → NanoBananaProvider 교체
- **기간**: 3-5일 (인터페이스 설계로 교체 간단)

**현재 작업 범위**: **Phase 1만 진행**

---

## 3. 각 팀별 작업 내용

### B팀 (Backend) - 주요 작업

**담당 문서**: `docs/CONCEPT_BOARD_B_TEAM_TASKS.md`

**핵심 작업**:
1. **데이터베이스 스키마 (3개 테이블)**
   - `concept_boards`: 보드 정보 (brandId, 프롬프트, 상태)
   - `concept_tiles`: 타일 정보 (이미지 URL, 위치, 팔레트)
   - `brand_visual_styles`: Brand Kit 저장용 스타일

2. **Mock ImageProvider 구현**
   - PIL/Pillow로 더미 이미지 생성
   - 썸네일 생성, 컬러 팔레트 추출 (ColorThief)
   - MinIO에 이미지 저장

3. **API 엔드포인트 (4개)**
   ```
   POST /api/v1/concept-board/generate
   GET  /api/v1/concept-board/{boardId}
   PATCH /api/v1/concept-board/{boardId}
   POST /api/v1/brand-visual-styles
   ```

4. **통합 테스트**
   - pytest로 API 테스트
   - Mock 이미지 생성 확인

**예상 소요**: 1-2주

---

### C팀 (Frontend) - 주요 작업

**담당 문서**: `docs/CONCEPT_BOARD_C_TEAM_TASKS.md`

**핵심 작업**:
1. **라우팅 및 페이지 구조**
   ```
   /brands/:brandId/concept-board/:boardId?
   ```
   - SPA 내부 섹션으로 구현 (별도 페이지 아님)

2. **컴포넌트 구현 (6개 이상)**
   - `ConceptBoardPage`: 메인 컨테이너
   - `PromptInput`: 프롬프트 입력
   - `ConceptBoardGrid`: 3×3 타일 그리드
   - `ConceptTile`: 개별 타일
   - `ColorPalette`: 컬러 팔레트 표시
   - `CreateStyleButton`: Brand Kit 저장 버튼

3. **API 연동**
   - `lib/api-client.ts` 확장
   - React Query 훅 구현
   - Loading/Error 상태 처리

4. **UI/UX**
   - 타일 클릭 시 상세 정보 표시
   - 우측 패널에 컬러 팔레트, 태그, 저장 버튼
   - 반응형 그리드 레이아웃

**예상 소요**: 1-2주

---

## 4. 데이터 모델 (요약)

### ConceptBoard
```typescript
{
  id: string
  brandId: string
  name: string
  basePrompt: string          // "미니멀 럭셔리 화장품 스타일"
  tileOrder: string[]         // 타일 ID 순서
  status: "draft" | "active" | "archived"
}
```

### ConceptTile
```typescript
{
  id: string
  boardId: string
  imageUrl: string            // MinIO CDN URL
  thumbUrl: string            // 썸네일 URL
  x, y, width, height, zIndex
  sourceType: "generated" | "uploaded" | "variation"
  prompt: string
  tags: string[]              // ["minimal", "luxury", "white"]
  palette: string[]           // ["#FFFFFF", "#F5F5DC", "#D4AF37"]
}
```

### BrandVisualStyle
```typescript
{
  id: string
  brandId: string
  boardId: string
  tileId: string
  kind: "mood" | "product" | "hero"
  channels: ["product_detail", "sns", "presentation"]
  palette: string[]
  tags: string[]
}
```

---

## 5. API 플로우 (Phase 1)

### 1) 보드 생성
```
사용자: "미니멀 럭셔리 화장품 스타일" 입력

Frontend:
  POST /api/v1/concept-board/generate
  {
    brandId: "brand_001",
    basePrompt: "미니멀 럭셔리 화장품 스타일",
    gridSize: "3x3",
    variations: 9
  }

Backend:
  - MockImageProvider로 9개 더미 이미지 생성
  - 각 이미지 MinIO 업로드
  - 썸네일 생성, 컬러 팔레트 추출
  - concept_boards, concept_tiles 테이블 저장

Response:
  {
    board: { id, name, basePrompt, ... },
    tiles: [
      { id, imageUrl, thumbUrl, palette, ... },
      ...
    ]
  }
```

### 2) 보드 조회
```
Frontend:
  GET /api/v1/concept-board/{boardId}

Backend:
  - DB에서 board + tiles 조회
  - 타일 순서(tileOrder) 기준으로 정렬

Response:
  { board, tiles }
```

### 3) Brand Kit 저장
```
사용자: 타일 클릭 → "이 스타일을 Brand Kit에 저장"

Frontend:
  POST /api/v1/brand-visual-styles
  {
    brandId: "brand_001",
    boardId: "board_123",
    tileId: "tile_456",
    kind: "mood",
    channels: ["product_detail", "sns"]
  }

Backend:
  - brand_visual_styles 테이블 저장
  - brands 테이블의 brand_kit.visual_styles에 참조 추가

Response:
  { id, brandId, tileId, ... }
```

---

## 6. 핵심 기술 스택

| 항목 | 기술 |
|------|------|
| **Backend** | FastAPI, PostgreSQL, Alembic |
| **Image Processing** | PIL/Pillow (Phase 1), ColorThief |
| **Storage** | MinIO (CDN URL) |
| **Frontend** | Next.js 14, React, TypeScript |
| **State Management** | React Query, Zustand |
| **Styling** | Tailwind CSS |

---

## 7. 타임라인

| 일정 | 작업 | 담당 |
|------|------|------|
| **Week 1** | DB 스키마 + Mock Provider 구현 | B팀 |
| **Week 1-2** | 4개 API 엔드포인트 구현 + 테스트 | B팀 |
| **Week 1** | Frontend 컴포넌트 구현 | C팀 |
| **Week 2** | API 연동 + 통합 테스트 | C팀 |
| **Week 2 말** | Phase 1 완료, E2E 테스트 | 전체 |

**Phase 2 (향후)**: 나노바나나 API 계약 후 3-5일 내 교체

---

## 8. Phase 1 완료 기준 (DoD)

**테스트 시나리오**:
```
1. 브랜드 페이지에서 "Concept Board" 메뉴 클릭
2. 프롬프트 입력: "미니멀 럭셔리 화장품 스타일"
3. "생성" 버튼 클릭
4. 3×3 그리드에 9개 Mock 이미지 로딩 확인
5. 타일 1개 클릭 → 우측 패널에 컬러 팔레트 표시
6. "Brand Kit에 저장" 버튼 클릭
7. 성공 메시지 확인
8. Brand Kit 페이지에서 저장된 스타일 확인
```

**통과 기준**:
- 위 시나리오 1회 이상 성공
- 9개 Mock 이미지 정상 생성 (MinIO CDN URL)
- 컬러 팔레트 정확히 추출
- Brand Kit에 스타일 저장 성공
- Console 에러 없음

---

## 9. 문서 구조

```
docs/
├── CONCEPT_BOARD_SPEC.md                # 전체 기능 명세 (필독)
├── CONCEPT_BOARD_B_TEAM_TASKS.md        # B팀 상세 작업 지시서
├── CONCEPT_BOARD_C_TEAM_TASKS.md        # C팀 상세 작업 지시서
├── B_TEAM_WORK_ORDER.md                 # B팀 메인 문서 (Concept Board 섹션 추가됨)
├── C_TEAM_WORK_ORDER.md                 # C팀 메인 문서 (Concept Board 섹션 추가됨)
└── CONCEPT_BOARD_요약_지침서.md          # 이 문서 (PM → 팀장 전달용)
```

---

## 10. 시작 전 필수 사항

### B팀장님께
1. **필독 문서** (총 1.5시간):
   - `CONCEPT_BOARD_SPEC.md` (30분)
   - `CONCEPT_BOARD_B_TEAM_TASKS.md` (1시간)

2. **선행 작업**:
   - ✅ P0 Generator 완료 확인 (brand_kit, product_detail, sns)
   - ✅ MinIO 연결 테스트
   - ✅ Alembic migration 환경 확인

3. **작업 시작**:
   - `feature/concept-board-backend` 브랜치 생성
   - DB 스키마부터 시작

### C팀장님께
1. **필독 문서** (총 1.5시간):
   - `CONCEPT_BOARD_SPEC.md` (30분)
   - `CONCEPT_BOARD_C_TEAM_TASKS.md` (1시간)

2. **선행 작업**:
   - ✅ P0 Editor 완료 확인 (Chat → Generator → Editor → Export)
   - ✅ API 연동 환경 확인
   - ✅ React Query 설정 확인

3. **작업 시작**:
   - `feature/concept-board-frontend` 브랜치 생성
   - B팀 API 완료 대기 후 연동

---

## 11. 주요 참고 사항

### Mock Provider vs Real API
- **Phase 1 Mock**:
  - 빠른 프로토타입, UX 검증
  - 더미 이미지지만 전체 플로우 동일
  - 나노바나나 API 의존성 없음

- **Phase 2 Real**:
  - ImageProvider 인터페이스만 교체
  - Frontend, DB 스키마 변경 없음
  - 3-5일 내 완료 가능

### Brand Kit 통합
- Concept Board에서 저장한 스타일은 `brand_visual_styles` 테이블에 저장
- Generator 호출 시 해당 스타일 참조 가능
- 예: Product Detail Generator가 Brand Kit의 "luxury mood" 스타일 활용

### NFR 요구사항
- **성능**: 9개 이미지 생성 < 10초 (Mock 기준)
- **이미지 크기**: 원본 1024×1024, 썸네일 256×256
- **동시성**: 브랜드당 1개 보드 생성만 허용 (중복 방지)

---

## 12. 문제 발생 시 에스컬레이션

| Level | 대상 | 상황 |
|-------|------|------|
| **L1** | 팀 내 협의 | 구현 방식, 기술 선택 |
| **L2** | A팀 (PM) | API 스펙 변경, 우선순위 조정 |
| **L3** | 전체 회의 | 아키텍처 변경, Phase 2 일정 조율 |

**연락 방법**: GitHub Issue 생성 + 라벨 `concept-board`

---

## 13. 다음 단계

1. **이 문서 공유**:
   - B팀장님께 전달
   - C팀장님께 전달

2. **킥오프 미팅** (30분):
   - 일시: P0 완료 후 조율
   - 안건: Phase 1 일정, 역할 분담, Mock Provider 데모

3. **작업 시작**:
   - B팀: DB 스키마 → Mock Provider → API
   - C팀: 컴포넌트 → API 연동 → 테스트

4. **주간 체크인**:
   - 매주 금요일 15분 진행 상황 공유
   - Blocker 확인

---

## 14. 최종 확인

**Concept Board의 목표**:
> "브랜드 담당자가 자연어 프롬프트로 시각적 컨셉을 탐색하고, Brand Kit에 저장하여 모든 Generator에서 일관된 스타일을 적용할 수 있도록 한다."

**Phase 1 목표**:
> "Mock Provider 기반으로 전체 UX/API 플로우를 검증하고, Phase 2에서 실제 이미지 생성으로 교체할 준비를 완료한다."

**예상 효과**:
- 브랜드별 일관된 시각 스타일 관리
- Generator 품질 향상 (Brand Kit 스타일 활용)
- 나노바나나 API 검증 전 UX 테스트 가능

---

**작성 완료**: 2025-11-15
**버전**: v1.0
**문의**: A팀 (PM)

**Good luck, B팀 & C팀! 🚀**
