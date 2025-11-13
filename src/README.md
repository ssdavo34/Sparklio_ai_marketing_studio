# 소스 코드 (Source Code)

이 폴더는 Sparklio AI Marketing Studio의 핵심 소스 코드를 포함합니다.

## 디렉토리 구조

```
src/
├── api/            # API 엔드포인트 및 라우터
├── models/         # 데이터 모델 및 스키마
├── services/       # 비즈니스 로직 및 서비스
├── utils/          # 유틸리티 함수
├── ai/             # AI 모델 및 프롬프트 관리
├── integrations/   # 외부 서비스 연동
└── config/         # 애플리케이션 설정

```

## 주요 모듈

### API
RESTful API 엔드포인트 및 GraphQL 스키마를 정의합니다.

### Models
데이터베이스 모델과 비즈니스 엔티티를 정의합니다.

### Services
핵심 비즈니스 로직을 구현합니다:
- 캠페인 관리 서비스
- AI 콘텐츠 생성 서비스
- 분석 및 리포팅 서비스

### AI
AI 모델 통합 및 프롬프트 엔지니어링을 관리합니다.

## 코딩 규칙

- PEP 8 (Python) / ESLint (JavaScript) 스타일 가이드 준수
- 모든 함수에 독스트링/JSDoc 작성
- 단위 테스트 필수 작성
- 타입 힌트/TypeScript 사용 권장

## 개발 환경 설정

```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 개발 의존성 설치
pip install -r requirements-dev.txt
npm install --save-dev

# 테스트 실행
pytest
npm test
```
