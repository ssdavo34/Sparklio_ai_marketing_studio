# B팀 일일 백엔드 보고서

**작성일**: 2025-11-26 (수요일)
**작성시간**: 2025-11-26 (수요일) 18:35
**작성자**: B팀 (Backend)
**세션**: Demo Day 파이프라인 버그 수정

---

## 1. 오늘 작업 요약

### 1.1 수정된 버그 (총 4건)

| # | 커밋 | 문제 | 해결 |
|---|------|------|------|
| 1 | `e0c2466` | SQLEnum PENDING 대소문자 에러 | `values_callable` 추가로 소문자 enum value 사용 |
| 2 | `f0037b5` | LLMGateway.generate() 시그니처 불일치 | `prompt=` → `payload={"prompt":}`, `mode="json"` 분리 |
| 3 | `7ca36bb` | Ollama 404 (Router가 기본 ollama 반환) | `override_model="gemini-2.0-flash"` 파라미터 사용 |
| 4 | `c759f70` | concept_id NULL constraint 위반 | `db.add(concept)` 후 `db.flush()` 추가 |

### 1.2 수정된 파일 목록

```
backend/app/models/campaign.py           - SQLEnum values_callable 추가
backend/app/services/agents/concept.py   - LLM 호출 시그니처 + override_model
backend/app/services/agents/shorts_script.py - LLM 호출 시그니처 + override_model
backend/app/services/agents/visual_prompt.py - LLM 호출 시그니처 + override_model
backend/app/api/v1/demo.py               - db.flush() 추가
```

---

## 2. 배포 상태

### Mac Mini 서버 (100.123.51.5)

- **상태**: ✅ 정상 배포 완료
- **최신 커밋**: `c759f70`
- **Docker 컨테이너**: `sparklio-backend` 재시작됨
- **Health Check**: 정상

### 환경변수 설정 (서버에서만)

- `GOOGLE_API_KEY`: `/docker/mac-mini/.env`에 설정됨 (git에 포함 안 함)

---

## 3. A팀 전달 사항 (QA 테스트 요청)

### 3.1 테스트 대기 상태

A팀에서 마지막으로 보고한 에러:
> "SSE 연결 후 20%에서 3분간 hang 상태"

**원인**: `concept_id NULL` 에러로 인한 트랜잭션 롤백
**수정**: `c759f70` 커밋으로 해결

### 3.2 재테스트 요청

다음 API를 재테스트해 주세요:

```bash
# Meeting → Campaign 생성 API
POST /api/v1/demo/meetings/{meeting_id}/start-campaign

# SSE 스트리밍 연결
GET /api/v1/tasks/{task_id}/stream
```

### 3.3 예상 동작

1. Campaign 생성 시작 → SSE 연결
2. Progress 이벤트: 10% → 20% → 30%... → 100%
3. 3개 Concept 생성 완료
4. 각 Concept에 4개 Asset 레코드 생성 (pending 상태)
5. 최종 상태: `completed`

---

## 4. 미해결 이슈 / 다음 세션 작업

### 4.1 다음 클로드가 확인해야 할 사항

1. **A팀 테스트 결과 확인**
   - Meeting → Campaign 파이프라인 정상 동작 여부
   - Gemini API 호출 성공 여부 (서버 로그 확인)

2. **추가 에러 발생 시**
   ```bash
   ssh woosun@100.123.51.5 "export PATH=\$PATH:/usr/local/bin && docker logs sparklio-backend --tail 100"
   ```

3. **Gemini Rate Limit 주의**
   - 무료 티어: 15 RPM (분당 15 요청)
   - 연속 테스트 시 rate limit 에러 가능

### 4.2 남은 Demo Day 작업

| 우선순위 | 작업 | 상태 |
|----------|------|------|
| P1 | Meeting → Concept 파이프라인 | 🔧 테스트 대기 |
| P2 | Asset 생성 로직 (Presentation, Instagram 등) | ❌ TODO |
| P3 | Shorts Video 생성 파이프라인 | ✅ 구현 완료 (테스트 필요) |

---

## 5. 기술 참고 사항

### 5.1 LLMGateway.generate() 올바른 호출 방법

```python
# 올바른 호출
llm_response = await self.llm_gateway.generate(
    role=self.name,
    task="generate_concepts",
    payload={"prompt": prompt},      # prompt는 payload 안에
    mode="json",                      # 별도 파라미터
    override_model="gemini-2.0-flash", # Router 우회
    options={
        "temperature": 0.8,
        "max_tokens": 3000
    }
)
```

### 5.2 SQLAlchemy Concept → Asset 생성 시

```python
concept = Concept(...)
db.add(concept)
db.flush()  # ← 이 시점에 concept.id가 생성됨

asset = ConceptAsset(
    concept_id=concept.id,  # 이제 None이 아님
    ...
)
db.add(asset)
db.commit()
```

---

## 6. 커밋 로그 (오늘)

```
c759f70 fix: Concept 저장 후 flush 추가 - concept_id NULL 문제 해결
7ca36bb fix: Agent LLM 호출 시 override_model 파라미터 사용
f0037b5 fix: LLMGateway.generate() 호출 시그니처 수정
e0c2466 fix: SQLEnum values_callable 추가 - DB enum 소문자 값 매칭
bd6cb74 feat: edge-tts 패키지 추가 (Demo Day Shorts 영상 TTS용)
```

---

**다음 클로드에게**: A팀 테스트 결과를 먼저 확인하고, 추가 에러가 있으면 서버 로그 분석부터 시작하세요.
