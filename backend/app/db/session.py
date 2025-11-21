"""Database session management utilities"""

from sqlalchemy.orm import Session
from .database import SessionLocal


def get_session() -> Session:
    """
    Get a database session
    """
    return SessionLocal()


class DatabaseSession:
    """
    Context manager for database sessions

    Usage:
        with DatabaseSession() as db:
            user = db.query(User).first()
    """

    def __init__(self):
        self.db = None

    def __enter__(self):
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.db:
            if exc_type:
                self.db.rollback()
            else:
                self.db.commit()
            self.db.close()