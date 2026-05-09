"""
API路由汇总
"""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.experiences import router as experiences_router
from app.api.resume import router as resume_router
from app.api.interview import router as interview_router
from app.api.review import router as review_router
from app.api.speech import router as speech_router

api_router = APIRouter()

# 注册各模块路由
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(experiences_router, prefix="/experiences", tags=["知识库-经历"])
api_router.include_router(resume_router, prefix="/resume", tags=["简历工坊"])
api_router.include_router(interview_router, prefix="/interview", tags=["面试准备"])
api_router.include_router(review_router, prefix="/review", tags=["面试复盘"])
api_router.include_router(speech_router, prefix="/speech", tags=["语音识别"])
