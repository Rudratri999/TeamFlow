from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect  # pyright: ignore[reportMissingImports]
from models import Membership
from database import get_db
from app.core.security import get_current_user_ws
from app.core.app_logger import logger
router = APIRouter()

# Websocket keeps open connection between frontend and backend
# When user A update task -> FastApi -> Websocket -> other user in org -> Kanban board get updated.

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, organization_id: int , user_id:int):
        # Accepts the WebSocket connection.
        await websocket.accept()

        # Checks whether the organization already has a connection list.
        # Creates one if needed.
        if organization_id not in self.active_connections:
            self.active_connections[organization_id] = []

        # Adds the user to that organization's list.
        self.active_connections[organization_id].append((websocket, user_id))

# Find organization → find connection → remove it → if no users remain, remove organization from manager
    def disconnect(self, websocket: WebSocket, organization_id: int):
        connections = self.active_connections.get(organization_id)

        if not connections:
            return

        for connection in connections.copy():
            if connection[0] == websocket:
                connections.remove(connection)
                break

        if not connections:
            del self.active_connections[organization_id]

    def disconnect_user(self, user_id: int, organization_id: int):
        connections = self.active_connections.get(organization_id)

        if not connections:
           return

        for connection in connections.copy():
           if connection[1] == user_id:
            connections.remove(connection)

        if not connections:
           del self.active_connections[organization_id]

    async def broadcast(self, organization_id: int, message: str):
        # Now it broadcast to only org1 = users not org2 but what happends is if 1 user broken then entire broadcast gets broke.
        # for connection in self.active_connections.get(organization_id,[]):
        #     await connection.send_text(message)
# connection[0] → WebSocket
# connection[1] → user_id

# "Give me the connections for this organization. If that organization doesn't exist in the dictionary, give me an empty list."
# organization_id:1 ,  [connection_a, connection_b]   
        connections = self.active_connections.get(organization_id , [])
        # connections.copy() also lets us safely remove a connection while iterating.
        for connection in connections.copy():
            try:
                await connection[0].send_text(message)
            except Exception:
                self.disconnect(connection[0] , organization_id)


manager = ConnectionManager()

# manager is the user connected through the channel , user A change task it will boradcast to everyone in that channel.

@router.websocket("/ws/{organization_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    organization_id: int,
    db = Depends(get_db),
    current_user = Depends(get_current_user_ws)
    ):

    membership = db.query(Membership).filter(
        Membership.organization_id == organization_id,
        Membership.user_id == current_user.id
    ).first()
    if not membership:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket , organization_id , current_user.id)
    logger.info(f"User {current_user.id} connected to organization {organization_id}")

    try:
        while True:
            data = await websocket.receive_text()
            # await manager.broadcast(organization_id , data )

    except WebSocketDisconnect:
        manager.disconnect(websocket , organization_id)
        logger.info(f"User {current_user.id} disconnected to organization {organization_id}")

    except Exception:
        manager.disconnect(websocket, organization_id)
        logger.info(f"User {current_user.id} disconnected from organization {organization_id}")

# Instead if shared list we want that Only org A : users receive the update not org B users also
# This allows us to broadcast updates only to members of the relevant organization.
# self.active_connections = {} it is dictionary and it look like , below 1, 2 are org id and list stores user connected user in each org
# {
#  1:[websocket_a , websocket_b]
#  2:[webscoket_c]
# }