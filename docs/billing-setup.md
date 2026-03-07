# Billing Setup (Stripe)

## 1. Database

Run the billing migration in Supabase (if not already done):

- File: `backend/supabase/migrations/008_billing_tables_stripe.sql`
- In Supabase: SQL Editor → paste file content and execute, or use `supabase db push` with the CLI.

Tables created: `billing_customers`, `billing_plans`, `billing_orders`, `billing_subscriptions`, `billing_payments`, `billing_webhook_events`.

## 2. Stripe API Keys

Get your keys from the Stripe Dashboard (use **Test mode** for development):

- [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
- **Secret Key** (`sk_test_...`): used in Next.js API Routes to create Checkout Sessions.
- **Publishable Key** (`pk_test_...`): optional, for client-side Stripe.js if needed.
- **Webhook Signing Secret** (`whsec_...`): used to verify webhook signatures.

## 3. Environment Variables (dashboard)

In the **dashboard**, create or edit `.env.local`:

```bash
# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for the webhook (write events and update orders without user auth)
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Copy from: Supabase → Settings → API → service_role (secret)
```

- **STRIPE_SECRET_KEY**: required for `POST /api/billing/checkout`.
- **STRIPE_WEBHOOK_SECRET**: required for `POST /api/webhooks/stripe` to verify event signatures.
- **SUPABASE_SERVICE_ROLE_KEY**: required for the webhook handler to write to `billing_webhook_events` and `billing_orders`.

## 4. Stripe Webhook Configuration

1. In the [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add a new endpoint:
   - Development (with tunnel): `https://your-tunnel.ngrok.io/api/webhooks/stripe`
   - Production: `https://your-domain.com/api/webhooks/stripe`
2. Events to subscribe:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

## 5. API Routes

| Method | Route | Usage |
|--------|-------|-------|
| POST | `/api/billing/checkout` | Body: `{ mode?, priceId?, name?, amountCents?, currency?, planId? }`. Returns `{ checkoutUrl, orderId }`. |
| GET | `/api/billing/status?orderId=...` or `?subscriptionId=...` | Returns order/subscription status from DB. |
| POST | `/api/webhooks/stripe` | Public; receives Stripe events, verifies signature, deduplicates, and updates `billing_orders`/`billing_subscriptions`. |

## 6. Stripe Customer Portal (optional)

For subscription management (cancel, update payment method), configure the [Customer Portal](https://dashboard.stripe.com/settings/billing/portal) in Stripe and use the `createCustomerPortalSession()` function from `dashboard/src/lib/stripe.ts`.

## 7. Creating Products and Prices

In the Stripe Dashboard, create Products and Prices:

1. Go to [Products](https://dashboard.stripe.com/products).
2. Create a product (e.g., "Pro Plan").
3. Add a price (e.g., R$99.00/month recurring, or R$990.00 one-time).
4. Copy the **Price ID** (`price_...`) and use it in the checkout request as `priceId`.

Alternatively, pass `amountCents` and `name` to create ad-hoc prices via `price_data`.
