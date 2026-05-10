"""
面试复盘API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio

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
    review_id: Optional[str] = None  # 如果提供则更新已有记录，否则创建新记录
    company: str
    position: str
    round: str = "技术面试"
    date: Optional[str] = None
    result: str = "pending"
    summary: Optional[str] = None
    questions: List[dict] = []
    transcribed_text: Optional[str] = None


class ReviewSaveRecordRequest(BaseModel):
    """仅保存复盘记录（不含题目）"""
    company: str
    position: str
    round: str = "技术面试"
    date: Optional[str] = None
    result: str = "pending"
    summary: Optional[str] = None
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


@router.post("/save-record")
async def save_review_record(
    data: ReviewSaveRecordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """仅保存复盘记录（不含题目）- 分析完成后自动调用"""
    user_id = current_user.id

    record = InterviewRecord(
        user_id=user_id,
        company=data.company,
        position=data.position,
        round=data.round,
        date=datetime.strptime(data.date, "%Y-%m-%d") if data.date else None,
        result=InterviewResult(data.result),
        summary=data.summary,
        transcribed_text=data.transcribed_text,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "code": 0,
        "data": {
            "reviewId": record.id,
            "status": "saved",
        }
    }


class MatchExperiencesRequest(BaseModel):
    """匹配经历请求"""
    questions: List[dict]


@router.post("/match-experiences")
async def match_experiences(
    data: MatchExperiencesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """匹配问题到经历（不保存）- 用于预填关联经历"""
    from app.models.experience import Experience
    from app.services.llm_service import llm_service

    user_id = current_user.id

    result = await db.execute(
        select(Experience).where(Experience.user_id == user_id)
    )
    experiences = result.scalars().all()

    if not experiences:
        return {"code": 0, "data": {"matches": {}}}

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

    questions_data = [
        {"index": i, "question": q.get("question", ""), "category": q.get("category", "")}
        for i, q in enumerate(data.questions)
    ]

    prompt = f"""请将以下面试问题匹配到最相关的经历。

经历列表：
{json.dumps(exp_list, ensure_ascii=False, indent=2)}

面试问题：
{json.dumps(questions_data, ensure_ascii=False, indent=2)}

请返回JSON格式的匹配结果，格式如下：
{{
  "matches": [
    {{
      "questionIndex": 0,
      "experienceId": "经历ID，如果没有匹配则为null"
    }}
  ]
}}

注意：
1. 只有项目经验(project)和实习(internship)类型的问题才需要匹配
2. 基础知识、算法、行为面试问题不需要匹配
3. 一个问题最多匹配一个经历

