/**
 * Stripe server-side client for Checkout Sessions and Customer Portal.
 * Authentication: Secret key via environment variable.
 * @see https://docs.stripe.com/api
 * @see https://docs.stripe.com/checkout/quickstart
 */
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getStripeClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(STRIPE_SECRET_KEY);
}

export type CheckoutMode = 'payment' | 'subscription';

export interface CreateCheckoutSessionParams {
  mode: CheckoutMode;
  customerEmail: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  clientReferenceId?: string;
  subscriptionMetadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

/**
 * Creates a Stripe Checkout Session (hosted payment page).
 * Supports both one-time payments (mode='payment') and subscriptions (mode='subscription').
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient();
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: params.mode,
    customer_email: params.customerEmail,
    line_items: params.lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    client_reference_id: params.clientReferenceId,
    payment_intent_data: params.mode === 'payment'
      ? { metadata: params.metadata ?? {} }
      : undefined,
    subscription_data: params.mode === 'subscription'
      ? { metadata: params.subscriptionMetadata ?? params.metadata ?? {} }
      : undefined,
  };
  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }
  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

export interface CreatePortalSessionParams {
  stripeCustomerId: string;
  returnUrl: string;
}

/**
 * Creates a Stripe Customer Portal session for subscription management.
 */
export async function createCustomerPortalSession(
  params: CreatePortalSessionParams
): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });
  return session.url;
}

/**
 * Verifies and constructs a Stripe webhook event from the raw body and signature.
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export { Stripe };
