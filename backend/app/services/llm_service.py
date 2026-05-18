"""
LLM服务 - 调用小米MiMo API
"""
import httpx
from app.core.config import settings
from typing import Optional, List, AsyncGenerator
import json


class LLMService:
    """LLM服务封装 - 小米MiMo"""

    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.base_url = settings.LLM_BASE_URL
        self.model = settings.LLM_MODEL

    def chat(
        self,
        messages: List[dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """
        同步对话

        Args:
            messages: 对话消息列表
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大token数

        Returns:
            模型回复内容
        """
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        with httpx.Client(timeout=600.0) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": full_messages,
                    "temperature": temperature,
                    "max_completion_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def chat_stream_simple(
        self,
        messages: List[dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 800,
    ) -> AsyncGenerator[str, None]:
        """
        通用流式对话（用于普通对话接口）
        """
        async for chunk in self.chat_stream(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            yield chunk

    async def chat_stream(
        self,
        messages: List[dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 800,
    ) -> AsyncGenerator[str, None]:
        """
        流式对话

        Args:
            messages: 对话消息列表
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大token数

        Yields:
            流式返回的内容片段
        """
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={
                    "api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": full_messages,
                    "temperature": temperature,
                    "max_completion_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if data["choices"][0]["delta"].get("content"):
                                yield data["choices"][0]["delta"]["content"]
                        except json.JSONDecodeError:
                            continue


# 创建全局实例
llm_service = LLMService()
