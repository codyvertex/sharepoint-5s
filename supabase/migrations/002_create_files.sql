CREATE TABLE crawled_files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id             UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    graph_item_id       TEXT NOT NULL,
    name                TEXT NOT NULL,
    file_extension      TEXT,
    mime_type           TEXT,
    size_bytes          BIGINT DEFAULT 0,
    is_folder           BOOLEAN DEFAULT FALSE,
    path                TEXT NOT NULL,
    depth               INTEGER DEFAULT 0,
    created_at_sp       TIMESTAMPTZ,
    modified_at_sp      TIMESTAMPTZ,
    created_by          TEXT,
    modified_by         TEXT,
    parent_item_id      TEXT,
    web_url             TEXT,
    sha256_hash         TEXT,
    fetched_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crawled_files_scan_id ON crawled_files(scan_id);
CREATE INDEX idx_crawled_files_extension ON crawled_files(file_extension);
CREATE INDEX idx_crawled_files_modified ON crawled_files(modified_at_sp);
