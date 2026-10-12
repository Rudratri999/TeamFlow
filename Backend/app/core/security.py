# Hashing the password using bcrypt
from passlib.context import CryptContext
from typing import Optional
from jose import jwt , JWTError 
from datetime import datetime, timedelta, timezone
from config import ACCESS_TOKEN_EXPIRE_MINUTES , REFRESH_TOKEN_EXPIRE_DAYS , ALGORITHM , SECRET_KEY 
from fastapi import Request , Response , HTTPException , status , Depends , WebSocketException , Cookie
from models import User
from database import get_db

# Initializes passlib context with bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def get_password_hash(password: str) -> str :
    return pwd_context.hash(password)

def verify_password(plain_password: str , hashed_password: str) -> bool :
    return pwd_context.verify(plain_password , hashed_password)

def create_access_token(data : dict , expires_delta: Optional[timedelta] = None) -> str : 
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp" : expire
    })
    return jwt.encode(to_encode , SECRET_KEY , algorithm=ALGORITHM)

def create_refresh_token(data : dict) -> str :
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp" : expire,
        "type" : "refresh"
    })
    return jwt.encode(to_encode ,SECRET_KEY , algorithm=ALGORITHM)

def get_current_user(request : Request , db = Depends(get_db)) -> User :
    # extract the token from cookies
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )

    # Decode the token
    try : 
        payload = jwt.decode(token , SECRET_KEY , algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token"
                )
        if payload.get("type") == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="User not found"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials"
            )

# For Websocket
def get_current_user_ws(
# 1.Read access_token from cookie
access_token: str | None = Cookie(alias="access_token"),
db = Depends(get_db)
) -> User:
    
    if not access_token:
       raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    try:
        # 2. Decode the JWT
        payload = jwt.decode(access_token , SECRET_KEY , algorithms=[ALGORITHM])

        # 3.Get user_id from payload
        user_id = payload.get("sub")
        if user_id is None or payload.get("type") == "refresh":
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        return user
    except(JWTError):
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)