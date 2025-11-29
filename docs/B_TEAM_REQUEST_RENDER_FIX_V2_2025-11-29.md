# B팀 요청서: MediaGateway.generate_image() 반환값 버그 수정

**작성일**: 2025-11-29
**작성자**: C팀 (Frontend)
**우선순위**: 🔴 P0 (Blocking)
**상태**: 대기중
**관련 이슈**: B_TEAM_REQUEST_RENDER_FIX_2025-11-29.md (이전 요청서)

---

## 요청 요약

`MediaGateway.generate_image()` 메서드가 추가되었으나, **반환값 처리에서 버그 발생**.
`MediaProviderOutput` 객체에 `.metadata` 속성이 없어서 모든 이미지 생성 실패.

---

## 에러 상세

### 백엔드 로그 (반복 발생)

```
[MediaGateway] generate_image failed: 'MediaProviderOutput' object has no attribute 'metadata'
[VisionGeneratorAgent] Nanobanana failed, trying fallback: 'MediaProviderOutput' object has no attribute 'metadata'
[VisionGeneratorAgent] DALL-E failed: 'MediaProviderOutput' object has no attribute 'metadata'
[VisionGeneratorAgent] Single image generation failed: 'MediaProviderOutput' object has no attribute 'metadata'
[VideoDirectorAgent] RENDER mode failed: 1 validation error for VideoTimelinePlanV1
```

### 문제 원인

`MediaGateway.generate_image()` 또는 `VisionGeneratorAgent`에서 `MediaProviderOutput.metadata`를 참조하지만, 해당 속성이 정의되지 않음.

```python
# 예상 문제 코드
result = await provider.generate(prompt)
metadata = result.metadata  # AttributeError: 'MediaProviderOutput' object has no attribute 'metadata'
```

---

## 요청 사항

### 확인 필요 사항

1. **MediaProviderOutput 클래스 정의 확인**
   ```python
   # backend/app/schemas/media.py 또는 유사 파일
   class MediaProviderOutput:
       url: str
       metadata: Optional[dict] = None  # ← 이 필드가 없거나 이름이 다를 수 있음
   ```

2. **MediaGateway.generate_image() 반환값 확인**
   - 각 provider (nanobanana, dalle, comfyui)의 반환 형식 확인
   - `metadata` 필드 존재 여부 확인

### 수정 방안

**방법 1: MediaProviderOutput에 metadata 필드 추가**
```python
class MediaProviderOutput(BaseModel):
    url: str
    width: Optional[int] = None
    height: Optional[int] = None
    metadata: Optional[dict] = None  # 추가
```

**방법 2: metadata 접근을 선택적으로 변경**
```python
# 기존 (에러 발생)
metadata = result.metadata

# 수정 (안전한 접근)
metadata = getattr(result, 'metadata', None) or {}
```

---

## E2E 테스트 현황 (C팀)

| 단계 | API | 상태 | 비고 |
|------|-----|------|------|
| 1. 프로젝트 생성 | POST /projects | ✅ 201 | 정상 |
| 2. PLAN 모드 | POST /{id}/plan | ✅ 200 | 6개 씬 생성 |
| 3. RENDER 모드 | POST /{id}/render | ❌ Failed | MediaProviderOutput.metadata 없음 |

---

## 프론트엔드 준비 완료 사항

1. ✅ "다시 시도" 버튼 추가 (렌더링 실패 시)
2. ✅ 에러 메시지 표시
3. ✅ 전체 플로우 UI 완성

백엔드 버그 수정 후 즉시 재테스트 가능합니다.

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 환경**: Windows Laptop (`localhost:3001`)
- **대상 서버**: Mac mini (`100.123.51.5:8000`)
