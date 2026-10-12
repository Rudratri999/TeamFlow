from datetime import datetime , date
from typing import  Optional , Literal
from pydantic import BaseModel, ConfigDict, Field

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at : datetime
      
     # Pydantic V2 configuration to read SQLAlchemy model attributes directly
     
    model_config = ConfigDict(from_attributes=True)

# ------- Organization Schemas --------
class OrganizationCreate(BaseModel):
    name: str

class OrganizationResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    
    model_config = ConfigDict(from_attributes=True)
# Updating organization name
class UpdateOrganization(BaseModel):
    name : str

# Assign task
class AssignTask(BaseModel):
    user_id : int

# Adding a user to member(when you need a i/p from user you can create schema)
class AddRequestMember(BaseModel):
    user_id : int

# Change role(when you need a i/p from user you can create schema)
class ChangeRole(BaseModel):
    role : Literal["admin" , "member"]

# Transfer Ownership
class TransferOwnership(BaseModel):
    user_id : int

# ------- Membership Schemas --------
class MembershipCreate(BaseModel):
    user_id: int
    organization_id: int
    role: str

class MembershipResponse(BaseModel):
    id: int
    user_id: int
    organization_id: int
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------Projects Schemas --------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: int

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    organization_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectUpdate(BaseModel):
    name : str
    description: Optional[str] = None
    
# --------------------------------------------------------------------------------------------------
# ------- Task Schemas ---------
class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Literal["todo", "in_progress", "done"]
    priority: Literal["low", "medium", "high"]
    due_date: Optional[date] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Literal["todo", "in_progress", "done"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due_date: Optional[date] = None

class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    assignee_id: Optional[int] = None
    priority: str
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Comes as req.body from client
class TaskStatusUpdate(BaseModel):
    status : Literal["todo" , "in_progress" , "done"]

# Comes as req.body from client
class TaskPriorityUpdate(BaseModel):
    priority: Literal["low", "medium", "high"]