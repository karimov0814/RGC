"""
Filial Feedback Mini App — asosiy backend (FastAPI).

Ishga tushirish:
    uvicorn app:app --host 0.0.0.0 --port 8000

Muhit o'zgaruvchilari (.env):
    BOT_TOKEN, GROUP_CHAT_ID, DATABASE_URL
"""
import json
import os
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()  # faqat lokal ishlashda .env faylini o'qiydi; Railway'da shart emas
except ImportError:
    pass

from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

import db
import telegram_utils as tg

app = FastAPI(title="Filial Feedback Mini App")

# Mini app boshqa domenda joylashgan bo'lishi mumkin (masalan GitHub Pages / Railway static)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROLE_LABELS = {"employee": "Filial xodimi", "guest": "Mehmon"}


@app.on_event("startup")
async def _startup():
    """Railway'da har deployda jadvallar mavjudligini avtomatik ta'minlaydi
    (schema.sql barcha CREATE TABLE larda IF NOT EXISTS ishlatadi — xavfsiz)."""
    pool = await db.get_pool()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, encoding="utf-8") as f:
        schema_sql = f.read()
    async with pool.acquire() as conn:
        await conn.execute(schema_sql)


@app.get("/")
async def health():
    # Railway health-check va domenni tekshirish uchun
    return {"status": "ok", "service": "filial-feedback-backend"}


@app.on_event("shutdown")
async def _shutdown():
    await db.close_pool()


def _check_auth(init_data: str) -> dict:
    user = tg.validate_init_data(init_data)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="initData yaroqsiz")
    return user


# ---------------------------------------------------------------------------
# 1) Mini app ochilganda kerakli konfiguratsiya: filiallar ro'yxati + bo'limlar
# ---------------------------------------------------------------------------
@app.get("/api/config")
async def get_config(init_data: str):
    _check_auth(init_data)
    filials = await db.list_active_filials()
    sections = await db.list_active_sections()
    return {"filials": filials, "sections": sections}


# ---------------------------------------------------------------------------
# 2) Mehmon uchun: telefon raqami bazada bor-yo'qligini tekshirish
#    (raqamning o'zi botga alohida "contact" xabari sifatida keladi,
#     uni bot_listener.py ushlab bazaga yozadi)
# ---------------------------------------------------------------------------
@app.get("/api/contact-status")
async def contact_status(init_data: str):
    user = _check_auth(init_data)
    contact = await db.get_contact(user["id"])
    return {"has_contact": contact is not None, "phone": contact["phone"] if contact else None}


# ---------------------------------------------------------------------------
# 3) Yakuniy yuborish: filial + rol + har bir bo'lim uchun rasm(lar)
# ---------------------------------------------------------------------------
@app.post("/api/submit")
async def submit(
    init_data: str = Form(...),
    filial_id: int = Form(...),
    role: str = Form(...),  # "employee" | "guest"
    items_meta: str = Form(...),  # JSON: [{"section_id": 1, "field": "photo_1", "comment": "..."}]
    files: List[UploadFile] = File(...),
):
    user = _check_auth(init_data)

    if role not in ROLE_LABELS:
        raise HTTPException(status_code=400, detail="role noto'g'ri")

    filial = await db.get_filial(filial_id)
    if not filial:
        raise HTTPException(status_code=404, detail="Filial topilmadi")

    try:
        meta = json.loads(items_meta)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="items_meta JSON emas")

    if len(meta) != len(files):
        raise HTTPException(status_code=400, detail="Rasmlar soni mos emas")

    # Guruhda hali mavzu (topic) yo'q bo'lsa — avtomatik yaratamiz
    thread_id = filial["thread_id"]
    if not thread_id:
        thread_id = await tg.create_forum_topic(filial["name"])
        await db.set_filial_thread_id(filial_id, thread_id)

    full_name = " ".join(filter(None, [user.get("first_name"), user.get("last_name")])) or user.get("username") or "Noma'lum"

    phone = None
    if role == "guest":
        contact = await db.get_contact(user["id"])
        phone = contact["phone"] if contact else None

    submission_id = await db.create_submission(
        filial_id=filial_id,
        telegram_user_id=user["id"],
        full_name=full_name,
        phone=phone,
        role=role,
    )

    now_str = datetime.now().strftime("%d.%m.%Y %H:%M")
    role_label = ROLE_LABELS[role]

    # field nomi -> UploadFile
    files_by_field = {f.filename or f"file_{i}": f for i, f in enumerate(files)}
    # aslida field nomi emas, index bo'yicha moslashtiramiz (formda tartib saqlanadi)
    for item, upload in zip(meta, files):
        section_id = item["section_id"]
        section_name = item.get("section_name", "")
        comment = (item.get("comment") or "").strip()

        caption = f"🏢 <b>{filial['name']}</b>\n🕒 {now_str}\n👤 {role_label}: {full_name}"
        if section_name:
            caption += f"\n📍 Bo'lim: {section_name}"
        if comment:
            caption += f"\n💬 {comment}"

        photo_bytes = await upload.read()
        sent = await tg.send_photo_to_topic(
            thread_id=thread_id,
            photo_bytes=photo_bytes,
            filename=upload.filename or "photo.jpg",
            caption=caption,
        )

        await db.add_submission_photo(
            submission_id=submission_id,
            section_id=section_id,
            file_id=sent["file_id"],
            comment=comment or None,
            sent_message_id=sent["message_id"],
        )

    return {"ok": True, "submission_id": submission_id}
