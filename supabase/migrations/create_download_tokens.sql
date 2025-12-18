-- Create download_tokens table for magic link downloads
-- Each token can only be used once

CREATE TABLE IF NOT EXISTS download_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    file_key VARCHAR(255) NOT NULL DEFAULT 'PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf',
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_email ON download_tokens(email);

-- RLS policies
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to download_tokens"
    ON download_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);
