# 테스트 (Tests)

이 폴더는 프로젝트의 모든 테스트 코드를 포함합니다.

## 테스트 구조

```
tests/
├── unit/           # 단위 테스트
├── integration/    # 통합 테스트
├── e2e/            # End-to-End 테스트
├── fixtures/       # 테스트 픽스처 및 모킹 데이터
└── conftest.py     # pytest 설정 파일
```

## 테스트 유형

### 단위 테스트 (Unit Tests)
개별 함수 및 클래스의 동작을 검증합니다.

```python
# 예시
def test_content_generation():
    result = generate_marketing_copy(prompt="new product")
    assert len(result) > 0
    assert isinstance(result, str)
```

### 통합 테스트 (Integration Tests)
여러 모듈 간의 상호작용을 검증합니다.

### E2E 테스트
전체 애플리케이션 워크플로우를 검증합니다.

## 테스트 실행

```bash
# 모든 테스트 실행
pytest

# 특정 테스트 파일 실행
pytest tests/unit/test_ai_service.py

# 커버리지 리포트 생성
pytest --cov=src --cov-report=html

# JavaScript 테스트
npm test
npm run test:coverage
```

## 테스트 작성 가이드

1. **명확한 테스트 이름**: 테스트가 무엇을 검증하는지 이름에서 명확히 드러나야 합니다
2. **AAA 패턴**: Arrange (준비), Act (실행), Assert (검증) 순서로 작성
3. **독립성**: 각 테스트는 독립적으로 실행 가능해야 합니다
4. **커버리지**: 최소 80% 이상의 코드 커버리지 유지

## CI/CD 통합

모든 Pull Request는 자동으로 테스트가 실행되며, 테스트 통과가 머지 조건입니다.
