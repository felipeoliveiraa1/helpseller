/**
 * Script to create Stripe products for extra hours packages.
 * Run: npx tsx scripts/create-stripe-extra-hours.ts
 *
 * Creates one product "Horas Extras - HelpSeller" with 3 prices:
 * - STARTER: R$10/hora (mínimo 5h = R$50)
 * - PRO: R$9/hora (mínimo 5h = R$45)
 * - TEAM: R$8/hora (mínimo 5h = R$40)
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env from dashboard
dotenv.config({ path: resolve(__dirname, '../dashboard/.env.local') })

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in dashboard/.env.local')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

const PRICES = [
  { plan: 'STARTER', unitAmountCents: 1000, label: 'Starter - R$10/hora' },
  { plan: 'PRO', unitAmountCents: 900, label: 'Pro - R$9/hora' },
  { plan: 'TEAM', unitAmountCents: 800, label: 'Team - R$8/hora' },
]

async function main() {
  console.log('Creating Stripe product for extra hours...\n')

  // Create product
  const product = await stripe.products.create({
    name: 'Horas Extras - HelpSeller',
    description: 'Pacote de horas extras para chamadas de coaching. Mínimo 5 horas.',
    metadata: { type: 'extra_hours' },
  })
  console.log(`Product created: ${product.id} - ${product.name}`)

  // Create prices
  for (const { plan, unitAmountCents, label } of PRICES) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'brl',
      unit_amount: unitAmountCents,
      metadata: { plan, type: 'extra_hours' },
      nickname: label,
    })
    console.log(`  Price created: ${price.id} - ${label} (${unitAmountCents} centavos/hora)`)
  }

  console.log('\n--- COPIE ESTES IDs PARA O .env.local ---')
  console.log(`STRIPE_EXTRA_HOURS_PRODUCT_ID=${product.id}`)
  console.log('\nDone! Now add the product ID to your environment variables.')
}

main().catch(console.error)
