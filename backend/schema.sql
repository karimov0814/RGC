-- ============================================================
--  Filial Feedback Mini App — PostgreSQL sxemasi
-- ============================================================

CREATE TABLE IF NOT EXISTS filials (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,     -- "Chilonzor filiali"
    thread_id   INTEGER,                  -- Telegram guruhdagi forum-topic id (avtomatik to'ldiriladi)
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,            -- "Oshxona", "Zal", "Ombor" ...
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Har bir foydalanuvchining telefon raqami (mehmonlar uchun,
-- bot kontaktni ushlab, shu yerga yozadi)
CREATE TABLE IF NOT EXISTS user_contacts (
    telegram_user_id  BIGINT PRIMARY KEY,
    phone             TEXT NOT NULL,
    full_name         TEXT,
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
    id                SERIAL PRIMARY KEY,
    filial_id         INTEGER NOT NULL REFERENCES filials(id),
    telegram_user_id  BIGINT NOT NULL,
    full_name         TEXT,
    phone             TEXT,
    role              TEXT NOT NULL CHECK (role IN ('employee', 'guest')),  -- Filial xodimi / Mehmon
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submission_photos (
    id                 SERIAL PRIMARY KEY,
    submission_id      INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    section_id         INTEGER NOT NULL REFERENCES sections(id),
    telegram_file_id   TEXT,
    comment            TEXT,
    sent_message_id    BIGINT,   -- guruhga yuborilgan xabar id (kuzatuv uchun)
    created_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- Boshlang'ich bo'limlar namunasi (kerakli nomlarga o'zgartiring)
INSERT INTO sections (name, sort_order) VALUES
    ('Oshxona', 1),
    ('Zal', 2),
    ('Ombor', 3),
    ('Hojatxona', 4),
    ('Fasad', 5)
ON CONFLICT DO NOTHING;
