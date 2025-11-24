# Meeting AI Transcriber 구현 일정

**작성일**: 2025-11-24 (일요일)
**대상**: B팀 (Backend)
**참조 문서**:
- [MEETING_AI_TRANSCRIBER_SPEC.md](./MEETING_AI_TRANSCRIBER_SPEC.md)
- [MEETING_AI_ARCHITECTURE.md](../../docs/MEETING_AI_ARCHITECTURE.md)
- [B_TEAM_TRANSCRIBER_IMPLEMENTATION_GUIDE_2025-11-24.md](./B_TEAM_TRANSCRIBER_IMPLEMENTATION_GUIDE_2025-11-24.md)

---

## 📅 전체 일정 요약

| Phase | 기간 | 주요 작업 | 담당 | 상태 |
|-------|------|----------|------|------|
| **Phase 0** | D-Day | 환경 준비 및 검증 | B팀 + 인프라 | ⏸️ 대기 |
| **Phase 1** | 2~3일 | 핵심 컴포넌트 구현 | B팀 | ⏸️ 대기 |
| **Phase 2** | 1~2일 | 통합 테스트 | B팀 + A팀 | ⏸️ 대기 |
| **Phase 3** | 1일 | A/C팀 연동 | 전체 | ⏸️ 대기 |
| **Phase 4** | 1일 | 배포 및 검증 | B팀 + 인프라 | ⏸️ 대기 |

**총 예상 기간**: 5~7일 (작업일 기준)

---

## 📋 Phase 0: 환경 준비 및 검증 (D-Day)

### 목표
RTX Desktop faster-whisper 서버 및 개발 환경 준비

### 체크리스트

#### 0.1 RTX Desktop 서버 검증

- [ ] **faster-whisper 서버 Health Check**
  ```bash
  curl http://100.120.180.42:9000/health
  # 기대 결과: {"status": "ok"}
  ```

- [ ] **테스트 오디오로 STT 검증**
  ```bash
  # 테스트 오디오 파일 준비 (5~10분 짧은 샘플)
  curl -X POST http://100.120.180.42:9000/transcribe \
    -F "audio_file=@test_audio.wav" \
    -F "model=medium" \
    -F "language=ko"

  # 응답 검증:
  # - text 필드 존재
  # - segments 배열 존재
  # - latency_ms 측정
  ```

- [ ] **다양한 모델 프로필 테스트**
  - small: 속도 확인
  - medium: 속도+품질 균형
  - large-v3: 최고 품질 (메모리 충분한지 확인)

#### 0.2 Backend 환경변수 설정

- [ ] **backend/.env 파일 업데이트**
  ```bash
  # Whisper 전략
  WHISPER_MODE=hybrid_cost
  WHISPER_LOCAL_BACKEND=faster_whisper
  WHISPER_FAST_ENDPOINT=http://100.120.180.42:9000/transcribe

  # OpenAI (fallback)
  WHISPER_OPENAI_MODEL=whisper-1
  WHISPER_OPENAI_MAX_MINUTES=20

  # 모델 프로필
  WHISPER_PROFILE_FAST=small
  WHISPER_PROFILE_BALANCED=medium
  WHISPER_PROFILE_ACCURATE=large-v3

  # Retry & Timeout
  WHISPER_MAX_RETRIES=3
  WHISPER_TIMEOUT_SECONDS=300
  ```

- [ ] **Mac mini 서버 환경변수 동기화**
  ```bash
  ssh woosun@100.123.51.5
  cd ~/sparklio_ai_marketing_studio/backend
  nano .env
  # 위 환경변수 복사 후 저장
  ```

#### 0.3 DB Schema 확인

- [ ] **meeting_transcripts 테이블 존재 확인**
  ```sql
  SELECT * FROM information_schema.tables
  WHERE table_name = 'meeting_transcripts';
  ```

- [ ] **필요시 Alembic Migration 준비**
  - source_type, provider, backend, model 컬럼 확인
  - is_primary, quality_score, confidence, latency_ms 확인

### 완료 기준
✅ RTX Desktop 서버 정상 응답
✅ 환경변수 설정 완료
✅ DB Schema 준비 완료

---

## 📋 Phase 1: 핵심 컴포넌트 구현 (2~3일)

