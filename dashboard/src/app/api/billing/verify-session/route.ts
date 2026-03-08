import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

/**
 * POST /api/billing/verify-session
 * Verifies a Stripe checkout session and activates the plan.
 * Acts as a fallback in case the webhook didn't fire or failed.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = (profile as { organization_id: string | null } | null)?.organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Verify the session belongs to this organization
    const sessionOrgId = session.metadata?.organization_id ?? session.client_reference_id;
    if (sessionOrgId !== organizationId) {
      return NextResponse.json({ error: 'Session does not belong to this organization' }, { status: 403 });
    }

    // Check if payment was completed
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({
        status: 'pending',
        message: 'Payment not yet completed',
      });
    }

    const admin = createAdminClient();

    // Check if the organization already has the plan activated
    const { data: org } = await admin
      .from('organizations')
      .select('plan, stripe_subscription_id')
      .eq('id', organizationId)
      .single();

    const currentPlan = (org as { plan?: string } | null)?.plan ?? 'FREE';

    // Resolve plan slug
    const planSlug = await resolvePlanSlug(admin, session.metadata?.plan_id || null)
      || session.metadata?.plan_slug
      || null;

    if (!planSlug) {
      console.error('[VERIFY_SESSION] Could not resolve plan slug', {
        planId: session.metadata?.plan_id,
        planSlug: session.metadata?.plan_slug,
      });
      return NextResponse.json({ error: 'Could not resolve plan' }, { status: 500 });
    }

    // If plan is already activated, just return success
    if (currentPlan === planSlug) {
      return NextResponse.json({
        status: 'active',
        plan: planSlug,
        message: 'Plan already active',
      });
    }

    // Activate the plan — this is the fallback for when the webhook failed
    console.log('[VERIFY_SESSION] Activating plan via verify-session fallback', {
      organizationId,
      planSlug,
      previousPlan: currentPlan,
    });

    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as { id: string } | null)?.id ?? null;

    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as { id: string } | null)?.id ?? null;

    // Update organization
    const { error: orgError } = await admin
      .from('organizations')
      .update({
        plan: planSlug,
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        ...(stripeSubscriptionId ? { stripe_subscription_id: stripeSubscriptionId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (orgError) {
      console.error('[VERIFY_SESSION] Failed to update organization:', orgError);
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
    }

    // Update billing_orders
    const orderCode = session.metadata?.order_code;
    if (orderCode) {
      await admin
        .from('billing_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('order_code', orderCode)
        .in('status', ['draft', 'pending']);
    }

    // Upsert billing_subscriptions
    if (stripeSubscriptionId) {
      await admin.from('billing_subscriptions').upsert(
        {
          organization_id: organizationId,
          plan_id: session.metadata?.plan_id || null,
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: new Date().toISOString(),
          metadata: {},
        },
        { onConflict: 'stripe_subscription_id' }
      );
    }

    return NextResponse.json({
      status: 'activated',
      plan: planSlug,
      message: 'Plan activated successfully',
    });
  } catch (err) {
    console.error('[VERIFY_SESSION] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function resolvePlanSlug(
  supabase: ReturnType<typeof createAdminClient>,
  planId: string | null
): Promise<string | null> {
  if (!planId) return null;
  const { data } = await supabase
    .from('billing_plans')
    .select('slug')
    .eq('id', planId)
    .maybeSingle();
  return (data as { slug: string } | null)?.slug ?? null;
}
