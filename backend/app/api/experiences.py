"""
经历管理API
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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


# ===== 请求/响应模型 =====

class ExperienceCreate(BaseModel):
    """创建经历请求"""
    type: str = "other"
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    raw_description: Optional[str] = None
    skills: List[str] = []
    achievements: List[str] = []
    notes: Optional[str] = None


class ExperienceUpdate(BaseModel):
    """更新经历请求"""
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    skills: List[str] = []
    achievements: List[str] = []
    notes: Optional[str] = None


class OptimizeRequest(BaseModel):
    """优化请求"""
    keywords: List[str] = []


# ===== API路由 =====

@router.get("")
async def list_experiences(
    type: Optional[str] = None,
    page: int = 1,
    pageSize: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取经历列表 - 仅返回当前用户的经历"""
    user_id = current_user.id

    query = select(Experience).where(Experience.user_id == user_id)

    if type:
        query = query.where(Experience.type == ExperienceType(type))

    query = query.offset((page - 1) * pageSize).limit(pageSize)
    query = query.order_by(Experience.created_at.desc())

    result = await db.execute(query)
    experiences = result.scalars().all()

    # 获取总数
    count_query = select(Experience).where(Experience.user_id == user_id)
    if type:
        count_query = count_query.where(Experience.type == ExperienceType(type))
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())

    return {
        "code": 0,
        "data": {
            "list": [exp.to_dict() for exp in experiences],
            "total": total,
            "page": page,
            "pageSize": pageSize,
        }
    }


@router.post("")
async def create_experience(
    data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建经历 - 绑定到当前用户"""
    user_id = current_user.id

    experience = Experience(
        user_id=user_id,
        type=ExperienceType(data.type),
        company=data.company,
        role=data.role,
        start_date=data.start_date,
        end_date=data.end_date,
        description=data.description,
        raw_description=data.raw_description,
        skills=data.skills,
        achievements=data.achievements,
        notes=data.notes,
    )

    db.add(experience)
    await db.commit()
    await db.refresh(experience)

    return {
        "code": 0,
        "data": {
            "id": experience.id,
            "createdAt": experience.created_at.isoformat(),
        }
    }


@router.get("/{id}")
async def get_experience(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取经历详情 - 仅返回当前用户的经历"""
    result = await db.execute(
        select(Experience).where(
            Experience.id == id,
            Experience.user_id == current_user.id
        )
    )
    experience = result.scalar_one_or_none()

    if not experience:
        return {"code": 40002, "message": "经历不存在或无权访问"}

    return {"code": 0, "data": experience.to_dict()}


@router.put("/{id}")
async def update_experience(
    id: str,
    data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新经历 - 仅允许更新自己的经历"""
    result = await db.execute(
        select(Experience).where(
            Experience.id == id,
            Experience.user_id == current_user.id
        )
    )
    experience = result.scalar_one_or_none()

    if not experience:
        return {"code": 40002, "message": "经历不存在或无权访问"}

    # 更新字段
    if data.company:
        experience.company = data.company
    if data.role:
        experience.role = data.role
    if data.start_date:
        experience.start_date = data.start_date
    if data.end_date:
        experience.end_date = data.end_date
    if data.description:
        experience.description = data.description
    if data.skills:
        experience.skills = data.skills
    if data.achievements:
        experience.achievements = data.achievements
    if data.notes:
        experience.notes = data.notes

    await db.commit()

    return {"code": 0, "message": "更新成功"}


@router.delete("/{id}")
async def delete_experience(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除经历 - 仅允许删除自己的经历"""
    result = await db.execute(
        select(Experience).where(
            Experience.id == id,
            Experience.user_id == current_user.id
        )
    )
    experience = result.scalar_one_or_none()

    if not experience:
        return {"code": 40002, "message": "经历不存在或无权访问"}

    await db.delete(experience)
    await db.commit()

    return {"code": 0, "message": "删除成功"}


@router.post("/{id}/optimize")
async def optimize_experience(
    id: str,
    data: OptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI优化经历表达 - 仅允许优化自己的经历"""
    result = await db.execute(
        select(Experience).where(
            Experience.id == id,
            Experience.user_id == current_user.id
        )
    )
    experience = result.scalar_one_or_none()

    if not experience:
        return {"code": 40002, "message": "经历不存在或无权访问"}

    # 获取原始描述
    raw_description = experience.raw_description or experience.description
    if not raw_description:
        return {"code": 40001, "message": "经历描述为空"}

    # 调用AI优化
    optimized = resume_service.optimize_experience(
        raw_description=raw_description,
        keywords=data.keywords,
    )

    return {"code": 0, "data": optimized}


@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """解析上传的简历文件 - 需要登录"""
    # 读取文件内容
    content = await file.read()
    filename = file.filename.lower()

    # 提取文本内容
    text_content = ""

    if filename.endswith('.pdf'):
        # 解析PDF
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                text_content += page.get_text()
            doc.close()
        except ImportError:
            return {"code": 50001, "message": "PDF解析库未安装，请联系管理员"}
        except Exception as e:
            return {"code": 50002, "message": f"PDF解析失败: {str(e)}"}

    elif filename.endswith('.docx'):
        # 解析DOCX
        try:
            from io import BytesIO
            from docx import Document
            doc = Document(BytesIO(content))
            for para in doc.paragraphs:
                text_content += para.text + "\n"
        except ImportError:
            return {"code": 50001, "message": "DOCX解析库未安装，请联系管理员"}
        except Exception as e:
            return {"code": 50002, "message": f"DOCX解析失败: {str(e)}"}

    elif filename.endswith('.txt'):
        # 直接读取文本
        text_content = content.decode('utf-8', errors='ignore')

    else:
        return {"code": 40003, "message": "不支持的文件格式，请上传 PDF、DOCX 或 TXT 文件"}

    if not text_content.strip():
        return {"code": 40004, "message": "未能从文件中提取到文本内容"}

    # 调用LLM解析简历
    parsed_data = resume_service.parse_resume(text_content)

    return {"code": 0, "data": parsed_data}