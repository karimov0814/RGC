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

CREATE TABLE IF NOT EXISTS submissions (
    id                SERIAL PRIMARY KEY,
    filial_id         INTEGER NOT NULL REFERENCES filials(id),
    telegram_user_id  BIGINT NOT NULL,
    full_name         TEXT,
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

-- Boshlang'ich bo'limlar ro'yxati
INSERT INTO sections (name, sort_order) VALUES
    ('Фото внешней территории и фасада', 1),
    ('Фото зала и туалетов', 2),
    ('Фото прилавка', 3),
    ('Фото кухни (1. Станция пиццы, 2. Станция Вок, 3. Станция сборки бургеров и роллов, 4. Панировочная станция, 5. Станция фри, 6. Станция мойки и моповые зоны)', 4),
    ('Фото служебного помещения', 5),
    ('Фото доставочных помещений', 6),
    ('Фото сотрудников после пятиминутки и командной доски (только утром)', 7),
    ('Фото чек-листов: Чек-лист Чистоты, Чек-лист МС, КЛН, Бланк уборки ГСУ (11:00, 15:00, 18:00, 21:00, Закрытие смены)', 8)
ON CONFLICT DO NOTHING;
