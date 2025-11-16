"""
테스트용 사용자 계정 생성 스크립트

실행 방법:
  cd ~/sparklio_ai_marketing_studio/backend
  source .venv/bin/activate
  python -m app.scripts.seed_test_user

작성일: 2025-11-16
작성자: B팀 (Backend)
목적: A팀 통합 테스트를 위한 테스트 사용자 계정 생성
"""

from app.core.database import SessionLocal
from app.models.user import User
from app.auth.password import get_password_hash
import logging
import uuid

logger = logging.getLogger(__name__)

# 테스트용 계정 정보
TEST_EMAIL = "testuser@sparklio.ai"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpass123"
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"  # 고정 UUID (테스트에서 참조용)


def seed_test_user():
    """테스트용 사용자를 생성하거나 업데이트합니다."""
    db = SessionLocal()

    try:
        # 기존 사용자 확인 (email, username, 또는 ID로 조회)
        user = db.query(User).filter(
            (User.email == TEST_EMAIL) |
            (User.username == TEST_USERNAME) |
            (User.id == uuid.UUID(TEST_USER_ID))
        ).first()

        if not user:
            # 새로운 테스트 사용자 생성
            user = User(
                id=uuid.UUID(TEST_USER_ID),  # 고정 ID (테스트에서 참조용)
                email=TEST_EMAIL,
                username=TEST_USERNAME,
                hashed_password=get_password_hash(TEST_PASSWORD),
                full_name="Test User",
                phone=None,
                role="admin",  # Admin 권한 부여 (모든 API 접근 가능)
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"✅ Created test user: {TEST_EMAIL}")
            print(f"✅ Test user created successfully!")
            print(f"   ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")
        else:
            # 기존 사용자 업데이트 (비밀번호 재설정 및 권한 복구)
            user.email = TEST_EMAIL
            user.username = TEST_USERNAME
            user.hashed_password = get_password_hash(TEST_PASSWORD)
            user.role = "admin"
            user.is_active = True
            user.is_verified = True
            user.deleted_at = None  # Soft delete 복구
            db.commit()
            db.refresh(user)
            logger.info(f"✅ Updated test user: {TEST_EMAIL}")
            print(f"✅ Test user updated successfully!")
            print(f"   ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")

        return user

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed test user: {e}")
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


def verify_test_user():
    """생성된 테스트 사용자를 검증합니다."""
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == TEST_EMAIL).first()

        if not user:
            print("❌ Test user not found in database")
            return False

        print("\n📋 Test user verification:")
        print(f"   ✅ User exists in database")
        print(f"   ✅ ID: {user.id}")
        print(f"   ✅ Email: {user.email}")
        print(f"   ✅ Username: {user.username}")
        print(f"   ✅ Role: {user.role}")
        print(f"   ✅ Is Active: {user.is_active}")
        print(f"   ✅ Is Verified: {user.is_verified}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to verify test user: {e}")
        print(f"❌ Verification error: {e}")
        return False
    finally:
        db.close()


def main():
    """메인 실행 함수"""
    print("=" * 70)
    print("Sparklio Backend - Test User Seed Script")
    print("=" * 70)
    print("\n🚀 Creating test user for integration tests...")
    print()

    # 1. 테스트 사용자 생성/업데이트
    try:
        seed_test_user()
    except Exception as e:
        print(f"\n❌ Failed to create/update test user: {e}")
        return

    # 2. 검증
    print()
    if verify_test_user():
        print("\n✅ Test user setup completed successfully!")
    else:
        print("\n❌ Test user verification failed!")
        return

    # 3. 사용 방법 안내
    print("\n" + "=" * 70)
    print("📝 Test User Credentials:")
    print("=" * 70)
    print(f"   Email:    {TEST_EMAIL}")
    print(f"   Password: {TEST_PASSWORD}")
    print(f"   Role:     admin")
    print("=" * 70)
    print("\n💡 Next Steps:")
    print("   1. Test login API:")
    print(f'      curl -X POST http://localhost:8000/api/v1/users/login \\')
    print(f'        -H "Content-Type: application/json" \\')
    print(f'        -d \'{{"email":"{TEST_EMAIL}","password":"{TEST_PASSWORD}"}}\'')
    print()
    print("   2. Run integration tests:")
    print("      npm run test:backend")
    print("=" * 70)


if __name__ == "__main__":
    main()
