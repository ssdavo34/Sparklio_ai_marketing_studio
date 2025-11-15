"""
비밀번호 해싱 및 검증

bcrypt를 사용한 안전한 비밀번호 저장
"""

import bcrypt


def get_password_hash(password: str) -> str:
    """
    비밀번호를 해싱합니다.

    Args:
        password: 평문 비밀번호

    Returns:
        해싱된 비밀번호

    Note:
        bcrypt는 최대 72바이트까지만 지원합니다.
    """
    # bcrypt는 72바이트 제한이 있으므로 긴 비밀번호는 잘라냅니다
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # salt 생성 및 해싱
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    비밀번호를 검증합니다.

    Args:
        plain_password: 평문 비밀번호
        hashed_password: 해싱된 비밀번호

    Returns:
        비밀번호가 일치하면 True, 아니면 False
    """
    # bcrypt는 72바이트 제한이 있으므로 긴 비밀번호는 잘라냅니다
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
