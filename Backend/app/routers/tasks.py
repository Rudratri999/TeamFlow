
from fastapi import FastAPI,status,APIRouter,Depends,HTTPException
from models import Organization , Project , Task , Membership , User
from schemas import TaskCreate , TaskResponse , TaskUpdate
from database import get_db
from app.core.security import get_current_user
from app.core.redis_client import delete_cache
from app.routers.websocket import manager
import json

router = APIRouter()

# ---------- 1.create task -------------
@router.post("/organizations/{organization_id}/projects/{project_id}/tasks" , response_model=TaskResponse)
async def create_task(
    organization_id : int,
    project_id : int,
    task : TaskCreate,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    if member.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners and admins can create tasks"
        )

    project_exist = db.query(Project).filter(
        Project.organization_id == organization_id,
        Project.id == project_id
    ).first()

    if not project_exist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    # it checks that if assgnee_id is same as User.id both are realted
    if task.assignee_id is not None:
        task_assignee_user = db.query(User).join(Membership).filter(
            User.id == task.assignee_id,
            Membership.organization_id == organization_id
        ).first()

        if not task_assignee_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assign user is not found in organization"
            )

    new_task = Task(
        project_id = project_id,
        title = task.title,
        description = task.description,
        status = task.status,
        assignee_id = task.assignee_id,
        priority = task.priority,
        due_date = task.due_date
    )

    db.add(new_task)
    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    db.refresh(new_task)

    event_payload = {
        "event": "Task Created",
        "organization_id": organization_id,
        "project_id": project_id,
        "data": {
            "title": new_task.title,
            "description": new_task.description,
            "status": new_task.status,
            "assignee_id": new_task.assignee_id,
            "priority": new_task.priority,
            "due_date": new_task.due_date.isoformat() if new_task.due_date else None
        }
    }
    await manager.broadcast(organization_id , json.dumps(event_payload))

    return new_task


@router.put("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}")
async def update_task(
    update_task : TaskUpdate,
    organization_id : int,
    project_id : int,
    task_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1.Check current user is a member of the organization.
    member = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    # 2.Find the project using project_id and verify it belongs to organization_id.
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == organization_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    # 3.Find the task using task_id and verify it belongs to project_id.
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    is_admin = member.role in ["admin", "owner"]
    if not is_admin:
        if task.assignee_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only edit tasks assigned to themselves"
            )
        disallowed_fields = set(update_task.model_fields_set) - {"title"}
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only edit task titles"
            )

    # 4.If assignee_id is being changed, verify that the new assignee belongs to the organization.
    if "assignee_id" in update_task.model_fields_set:
        if update_task.assignee_id is None:
            task.assignee_id = None
        else:
            task_assign_id = db.query(User).join(Membership).filter(
                User.id == update_task.assignee_id,
                Membership.organization_id == organization_id
            ).first()

            if not task_assign_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assign user is not found in organization"
                )

            task.assignee_id = update_task.assignee_id

    # modify the fetched task (update already fetch task via task.)
    if update_task.title is not None:
        task.title = update_task.title

    if update_task.description is not None:
        task.description = update_task.description

    if update_task.status is not None:
        task.status = update_task.status

    if update_task.priority is not None:
        task.priority = update_task.priority

    if update_task.due_date is not None:
        task.due_date = update_task.due_date

    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    db.refresh(task)
    event_payload = {
        "event": "Task Updated",
        "organization_id": organization_id,
        "project_id": project_id,
        "data": {
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "assignee_id": task.assignee_id,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None
        }
    }
    await manager.broadcast(organization_id , json.dumps(event_payload))

    
    return task


@router.delete("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}")
async def delete_task(
    organization_id : int,
    project_id : int,
    task_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # 1.Check current user is a member of the organization.
    member = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    if member.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to delete tasks"
        )

    # 2.Find the project using project_id and verify it belongs to organization_id.
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == organization_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    # 3.Find the task using task_id and verify it belongs to project_id.
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    db.delete(task)
    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    event_payload = {
        "event": "Task Deleted",
        "organization_id": organization_id,
        "project_id": project_id,
        "data": {
            "id": task.id
        }
    }
    # Below is server to client broadcast, so that all users in that org will get the update
    await manager.broadcast(organization_id , json.dumps(event_payload))
    return {"message": "Task deleted successfully"}


@router.get("/organizations/{organization_id}/projects/{project_id}/tasks", response_model=list[TaskResponse])
def get_tasks(
    organization_id : int,
    project_id : int,
    status: str | None = None,
    priority: str | None = None,
    assignee_id: int | None = None,
    # Pagination if project has 1000 tasks then, GET /organizations/1/projects/5/tasks?skip=0&limit=10
    skip : int = 0,
    limit : int = 10,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1.Check current user is a member of the organization.
    member = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    # 2.Find the project using project_id and verify it belongs to organization_id.
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == organization_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    tasks_query = db.query(Task).filter(
        Task.project_id == project_id
    )
# Why: each filter is optional, so only the filters provided by the frontend are applied.
    if status:
        tasks_query = tasks_query.filter(Task.status == status)
    if priority:
        tasks_query = tasks_query.filter(Task.priority == priority)
    if assignee_id:
        tasks_query = tasks_query.filter(Task.assignee_id == assignee_id)

    tasks = tasks_query.offset(skip).limit(limit).all()
    return tasks

@router.get(
    "/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}",
    response_model=TaskResponse
)
def get_task(
    organization_id: int,
    project_id: int,
    task_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check that the current user belongs to the organization
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this organization"
        )

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == organization_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task