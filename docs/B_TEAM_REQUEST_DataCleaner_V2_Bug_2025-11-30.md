# B팀 요청서: DataCleanerAgent V2 텍스트 정제 버그 수정

**작성일**: 2025-11-30
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Blocking)
**상태**: 긴급 수정 필요

---

## 1. 문제 요약

Brand Kit URL 문서 크롤링 후 **DataCleanerAgent V2 텍스트 정제가 작동하지 않습니다.**

- 재크롤링을 여러 번 시도해도 `clean_text`가 `extracted_text`와 동일
- 카탈로그, 네비게이션, 폼 영역이 제거되지 않음
- 정제율 0% (5,693자 → 5,693자)

---

## 2. 현상

### 2.1 스크린샷 증거
- 마로솔(myrobotsolution.com) URL 크롤링 결과
- 원본 텍스트: 5,693자
- 정제된 텍스트: 5,693자 (동일)
- 감소율: 0%

### 2.2 텍스트 내용 (변경 없음)
```
카테고리별 스토어 바로가기 휴머노이드 산업용로봇 협동로봇 ROS 지원로봇...
#청소 로봇 > 인기 추천 [업계 최저가] 가우스로봇 스크러버 50 25,000,000 원...
```

카탈로그 블록, 가격 정보, 해시태그 섹션 등이 그대로 남아있음.

---

## 3. 원인 분석

### 3.1 근본 원인: 줄바꿈 없는 텍스트

BeautifulSoup의 `.get_text(separator=' ')`가 모든 텍스트를 **공백으로 연결**하여 반환합니다.

```python
# 크롤러 결과 (줄바꿈 없음)
raw_text = "카테고리별 스토어 바로가기 휴머노이드 산업용로봇..."  # \n이 없음
```

### 3.2 V2 정제 메서드의 문제

모든 정제 메서드가 `text.split('\n')`으로 줄 단위 처리:

```python
def _remove_navigation(self, data):
    lines = text.split('\n')  # 줄바꿈이 없으면 전체가 1줄
    for line in lines:
        # 패턴 매칭 (작동 안 함 - 한 줄에 5,693자)
```

줄바꿈이 없으면 **전체 텍스트가 1줄**로 처리되어 패턴 매칭 실패.

### 3.3 전처리 로직 추가 시도

C팀에서 `_normalize_line_breaks()` 메서드를 추가했으나:

1. **첫 번째 버그**: `robot_types[1:]` 슬라이싱으로 정규식 괄호 불균형 에러
   - 에러: `unbalanced parenthesis at position 141`
   - 수정 완료 (fd6b18a 커밋)

2. **두 번째 문제**: 수정 후에도 여전히 정제 안 됨
   - 로그에서 정제 성공 메시지가 없음
   - `clean_text`와 `extracted_text`가 동일

---

## 4. 수정된 코드 (확인 필요)

### 4.1 `_normalize_line_breaks()` 메서드

**파일**: `backend/app/services/agents/data_cleaner.py` (line 1825-1894)

```python
def _normalize_line_breaks(self, text: str) -> str:
    """줄바꿈이 없는 텍스트에 논리적 줄바꿈 추가"""
    newline_count = text.count('\n')
    if newline_count > 10 or (newline_count > 0 and len(text) / max(newline_count, 1) < 200):
        return text  # 이미 줄바꿈 충분

    # 패턴별 줄바꿈 삽입
    result = re.sub(r'\s+(#[가-힣A-Za-z]+\s*[>»›])', r'\n\n\1', result)  # 해시태그 섹션
    result = re.sub(r'(더\s*보기)\s+', r'\1\n\n', result)  # 더보기
    # ... (12개 패턴)

    return result
```

### 4.2 `clean_brand_text()` 호출부

```python
async def clean_brand_text(self, text: str) -> Dict[str, Any]:
    # 전처리: 줄바꿈이 없는 텍스트에 논리적 줄바꿈 삽입
    preprocessed_text = self._normalize_line_breaks(text)

    response = await self.execute(AgentRequest(
        task="clean_data",
        payload={
            "data": [{"text": preprocessed_text}],
            "profile": "brand_kit"
        }
    ))
```

---

## 5. B팀에 요청사항

### 5.1 즉시 확인 필요

1. **Docker 컨테이너 코드 동기화 확인**
   ```bash
   ssh woosun@100.123.51.5 "cat ~/sparklio_ai_marketing_studio/backend/app/services/agents/data_cleaner.py | grep -A5 '_normalize_line_breaks'"
   ```

2. **재크롤링 시 로그 확인**
   - `[DataCleaner] Normalizing line breaks` 로그가 출력되는지?
   - `Text recleaned for brand analysis: X -> Y chars` 로그에서 X != Y인지?

3. **수동 테스트**
   ```python
   # Python REPL에서
   from app.services.agents.data_cleaner import get_data_cleaner_agent
   cleaner = get_data_cleaner_agent()

   test_text = "카테고리별 스토어 바로가기 휴머노이드 산업용로봇 #청소 로봇 > 인기 추천 25,000,000 원 견적문의"
   result = await cleaner.clean_brand_text(test_text)
   print(f"Before: {len(test_text)}, After: {len(result['clean_text'])}")
   ```

### 5.2 수정 방안 (필요시)

**옵션 A**: 크롤러에서 줄바꿈 보존
```python
# web_crawler.py
extracted_text = soup.get_text(separator='\n')  # 현재: separator=' '
```

**옵션 B**: _normalize_line_breaks 강화
- 더 공격적인 줄바꿈 삽입 (모든 단어 사이 검사)
- 문장 끝 패턴 확장 (마침표, 물음표, 느낌표 뒤)

**옵션 C**: 줄 기반 정제 → 패턴 기반 정제로 변경
- `text.split('\n')` 대신 정규식으로 직접 블록 제거
- 예: `re.sub(r'#[가-힣]+\s*>\s*인기\s*추천.*?더\s*보기', '', text, flags=re.DOTALL)`

---

## 6. 영향 범위

- **Brand Kit 탭**: 문서 정제 기능 완전 불능
- **Brand DNA 분석**: 쓰레기 텍스트로 분석 → 품질 저하
- **MVP 일정**: P0 Blocking

---

## 7. 참고 파일

| 파일 | 설명 |
|------|------|
| `backend/app/services/agents/data_cleaner.py` | DataCleanerAgent V2 |
| `backend/app/api/v1/endpoints/brands.py` | `/recrawl` 엔드포인트 |
| `backend/app/services/web/crawler.py` | 웹 크롤러 |

---

## 8. 커밋 히스토리

```
fd6b18a [2025-11-30][B] fix: Fix regex parenthesis error in _normalize_line_breaks
eaeb339 [2025-11-30][B] fix: Add line break normalization to DataCleanerAgent
ab55238 [2025-11-30][C] feat: Add URL document recrawl feature for DataCleanerAgent V2
```

---

**긴급 연락**: 이 이슈는 MVP P0 Blocking입니다. 가능한 빨리 확인 부탁드립니다.
