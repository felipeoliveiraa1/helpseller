-- ============================================================================
-- MIGRATION 019: EMERGENCY SECURITY FIX - RLS POLICIES + ADMIN SYSTEM
-- ============================================================================
-- Context: Pentest revealed ALL data is readable via anon key without auth.
-- This migration:
--   1. Creates admin_users table for platform-level admin access
--   2. Re-enforces RLS on ALL tables
--   3. Adds is_admin() check so admin panel (painel-hps) keeps working
-- Run this IMMEDIATELY in production via Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ADMIN_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage admin_users
CREATE POLICY "admin_users_service_role" ON admin_users
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can check if THEY are admin (for UI checks)
CREATE POLICY "admin_users_self_check" ON admin_users
    FOR SELECT TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Insert current admin emails
INSERT INTO admin_users (email) VALUES
    ('felipeoliveiraa1@hotmail.com'),
    ('lucastria01@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 2: HELPER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 3: ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_hours_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

-- organizations
DROP POLICY IF EXISTS "Users view own org" ON organizations;
DROP POLICY IF EXISTS "org_select_own" ON organizations;
DROP POLICY IF EXISTS "org_service_role" ON organizations;

-- profiles
DROP POLICY IF EXISTS "Users view org members" ON profiles;
DROP POLICY IF EXISTS "Admins edit org members" ON profiles;
DROP POLICY IF EXISTS "profiles_select_org" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_edit" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role" ON profiles;

-- scripts
DROP POLICY IF EXISTS "Users view org scripts" ON scripts;
DROP POLICY IF EXISTS "Managers edit scripts" ON scripts;
DROP POLICY IF EXISTS "scripts_select_org" ON scripts;
DROP POLICY IF EXISTS "scripts_manager_edit" ON scripts;
DROP POLICY IF EXISTS "scripts_service_role" ON scripts;

-- script_steps
DROP POLICY IF EXISTS "Users view steps" ON script_steps;
DROP POLICY IF EXISTS "Managers edit steps" ON script_steps;
DROP POLICY IF EXISTS "steps_select_org" ON script_steps;
DROP POLICY IF EXISTS "steps_manager_edit" ON script_steps;
DROP POLICY IF EXISTS "steps_service_role" ON script_steps;

-- objections
DROP POLICY IF EXISTS "Users view objections" ON objections;
DROP POLICY IF EXISTS "Managers edit objections" ON objections;
DROP POLICY IF EXISTS "objections_select_org" ON objections;
DROP POLICY IF EXISTS "objections_manager_edit" ON objections;
DROP POLICY IF EXISTS "objections_service_role" ON objections;

-- calls
DROP POLICY IF EXISTS "Sellers view own calls" ON calls;
DROP POLICY IF EXISTS "Users create calls" ON calls;
DROP POLICY IF EXISTS "Users update own calls" ON calls;
DROP POLICY IF EXISTS "calls_select_own_or_manager" ON calls;
DROP POLICY IF EXISTS "calls_insert_own" ON calls;
DROP POLICY IF EXISTS "calls_update_own_or_manager" ON calls;
DROP POLICY IF EXISTS "calls_service_role" ON calls;

-- call_events
DROP POLICY IF EXISTS "View events with access to call" ON call_events;
DROP POLICY IF EXISTS "call_events_select" ON call_events;
DROP POLICY IF EXISTS "call_events_service_role" ON call_events;

-- call_summaries
DROP POLICY IF EXISTS "View summaries with access to call" ON call_summaries;
DROP POLICY IF EXISTS "summaries_select" ON call_summaries;
DROP POLICY IF EXISTS "summaries_service_role" ON call_summaries;

-- objection_success_metrics
DROP POLICY IF EXISTS "Users view metrics for org scripts" ON objection_success_metrics;
DROP POLICY IF EXISTS "Service role can manage metrics" ON objection_success_metrics;
DROP POLICY IF EXISTS "System update metrics" ON objection_success_metrics;
DROP POLICY IF EXISTS "metrics_select_org" ON objection_success_metrics;
DROP POLICY IF EXISTS "metrics_service_role" ON objection_success_metrics;

-- ai_usage_logs
DROP POLICY IF EXISTS "Service role full access" ON ai_usage_logs;
DROP POLICY IF EXISTS "ai_logs_service_role" ON ai_usage_logs;

-- coaches
DROP POLICY IF EXISTS "Users view org coaches" ON coaches;
DROP POLICY IF EXISTS "Managers insert coaches" ON coaches;
DROP POLICY IF EXISTS "Managers update coaches" ON coaches;
DROP POLICY IF EXISTS "Managers delete coaches" ON coaches;
DROP POLICY IF EXISTS "coaches_select_org" ON coaches;
DROP POLICY IF EXISTS "coaches_manager_insert" ON coaches;
DROP POLICY IF EXISTS "coaches_manager_update" ON coaches;
DROP POLICY IF EXISTS "coaches_manager_delete" ON coaches;
DROP POLICY IF EXISTS "coaches_service_role" ON coaches;

-- billing_customers
DROP POLICY IF EXISTS "Service role manages billing_customers" ON billing_customers;
DROP POLICY IF EXISTS "billing_customers_service_role" ON billing_customers;

-- billing_plans
DROP POLICY IF EXISTS "Anyone view plans" ON billing_plans;
DROP POLICY IF EXISTS "Authenticated users can read plans" ON billing_plans;
DROP POLICY IF EXISTS "Service role manages billing_plans" ON billing_plans;
DROP POLICY IF EXISTS "billing_plans_select" ON billing_plans;
DROP POLICY IF EXISTS "billing_plans_service_role" ON billing_plans;

-- billing_orders
DROP POLICY IF EXISTS "Users view own orders" ON billing_orders;
DROP POLICY IF EXISTS "Users insert own orders" ON billing_orders;
DROP POLICY IF EXISTS "Users view own org orders" ON billing_orders;
DROP POLICY IF EXISTS "Service role manages billing_orders" ON billing_orders;
DROP POLICY IF EXISTS "billing_orders_select_org" ON billing_orders;
DROP POLICY IF EXISTS "billing_orders_insert_org" ON billing_orders;
DROP POLICY IF EXISTS "billing_orders_service_role" ON billing_orders;

-- billing_subscriptions
DROP POLICY IF EXISTS "Users view own subscriptions" ON billing_subscriptions;
DROP POLICY IF EXISTS "Users view own org subscriptions" ON billing_subscriptions;
DROP POLICY IF EXISTS "Service role manages billing_subscriptions" ON billing_subscriptions;
DROP POLICY IF EXISTS "billing_subs_select_org" ON billing_subscriptions;
DROP POLICY IF EXISTS "billing_subs_service_role" ON billing_subscriptions;

-- billing_payments
DROP POLICY IF EXISTS "Users view own org payments" ON billing_payments;
DROP POLICY IF EXISTS "Service role manages billing_payments" ON billing_payments;
DROP POLICY IF EXISTS "billing_payments_select_org" ON billing_payments;
DROP POLICY IF EXISTS "billing_payments_service_role" ON billing_payments;

-- billing_webhook_events
DROP POLICY IF EXISTS "Service role manages billing_webhook_events" ON billing_webhook_events;
DROP POLICY IF EXISTS "webhook_events_service_role" ON billing_webhook_events;

-- extra_hours_purchases
DROP POLICY IF EXISTS "Users can view own org extra hours" ON extra_hours_purchases;
DROP POLICY IF EXISTS "extra_hours_select_org" ON extra_hours_purchases;
DROP POLICY IF EXISTS "extra_hours_service_role" ON extra_hours_purchases;

-- affiliates
DROP POLICY IF EXISTS "Affiliates can view own record" ON affiliates;
DROP POLICY IF EXISTS "affiliates_select_own" ON affiliates;
DROP POLICY IF EXISTS "affiliates_service_role" ON affiliates;
DROP POLICY IF EXISTS "affiliates_public_register" ON affiliates;

-- affiliate_referrals
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "referrals_select_own" ON affiliate_referrals;
DROP POLICY IF EXISTS "referrals_service_role" ON affiliate_referrals;

-- affiliate_commissions
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "commissions_select_own" ON affiliate_commissions;
DROP POLICY IF EXISTS "commissions_service_role" ON affiliate_commissions;

-- affiliate_payouts
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON affiliate_payouts;
DROP POLICY IF EXISTS "Affiliates can request payouts" ON affiliate_payouts;
DROP POLICY IF EXISTS "payouts_select_own" ON affiliate_payouts;
DROP POLICY IF EXISTS "payouts_insert_own" ON affiliate_payouts;
DROP POLICY IF EXISTS "payouts_service_role" ON affiliate_payouts;

-- feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "feedback_select_own" ON feedback;
DROP POLICY IF EXISTS "feedback_insert_own" ON feedback;
DROP POLICY IF EXISTS "feedback_service_role" ON feedback;

-- ============================================================================
-- STEP 5: RECREATE ALL POLICIES
-- Every SELECT policy includes "OR is_admin()" so painel-hps keeps working.
-- ============================================================================

-- ---- ORGANIZATIONS ----
CREATE POLICY "org_select" ON organizations
    FOR SELECT TO authenticated
    USING (id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "org_service_role" ON organizations
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- PROFILES ----
CREATE POLICY "profiles_select" ON profiles
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "profiles_manage" ON profiles
    FOR ALL TO authenticated
    USING (
        organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    )
    WITH CHECK (organization_id = get_auth_user_org_id());

CREATE POLICY "profiles_service_role" ON profiles
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- SCRIPTS ----
CREATE POLICY "scripts_select" ON scripts
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR organization_id IS NULL OR is_admin());

CREATE POLICY "scripts_manage" ON scripts
    FOR ALL TO authenticated
    USING (
        organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    )
    WITH CHECK (organization_id = get_auth_user_org_id());

CREATE POLICY "scripts_service_role" ON scripts
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- SCRIPT_STEPS ----
CREATE POLICY "steps_select" ON script_steps
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM scripts
            WHERE id = script_steps.script_id
            AND (organization_id = get_auth_user_org_id() OR organization_id IS NULL)
        )
        OR is_admin()
    );

