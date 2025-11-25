# Demo QA Checklist

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 발표 직전 점검 체크리스트

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [SPARKLIO_DEMO_V1_STORY_AND_FLOW.md](./SPARKLIO_DEMO_V1_STORY_AND_FLOW.md)

---

## 1. 인프라 체크

### 1.1 Mac mini 서버 (100.123.51.5)

**Backend API**:
- [ ] 서버 실행 중 (`docker ps | grep sparklio-backend`)
- [ ] Health Check 성공 (`curl http://100.123.51.5:8000/health`)
- [ ] Swagger UI 접속 가능 (`http://100.123.51.5:8000/docs`)
- [ ] CORS 설정 확인 (`Access-Control-Allow-Origin: http://localhost:3000`)

**PostgreSQL**:
- [ ] 서버 실행 중 (`docker ps | grep sparklio-postgres`)
- [ ] pgvector extension 활성화
  ```bash
  docker exec sparklio-postgres psql -U sparklio -d sparklio -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
  ```
- [ ] 모든 테이블 존재 확인 (meetings, campaigns, presentations, etc.)
  ```bash
  docker exec sparklio-postgres psql -U sparklio -d sparklio -c "\dt"
  ```

**Redis**:
- [ ] 서버 실행 중 (`docker ps | grep sparklio-redis`)
- [ ] Ping 테스트
  ```bash
  docker exec sparklio-redis redis-cli ping
  ```

**MinIO**:
- [ ] 서버 실행 중 (`docker ps | grep sparklio-minio`)
- [ ] Web Console 접속 가능 (`http://100.123.51.5:9001`)
- [ ] `meetings` 버킷 존재 확인

**기타**:
- [ ] ffmpeg 설치 확인
  ```bash
  docker exec sparklio-backend ffmpeg -version
  ```
- [ ] Node.js 설치 확인
  ```bash
  docker exec sparklio-backend node --version
  ```

---

### 1.2 RTX Desktop (100.123.51.6)

**Whisper STT**:
- [ ] Whisper 서버 실행 중
- [ ] API 테스트
  ```bash
  curl http://100.123.51.6:8001/health
  ```

**Ollama**:
- [ ] Ollama 서버 실행 중
- [ ] Llama 3.2 모델 로드 확인
  ```bash
  curl http://100.123.51.6:11434/api/tags
  ```

**ComfyUI** (선택적):
- [ ] ComfyUI 서버 실행 중
- [ ] Web UI 접속 가능 (`http://100.123.51.6:8188`)
- [ ] SDXL 또는 Flux 모델 로드 확인

---

### 1.3 로컬 환경 (Laptop)

**Frontend Dev Server**:
- [ ] Node.js 설치 확인 (`node --version` - v20 이상)
- [ ] npm 패키지 설치 완료 (`npm install`)
- [ ] Dev Server 실행 (`npm run dev`)
- [ ] 브라우저 접속 (`http://localhost:3000`)
- [ ] `/studio/demo` 페이지 로드 성공

**Git**:
- [ ] 최신 브랜치 Pull (`git pull origin feature/editor-migration-polotno`)
- [ ] Uncommitted 변경사항 없음 (또는 스태시)

---

## 2. 백엔드 API 테스트

### 2.1 Meeting From URL

**테스트 URL**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (테스트용)

**cURL 테스트**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/meetings/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "테스트 회의",
    "language": "ko"
  }'
```

**체크리스트**:
- [ ] 201 Created 응답
- [ ] `meeting_id` 반환
- [ ] `status: processing` 또는 `ready_for_summary`
- [ ] Meeting 조회 가능 (`GET /api/v1/meetings/{meeting_id}`)
- [ ] Transcript 존재 확인
- [ ] Summary 생성 확인 (title, one_line_summary, key_messages)

---

### 2.2 Meeting to Campaign

**cURL 테스트**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/demo/meeting-to-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "{meeting_id}",
    "num_concepts": 2
  }'
```

