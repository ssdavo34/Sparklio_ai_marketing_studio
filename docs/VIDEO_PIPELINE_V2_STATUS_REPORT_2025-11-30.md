# Video Pipeline V2 현재 상태 보고서

**작성일**: 2025-11-30
**작성자**: C팀 (Frontend)
**버전**: v2.0 (테스트 단계)

---

## 1. 테스트 결과 요약

### 1.1 성공 항목
| 항목 | 상태 | 비고 |
|------|------|------|
| 프로젝트 생성 | ✅ 성공 | `vp_*` ID 정상 발급 |
| PLAN 모드 실행 | ✅ 성공 | 6개 씬 스토리보드 생성 |
| 이미지 생성 (NanoBanana) | ✅ 성공 | Gemini 2.0 Flash로 6개 이미지 생성 |
| MinIO 업로드 | ✅ 성공 | 이미지/영상 모두 저장됨 |
| RENDER 모드 실행 | ✅ 성공 | FFmpeg 영상 렌더링 완료 |
| Ken Burns 모션 | ✅ 성공 | 줌인/줌아웃 효과 적용 |

### 1.2 미해결 문제
| 문제 | 심각도 | 상태 | 원인 분석 |
|------|--------|------|----------|
| **2컷만 렌더링** | 🔴 Critical | 미해결 | VideoBuilder에서 일부 씬만 처리 |
| **이미지 스타일 불일치** | 🔴 Critical | 미해결 | 실사 vs 카툰 혼재 (일관성 없음) |
| 이미지에 텍스트 임베딩 | 🟠 High | B팀 수정 | Negative prompt 추가됨 |
| 자막 품질 | 🟠 High | B팀 수정 | text_overlay 분리 지시 추가 |
| 이미지 프롬프트 품질 | 🟡 Medium | B팀 수정 | 상세 프롬프트 지시 추가 |

---

## 2. B팀 고도화 반영 현황

### 2.1 StoryboardBuilderAgent 수정 (완료)
**파일**: `backend/app/services/agents/storyboard_builder.py`

**변경 내용**:
```
- voiceover: 자연스러운 한국어, 감정적 훅과 스토리텔링 사용
- text_overlay: 짧고 강렬하게 (최대 20자) - 자막/캡션용
- visual_description/image_prompt_hint: 상세하게 (조명, 구도, 스타일, 분위기 포함)
- **CRITICAL**: 이미지에 텍스트 포함 금지
- 출력 언어: voiceover/text_overlay는 한국어, 이미지 프롬프트는 영어 권장
```

### 2.2 VisionGeneratorAgent 수정 (완료)
- Negative prompt 추가: "text, watermark, signature, writing, letters"

### 2.3 미적용 항목
- 로컬 placeholder 이미지 (외부 URL 의존)
- 이미지 생성 재시도 로직 강화
- 스타일 일관성 강제 (프롬프트에 스타일 고정)

---

## 3. 남은 핵심 문제 분석

### 3.1 2컷만 렌더링되는 문제

**가능한 원인**:
1. VideoBuilderV2에서 일부 씬의 이미지 다운로드 실패
2. FFmpeg 렌더링 중 에러 발생 (일부 씬 스킵)
3. Timeline 변환 시 일부 씬 누락

**확인 필요 사항**:
```bash
# 백엔드 로그에서 에러 확인
docker logs sparklio-backend --tail 500 | grep -E "error|Error|failed|Scene"
```

### 3.2 이미지 스타일 불일치 문제

**가능한 원인**:
1. **프롬프트에 스타일 지정 없음** - 가장 유력
   - 각 씬마다 다른 스타일로 생성됨
   - Gemini가 임의로 스타일 결정

2. **씬별 프롬프트 차이**
   - visual_description이 씬마다 다른 뉘앙스
   - 일관된 스타일 키워드 없음

**해결 방안 제안**:
```python
# 모든 이미지 프롬프트에 공통 스타일 접미사 추가
STYLE_SUFFIX = """
Style: photorealistic, high-end commercial photography,
8K resolution, professional studio lighting,
consistent warm color grading, luxury brand aesthetic.
"""

# 또는 카툰 스타일로 통일
STYLE_SUFFIX = """
Style: modern illustration, flat design,
vibrant colors, consistent cartoon style,
clean lines, minimalist background.
"""
```

---

## 4. 다음 단계 권장사항

### 4.1 즉시 조치 (P0)
1. **프레젠테이션 파이프라인 먼저 테스트**
   - 동일한 VisionGenerator 사용
   - 스타일 일관성 문제가 동일한지 확인
   - 빠른 피드백 루프

2. **스타일 일관성 문제 해결**
   - 프롬프트에 공통 스타일 접미사 강제 추가
   - 또는 스타일 파라미터 별도 전달

### 4.2 후속 조치 (P1)
1. **2컷 렌더링 문제 디버깅**
   - VideoBuilderV2 상세 로그 분석
   - 씬별 이미지 URL 유효성 검증

2. **이미지 품질 향상**
   - 이미지 해상도 확인 (1080x1920 필요)
   - 생성 모델 파라미터 튜닝

### 4.3 향후 고도화 (P2)
1. TTS voiceover 자동 생성
2. BGM 비트 동기화
3. 다양한 트랜지션 효과

---

## 5. 프레젠테이션 테스트 계획

### 5.1 테스트 목적
- VisionGenerator/NanoBanana 이미지 생성 검증
- 스타일 일관성 확인
- 이미지 품질 평가

### 5.2 테스트 항목
- [ ] 프레젠테이션 이미지 생성 API 호출
- [ ] 생성된 이미지 스타일 확인 (실사 vs 카툰)
- [ ] 여러 이미지 간 일관성 확인
- [ ] 이미지 내 텍스트 포함 여부 확인

### 5.3 예상 결과
- 프레젠테이션에서도 스타일 불일치 발생 시 → NanoBanana 프롬프트 문제
- 프레젠테이션은 일관적 → Video Pipeline의 프롬프트 전달 문제

---

## 6. 참조 문서

| 문서 | 위치 |
|------|------|
| 종합 보고서 | `docs/VIDEO_PIPELINE_V2_COMPREHENSIVE_REPORT_2025-11-29.md` |
| B팀 고도화 요청서 | `docs/B_TEAM_REQUEST_VIDEO_PIPELINE_ENHANCEMENT_2025-11-30.md` |
| Video Director Agent | `backend/app/services/agents/video_director.py` |
| Storyboard Builder | `backend/app/services/agents/storyboard_builder.py` |
| Vision Generator | `backend/app/services/agents/vision_generator.py` |

---

## 7. 결론

Video Pipeline V2는 **기본 플로우가 작동**하지만, **품질 이슈**가 남아있습니다.

**핵심 미해결 문제**:
1. 2컷만 렌더링 (6컷 중 4컷 누락)
2. 이미지 스타일 불일치 (실사/카툰 혼재)

**다음 액션**:
- 프레젠테이션 파이프라인 테스트로 이미지 생성 로직 검증
- 스타일 일관성 문제 원인 파악 후 Video Pipeline 재테스트

---

**C팀 담당자**: Frontend Team
**상태**: Video Pipeline 잠시 중단, 프레젠테이션 테스트 진행
