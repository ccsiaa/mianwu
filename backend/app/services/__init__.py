"""
服务模块初始化
"""
from app.services.llm_service import llm_service
from app.services.resume_service import resume_service
from app.services.interview_service import interview_service

__all__ = ["llm_service", "resume_service", "interview_service"]
