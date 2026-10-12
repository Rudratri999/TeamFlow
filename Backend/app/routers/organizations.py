from fastapi import FastAPI , HTTPException , APIRouter , Depends , status
from database import get_db
from app.core.security import get_current_user
from models import Organization , User , Membership , Project , Task
from schemas import OrganizationCreate , OrganizationResponse , AddRequestMember , ChangeRole , UpdateOrganization, TransferOwnership , AssignTask , TaskStatusUpdate , TaskPriorityUpdate , TaskResponse
from sqlalchemy import func , desc
from datetime import date , timedelta
from app.core.redis_client import get_cache , set_cache , delete_cache
import json
from app.routers.websocket import manager
router = APIRouter()

async def broadcast_task_updated(organization_id: int, project_id: int, task: Task):
     event_payload = {
          "event": "Task Updated",
          "organization_id": organization_id,
          "project_id": project_id,
          "data": {
               "id": task.id,
               "title": task.title,
               "description": task.description,
               "status": task.status,
               "assignee_id": task.assignee_id,
               "priority": task.priority,
               "due_date": task.due_date.isoformat() if task.due_date else None
          }
     }
     await manager.broadcast(organization_id, json.dumps(event_payload))

@router.post("/create-organization" , response_model=OrganizationResponse)
def create_organization(
    organization : OrganizationCreate,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(User).filter(
          User.id == current_user.id
     ).first()

    if not db_user:
          raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail= "Not valid user"
          )

    new_organization = Organization(
         name= organization.name
    )
    db.add(new_organization)
    db.commit()
    db.refresh(new_organization)

    new_membership = Membership(
      user_id=current_user.id,
      organization_id=new_organization.id,
      role="owner"

    )
    db.add(new_membership)
    db.commit()
    

    return new_organization

# 2. all current_user organization which user belong to
@router.get("/organizations" , response_model=list[OrganizationResponse])
def get_organizations(
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
     organizations = db.query(Organization).join(Membership).filter(
            Membership.user_id == current_user.id
     ).all()

     return organizations

# 3 . Specific organization
@router.get("/organizations/{organization_id}")
def specific_orgainization(
    organization_id : int,
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
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )

    return organization


@router.get("/organizations/{organization_id}/membership")
def get_current_membership(
    organization_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    return {
        "organization_id": membership.organization_id,
        "user_id": membership.user_id,
        "role": membership.role
    }


#  4 . The following endpoint retrieves the members of a specific organization. 

# It checks if the current user is a member of the organization before returning the list of members. 
# If the user is not a member, it raises a 403 Forbidden error.
@router.get("/organizations/{organization_id}/members")
def get_organization_member(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
   membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
   ).first()

   if not membership:
       raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )
   
   members = db.query(Membership).filter(
       Membership.organization_id == organization_id
   ).all()  

   return members


# 5 . Add member
@router.post("/organizations/{organization_id}/members")
def add_member(
    organization_id : int,
    data : AddRequestMember,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
# Before adding user to the organization , we need to check :
# 1.the person who adds the user to org , is current_user/role=admin||owner , also from organization
#  Person who's addong is from same org or not
# Person's is = current user's id or not

  membership = db.query(Membership).filter(
     Membership.organization_id == organization_id,
     Membership.user_id == current_user.id
  ).first()

  if not membership:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Forbidden"
      )
# it checks the role of current_user
  if not (membership.role == "owner" or membership.role == "admin"):
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not allowed to add"
      )

# if need to check that , the user we are trying to add in , is actually exist in User table
  user = db.query(User).filter(
      User.id == data.user_id
  ).first()

  if not user:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="Not Found"
      )
# this below condtion checks that the user we are trying add is already in organization or member
  existing_membership = db.query(Membership).filter(
      Membership.user_id == data.user_id,
      Membership.organization_id == organization_id
  ).first()

  if existing_membership:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="User is already a member of this organization"
    )

  add_user = Membership(
      user_id = user.id,
      organization_id = organization_id,
      role = "member"
  )

  db.add(add_user)
  db.commit()
  delete_cache(f"dashboard:org:{organization_id}")
  db.refresh(add_user)
  return add_user


