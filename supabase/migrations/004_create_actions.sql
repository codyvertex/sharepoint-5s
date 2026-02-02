CREATE TABLE executed_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id   UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    scan_id         UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    action_type     TEXT NOT NULL
                    CHECK (action_type IN ('delete','move','rename','create_folder')),
    target_item_id  TEXT NOT NULL,
    payload         JSONB,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','executing','success','failed')),
    graph_response  JSONB,
    error_message   TEXT,
    executed_at     TIMESTAMPTZ DEFAULT now()
);
