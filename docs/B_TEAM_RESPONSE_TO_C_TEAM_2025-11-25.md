# B팀 → C팀 협조요청 응답

**작성일**: 2025-11-25
**작성팀**: B팀 (Backend)
**수신팀**: C팀 (Frontend)
**상태**: ✅ 수정 완료

---

## 1. 요약

C팀 요청사항 중 **error_message 필드 추가** 완료했습니다.
이제 YouTube 다운로드 실패 시 Frontend에서 에러 원인을 확인할 수 있습니다.

---

## 2. 완료된 수정사항

### 2.1 Meeting 모델 수정
- **파일**: `backend/app/models/meeting.py`
- **변경**: `error_message` 컬럼 추가 (Text, nullable)

### 2.2 MeetingResponse 스키마 수정
- **파일**: `backend/app/schemas/meeting.py`
- **변경**: `error_message` 필드 추가

### 2.3 YouTubeDownloader 수정
- **파일**: `backend/app/services/youtube_downloader.py`
- **변경**: `download_audio()` 반환값 변경
  - 기존: `bool` (성공/실패만)
  - 변경: `Tuple[bool, Optional[str]]` (성공여부, 에러메시지)

### 2.4 MeetingURLPipeline 수정
- **파일**: `backend/app/services/meeting_url_pipeline.py`
- **변경**: 에러 발생 시 `meeting.error_message`에 저장

### 2.5 DB 마이그레이션 추가
- **파일**: `backend/alembic/versions/a1b2c3d4e5f6_add_meeting_error_message.py`
- **내용**: `meetings` 테이블에 `error_message` 컬럼 추가

---

## 3. API 응답 변경사항

### 3.1 기존 응답 (변경 전)
```json
{
  "id": "b4faee1a-def8-4ab7-8cf0-5a8f80b6657e",
  "title": "YouTube Video",
  "status": "download_failed",
  "meeting_metadata": {
    "source_url": "https://www.youtube.com/watch?v=zjHrjyhv1s4"
  }
}
```

### 3.2 새로운 응답 (변경 후)
```json
{
  "id": "b4faee1a-def8-4ab7-8cf0-5a8f80b6657e",
  "title": "YouTube Video",
  "status": "download_failed",
  "error_message": "yt-dlp error: ERROR: Video unavailable...",
  "meeting_metadata": {
    "source_url": "https://www.youtube.com/watch?v=zjHrjyhv1s4"
  }
}
```

---

## 4. 예상되는 에러 메시지 유형

| 에러 유형 | error_message 예시 |
|----------|-------------------|
| yt-dlp 미설치 | `yt-dlp not installed. Please install: pip install yt-dlp` |
| 영상 비공개/삭제 | `yt-dlp error: ERROR: Video unavailable` |
| 연령 제한 영상 | `yt-dlp error: ERROR: Sign in to confirm your age` |
| 지역 제한 | `yt-dlp error: ERROR: The uploader has not made this video available in your country` |
| 타임아웃 | `Download timeout (>5min) for https://...` |
| 네트워크 오류 | `Download failed: Connection refused` |
| STT 실패 | `STT failed: Whisper timeout` |

---

## 5. 배포 필요사항

### 5.1 Mac mini 서버에서 실행 필요
```bash
# 1. DB 마이그레이션 적용
cd /path/to/backend
alembic upgrade head

# 2. 서버 재시작
# (Docker 사용 시)
docker-compose restart backend

# (직접 실행 시)
pkill -f uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

### 5.2 yt-dlp 설치 확인
```bash
# yt-dlp 버전 확인
yt-dlp --version

# 미설치 시 설치
pip install yt-dlp

# 업데이트 (이미 설치된 경우)
pip install -U yt-dlp
```

---

## 6. YouTube 다운로드 근본 원인 조사

### 6.1 확인 필요사항 (Mac mini 서버에서)
```bash
# 1. yt-dlp 설치 확인
which yt-dlp
yt-dlp --version

# 2. 수동 다운로드 테스트
yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=zjHrjyhv1s4"

# 3. ffmpeg 설치 확인 (오디오 변환용)
which ffmpeg
ffmpeg -version

# 4. Node.js 설치 확인 (yt-dlp JS 런타임용)
which node
node --version
```

### 6.2 추정 원인
1. **yt-dlp 미설치**: Mac mini에 yt-dlp가 설치되지 않았을 가능성
2. **ffmpeg 미설치**: 오디오 추출 실패
3. **YouTube 정책 변경**: yt-dlp 버전 업데이트 필요
4. **네트워크 문제**: 서버에서 YouTube 접근 불가

---

## 7. Frontend 대응 가이드

### 7.1 error_message 표시 예시
```typescript
// MeetingTab.tsx에서 에러 메시지 표시
{meeting.status === 'download_failed' && meeting.error_message && (
  <div className="text-red-500 text-sm mt-1">
    {meeting.error_message}
  </div>
)}
```

### 7.2 에러 유형별 사용자 친화적 메시지
```typescript
function getErrorDisplay(errorMessage: string): string {
  if (errorMessage.includes('not installed')) {
    return '서버 설정 오류 - 관리자에게 문의하세요';
  }
  if (errorMessage.includes('Video unavailable')) {
    return '영상을 찾을 수 없습니다 (비공개/삭제됨)';
  }
  if (errorMessage.includes('Sign in')) {
    return '연령 제한 영상은 지원되지 않습니다';
  }
  if (errorMessage.includes('timeout')) {
    return '다운로드 시간 초과 - 다시 시도해주세요';
  }
  return '다운로드 실패 - 다시 시도해주세요';
}
```

---

## 8. 다음 단계

1. **Mac mini 서버 확인 필요**
   - yt-dlp, ffmpeg, Node.js 설치 상태 확인
   - 수동 YouTube 다운로드 테스트

2. **마이그레이션 적용**
   - `alembic upgrade head` 실행

3. **서버 재시작**
   - Backend 서버 재시작하여 코드 변경 반영

---

**수정 완료되었습니다. 추가 문의사항 있으시면 말씀해주세요.**

*B팀 드림*
