# Now we are creating test engine
from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker
from config import TEST_DATABASE_URL
from database import Base , SessionLocal
import models
from app.main import app
from database import get_db
# Import TestClient
from fastapi.testclient import TestClient
import pytest

# API → override_get_db() → teamflow_test DB

# Pytest should use test_engine → teamflow_test.
test_engine = create_engine(TEST_DATABASE_URL)
Base.metadata.create_all(bind=test_engine)

TestingSessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=test_engine
)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)