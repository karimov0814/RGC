"""
Fon rejimidagi "listener": Telegram guruhida yangi forum-topic
yaratilishini kuzatib boradi va uni mos filialga avtomatik bog'laydi.

Bot API'ning getUpdates (long polling) usulidan foydalanadi. Bu modul
alohida process sifatida EMAS, balki app.py ishga tushganda FastAPI
lifecycle'ining bir qismi sifatida fon vazifasida (background task)
avtomatik ishga tushadi (qarang: app.py dagi _startup/_shutdown).
Shuning uchun Railway'da alohida "worker" xizmati sozlashning hojati yo'q.

Nima uchun kerak:
    Guruhda filial nomi bilan forum-topic yaratilganda (botning o'zi
    createForumTopic orqali yaratganda ham, ADMIN GURUHDA QO'LDA
    yaratganda ham), Telegram avtomatik ravishda shu haqidagi xizmat
    xabarini (forum_topic_created) yuboradi. Shu xabarni ushlab, topic
    nomini filiallar ro'yxati bilan solishtirib, mos kelsa — filialga
    bog'lab qo'yamiz. Natijada, agar guruhda filial nomi bilan topic
    ALLAQACHON mavjud bo'lsa, mini-app uni qayta yaratmaydi — mavjud
    topicga yozadi.
"""
import asyncio
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import httpx

import db

BOT_TOKEN = os.environ["BOT_TOKEN"]
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


async def handle_forum_topic_created(message: dict):
    """Guruhda yangi forum-topic yaratilganda ishga tushadi. Agar topic nomi
    mini-app'dagi biror filial nomi bilan bir xil bo'lsa va o'sha filialda
    hali thread_id o'rnatilmagan bo'lsa — shu topicni filialga bog'lab
    qo'yadi."""
    topic_created = message.get("forum_topic_created")
    if not topic_created:
        return

    topic_name = (topic_created.get("name") or "").strip()
    thread_id = message.get("message_thread_id") or message.get("message_id")
    if not topic_name or not thread_id:
        return

    try:
        linked = await db.link_thread_id_by_name(topic_name, thread_id)
        if linked:
            print(
                f"[bot_listener] Topic avtomatik bog'landi: '{topic_name}' -> "
                f"filial #{linked['id']} (thread_id={thread_id})"
            )
    except Exception as e:  # noqa: BLE001
        print("[bot_listener] Topic bog'lashda xatolik:", e)


async def handle_update(client: httpx.AsyncClient, update: dict):
    message = update.get("message")
    if not message:
        return

    if message.get("forum_topic_created"):
        await handle_forum_topic_created(message)


async def run_polling():
    """Cheksiz sikl: getUpdates orqali yangilanishlarni kutib turadi.
    app.py'ning startup hodisasida asyncio.create_task() bilan fon
    vazifasi sifatida ishga tushiriladi va shutdown'da bekor qilinadi."""
    offset = 0
    async with httpx.AsyncClient(timeout=35) as client:
        print("[bot_listener] fon vazifasi ishga tushdi (topic-bog'lash kuzatuvchisi)...")
        while True:
            try:
                resp = await client.get(
                    f"{TG_API}/getUpdates",
                    params={"offset": offset, "timeout": 30, "allowed_updates": ["message"]},
                )
                data = resp.json()
                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    try:
                        await handle_update(client, update)
                    except Exception as e:  # noqa: BLE001
                        print("[bot_listener] Update ishlashda xatolik:", e)
            except asyncio.CancelledError:
                print("[bot_listener] to'xtatildi.")
                raise
            except Exception as e:  # noqa: BLE001
                # Tarmoq xatosi va hokazo — sikl davom etadi, lekin darhol
                # qayta-qayta urinib serverga zarba bermaslik uchun kutamiz
                print("[bot_listener] getUpdates xatolik:", e)
                await asyncio.sleep(3)


if __name__ == "__main__":
    # Lokal/mustaqil sinov uchun (app.py'siz alohida ishga tushirish)
    asyncio.run(run_polling())
