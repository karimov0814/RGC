"""
- Telegram WebApp initData ni tekshirish (xavfsizlik uchun majburiy)
- Bot API orqali rasm yuborish / forum-topic yaratish
"""
import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qsl

import httpx

BOT_TOKEN = os.environ["BOT_TOKEN"]
GROUP_CHAT_ID = int(os.environ["GROUP_CHAT_ID"])  # masalan: -1001234567890
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

INIT_DATA_MAX_AGE = 24 * 60 * 60  # 24 soat


def validate_init_data(init_data: str) -> dict | None:
    """
    Telegram hujjatiga muvofiq WebApp.initData ni tekshiradi.
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
    Muvaffaqiyatli bo'lsa foydalanuvchi ma'lumotlarini qaytaradi, aks holda None.
    """
    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    # auth_date muddati o'tganini tekshirish
    auth_date = int(parsed.get("auth_date", "0"))
    if time.time() - auth_date > INIT_DATA_MAX_AGE:
        return None

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        return None

    user = json.loads(parsed.get("user", "{}"))
    return {
        "id": user.get("id"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
        "username": user.get("username"),
    }


async def create_forum_topic(name: str) -> int:
    """Guruhda filial nomi bilan yangi mavzu (topic) ochadi, thread_id qaytaradi."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{TG_API}/createForumTopic",
            json={"chat_id": GROUP_CHAT_ID, "name": name},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            raise RuntimeError(f"createForumTopic xato: {data}")
        return data["result"]["message_thread_id"]


async def send_photo_to_topic(thread_id: int, photo_bytes: bytes, filename: str,
                               caption: str) -> dict:
    """Rasmni tegishli filial mavzusiga (topic) yuboradi. {file_id, message_id} qaytaradi."""
    files = {"photo": (filename, photo_bytes, "image/jpeg")}
    data = {
        "chat_id": GROUP_CHAT_ID,
        "message_thread_id": thread_id,
        "caption": caption,
        "parse_mode": "HTML",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{TG_API}/sendPhoto", data=data, files=files)
        resp.raise_for_status()
        result = resp.json()
        if not result.get("ok"):
            raise RuntimeError(f"sendPhoto xato: {result}")
        msg = result["result"]
        largest_photo = msg["photo"][-1]
        return {"file_id": largest_photo["file_id"], "message_id": msg["message_id"]}
