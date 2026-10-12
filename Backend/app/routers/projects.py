from fastapi import FastAPI , Depends , APIRouter , status , HTTPException
from schemas import ProjectCreate , ProjectResponse , ProjectUpdate
from database import get_db
from models import Organization , Membership , Project
from app.core.security import get_current_user
from app.core.redis_client import delete_cache
# remember that user and project are not related 
# organization and project and task are related
router = APIRouter()

# --------- 1.Create Project -----------
@router.post("/organizations/{organization_id}/projects" , response_model=ProjectResponse)
def create_project(
    organization_id : int,
    project : ProjectCreate,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1.check current user is from organization or not
    member = db.query(Membership).filter(
      Membership.user_id == current_user.id,
      Membership.organization_id == organization_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="you are not a member of this organization"
        )
    
    if member.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to create project"
        )


    # name and description is entered by user , while org is directly assign from url 
    # that's why name,desc has project.name,desc and not project.orga
    new_project = Project(
        name = project.name,
        description = project.description,
        organization_id = organization_id
    )
    db.add(new_project)
    db.commit()
# this delete the old cache key when new project gets created called cache invalidation.
    delete_cache(f"dashboard:org:{organization_id}")
    db.refresh(new_project)

    return new_project

# --------- 2.fetch all Project -----------
@router.get("/organizations/{organization_id}/projects" , response_model=list[ProjectResponse])
def get_projects(
    organization_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.organization_id == organization_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    projects = db.query(Project).filter(
        Project.organization_id == organization_id
    ).all()

    return projects

 # --------- 3.User should able to change the project name and description -----------
@router.patch("/organizations/{organization_id}/projects/{project_id}" , response_model=ProjectResponse)
def update_project(
    update_project : ProjectUpdate,
    organization_id : int,
    project_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1.Is current user a member of the organization?
    member = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.organization_id == organization_id
    ).first()
    if not member : 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == organization_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    
    if member.role not in ["admin","owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )

    # project.name = update_project.name
    # project.description = update_project.description
    update_data = update_project.model_dump(exclude_unset=True)

    for field , value in update_data.items():
        setattr(project , field , value)

    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    db.refresh(project)
    return project

# --------- 4. Delete Project --------------
@router.delete("/organizations/{organization_id}/projects/{project_id}")
def delete_project(
    organization_id : int,
    project_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.organization_id == organization_id
    ).first()
    if not member : 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
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
    if member.role not in ["admin","owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )
    db.delete(project_exist)
    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    return{
        "message" : "Project Deleted Successfully"
    }

# ----------------5.Get Specific Project-----------------
@router.get("/organizations/{organization_id}/projects/{project_id}")
def get_specific_project(
    organization_id : int,
    project_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()
    if not member : 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    # find the project
    project = db.query(Project).filter(
        Project.organization_id == organization_id,
        Project.id == project_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )

    return project