只返回JSON，不要其他解释。"""

    try:
        match_result = await asyncio.to_thread(
            llm_service.chat, [{"role": "user", "content": prompt}]
        )
        match_data = json.loads(match_result)
        matches = match_data.get("matches", [])

        # 转换为 question_index -> experience_id 的映射
        result_map = {}
        for m in matches:
            q_idx = m.get("questionIndex")
            exp_id = m.get("experienceId")
            if q_idx is not None and exp_id:
                result_map[str(q_idx)] = exp_id

        return {"code": 0, "data": {"matches": result_map}}
    except Exception as e:
        print(f"匹配经历失败: {e}")
        return {"code": 0, "data": {"matches": {}}}


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

    # 如果提供了 review_id，更新已有记录；否则创建新记录
    if data.review_id:
        result = await db.execute(
            select(InterviewRecord).where(
                InterviewRecord.id == data.review_id,
                InterviewRecord.user_id == user_id,
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在或无权访问")
        # 更新记录字段
        record.company = data.company
        record.position = data.position
        record.round = data.round
        if data.date:
            record.date = datetime.strptime(data.date, "%Y-%m-%d")
        if data.summary:
            record.summary = data.summary
        if data.transcribed_text:
            record.transcribed_text = data.transcribed_text
        # 删除已有问题（重新保存）
        await db.execute(
            sql_delete(InterviewQuestion).where(InterviewQuestion.record_id == record.id)
        )
    else:
        # 创建新记录
        record = InterviewRecord(
            user_id=user_id,
            company=data.company,
            position=data.position,
            round=data.round,
            date=datetime.strptime(data.date, "%Y-%m-%d") if data.date else None,
            result=InterviewResult(data.result),
            summary=data.summary,
            transcribed_text=data.transcribed_text,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    # 保存问题到面试记录
    saved_questions = []
    questions_with_exp = {}  # experience_id -> [question_data]
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
            source_text=q.get("source_text"),
            performance=performance,
            feedback=q.get("analysis") or q.get("improvement"),
        )
        db.add(question)

        q_data = {
            "question": q.get("question"),
            "answer": q.get("answer"),
            "category": category_str,
            "level": level_str,
            "analysis": q.get("analysis"),
            "improvement": q.get("improvement"),
        }
        saved_questions.append(q_data)

        # 如果前端指定了 experience_id，直接关联
        exp_id = q.get("experience_id")
        if exp_id:
            if exp_id not in questions_with_exp:
                questions_with_exp[exp_id] = []
            questions_with_exp[exp_id].append(q_data)

    await db.commit()

    # 获取用户所有经历（仅当前用户的）
    result = await db.execute(
        select(Experience).where(Experience.user_id == user_id)
    )
    experiences = result.scalars().all()

    # 处理手动关联的经历
    for exp_id, questions in questions_with_exp.items():
        exp_result = await db.execute(
            select(Experience).where(
                Experience.id == exp_id,
                Experience.user_id == user_id
            )
        )
        exp = exp_result.scalar_one_or_none()
        if exp:
            existing = exp.interview_questions or []
            new_questions = [{**q, "interviewCompany": data.company, "interviewDate": data.date or dt.now().strftime("%Y-%m-%d")} for q in questions]
            exp.interview_questions = existing + new_questions
            exp.interview_count = (exp.interview_count or 0) + len(questions)
            exp.last_mentioned = dt.now()

    await db.commit()

    # 没有手动关联的题目，且有经历时，使用 LLM 自动匹配
    questions_without_exp = [q for q in saved_questions if not any(q.get("question") == eq for eq_list in questions_with_exp.values() for eq in [qq.get("question")])]
    if experiences and questions_without_exp and not questions_with_exp:
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
{json.dumps(questions_without_exp, ensure_ascii=False, indent=2)}

请返回JSON格式的匹配结果，格式如下：
{{
  "matches": [
    {{
      "questionIndex": 0,
      "experienceId": "经历ID，如果没有匹配则为null",
      "reason": "匹配原因"
    }}
  ]
}}

注意：
1. 只有项目经验(project)和实习(internship)类型的问题才需要匹配到经历
2. 基础知识、算法、行为面试问题不需要匹配
3. 如果问题与某个经历高度相关（提到公司、项目、技术栈等），则匹配
4. 一个问题最多匹配一个经历

只返回JSON，不要其他解释。"""

        try:
            match_result = await asyncio.to_thread(
                llm_service.chat, [{"role": "user", "content": prompt}]
            )
            match_data = json.loads(match_result)
            matches = match_data.get("matches", [])

            exp_questions = {}
            for m in matches:
                q_idx = m.get("questionIndex")
                exp_id = m.get("experienceId")
                if exp_id and q_idx is not None and q_idx < len(questions_without_exp):
                    if exp_id not in exp_questions:
                        exp_questions[exp_id] = []
                    exp_questions[exp_id].append({
                        **questions_without_exp[q_idx],
                        "interviewCompany": data.company,
                        "interviewDate": data.date or dt.now().strftime("%Y-%m-%d"),
                    })

            for exp_id, questions in exp_questions.items():
                exp_result = await db.execute(
                    select(Experience).where(
                        Experience.id == exp_id,
                        Experience.user_id == user_id
                    )
                )
                exp = exp_result.scalar_one_or_none()
                if exp:
                    existing = exp.interview_questions or []
                    exp.interview_questions = existing + questions
                    exp.interview_count = (exp.interview_count or 0) + len(questions)
                    exp.last_mentioned = dt.now()

            await db.commit()

        except Exception as e:
            print(f"LLM匹配问题到经历失败: {e}")

    return {
        "code": 0,
        "data": {
            "reviewId": record.id,
            "savedQuestions": len(saved_questions),
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


class ReviewUpdateRequest(BaseModel):
    """更新复盘请求"""
    company: Optional[str] = None
    position: Optional[str] = None
    round: Optional[str] = None


@router.delete("/{id}")
async def delete_review(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除复盘记录及其关联问题"""
    result = await db.execute(
        select(InterviewRecord).where(
            InterviewRecord.id == id,
            InterviewRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="记录不存在或无权访问")

    # 删除关联问题
    await db.execute(
        sql_delete(InterviewQuestion).where(InterviewQuestion.record_id == id)
    )

    # 删除记录
    await db.delete(record)
    await db.commit()

    return {"code": 0, "data": {"deleted": True}}


@router.patch("/{id}")
async def update_review(
    id: str,
    data: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新复盘记录（公司、岗位、轮次）"""
    result = await db.execute(
        select(InterviewRecord).where(
            InterviewRecord.id == id,
            InterviewRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="记录不存在或无权访问")

    if data.company is not None:
        record.company = data.company
    if data.position is not None:
        record.position = data.position
    if data.round is not None:
        record.round = data.round

    await db.commit()
    await db.refresh(record)

    return {"code": 0, "data": record.to_dict()}