# C팀 협조 요청 - Konva.js 에디터 전환 관련

**발신**: B팀 (Backend Team)
**수신**: C팀 (Frontend Team)
**작성일**: 2025-11-19
**우선순위**: 🟡 MEDIUM (협의 필요)
**응답 기한**: 2025-11-21 (2일 이내)

---

## 📋 요청 배경

C팀이 에디터를 **Fabric.js → Konva.js + Zustand** 기반으로 전환 중인 것으로 파악되었습니다.

**Git 커밋 이력**:
- `b14a7aa` - "feat(poc): Konva + Zustand POC 성공 (15분 완료)"
- `e3abaf6` - "docs: Fabric.js 마이그레이션 실패 및 Konva.js 전환 결정"

B팀은 이에 대응하여 **에디터 구현 방식에 독립적인 Backend 아키텍처**를 구축하려고 합니다.

---

## 🎯 협조 요청 사항

### 1. Konva.js JSON 형식 샘플 제공 ⭐⭐⭐

**요청 내용**:
C팀이 Konva.js로 렌더링하는 Canvas JSON 형식 예시를 공유해주세요.

**필요한 샘플**:
```json
// 예시: Konva.js에서 사용하는 JSON 형식
{
  "attrs": {
    "width": 1200,
    "height": 1600,
    "fill": "#ffffff"
  },
  "className": "Stage",
  "children": [
    {
      "attrs": {
        "text": "제품 헤드라인",
        "x": 100,
        "y": 100,
        "fontSize": 48,
        "fontFamily": "Pretendard",
        "fill": "#1f2937"
      },
      "className": "Text"
    },
    {
      "attrs": {
        "image": "...",  // 이미지 처리 방식
        "x": 100,
        "y": 400,
        "width": 800,
        "height": 600
      },
      "className": "Image"
    }
  ]
}
```

**목적**:
- Backend가 Konva 형식으로 직접 Canvas JSON을 생성할 수 있도록
- 또는 추상 스펙 → Konva 변환 Adapter 작성

**제출 방법**:
1. 간단한 텍스트 + 이미지 + 사각형 포함된 샘플 JSON 파일
2. 파일명: `frontend/docs/KONVA_JSON_SAMPLE.json` (또는 Slack으로 공유)

---

### 2. 에디터 요소(Element) 역할 정의 협의 ⭐⭐

**요청 내용**:
C팀이 에디터에서 식별해야 하는 "요소의 역할(role)"을 정의해주세요.

**예시**:
```typescript
// Frontend에서 필요한 역할(role) 목록
type ElementRole =
  | "HEADLINE"           // 메인 헤드라인
  | "SUBHEADLINE"        // 서브헤드라인
  | "BODY"               // 본문 텍스트
  | "MAIN_VISUAL"        // 메인 이미지
  | "LOGO"               // 브랜드 로고
  | "PRODUCT_IMAGE"      // 제품 이미지
  | "CTA_BUTTON"         // 행동 유도 버튼
  | "BULLET_POINT"       // 목록 아이템
  | "BACKGROUND"         // 배경 요소
  | "DECORATION"         // 장식 요소
  ;
```

**목적**:
- Backend가 생성하는 각 요소에 `role` 메타데이터를 붙여서 전달
- Frontend가 role 기반으로 스타일/동작 차별화 가능
- 예: `role: "HEADLINE"` → 사용자가 편집 시 글자 수 제한, 폰트 크기 고정 등

**제출 방법**:
- 역할 목록 + 각 역할의 설명 (간단한 표 형식)
- 파일명: `frontend/docs/ELEMENT_ROLES.md` (또는 이 문서에 회신)

---

### 3. 에디터 렌더링 요구사항 공유 ⭐

**요청 내용**:
Konva.js 에디터가 Canvas JSON을 받아서 렌더링할 때 **필수로 필요한 메타데이터**를 알려주세요.

