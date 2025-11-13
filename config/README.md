# 설정 파일 (Configuration)

이 폴더는 애플리케이션의 설정 파일을 포함합니다.

## 파일 구조

```
config/
├── development.yaml    # 개발 환경 설정
├── production.yaml     # 프로덕션 환경 설정
├── staging.yaml        # 스테이징 환경 설정
├── test.yaml           # 테스트 환경 설정
└── .env.example        # 환경 변수 예시 파일
```

## 환경별 설정

### 개발 환경 (Development)
로컬 개발을 위한 설정입니다. 디버그 모드가 활성화되어 있습니다.

### 스테이징 환경 (Staging)
프로덕션과 유사한 환경에서 테스트를 위한 설정입니다.

### 프로덕션 환경 (Production)
실제 운영 환경을 위한 설정입니다. 보안 및 성능이 최적화되어 있습니다.

## 환경 변수

민감한 정보(API 키, 데이터베이스 비밀번호 등)는 환경 변수로 관리합니다.

### 설정 방법

1. `.env.example` 파일을 복사하여 `.env` 파일 생성
   ```bash
   cp config/.env.example .env
   ```

2. `.env` 파일에 실제 값 입력
   ```
   DATABASE_URL=postgresql://user:password@localhost/sparklio
   API_KEY=your_api_key_here
   SECRET_KEY=your_secret_key_here
   ```

3. `.env` 파일은 `.gitignore`에 포함되어 버전 관리에서 제외됩니다

## 주요 설정 항목

- **데이터베이스**: 연결 정보 및 풀 설정
- **AI 서비스**: API 키 및 모델 설정
- **로깅**: 로그 레벨 및 출력 형식
- **보안**: JWT 시크릿, CORS 설정
- **외부 서비스**: 이메일, SMS, 소셜 미디어 API 연동

## 보안 주의사항

⚠️ **중요**: 실제 API 키나 비밀번호를 설정 파일에 직접 포함하지 마세요.
- 항상 환경 변수를 사용하세요
- `.env` 파일을 절대 커밋하지 마세요
- 프로덕션 환경에서는 안전한 시크릿 관리 서비스 사용을 권장합니다
