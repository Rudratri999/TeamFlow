from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth , organizations , projects , tasks , websocket
from app.routers.websocket import router as websocket_router
from app.core.redis_client import redis_client
from app.core.app_logger import logger


# Since your nginx expose backned under /api so , we have set root_path for fastapi
# This helps FastAPI generate correct URLs/docs when running behind Nginx.
app = FastAPI(root_path="/api")
logger.info("TeamFlow backend is starting up...")


origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

app.include_router(auth.router, prefix="/auth")
app.include_router(organizations.router, prefix="/organizations")
app.include_router(projects.router, prefix="/projects")
app.include_router(tasks.router, prefix="/tasks")
# Loads the websocket router defined in websocket.py so our endpoint is /ws become avail to application
app.include_router(websocket_router)



@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/redis-test")
def redis_test():
    redis_client.set("test" , "Hello Redis")
    return {"message" : redis_client.get("test")}

@app.get("/health/redis")
def redis_health():
    return {"redis": redis_client.ping()}