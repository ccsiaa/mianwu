"""
面试复盘API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from app.core.database import get_db
from app.models.interview import (
    InterviewRecord,
    InterviewQuestion,
    InterviewResult,
    QuestionCategory,
    QuestionPerformance,
)
from app.models.user import User
from app.api.auth import get_current_user
from app.services.interview_service import interview_service

router = APIRouter()


# ===== 请求模型 =====

class ReviewSubmitRequest(BaseModel):
    """提交复盘请求"""
    company: str
    position: str
    round: str
    date: str
    result: str = "pending"
    content: str


class ReviewAnalyzeRequest(BaseModel):
    """分析请求"""
    content: str


class ReviewSaveRequest(BaseModel):
    """保存复盘请求"""
    company: str
    position: str
    round: str = "技术面试"
    date: Optional[str] = None
    result: str = "pending"
    summary: Optional[str] = None
    questions: List[dict] = []
    transcribed_text: Optional[str] = None


# ===== API路由 =====

@router.post("/submit-text")
async def submit_text_review(
    data: ReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交文字复盘 - 绑定到当前用户"""
    user_id = current_user.id

    # 创建面试记录
    record = InterviewRecord(
        user_id=user_id,
        company=data.company,
        position=data.position,
        round=data.round,
        date=datetime.strptime(data.date, "%Y-%m-%d") if data.date else None,
        result=InterviewResult(data.result),
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    # 分析内容，提取问题
    analyze_result = interview_service.analyze_experience(data.content)

    # 保存问题
    for q in analyze_result.get("questions", []):
        question = InterviewQuestion(
            record_id=record.id,
            question=q.get("question"),
            category=QuestionCategory(q.get("category", "behavior")),
            performance=QuestionPerformance.AVERAGE,
        )
        db.add(question)

    await db.commit()

    return {
        "code": 0,
        "data": {
            "reviewId": record.id,
            "status": "submitted",
        }
    }


@router.post("/analyze")
async def analyze_review(data: ReviewAnalyzeRequest):
    """分析面试内容 - 不涉及用户数据存储"""
    result = interview_service.analyze_experience(data.content)

    return {"code": 0, "data": result}


@router.get("")
async def list_reviews(
    page: int = 1,
    pageSize: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取复盘列表 - 仅返回当前用户的记录"""
    user_id = current_user.id

    query = select(InterviewRecord).where(InterviewRecord.user_id == user_id)
    query = query.offset((page - 1) * pageSize).limit(pageSize)
    query = query.order_by(InterviewRecord.created_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return {
        "code": 0,
        "data": {
            "list": [r.to_dict() for r in records],
            "total": len(records),
            "page": page,
            "pageSize": pageSize,
        }
    }


@router.get("/{id}")
async def get_review(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取复盘详情 - 仅返回当前用户的记录"""
    result = await db.execute(
        select(InterviewRecord).where(
            InterviewRecord.id == id,
            InterviewRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        return {"code": 40002, "message": "记录不存在或无权访问"}

    # 获取关联问题
    q_result = await db.execute(
        select(InterviewQuestion).where(InterviewQuestion.record_id == id)
    )
    questions = q_result.scalars().all()

    return {
        "code": 0,
        "data": {
            **record.to_dict(),
            "questions": [q.to_dict() for q in questions],
        }
    }


@router.post("/save")
async def save_review(
    data: ReviewSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """保存面试复盘（含问题）- 沉淀到知识库，自动匹配到对应经历"""
    from app.models.experience import Experience, ExperienceType
    from app.services.llm_service import llm_service
    from datetime import datetime as dt

    user_id = current_user.id

    # 创建面试记录
    record = InterviewRecord(
        user_id=user_id,
        company=data.company,
        position=data.position,
        round=data.round,
        date=datetime.strptime(data.date, "%Y-%m-%d") if data.date else None,
        result=InterviewResult(data.result),
        summary=data.summary,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    # 保存问题到面试记录
    saved_questions = []
    for q in data.questions:
        category_str = q.get("category", "behavior")
        category_map = {
            "project": QuestionCategory.PROJECT,
            "basics": QuestionCategory.BASICS,
            "algorithm": QuestionCategory.ALGORITHM,
            "behavior": QuestionCategory.BEHAVIOR,
            "system": QuestionCategory.PROJECT,
            "other": QuestionCategory.BEHAVIOR,
        }
        category = category_map.get(category_str, QuestionCategory.BEHAVIOR)

        level_str = q.get("level", "average")
        performance_map = {
            "good": QuestionPerformance.GOOD,
            "average": QuestionPerformance.AVERAGE,
            "bad": QuestionPerformance.POOR,
        }
        performance = performance_map.get(level_str, QuestionPerformance.AVERAGE)

        question = InterviewQuestion(
            record_id=record.id,
            question=q.get("question"),
            category=category,
            answer=q.get("answer"),
            performance=performance,
            feedback=q.get("analysis") or q.get("improvement"),
        )
        db.add(question)
        saved_questions.append({
            "question": q.get("question"),
            "answer": q.get("answer"),
            "category": category_str,
            "level": level_str,
            "analysis": q.get("analysis"),
            "improvement": q.get("improvement"),
        })

    await db.commit()

    # 获取用户所有经历（仅当前用户的）
    result = await db.execute(
        select(Experience).where(Experience.user_id == user_id)
    )
    experiences = result.scalars().all()

    # 使用 LLM 匹配问题到经历
    if experiences and saved_questions:
        exp_list = [
            {
                "id": exp.id,
                "type": exp.type.value if exp.type else "other",
                "company": exp.company,
                "role": exp.role,
                "description": exp.description or "",
            }
            for exp in experiences
        ]

        prompt = f"""请将以下面试问题匹配到最相关的经历。

经历列表：
{json.dumps(exp_list, ensure_ascii=False, indent=2)}

面试问题：
{json.dumps(saved_questions, ensure_ascii=False, indent=2)}

请返回JSON格式的匹配结果，格式如下：
{
  "matches": [
    {
      "questionIndex": 0,
      "experienceId": "经历ID，如果没有匹配则为null",
      "reason": "匹配原因"
    }
  ]
}

注意：
1. 只有项目经验(project)和实习(internship)类型的问题才需要匹配到经历
2. 基础知识、算法、行为面试问题不需要匹配
3. 如果问题与某个经历高度相关（提到公司、项目、技术栈等），则匹配
4. 一个问题最多匹配一个经历

只返回JSON，不要其他解释。"""

        try:
            match_result = llm_service.chat([{"role": "user", "content": prompt}])
            match_data = json.loads(match_result)
            matches = match_data.get("matches", [])

            # 按经历ID分组问题
            exp_questions = {}
            for m in matches:
                q_idx = m.get("questionIndex")
                exp_id = m.get("experienceId")
                if exp_id and q_idx is not None and q_idx < len(saved_questions):
                    if exp_id not in exp_questions:
                        exp_questions[exp_id] = []
                    exp_questions[exp_id].append({
                        **saved_questions[q_idx],
                        "interviewCompany": data.company,
                        "interviewDate": data.date or dt.now().strftime("%Y-%m-%d"),
                    })

            # 更新经历的面试问题
            for exp_id, questions in exp_questions.items():
                exp_result = await db.execute(
                    select(Experience).where(
                        Experience.id == exp_id,
                        Experience.user_id == user_id  # 确保只能更新自己的经历
                    )
                )
                exp = exp_result.scalar_one_or_none()
                if exp:
                    # 合并已有问题和新增问题
                    existing = exp.interview_questions or []
                    exp.interview_questions = existing + questions
                    exp.interview_count = (exp.interview_count or 0) + len(questions)
                    exp.last_mentioned = dt.now()

            await db.commit()

        except Exception as e:
            print(f"匹配问题到经历失败: {e}")

    return {
        "code": 0,
        "data": {
            "reviewId": record.id,
            "savedQuestions": len(saved_questions),
        }
    }