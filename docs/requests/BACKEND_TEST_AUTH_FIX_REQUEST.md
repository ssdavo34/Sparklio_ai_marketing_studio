# Backend 팀 작업 요청서: 테스트 인증 환경 구축

**요청 팀**: A팀 (QA & Testing)
**요청일**: 2025-11-16
**우선순위**: 🔴 **높음** (테스트 차단 중)
**담당**: B팀 (Backend)

---

## 1. 요청 배경

현재 Backend API 통합 테스트 실행 시 **175개 중 161개 테스트가 401 Unauthorized 에러**로 실패하고 있습니다.

**현재 상태**:
- ✅ Mac mini 서버 연결 정상 (100.123.51.5:8000)
- ✅ 인증 불필요 API 테스트 성공 (14개)
- ❌ 인증 필요 API 테스트 전부 실패 (175개) - JWT 토큰 문제

**문제 원인**:
- `.env.test`에 있는 `TEST_TOKEN`이 실제로 작동하지 않는 더미 토큰
- 테스트용 사용자 계정이 Mac mini PostgreSQL에 존재하지 않음

---

## 2. 요청 작업 내용

### 2.1 테스트용 사용자 계정 생성 스크립트 작성

**파일 위치**: `backend/app/scripts/seed_test_user.py`

```python
"""
테스트용 사용자 계정 생성 스크립트
실행: python -m app.scripts.seed_test_user
"""

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

# 테스트용 계정 정보
TEST_EMAIL = "testuser@sparklio.ai"
TEST_PASSWORD = "testpass123"

def seed_test_user():
    """테스트용 사용자를 생성하거나 업데이트합니다."""
    db = SessionLocal()

    try:
        # 기존 사용자 확인
        user = db.query(User).filter(User.email == TEST_EMAIL).first()

        if not user:
            # 새로운 테스트 사용자 생성
            user = User(
                id="user-test-001",  # 고정 ID (테스트에서 참조용)
                email=TEST_EMAIL,
                hashed_password=get_password_hash(TEST_PASSWORD),
                full_name="Test User",
                is_active=True,
                is_superuser=True,  # 모든 권한 부여 (테스트용)
            )
            db.add(user)
            db.commit()
            logger.info(f"✅ Created test user: {TEST_EMAIL}")
            print(f"✅ Test user created: {TEST_EMAIL}")
        else:
            # 기존 사용자 업데이트 (비밀번호 재설정)
            user.hashed_password = get_password_hash(TEST_PASSWORD)
            user.is_active = True
            user.is_superuser = True
            db.commit()
            logger.info(f"✅ Updated test user: {TEST_EMAIL}")
            print(f"✅ Test user updated: {TEST_EMAIL}")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed test user: {e}")
        raise
    finally:
        db.close()

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("Creating test user for integration tests...")
    print("=" * 60)
    seed_test_user()
    print("\n✅ Test user setup completed!")
    print(f"   Email: {TEST_EMAIL}")
    print(f"   Password: {TEST_PASSWORD}")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

---

### 2.2 Mac mini 서버에서 스크립트 실행

**Mac mini에서 실행할 명령어**:

```bash
# 1. SSH 접속
ssh woosun@100.123.51.5

# 2. 프로젝트 디렉토리로 이동
cd ~/sparklio_ai_marketing_studio/backend

# 3. 가상환경 활성화
source .venv/bin/activate

# 4. 테스트 사용자 생성 스크립트 실행
python -m app.scripts.seed_test_user

# 5. 생성 확인
psql -U sparklio -d sparklio -c "SELECT id, email, is_active, is_superuser FROM users WHERE email = 'testuser@sparklio.ai';"

# 6. 로그아웃
exit
```

**예상 출력**:
```
============================================================
Creating test user for integration tests...
============================================================
✅ Test user created: testuser@sparklio.ai

✅ Test user setup completed!
   Email: testuser@sparklio.ai
   Password: testpass123
============================================================
```

---

### 2.3 테스트용 JWT 토큰 발급 엔드포인트 확인

**확인 사항**:
- POST `/api/v1/auth/login` 엔드포인트가 정상 작동하는지 확인
- 요청/응답 스키마 확인

**테스트 방법** (Mac mini에서):

```bash
# 로그인 테스트
curl -X POST http://100.123.51.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@sparklio.ai",
    "password": "testpass123"
  }'