**체크리스트**:
- [ ] 202 Accepted 응답
- [ ] `task_id` 및 `campaign_id` 반환
- [ ] SSE Progress Stream 작동 (`GET /api/v1/tasks/{task_id}/stream`)
- [ ] 진행률 메시지 수신 (10% → 30% → ... → 100%)
- [ ] Campaign 조회 가능 (`GET /api/v1/demo/campaigns/{campaign_id}`)
- [ ] 2개 Concept 생성 확인
- [ ] 각 Concept별 4종 산출물 생성 확인
  - [ ] Presentation (3-5 슬라이드)
  - [ ] Product Detail
  - [ ] Instagram Ads (카드 3종)
  - [ ] Shorts Script

---

### 2.3 Concept Board

**cURL 테스트**:
```bash
curl http://100.123.51.5:8000/api/v1/demo/concept-board/{campaign_id}
```

**체크리스트**:
- [ ] 200 OK 응답
- [ ] Meeting 정보 포함
- [ ] Brand 정보 포함
- [ ] Concept 리스트 포함 (최소 2개)
- [ ] 각 Concept에 linked_assets 존재

---

## 3. 프론트엔드 플로우 테스트

### 3.1 레이아웃 확인

**브라우저**: `http://localhost:3000/studio/demo`

**체크리스트**:
- [ ] 좌/중/우 패널 정상 렌더링
- [ ] 좌측: 브랜드 선택, Meeting 리스트 표시
- [ ] 중앙: 기본 뷰 (Concept Board 또는 빈 상태)
- [ ] 우측: Chat 패널, Sparklio Assistant 표시

---

### 3.2 시나리오 1: 회의 불러오기

**단계**:
1. [ ] 우측 Chat에 입력: "이 회의로 캠페인 만들어줘. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
2. [ ] 전송 버튼 클릭
3. [ ] Chat 응답 확인: "회의 내용을 불러와서 요약하고..."
4. [ ] Loading 인디케이터 표시
5. [ ] 30초 내 요약 완료
6. [ ] 중앙 뷰에 Meeting Summary 표시
7. [ ] Chat에 `[캠페인 만들기]` 버튼 표시

---

### 3.3 시나리오 2: 캠페인 생성

**단계**:
1. [ ] `[캠페인 만들기]` 버튼 클릭
2. [ ] Chat 응답: "캠페인 브리프를 작성 중입니다..."
3. [ ] 진행률 표시 (0% → 100%)
4. [ ] 중간 Narration 메시지 표시
   - [ ] "콘셉트를 생성하고 있어요..."
   - [ ] "Concept A 기반 산출물 생성 중... (1/4)"
   - [ ] "Concept B 기반 산출물 생성 중... (1/4)"
5. [ ] 2-3분 내 완료
6. [ ] Chat 응답: "모든 산출물이 준비되었습니다!"
7. [ ] 중앙 뷰에 Concept Board 표시
8. [ ] 2개 Concept Card 렌더링

---

### 3.4 시나리오 3: Concept Board 탐색

**단계**:
1. [ ] Concept Board 정상 렌더링
2. [ ] 상단 Header에 Meeting/Brand 정보 표시
3. [ ] 2개 Concept Card 가로 배열
4. [ ] 각 카드에 다음 정보 표시:
   - [ ] 타이틀
   - [ ] 서브타이틀
   - [ ] 핵심 메시지
   - [ ] 톤앤매너 키워드
   - [ ] 컬러 팔레트
   - [ ] 샘플 헤드라인
   - [ ] 산출물 버튼 (슬라이드/상세/인스타/쇼츠)

---

### 3.5 시나리오 4: 산출물 보기

**Concept A 슬라이드**:
1. [ ] Concept A 카드의 `[슬라이드 보기]` 버튼 클릭
2. [ ] 중앙 뷰가 Slides Preview로 전환
3. [ ] Polotno Viewer 렌더링
4. [ ] 3-5장 슬라이드 표시
5. [ ] 슬라이드 네비게이션 작동 (이전/다음)
6. [ ] Chat에 "Concept A의 프레젠테이션을 보고 있습니다." 메시지

