"""
语音识别服务 - FunASR
"""
import os
import tempfile
import json
from typing import Optional, List
from funasr import AutoModel


class SpeechService:
    """语音识别服务"""

    _instance = None
    _model = None
    _spk_model = None
    _model_loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def preload_models(self):
        """预加载模型（启动时调用）"""
        if not self._model_loaded:
            print("正在预加载语音识别模型...")
            try:
                self._load_model()
                print("语音识别模型加载完成")
            except Exception as e:
                print(f"模型加载失败: {e}")
            self._model_loaded = True

    def _load_model(self):
        """加载基础模型（轻量版）"""
        if self._model is None:
            # 使用轻量模型，减少内存占用
            self._model = AutoModel(
                model="iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
                model_revision="v2.0.4",
                vad_model="iic/speech_fsmn_vad_zh-cn-16k-common-pytorch",
                vad_model_revision="v2.0.4",
                disable_update=True,
            )
        return self._model

    def _load_spk_model(self):
        """加载带说话人分离的模型"""
        if self._spk_model is None:
            print("正在加载说话人分离模型...")
            import os
            cache_dir = os.path.expanduser("~/.cache/modelscope/hub/models/iic")

            # 使用内置标点的模型
            self._spk_model = AutoModel(
                model=os.path.join(cache_dir, "speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch"),
                spk_model=os.path.join(cache_dir, "speech_campplus_sv_zh-cn_16k-common"),
                disable_update=True,
            )
            print("说话人分离模型加载完成")
        return self._spk_model

    def _split_audio(self, audio_path: str, chunk_duration: int = 300) -> List[str]:
        """
        将音频切分成小段

        Args:
            audio_path: 音频文件路径
            chunk_duration: 每段时长（秒），默认5分钟

        Returns:
            切分后的音频文件路径列表
        """
        import subprocess

        # 获取音频时长
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', audio_path],
            capture_output=True, text=True
        )

        try:
            duration = float(result.stdout.strip())
        except:
            duration = 600  # 默认10分钟

        # 如果时长小于分段时长，直接返回原文件
        if duration <= chunk_duration:
            return [audio_path]

        # 切分音频
        chunks = []
        temp_dir = tempfile.mkdtemp()

        start = 0
        while start < duration:
            chunk_path = os.path.join(temp_dir, f"chunk_{start}.wav")
            subprocess.run(
                ['ffmpeg', '-y', '-i', audio_path, '-ss', str(start),
                 '-t', str(chunk_duration), '-acodec', 'pcm_s16le',
                 '-ar', '16000', '-ac', '1', chunk_path],
                capture_output=True
            )
            chunks.append(chunk_path)
            start += chunk_duration

        return chunks

    def transcribe(
        self,
        audio_path: str,
        language: str = "zh",
        speaker_diarization: str = "none",
    ) -> dict:
        """
        语音识别

        Args:
            audio_path: 音频文件路径
            language: 语言 (zh/en/ja/yue/zh-en)
            speaker_diarization: 发言人分离 (none/2/multi)

        Returns:
            识别结果
        """
        try:
            # 说话人分离需要使用特定模型
            if speaker_diarization != "none":
                try:
                    model = self._load_spk_model()

                    # 分段处理，避免内存不足
                    chunks = self._split_audio(audio_path, chunk_duration=180)  # 3分钟一段

                    all_text = ""
                    all_speakers = []
                    time_offset = 0

                    for chunk_path in chunks:
                        print(f"处理分段: {chunk_path}")
                        result = model.generate(input=chunk_path)

                        if result and len(result) > 0:
                            r = result[0]
                            chunk_text = r.get("text", "")
                            all_text += chunk_text + " "

                            # 解析说话人信息，调整时间偏移
                            sentence_info = r.get("sentence_info", [])
                            for item in sentence_info:
                                all_speakers.append({
                                    "speaker": str(item.get("spk_id", "未知")),
                                    "text": item.get("text", ""),
                                    "start": item.get("start", 0) + time_offset,
                                    "end": item.get("end", 0) + time_offset,
                                })

                        # 更新时间偏移
                        time_offset += 180  # 每段3分钟

                        # 清理临时文件
                        if chunk_path != audio_path:
                            try:
                                os.unlink(chunk_path)
                            except:
                                pass

                    # 清理临时目录
                    if chunks[0] != audio_path:
                        try:
                            os.rmdir(os.path.dirname(chunks[0]))
                        except:
                            pass

                    return {
                        "text": all_text.strip(),
                        "speakers": all_speakers,
                        "language": language,
                    }
                except Exception as e:
                    print(f"说话人分离失败，使用普通模式: {e}")
                    # 降级到普通模式

            # 普通识别模式 - 也分段处理
            model = self._load_model()
            chunks = self._split_audio(audio_path, chunk_duration=300)  # 5分钟一段

            all_text = ""
            for chunk_path in chunks:
                result = model.generate(input=chunk_path)
                if result and len(result) > 0:
                    all_text += result[0].get("text", "") + " "

                # 清理临时文件
                if chunk_path != audio_path:
                    try:
                        os.unlink(chunk_path)
                    except:
                        pass

            # 清理临时目录
            if chunks[0] != audio_path:
                try:
                    os.rmdir(os.path.dirname(chunks[0]))
                except:
                    pass

            return {
                "text": all_text.strip(),
                "speakers": [],
                "language": language,
            }

        except Exception as e:
            print(f"语音识别失败: {e}")
            return {
                "text": "",
                "speakers": [],
                "language": language,
                "error": str(e),
            }

    def transcribe_file(
        self,
        file_content: bytes,
        filename: str,
        language: str = "zh",
        speaker_diarization: str = "none",
    ) -> dict:
        """
        从文件内容识别语音

        Args:
            file_content: 文件二进制内容
            filename: 文件名
            language: 语言
            speaker_diarization: 发言人分离模式

        Returns:
            识别结果
        """
        # 保存临时文件
        suffix = os.path.splitext(filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            result = self.transcribe(
                audio_path=tmp_path,
                language=language,
                speaker_diarization=speaker_diarization,
            )
            return result
        finally:
            # 清理临时文件
            os.unlink(tmp_path)


# 创建全局实例
speech_service = SpeechService()