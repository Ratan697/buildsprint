"""
backend/app/routes/auth.py

FastAPI APIRouter providing self-hosted email/password authentication using PBKDF2-SHA256.
"""

import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import UserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Simple in-memory token storage: token -> user_id
ACTIVE_TOKENS: Dict[str, str] = {}


def hash_password(password: str) -> str:
    """
    Hashes a password using hashlib.pbkdf2_hmac with SHA256 and a random 16-byte salt.
    Format stored: salt_hex$hash_hex
    """
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${pw_hash.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verifies a plain password against the stored salt$hash string.
    """
    try:
        salt_hex, hash_hex = stored_hash.split("$")
        salt = bytes.fromhex(salt_hex)
        pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return pw_hash.hex() == hash_hex
    except Exception:
        return False


class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full user name")
    email: str = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account"
)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(UserModel).filter(UserModel.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(payload.password)

    user = UserModel(
        id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hashed_pw,
        role="admin",
        created_at=datetime.now(timezone.utc)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = f"cs_token_{uuid.uuid4().hex}"
    ACTIVE_TOKENS[token] = user_id

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role
        )
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login"
)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(UserModel).filter(UserModel.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = f"cs_token_{uuid.uuid4().hex}"
    ACTIVE_TOKENS[token] = user.id

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role
        )
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated User"
)
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header."
        )

    token = authorization.split("Bearer ")[1].strip()
    user_id = ACTIVE_TOKENS.get(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role
    )