# ------------------- Dashboard Summary ------------------------
@router.get("/organizations/{organization_id}/dashboard")
def dashboard_summary(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()
     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     # Each organization needs its own cached dashboard, so organization_id must be part of the key.

     cache_key = f"dashboard:org:{organization_id}"
     cache_data = get_cache(cache_key)
     if cache_data:
          return json.loads(cache_data)

     organization = db.query(Organization).filter(
          Organization.id == organization_id
     ).first()
     if not organization:
            raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail="Not Found"
            )
    #  To count use .count()
     member_count = db.query(Membership).filter(
          Membership.organization_id == organization_id
    ).count()

     project_count = db.query(Project).filter(
          Project.organization_id == organization_id
     ).count()

     task_count = db.query(Task).join(Project).filter(
          Project.organization_id == organization_id
     ).count()

     result =  {
          "members" : member_count,
          "projects" : project_count,
          "tasks" : task_count
     }
     set_cache(cache_key, json.dumps(result))

     return result


# ----------------- Task Status DashBoard Summary ------------------
@router.get("/organizations/{organization_id}/tasks/summary")
def task_summary(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )

     status_count = (
        db.query(Task.status , func.count(Task.id))
        .join(Project , Task.project_id == Project.id)
        .filter(Project.organization_id == organization_id)
        .group_by(Task.status)
        .all()
     )

     # 3. Initialize your response dictionary with zero defaults
     # This guarantees all statuses are always present in the response

     summary = {
          "todo" : 0,
          "in_progress" : 0,
          "done" : 0
     }

     for status_name , count in status_count :
          if status_name in summary:
               summary[status_name] = count

     return summary

@router.get("/organizations/{organization_id}/tasks/priority-summary")
def task_priority_summary(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )

     priority_count = (
          db.query(Task.priority , func.count(Task.id))
          .join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id)
          .group_by(Task.priority)
          .all()
     )    

     priority_summary = {
          "low" : 0,
          "medium" : 0,
          "high" : 0
     }

     for priority_name , count in priority_count:
          if priority_name in priority_summary:
               priority_summary[priority_name] = count

     return priority_summary

@router.get("/organizations/{organization_id}/tasks/overdue", response_model=list[TaskResponse])
def due_date_task(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     today_date = date.today()     
     overdue_task = (
        db.query(Task)
        .join(Project , Task.project_id == Project.id)
        .filter(Project.organization_id == organization_id , Task.due_date < today_date , Task.status != "done")
        .all()
     )  

     return overdue_task

@router.get("/organizations/{organization_id}/tasks/unassigned" , response_model=list[TaskResponse])
def due_date_task(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
    #  .is_(None) = check that which task has not assigned any id return that
     unassigned_task = (
          db.query(Task).join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id , Task.assignee_id.is_(None))
          .all()
     )
     return unassigned_task
# ---------------------- Task which are due soon -------------------------------
@router.get("/organizations/{organization_id}/tasks/due-soon" , response_model=list[TaskResponse])
def due_date_task(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     today_date = date.today()
     next_week = today_date + timedelta(days=7)

     task_due_soon = (
          db.query(Task).join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id , 
                  Task.due_date >= today_date,
                  Task.due_date <= next_week,
                  Task.status != "done"
                  ).all()
     )

     return task_due_soon

# --------------------------- Recent task -----------------------
@router.get("/organizations/{organization_id}/tasks/recent")
def due_date_task(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     recent_tasks = (
          db.query(Task).join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id)
          .order_by(Task.created_at.desc()).limit(10).all()
     )

     return recent_tasks

@router.get("/organizations/{organization_id}/tasks/recent-updated")
def due_date_task(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     recent_tasks = (
          db.query(Task).join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id)
          .order_by(Task.updated_at.desc()).limit(10).all()
     )


     return recent_tasks

# ---------------- Search Task ---------------------
@router.get("/organizations/{organization_id}/tasks/search")
def due_date_task(
     query: str,
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )

     search_term = f"%{query}%"
     search_task = (
          db.query(Task).join(Project , Task.project_id == Project.id)
          .filter(Project.organization_id == organization_id, 
                  Task.title.ilike(search_term)
                  ).all()
     )
     if not search_task:
        raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Not Found"
        )
     return search_task

