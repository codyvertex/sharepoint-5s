CREATE TABLE suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id         UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    file_id         UUID REFERENCES crawled_files(id) ON DELETE SET NULL,
    category        TEXT NOT NULL
                    CHECK (category IN ('delete','archive','rename','structure')),
    severity        TEXT DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high','critical')),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    current_value   TEXT,
    suggested_value TEXT,
    confidence      REAL DEFAULT 0.0,
    user_decision   TEXT DEFAULT 'pending'
                    CHECK (user_decision IN ('pending','approved','rejected','skipped')),
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suggestions_scan_id ON suggestions(scan_id);
CREATE INDEX idx_suggestions_category ON suggestions(category);
CREATE INDEX idx_suggestions_decision ON suggestions(user_decision);
