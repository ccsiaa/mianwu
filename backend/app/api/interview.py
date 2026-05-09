"""
面试准备API
"""
import asyncio
import traceback

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
import json

from app.services.interview_service import interview_service

router = APIRouter()


# ===== 请求模型 =====

class PrepPlanRequest(BaseModel):
    """准备计划请求"""
    company: str
    position: str
    jd_content: str


class AnalyzeRequest(BaseModel):
    """面经分析请求"""
    content: str
    company: Optional[str] = ""
    position: Optional[str] = ""
    round: Optional[str] = ""
    speakers: Optional[List[dict]] = []


class SimulateRequest(BaseModel):
    """模拟面试请求"""
    position: str
    messages: List[dict] = []
    current: int = 1
    total: int = 10


class EvaluateRequest(BaseModel):
    """回答评估请求"""
    question: str
    answer: str


class ChatRequest(BaseModel):
    """对话请求"""
    messages: List[dict]
    context: str


# ===== API路由 =====

@router.post("/prep-plan")
async def generate_prep_plan(data: PrepPlanRequest):
    """根据JD生成面试准备计划"""
    try:
        result = await asyncio.to_thread(
            interview_service.generate_prep_plan,
            company=data.company,
            position=data.position,
            jd_content=data.jd_content,
        )
        return {"code": 0, "data": result}
    except Exception as e:
        print(f"生成准备计划失败: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


@router.post("/analyze")
async def analyze_interview(data: AnalyzeRequest):
    """分析面经"""
    try:
        result = await asyncio.to_thread(
            interview_service.analyze_interview,
            content=data.content,
            company=data.company,
            position=data.position,
            round=data.round,
            speakers=data.speakers,
        )
        return {"code": 0, "data": result}
    except Exception as e:
        print(f"分析面试失败: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/simulate")
async def simulate_interview(data: SimulateRequest):
    """AI模拟面试（流式）"""

    async def generate():
        async for chunk in interview_service.simulate_interview(
            position=data.position,
            messages=data.messages,
            current=data.current,
            total=data.total,
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@router.post("/evaluate")
async def evaluate_answer(data: EvaluateRequest):
    """评估回答"""
    try:
        result = await asyncio.to_thread(
            interview_service.evaluate_answer,
            question=data.question,
            answer=data.answer,
        )
        return {"code": 0, "data": result}
    except Exception as e:
        print(f"评估回答失败: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"评估失败: {str(e)}")


@router.post("/chat")
async def chat(data: ChatRequest):
    """面试准备对话"""
    try:
        result = await asyncio.to_thread(
            interview_service.chat,
            messages=data.messages,
            context=data.context,
        )
        return {"code": 0, "data": result}
    except Exception as e:
        print(f"对话失败: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"对话失败: {str(e)}")