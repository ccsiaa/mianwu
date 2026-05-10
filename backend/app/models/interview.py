"""
数据库模型 - 面试记录
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
import uuid


class InterviewResult(str, enum.Enum):
    """面试结果"""
    PASSED = "passed"
    FAILED = "failed"
    PENDING = "pending"


class InterviewRecord(Base):
    """面试记录"""
    __tablename__ = "interview_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    company = Column(String(100))
    position = Column(String(100))
    round = Column(String(20))  # 一面/二面/HR面
    date = Column(DateTime)
    result = Column(Enum(InterviewResult), default=InterviewResult.PENDING)
    duration = Column(Integer, default=0)  # 时长（分钟）
    summary = Column(Text)  # 总结
    transcribed_text = Column(Text)  # 原始转写文本
    created_at = Column(DateTime, server_default=func.now())

    # 关联问题
    questions = relationship("InterviewQuestion", back_populates="record")

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "position": self.position,
            "round": self.round,
            "date": self.date.isoformat() if self.date else None,
            "result": self.result.value if self.result else None,
            "duration": self.duration,
            "summary": self.summary,
            "transcribed_text": self.transcribed_text,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class QuestionCategory(str, enum.Enum):
    """问题分类"""
    PROJECT = "project"
    BASICS = "basics"
    ALGORITHM = "algorithm"
    BEHAVIOR = "behavior"


class QuestionPerformance(str, enum.Enum):
    """回答表现"""
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"


class InterviewQuestion(Base):
    """面试问题"""
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("interview_records.id"))
    question = Column(Text)
    category = Column(Enum(QuestionCategory))
    answer = Column(Text)  # 用户回答
    performance = Column(Enum(QuestionPerformance))
    feedback = Column(Text)  # AI反馈
    created_at = Column(DateTime, server_default=func.now())

    # 关联记录
    record = relationship("InterviewRecord", back_populates="questions")

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "category": self.category.value if self.category else None,
            "answer": self.answer,
            "performance": self.performance.value if self.performance else None,
            "feedback": self.feedback,
        }
