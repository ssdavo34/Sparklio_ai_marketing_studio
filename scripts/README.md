# Sparklio 자동화 스크립트

이 폴더에는 팀별 작업 자동화 스크립트가 있습니다.

---

## 사용 방법

### B팀 (Backend)
```
1. 작업 시작: scripts/b-team-start.bat 더블클릭
2. 작업 종료: scripts/b-team-end.bat 더블클릭
```

### C팀 (Frontend)
```
1. 작업 시작: scripts/c-team-start.bat 더블클릭
2. 작업 종료: scripts/c-team-end.bat 더블클릭
```

### Mac mini 배포
```
scripts/deploy-to-macmini.bat 더블클릭
```

---

## 스크립트 목록

| 파일 | 용도 |
|------|------|
| `b-team-start.bat` | B팀 작업 환경 시작, 연결 테스트 |
| `b-team-end.bat` | B팀 작업 종료, 인수인계 체크리스트 |
| `c-team-start.bat` | C팀 작업 환경 시작, Node.js 확인 |
| `c-team-end.bat` | C팀 작업 종료, 인수인계 체크리스트 |
| `deploy-to-macmini.bat` | Mac mini에 백엔드 배포 |
| `HANDOVER_TEMPLATE.md` | 인수인계 문서 템플릿 |

---

## 스크립트가 하는 일

### 시작 스크립트 (start.bat)
1. 프로젝트 폴더 확인
2. Git 상태 확인
3. Mac mini 연결 테스트
4. API 헬스체크
5. 환경변수 파일 확인
6. CLAUDE.md 안내

### 종료 스크립트 (end.bat)
1. 변경된 파일 목록
2. 커밋 안 된 변경 확인
3. 오늘 커밋 이력
4. 인수인계 체크리스트 표시

---

## 주의사항

- 스크립트 실행 전에 Tailscale이 연결되어 있어야 합니다.
- Mac mini IP: `100.123.51.5`
- Desktop GPU IP: `100.120.180.42`

---

## 문제 해결

### "Mac mini 연결 불가"
- Tailscale 앱 실행 확인
- VPN 연결 상태 확인

### "백엔드 API 응답 없음"
```bash
# Mac mini에서 Docker 상태 확인
ssh woosun@100.123.51.5
docker ps
docker logs sparklio-backend --tail 50
```

---

**최초 작성**: 2025-11-28 (B팀)