**예상 항목**:
- [ ] 폰트 패밀리 목록 (Pretendard, Roboto 등)
- [ ] 색상 팔레트 (브랜드 컬러)
- [ ] 이미지 URL 형식 (S3 presigned URL, Base64 등)
- [ ] 레이어 순서(z-index) 필요 여부
- [ ] 애니메이션/인터랙션 메타데이터 필요 여부
- [ ] 반응형 지원 여부 (모바일/태블릿)

**목적**:
- Backend 응답에 Frontend가 필요한 모든 정보 포함
- 추가 API 호출 최소화

**제출 방법**:
- 체크리스트 형식으로 회신
- 파일명: `frontend/docs/EDITOR_REQUIREMENTS.md` (또는 이 문서에 회신)

---

### 4. Backend 추상 스펙 검토 및 피드백 ⭐⭐

**B팀 제안**:
Backend는 **에디터 라이브러리에 독립적인 추상 문서 스펙**을 제공하고,
Frontend는 **Konva/Fabric/기타 어떤 에디터든 자유롭게 선택**할 수 있도록 하려고 합니다.

**추상 스펙 예시** (초안):
```json
{
  "documentId": "doc_abc123",
  "type": "product_detail",
  "version": "1.0",
  "canvas_format": "abstract_v1",
  "layout": {
    "width": 1200,
    "height": 1600,
    "background": "#ffffff"
  },
  "elements": [
    {
      "id": "elem_001",
      "type": "text",
      "role": "HEADLINE",
      "content": "완벽한 소음 차단의 시작",
      "style": {
        "fontSize": 48,
        "fontWeight": "bold",
        "fontFamily": "Pretendard",
        "color": "#1f2937"
      },
      "position": {"x": 100, "y": 100},
      "size": {"width": 800, "height": 60}
    },
    {
      "id": "elem_002",
      "type": "image",
      "role": "MAIN_VISUAL",
      "src": "https://s3.../product.png",
      "position": {"x": 100, "y": 400},
      "size": {"width": 800, "height": 600}
    },
    {
      "id": "elem_003",
      "type": "rect",
      "role": "CTA_BUTTON",
      "style": {
        "fill": "#3b82f6",
        "borderRadius": 8
      },
      "position": {"x": 100, "y": 1050},
      "size": {"width": 200, "height": 60}
    }
  ],
  "bindings": {
    "elem_001.content": "text.headline",
    "elem_002.src": "media.main_image"
  }
}
```

**요청 내용**:
1. 위 초안을 검토하고, C팀 관점에서 부족한 부분 피드백
2. Konva.js로 변환 시 어려운 점이 있는지 확인
3. 추가로 필요한 필드 제안

**제출 방법**:
- 이 문서에 댓글/회신 형식으로 피드백
- 또는 Slack `#backend-frontend-integration` 채널에 공유

---

## 📅 응답 기한 및 일정

| 항목 | 담당 | 기한 | 우선순위 |
|-----|------|------|----------|
| **1. Konva JSON 샘플** | C팀 | 2025-11-20 | P0 (최우선) |
| **2. Element 역할 정의** | C팀 | 2025-11-20 | P0 (최우선) |
| **3. 렌더링 요구사항** | C팀 | 2025-11-21 | P1 (중요) |
| **4. 추상 스펙 피드백** | C팀 | 2025-11-21 | P1 (중요) |

---

## 🔄 협업 프로세스 제안

### Phase 1: 정보 수집 (2일)
- **C팀**: 위 4가지 요청사항 회신
- **B팀**: 회신 기반으로 추상 스펙 구체화

### Phase 2: Adapter 구현 (3일)
- **B팀**:
  - 추상 스펙 생성 로직 구현
  - Konva Adapter 구현 (C팀 샘플 기반)
- **C팀**:
  - Frontend Konva 렌더링 로직 구현
  - Backend 추상 스펙 → Konva 변환 테스트

