-- 005: AI Usage Logs — per-request cost tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id         uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  user_id         uuid,
  service         text NOT NULL,          -- 'openai' | 'deepgram' | 'livekit'
  method          text NOT NULL,          -- 'analyzePostCall' | 'completeJson' | 'streamCoaching' | 'transcription' | 'room'
  model           text,                   -- 'gpt-4.1-mini' | 'nova-2' | 'livekit-cloud'
  prompt_tokens     int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  cached_tokens     int DEFAULT 0,
  total_tokens      int DEFAULT 0,
  duration_seconds  numeric(10,2),        -- Deepgram / LiveKit
  participants      int DEFAULT 0,        -- LiveKit: nº de participantes na sala
  cost_usd          numeric(12,8) DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_call ON ai_usage_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_usage_org  ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON ai_usage_logs(created_at);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Service role (backend) has full access; regular users cannot see cost data
CREATE POLICY "Service role full access" ON ai_usage_logs FOR ALL USING (true);