### 목표
TranscriberService, Whisper Clients, API 엔드포인트 구현

### 1.1 Day 1: Whisper Clients 구현

#### 1.1.1 파일 생성: `app/schemas/transcriber.py`

- [ ] **TranscriptSegment 스키마**
  ```python
  class TranscriptSegment(BaseModel):
      start: float
      end: float
      text: str
  ```

- [ ] **TranscriptionResult 스키마**
  ```python
  class TranscriptionResult(BaseModel):
      text: str
      segments: List[TranscriptSegment]
      language: str
      duration_seconds: float
      backend: str
      model: str
      latency_ms: int
      confidence: Optional[float] = None
  ```

- [ ] **TranscribeRequest 스키마**
  ```python
  class TranscribeRequest(BaseModel):
      force_mode: Optional[str] = None
      reprocess: bool = False
      importance: str = "normal"
      run_meeting_agent: bool = True
  ```

- [ ] **TranscribeResponse 스키마**
  ```python
  class TranscribeResponse(BaseModel):
      meeting_id: int
      transcript_id: int
      source_type: str
      backend: str
      model: str
      language: str
      duration_seconds: float
      latency_ms: int
      is_primary: bool
      status: str
      meeting_agent_triggered: bool
  ```

#### 1.1.2 파일 생성: `app/services/transcriber_clients.py`

- [ ] **BaseWhisperClient 추상 클래스**
  ```python
  class BaseWhisperClient(ABC):
      @abstractmethod
      async def transcribe(self, audio_path: str, **kwargs) -> TranscriptionResult:
          pass
  ```

- [ ] **FasterWhisperClient 구현** (우선순위 1)
  - HTTP POST multipart/form-data 요청
  - 응답 파싱 → TranscriptionResult 변환
  - Timeout, Retry 처리
  - **단위 테스트 작성**

- [ ] **OpenAIWhisperClient 구현** (우선순위 2)
  - openai.Audio.transcribe() 호출
  - response_format="verbose_json"
  - **단위 테스트 작성**

- [ ] **WhisperCppClient 구현** (우선순위 3, Optional)
  - whisper.cpp 서버 HTTP 요청
  - 스킵 가능 (faster-whisper로 충분)

### 1.2 Day 2: TranscriberService 구현

#### 1.2.1 파일 생성: `app/services/transcriber.py`

- [ ] **TranscriberService 클래스 기본 구조**
  ```python
  class TranscriberService:
      def __init__(self, settings: Optional[Settings] = None):
          # OpenAI + Local 클라이언트 초기화
          pass

      async def transcribe(
          self,
          audio_path: str,
          duration_seconds: float,
          importance: str = "normal"
      ) -> TranscriptionResult:
          # 모드별 분기
          pass
  ```

- [ ] **_openai_only 구현**
  - OpenAI만 사용

- [ ] **_local_only 구현**
  - faster-whisper 우선 → fallback OpenAI

- [ ] **_hybrid_cost 구현**
  - ≤20분: OpenAI 우선 → faster-whisper fallback
  - >20분: faster-whisper 우선 → OpenAI fallback

- [ ] **_hybrid_quality 구현**
  - faster-whisper(large-v3) 우선 → OpenAI fallback

- [ ] **_with_retries 헬퍼 메서드**
  - 최대 3회 재시도
  - Graceful degradation

- [ ] **_choose_model_profile 헬퍼 메서드**
  - ≤15분: small
  - 15~60분: medium
  - ≥60분: large-v3

- [ ] **단위 테스트 작성**
  - 모드별 동작 검증
  - Fallback 시나리오
  - Retry 로직

### 1.3 Day 3: API 엔드포인트 구현

#### 1.3.1 헬퍼 함수 구현

- [ ] **`app/services/meeting_audio.py` 생성**
  ```python
  async def get_meeting_audio_source(
      db: AsyncSession,
      meeting: Meeting
  ) -> Tuple[str, float]:
      """
      Meeting의 오디오 소스 확보

      Returns:
          (audio_path, duration_seconds)
      """
      # YouTube URL → yt-dlp 다운로드
      # 업로드 파일 → MinIO 다운로드
      # ffprobe로 duration 계산
  ```

