# 타팀 협조 요청서

> **발신**: C팀 (Frontend Team)
> **수신**: A팀 (QA), B팀 (Backend)
> **프로젝트**: Canvas Studio v3.1 - Polotno 기반 에디터
> **작성일**: 2025-11-22
> **우선순위**: 🔴 High

---

## 📌 요청 요약

Canvas Studio v3.1 개발을 위해 아래 항목에 대한 협조를 요청드립니다.

| 팀 | 요청 항목 | 기한 | 우선순위 |
|---|----------|------|---------|
| **A팀** | 테스트 환경 구성 | 1주차 말 | 🟡 Medium |
| **A팀** | Polotno 제약사항 검증 | 2주차 초 | 🔴 High |
| **B팀** | Canvas State 저장 API | 2주차 말 | 🔴 High |
| **B팀** | Brand Kit API 연동 | 3주차 초 | 🟡 Medium |

---

## 🔵 B팀 (Backend) 요청사항

### 1. Canvas State 저장 API 검토

#### 📋 요청 내용
Polotno에서 생성된 Canvas 데이터를 저장하기 위한 API 엔드포인트 검토 및 수정 필요

#### 🎯 배경
- 기존: Fabric.js 기반 Canvas 데이터 저장
- 변경: Polotno JSON 포맷으로 변경

#### 📦 Polotno JSON 샘플

```json
{
  "version": "1.0.0",
  "unit": "px",
  "dpi": 72,
  "width": 1920,
  "height": 1080,
  "fonts": [],
  "pages": [
    {
      "id": "page-1",
      "name": "Slide 1",
      "width": 1920,
      "height": 1080,
      "background": "#ffffff",
      "bleed": 0,
      "duration": 5000,
      "children": [
        {
          "id": "text-1",
          "type": "text",
          "name": "Title",
          "x": 100,
          "y": 100,
          "width": 500,
          "height": 80,
          "rotation": 0,
          "text": "Hello World",
          "fontSize": 48,
          "fontFamily": "Arial",
          "fontWeight": "bold",
          "fill": "#000000",
          "align": "center"
        },
        {
          "id": "image-1",
          "type": "image",
          "name": "Background",
          "x": 0,
          "y": 0,
          "width": 1920,
          "height": 1080,
          "src": "https://example.com/image.jpg"
        }
      ]
    }
  ]
}
```

#### ✅ 요청사항

1. **API 엔드포인트 확인**
   ```
   POST /api/v1/canvas/save
   PUT  /api/v1/canvas/{id}
   GET  /api/v1/canvas/{id}
   ```

2. **데이터 스키마 변경**
   - 기존 Fabric.js 스키마 → Polotno 스키마
   - 하위 호환성 유지 (선택사항)

3. **응답 포맷**
   ```json
   {
     "success": true,
     "canvasId": "canvas_abc123",
     "version": "1.0.0",
     "savedAt": "2025-11-22T10:30:00Z"
   }
   ```

#### 📅 일정
- **요청 접수**: 2025-11-22
- **검토 완료**: 2025-11-26 (Block 3 완료 후)
- **구현 완료**: 2025-11-29 (Block 5 시작 전)

#### 🔗 참고 자료
- Polotno JSON 스펙: https://polotno.com/docs/export-json
- 기존 Fabric.js API: `/api/v1/canvas/save`

---

### 2. Brand Kit API 연동

#### 📋 요청 내용
Brand Kit 데이터(색상, 폰트, 로고)를 Canvas에 적용하기 위한 API

#### 🎯 배경
- Canvas Studio에서 Brand Kit 선택 시
- 해당 브랜드의 색상 팔레트, 폰트를 Canvas 요소에 자동 적용

#### 📦 필요한 API

```
GET /api/v1/brand/{brandId}
GET /api/v1/brand/{brandId}/colors
GET /api/v1/brand/{brandId}/fonts
GET /api/v1/brand/{brandId}/assets
```

#### 📄 예상 응답 포맷

```json
{
  "brandId": "brand_123",
  "name": "Sparklio Official",
  "colors": {
    "primary": ["#4F46E5", "#6366F1", "#818CF8"],
    "secondary": ["#10B981", "#34D399"],
    "neutral": ["#111827", "#374151", "#6B7280"]
  },
  "fonts": [
    {
      "id": "font_1",
      "name": "Pretendard",
      "usage": "heading",
      "weights": [400, 600, 700],
      "url": "https://cdn.example.com/fonts/pretendard.woff2"
    },
    {
      "id": "font_2",
      "name": "Noto Sans KR",
      "usage": "body",
      "weights": [400, 500],
      "url": "https://cdn.example.com/fonts/noto-sans-kr.woff2"
    }
  ],
  "logos": [
    {
      "id": "logo_1",
      "name": "Primary Logo",
      "url": "https://cdn.example.com/logos/sparklio-logo.svg",
      "format": "svg"
    }
  ]
}
```

#### ✅ 요청사항

1. **API 엔드포인트 생성/확인**
   - Brand 전체 정보 조회
   - 색상 팔레트만 조회 (최적화)
   - 폰트 목록만 조회 (최적화)