# --------------------- Project Search ------------------------
@router.get("/organizations/{organization_id}/projects/search")
def due_date_task(
     query: str,
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)     
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()

     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )

     search_term = f"%{query}%"
     search_project = (
          db.query(Project)
          .filter(Project.organization_id == organization_id, 
                  Project.name.ilike(search_term)
                  ).all()
     )
     if not search_project:
        raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Not Found"
        )
     return search_project





# In TeamFlow, a user should be able to quickly see their own assigned tasks across projects.
# Next: Get Tasks Assigned to Current User
@router.get("/organizations/{organization_id}/my_tasks")
def user_assigned_task(
      organization_id : int,
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
      
      tasks = db.query(Task).join(Project).filter(
            Task.assignee_id == current_user.id,
            Project.organization_id == organization_id
      ).all()
      return tasks


# Get organization projects that have at least one task assigned to current_user.
@router.get("/organizations/{organization_id}/my_projects")
def user_project(
     organization_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
     membership = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()
     if not membership:
          raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="Forbidden"
          )
     projects = (
          db.query(Project)
          .join(Task, Task.project_id == Project.id)
          .filter(
               Project.organization_id == organization_id,
               Task.assignee_id == current_user.id
          )
          .distinct()
          .all()
     )

     return projects

# Next: Get Organization Members with Their User Details
@router.get("/organizations/{organization_id}/members/details")
def get_user_detail(
      organization_id : int,
      db = Depends(get_db),
      current_user = Depends(get_current_user)
):
      membership = db.query(Membership).filter(
            Membership.organization_id == organization_id,
            Membership.user_id == current_user.id
      ).first()
      if not membership:
       raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )   
    #   So User is needed because the endpoint is specifically for member details.
      get_membership = db.query(Membership).join(User).filter(
           Membership.organization_id == organization_id,
      ).all()
      if not get_membership:
           raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not Found"
           )
      return get_membership


# ------------------ Get Tasks Assigned to a Specific User------------------------------
# An admin/manager may want to see all tasks assigned to a particular organization member.
@router.get("/organizations/{organization_id}/users/{user_id}/tasks")
def task_assigned_to_specific_user(
    organization_id : int,
    user_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
   membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
   ).first()

   if not membership:
       raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )
   if membership.role not in ["admin","owner"]:
        raise HTTPException(
             status_code=status.HTTP_403_FORBIDDEN,
             detail="Not Allowed"
        )
   target_member = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.organization_id == organization_id
   ).first()
   if not target_member:
        raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="User is not member of organization"
        )

   assign_task = (
        db.query(Task).join(Project , Task.project_id == Project.id)
        .filter(Project.organization_id == organization_id,
                Task.assignee_id == user_id
                ).all()
   )
   if not assign_task:
        raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Not Found"
        )

   return assign_task


# remove memeber/from an organization
@router.delete("/organizations/{organization_id}/members/{user_id}")
def remove_member(
    organization_id : int,
    user_id : int,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
# 1.Checking current_user is member of org
 membership = db.query(Membership).filter(
     Membership.user_id == current_user.id,
     Membership.organization_id == organization_id
 ).first()

 if not membership:
       raise HTTPException(
           status_code=status.HTTP_403_FORBIDDEN,
           detail="Forbidden"
       )
# 2.checking that the current_user has role=owner||admin
 if not (membership.role == "owner" or membership.role == "admin"):
     raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="Not allowed to remove"
          )

# 3.it checks that the user that we want to delete , is exist
 target_user = db.query(User).filter(
     User.id == user_id
 ).first()

 if not target_user:
     raise HTTPException(
         status_code=status.HTTP_404_NOT_FOUND,
         detail="Not found"
     )
 
#  4. it checks that target user is member of the organisation
 existing_target_user = db.query(Membership).filter(
     Membership.user_id == target_user.id,
     Membership.organization_id == organization_id
 ).first()

 if not existing_target_user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User is not a member of this organization"
    )
 
 if existing_target_user.role == "owner":
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Owner cannot be removed"
    )
 if user_id == current_user.id:
    raise HTTPException(
        status_code=403,
        detail="Use the leave organization endpoint"
    )
 

 db.delete(existing_target_user)
 db.commit()
 delete_cache(f"dashboard:org:{organization_id}")
 manager.disconnect_user(user_id,  organization_id)
 return {
      "message" : "Deleted Successfully"
 }

