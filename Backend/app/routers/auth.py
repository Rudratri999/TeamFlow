from fastapi import FastAPI , APIRouter , Depends , HTTPException , status , Response , Request
from sqlalchemy.orm import session
from database import get_db
from models import User
from schemas import UserCreate , UserResponse , UserLogin
from jose import jwt , JWTError
from config import ACCESS_TOKEN_EXPIRE_MINUTES , SECRET_KEY , REFRESH_TOKEN_EXPIRE_DAYS , ALGORITHM
from app.core.security import get_password_hash , get_current_user , verify_password , create_access_token , create_refresh_token

router = APIRouter()

#---------- Register Route ----------------
# UserCreate → check email → hash password → User model → DB → UserResponse.

@router.post("/register" , response_model=UserResponse)
def register(
    user : UserCreate,
    db=Depends(get_db)
    
) :
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user : 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )

    hashed_password = get_password_hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# ---------- Login Route --------------
# UserLogin → find user by email → verify password → create access token → return token

@router.post("/login")
def login(
    response : Response,
    user : UserLogin,
    db = Depends(get_db),
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(user.password , db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
   
#    access_token = create_access_token(data = {"sub": db_user.name})
#    refresh_token = create_refresh_token(data = {"sub" : db_user.name})
# First we are checking with Username . let's if two user has same name then it get's difficult to find which user.
# So instead we use id because it's unique for all.
# str(db_user.id) stores like "101" then goes to get_current_user func then we convert it to int before checking in db.
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {
        "message" : "Login Successfully",
        "username" : db_user.name
    }

# ---------- refresh endpoint ----------
# extract token -> check !token -> decode it -> check it's type = "refresh" -> get "sub" -> new_token(access_token)
# set that new token
@router.post("/refresh")
def refresh (
   request : Request,
   response : Response
):
    token = request.cookies.get("refresh_token")
    if not token:
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED, 
               detail="Not authenticated"
           )
    try:
       payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

       if payload.get("type") != "refresh":
          raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
       )
    #    username: str = payload.get("sub")
       user_id: str = payload.get("sub")
       if user_id is None:
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail="Invalid token"
           )
       new_access_token = create_access_token(data={"sub": user_id})
       response.set_cookie(
           key="access_token",
           value=new_access_token,
           httponly=True,
           samesite="lax",
           secure=False
       )
       return {"message": "Access token refreshed"}
    except JWTError:
       raise HTTPException(
           status_code=status.HTTP_401_UNAUTHORIZED,
           detail="Could not validate credentials"
       )

# --------- Logout Router------
@router.post("/logout")
def logout(
    response : Response
):
  
  response.delete_cookie("access_token")
  response.delete_cookie("refresh_token")

  return {
    "message" : "Logout Successfully"
  } 
   
@router.get("/profile", response_model=UserResponse)
def profile(
    current_user = Depends(get_current_user)
): 
   return current_user

         
