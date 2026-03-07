-- Fix: ensure all billing columns and tables exist.
-- Uses ADD COLUMN IF NOT EXISTS to be fully idempotent.

-- 1. organizations: add missing columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE'));

-- 2. billing_customers
CREATE TABLE IF NOT EXISTS billing_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. billing_plans
CREATE TABLE IF NOT EXISTS billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    amount_cents INT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS interval TEXT;
ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS max_sellers INT;
ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS max_call_hours INT;
ALTER TABLE billing_plans ADD COLUMN IF NOT EXISTS extra_hour_cents INT;

-- 4. billing_orders
CREATE TABLE IF NOT EXISTS billing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft',
    amount_cents INT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS order_code TEXT;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Ensure unique constraint on order_code if not already there
-- order_code unique constraint already exists

CREATE INDEX IF NOT EXISTS idx_billing_orders_org ON billing_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_orders_order_code ON billing_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_billing_orders_stripe_session ON billing_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_billing_orders_status ON billing_orders(status);

-- 5. billing_subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE billing_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE billing_subscriptions
    ADD CONSTRAINT billing_subscriptions_stripe_subscription_id_key
    UNIQUE (stripe_subscription_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_org ON billing_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe ON billing_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);

-- 6. billing_payments
CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS subscription_id UUID;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_billing_payments_order ON billing_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_sub ON billing_payments(subscription_id);

-- 7. billing_webhook_events
CREATE TABLE IF NOT EXISTS billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    type TEXT NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS signature_ok BOOLEAN;

-- event_id unique constraint handled at creation

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_event_id ON billing_webhook_events(event_id);

-- 8. RLS
DO $$ BEGIN ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP POLICY IF EXISTS "Users view own orders" ON billing_orders;
CREATE POLICY "Users view own orders" ON billing_orders FOR SELECT USING (organization_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Users insert own orders" ON billing_orders;
CREATE POLICY "Users insert own orders" ON billing_orders FOR INSERT WITH CHECK (organization_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Users view own subscriptions" ON billing_subscriptions;
CREATE POLICY "Users view own subscriptions" ON billing_subscriptions FOR SELECT USING (organization_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Anyone view plans" ON billing_plans;
CREATE POLICY "Anyone view plans" ON billing_plans FOR SELECT USING (true);
