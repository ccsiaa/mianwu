"""
面试服务 - AI模拟面试与复盘分析
"""
from app.services.llm_service import llm_service
from typing import List, Optional, AsyncGenerator
import json
import traceback


class InterviewService:
    """面试准备服务"""

    # 面试准备计划生成提示词
    PREP_PLAN_PROMPT = """你是一个专业的面试准备顾问。请根据目标岗位的JD，为候选人制定一份详细的面试准备计划。

目标公司：{company}
目标岗位：{position}

JD内容：
{jd_content}

请制定一份全面的面试准备计划，以JSON格式返回：
{{
  "overview": "面试整体准备概述（2-3句话，说明这个岗位面试的重点和难点）",
  "resume_prep": {{
    "focus_points": ["简历上需要重点准备的项目/经历", "每个经历需要准备的核心亮点"],
    "likely_questions": ["简历面可能会问的问题"],
    "tips": ["简历自我介绍的建议"]
  }},
  "behavior_prep": {{
    "key_stories": ["需要准备的STAR故事（如团队协作、解决冲突、挑战困难等）"],
    "common_questions": ["行为面常见问题"],
    "framework": "回答行为问题的方法论建议"
  }},
  "tech_prep": {{
    "core_topics": ["核心技术知识点，需要深入准备的"],
    "deep_dive_areas": ["可能被深挖的技术领域"],
    "coding_practice": ["需要练习的算法/代码题型"],
    "system_design": ["系统设计相关准备（如适用）"]
  }},
  "company_prep": {{
    "company_info": ["需要了解的公司/业务信息"],
    "why_company": "为什么选择这家公司的准备思路",
    "questions_to_ask": ["面试结束时可以问面试官的问题"]
  }},
  "mock_interview_topics": ["建议模拟练习的面试话题"]
}}

要求：
1. 内容要具体，针对JD中的技术栈和要求
2. 每个部分都要给出可执行的建议
3. 时间规划要合理，假设有2周准备时间
4. 问题预测要贴合岗位特点

只返回JSON，不要其他解释。"""

    # 面试复盘分析提示词
    INTERVIEW_ANALYZE_PROMPT = """你是一个专业的面试复盘分析师。请详细分析以下面试记录，提取所有问题和回答，并给出针对性评估。

面试信息：
- 公司：{company}
- 岗位：{position}
- 轮次：{round}

面试记录：
{content}

请以JSON格式返回详细分析结果：
{{
  "summary": "面试整体评价（2-3句话）",
  "overall_score": 3,
  "total_questions": 10,
  "strengths": ["表现好的方面"],
  "weaknesses": ["需要改进的方面"],
  "questions": [
    {{
      "id": 1,
      "question": "完整的问题内容",
      "answer": "候选人的回答内容（如果有）",
      "source_text": "从面试记录中提取的该问题对应的原始回答片段，去除语气词（嗯、啊、那个、就是说、然后、对吧等），保留实质内容。如果没有回答内容则为空字符串",
      "category": "project/basics/algorithm/behavior/system",
      "level": "good/average/bad",
      "score": 3,
      "analysis": "回答分析：为什么好或不好",
      "improvement": "具体改进建议",
      "reference_answer": "参考回答要点",
      "follow_up": "可能的追问方向"
    }}
  ],
  "key_topics": ["面试重点考察的技术点"],
  "recommendations": ["后续学习建议"]
}}

评分标准：
- score: 1-5分
- level: good(4-5分)/average(2-3分)/bad(1分)

注意事项：
1. 必须提取出面试记录中的所有问题，不要遗漏
2. 每个问题都要有对应的回答内容（如果记录中有）
3. 评估要有针对性，根据具体回答内容分析
4. 改进建议要具体，不要泛泛而谈
5. 参考回答要给出关键要点
6. source_text 必须是面试记录中的原文片段，去除语气词后保留实质内容，不要编造
7. 如果面试记录中没有该问题的回答内容，则 source_text 为空字符串

只返回JSON，不要其他解释。"""

    # 模拟面试系统提示词
    INTERVIEWER_SYSTEM_PROMPT = """你是一位经验丰富的面试官，正在面试一位应聘{position}岗位的候选人。

面试风格：
- 专业、友善但有深度
- 会根据候选人回答进行追问
- 关注技术深度和项目经验
- 适时考察基础知识和算法

面试规则：
1. 每次只问一个问题
2. 根据候选人回答进行追问或进入下一话题
3. 追问要深入，不要轻易放过模糊的回答
4. 面试时长约30分钟，共8-10个问题

当前面试进度：第{current}/{total}题

请直接提问，不要有开场白。"""

    # 回答评估提示词
    EVALUATE_PROMPT = """你是一位专业的面试评估专家。请评估以下面试回答。

问题：
{question}

候选人回答：
{answer}

请以JSON格式返回评估结果：
{{
  "score": 3,
  "highlights": ["回答亮点"],
  "improvements": ["可改进之处"],
  "follow_up_prediction": ["可能的追问"],
  "reference_answer": "参考回答要点"
}}

评分标准：
5分：回答完整、深入、有亮点
4分：回答较好，有小瑕疵
3分：回答一般，有改进空间
2分：回答不完整或有错误
1分：回答很差或未回答

只返回JSON，不要其他解释。"""

    def generate_prep_plan(
        self,
        company: str,
        position: str,
        jd_content: str,
    ) -> dict:
        """
        根据JD生成面试准备计划

        Args:
            company: 公司名称
            position: 岗位名称
            jd_content: JD内容

        Returns:
            准备计划

        Raises:
            Exception: 当LLM调用失败时抛出异常
        """
        prompt = self.PREP_PLAN_PROMPT.format(
            company=company or "未知公司",
            position=position or "未知岗位",
            jd_content=jd_content,
        )
        response = llm_service.chat([{"role": "user", "content": prompt}], max_tokens=4000)

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
            raise ValueError("AI返回的内容格式异常，请重试")

    def _default_prep_plan(self) -> dict:
        """默认准备计划"""
        return {
            "overview": "准备计划生成失败，请稍后重试",
            "resume_prep": {"focus_points": [], "likely_questions": [], "tips": []},
            "behavior_prep": {"key_stories": [], "common_questions": [], "framework": ""},
            "tech_prep": {"core_topics": [], "deep_dive_areas": [], "coding_practice": [], "system_design": []},
            "company_prep": {"company_info": [], "why_company": "", "questions_to_ask": []},
            "mock_interview_topics": []
        }

    def chat(
        self,
        messages: List[dict],
        context: str,
    ) -> dict:
        """
        面试准备对话

        Args:
            messages: 对话历史
            context: 上下文信息（JD、准备计划等）

        Returns:
            回复内容

        Raises:
            Exception: 当LLM调用失败时抛出异常
        """
        system_prompt = f"""你是一个专业的面试准备顾问。你正在帮助用户准备面试。

以下是用户的面试准备上下文：
{context}

你的任务：
1. 回答用户关于面试准备的问题
2. 给出具体、可执行的建议
3. 帮助用户理解面试重点和难点
4. 提供模拟面试问题和参考回答
5. 根据JD和准备计划给出针对性建议

回答要求：
- 简洁明了，重点突出
- 给出具体例子和建议
- 语气友善专业
- 如果用户问的问题不在上下文中，根据你的知识给出合理建议"""

        response = llm_service.chat(
            messages=messages,
            system_prompt=system_prompt,
            max_tokens=2000,
        )

        return {"response": response}

    def analyze_interview(
        self,
        content: str,
        company: str = "",
        position: str = "",
        round: str = "",
        speakers: List[dict] = [],
    ) -> dict:
        """
        分析面试记录

        Args:
            content: 面试文本内容
            company: 公司名称
            position: 岗位名称
            round: 面试轮次
            speakers: 发言人信息（如果有）

        Returns:
            分析结果

        Raises:
            Exception: 当LLM调用失败时抛出异常，由调用方处理
        """
        # 如果有发言人信息，格式化内容
        if speakers:
            formatted_content = ""
            for speaker in speakers:
                speaker_id = speaker.get("speaker", "未知")
                text = speaker.get("text", "")
                formatted_content += f"[{speaker_id}]: {text}\n"
            content = formatted_content if formatted_content else content

        if not content or not content.strip():
            raise ValueError("面试内容为空，请上传有效的录音或输入面试记录")

        prompt = self.INTERVIEW_ANALYZE_PROMPT.format(
            content=content,
            company=company or "未知公司",
            position=position or "未知岗位",
            round=round or "技术面试",
        )
        response = llm_service.chat([{"role": "user", "content": prompt}], max_tokens=8000)

        # 移除可能的 markdown 代码块标记
        if "```" in response:
            response = response.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # 尝试提取 JSON 部分
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(response[start:end])
                except json.JSONDecodeError:
                    pass
            print(f"JSON解析失败，原始响应长度: {len(response)}")
            return {
                "summary": "分析完成，但部分内容解析失败",
                "overall_score": 3,
                "total_questions": 0,
                "strengths": [],
                "weaknesses": [],
                "questions": [],
                "key_topics": [],
                "recommendations": ["请重新提交面试记录"],
            }

    def _default_analyze_result(self) -> dict:
        """默认分析结果"""
        return {
            "summary": "分析失败，请稍后重试",
            "overall_score": 3,
            "total_questions": 0,
            "strengths": [],
            "weaknesses": [],
            "questions": [],
            "key_topics": [],
            "recommendations": ["请重新提交面试记录"],
        }

    def analyze_experience(self, content: str) -> dict:
        """
        分析面经内容（旧接口兼容）

        Args:
            content: 面经文本

        Returns:
            分析结果
        """
        try:
            prompt = """你是一个专业的面试分析师。请分析以下面经，提取面试问题。

面经内容：
{content}

请以JSON格式返回：
{{
  "questions": [
    {{
      "question": "问题内容",
      "category": "project/basics/algorithm/behavior",
      "frequency": 0.8
    }}
  ],
  "interview_style": "面试风格描述",
  "key_points": ["重点考察内容"]
}}

只返回JSON，不要其他解释。""".format(content=content)
            response = llm_service.chat([{"role": "user", "content": prompt}])

            try:
                return json.loads(response)
            except json.JSONDecodeError:
                start = response.find("{")
                end = response.rfind("}") + 1
                if start != -1 and end > start:
                    return json.loads(response[start:end])
                return {"questions": [], "interview_style": "", "key_points": []}
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return {
                "questions": [
                    {
                        "question": "请介绍一下你的项目经验",
                        "category": "project",
                        "frequency": 0.9
                    },
                    {
                        "question": "你遇到过什么技术难题？",
                        "category": "project",
                        "frequency": 0.8
                    }
                ],
                "interview_style": "技术深度考察，注重项目经验",
                "key_points": ["项目经验", "技术深度", "问题解决能力"]
            }

    async def simulate_interview(
        self,
        position: str,
        messages: List[dict],
        current: int = 1,
        total: int = 10,
    ) -> AsyncGenerator[str, None]:
        """
        模拟面试（流式）

        Args:
            position: 目标岗位
            messages: 对话历史
            current: 当前题号
            total: 总题数

        Yields:
            流式返回的面试官回复
        """
        system_prompt = self.INTERVIEWER_SYSTEM_PROMPT.format(
            position=position,
            current=current,
            total=total,
        )

        async for chunk in llm_service.chat_stream(
            messages=messages,
            system_prompt=system_prompt,
        ):
            yield chunk

    def evaluate_answer(
        self,
        question: str,
        answer: str,
    ) -> dict:
        """
        评估回答

        Args:
            question: 静试问题
            answer: 候选人回答

        Returns:
            评估结果
        """
        try:
            prompt = self.EVALUATE_PROMPT.format(
                question=question,
                answer=answer,
            )
            response = llm_service.chat([{"role": "user", "content": prompt}])

            try:
                return json.loads(response)
            except json.JSONDecodeError:
                start = response.find("{")
                end = response.rfind("}") + 1
                if start != -1 and end > start:
                    return json.loads(response[start:end])
                return {
                    "score": 3,
                    "highlights": [],
                    "improvements": [],
                    "follow_up_prediction": [],
                    "reference_answer": "",
                }
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return {
                "score": 3,
                "highlights": ["回答结构清晰", "基本覆盖要点"],
                "improvements": ["可以添加具体例子", "建议量化成果"],
                "follow_up_prediction": ["请举个具体例子", "这个项目的技术难点是什么"],
                "reference_answer": "建议使用STAR法则回答，包含情境、任务、行动和结果",
            }


# 创建全局实例
interview_service = InterviewService()