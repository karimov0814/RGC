"""
PostgreSQL bilan ishlash uchun yordamchi qatlam (asyncpg asosida).
"""
import os
import asyncpg
from typing import Optional

DATABASE_URL = os.environ["DATABASE_URL"]  # masalan: postgresql://user:pass@localhost:5432/feedback

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ---------- Filiallar ----------

async def list_active_filials():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name, thread_id FROM filials WHERE is_active = TRUE ORDER BY name"
    )
    return [dict(r) for r in rows]


async def get_filial(filial_id: int):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, name, thread_id FROM filials WHERE id = $1", filial_id
    )
    return dict(row) if row else None


async def set_filial_thread_id(filial_id: int, thread_id: int):
    pool = await get_pool()
    await pool.execute(
        "UPDATE filials SET thread_id = $1 WHERE id = $2", thread_id, filial_id
    )


async def create_filial(name: str) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        "INSERT INTO filials (name) VALUES ($1) RETURNING id, name, thread_id", name
    )
    return dict(row)


# ---------- Bo'limlar ----------

async def list_active_sections():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name FROM sections WHERE is_active = TRUE ORDER BY sort_order, id"
    )
    return [dict(r) for r in rows]


# ---------- Kontaktlar (mehmonlar uchun telefon) ----------

async def get_contact(telegram_user_id: int):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT phone, full_name FROM user_contacts WHERE telegram_user_id = $1",
        telegram_user_id,
    )
    return dict(row) if row else None


async def upsert_contact(telegram_user_id: int, phone: str, full_name: str | None):
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO user_contacts (telegram_user_id, phone, full_name, updated_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (telegram_user_id)
        DO UPDATE SET phone = EXCLUDED.phone,
                       full_name = COALESCE(EXCLUDED.full_name, user_contacts.full_name),
                       updated_at = now()
        """,
        telegram_user_id, phone, full_name,
    )


# ---------- Submissionlar ----------

async def create_submission(filial_id: int, telegram_user_id: int, full_name: str,
                             phone: str | None, role: str) -> int:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO submissions (filial_id, telegram_user_id, full_name, phone, role)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
        """,
        filial_id, telegram_user_id, full_name, phone, role,
    )
    return row["id"]


async def add_submission_photo(submission_id: int, section_id: int, file_id: str,
                                comment: str | None, sent_message_id: int | None):
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO submission_photos (submission_id, section_id, telegram_file_id, comment, sent_message_id)
        VALUES ($1, $2, $3, $4, $5)
        """,
        submission_id, section_id, file_id, comment, sent_message_id,
    )