#### 1.3.2 API 엔드포인트 구현

- [ ] **`app/api/v1/endpoints/meetings.py` 업데이트**
  ```python
  @router.post("/meetings/{meeting_id}/transcribe", response_model=TranscribeResponse)
  async def transcribe_meeting(...):
      # 1. Meeting 존재 확인
      # 2. 오디오 소스 확보
      # 3. TranscriberService 실행
      # 4. meeting_transcripts 저장
      # 5. MeetingAgent 트리거 (BackgroundTask)
      # 6. Response 반환
  ```

- [ ] **MeetingTranscript 모델 메서드 추가**
  ```python
  @classmethod
  async def clear_primary_for_meeting(
      cls,
      db: AsyncSession,
      meeting_id: int
  ):
      """reprocess 시 기존 primary 플래그 제거"""
  ```

#### 1.3.3 통합 테스트

- [ ] **Postman/curl로 API 테스트**
  ```bash
  curl -X POST http://localhost:8000/api/v1/meetings/123/transcribe \
    -H "Content-Type: application/json" \
    -d '{
      "force_mode": "hybrid_cost",
      "importance": "normal",
      "run_meeting_agent": true
    }'
  ```

- [ ] **응답 검증**
  - transcript_id 생성
  - backend, model 정확성
  - DB에 레코드 저장 확인

### 완료 기준 (Phase 1)
✅ FasterWhisperClient 단위 테스트 통과
✅ TranscriberService 4-Mode 동작 검증
✅ API `/meetings/{id}/transcribe` 정상 응답
✅ meeting_transcripts 테이블에 데이터 저장 확인

---

## 📋 Phase 2: 통합 테스트 (1~2일)

### 목표
실제 오디오 파일로 E2E 테스트 및 품질 검증

### 2.1 테스트 데이터 준비

- [ ] **다양한 길이의 테스트 오디오 준비**
  - 짧은 회의 (5~15분)
  - 중간 회의 (15~60분)
  - 긴 회의 (60분 이상)

- [ ] **다양한 소스 테스트**
  - 직접 업로드 파일
  - YouTube URL
  - 다양한 음질 (고음질, 저음질, 잡음 많음)

### 2.2 모드별 동작 검증

- [ ] **openai 모드**
  - 모든 길이에서 OpenAI만 사용
  - backend='openai' 확인

- [ ] **local 모드**
  - 모든 길이에서 faster-whisper만 사용
  - backend='faster_whisper' 확인

- [ ] **hybrid_cost 모드**
  - ≤20분: OpenAI 우선 사용
  - >20분: faster-whisper 우선 사용

- [ ] **hybrid_quality 모드**
  - 모든 길이에서 faster-whisper(large-v3) 사용
  - model='large-v3' 확인

### 2.3 Fallback 시나리오 테스트

- [ ] **RTX Desktop 서버 다운 시뮬레이션**
  - faster-whisper 서버 중단
  - OpenAI fallback 동작 확인
  - 에러 로그 확인

- [ ] **OpenAI API 제한 시뮬레이션**
  - API key 제거 또는 잘못된 key
  - local fallback 동작 확인 (hybrid_cost 짧은 회의)

### 2.4 Retry 로직 검증

- [ ] **네트워크 Timeout 시뮬레이션**
  - WHISPER_TIMEOUT_SECONDS=5로 설정
  - 긴 오디오 파일로 테스트
  - 3회 재시도 확인

### 2.5 품질 검증 (A팀 협업)

- [ ] **Golden Set 테스트** (A팀)
  - 5개 회의 샘플로 일관성 검증
  - backend, model, latency_ms 기록
  - transcript_text 품질 확인

- [ ] **성능 측정**
  - 10분 회의: latency_ms 기대값 확인
  - 60분 회의: latency_ms 기대값 확인
  - 처리 속도 vs 오디오 길이 비율 계산

### 완료 기준 (Phase 2)
✅ 모든 모드 동작 검증 완료
✅ Fallback 시나리오 통과
✅ Retry 로직 정상 작동
✅ A팀 Golden Set 테스트 통과

---

## 📋 Phase 3: A/C팀 연동 (1일)

### 목표
A팀 QA 회귀 테스트 + C팀 Frontend 연동

