import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/billing/status?orderId=... | ?subscriptionId=...
 * Retorna o status da order ou da subscription no nosso DB (fonte de verdade é o webhook).
 * Requer usuário autenticado; só retorna se a order/subscription pertencer à org do usuário.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const subscriptionId = searchParams.get('subscriptionId');

    if (orderId) {
      const { data: order, error } = await supabase
        .from('billing_orders')
        .select('id, organization_id, status, amount_cents, currency, paid_at')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const orgId = (profile as { organization_id: string | null } | null)?.organization_id ?? null;
      const orderOrgId = (order as { organization_id?: string }).organization_id;
      if (!orgId || orderOrgId !== orgId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({
        type: 'order',
        id: (order as { id: string }).id,
        status: (order as { status: string }).status,
        amountCents: (order as { amount_cents: number }).amount_cents,
        currency: (order as { currency: string }).currency,
        paidAt: (order as { paid_at: string | null }).paid_at ?? null,
      });
    }

    if (subscriptionId) {
      const { data: sub, error } = await supabase
        .from('billing_subscriptions')
        .select('id, organization_id, status, current_period_start, current_period_end')
        .eq('id', subscriptionId)
        .single();

      if (error || !sub) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const orgId = (profile as { organization_id: string | null } | null)?.organization_id ?? null;
      const subOrgId = (sub as { organization_id?: string }).organization_id;
      if (!orgId || subOrgId !== orgId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({
        type: 'subscription',
        id: (sub as { id: string }).id,
        status: (sub as { status: string }).status,
        currentPeriodStart: (sub as { current_period_start: string | null }).current_period_start,
        currentPeriodEnd: (sub as { current_period_end: string | null }).current_period_end,
      });
    }

    return NextResponse.json(
      { error: 'Provide orderId or subscriptionId' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[BILLING_STATUS] Error:', err);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
