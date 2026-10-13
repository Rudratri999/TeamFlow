Step-1 : creating virtual env inside backend folder -> then activate it -> 
installed pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary alembic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart redis httpx pytest pytest-asyncio

step-2 : create .env : databse_url , access_token_expires_minutes , algorithm , secret_key
step-3: create config import os  , load_dotenv() , access using os.getenv("")
step-4 :  create database.py  create_engine , sessionmaker , decalarative_base , get_db
step-5 : create models.py
relationship : User
 ├── memberships       → User has many Memberships
 └── assigned_tasks    → User has many Tasks

Organization
 ├── memberships       → Organization has many Memberships
 └── projects          → Organization has many Projects

Membership
 ├── user              → Membership belongs to one User
 └── organization      → Membership belongs to one Organization

Project
 └── tasks             → Project has many Tasks

Task
 ├── project           → Task belongs to one Project
 └── assignee          → Task belongs to one User

Review how your APIs handle:

Missing resources → 404

Unauthorized users → 401

Insufficient permissions → 403

Duplicate records → 409

Invalid input → 422

<!-- RBAC -->
Organization task permissions:
- Owners and admins can create, edit, and delete tasks, and assign or unassign tasks.
- Members can view tasks they are authorized to access and edit only the title of tasks assigned to themselves.
- Members cannot create or delete tasks, change task assignees, change priority, or update status through any request payload or assignment endpoint.
- The backend derives the acting user's role from their organization membership; forbidden writes return 403 and do not commit or broadcast task updates.

Backend validates/creates tokens.
Frontend initiates the refresh flow.

<!-- Websocket Flow -->
User opens TeamFlow
      ↓
Frontend opens WebSocket
      ↓
Browser automatically sends JWT cookie
      ↓
JWT is verified
      ↓
Get current_user
      ↓
Check current_user is a member of the organization
      ↓
If valid → accept WebSocket connection
      ↓
Add user to organization's connections
      ↓
Connection stays open
      ↓
Task Create/Update/Delete
      ↓
Backend broadcasts event
      ↓
All connected users in that organization receive it
      ↓
User disconnects/closes WebSocket
      ↓
manager.disconnect()

<!-- problem 1 : while user leaves the organization , though websocket is still connected active_connections[organization_id] -->
<!-- we want that removing member, also remove connection organization -> [ws1 , ws2]
we want org->[(ws1,user_id) , (ws2,user_id)] -->


What we've completed
✅ JWT authentication
✅ Organization membership authorization
✅ Organization-specific connections
✅ Task create/update/delete broadcasts
✅ Disconnect cleanup
✅ Unexpected disconnect handling
✅ User-specific disconnect
✅ Member-removal cleanup
✅ Connection logging
✅ Safer broadcasting


<!-- Websocket Message flow -->
1. Client → POST /tasks
        ↓
2. FastAPI creates task
        ↓
3. PostgreSQL is updated
        ↓
4. manager.broadcast() is called
        ↓
5. manager finds all WebSocket connections
   for that organization
        ↓
6. manager.send_text() sends the event
   to each connected client
        ↓
7. Frontend receives "task_created"

It runs earlier, when the client first opens the WebSocket.
Client opens ws://localhost/api/ws/1
        ↓
@router.websocket("/ws/{organization_id}")
        ↓
Authenticate user + check membership
        ↓
manager.connect()
        ↓
Connection stays OPEN