**Concept A 상세페이지**:
1. [ ] `[상세 보기]` 버튼 클릭
2. [ ] 중앙 뷰가 Detail Preview로 전환
3. [ ] 제목, 한 줄 설명, 혜택 리스트, 상세 설명, CTA 표시

**Concept A 인스타 광고**:
1. [ ] `[인스타 보기]` 버튼 클릭
2. [ ] 중앙 뷰가 Instagram Preview로 전환
3. [ ] 카드 3종 표시
4. [ ] 각 카드에 헤드라인, 서브카피, CTA 표시

**Concept A 쇼츠 스크립트**:
1. [ ] `[쇼츠 보기]` 버튼 클릭
2. [ ] 중앙 뷰가 Shorts Preview로 전환
3. [ ] 씬 단위 리스트 표시 (6-7개 씬)
4. [ ] 각 씬에 역할, 화면, 내레이션, 자막 표시

---

### 3.6 시나리오 5: 컨셉보드로 돌아가기

**단계**:
1. [ ] 산출물 뷰에서 `[컨셉보드로 돌아가기]` 버튼 클릭
2. [ ] 중앙 뷰가 Concept Board로 전환
3. [ ] 선택된 카드 하이라이트 유지

---

## 4. 콘텐츠 품질 체크

### 4.1 일관성 확인

**Concept A vs Concept B**:
- [ ] 두 콘셉트가 명확히 구분되는가?
- [ ] 톤앤매너가 다른가? (예: 밝은 vs 따뜻한)
- [ ] 타깃이 다른가? (예: Z세대 vs 30-40대 엄마)
- [ ] 샘플 헤드라인이 다른가?

**같은 Concept 내 일관성**:
- [ ] 슬라이드, 상세페이지, 인스타, 쇼츠가 같은 톤을 유지하는가?
- [ ] 핵심 메시지가 일관되게 반복되는가?
- [ ] 컬러 팔레트가 일관되는가?

---

### 4.2 ReviewerAgent 검토

**체크**:
- [ ] 의료/건강 관련 과장 표현 없음
- [ ] "최고", "1위" 같은 근거 없는 주장 없음
- [ ] 브랜드 가이드 준수
- [ ] 광고 규제 위반 없음

---

## 5. 발표 리허설 체크

### 5.1 타임라인 확인 (총 8-10분)

| 시간 | 내용 | 체크 |
|-----|------|------|
| 0:00-0:30 | 인사 및 소개 | [ ] |
| 0:30-2:00 | 문제 정의 | [ ] |
| 2:00-3:00 | 솔루션 개요 | [ ] |
| 3:00-4:00 | 핵심 플로우 | [ ] |
| 4:00-5:00 | 차별점 (챗 기반 원페이지 스튜디오) | [ ] |
| 5:00-5:30 | 라이브 데모 소개 | [ ] |
| 5:30-8:30 | **라이브 데모** | [ ] |
| 8:30-9:00 | 기술 스택 & 에이전트 구조 | [ ] |
| 9:00-9:30 | 데모 결과 정리 | [ ] |
| 9:30-10:00 | Next Steps & Q&A | [ ] |

---

### 5.2 슬라이드 최종 검토

- [ ] 슬라이드 1: 타이틀 (프로젝트명, 발표자, 날짜)
- [ ] 슬라이드 2: 문제 정의 (마케팅 팀의 현실)
- [ ] 슬라이드 3: 솔루션 (Sparklio AI Marketing Studio)
- [ ] 슬라이드 4: 핵심 플로우 (Meeting → Campaign → Multi-Output)
- [ ] 슬라이드 5: 차별점 (챗 기반 원페이지 스튜디오)
- [ ] 슬라이드 6: Live Demo 소개
- [ ] 슬라이드 7: 기술 스택 & 에이전트 구조
- [ ] 슬라이드 8: Concept Board 핵심 UX
- [ ] 슬라이드 9: 데모 결과 정리
- [ ] 슬라이드 10: Next Steps & Q&A