2. **CORS 설정**
   - 폰트/로고 URL이 외부 CDN인 경우 CORS 허용 확인

3. **캐싱 전략**
   - Brand 데이터는 자주 변경되지 않으므로 CDN 캐싱 권장

#### 📅 일정
- **요청 접수**: 2025-11-22
- **검토 완료**: 2025-11-29
- **구현 완료**: 2025-12-02 (Block 7 시작 전)

#### 🔗 참고 자료
- 기존 Brand API: `/api/v1/brand/{brandId}`
- Polotno 폰트 로드 방식: https://polotno.com/docs/fonts

---

## 🔴 A팀 (QA) 요청사항

### 1. 테스트 환경 구성

#### 📋 요청 내용
Canvas Studio v3.1 전용 테스트 계정 및 환경 준비

#### 🎯 배경
- 기존 `/studio/polotno`와 분리된 새 에디터 `/studio/v3`
- 독립적인 테스트 환경 필요

#### ✅ 요청사항

1. **테스트 계정 생성**
   - 계정 ID: `qa_canvas_v3@sparklio.ai`
   - 권한: Editor Full Access
   - Brand Kit: 테스트용 브랜드 1개 연동

2. **테스트 체크리스트**
   - [ ] 라우팅: `/studio/v3` 접근 가능
   - [ ] 레이아웃: VSCode 스타일 UI 표시
   - [ ] Polotno: 캔버스 정상 렌더링
   - [ ] 기능: 텍스트/이미지 추가 가능
   - [ ] 저장: Canvas 저장 후 다시 로드 시 복원

3. **버그 리포팅**
   - GitHub Issues 사용
   - 라벨: `canvas-v3`, `priority-high` 등

#### 📅 일정
- **요청 접수**: 2025-11-22
- **환경 구성**: 2025-11-25 (Block 3 완료 후)
- **테스트 시작**: 2025-11-26

---

### 2. Polotno 무료 버전 제약사항 검증

#### 📋 요청 내용
Polotno SDK 무료 버전의 기능 제약 및 워터마크 확인

#### 🎯 배경
- 현재 개발은 무료 API 키 사용 중
- 프로덕션 배포 전 유료 전환 필요성 판단

#### ✅ 요청사항

1. **기능 제약 확인**
   - [ ] 워터마크 표시 위치 및 크기
   - [ ] 내보내기 제한 (해상도, 포맷)
   - [ ] 페이지/레이어 수 제한
   - [ ] 사용 가능한 템플릿 개수

2. **사용자 경험 평가**
   - 워터마크가 사용성에 미치는 영향
   - 클라이언트 데모 시 문제 여부

3. **유료 전환 시나리오**
   - 무료 → 유료 전환 시 데이터 마이그레이션
   - 비용 대비 효과 분석

#### 📅 일정
- **요청 접수**: 2025-11-22
- **검증 완료**: 2025-11-27
- **보고서 제출**: 2025-11-28

#### 🔗 참고 자료
- Polotno 가격표: https://polotno.com/pricing
- 무료 vs 유료 비교: https://polotno.com/docs/free-vs-paid

---

## 📋 협조 요청 체크리스트

### B팀 (Backend)
- [ ] Canvas State 저장 API 검토 완료
- [ ] Polotno JSON 스키마 지원 확인
- [ ] Brand Kit API 엔드포인트 확인
- [ ] CORS 설정 완료

### A팀 (QA)
- [ ] 테스트 계정 생성 완료
- [ ] 테스트 환경 접근 가능
- [ ] Polotno 제약사항 검증 완료
- [ ] 버그 리포팅 프로세스 확립

---

## 💬 커뮤니케이션 채널

### Slack 채널
- **프로젝트 전체**: `#canvas-studio-v3`
- **B팀 협조**: `#frontend-backend-sync`
- **A팀 협조**: `#qa-frontend-sync`

### 회의 일정
- **킥오프 미팅**: 2025-11-22 (금) 14:00
- **주간 Sync**: 매주 월요일 10:00
- **문제 해결**: 필요 시 수시 Discord 음성 채널

### 긴급 연락
- **C팀 리드**: Claude (Slack DM 또는 @claude)
- **B팀 담당**: (Backend API 담당자)
- **A팀 담당**: (QA 담당자)

---

## 📚 참고 문서

1. **마스터 플랜**: `/docs/canvas-studio-v3/000_MASTER_PLAN.md`
2. **기술 스펙**: `/docs/canvas-studio-v3/001_TECHNICAL_SPEC.md` (작성 예정)
3. **Polotno 공식 문서**: https://polotno.com/docs

---

## 🙏 감사 인사

Canvas Studio v3.1 개발에 협조해주셔서 감사합니다!

본 프로젝트는 Sparklio의 핵심 기능인 만큼, 팀 간 긴밀한 협력이 성공의 열쇠입니다.

문의사항이나 추가 요청 사항은 언제든지 `#canvas-studio-v3` 채널로 연락 주세요.

---

**작성자**: C팀 (Frontend Team) - Claude
**승인자**: (팀 리더 승인 필요)
**배포일**: 2025-11-22
