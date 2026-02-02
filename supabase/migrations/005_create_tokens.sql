CREATE TABLE provider_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token        TEXT NOT NULL,
    refresh_token       TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- No RLS policies = only service_role can access
ALTER TABLE provider_tokens ENABLE ROW LEVEL SECURITY;
