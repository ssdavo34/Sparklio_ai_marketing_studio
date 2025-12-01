# 세션 인수인계 (2025-12-01 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `4f6b661` - Brand DNA 분석 품질 개선 및 탭 전환 시 유지
- **Mac Mini 배포**: ✅ 완료
- **서버 상태**: ✅ healthy

---

## 오늘 완료한 작업 (2025-12-01)

### C팀 - Brand DNA 분석 기능 개선

1. **Brand DNA 분석 품질 개선** (54ed8dc, 4f6b661)
   - Backend: `_example` 제거, `_context`에 분석 지침 추가
   - LLM이 문서 내용 기반으로만 분석하도록 instruction 강화
   - 일반적 마케팅 문구 사용 금지 규칙 추가

2. **Brand DNA 탭 전환 시 유지** (54ed8dc)
   - `useCenterViewStore`에 `sharedBrandDNA` 상태 추가
   - BrandKitTab → ConceptBoardTab 간 Brand DNA 공유
   - ConceptBoardTab에 Brand DNA 표시 섹션 추가

3. **문서 선택 변경 시 결과 숨김** (4f6b661)
   - `toggleDocSelection`, `toggleSelectAll` 시 `setShowDNAResult(false)` 호출
   - 다른 문서 선택 시 이전 분석 결과가 계속 표시되는 문제 해결

4. **익명 브랜드 분석 지원** (1aeb773)
   - 특정 브랜드 없이도 문서만으로 분석 가능

---

## 🔴 다음에 반드시 수정해야 할 사항 (PENDING TASKS)

### P0 - Brand DNA 분석 이력과 문서 연결

**현재 문제점:**
- 분석 이력이 브랜드 단위로만 저장되고, **어떤 문서를 분석했는지 기록되지 않음**
- 다른 문서를 선택해도 이전 분석 이력이 그대로 표시됨
- 이력에서 선택 시 해당 분석에 사용된 문서를 알 수 없음

**수정 필요 사항:**
1. **분석 이력에 document_ids 저장**
   - `BrandDNA` 타입에 `document_ids: string[]` 필드 추가
   - 분석 시 사용된 문서 ID들을 함께 저장

2. **문서별 분석 이력 필터링**
   - 선택된 문서에 해당하는 분석 이력만 드롭다운에 표시
   - `history.filter(h => h.document_ids와 selectedDocIds 일치)` 로직 필요

3. **분석 이력 선택 시 문서 정보 표시**
   - 이력 항목에 분석에 사용된 문서 이름 표시
   - 예: "2025-12-01 14:30 (Polotno SDK 외 2개)"

**관련 파일:**
- `frontend/lib/api/brand-api.ts` - BrandDNA 타입 정의
- `frontend/components/canvas-studio/panels/left/tabs/BrandKitTab.tsx` - 이력 UI
- `backend/app/schemas/brand_analyzer.py` - 백엔드 스키마

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| Brand DNA 이력-문서 연결 | 🔴 미구현 | 위 PENDING TASKS 참조 |
| Alembic multiple heads | ⚠️ 존재 | `demo_20251126`과 `2025_11_30_project_outputs` 두 head |
| Video6 In-Memory Storage | ⚠️ MVP | 추후 DB로 이관 필요 |

---

## 다음 작업 우선순위

### P0 (Critical)
1. **Brand DNA 이력-문서 연결**: 위 PENDING TASKS 참조

### P1 (High)
2. **E2E 테스트**: Video Pipeline V2 전체 플로우 테스트
3. **Video6 DB 저장**: In-Memory → project_outputs 테이블 연동

### P2 (Medium)
4. **레거시 에셋 마이그레이션**: `migrate_asset_thumbnails.py` 실행
5. **Ken Burns 효과 튜닝**: FFmpeg zoompan 파라미터 최적화

---

## 주요 파일 위치

| 파일 | 용도 |
|------|------|
| `frontend/components/canvas-studio/panels/left/tabs/BrandKitTab.tsx` | Brand DNA UI |
| `frontend/components/canvas-studio/stores/useCenterViewStore.ts` | Brand DNA 공유 상태 |
| `backend/app/services/agents/brand_analyzer.py` | BrandAnalyzerAgent |
| `backend/app/schemas/brand_analyzer.py` | Brand DNA 스키마 |

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 헬스체크
curl http://100.123.51.5:8000/health
```

---

**마지막 업데이트**: 2025-12-01 by C팀