### Phase 3: 통합 테스트 (2일)
- **양 팀 협업**:
  - E2E 테스트 (Generate API → Konva 렌더링)
  - 에지 케이스 검증
  - 성능 측정

---

## 💡 협업 이점

### C팀 이점
- ✅ 에디터를 자유롭게 선택/변경 가능 (Konva/Fabric/Three.js 등)
- ✅ Backend 수정 없이 Frontend만 Adapter 교체
- ✅ Backend 의존성 최소화 → 독립적인 개발 가능

### B팀 이점
- ✅ 에디터 라이브러리 변경에 영향받지 않음
- ✅ 하나의 추상 스펙으로 다양한 렌더러 지원
- ✅ PDF/이미지 Export 등 확장 용이

### 전체 프로젝트 이점
- ✅ Frontend/Backend 결합도 감소
- ✅ 각 팀의 기술 선택 자유도 증가
- ✅ 장기적인 유지보수성 향상

---

## 📞 회신 방법

### 방법 1: 이 문서에 직접 회신
아래 섹션에 답변을 작성해주세요.

---

### 📥 C팀 회신란

#### 1. Konva JSON 샘플
```json
// 여기에 샘플 JSON 붙여넣기
{
  // ...
}
```

**또는**:
- 파일 경로: `frontend/docs/KONVA_JSON_SAMPLE.json`
- Slack 링크: [링크 첨부]

---

#### 2. Element 역할 정의

| Role | 설명 | 예시 |
|------|------|------|
| HEADLINE | 메인 헤드라인 | "완벽한 소음 차단의 시작" |
| SUBHEADLINE | 서브헤드라인 | "프리미엄 노이즈 캔슬링" |
| ... | ... | ... |

**추가 요청 역할**:
- (있으면 추가)

---

#### 3. 렌더링 요구사항

필수 메타데이터:
- [x] 폰트 패밀리: Pretendard, Roboto
- [x] 색상 팔레트: 브랜드 컬러 6종
- [ ] ...

**기타 요구사항**:
- (자유롭게 작성)

---

#### 4. 추상 스펙 피드백

**긍정적인 부분**:
- (예: position/size 구조가 명확함)

**개선 필요 부분**:
- (예: 이미지 로딩 상태 필요, 레이어 순서 명시 필요)

**추가 제안**:
- (있으면 작성)

---

### 방법 2: Slack으로 회신
- 채널: `#backend-frontend-integration` (또는 `#c-team`)
- 멘션: `@B팀 리더` 또는 `@Backend Dev`

---

## 🚨 긴급 연락

만약 요청사항이 불명확하거나 추가 논의가 필요하면:
- **B팀 담당자**: [이름]
- **연락 방법**: Slack DM 또는 `#backend-team` 채널
- **화상 회의**: 필요 시 Google Meet 일정 조율

---

## 📚 참고 자료

### B팀 기존 구현 파일
- `app/services/canvas/fabric_builder.py` - 현재 Fabric.js JSON 생성 로직
- `app/services/generator/service.py` - Generator Service (Canvas 생성 호출)
- `app/api/v1/endpoints/generate.py` - Generate API 엔드포인트

### C팀 참고 커밋
- `b14a7aa` - Konva + Zustand POC
- `e3abaf6` - Fabric.js 마이그레이션 실패 문서

---

## ✅ 체크리스트 (C팀 작성 후 체크)

응답 완료 시 체크해주세요:

- [ ] 1. Konva JSON 샘플 제공 완료
- [ ] 2. Element 역할 정의 완료
- [ ] 3. 렌더링 요구사항 공유 완료
- [ ] 4. 추상 스펙 피드백 완료
- [ ] B팀에 회신 완료 알림 (Slack)

---

**협조 감사드립니다!**

**발신**: B팀 Backend
**문서 버전**: v1.0
**최종 업데이트**: 2025-11-19

---

## 🔄 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-11-19 | B팀 | 초안 작성 |
| | | |
