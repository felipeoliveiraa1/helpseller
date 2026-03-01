-- Fix overly permissive RLS policies that allow any user full access

-- Fix ai_usage_logs: restrict to service role only
DROP POLICY IF EXISTS "Service role full access" ON ai_usage_logs;
CREATE POLICY "Service role full access" ON ai_usage_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Fix objection_success_metrics: restrict to service role only
DROP POLICY IF EXISTS "System update metrics" ON objection_success_metrics;
CREATE POLICY "System update metrics" ON objection_success_metrics
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
