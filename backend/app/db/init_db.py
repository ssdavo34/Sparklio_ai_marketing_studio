"""Initialize database with tables and default data"""

from sqlalchemy import inspect
from .database import engine, Base
from .models import User, Session, Project, Asset, Template
import logging

logger = logging.getLogger(__name__)


def init_db():
    """
    Create all tables in the database
    """
    try:
        # Import all models to register them with Base
        from . import models  # noqa

        # Create all tables
        Base.metadata.create_all(bind=engine)

        # Check if tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        logger.info(f"Database initialized with tables: {tables}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False


def drop_all_tables():
    """
    Drop all tables (use with caution!)
    """
    Base.metadata.drop_all(bind=engine)
    logger.warning("All tables dropped from database")


def check_database_connection():
    """
    Check if database is accessible
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


if __name__ == "__main__":
    # Initialize database when running this file directly
    logging.basicConfig(level=logging.INFO)

    if check_database_connection():
        logger.info("Database connection successful")
        init_db()
    else:
        logger.error("Cannot connect to database")