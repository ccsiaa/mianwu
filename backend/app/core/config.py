"""
核心配置
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""

    # 应用配置
    APP_NAME: str = "面悟"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # 数据库配置
    DATABASE_URL: str = "sqlite+aiosqlite:///./mianwu.db"

    # LLM配置（小米MiMo）
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://token-plan-cn.xiaomimimo.com/v1"
    LLM_MODEL: str = "mimo-v2.5-pro"

    # 阿里云语音服务
    ALIYUN_ACCESS_KEY_ID: str = ""
    ALIYUN_ACCESS_KEY_SECRET: str = ""
    ALIYUN_NLS_APP_KEY: str = ""

    # Web搜索
    SERPER_API_KEY: Optional[str] = None

    # JWT配置
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 邮箱配置（SMTP）
    SMTP_SERVER: str = "smtp.qq.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = ""  # 发件邮箱
    SMTP_PASSWORD: str = ""  # 授权码
    EMAIL_FROM_NAME: str = "面悟"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
