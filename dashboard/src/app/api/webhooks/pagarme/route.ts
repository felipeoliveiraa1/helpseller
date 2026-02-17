import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface PagarmeWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    id?: string;
    status?: string;
    order?: { id?: string };
    order_id?: string;
  };
  [key: string]: unknown;
}

/**
 * POST /api/webhooks/pagarme
 * Recebe eventos da Pagar.me. Público (sem auth de usuário). Deduplica por event_id.
 * Atualiza billing_orders / billing_subscriptions conforme o tipo do evento.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    let payload: PagarmeWebhookPayload;
    try {
      payload = JSON.parse(raw) as PagarmeWebhookPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventId = payload.id ?? payload.data?.id ?? null;
    const eventType = payload.type ?? (payload as { name?: string }).name ?? 'unknown';

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('billing_webhook_events')
      .select('id')
      .eq('event_id', String(eventId))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { error: insertEventError } = await supabase.from('billing_webhook_events').insert({
      event_id: String(eventId),
      type: eventType,
      received_at: new Date().toISOString(),
      payload: payload as unknown as Record<string, unknown>,
      signature_ok: null,
    });

    if (insertEventError) {
      if (insertEventError.code === '23505') {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      console.error('[WEBHOOK_PAGARME] Insert event failed:', insertEventError);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    const data = payload.data ?? {};
    const orderIdPagarme = data.order?.id ?? data.order_id ?? data.id ?? null;
    const status = data.status ?? null;

    if (orderIdPagarme && typeof orderIdPagarme === 'string') {
      if (eventType === 'order.paid' || eventType === 'charge.paid') {
        const { error: updateOrder } = await supabase
          .from('billing_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('pagarme_order_id', orderIdPagarme)
          .in('status', ['draft', 'pending']);

        if (updateOrder) {
          console.error('[WEBHOOK_PAGARME] Update order failed:', updateOrder);
        }
      } else if (eventType === 'order.payment_failed') {
        await supabase
          .from('billing_orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('pagarme_order_id', orderIdPagarme)
          .in('status', ['draft', 'pending']);
      } else if (eventType === 'order.canceled') {
        await supabase
          .from('billing_orders')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('pagarme_order_id', orderIdPagarme);
      }
    }

    await supabase
      .from('billing_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', String(eventId));

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Webhook not configured (missing SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      );
    }
    console.error('[WEBHOOK_PAGARME] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
