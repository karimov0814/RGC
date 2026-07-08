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


# ---------- Ruxsat etilgan foydalanuvchilar (whitelist) ----------

async def get_allowed_user(telegram_user_id: int):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, telegram_user_id, full_name, is_superadmin FROM allowed_users "
        "WHERE telegram_user_id = $1",
        telegram_user_id,
    )
    return dict(row) if row else None


async def list_allowed_users():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, telegram_user_id, full_name, is_superadmin, created_at "
        "FROM allowed_users ORDER BY created_at"
    )
    return [dict(r) for r in rows]


async def add_allowed_user(telegram_user_id: int, full_name: str | None, is_superadmin: bool) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO allowed_users (telegram_user_id, full_name, is_superadmin)
        VALUES ($1, $2, $3)
        ON CONFLICT (telegram_user_id)
        DO UPDATE SET full_name = EXCLUDED.full_name, is_superadmin = EXCLUDED.is_superadmin
        RETURNING id, telegram_user_id, full_name, is_superadmin
        """,
        telegram_user_id, full_name, is_superadmin,
    )
    return dict(row)


async def update_allowed_user(user_id: int, full_name: str | None, is_superadmin: bool) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        UPDATE allowed_users SET full_name = $2, is_superadmin = $3
        WHERE id = $1
        RETURNING id, telegram_user_id, full_name, is_superadmin
        """,
        user_id, full_name, is_superadmin,
    )
    return dict(row) if row else None


async def delete_allowed_user(user_id: int) -> bool:
    pool = await get_pool()
    result = await pool.execute("DELETE FROM allowed_users WHERE id = $1", user_id)
    return result.endswith(" 1")


# ---------- Filiallar ----------

async def list_active_filials():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name, thread_id FROM filials WHERE is_active = TRUE ORDER BY sort_order, name"
    )
    return [dict(r) for r in rows]


async def list_all_filials():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name, thread_id, sort_order, is_active FROM filials ORDER BY sort_order, name"
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


async def update_filial(filial_id: int, name: str, is_active: bool) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        UPDATE filials SET name = $2, is_active = $3
        WHERE id = $1
        RETURNING id, name, thread_id, sort_order, is_active
        """,
        filial_id, name, is_active,
    )
    return dict(row) if row else None


async def deactivate_filial(filial_id: int) -> bool:
    """Filialni butunlay o'chirish o'rniga faolsizlantiradi — chunki unga
    bog'liq eski hisobotlar (submissions) bo'lishi mumkin va FK buni
    talab qiladi. Ilovada endi ko'rinmaydi."""
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE filials SET is_active = FALSE WHERE id = $1", filial_id
    )
    return result.endswith(" 1")


# ---------- Bo'limlar ----------

async def list_active_sections():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name FROM sections WHERE is_active = TRUE ORDER BY sort_order, id"
    )
    return [dict(r) for r in rows]


# ---------- Submissionlar ----------

async def create_submission(filial_id: int, telegram_user_id: int, full_name: str) -> int:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO submissions (filial_id, telegram_user_id, full_name)
        VALUES ($1, $2, $3) RETURNING id
        """,
        filial_id, telegram_user_id, full_name,
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
