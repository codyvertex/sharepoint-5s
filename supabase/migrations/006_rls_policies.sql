-- Scans: users see only their own
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scans" ON scans
    FOR ALL USING (auth.uid() = user_id);

-- Crawled files: users see files from their own scans
ALTER TABLE crawled_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own crawled files" ON crawled_files
    FOR SELECT USING (
        scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
    );

-- Suggestions: users manage suggestions from their own scans
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own suggestions" ON suggestions
    FOR ALL USING (
        scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
    );

-- Executed actions: users see their own actions
ALTER TABLE executed_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own actions" ON executed_actions
    FOR ALL USING (user_id = auth.uid());
