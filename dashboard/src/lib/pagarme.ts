/**
 * Pagar.me API v5 – Link de Pagamento (checkout hospedado).
 * Autenticação: Basic com chave secreta (sk_test ou sk_live).
 * @see https://docs.pagar.me/reference/criar-link
 * @see https://docs.pagar.me/docs/chaves-de-acesso
 */

const PAGARME_BASE_URL = process.env.PAGARME_BASE_URL ?? 'https://sdx-api.pagar.me/core/v5';
const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY;

export type PaymentLinkType = 'order' | 'subscription';

export interface CreatePaymentLinkItem {
  name: string;
  amount: number;
  default_quantity: number;
  description?: string;
}

export interface CreatePaymentLinkCustomer {
  name: string;
  email: string;
  code?: string;
  document?: string;
  document_type?: 'CPF' | 'CNPJ';
}

export interface CreatePaymentLinkParams {
  type: PaymentLinkType;
  name: string;
  order_code: string;
  payment_settings: {
    accepted_payment_methods: Array<'credit_card' | 'boleto' | 'pix'>;
  };
  cart_settings: {
    items: CreatePaymentLinkItem[];
  };
  customer_settings?: {
    customer?: CreatePaymentLinkCustomer;
    customer_id?: string;
  };
  /** subscription_settings obrigatório quando type === 'subscription' */
  subscription_settings?: {
    billing_cycle?: { interval: 'month' | 'year'; interval_count?: number };
    payment_methods?: Array<'credit_card' | 'boleto' | 'pix'>;
  };
}

export interface PagarmePaymentLinkResponse {
  id: string;
  checkout_url: string;
  order?: { id: string };
  subscription?: { id: string };
  [key: string]: unknown;
}

/**
 * Cria um link de pagamento na Pagar.me (checkout hospedado).
 * Usa chave secreta em variável de ambiente; nunca expor no client.
 */
export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PagarmePaymentLinkResponse> {
  const secretKey = PAGARME_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAGARME_SECRET_KEY is not set');
  }
  const auth = Buffer.from(`${secretKey}:`, 'utf8').toString('base64');
  const url = `${PAGARME_BASE_URL.replace(/\/$/, '')}/paymentlinks`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pagar.me API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<PagarmePaymentLinkResponse>;
}
