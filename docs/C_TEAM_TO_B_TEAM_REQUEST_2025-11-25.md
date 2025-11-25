# C팀 → B팀 협조요청서 (Updated)

**작성일**: 2025-11-25
**업데이트**: 2025-11-25 15:13
**작성팀**: C팀 (Frontend)
**수신팀**: B팀 (Backend - Meeting AI)
**긴급도**: 높음

---

## 0. 최신 업데이트 (2025-11-25 15:13)

### 원인 발견!
```
"error_message": "Download failed: 'StorageService' object has no attribute 'upload_file_async'"
```

**StorageService 클래스에 `upload_file_async` 메서드가 없습니다.**

### 수정 필요
- `StorageService` 클래스에 `upload_file_async` 메서드 추가
- 또는 호출하는 코드에서 올바른 메서드명 사용

---

## 1. 요약

Meeting AI 모듈 테스트 중 **YouTube URL 처리 시 Download Failed 오류**가 지속적으로 발생하고 있습니다. Frontend에서는 정상적으로 API 요청을 보내고 있으나, Backend에서 YouTube 영상 다운로드에 실패하고 있습니다.

---

## 2. 발생 현상

### 2.1 증상
- YouTube URL 입력 후 Meeting 생성 시 `status: "download_failed"` 반환
- 모든 YouTube URL에서 동일 증상 발생
- 테스트한 URL 예시:
  - `https://www.youtube.com/watch?v=zjHrjyhv1s4`
  - 기타 다수의 YouTube URL

### 2.2 API 응답 예시
```json
{
  "id": "b4faee1a-def8-4ab7-8cf0-5a8f80b6657e",
  "title": "YouTube Video",
  "description": "Imported from: https://www.youtube.com/watch?v=zjHrjyhv1s4",
  "status": "download_failed",
  "meeting_metadata": {
    "source_url": "https://www.youtube.com/watch?v=zjHrjyhv1s4"
  },
  "created_at": "2025-11-25T03:05:12.643874",
  "updated_at": "2025-11-25T03:05:23.444217"
}
```

### 2.3 Frontend 호출 코드
```typescript
// meeting-api.ts - createMeetingFromUrl
const response = await fetch(`${API_BASE}/api/v1/meetings/from-url`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: request.url,           // YouTube URL
    title: request.title,       // "YouTube Video"
    source_type: 'youtube',     // 자동 감지
  }),
});
```

---

## 3. 추정 원인

### 3.1 yt-dlp 관련
- [ ] yt-dlp 미설치 또는 버전 문제
- [ ] yt-dlp 실행 권한 문제
- [ ] yt-dlp 설정 파일 오류

### 3.2 네트워크 관련
- [ ] 서버 IP가 YouTube에서 차단됨
- [ ] 프록시/VPN 설정 필요
- [ ] 방화벽에서 YouTube 접근 차단

### 3.3 서버 환경 관련
- [ ] ffmpeg 미설치 (오디오 추출 실패)
- [ ] 임시 디렉토리 권한 문제
- [ ] 디스크 용량 부족

---

## 4. 요청 사항

### 4.1 즉시 확인 필요
1. **yt-dlp 설치 확인**
   ```bash
   yt-dlp --version
   which yt-dlp
   ```

2. **수동 다운로드 테스트**
   ```bash
   yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=zjHrjyhv1s4"
   ```

3. **Backend 로그 확인**
   - `/api/v1/meetings/from-url` 엔드포인트 호출 시 서버 로그
   - yt-dlp 실행 시 에러 메시지

### 4.2 수정 요청
1. **에러 상세 정보 반환**
   - 현재: `status: "download_failed"` 만 반환
   - 요청: `error_message` 필드 추가하여 실패 원인 전달
   ```json
   {
     "status": "download_failed",
     "error_message": "yt-dlp: ERROR: Video unavailable"
   }
   ```

2. **Fallback 처리**
   - YouTube 다운로드 실패 시 Caption만 추출하는 옵션 제공

---

## 5. 테스트 환경 정보

| 항목 | 값 |
|------|-----|
| Frontend URL | http://localhost:3000/studio/v3 |
| Backend API | http://100.123.51.5:8000 |
| 테스트 시간 | 2025-11-25 오전 11:00 ~ 12:30 |
| 테스트 횟수 | 약 10회 (모두 실패) |
| CORS | 정상 (이전 세션에서 해결됨) |

---

## 6. Frontend 준비 상태

C팀에서는 다음 기능을 이미 구현 완료했습니다:

| 기능 | 상태 | 비고 |
|------|------|------|
| YouTube URL 입력 UI | ✅ 완료 | URL 자동 감지 (youtube/other) |
| Meeting 생성 API 연동 | ✅ 완료 | POST /api/v1/meetings/from-url |
| Polling (상태 추적) | ✅ 완료 | 3초 간격 |
| 에러 상태 표시 | ✅ 완료 | Download Failed 배지 |
| 삭제 기능 | ✅ 완료 | 개별/일괄 삭제 |

**Backend 다운로드 기능이 정상화되면 즉시 E2E 테스트 가능합니다.**

---

## 7. 연락처

- **C팀 담당자**: Frontend 개발자
- **긴급 연락**: 이 문서 확인 후 Slack/Discord로 회신 부탁드립니다

---

## 8. 첨부

### 8.1 스크린샷
- Meeting 목록에서 모든 YouTube 항목이 "Download Failed" 상태로 표시됨

### 8.2 관련 파일
- `frontend/components/canvas-studio/panels/left/tabs/MeetingTab.tsx`
- `frontend/lib/api/meeting-api.ts`
- `frontend/types/meeting.ts`

---

**협조 부탁드립니다. 감사합니다.**

*C팀 드림*
