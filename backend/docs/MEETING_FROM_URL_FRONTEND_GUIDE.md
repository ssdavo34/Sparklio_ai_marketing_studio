# Meeting From URL - C팀 작업 지침 (Frontend)

작성일: 2025-11-24
버전: v1.0
대상: C팀 (Frontend)
참조: [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)

---

## 📌 필수 선행 작업

1. **API Contract 숙지**
   - `MEETING_FROM_URL_CONTRACT.md` 전체 읽기
   - Meeting status enum 8개 값 확인
   - 폴링 규칙 확인 (3초 간격)

2. **기존 코드 파악**
   - `lib/api/meeting-api.ts` - Meeting API 클라이언트
   - MeetingTab 컴포넌트 확인
   - Meeting 타입 정의 확인

---

## 🎯 구현 목표

**최종 목표**: URL 입력 → Meeting 생성 → 상태 폴링 → 완료 시 Transcript 표시

**주요 기능**:
1. URL 입력 폼 (YouTube URL)
2. Meeting 생성 (POST /api/v1/meetings/from-url)
3. 상태 폴링 (3초 간격)
4. 진행 상황 표시 (Progress bar + Status text)
5. 완료 시 Transcript 페이지로 이동

---

## 📁 파일 구조

### 새로 만들 파일

```
frontend/
├── src/
│   ├── lib/
│   │   └── api/
│   │       └── meeting-api.ts              # ← createFromUrl 함수 추가
│   ├── components/
│   │   └── meeting/
│   │       ├── MeetingFromURL.tsx          # ← URL 입력 폼
│   │       ├── MeetingStatusBadge.tsx      # ← Status 표시 배지
│   │       └── MeetingProcessing.tsx       # ← 진행 상황 표시
│   └── types/
│       └── meeting.ts                       # ← MeetingStatus enum 추가
```

### 수정할 파일

```
frontend/
└── src/
    └── components/
        └── meeting/
            └── MeetingTab.tsx              # ← "URL로부터 생성" 버튼 추가
```

---

## 🚀 Step 1: API 클라이언트 수정 (30분)

### 1.1. MeetingStatus Enum 추가

**파일**: `src/types/meeting.ts`

```typescript
/**
 * Meeting 상태
 *
 * 계약서 참조: MEETING_FROM_URL_CONTRACT.md - Section 2
 */
export enum MeetingStatus {
  // 기존 상태 (파일 업로드용)
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',

  // Meeting From URL 전용
  CREATED = 'created',             // Meeting 레코드 생성됨
  DOWNLOADING = 'downloading',     // URL에서 다운로드 중
  CAPTION_READY = 'caption_ready', // Caption transcript 준비됨
  READY_FOR_STT = 'ready_for_stt', // 오디오 다운로드 완료
  TRANSCRIBING = 'transcribing',   // STT 진행 중
  READY = 'ready',                 // Primary transcript 준비됨
  DOWNLOAD_FAILED = 'download_failed', // 다운로드 실패
  STT_FAILED = 'stt_failed'        // STT 실패
}

/**
 * Meeting 타입
 */
export interface Meeting {
  id: string
  owner_id: number
  title: string
  status: MeetingStatus
  file_url?: string
  created_at: string
  updated_at: string
  // ... 기타 필드
}

/**
 * URL로부터 Meeting 생성 요청
 */
export interface MeetingFromURLRequest {
  url: string
  title?: string
  description?: string
  brand_id?: string
  project_id?: string
  auto_transcribe?: boolean
}

/**
 * URL로부터 Meeting 생성 응답
 */
export interface MeetingFromURLResponse {
  meeting_id: string
  status: MeetingStatus
  message: string
  transcription_started: boolean
}
```

### 1.2. meeting-api.ts에 createFromUrl 추가

**파일**: `src/lib/api/meeting-api.ts`

