"""
邮件服务
"""
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


class EmailService:
    """邮件发送服务"""

    @staticmethod
    def send_verification_code(to_email: str, code: str, purpose: str = "登录") -> bool:
        """
        发送验证码邮件

        Args:
            to_email: 收件人邮箱
            code: 验证码
            purpose: 用途（登录/注册）

        Returns:
            是否发送成功
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise ValueError("邮箱配置不完整，请检查 SMTP_USER 和 SMTP_PASSWORD")

        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f"【面悟】{purpose}验证码"

        # HTML 邮件模板
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0B; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: #18181B; border-radius: 16px; border: 1px solid #27272A; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #00D9FF 0%, #10B981 100%); padding: 24px; text-align: center;">
                    <span style="font-size: 28px; font-weight: bold; color: white;">面悟</span>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #FAFAFA; margin: 0 0 8px 0; font-size: 20px;">{purpose}验证码</h2>
                    <p style="color: #A1A1AA; margin: 0 0 24px 0; font-size: 14px;">您正在进行{purpose}操作，验证码如下：</p>

                    <div style="background: #0A0A0B; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: bold; color: #00D9FF; letter-spacing: 8px;">{code}</span>
                    </div>

                    <p style="color: #71717A; font-size: 13px; margin: 0 0 8px 0;">
                        验证码 <strong>5 分钟</strong>内有效，请尽快使用。
                    </p>
                    <p style="color: #71717A; font-size: 13px; margin: 0;">
                        如非本人操作，请忽略此邮件。
                    </p>
                </div>
                <div style="padding: 16px 32px; border-top: 1px solid #27272A; text-align: center;">
                    <p style="color: #52525B; font-size: 12px; margin: 0;">
                        此邮件由系统自动发送，请勿回复
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html', 'utf-8'))

        try:
            with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"邮件发送失败: {e}")
            raise e


# 验证码缓存（生产环境应使用 Redis）
_code_cache: dict = {}


def generate_code(email: str, purpose: str = "login") -> str:
    """生成并缓存验证码"""
    code = str(random.randint(100000, 999999))
    key = f"{email}:{purpose}"
    _code_cache[key] = code
    # TODO: 生产环境使用 Redis 并设置过期时间
    return code


def verify_code(email: str, code: str, purpose: str = "login") -> bool:
    """验证验证码"""
    key = f"{email}:{purpose}"
    stored = _code_cache.get(key)
    if stored and stored == code:
        # 验证成功后删除
        del _code_cache[key]
        return True
    return False


def can_send_code(email: str) -> bool:
    """检查是否可以发送验证码（60秒限制）"""
    # TODO: 生产环境使用 Redis 实现
    return True


email_service = EmailService()
