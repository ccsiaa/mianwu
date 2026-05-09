"""
简历工坊API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.experience import Experience, ExperienceType
from app.models.user import User
from app.api.auth import get_current_user
from app.services.resume_service import resume_service

router = APIRouter()


# ===== 请求模型 =====

class JDParseRequest(BaseModel):
    """JD解析请求"""
    company: str
    position: str
    jd_content: str


class GenerateRequest(BaseModel):
    """简历生成请求"""
    company: str
    position: str
    jd_content: str
    jd_info: Optional[dict] = None  # 可选：已解析的JD关键信息


# ===== API路由 =====

@router.post("/parse-jd")
async def parse_jd(
    data: JDParseRequest,
    current_user: User = Depends(get_current_user),
):
    """解析JD，提取关键招聘信息 - 需要登录"""
    result = resume_service.parse_jd(
        jd_content=data.jd_content,
        company=data.company,
        position=data.position
    )
    return {"code": 0, "data": result}


@router.post("/generate")
async def generate_resume(
    data: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """生成简历 - 仅使用当前用户的经历"""
    user_id = current_user.id

    # 获取用户所有经历（仅当前用户的）
    result = await db.execute(
        select(Experience).where(Experience.user_id == user_id)
    )
    exps = result.scalars().all()
    experiences = [exp.to_dict() for exp in exps]

    # 从知识库获取基本信息 (type='basic')
    basic_info = None
    for exp in experiences:
        if exp.get('type') == 'basic':
            basic_info = exp
            break

    # 从知识库获取教育背景 (type='education')
    education_info = None
    for exp in experiences:
        if exp.get('type') == 'education':
            education_info = exp
            break

    # 构建用户基本信息
    user_info = {
        "name": basic_info.get('company', '') if basic_info else '',  # company字段存姓名
        "phone": basic_info.get('role', '') if basic_info else '',  # role字段存电话
        "email": basic_info.get('description', '') if basic_info else '',  # description字段存邮箱
        "education": {
            "school": education_info.get('company', '') if education_info else '',  # company字段存学校
            "major": education_info.get('role', '') if education_info else '',  # role字段存专业
            "degree": '',  # 从role中解析或单独存储
            "startDate": education_info.get('startDate', '') if education_info else '',
            "endDate": education_info.get('endDate', '') if education_info else '',
        }
    }

    # 如果教育背景的role包含学位信息，尝试解析
    if education_info and education_info.get('role'):
        role_parts = education_info['role'].split('/')
        if len(role_parts) >= 2:
            user_info['education']['major'] = role_parts[0].strip()
            user_info['education']['degree'] = role_parts[1].strip()
        else:
            user_info['education']['major'] = education_info['role']

    # 如果前端传了JD解析结果，直接使用；否则重新解析
    jd_info = data.jd_info
    if not jd_info:
        jd_info = resume_service.parse_jd(
            jd_content=data.jd_content,
            company=data.company,
            position=data.position
        )

    # 生成简历（传入JD关键信息用于精准匹配）
    resume_content = resume_service.generate_resume(
        user_info=user_info,
        experiences=experiences,
        jd_content=data.jd_content,
        jd_info=jd_info,
    )

    return {
        "code": 0,
        "data": {
            "resumeId": "temp_resume",
            "content": resume_content,
        }
    }