# 예상 응답:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer",
#   "user": {
#     "id": "user-test-001",
#     "email": "testuser@sparklio.ai"
#   }
# }
```

**만약 `/api/v1/auth/login` 엔드포인트가 없다면**:
- 해당 엔드포인트 구현 필요
- 또는 기존 인증 엔드포인트 경로 알려주세요

---

### 2.4 테스트 데이터 시드 스크립트 작성 (선택사항)

일부 테스트에서 404 에러가 발생하는 경우, 테스트에서 사용하는 리소스(Brand, Template 등)를 미리 생성해 두는 것이 좋습니다.

**파일 위치**: `backend/app/scripts/seed_test_data.py`

```python
"""
테스트용 데이터 시드 스크립트
실행: python -m app.scripts.seed_test_data
"""

from app.db.session import SessionLocal
from app.models.brand import Brand
from app.models.template import Template
import logging

logger = logging.getLogger(__name__)

def seed_test_brand():
    """테스트용 브랜드 생성"""
    db = SessionLocal()

    try:
        brand = db.query(Brand).filter(Brand.id == "brand-test-001").first()

        if not brand:
            brand = Brand(
                id="brand-test-001",
                name="Test Brand",
                owner_id="user-test-001",  # 테스트 사용자
                description="Test brand for integration tests",
            )
            db.add(brand)
            db.commit()
            print(f"✅ Created test brand: brand-test-001")
        else:
            print(f"ℹ️  Test brand already exists: brand-test-001")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed test brand: {e}")
        raise
    finally:
        db.close()

def seed_test_template():
    """테스트용 템플릿 생성"""
    db = SessionLocal()

    try:
        template = db.query(Template).filter(Template.id == "template-pitch-001").first()

        if not template:
            template = Template(
                id="template-pitch-001",
                name="Test Pitch Template",
                template_type="pitch",
                status="approved",
                is_public=True,
                editor_json={
                    "version": "3.0",
                    "objects": []
                }
            )
            db.add(template)
            db.commit()
            print(f"✅ Created test template: template-pitch-001")
        else:
            print(f"ℹ️  Test template already exists: template-pitch-001")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed test template: {e}")
        raise
    finally:
        db.close()

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("Creating test data for integration tests...")
    print("=" * 60)
    seed_test_brand()
    seed_test_template()
    print("\n✅ Test data setup completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

**Mac mini에서 실행**:

```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
python -m app.scripts.seed_test_data
```

---

## 3. 완료 기준

### 3.1 필수 완료 항목

- [ ] `backend/app/scripts/seed_test_user.py` 파일 생성
- [ ] Mac mini 서버에서 스크립트 실행 완료
- [ ] PostgreSQL에 `testuser@sparklio.ai` 계정 존재 확인
- [ ] 로그인 API 테스트 성공 (JWT 토큰 발급 확인)
- [ ] A팀에 완료 알림 (Slack/이메일)

### 3.2 선택 완료 항목

- [ ] `backend/app/scripts/seed_test_data.py` 파일 생성 (필요 시)
- [ ] Mac mini 서버에서 테스트 데이터 시드 실행 (필요 시)

---

## 4. 검증 방법

A팀에서 다음과 같이 검증합니다:

```bash
# 1. 로그인 테스트
curl -X POST http://100.123.51.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@sparklio.ai", "password": "testpass123"}'

# 2. Backend API 테스트 재실행
npm run test:backend
```

**성공 기준**:
- 로그인 API가 정상적으로 JWT 토큰 반환
- Backend API 테스트 성공률 90% 이상 (현재 7.4% → 90%+)

---

## 5. 예상 소요 시간

- **스크립트 작성**: 30분
- **Mac mini 실행 및 검증**: 15분
- **총 예상 시간**: **45분**

---

## 6. 참고 문서

- **시스템 아키텍처**: [docs/SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)
- **Mac mini 서버 가이드**: [docs/MAC_MINI_SERVER_GUIDELINES.md](../MAC_MINI_SERVER_GUIDELINES.md)
- **테스트 환경 설정**: `.env.test`

---

## 7. 문의사항

작업 중 문제가 발생하거나 질문이 있으면 A팀 QA Lead에게 연락해 주세요.

**연락처**: A팀 Slack 채널 또는 이메일

---

**작성일**: 2025-11-16
**작성자**: A팀 (QA & Testing)
**버전**: v1.0