```typescript
// 기존 imports에 추가
import type { MeetingFromURLRequest, MeetingFromURLResponse } from '@/types/meeting'

// meetingApi 객체에 추가
export const meetingApi = {
  // ... 기존 메서드들 (create, list, get 등)

  /**
   * URL로부터 Meeting 생성
   *
   * @param request URL 및 옵션
   * @returns Meeting ID 및 상태
   */
  async createFromUrl(request: MeetingFromURLRequest): Promise<MeetingFromURLResponse> {
    const response = await fetch(`${API_BASE_URL}/meetings/from-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create meeting from URL')
    }

    return response.json()
  },

  /**
   * Meeting 상태 조회 (폴링용)
   *
   * @param meetingId Meeting ID
   * @returns Meeting 정보
   */
  async getMeetingStatus(meetingId: string): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get meeting status')
    }

    return response.json()
  },
}
```

---

## 🚀 Step 2: Status 표시 컴포넌트 (1시간)

### 2.1. MeetingStatusBadge 컴포넌트

**파일**: `src/components/meeting/MeetingStatusBadge.tsx`

```tsx
/**
 * Meeting 상태 배지
 *
 * Status별로 색상과 텍스트를 다르게 표시
 */

import { MeetingStatus } from '@/types/meeting'
import { Badge } from '@/components/ui/badge'

interface MeetingStatusBadgeProps {
  status: MeetingStatus
}

/**
 * Status → 표시 텍스트 매핑
 *
 * 계약서 참조: MEETING_FROM_URL_CONTRACT.md - Section 2
 */
const STATUS_TEXT: Record<MeetingStatus, string> = {
  [MeetingStatus.PENDING]: '대기',
  [MeetingStatus.PROCESSING]: '처리 중',
  [MeetingStatus.COMPLETED]: '완료',
  [MeetingStatus.FAILED]: '실패',

  [MeetingStatus.CREATED]: '생성됨',
  [MeetingStatus.DOWNLOADING]: '다운로드 중',
  [MeetingStatus.CAPTION_READY]: '자막 준비됨',
  [MeetingStatus.READY_FOR_STT]: '음성 인식 대기',
  [MeetingStatus.TRANSCRIBING]: '음성 인식 중',
  [MeetingStatus.READY]: '완료',
  [MeetingStatus.DOWNLOAD_FAILED]: '다운로드 실패',
  [MeetingStatus.STT_FAILED]: '음성 인식 실패',
}

/**
 * Status → 색상 매핑
 */
const STATUS_VARIANT = {
  [MeetingStatus.PENDING]: 'secondary',
  [MeetingStatus.PROCESSING]: 'default',
  [MeetingStatus.COMPLETED]: 'success',
  [MeetingStatus.FAILED]: 'destructive',

  [MeetingStatus.CREATED]: 'secondary',
  [MeetingStatus.DOWNLOADING]: 'default',
  [MeetingStatus.CAPTION_READY]: 'default',
  [MeetingStatus.READY_FOR_STT]: 'default',
  [MeetingStatus.TRANSCRIBING]: 'default',
  [MeetingStatus.READY]: 'success',
  [MeetingStatus.DOWNLOAD_FAILED]: 'destructive',
  [MeetingStatus.STT_FAILED]: 'destructive',
} as const

export function MeetingStatusBadge({ status }: MeetingStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {STATUS_TEXT[status]}
    </Badge>
  )
}
```

### 2.2. MeetingProcessing 컴포넌트

**파일**: `src/components/meeting/MeetingProcessing.tsx`

```tsx
/**
 * Meeting 처리 진행 상황 표시
 *
 * 폴링하면서 실시간 상태 업데이트
 */

import { useState, useEffect, useCallback } from 'react'
import { MeetingStatus } from '@/types/meeting'
import { meetingApi } from '@/lib/api/meeting-api'
import { MeetingStatusBadge } from './MeetingStatusBadge'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface MeetingProcessingProps {
  meetingId: string
  onComplete?: (meetingId: string) => void
  onError?: (error: string) => void
}

/**
 * Status → 진행률 매핑 (%)
 */
const STATUS_PROGRESS: Record<MeetingStatus, number> = {
  [MeetingStatus.CREATED]: 10,
  [MeetingStatus.DOWNLOADING]: 30,
  [MeetingStatus.CAPTION_READY]: 50,
  [MeetingStatus.READY_FOR_STT]: 60,
  [MeetingStatus.TRANSCRIBING]: 80,
  [MeetingStatus.READY]: 100,
  [MeetingStatus.DOWNLOAD_FAILED]: 0,
  [MeetingStatus.STT_FAILED]: 0,
  [MeetingStatus.PENDING]: 5,
  [MeetingStatus.PROCESSING]: 50,
  [MeetingStatus.COMPLETED]: 100,
  [MeetingStatus.FAILED]: 0,
}

