"""
数据库模型 - 经历
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


class ExperienceType(str, enum.Enum):
    """经历类型"""
    BASIC = "basic"  # 基本信息
    INTERNSHIP = "internship"
    PROJECT = "project"
    EDUCATION = "education"
    COMPETITION = "competition"
    OTHER = "other"


class Experience(Base):
    """经历模型"""
    __tablename__ = "experiences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    type = Column(Enum(ExperienceType), default=ExperienceType.OTHER)
    company = Column(String(100))  # 公司/组织
    role = Column(String(100))  # 岗位/角色
    start_date = Column(String(10))  # 开始时间
    end_date = Column(String(10))  # 结束时间
    description = Column(Text)  # 优化后的描述
    raw_description = Column(Text)  # 原始描述
    skills = Column(JSON, default=list)  # 技能标签
    achievements = Column(JSON, default=list)  # 成果
    notes = Column(Text)  # 备注
    interview_count = Column(Integer, default=0)  # 被问次数
    last_mentioned = Column(DateTime)  # 最近被提及时间
    # 关联的面试问题列表 [{question, answer, category, level, interviewCompany, interviewDate}]
    interview_questions = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "type": self.type.value if self.type else None,
            "company": self.company,
            "role": self.role,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "description": self.description,
            "rawDescription": self.raw_description,
            "skills": self.skills or [],
            "achievements": self.achievements or [],
            "notes": self.notes,
            "interviewCount": self.interview_count,
            "lastMentioned": self.last_mentioned.isoformat() if self.last_mentioned else None,
            "interviewQuestions": self.interview_questions or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
