import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createPaymentLink } from '@/lib/pagarme';
import { z } from 'zod';

const BodySchema = z.object({
  type: z.enum(['order', 'subscription']).default('order'),
  name: z.string().min(1).max(64).optional(),
  amountCents: z.number().int().min(1),
  currency: z.string().length(3).default('BRL'),
  planId: z.string().uuid().optional(),
});

/**
 * POST /api/billing/checkout
 * Cria link de pagamento na Pagar.me e persiste order no DB.
 * Retorna checkout_url e orderId. Requer usuário autenticado com organization_id.
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
      .select('organization_id, full_name, email')
      .eq('id', user.id)
      .single();

    const organizationId = (profile as { organization_id: string | null } | null)
      ?.organization_id ?? null;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Profile must have an organization to create checkout' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, name, amountCents, currency, planId } = parsed.data;
    const productName = name ?? `Pagamento ${type === 'subscription' ? 'assinatura' : 'único'}`;
    const orderCode = crypto.randomUUID();

    const linkPayload = {
      type: type as 'order' | 'subscription',
      name: productName,
      order_code: orderCode,
      payment_settings: {
        accepted_payment_methods: ['credit_card', 'pix', 'boleto'] as ('credit_card' | 'pix' | 'boleto')[],
      },
      cart_settings: {
        items: [
          {
            name: productName,
            amount: amountCents,
            default_quantity: 1,
          },
        ],
      },
      customer_settings: {
        customer: {
          name: (profile as { full_name: string | null }).full_name ?? user.email ?? 'Cliente',
          email: (profile as { email: string | null }).email ?? user.email ?? '',
          code: organizationId,
        },
      },
    };

    if (type === 'subscription') {
      (linkPayload as Record<string, unknown>).subscription_settings = {
        billing_cycle: { interval: 'month' as const, interval_count: 1 },
        payment_methods: ['credit_card', 'pix', 'boleto'],
      };
    }

    const pagarmeResponse = await createPaymentLink(
      linkPayload as unknown as Parameters<typeof createPaymentLink>[0]
    );

    const checkoutUrl = pagarmeResponse.checkout_url;
    const pagarmeOrderId =
      pagarmeResponse.order?.id ?? (pagarmeResponse as { order_id?: string }).order_id ?? null;
    const pagarmeLinkId = pagarmeResponse.id ?? null;

    const { data: orderRow, error: insertError } = await supabase
      .from('billing_orders')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        plan_id: planId ?? null,
        status: 'pending',
        amount_cents: amountCents,
        currency,
        order_code: orderCode,
        pagarme_order_id: pagarmeOrderId,
        pagarme_payment_link_id: pagarmeLinkId,
        metadata: {},
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[BILLING_CHECKOUT] Insert order failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to save order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      orderId: orderRow.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('PAGARME_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Billing is not configured (missing PAGARME_SECRET_KEY)' },
        { status: 503 }
      );
    }
    console.error('[BILLING_CHECKOUT] Error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
