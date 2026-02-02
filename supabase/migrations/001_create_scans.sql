CREATE TABLE scans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sharepoint_url  TEXT NOT NULL,
    site_id         TEXT,
    drive_id        TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','crawling','crawled','analyzing','complete','error')),
    total_files     INTEGER DEFAULT 0,
    total_folders   INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    crawl_progress  INTEGER DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
