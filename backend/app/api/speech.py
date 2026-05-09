"""
语音识别API
"""
import asyncio
import traceback

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from app.services.speech_service import speech_service

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("zh"),
    speaker_diarization: Optional[str] = Form("none"),
):
    """
    语音识别

    Args:
        file: 音频文件
        language: 语言 (zh/en/ja/yue/zh-en)
        speaker_diarization: 发言人分离 (none/2/multi)
    """
    # 读取文件内容
    content = await file.read()
    filename = file.filename or "audio.wav"

    if not content:
        raise HTTPException(status_code=400, detail="上传的文件为空")

    try:
        # 调用语音识别服务（同步操作，放到线程池执行）
        result = await asyncio.to_thread(
            speech_service.transcribe_file,
            file_content=content,
            filename=filename,
            language=language,
            speaker_diarization=speaker_diarization,
        )

        # 检查识别结果是否有错误
        if result.get("error"):
            raise HTTPException(status_code=500, detail=f"语音识别失败: {result['error']}")

        return {
            "code": 0,
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"语音识别异常: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"语音识别失败: {str(e)}")