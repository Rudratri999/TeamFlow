from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Date
)

from database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer , primary_key=True)
    name = Column(String , nullable=False)
    email = Column(String , unique=True , nullable=False)
    password = Column(String , nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    memberships = relationship("Membership" , back_populates="user")
    assigned_tasks = relationship("Task", back_populates="assignee")


class Organization(Base):
    __tablename__  = "organizations"
    id = Column(Integer , primary_key=True)
    name = Column(String , nullable=False)
    created_at = Column(
            DateTime(timezone=True),
            default=func.now()
        )
    updated_at = Column(
            DateTime(timezone=True),
            default=func.now(),
            onupdate=func.now()
        )
    # Organization
    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization" , cascade="all, delete-orphan")

class Membership(Base):
    __tablename__ = "memberships"
    id = Column(Integer , primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id" , ondelete="CASCADE"),
        nullable=False
        )
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id" , ondelete="CASCADE"),
        nullable=False
        )
    role = Column(
        String,
        nullable=False
    )
    created_at = Column(
        DateTime(timezone=True),
        default=func.now()
    )
    # Membership
    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")

class Project(Base) : 
    __tablename__ = "projects"
    id = Column(Integer , primary_key=True)
    organization_id = Column(
            Integer,
            ForeignKey("organizations.id" , ondelete="CASCADE"),
            nullable=False
            )
    name = Column(String , nullable=False)
    description = Column(
        Text,
        nullable=True
    )
    created_at = Column(
            DateTime(timezone=True),
            default=func.now()
        )
    updated_at = Column(
            DateTime(timezone=True),
            default=func.now(),
            onupdate=func.now()
        )
    # Project
    organization = relationship("Organization", back_populates="projects")
    tasks = relationship("Task", back_populates="project" , cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    assignee_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False
    )

    priority = Column(
        String(20),
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now()
    )
    # Task
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")