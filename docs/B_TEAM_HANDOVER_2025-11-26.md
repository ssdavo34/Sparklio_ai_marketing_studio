# B팀 인수인계 문서

**작성일**: 2025-11-26 (수요일) 18:35
**작성자**: B팀 (Backend)
**대상**: 다음 B팀 세션 Claude

---

## 1. 현재 상황 요약

### 1.1 Demo Day 파이프라인 상태

```
Meeting → Campaign → Concept → Asset 생성
   ✅        ✅         ✅        🔧
```

- Meeting 녹음/전사: 기존 기능 (정상)
- Campaign 생성: 정상
- Concept 생성 (Gemini 2.0 Flash): 버그 수정 완료, **A팀 테스트 대기**
- Asset 생성: TODO (아직 구현 안 됨)

### 1.2 최신 배포 상태

| 항목 | 값 |
|------|-----|
| 서버 | Mac Mini (100.123.51.5) |
| 최신 커밋 | `c759f70` |
| Docker | sparklio-backend (재시작됨) |
| Gemini API | 설정 완료 (.env에 GOOGLE_API_KEY) |

---

## 2. 다음 세션에서 해야 할 일

### 2.1 최우선 (P0): A팀 테스트 결과 확인

A팀이 테스트 중인 API:
```
POST /api/v1/demo/meetings/{meeting_id}/start-campaign
GET /api/v1/tasks/{task_id}/stream (SSE)
```

**확인 방법**:
1. A팀 피드백 메시지 확인
2. 성공 시 → P2 작업으로 이동
3. 실패 시 → 서버 로그 분석:
   ```bash
   ssh woosun@100.123.51.5 "export PATH=\$PATH:/usr/local/bin && docker logs sparklio-backend --tail 100"
   ```

### 2.2 A팀 전달 사항 (테스트 요청)

> **A팀에 전달**:
> 백엔드 수정 배포 완료 (커밋: c759f70)
> - concept_id NULL 문제 해결
> - Meeting → Campaign 생성 테스트 재요청 드립니다

### 2.3 P2 작업: Asset 생성 로직 구현

현재 demo.py의 Asset 생성 부분 (line 469-475):
```python
# TODO: Asset 생성 로직 (P1)
# - PresentationAgent
# - ProductDetailAgent
# - InstagramAdsAgent
# - ShortsScriptAgent (이미 구현됨)

await asyncio.sleep(2)  # Demo용 딜레이
```

구현 필요:
- 각 에셋 타입별 Agent 호출
- 결과를 ConceptAsset.content에 저장

---

## 3. 오늘 수정한 버그 상세

### 3.1 SQLEnum 대소문자 문제

**에러**: `invalid input value for enum campaignstatus: "PENDING"`

**원인**: Python Enum name (PENDING) vs DB enum value (pending)

**수정** (`campaign.py`):
```python
status = Column(
    SQLEnum(CampaignStatus, values_callable=lambda x: [e.value for e in x]),
    default=CampaignStatus.PENDING,
    nullable=False
)
```

### 3.2 LLMGateway.generate() 시그니처

**에러**: `got an unexpected keyword argument 'prompt'`

**원인**: generate()는 `payload={}` 형태로 prompt를 전달해야 함

**수정** (concept.py, shorts_script.py, visual_prompt.py):
```python
# Before (잘못됨)
llm_response = await self.llm_gateway.generate(
    prompt=prompt,
    model="gemini-2.0-flash",
    ...
)

# After (올바름)
llm_response = await self.llm_gateway.generate(
    role=self.name,
    task="generate_concepts",
    payload={"prompt": prompt},
    mode="json",
    override_model="gemini-2.0-flash",
    options={...}
)
```

### 3.3 Router 기본값 ollama 문제

**에러**: `Ollama API error: 404`

**원인**: `options={"model": "gemini-2.0-flash"}`는 Router를 우회하지 못함

**수정**: `override_model="gemini-2.0-flash"` 파라미터 사용

### 3.4 concept_id NULL 문제

**에러**: `null value in column "concept_id" violates not-null constraint`

**원인**: `db.add(concept)` 후 `concept.id`가 아직 None

**수정** (`demo.py`):
```python
db.add(concept)
db.flush()  # concept.id 생성

for asset_type in AssetType:
    asset = ConceptAsset(
        concept_id=concept.id,  # 이제 유효한 ID
        ...
    )
```

---

## 4. 주요 파일 위치

### Backend 파일

```
backend/app/api/v1/demo.py                    - Demo Day API 엔드포인트
backend/app/models/campaign.py                - Campaign, Concept, ConceptAsset 모델
backend/app/services/agents/concept.py        - ConceptAgent (Gemini)
backend/app/services/agents/shorts_script.py  - ShortsScriptAgent (Gemini)
backend/app/services/agents/visual_prompt.py  - VisualPromptAgent (Gemini)
backend/app/services/llm/gateway.py           - LLMGateway
backend/app/services/llm/router.py            - LLM Router
```

### Docker/환경

```
docker/mac-mini/.env                          - 환경변수 (GOOGLE_API_KEY 포함)
docker/mac-mini/docker-compose.yml            - Docker Compose 설정
```

---

## 5. 서버 접속 정보

### Mac Mini (Backend)

```bash
# SSH 접속
ssh woosun@100.123.51.5

# Docker 명령 (PATH 필요)
export PATH=$PATH:/usr/local/bin

# 서비스 재시작
cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini
docker compose restart backend

# 로그 확인
docker logs sparklio-backend --tail 100
```

### 프로젝트 경로

- Mac Mini: `/Users/woosun/sparklio_ai_marketing_studio`
- Windows (K:): `K:\sparklio_ai_marketing_studio`

---

## 6. Gemini API 참고

- **모델**: gemini-2.0-flash
- **제한**: 무료 티어 15 RPM (분당 15 요청)
- **API Key**: `.env`의 `GOOGLE_API_KEY`
- **호출 방식**: `override_model="gemini-2.0-flash"` 사용

---

## 7. 다음 클로드를 위한 체크리스트

- [ ] A팀 테스트 결과 확인
- [ ] 추가 에러 발생 시 서버 로그 분석
- [ ] Gemini API 정상 동작 확인
- [ ] P2 작업 (Asset 생성 로직) 진행 여부 결정

---

**작성완료**: 2025-11-26 (수요일) 18:35
