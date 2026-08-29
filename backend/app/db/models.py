"""
backend/app/db/models.py

SQLAlchemy ORM models for storing ingested systems, simulation history, and users.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime
from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserModel(Base):
    """
    ORM model for self-hosted user accounts.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")
    created_at = Column(DateTime, default=utc_now)


class SystemModel(Base):
    """
    ORM model for ingested system topology graphs and metadata.
    """
    __tablename__ = "systems"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    stats_json = Column(Text, nullable=False)
    graph_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)


class SimulationModel(Base):
    """
    ORM model for recorded schema change simulation runs and impact results.
    """
    __tablename__ = "simulations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_component = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Schema Change")
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # 'Low', 'Medium', 'High'
    v1_sql = Column(Text, nullable=False)
    v2_sql = Column(Text, nullable=False)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
