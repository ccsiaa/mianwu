"""
简历服务 - AI简历生成
"""
from app.services.llm_service import llm_service
from typing import List, Optional
import json


class ResumeService:
    """简历生成服务"""

    # JD解析提示词 - 提取关键招聘信息
    JD_PARSE_PROMPT = """你是一个专业的简历顾问和招聘专家。请深入分析以下岗位JD，提取关键招聘信息。

目标公司：{company}
目标岗位：{position}

JD内容：
{jd_content}

请仔细阅读JD，提取以下信息并以JSON格式返回：

1. hard_requirements: 硬性要求列表（必须满足的条件，如学历、工作年限、专业要求、必须掌握的技术等）
2. soft_requirements: 软性要求列表（加分项，JD中标注"优先"、"加分"的条件）
3. core_skills: 核心技能列表（JD明确要求必须掌握的技术和能力，要具体详细，如"Java后端开发，熟悉Spring框架"而不是简单的"Java"）
4. preferred_skills: 加分技能列表（JD中提到"熟悉"、"了解"、"有经验优先"的技术）
5. responsibilities: 核心职责列表（主要工作内容）

重要：每个列表至少提取3-5项，内容要具体详细，不要遗漏JD中的重要信息。

返回格式示例：
{{
  "hard_requirements": [
    "本科及以上学历，计算机相关专业",
    "熟悉Java/Go/Python至少一门编程语言，有实际项目经验",
    "熟悉MySQL数据库设计与优化，了解索引原理",
    "熟悉Redis缓存应用场景和常见问题"
  ],
  "soft_requirements": [
    "有分布式系统开发经验优先",
    "有大厂实习经验优先",
    "有高并发系统设计经验加分"
  ],
  "core_skills": [
    "Java/Go/Python后端开发，熟悉常用框架如Spring Boot、Gin等",
    "MySQL数据库设计、SQL优化、索引原理",
    "Redis缓存应用、数据结构、持久化机制",
    "分布式系统基础概念，如CAP理论、分布式事务",
    "代码规范与设计模式，能编写高质量可维护代码"
  ],
  "preferred_skills": [
    "消息队列（Kafka/RabbitMQ）使用经验",
    "容器化技术（Docker/Kubernetes）",
    "微服务架构设计与实现"
  ],
  "responsibilities": [
    "负责核心业务系统的开发和维护",
    "参与系统架构设计，优化系统性能",
    "编写高质量、可维护的代码",
    "参与技术方案评审和代码Review"
  ]
}}

只返回JSON，不要其他解释。"""

    # 经历匹配与优化提示词（核心）
    EXPERIENCE_MATCH_PROMPT = """你是一个专业的简历专家。请根据目标岗位JD，从用户的经历中选择相关经历并优化措辞。

【用户经历列表】
{experiences}

【目标岗位JD】
{jd_content}

【JD关键信息】
{jd_info}

【严格规则】
1. 只能使用用户提供的经历，严禁编造任何内容
2. 优先选择与JD核心技能和硬性要求匹配的经历
3. 可以调整措辞以突出与 JD 匹配的点，但不能改变事实
4. 如果某类经历用户没有，该部分留空
5. 实习经历描述最多4条bullet point，项目经历最多3条
6. 描述要具体，尽量包含技术栈、成果等
7. 描述中要自然融入JD中的关键词
8. 每段经历必须说明匹配理由，指出具体匹配了JD的哪些要求

【输出格式】严格按以下JSON结构输出，不要添加任何其他字段：
{{
  "internships": [
    {{
      "id": "经历ID（从用户经历中获取）",
      "company": "公司名",
      "role": "岗位",
      "startDate": "开始时间",
      "endDate": "结束时间",
      "description": ["优化后的描述1", "优化后的描述2"],
      "match_reason": "匹配说明：说明为什么选择这段经历，具体匹配了JD的哪些硬性要求、核心技能或职责，用简洁的语言概括匹配点"
    }}
  ],
  "projects": [
    {{
      "id": "经历ID（从用户经历中获取）",
      "name": "项目名",
      "role": "角色",
      "startDate": "开始时间",
      "endDate": "结束时间",
      "description": ["优化后的描述1", "优化后的描述2"],
      "match_reason": "匹配说明：说明为什么选择这段经历，具体匹配了JD的哪些硬性要求、核心技能或职责，用简洁的语言概括匹配点"
    }}
  ],
  "skills": {{
    "professional": ["专业技能1", "专业技能2"],
    "tools": ["工具1", "工具2"]
  }},
  "self_evaluation": "基于用户经历生成的自我评价，3-4句话，突出与JD匹配的能力"
}}

只返回JSON，不要其他解释。"""

    # 简历解析提示词
    RESUME_PARSE_PROMPT = """你是一个专业的简历解析助手。请解析以下简历文本，提取结构化信息。

简历内容：
{resume_content}

请以JSON格式返回以下信息（如果某项信息不存在，对应字段留空或为空数组）：

1. basic: 基本信息
   - name: 姓名
   - phone: 电话
   - email: 邮箱

2. education: 教育背景
   - school: 学校
   - major: 专业
   - degree: 学位（本科/硕士/博士）
   - startDate: 开始时间（格式：YYYY-MM）
   - endDate: 结束时间（格式：YYYY-MM）

3. internships: 实习经历列表，每项包含：
   - company: 公司名称
   - role: 岗位
   - startDate: 开始时间
   - endDate: 结束时间
   - description: 工作内容描述（数组形式，每条一个元素）
   - skills: 使用的技术/技能（数组）

4. projects: 项目经历列表，每项包含：
   - name: 项目名称
   - role: 角色
   - description: 项目描述（数组形式）
   - skills: 使用的技术（数组）

5. skills: 技能清单
   - professional: 专业技能（数组）
   - tools: 工具（数组）

返回格式示例：
{{
  "basic": {{
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com"
  }},
  "education": {{
    "school": "北京大学",
    "major": "计算机科学与技术",
    "degree": "本科",
    "startDate": "2020-09",
    "endDate": "2024-06"
  }},
  "internships": [
    {{
      "company": "腾讯",
      "role": "后端开发实习生",
      "startDate": "2023-06",
      "endDate": "2023-09",
      "description": ["负责XX系统的开发", "优化了XX性能"],
      "skills": ["Java", "MySQL"]
    }}
  ],
  "projects": [
    {{
      "name": "电商系统",
      "role": "后端负责人",
      "description": ["设计并实现了XX功能"],
      "skills": ["Spring Boot", "Redis"]
    }}
  ],
  "skills": {{
    "professional": ["Java开发", "分布式系统设计"],
    "tools": ["IntelliJ IDEA", "Git"]
  }}
}}

只返回JSON，不要其他解释。"""

    def parse_resume(self, resume_content: str) -> dict:
        """
        解析简历文本，提取结构化信息

        Args:
            resume_content: 简历文本内容

        Returns:
            解析结果字典
        """
        try:
            prompt = self.RESUME_PARSE_PROMPT.format(resume_content=resume_content)
            response = llm_service.chat([{"role": "user", "content": prompt}], max_tokens=3000)

            # 移除markdown代码块标记
            if "```" in response:
                response = response.replace("```json", "").replace("```", "").strip()

            try:
                return json.loads(response)
            except json.JSONDecodeError:
                start = response.find("{")
                end = response.rfind("}") + 1
                if start != -1 and end > start:
                    return json.loads(response[start:end])
                return {
                    "basic": {"name": "", "phone": "", "email": ""},
                    "education": {},
                    "internships": [],
                    "projects": [],
                    "skills": {"professional": [], "tools": []}
                }
        except Exception as e:
            print(f"简历解析失败: {e}")
            return {
                "basic": {"name": "", "phone": "", "email": ""},
                "education": {},
                "internships": [],
                "projects": [],
                "skills": {"professional": [], "tools": []}
            }

    def parse_jd(self, jd_content: str, company: str = "", position: str = "") -> dict:
        """
        解析JD，提取关键招聘信息

        Args:
            jd_content: JD文本内容
            company: 公司名称
            position: 岗位名称

        Returns:
            解析结果字典
        """
        try:
            prompt = self.JD_PARSE_PROMPT.format(
                jd_content=jd_content,
                company=company or "未知公司",
                position=position or "未知岗位"
            )
            response = llm_service.chat([{"role": "user", "content": prompt}], max_tokens=2000)

            # 移除markdown代码块标记
            if "```" in response:
                response = response.replace("```json", "").replace("```", "").strip()

            try:
                return json.loads(response)
            except json.JSONDecodeError:
                start = response.find("{")
                end = response.rfind("}") + 1
                if start != -1 and end > start:
                    return json.loads(response[start:end])
                return {
                    "hard_requirements": [],
                    "soft_requirements": [],
                    "core_skills": [],
                    "preferred_skills": [],
                    "responsibilities": []
                }
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return {
                "hard_requirements": ["本科及以上学历"],
                "soft_requirements": [],
                "core_skills": ["编程能力", "数据结构"],
                "preferred_skills": [],
                "responsibilities": ["参与系统开发"]
            }

    def match_and_optimize_experiences(
        self,
        experiences: List[dict],
        jd_content: str,
        jd_info: dict = None,
    ) -> dict:
        """
        使用LLM匹配经历并优化措辞

        Args:
            experiences: 用户经历列表
            jd_content: JD内容
            jd_info: JD解析后的关键信息（可选）

        Returns:
            匹配和优化后的结果
        """
        # 格式化经历列表
        exp_text = ""
        for exp in experiences:
            exp_text += f"""
经历ID: {exp.get('id', 'unknown')}
类型: {exp.get('type', 'other')}
公司/名称: {exp.get('company', exp.get('name', '未知'))}
岗位/角色: {exp.get('role', '未知')}
时间: {exp.get('startDate', '未知')} - {exp.get('endDate', '至今')}
技能标签: {', '.join(exp.get('skills', []))}
描述: {exp.get('description', '无描述')}
---
"""

        # 格式化JD关键信息
        jd_info_text = ""
        if jd_info:
            jd_info_text = f"""
硬性要求: {', '.join(jd_info.get('hard_requirements', []))}
软性要求: {', '.join(jd_info.get('soft_requirements', []))}
核心技能: {', '.join(jd_info.get('core_skills', []))}
加分技能: {', '.join(jd_info.get('preferred_skills', []))}
核心职责: {', '.join(jd_info.get('responsibilities', []))}
"""

        try:
            prompt = self.EXPERIENCE_MATCH_PROMPT.format(
                experiences=exp_text,
                jd_content=jd_content,
                jd_info=jd_info_text or "无",
            )
            response = llm_service.chat([{"role": "user", "content": prompt}], max_tokens=3000)

            # 移除markdown代码块标记
            if "```" in response:
                response = response.replace("```json", "").replace("```", "").strip()

            try:
                return json.loads(response)
            except json.JSONDecodeError:
                start = response.find("{")
                end = response.rfind("}") + 1
                if start != -1 and end > start:
                    return json.loads(response[start:end])
                return {
                    "internships": [],
                    "projects": [],
                    "skills": {"professional": [], "tools": []},
                    "self_evaluation": ""
                }
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return {
                "internships": [],
                "projects": [],
                "skills": {"professional": [], "tools": []},
                "self_evaluation": ""
            }

    def generate_resume(
        self,
        user_info: dict,
        experiences: List[dict],
        jd_content: str,
        jd_info: dict = None,
    ) -> dict:
        """
        生成简历

        Args:
            user_info: 用户基本信息（姓名、电话、邮箱、教育背景）
            experiences: 用户经历列表
            jd_content: JD内容
            jd_info: JD解析后的关键信息（可选，用于更精准匹配）

        Returns:
            简历内容字典
        """
        # 使用LLM匹配和优化经历
        matched_result = self.match_and_optimize_experiences(experiences, jd_content, jd_info)

        # 构建简历，基本信息和教育背景直接使用用户数据，不经过LLM
        resume = {
            "header": {
                "name": user_info.get("name", ""),
                "phone": user_info.get("phone", ""),
                "email": user_info.get("email", ""),
            },
            "education": user_info.get("education", {}),
            "internships": matched_result.get("internships", []),
            "projects": matched_result.get("projects", []),
            "skills": matched_result.get("skills", {"professional": [], "tools": []}),
            "self_evaluation": matched_result.get("self_evaluation", ""),
        }

        return resume


# 创建全局实例
resume_service = ResumeService()