CREATE POLICY "steps_manage" ON script_steps
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scripts
        WHERE id = script_steps.script_id
        AND organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    ));

CREATE POLICY "steps_service_role" ON script_steps
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- OBJECTIONS ----
CREATE POLICY "objections_select" ON objections
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM scripts
            WHERE id = objections.script_id
            AND (organization_id = get_auth_user_org_id() OR organization_id IS NULL)
        )
        OR is_admin()
    );

CREATE POLICY "objections_manage" ON objections
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scripts
        WHERE id = objections.script_id
        AND organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    ));

CREATE POLICY "objections_service_role" ON objections
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- CALLS ----
CREATE POLICY "calls_select" ON calls
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            organization_id = get_auth_user_org_id()
            AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
        )
        OR is_admin()
    );

CREATE POLICY "calls_insert" ON calls
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND organization_id = get_auth_user_org_id());

CREATE POLICY "calls_update" ON calls
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            organization_id = get_auth_user_org_id()
            AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
        )
    );

CREATE POLICY "calls_service_role" ON calls
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- CALL_EVENTS ----
CREATE POLICY "call_events_select" ON call_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM calls
            WHERE id = call_events.call_id
            AND (
                user_id = auth.uid()
                OR (organization_id = get_auth_user_org_id()
                    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')))
            )
        )
        OR is_admin()
    );

