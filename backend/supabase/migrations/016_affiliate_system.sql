-- Affiliate system tables
-- Supports: registration, referral tracking, commission calculation, payouts

-- 1. Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    code VARCHAR(20) UNIQUE NOT NULL,
    commission_percent NUMERIC(5,2) NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected', 'banned')),
    pix_key TEXT,
    pix_type TEXT CHECK (pix_type IN ('cpf', 'email', 'telefone', 'aleatoria', NULL)),
    how_promote TEXT,
    total_earned_cents BIGINT NOT NULL DEFAULT 0,
    total_paid_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Affiliate referrals (tracks which orgs were referred by which affiliate)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'trial', 'active', 'churned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Affiliate commissions (individual commission records)
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'extra_hours')),
    source_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'requested', 'paid', 'cancelled')),
    available_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Affiliate payouts (withdrawal requests)
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    pix_key TEXT NOT NULL,
    pix_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'rejected')),
    admin_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- 5. Add referred_by column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES affiliates(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_org ON affiliate_referrals(organization_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_organizations_referred_by ON organizations(referred_by);

-- RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Affiliates: user can see own record
CREATE POLICY "Affiliates can view own record" ON affiliates
    FOR SELECT USING (user_id = auth.uid());

-- Referrals: affiliate can see own referrals
CREATE POLICY "Affiliates can view own referrals" ON affiliate_referrals
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Commissions: affiliate can see own commissions
CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Payouts: affiliate can see own payouts
CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Payouts: affiliate can insert own payout requests
CREATE POLICY "Affiliates can request payouts" ON affiliate_payouts
    FOR INSERT WITH CHECK (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid() AND status = 'active')
    );