---

### 5.3 라이브 데모 리허설

**사전 준비**:
- [ ] 테스트용 YouTube URL 준비 (유효성 확인)
- [ ] Chat 입력 텍스트 미리 복사 (메모장에 준비)
- [ ] 브라우저 탭 준비 (발표 화면 + 백업 화면)
- [ ] 네트워크 연결 확인

**리허설 실행** (최소 1회):
1. [ ] 회의 URL 입력 → 요약 (30초 이내)
2. [ ] 캠페인 생성 (2-3분 이내)
3. [ ] Concept Board 확인
4. [ ] 산출물 탐색 (슬라이드/상세/인스타/쇼츠)
5. [ ] 전체 플로우 3분 이내 완료

---

## 6. Fallback 계획

### 6.1 라이브 데모 실패 시

**시나리오 A: API 타임아웃**
- [ ] 미리 생성한 Meeting/Campaign 로드
- [ ] 준비된 Meeting ID로 `GET /api/v1/meetings/{id}` 호출
- [ ] "이미 생성된 데모 데이터로 보여드리겠습니다" 멘트

**시나리오 B: 네트워크 단절**
- [ ] 로컬 Mock 데이터 사용
- [ ] JSON 파일에서 데이터 로드
- [ ] Frontend만으로 UI 시연

**시나리오 C: 화면 공유 실패**
- [ ] 준비된 스크린샷/영상 사용
- [ ] PowerPoint에 캡처 이미지 삽입

---

### 6.2 예비 데이터 준비

**Meeting 데이터**:
```json
{
  "meeting_id": "demo-meeting-001",
  "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
  "summary": {
    "one_line_summary": "국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획",
    "key_messages": [
      "국내산 제주 감귤 100%",
      "합성 첨가물 무첨가",
      "어린이도 안심"
    ],
    "target_persona": "30-40대 엄마"
  }
}
```

**저장 위치**: `frontend/public/demo-data/meeting-001.json`

---

## 7. 발표 당일 체크리스트 (30분 전)

### 7.1 인프라

- [ ] Mac mini Backend Health Check
- [ ] RTX Desktop Whisper/Ollama Health Check
- [ ] Frontend Dev Server 실행
- [ ] 브라우저 탭 준비

### 7.2 데이터

- [ ] 테스트용 Meeting 미리 생성 (예비용)
- [ ] Chat 입력 텍스트 준비 (메모장)

### 7.3 발표 자료

- [ ] PowerPoint 슬라이드 최종 확인
- [ ] 발표 노트 준비
- [ ] 타이머 설정 (10분)

### 7.4 장비

- [ ] 노트북 충전 완료
- [ ] HDMI/USB-C 어댑터 준비
- [ ] 마우스/포인터 (선택적)

---

## 8. 최종 확인

### 8.1 성공 기준

**필수 달성**:
- [ ] Meeting From URL → 요약 성공
- [ ] Campaign 생성 → Concept Board 표시 성공
- [ ] 최소 1개 산출물 보기 성공 (슬라이드 또는 상세)
- [ ] 전체 플로우가 하나의 화면 안에서 진행됨을 시연

**추가 달성**:
- [ ] 2개 Concept 비교 가능
- [ ] 4종 산출물 모두 확인
- [ ] Chat Narration 실시간 표시
- [ ] 진행률 UI 작동

---

### 8.2 메시지 전달

**핵심 메시지 (3가지)**:
1. [ ] "회의 한 번으로 마케팅 캠페인 풀패키지 자동 생성"
2. [ ] "챗 기반 원페이지 스튜디오로 모든 작업 한 화면에서"
3. [ ] "여러 콘셉트를 한 눈에 비교하고 최적 방향 선택"

---

**문서 상태**: ✅ 완성
**최종 점검**: 발표 1시간 전
**버전**: v1.0
**최종 수정**: 2025-11-25