### 3.1 A팀 QA 테스트 (반일)

- [ ] **회귀 테스트 실행**
  ```bash
  cd backend
  pytest tests/test_transcriber_clients.py -v
  pytest tests/test_transcriber_service.py -v
  pytest tests/test_transcribe_api.py -v
  ```

- [ ] **테스트 카테고리별 검증**
  - 모드별 동작 (TC-1 ~ TC-5)
  - Fallback & Retry
  - DB 저장 일관성
  - API 계약 검증

- [ ] **버그 리포트 & 수정**
  - 발견된 이슈 GitHub Issues 등록
  - 우선순위 높은 버그 즉시 수정

### 3.2 C팀 Frontend 연동 (반일)

#### 3.2.1 TypeScript 타입 정의

- [ ] **`types/transcriber.ts` 생성**
  ```typescript
  export interface TranscribeRequest {
    force_mode?: 'openai' | 'local' | 'hybrid_cost' | 'hybrid_quality';
    reprocess?: boolean;
    importance?: 'normal' | 'high';
    run_meeting_agent?: boolean;
  }

  export interface TranscribeResponse {
    meeting_id: number;
    transcript_id: number;
    source_type: string;
    backend: string;
    model: string;
    language: string;
    duration_seconds: number;
    latency_ms: number;
    is_primary: boolean;
    status: 'completed' | 'failed';
    meeting_agent_triggered: boolean;
  }
  ```

#### 3.2.2 API 호출 Hook 구현

