-- Pinterest Automation - Supabase Database Schema
-- Run in Supabase SQL Editor

-- 1. Settings (single-row config)
CREATE TABLE IF NOT EXISTS settings (
    id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_folder_id         text,
    posting_interval_hours  integer     NOT NULL DEFAULT 24,
    default_post_time       time        NOT NULL DEFAULT '10:00',
    google_access_token     text,
    google_refresh_token    text,
    pinterest_access_token  text,
    pinterest_refresh_token text,
    updated_at              timestamptz DEFAULT now()
);

INSERT INTO settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 2. Photos
CREATE TABLE IF NOT EXISTS photos (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_file_id   text        UNIQUE NOT NULL,
    file_name       text        NOT NULL,
    drive_url       text        NOT NULL,
    thumbnail_url   text,
    storage_url     text,
    status          text        NOT NULL DEFAULT 'new',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_photos_status ON photos (status);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos (created_at DESC);

-- 3. Tags
CREATE TABLE IF NOT EXISTS tags (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id    uuid        NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
    tag         text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_photo_id ON tags (photo_id);

-- 4. Scheduled Pins
CREATE TABLE IF NOT EXISTS scheduled_pins (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id         uuid        NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
    title            text,
    description      text,
    board_id         text,
    link_url         text,
    position         integer     NOT NULL DEFAULT 0,
    scheduled_for    timestamptz,
    posted_at        timestamptz,
    pinterest_pin_id text,
    paused           boolean     NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pins_position ON scheduled_pins (position);
CREATE INDEX IF NOT EXISTS idx_scheduled_pins_scheduled_for ON scheduled_pins (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_pins_photo_id ON scheduled_pins (photo_id);

-- 5. Board Mappings
CREATE TABLE IF NOT EXISTS board_mappings (
    id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    category    text    UNIQUE NOT NULL,
    board_id    text,
    board_name  text    NOT NULL,
    link_url    text
);

INSERT INTO board_mappings (category, board_name) VALUES
    ('henna',   'Henna'),
    ('bridal',  'Bridal'),
    ('nails',   'Nails'),
    ('floral',  'Floral'),
    ('mehndi',  'Mehndi'),
    ('desi',    'Desi'),
    ('outfits', 'Outfits'),
    ('neutral', 'Neutral')
ON CONFLICT (category) DO NOTHING;

-- 6. Storage bucket for pin images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-images', 'pin-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS policies (allow all via service role)
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on photos" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scheduled_pins" ON scheduled_pins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on board_mappings" ON board_mappings FOR ALL USING (true) WITH CHECK (true);