/**
 * 완료 상태 (폴링 중단)
 */
const FINAL_STATUSES: MeetingStatus[] = [
  MeetingStatus.READY,
  MeetingStatus.COMPLETED,
  MeetingStatus.DOWNLOAD_FAILED,
  MeetingStatus.STT_FAILED,
  MeetingStatus.FAILED,
]

/**
 * 처리 중 상태 (폴링 계속)
 */
const PROCESSING_STATUSES: MeetingStatus[] = [
  MeetingStatus.CREATED,
  MeetingStatus.DOWNLOADING,
  MeetingStatus.CAPTION_READY,
  MeetingStatus.READY_FOR_STT,
  MeetingStatus.TRANSCRIBING,
  MeetingStatus.PENDING,
  MeetingStatus.PROCESSING,
]

const POLLING_INTERVAL = 3000 // 3초
const MAX_POLLING_TIME = 5 * 60 * 1000 // 5분

export function MeetingProcessing({
  meetingId,
  onComplete,
  onError
}: MeetingProcessingProps) {
  const [status, setStatus] = useState<MeetingStatus>(MeetingStatus.CREATED)
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const router = useRouter()

  /**
   * 폴링 로직
   */
  const pollStatus = useCallback(async () => {
    try {
      const meeting = await meetingApi.getMeetingStatus(meetingId)
      setStatus(meeting.status)
      setProgress(STATUS_PROGRESS[meeting.status])

      // 완료 상태 확인
      if (FINAL_STATUSES.includes(meeting.status)) {
        if (meeting.status === MeetingStatus.READY || meeting.status === MeetingStatus.COMPLETED) {
          // 성공
          onComplete?.(meetingId)

          // Transcript 페이지로 이동 (3초 후)
          setTimeout(() => {
            router.push(`/meetings/${meetingId}`)
          }, 3000)
        } else {
          // 실패
          const errorMessage = meeting.status === MeetingStatus.DOWNLOAD_FAILED
            ? 'URL을 확인하거나 다시 시도해주세요'
            : '음성 인식 실패. 관리자에게 문의하세요'

          onError?.(errorMessage)
        }

        return false // 폴링 중단
      }

      return true // 폴링 계속
    } catch (error) {
      console.error('Failed to poll meeting status:', error)
      onError?.('상태 조회 실패')
      return false
    }
  }, [meetingId, onComplete, onError, router])

  /**
   * 폴링 시작
   */
  useEffect(() => {
    const startTime = Date.now()
    let intervalId: NodeJS.Timeout | null = null

    const startPolling = async () => {
      // 즉시 1회 실행
      const shouldContinue = await pollStatus()

      if (!shouldContinue) {
        return
      }

      // 3초 간격으로 폴링
      intervalId = setInterval(async () => {
        const elapsed = Date.now() - startTime
        setElapsedTime(elapsed)

        // 타임아웃 체크 (5분)
        if (elapsed > MAX_POLLING_TIME) {
          clearInterval(intervalId!)
          onError?.('처리 시간이 오래 걸리고 있습니다. 잠시 후 다시 확인해주세요.')
          return
        }

        const shouldContinue = await pollStatus()

        if (!shouldContinue) {
          clearInterval(intervalId!)
        }
      }, POLLING_INTERVAL)
    }

    startPolling()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [pollStatus, onError])

  /**
   * 경과 시간 포맷 (MM:SS)
   */
  const formatElapsedTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Meeting 처리 중</span>
          <MeetingStatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {progress}% 완료
          </p>
        </div>

        {/* 경과 시간 */}
        <p className="text-sm text-muted-foreground text-center">
          경과 시간: {formatElapsedTime(elapsedTime)}
        </p>

        {/* 상태별 안내 메시지 */}
        <div className="text-sm text-center">
          {status === MeetingStatus.DOWNLOADING && (
            <p>URL에서 오디오와 자막을 가져오는 중입니다...</p>
          )}
          {status === MeetingStatus.TRANSCRIBING && (
            <p>음성을 텍스트로 변환하는 중입니다. 잠시만 기다려주세요...</p>
          )}
          {status === MeetingStatus.READY && (
            <p className="text-green-600">
              완료되었습니다! Transcript 페이지로 이동합니다...
            </p>
          )}
          {(status === MeetingStatus.DOWNLOAD_FAILED || status === MeetingStatus.STT_FAILED) && (
            <p className="text-red-600">
              처리 중 오류가 발생했습니다.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🚀 Step 3: URL 입력 폼 (1시간)

### 3.1. MeetingFromURL 컴포넌트

**파일**: `src/components/meeting/MeetingFromURL.tsx`

```tsx
/**
 * URL로부터 Meeting 생성 폼
 */

import { useState } from 'react'
import { meetingApi } from '@/lib/api/meeting-api'
import { MeetingProcessing } from './MeetingProcessing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MeetingFromURLProps {
  onSuccess?: (meetingId: string) => void
  onCancel?: () => void
}

export function MeetingFromURL({ onSuccess, onCancel }: MeetingFromURLProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)

  /**
   * URL 유효성 검사 (간단)
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Meeting 생성
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 유효성 검사
    if (!url.trim()) {
      setError('URL을 입력해주세요')
      return
    }

    if (!isValidUrl(url)) {
      setError('올바른 URL 형식이 아닙니다')
      return
    }

    setLoading(true)

    try {
      const response = await meetingApi.createFromUrl({
        url: url.trim(),
        title: title.trim() || undefined,
        auto_transcribe: true,
      })

      // Meeting 생성 성공 → 폴링 시작
      setMeetingId(response.meeting_id)
    } catch (err) {
      console.error('Failed to create meeting:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setLoading(false)
    }
  }

  /**
   * 폴링 완료 핸들러
   */
  const handleProcessingComplete = (meetingId: string) => {
    onSuccess?.(meetingId)
  }

  /**
   * 폴링 에러 핸들러
   */
  const handleProcessingError = (errorMsg: string) => {
    setError(errorMsg)
    setMeetingId(null)
    setLoading(false)
  }

  // 폴링 중이면 MeetingProcessing 표시
  if (meetingId) {
    return (
      <MeetingProcessing
        meetingId={meetingId}
        onComplete={handleProcessingComplete}
        onError={handleProcessingError}
      />
    )
  }

  // URL 입력 폼
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>URL로부터 Meeting 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL 입력 */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=xxxxx"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-sm text-muted-foreground">
              YouTube 동영상 URL을 입력하세요. 자막이 있으면 더 빠르게 처리됩니다.
            </p>
          </div>

          {/* 제목 입력 (선택) */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting 제목 (선택)</Label>
            <Input
              id="title"
              type="text"
              placeholder="회의 제목 (입력하지 않으면 자동 생성)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
```

---

## 🚀 Step 4: MeetingTab에 통합 (30분)

### 4.1. "URL로부터 생성" 버튼 추가

**파일**: `src/components/meeting/MeetingTab.tsx`

```tsx
import { useState } from 'react'
import { MeetingFromURL } from './MeetingFromURL'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function MeetingTab() {
  const [showFromURL, setShowFromURL] = useState(false)

  return (
    <div className="space-y-4">
      {/* 기존 Meeting 목록 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meetings</h2>

        <div className="flex gap-2">
          {/* 파일 업로드 버튼 (기존) */}
          <Button onClick={() => {/* 기존 로직 */}}>
            파일 업로드
          </Button>

          {/* URL로부터 생성 버튼 (신규) */}
          <Button
            variant="outline"
            onClick={() => setShowFromURL(true)}
          >
            URL로부터 생성
          </Button>
        </div>
      </div>

      {/* Meeting 목록 (기존) */}
      {/* ... */}

      {/* URL 입력 다이얼로그 */}
      <Dialog open={showFromURL} onOpenChange={setShowFromURL}>
        <DialogContent className="max-w-2xl">
          <MeetingFromURL
            onSuccess={(meetingId) => {
              console.log('Meeting created:', meetingId)
              setShowFromURL(false)
              // TODO: Meeting 목록 새로고침
            }}
            onCancel={() => setShowFromURL(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## 🧪 테스트 방법

### 시나리오 1: 자막 있는 YouTube URL (정상 케이스)

1. "URL로부터 생성" 버튼 클릭
2. URL 입력: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. 제목 입력 (선택): "테스트 회의"
4. "생성" 버튼 클릭

**예상 결과**:
- Progress bar가 0% → 100%로 진행
- Status가 "생성됨" → "다운로드 중" → "자막 준비됨" → ... → "완료"로 변경
- 3초 후 Transcript 페이지로 자동 이동

### 시나리오 2: 잘못된 URL (에러 케이스)

1. URL 입력: `https://invalid-url.com`
2. "생성" 버튼 클릭

**예상 결과**:
- "다운로드 실패" 상태
- 에러 메시지: "URL을 확인하거나 다시 시도해주세요"

### 시나리오 3: 타임아웃 (5분 이상)

1. 매우 긴 YouTube URL 입력
2. 5분 대기

**예상 결과**:
- 에러 메시지: "처리 시간이 오래 걸리고 있습니다. 잠시 후 다시 확인해주세요."

---

## ✅ 체크리스트

### API 클라이언트
- [ ] MeetingStatus enum 추가 (8개 값)
- [ ] MeetingFromURLRequest/Response 타입 추가
- [ ] meetingApi.createFromUrl 구현
- [ ] meetingApi.getMeetingStatus 구현

### 컴포넌트
- [ ] MeetingStatusBadge 컴포넌트 작성
- [ ] MeetingProcessing 컴포넌트 작성
- [ ] MeetingFromURL 컴포넌트 작성
- [ ] MeetingTab에 "URL로부터 생성" 버튼 추가

### 폴링 로직
- [ ] 3초 간격 폴링 구현
- [ ] 완료 상태에서 폴링 중단
- [ ] 5분 타임아웃 처리
- [ ] 완료 시 Transcript 페이지 이동

### 에러 처리
- [ ] URL 유효성 검사
- [ ] download_failed 에러 메시지
- [ ] stt_failed 에러 메시지
- [ ] 타임아웃 에러 메시지

### 테스트
- [ ] 시나리오 1: 정상 케이스
- [ ] 시나리오 2: 잘못된 URL
- [ ] 시나리오 3: 타임아웃

---

## 📞 B팀/A팀 협업

### B팀에게 확인할 사항

1. **API 엔드포인트 동작 확인**
   - `POST /api/v1/meetings/from-url` 호출 성공?
   - `GET /api/v1/meetings/{id}` 폴링 성공?
   - Status 전이가 계약서대로 동작하는지?

2. **에러 케이스**
   - 잘못된 URL 입력 시 `download_failed` 반환?
   - 에러 메시지 형식 확인

3. **타이밍**
   - Caption 다운로드는 얼마나 걸리는지?
   - STT는 얼마나 걸리는지?
   - 폴링 간격 3초가 적절한지?

### A팀에게 전달할 정보

1. **UI 테스트 체크리스트**
   - URL 입력 폼 동작
   - Progress bar 진행
   - Status badge 색상/텍스트
   - 에러 메시지 표시
   - 자동 페이지 이동

2. **E2E 테스트 시나리오**
   - 정상 케이스
   - 에러 케이스
   - 타임아웃 케이스

---

## 🔗 참조 문서

- [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md) - API 계약서
- [MEETING_API_TEST_GUIDE.md](MEETING_API_TEST_GUIDE.md) - API 테스트 가이드
- [MEETING_FROM_URL_BACKEND_GUIDE.md](MEETING_FROM_URL_BACKEND_GUIDE.md) - B팀 작업 지침
- [MEETING_FROM_URL_QA_GUIDE.md](MEETING_FROM_URL_QA_GUIDE.md) - A팀 작업 지침 (향후)

---

이 문서는 **C팀의 작업 지침**입니다.
A/B/C 팀 간 계약은 [MEETING_FROM_URL_CONTRACT.md](MEETING_FROM_URL_CONTRACT.md)를 참조하세요.