- [ ] **`hooks/useTranscribeMeeting.ts` 작성**
  ```typescript
  export function useTranscribeMeeting(meetingId: number) {
    return useMutation<TranscribeResponse, Error, TranscribeRequest>({
      mutationFn: async (request) => {
        const response = await fetch(`/api/v1/meetings/${meetingId}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Transcription failed');
        }

        return response.json();
      },
    });
  }
  ```

#### 3.2.3 UI 컴포넌트 구현

- [ ] **Meeting 상세 페이지에 "Transcribe" 버튼 추가**
  - 위치: Meeting 상세 페이지 상단
  - 로딩 상태 표시
  - 성공/실패 메시지

- [ ] **Transcript 뷰어 구현**
  - 전체 텍스트 표시
  - 세그먼트별 타임스탬프
  - 메타데이터 (backend, model, duration, latency)

- [ ] **디버그 패널 (개발자용)**
  - 사용된 백엔드
  - 모델 프로필
  - 변환 소요 시간

### 3.3 E2E 테스트 (C팀 + B팀)

- [ ] **프론트 → 백엔드 → RTX Desktop 전체 플로우 테스트**
  1. 브라우저에서 "Transcribe" 버튼 클릭
  2. Backend API 호출
  3. RTX Desktop STT 실행
  4. 결과 DB 저장
  5. Frontend에 결과 표시

- [ ] **에러 케이스 UI 검증**
  - 서버 장애 시 에러 메시지
  - 재시도 버튼 동작

### 완료 기준 (Phase 3)
✅ A팀 회귀 테스트 통과
✅ C팀 UI 연동 완료
✅ E2E 테스트 성공

---

## 📋 Phase 4: 배포 및 검증 (1일)

### 목표
Mac mini 서버 배포 + Production 검증

### 4.1 Mac mini 배포 준비

- [ ] **코드 동기화**
  ```bash
  ssh woosun@100.123.51.5
  cd ~/sparklio_ai_marketing_studio
  git pull origin main
  ```

- [ ] **환경변수 최종 확인**
  ```bash
  cd backend
  cat .env | grep WHISPER
  # 모든 WHISPER_* 변수 확인
  ```

- [ ] **Docker Compose 재시작**
  ```bash
  cd docker/mac-mini
  docker compose down
  docker compose up -d
  ```

### 4.2 Health Check

- [ ] **Backend Health Check**
  ```bash
  curl http://100.123.51.5:8000/health
  # 기대 결과: {"status": "ok"}
  ```

- [ ] **RTX Desktop 연결 확인**
  ```bash
  curl http://100.120.180.42:9000/health
  # 기대 결과: {"status": "ok"}
  ```

- [ ] **PostgreSQL 연결 확인**
  ```bash
  docker compose exec backend psql $DATABASE_URL -c "SELECT COUNT(*) FROM meeting_transcripts;"
  ```

### 4.3 Smoke Test

- [ ] **실제 회의로 E2E 테스트**
  1. Production 환경에서 회의 생성
  2. YouTube URL 또는 파일 업로드
  3. Transcribe 실행
  4. 결과 확인

- [ ] **모니터링 지표 수집**
  - Transcript 생성 성공률
  - 평균 latency_ms
  - Fallback 발생 횟수
  - 에러 로그 확인

### 4.4 문서 업데이트

- [ ] **CHANGELOG.md 업데이트**
  - 새로운 기능 추가 내용
  - Breaking changes (있다면)

- [ ] **README.md 업데이트**
  - 새로운 환경변수 설명
  - Transcriber 사용법 추가

- [ ] **API 문서 업데이트**
  - `/meetings/{id}/transcribe` 엔드포인트 문서화

### 완료 기준 (Phase 4)
✅ Mac mini 배포 완료
✅ Health Check 통과
✅ Smoke Test 성공
✅ 문서 업데이트 완료

---

## 📊 진행 상황 추적

### 일일 체크인 (Daily Standup)

매일 다음 항목을 체크:
- [ ] 어제 완료한 작업
- [ ] 오늘 예정 작업
- [ ] 블로킹 이슈

### 주요 마일스톤

| 마일스톤 | 예상 완료일 | 실제 완료일 | 상태 |
|---------|-----------|-----------|------|
| Phase 0 완료 | D+0 | | ⏸️ |
| Phase 1 완료 | D+3 | | ⏸️ |
| Phase 2 완료 | D+5 | | ⏸️ |
| Phase 3 완료 | D+6 | | ⏸️ |
| Phase 4 완료 | D+7 | | ⏸️ |

---

## 🚨 리스크 관리

### 주요 리스크

| 리스크 | 확률 | 영향도 | 완화 전략 |
|--------|------|-------|----------|
| RTX Desktop 서버 불안정 | 중 | 높음 | OpenAI fallback 철저히 테스트 |
| faster-whisper API 변경 | 낮음 | 중 | API 버전 고정, 문서화 |
| 성능 이슈 (긴 회의) | 중 | 중 | Timeout 설정, 모델 프로필 최적화 |
| OpenAI API 비용 초과 | 중 | 중 | WHISPER_OPENAI_MAX_MINUTES 엄격 설정 |

### 블로킹 이슈 발생 시

1. **즉시 팀에 공유** (Slack, GitHub Issues)
2. **우선순위 재조정**
3. **대체 방안 논의**

---

## 🎯 다음 단계 (Phase 완료 후)

### 우선순위 1 (필수)
- [ ] YouTube Caption Fetcher 구현
- [ ] Caption vs Whisper 품질 비교 로직
- [ ] Merged Transcript 생성 (LLM 기반)

### 우선순위 2 (중요)
- [ ] 품질 점수 자동 계산 로직
- [ ] A/B 테스트 프레임워크
- [ ] 모니터링 대시보드

### 우선순위 3 (선택)
- [ ] Zoom/Google Meet API 연동
- [ ] 실시간 녹음 기능
- [ ] 다국어 지원 강화

---

## 📞 연락처 및 리소스

### 팀 연락처
- **B팀 리드**: Backend 담당자
- **A팀 QA**: QA 담당자
- **C팀 Frontend**: Frontend 담당자
- **인프라**: RTX Desktop 관리자

### 참고 문서
- [MEETING_AI_TRANSCRIBER_SPEC.md](./MEETING_AI_TRANSCRIBER_SPEC.md)
- [MEETING_AI_ARCHITECTURE.md](../../docs/MEETING_AI_ARCHITECTURE.md)
- [B_TEAM_TRANSCRIBER_IMPLEMENTATION_GUIDE_2025-11-24.md](./B_TEAM_TRANSCRIBER_IMPLEMENTATION_GUIDE_2025-11-24.md)

### 외부 리소스
- [faster-whisper GitHub](https://github.com/guillaumekln/faster-whisper)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp)

---

**작성 완료**: 2025-11-24 (일요일)
**다음 업데이트**: 일일 진행 상황에 따라 수시 업데이트
