/**
 * Creates Stripe products for extra hours packages.
 * Run from dashboard/: npx tsx scripts/create-stripe-extra-hours.ts
 */
import Stripe from 'stripe'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.+)$/)
  if (match) envVars[match[1]] = match[2].trim()
}

const STRIPE_SECRET_KEY = envVars.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in .env.local')
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

  const product = await stripe.products.create({
    name: 'Horas Extras - HelpSeller',
    description: 'Pacote de horas extras para chamadas de coaching. Mínimo 5 horas.',
    metadata: { type: 'extra_hours' },
  })
  console.log(`Product created: ${product.id} - ${product.name}`)

  for (const { plan, unitAmountCents, label } of PRICES) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'brl',
      unit_amount: unitAmountCents,
      metadata: { plan, type: 'extra_hours' },
      nickname: label,
    })
    console.log(`  Price created: ${price.id} - ${label}`)
  }

  console.log('\nDone! Products created in Stripe.')
}

main().catch(console.error)
