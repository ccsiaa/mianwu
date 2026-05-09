"""
面悟后端 - 应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import api_router
from app.services.speech_service import speech_service

# 创建应用
app = FastAPI(
    title=settings.APP_NAME,
    description="AI驱动的智能面试教练",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router)


@app.on_event("startup")
async def on_startup():
    await init_db()
    # 预加载语音识别模型（异步后台加载，不阻塞启动）
    import asyncio
    asyncio.create_task(asyncio.to_thread(speech_service.preload_models))


@app.get("/")
async def root():
    """健康检查"""
    return {
        "message": "面悟API服务运行中",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}
