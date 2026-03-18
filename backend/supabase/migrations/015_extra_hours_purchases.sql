-- Extra hours purchases table
-- Tracks one-time purchases of extra call hours
CREATE TABLE IF NOT EXISTS extra_hours_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    hours INTEGER NOT NULL CHECK (hours >= 5),
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'brl',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    -- Track which month these hours apply to (NULL = current month at time of purchase)
    valid_month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
    hours_used NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- Index for querying active purchases per org per month
CREATE INDEX IF NOT EXISTS idx_extra_hours_org_month ON extra_hours_purchases(organization_id, valid_month, status);

-- RLS
ALTER TABLE extra_hours_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org extra hours" ON extra_hours_purchases
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