# -----------PATCH - change a memeber's role------------
# Role belongs to the membership because different user can have different role in multiple org.
@router.patch("/organizations/{organization_id}/members/{user_id}/role")
def change_role(
    organization_id : int,
    user_id : int,
    data : ChangeRole,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
#     1. Current user belongs to organization?
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.organization_id == organization_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
# Checking the authrization of the current_user
    if not (membership.role == "owner" or membership.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to change role"
        )
# Checking that target_user(the person which rolw we want to change) is member of org.
    target_user = db.query(User).filter(
         User.id == user_id
     ).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    is_target_user_member = db.query(Membership).filter(
        Membership.user_id == target_user.id,
        Membership.organization_id == organization_id
    ).first()
    if not is_target_user_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )

    if is_target_user_member.role == "owner":
         raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="Use transfer ownership to chnage owner"
         )
    
    if membership.role == "admin" and is_target_user_member.role == "admin":
        raise HTTPException(
        status_code=403,
        detail="Admin cannot change another admin's role"
    )

    if data.role == "owner":
     raise HTTPException(
        status_code=403,
        detail="Use transfer ownership to make someone owner"
    )

    is_target_user_member.role = data.role

    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    db.refresh(is_target_user_member)
    return is_target_user_member


# Purpose: allow an authorized organization member to change organization details, mainly the name.
@router.patch("/organizations/{organization_id}")
def update_organization(
    update_name : UpdateOrganization,
    organization_id : int,
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
    if member.role not in ["admin","owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )
    organization.name = update_name.name

    db.commit()
    db.refresh(organization)
    return organization

@router.delete("/organizations/{organization_id}")
def delete_organization(
    organization_id : int,
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
    if member.role not in ["owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed"
            )
    organization = db.query(Organization).filter(
            Organization.id == organization_id
        ).first()
    if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not Found"
            )
    db.delete(organization)
    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    return{
         "message":"Organization Deleted successfully"
    }

# The important concept: leaving an organization deletes the Membership record, not the User account.
@router.delete("/organizations/{organization_id}/leave")
def leave_organization(
    organization_id : int,
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

    if member.role == "owner":
         raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="Owner can not leave the organization"
         )

    db.delete(member)
    db.commit()
    delete_cache(f"dashboard:org:{organization_id}")
    manager.disconnect_user(current_user.id, organization_id)
    return {
         "message": "You successfully leave the organization"
    }

# Purpose: allow the current owner to transfer ownership to another member.
# Transfer the organization ownership
@router.patch("/organizations/{organization_id}/owner")
def transfer_ownership(
  organization_id : int,
  transfer_ownership : TransferOwnership,
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
    if member.role != "owner":
         raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="Forbidden"
         )
    
    if transfer_ownership.user_id == current_user.id:
         raise HTTPException(
            status_code=400,
            detail="You are already the owner"
    )
    targeted_user = db.query(Membership).filter(
         Membership.organization_id == organization_id,
         Membership.user_id == transfer_ownership.user_id
    ).first()
    if not targeted_user:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Not Found"
         )
    
    member.role = "admin"
    targeted_user.role = "owner"
    db.commit()
    return {
        "message": "Ownership transferred successfully"
    }

# --------------------Get One specific task----------------------
@router.get("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}")
def get_specific_task(
     organization_id : int,
     project_id : int,
     task_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
# Check current user is a member of the organization.
    member = db.query(Membership).filter(
          Membership.organization_id == organization_id,
          Membership.user_id == current_user.id
     ).first()
    if not member:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Forbidden"
                    )    
    # Check project belongs to the organization. 
    project = db.query(Project).filter(
         Project.organization_id == organization_id,
         Project.id == project_id
    ).first()
    if not project:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Not Found"
         )
    # Find task by task_id & project_id
    task = db.query(Task).filter(
         Task.id == task_id,
         Task.project_id == project_id
    ).first()
    if not task:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Not Found"
         )
    return task
    
