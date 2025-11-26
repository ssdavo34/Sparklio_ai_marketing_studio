# C팀 → B팀 협조요청서

**작성일**: 2025-11-26 (수요일) 10:25
**작성팀**: C팀 (Frontend)
**수신팀**: B팀 (Backend)
**긴급도**: 높음

---

## 1. 요약

어제(11-25) 작업에서 발견된 **STT 파이프라인 버그**가 아직 미해결 상태입니다.
이 버그가 수정되어야 Meeting AI 전체 플로우 테스트가 가능합니다.

---

## 2. 미해결 버그 (최우선)

### 2.1 TranscriptionResult.elapsed_seconds 오류

**에러 메시지**:
```
"error_message": "STT failed: 'TranscriptionResult' object has no attribute 'elapsed_seconds'"
```

**발생 위치**: STT(Whisper) 처리 후 결과 저장 시점

**추정 원인**:
- `TranscriptionResult` 클래스에 `elapsed_seconds` 속성이 없거나
- 해당 속성을 잘못 접근하고 있음

**수정 방법 제안**:
```python
# 방법 1: TranscriptionResult 클래스에 속성 추가
@dataclass
class TranscriptionResult:
    text: str
    segments: List[dict]
    elapsed_seconds: float = 0.0  # 기본값 추가

# 방법 2: 안전한 속성 접근 (hasattr 또는 getattr 사용)
elapsed = getattr(result, 'elapsed_seconds', 0.0)

# 방법 3: try-except로 감싸기
try:
    elapsed = result.elapsed_seconds
except AttributeError:
    elapsed = 0.0
```

**관련 파일 (추정)**:
- `backend/app/services/transcriber.py` 또는 관련 STT 서비스 파일
- `TranscriptionResult` 클래스 정의 파일

---

## 3. 어제 해결된 사항 (참고)

| 이슈 | 상태 | 해결 시간 |
|------|------|----------|
| `StorageService.upload_file_async` 메서드 없음 | ✅ 해결됨 | 11-25 오후 |
| OPENAI_API_KEY 미설정 | ✅ 해결됨 | 11-25 오후 |
| MinIO `meetings` 버킷 없음 | ✅ 해결됨 | 11-25 오후 |
| `error_message` 필드 추가 | ✅ 해결됨 | 11-25 오후 |

---

## 4. GPU 서버 상태 확인 요청

### 4.1 Faster-Whisper 서비스 상태

어제 B팀 인수인계 문서에 따르면:
- GPU 서버(100.120.180.42) SSH 접속 불가
- Faster-Whisper 서비스 연결 실패

**확인 필요**:
```bash
# GPU 서버에서 Whisper 서비스 상태 확인
curl http://100.120.180.42:9000/health

# 서비스 미실행 시 시작
# (GPU 서버 로컬에서 실행 필요)
```

### 4.2 SSH 서버 시작 (Windows Desktop)

GPU 서버(Windows)에서 SSH 서버 시작이 필요할 수 있음:
```powershell
# PowerShell (관리자 권한)
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

---

## 5. Meeting AI 파이프라인 현황

| 단계 | 상태 | 비고 |
|------|------|------|
| 1. YouTube URL 입력 | ✅ Frontend 완료 | `createMeetingFromUrl()` |
| 2. Meeting 생성 | ✅ 작동 | `POST /api/v1/meetings/from-url` |
| 3. YouTube 다운로드 | ✅ 작동 | yt-dlp 정상 |
| 4. MinIO 업로드 | ✅ 작동 | `meetings` 버킷 |
| 5. Caption 추출 | ✅ 작동 | `status: "caption_ready"` |
| 6. STT (Whisper) | ❌ **버그** | `elapsed_seconds` 오류 |
| 7. Analysis | ⏳ 대기 | STT 완료 후 진행 |
| 8. Canvas 전송 | ✅ Frontend 완료 | `handleSendToCanvas()` |

**블로킹 포인트**: 6단계 STT 버그

---

## 6. 요청 사항 정리

### 6.1 필수 (P0)

1. **`TranscriptionResult.elapsed_seconds` 버그 수정**
   - 위 2.1 섹션 참조
   - 이 버그 수정이 되어야 전체 파이프라인 테스트 가능

2. **GPU 서버 Whisper 서비스 상태 확인**
   - 서비스가 실행 중인지 확인
   - 미실행 시 시작

### 6.2 선택 (P1)

3. **에러 메시지 개선**
   - 현재 `error_message` 필드 추가됨 (감사합니다!)
   - STT 실패 시에도 상세 에러 메시지 저장되도록 확인

---

## 7. Frontend 준비 상태

C팀에서는 다음 기능을 모두 완료하고 Backend 수정을 대기 중입니다:

| 기능 | 상태 | 파일 |
|------|------|------|
| YouTube URL 입력 UI | ✅ 완료 | `MeetingTab.tsx` |
| Meeting 생성 API 연동 | ✅ 완료 | `meeting-api.ts` |
| 상태 Polling (3초) | ✅ 완료 | `MeetingTab.tsx` |
| 에러 상태 표시 | ✅ 완료 | `error_message` 활용 가능 |
| 선택 모드 (체크박스) | ✅ 완료 | `MeetingTab.tsx` |
| 일괄 삭제 | ✅ 완료 | `MeetingTab.tsx` |
| Canvas 전송 | ✅ 완료 | `handleSendToCanvas()` |

**Backend STT 버그 수정되면 즉시 E2E 테스트 진행하겠습니다.**

---

## 8. 테스트 환경

| 항목 | 값 |
|------|-----|
| Frontend URL | http://localhost:3000/studio/v3 |
| Backend API | http://100.123.51.5:8000 |
| Whisper API | http://100.120.180.42:9000 |
| Git 브랜치 | `feature/editor-migration-polotno` |

---

## 9. 연락처

- **C팀**: Frontend 담당
- **요청서 파일**: `docs/C_TEAM_TO_B_TEAM_REQUEST_2025-11-26.md`
- **어제 인수인계**: `docs/C_TEAM_HANDOVER_2025-11-25.md`

---

## 10. 참조 문서

- [C팀 인수인계 (11-25)](./C_TEAM_HANDOVER_2025-11-25.md)
- [B팀 인수인계 (11-25)](./HANDOVER_2025-11-25_B_TEAM.md)
- [B팀 응답 (11-25)](./B_TEAM_RESPONSE_TO_C_TEAM_2025-11-25.md)

---

**협조 부탁드립니다. 감사합니다!**

*C팀 드림*
