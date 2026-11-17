from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="User Registration")
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account and generate an initial JWT session token."""
    # Check if email or username already taken
    existing_user_query = select(User).where(
        or_(User.email == user_in.email.lower(), User.username == user_in.username.lower())
    )
    result = await db.execute(existing_user_query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.email.lower() == user_in.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another."
            )

    new_user = User(
        email=user_in.email.lower(),
        username=user_in.username.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        subject=new_user.id,
        extra_claims={"username": new_user.username, "email": new_user.email}
    )

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token, summary="User Login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with username or email and password."""
    query = select(User).where(
        or_(
            User.email == credentials.username_or_email.lower(),
            User.username == credentials.username_or_email.lower()
        )
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated."
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={"username": user.username, "email": user.email}
    )

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse, summary="Get Current User Profile")
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)
