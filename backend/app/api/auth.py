"""
用户认证 API
"""
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.services.email_service import email_service, generate_code, verify_code

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class LoginRequest(BaseModel):
    identifier: str
    password: str


class RegisterRequest(BaseModel):
    identifier: str
    password: str
    full_name: Optional[str] = None


class EmailCodeRequest(BaseModel):
    email: EmailStr
    type: Optional[str] = "login"  # login / register


class EmailLoginRequest(BaseModel):
    email: EmailStr
    code: str


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    code: str
    password: Optional[str] = None
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    createdAt: str | None = None


async def get_user_by_identifier(db: AsyncSession, identifier: str) -> Optional[User]:
    if "@" in identifier:
        query = select(User).where(User.email == identifier)
    else:
        query = select(User).where((User.phone == identifier) | (User.username == identifier))

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/send-email", response_model=dict)
async def send_email_code(data: EmailCodeRequest):
    """发送邮箱验证码"""
    purpose = "注册" if data.type == "register" else "登录"

    # 生成验证码
    code = generate_code(data.email, data.type)

    # 发送邮件
    try:
        email_service.send_verification_code(data.email, code, purpose)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"邮件发送失败: {str(e)}")

    return {
        "code": 0,
        "message": f"验证码已发送至 {data.email}",
        "data": None
    }


@router.post("/login-email", response_model=dict)
async def login_with_email(data: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    """邮箱验证码登录"""
    # 验证验证码
    if not verify_code(data.email, data.code, "login"):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    # 查找或创建用户
    user = await get_user_by_email(db, data.email)
    if not user:
        # 自动创建用户
        user = User(
            email=data.email,
            username=data.email.split("@")[0],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 生成 token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "code": 0,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict(),
        },
    }


@router.post("/register-email", response_model=dict)
async def register_with_email(data: EmailRegisterRequest, db: AsyncSession = Depends(get_db)):
    """邮箱验证码注册"""
    # 验证验证码
    if not verify_code(data.email, data.code, "register"):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    # 检查用户是否已存在
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="该邮箱已注册")

    # 创建用户
    hashed_password = None
    if data.password:
        hashed_password = get_password_hash(data.password)

    user = User(
        email=data.email,
        username=data.email.split("@")[0],
        full_name=data.full_name,
        hashed_password=hashed_password,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 生成 token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "code": 0,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict(),
        },
    }


@router.post("/register", response_model=dict)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """注册用户"""
    identifier = data.identifier.strip()
    if not identifier or not data.password:
        raise HTTPException(status_code=400, detail="请输入手机号/邮箱和密码")

    existing_user = await get_user_by_identifier(db, identifier)
    if existing_user:
        raise HTTPException(status_code=400, detail="该账号已存在")

    email = identifier if "@" in identifier else None
    phone = identifier if "@" not in identifier else None
    username = identifier if "@" not in identifier else None

    user = User(
        email=email,
        phone=phone,
        username=username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "code": 0,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict(),
        },
    }


@router.post("/login", response_model=dict)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """用户登录"""
    identifier = data.identifier.strip()
    user = await get_user_by_identifier(db, identifier)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="手机号/邮箱或密码错误")

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "code": 0,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict(),
        },
    }


@router.get("/me", response_model=dict)
async def me(current_user: User = Depends(get_current_user)):
    """获取当前用户"""
    return {"code": 0, "data": current_user.to_dict()}
