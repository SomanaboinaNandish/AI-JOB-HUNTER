"""
Notification Service
- Telegram Bot alerts
- Email notifications
"""

from typing import Optional
from loguru import logger

from utils.config import settings


class TelegramService:
    """Send Telegram notifications"""

    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.enabled = bool(self.token)

    async def send_job_alert(
        self,
        chat_id: str,
        job_title: str,
        company: str,
        salary_display: str,
        match_score: Optional[int],
        apply_url: str,
        location: str = "Remote",
        experience: str = "0–1 Years",
    ):
        if not self.enabled:
            logger.debug("Telegram disabled - no token configured")
            return

        score_line = f"📊 Match Score: {match_score}%" if match_score else ""
        message = f"""🚀 *New Fresher Job Found!*

💼 *Role:* {job_title}
🏢 *Company:* {company}
📍 *Location:* {location}
⏱ *Experience:* {experience}
💰 *Salary:* {salary_display}
{score_line}

🔗 [Apply Now]({apply_url})

_Sent by AI Job Hunter 🤖_"""

        await self._send_message(chat_id, message)

    async def send_daily_digest(self, chat_id: str, jobs: list, date: str):
        if not self.enabled:
            return

        job_lines = "\n".join(
            f"• *{j['title']}* @ {j['company']} — {j['salary_display']}"
            for j in jobs[:5]
        )
        message = f"""📋 *Daily Job Digest — {date}*

Found {len(jobs)} new fresher opportunities today:

{job_lines}

Open the [AI Job Hunter Dashboard](http://localhost:3000) to see all jobs and apply!"""

        await self._send_message(chat_id, message)

    async def _send_message(self, chat_id: str, text: str):
        import httpx
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10)
                response.raise_for_status()
                logger.info(f"✅ Telegram message sent to {chat_id}")
        except Exception as e:
            logger.error(f"Telegram send failed: {e}")


telegram_service = TelegramService()
