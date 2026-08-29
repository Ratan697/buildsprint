"""
backend/app/db/models.py

SQLAlchemy ORM models for storing ingested systems and simulation execution history.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime
from app.db.database import Base


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
    created_at = Column(DateTime, default=datetime.utcnow)


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
    v1_sql = Column(Text, nullable=True)
    v2_sql = Column(Text, nullable=True)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

