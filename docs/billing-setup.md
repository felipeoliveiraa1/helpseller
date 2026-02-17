# Configuração do Billing (Pagar.me)

## 1. Banco de dados

Rode a migration das tabelas de billing no Supabase (se ainda não rodou):

- Arquivo: `backend/supabase/migrations/004_billing_tables.sql`
- No Supabase: SQL Editor → colar o conteúdo do arquivo e executar, ou usar `supabase db push` se estiver usando CLI.

O SQL cria: `billing_customers`, `billing_plans`, `billing_orders`, `billing_subscriptions`, `billing_payments`, `billing_webhook_events`.

## 2. Chaves de acesso Pagar.me

Obtenha as chaves no dashboard Pagar.me (modo **Teste** para desenvolvimento):

- [Chaves de acesso (documentação)](https://docs.pagar.me/docs/chaves-de-acesso)
- **Chave Secreta** (sk_test_...): usada nas API Routes do Next.js para criar links de pagamento.
- **Chave Pública** (pk_test_...): uso opcional (ex.: encriptação no client).
- **ID da Conta** (acc_...): uso opcional conforme necessidade.

## 3. Variáveis de ambiente (dashboard)

No **dashboard**, crie ou edite o arquivo `.env.local` e preencha:

```bash
# Pagar.me (teste) — cole sua chave secreta (sk_test_...) no .env.local
PAGARME_SECRET_KEY=<cole_sua_chave_aqui>
PAGARME_BASE_URL=https://sdx-api.pagar.me/core/v5

# Opcional: validar assinatura do webhook
PAGARME_WEBHOOK_SECRET=

# Necessário para o webhook (gravar eventos e atualizar orders sem usuário logado)
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Copie em: Supabase → Settings → API → service_role (secret)
```

- **PAGARME_SECRET_KEY**: obrigatório para `POST /api/billing/checkout`.
- **PAGARME_BASE_URL**: em teste use `https://sdx-api.pagar.me/core/v5`; em produção `https://api.pagar.me/core/v5`.
- **SUPABASE_SERVICE_ROLE_KEY**: obrigatório para `POST /api/webhooks/pagarme` conseguir escrever em `billing_webhook_events` e `billing_orders`.

## 4. Webhook no dashboard Pagar.me

1. No dashboard Pagar.me, configure a URL do webhook para apontar para a sua app Next.js, por exemplo:
   - Desenvolvimento (com tunnel): `https://seu-tunnel.ngrok.io/api/webhooks/pagarme`
   - Produção: `https://seu-dominio.com/api/webhooks/pagarme`
2. Eventos sugeridos: `order.paid`, `order.payment_failed`, `order.canceled`, `charge.paid`, `charge.refunded`.

## 5. Rotas implementadas

| Método | Rota | Uso |
|--------|------|-----|
| POST | `/api/billing/checkout` | Body: `{ type?, name?, amountCents, currency?, planId? }`. Retorna `{ checkoutUrl, orderId }`. |
| GET | `/api/billing/status?orderId=...` ou `?subscriptionId=...` | Retorna status da order/subscription no nosso DB. |
| POST | `/api/webhooks/pagarme` | Público; recebe eventos da Pagar.me, deduplica e atualiza `billing_orders`. |

Detalhes do fluxo e da modelagem estão em `docs/pagarme-checkout-integration-plan.md`.