# Next: Assign/reassign a task = Purpose: assign or reassign a task to another organization member.
@router.patch("/organizations/{organization_id}/projects/{project_id}/task/{task_id}/assignee")
async def assign_task(
     assign_user : AssignTask,
     organization_id : int,
     project_id : int,
     task_id : int,
     db = Depends(get_db),
     current_user = Depends(get_current_user)
):
# Check current user is a member of the organization.
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
                        detail="Only organization owners and admins can assign tasks"
                    )
    
    # Check project belongs to the organization. 
    project = db.query(Project).filter(
         Project.organization_id == organization_id,
         Project.id == project_id
    ).first()
    if not project:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Not Found"
         )    
    
    task = db.query(Task).filter(
         Task.id == task_id,
         Task.project_id == project_id
    ).first()
    if not task:
         raise HTTPException(
              status_code=status.HTTP_404_NOT_FOUND,
              detail="Not Found"
         )
    
    target_user = db.query(Membership).filter(
          Membership.organization_id == organization_id,
        #   it check that you are assigning the task , who's member of org or not
          Membership.user_id == assign_user.user_id
    ).first()
    if not target_user :
          raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not Found"
          )
    task.assignee_id = assign_user.user_id
    db.commit()
    db.refresh(task)
    delete_cache(f"dashboard:org:{organization_id}")
    await broadcast_task_updated(organization_id, project_id, task)
    return task

# -------------------- Unassign Task -----------------
@router.patch("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/unassign")
async def unassign_task(
      organization_id : int,
      project_id : int,
      task_id : int,
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
      if member.role not in ["admin", "owner"]:
            raise HTTPException(
                  status_code=status.HTTP_403_FORBIDDEN,
                  detail="Only organization owners and admins can unassign tasks"
            )

      project = db.query(Project).filter(
            Project.organization_id == organization_id,
            Project.id == project_id
      ).first()
      if not project:
            raise HTTPException(
                  status_code=status.HTTP_404_NOT_FOUND,
                  detail="Not Found"
            )

      task = db.query(Task).filter(
            Task.id == task_id,
            Task.project_id == project_id
      ).first()
      if not task:
            raise HTTPException(
                  status_code=status.HTTP_404_NOT_FOUND,
                  detail="Not Found"
            )

      task.assignee_id = None
      db.commit()
      db.refresh(task)
      delete_cache(f"dashboard:org:{organization_id}")
      await broadcast_task_updated(organization_id, project_id, task)
      return task

# status is give as req.body from client
# ----------- Update Status -------------------------
@router.patch("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/status")
async def update_status(
      status_update : TaskStatusUpdate,
      organization_id : int,
      project_id : int,
      task_id : int,
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

      project = db.query(Project).filter(
            Project.organization_id == organization_id,
            Project.id == project_id
      ).first()
      if not project:
            raise HTTPException(
                  status_code=status.HTTP_404_NOT_FOUND,
                  detail="Not Found"
            )

      task = db.query(Task).filter(
            Task.id == task_id,
            Task.project_id == project_id
      ).first()
      if not task:
            raise HTTPException(
                  status_code=status.HTTP_404_NOT_FOUND,
                  detail="Not Found"
            )

      if member.role not in ["admin", "owner"] and task.assignee_id != current_user.id:
            raise HTTPException(
                  status_code=status.HTTP_403_FORBIDDEN,
                  detail="Members can only update tasks assigned to themselves"
            )

      task.status = status_update.status

      db.commit()
      db.refresh(task)
      delete_cache(f"dashboard:org:{organization_id}")
      await broadcast_task_updated(organization_id, project_id, task)
      return task

# Update Priority
@router.patch("/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/priority")
async def update_priority(
      priority_update : TaskPriorityUpdate,
      organization_id : int,
      project_id : int,
      task_id : int,
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

      project = db.query(Project).filter(
            Project.id == project_id,
            Project.organization_id == organization_id
      ).first()
      if not project :
             raise HTTPException(
                   status_code=status.HTTP_404_NOT_FOUND,
                   detail="Not Found"
             )

      task = db.query(Task).filter(
            Task.id == task_id,
            Task.project_id == project_id
      ).first()
      if not task:
            raise HTTPException(
                  status_code=status.HTTP_404_NOT_FOUND,
                  detail="Not Found"
            )

      if member.role not in ["admin", "owner"] and task.assignee_id != current_user.id:
            raise HTTPException(
                  status_code=status.HTTP_403_FORBIDDEN,
                  detail="Members can only update tasks assigned to themselves"
            )

      task.priority = priority_update.priority

      db.commit()
      db.refresh(task)
      delete_cache(f"dashboard:org:{organization_id}")
      await broadcast_task_updated(organization_id, project_id, task)
      return task