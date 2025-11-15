# 수정 요청서 템플릿

**파일명 형식**: `TEAMNAME_MODIFICATION_REQUEST_NNN.md`
- 예: `BACKEND_MODIFICATION_REQUEST_001.md`
- 예: `FRONTEND_MODIFICATION_REQUEST_001.md`

---

# 수정 요청서 #NNN

## 기본 정보

| 항목 | 내용 |
|------|------|
| 요청 팀 | [A팀/B팀/C팀] |
| 대상 팀 | [A팀/B팀/C팀] |
| 요청일 | YYYY-MM-DD |
| 요청자 | [이름] |
| 우선순위 | [High/Medium/Low] |
| 희망 완료일 | YYYY-MM-DD |

---

## 요청 내용

### 1. 요청 사유
**왜 이 수정이 필요한가요?**

[구체적인 사유 작성]

예시:
- Frontend에서 SmartRouter API 호출 시 CORS 에러 발생
- Editor에서 Asset 업로드 API 필요
- 인증 토큰 갱신 API 필요

---

### 2. 수정이 필요한 파일 및 위치

**대상 폴더**: `[backend/ | frontend/ | docs/]`

**수정 파일 목록**:
- [ ] `경로/파일명.확장자`
- [ ] `경로/파일명.확장자`

**예시**:
- [ ] `backend/app/main.py` - CORS 설정 수정
- [ ] `backend/app/api/v1/assets.py` - Asset 업로드 API 추가

---

### 3. 요청 상세

#### 3.1 현재 상태
```
[현재 코드 또는 상황 설명]
```

#### 3.2 원하는 결과
```
[수정 후 기대하는 코드 또는 동작]
```

#### 3.3 API 요청인 경우
**엔드포인트**: `POST /api/v1/example`

**요청 예시**:
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**응답 예시**:
```json
{
  "status": "success",
  "data": {
    "result": "..."
  }
}
```

---

### 4. 테스트 방법

**수정 완료 후 다음 방법으로 테스트합니다**:

```bash
# 테스트 명령어 또는 절차
curl -X POST http://100.123.51.5:8000/api/v1/example \
  -H "Content-Type: application/json" \
  -d '{"field1": "value1"}'
```

**기대 결과**:
- [ ] 응답 코드: 200
- [ ] 응답 본문: `{"status": "success"}`

---

### 5. 참고 자료

**관련 문서**:
- [AGENT_IO_SCHEMA_CATALOG.md](../AGENT_IO_SCHEMA_CATALOG.md)
- [SMART_ROUTER_SPEC.md](../SMART_ROUTER_SPEC.md)

**관련 이슈**:
- GitHub Issue #123
- Slack 대화 링크

---

## 진행 상황

| 날짜 | 상태 | 담당자 | 비고 |
|------|------|--------|------|
| YYYY-MM-DD | 요청됨 | [요청자] | 초기 요청 |
| YYYY-MM-DD | 진행 중 | [담당자] | 작업 시작 |
| YYYY-MM-DD | 완료 | [담당자] | 커밋: abc123 |
| YYYY-MM-DD | 테스트 완료 | [요청자] | 확인 완료 |

---

## 상태 코드

- **요청됨**: 수정 요청이 접수됨
- **검토 중**: 대상 팀에서 검토 중
- **진행 중**: 수정 작업 진행 중
- **완료**: 수정 완료, Git 커밋됨
- **테스트 대기**: 요청 팀의 테스트 대기
- **테스트 완료**: 요청 팀 테스트 통과
- **종료**: 요청 완전 종료

---

## 커밋 정보 (완료 시 작성)

**커밋 해시**: `abc123def456`
**커밋 메시지**: `feat(api): Add asset upload endpoint`
**PR 링크**: https://github.com/...

---

## 체크리스트 (대상 팀 작성)

### 수정 전
- [ ] 요청 내용 이해
- [ ] 영향 범위 분석
- [ ] 다른 기능에 영향 없는지 확인

### 수정 중
- [ ] 코드 작성
- [ ] 단위 테스트 작성
- [ ] 로컬 테스트 통과

### 수정 후
- [ ] Git commit
- [ ] Git push
- [ ] 요청 팀에 알림
- [ ] 요청서 상태 업데이트

---

## 의견 및 질문

### [날짜] - [작성자]
> 질문이나 의견 작성

### [날짜] - [작성자]
> 답변 또는 추가 의견

---

**요청서 종료일**: YYYY-MM-DD
