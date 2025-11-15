"""
비밀번호 해싱 및 검증

bcrypt를 사용한 안전한 비밀번호 저장
"""

from passlib.context import CryptContext

# bcrypt 컨텍스트 생성
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """
    비밀번호를 해싱합니다.

    Args:
        password: 평문 비밀번호

    Returns:
        해싱된 비밀번호
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    비밀번호를 검증합니다.

    Args:
        plain_password: 평문 비밀번호
        hashed_password: 해싱된 비밀번호

    Returns:
        비밀번호가 일치하면 True, 아니면 False
    """
    return pwd_context.verify(plain_password, hashed_password)
