# 백엔드 서버 시작 요청서

**작성일**: 2025-11-16 (토요일) 21:57
**요청 팀**: C팀 (Frontend Team)
**긴급도**: 🔴 HIGH (통합 테스트 차단 중)

---

## 📋 요청 사항

**백엔드 서버를 시작해주세요**

- **서버 주소**: `http://100.123.51.5:8000`
- **Health Check 엔드포인트**: `http://100.123.51.5:8000/health`

---

## 🎯 요청 배경

### 현재 상황
- Frontend에서 **Canvas Studio → Main App 통합 작업** 완료
- Main App (`http://localhost:3001`) 로그인 기능 테스트 필요
- 백엔드 서버 미응답으로 로그인 불가 (ERR_CONNECTION_REFUSED)

### 작업 완료 내역
1. ✅ Canvas Studio (VSCode 스타일 에디터)를 Main App에 통합
2. ✅ 로그인/회원가입 화면 구현
3. ✅ Layers Panel, Inspector Panel, Undo/Redo 등 고급 기능 모두 포함
4. ⏸️ **로그인 테스트 차단 중** (백엔드 서버 필요)

---

## 🔍 필요한 엔드포인트

### 1. 인증 관련
- `POST /auth/login` - 로그인
- `POST /auth/register` - 회원가입
- `GET /auth/me` - 현재 사용자 정보
- `POST /auth/logout` - 로그아웃

### 2. Health Check
- `GET /health` - 서버 상태 확인

---

## 📝 테스트 계정 (이미 준비됨)

Frontend에서 사용할 테스트 계정:
- **admin@sparklio.com** / admin1234 (관리자)
- **test@sparklio.com** / test1234 (일반 사용자)
- **dev@sparklio.com** / dev1234 (개발용)

위 계정들이 백엔드 DB에 등록되어 있는지 확인 부탁드립니다.

---

## ⏰ 작업 일정

**남은 작업 시간**: ~1시간

다음 작업 예정:
1. 백엔드 서버 시작 확인
2. Main App 로그인 테스트
3. Canvas Studio 통합 기능 테스트
4. Git 커밋 및 푸시
5. 작업 보고서 작성

**백엔드 서버가 시작되면 즉시 테스트를 진행하겠습니다.**

---

## 🔧 서버 시작 확인 방법

백엔드 서버를 시작하신 후, 다음 명령어로 확인 가능합니다:

```bash
curl http://100.123.51.5:8000/health
```

또는 브라우저에서:
```
http://100.123.51.5:8000/health
```

정상 응답 예시:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T12:57:00Z"
}
```

---

## 📞 연락처

- **요청 팀**: C팀 Frontend
- **Slack**: #team-c-frontend (있다면)
- **이슈 트래커**: Canvas Studio 통합 작업 (Phase 2-1)

---

## ✅ 체크리스트

백엔드 팀에서 확인 부탁드립니다:

- [ ] 백엔드 서버 시작 (`http://100.123.51.5:8000`)
- [ ] Health Check 엔드포인트 응답 확인
- [ ] 테스트 계정 DB 등록 확인
  - [ ] admin@sparklio.com
  - [ ] test@sparklio.com
  - [ ] dev@sparklio.com
- [ ] CORS 설정 확인 (Frontend `http://localhost:3001` 허용)

---

**감사합니다! 🙏**

서버가 시작되면 Frontend 팀에 알려주시면 즉시 테스트를 진행하겠습니다.