CREATE POLICY "call_events_service_role" ON call_events
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- CALL_SUMMARIES ----
CREATE POLICY "summaries_select" ON call_summaries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM calls
            WHERE id = call_summaries.call_id
            AND (
                user_id = auth.uid()
                OR (organization_id = get_auth_user_org_id()
                    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')))
            )
        )
        OR is_admin()
    );

CREATE POLICY "summaries_service_role" ON call_summaries
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- OBJECTION_SUCCESS_METRICS ----
CREATE POLICY "metrics_select" ON objection_success_metrics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM scripts s
            JOIN profiles p ON p.organization_id = s.organization_id
            WHERE s.id = objection_success_metrics.script_id
            AND p.id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY "metrics_service_role" ON objection_success_metrics
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- AI_USAGE_LOGS (admin + service_role) ----
CREATE POLICY "ai_logs_select" ON ai_usage_logs
    FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "ai_logs_service_role" ON ai_usage_logs
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- COACHES ----
CREATE POLICY "coaches_select" ON coaches
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "coaches_insert" ON coaches
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    );

CREATE POLICY "coaches_update" ON coaches
    FOR UPDATE TO authenticated
    USING (
        organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    );

CREATE POLICY "coaches_delete" ON coaches
    FOR DELETE TO authenticated
    USING (
        organization_id = get_auth_user_org_id()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
    );

