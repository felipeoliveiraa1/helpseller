import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe';

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session so the user can manage subscriptions.
 * Requires authenticated user with organization that has a stripe_customer_id.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = (profile as { organization_id: string | null } | null)
      ?.organization_id ?? null;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      );
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single();

    const stripeCustomerId = (org as { stripe_customer_id: string | null } | null)
      ?.stripe_customer_id ?? null;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Subscribe to a plan first.' },
        { status: 404 }
      );
    }

    const origin = request.headers.get('origin')
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? 'http://localhost:3000';

    const portalUrl = await createCustomerPortalSession({
      stripeCustomerId,
      returnUrl: `${origin}/billing`,
    });

    return NextResponse.json({ portalUrl });
  } catch (err) {
    console.error('[BILLING_PORTAL] Error:', err);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