CREATE POLICY "coaches_service_role" ON coaches
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_CUSTOMERS (service_role + admin read) ----
CREATE POLICY "billing_customers_select" ON billing_customers
    FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "billing_customers_service_role" ON billing_customers
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_PLANS (readable by all authenticated) ----
CREATE POLICY "billing_plans_select" ON billing_plans
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "billing_plans_service_role" ON billing_plans
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_ORDERS ----
CREATE POLICY "billing_orders_select" ON billing_orders
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "billing_orders_insert" ON billing_orders
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_auth_user_org_id());

CREATE POLICY "billing_orders_service_role" ON billing_orders
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_SUBSCRIPTIONS ----
CREATE POLICY "billing_subs_select" ON billing_subscriptions
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "billing_subs_service_role" ON billing_subscriptions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_PAYMENTS ----
CREATE POLICY "billing_payments_select" ON billing_payments
    FOR SELECT TO authenticated
    USING (
        order_id IN (
            SELECT id FROM billing_orders WHERE organization_id = get_auth_user_org_id()
        )
        OR subscription_id IN (
            SELECT id FROM billing_subscriptions WHERE organization_id = get_auth_user_org_id()
        )
        OR is_admin()
    );

CREATE POLICY "billing_payments_service_role" ON billing_payments
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- BILLING_WEBHOOK_EVENTS (service_role + admin read) ----
CREATE POLICY "webhook_events_select" ON billing_webhook_events
    FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "webhook_events_service_role" ON billing_webhook_events
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- EXTRA_HOURS_PURCHASES ----
CREATE POLICY "extra_hours_select" ON extra_hours_purchases
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_admin());

CREATE POLICY "extra_hours_service_role" ON extra_hours_purchases
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- AFFILIATES ----
CREATE POLICY "affiliates_select" ON affiliates
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "affiliates_service_role" ON affiliates
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "affiliates_public_register" ON affiliates
    FOR INSERT TO anon
    WITH CHECK (status = 'pending');

-- ---- AFFILIATE_REFERRALS ----
CREATE POLICY "referrals_select" ON affiliate_referrals
    FOR SELECT TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "referrals_service_role" ON affiliate_referrals
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- AFFILIATE_COMMISSIONS ----
CREATE POLICY "commissions_select" ON affiliate_commissions
    FOR SELECT TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "commissions_service_role" ON affiliate_commissions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- AFFILIATE_PAYOUTS ----
CREATE POLICY "payouts_select" ON affiliate_payouts
    FOR SELECT TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "payouts_insert" ON affiliate_payouts
    FOR INSERT TO authenticated
    WITH CHECK (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "payouts_service_role" ON affiliate_payouts
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ---- FEEDBACK ----
CREATE POLICY "feedback_select" ON feedback
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "feedback_insert" ON feedback
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_update" ON feedback
    FOR UPDATE TO authenticated
    USING (is_admin());

CREATE POLICY "feedback_service_role" ON feedback
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 6: VERIFY
-- ============================================================================
-- After running, execute this to confirm:
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- And test with anon key:
-- SELECT * FROM profiles; -- Should return empty
-- SELECT * FROM calls;    -- Should return empty
