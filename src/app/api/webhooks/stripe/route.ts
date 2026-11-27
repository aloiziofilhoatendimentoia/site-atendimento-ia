import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendWelcomeEmail } from '@/lib/email';
import {
  activateOrResurrectClinic,
  markWelcomeEmailSent,
  suspendClinicFromStripe,
  recoverClinicFromStripe
} from '@/lib/clinic-lifecycle';

export const dynamic = 'force-dynamic';

function extractId(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && typeof val.id === 'string') return val.id;
  return undefined;
}

function extractInvoiceSubscriptionId(invoice: any): string | undefined {
  return (
    extractId(invoice?.subscription) ||
    extractId(invoice?.parent?.subscription_details?.subscription) ||
    extractId(invoice?.lines?.data?.[0]?.subscription)
  );
}

async function resolveCustomerEmail(stripe: Stripe, rawEmail?: string | null, customerId?: string): Promise<string | undefined> {
  if (rawEmail && rawEmail.includes('@')) return rawEmail.trim().toLowerCase();
  if (!customerId) return undefined;
  try {
    const cus = await stripe.customers.retrieve(customerId);
    if (cus && !('deleted' in cus && cus.deleted) && cus.email) {
      return cus.email.trim().toLowerCase();
    }
  } catch (e) {
    console.warn('[Stripe Webhook] Falha ao consultar e-mail do customer:', e);
  }
  return undefined;
}

/**
 * Para clientes que pagaram a Taxa de Adesão via PIX (mode: 'payment'), agenda automaticamente
 * a assinatura mensal de R$ 397,00/mês na Stripe com 30 dias de carência via envio de fatura (send_invoice).
 * Assim, clientes PIX também entram 100% na régua automática de faturamento e inadimplência da Stripe!
 */
async function ensureMonthlyInvoiceSubscriptionForPix(
  stripe: Stripe,
  customerId: string,
  email: string
): Promise<string | undefined> {
  try {
    // Evitar duplicar assinatura caso já exista uma ativa/trialing para este cliente
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5
    });
    const activeSub = existingSubs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
    if (activeSub) return activeSub.id;

    // Localizar ou criar produto padrão da Manutenção Mensal
    const products = await stripe.products.list({ limit: 50, active: true });
    let monthlyProduct = products.data.find(p => p.metadata?.atendimento_ia_plan === 'mensal_397');
    if (!monthlyProduct) {
      monthlyProduct = await stripe.products.create({
        name: 'Manutenção Mensal — Atendimento IA Clínicas',
        description: 'Secretária Virtual IA 24/7 no WhatsApp + Google Agenda + Lembretes 24h',
        metadata: { atendimento_ia_plan: 'mensal_397' }
      });
    }

    const prices = await stripe.prices.list({ product: monthlyProduct.id, active: true, limit: 10 });
    let monthlyPrice = prices.data.find(
      p => p.currency === 'brl' && p.unit_amount === 39700 && p.recurring?.interval === 'month'
    );
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: monthlyProduct.id,
        currency: 'brl',
        unit_amount: 39700,
        recurring: { interval: 'month' }
      });
    }

    const createdSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: monthlyPrice.id }],
      collection_method: 'send_invoice',
      days_until_due: 5,
      trial_period_days: 30,
      metadata: {
        origin_method: 'pix',
        customer_email: email
      }
    });

    console.log(`[Stripe Webhook] Assinatura mensal via fatura criada para cliente PIX (${email}): ${createdSub.id}`);
    return createdSub.id;
  } catch (err: any) {
    console.warn('[Stripe Webhook] Aviso ao agendar assinatura mensal para cliente PIX:', err?.message || err);
    return undefined;
  }
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY não configurada.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado no servidor.');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Erro na assinatura do webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type} (id=${event.id})`);

  try {
    switch (event.type) {
      // =========================================================================
      // CENÁRIO 1 & 4: COMPRA APROVADA (CARTÃO OU PIX) + RESSURREIÇÃO DE CONTA
      // =========================================================================
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Se for PIX gerado mas ainda pendente de pagamento real, aguardar o evento async_payment_succeeded
        if (event.type === 'checkout.session.completed' && session.payment_status === 'unpaid') {
          console.log(`[Stripe Webhook] Sessão ${session.id} aguardando liquidação real do PIX (payment_status=unpaid).`);
          break;
        }

        const customerId = extractId(session.customer);
        let subscriptionId = extractId(session.subscription);
        const customerEmail = await resolveCustomerEmail(
          stripe,
          session.customer_details?.email || session.customer_email || session.metadata?.customer_email,
          customerId
        );
        const customerName = session.customer_details?.name || 'Cliente';
        const paymentMethod: 'card' | 'pix' =
          session.metadata?.origin_method === 'pix' ||
          (Array.isArray(session.payment_method_types) && session.payment_method_types.includes('pix') && session.mode === 'payment')
            ? 'pix'
            : 'card';

        if (!customerEmail) {
          console.warn(`[Stripe Webhook] Sessão ${session.id} sem e-mail de cliente identificável.`);
          break;
        }

        // Se entrou pelo PIX, agendar automaticamente a assinatura mensal (R$ 397/mês a partir do 30º dia)
        if (paymentMethod === 'pix' && customerId && !subscriptionId) {
          subscriptionId = await ensureMonthlyInvoiceSubscriptionForPix(stripe, customerId, customerEmail);
        }

        // Ativar ou Ressuscitar clínica no Supabase + garantir usuário OTP
        const lifecycle = await activateOrResurrectClinic({
          email: customerEmail,
          customerName,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          paymentMethod,
          sessionId: session.id,
          termsAcceptedAt: session.metadata?.terms_accepted_at || new Date().toISOString()
        });

        // Disparar E-mail de Boas-Vindas + PDF Termos de Uso (garantido tanto no Cartão quanto no PIX, sem duplicar)
        if (lifecycle.shouldSendWelcomeEmail) {
          try {
            const mailRes = await sendWelcomeEmail(customerEmail, customerName, paymentMethod);
            if (mailRes.success) {
              await markWelcomeEmailSent(customerEmail, session.id);
            }
          } catch (emailError) {
            console.error('[Stripe Webhook] Falha ao enviar e-mail de boas-vindas:', emailError);
            // Não falhamos o HTTP 200 para evitar retries infinitos na Stripe
          }
        } else {
          console.log(`[Stripe Webhook] E-mail de boas-vindas já enviado anteriormente para sessão ${session.id}.`);
        }

        break;
      }

      // =========================================================================
      // CENÁRIO 2A: INADIMPLÊNCIA (FALHA NO PAGAMENTO DA FATURA MENSAL)
      // =========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = extractId(invoice.customer);
        const subscriptionId = extractInvoiceSubscriptionId(invoice);
        const customerEmail = await resolveCustomerEmail(stripe, invoice.customer_email, customerId);

        await suspendClinicFromStripe({
          email: customerEmail,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeStatus: 'past_due',
          reason: 'inadimplencia_stripe'
        });
        break;
      }

      // =========================================================================
      // CENÁRIO 2B: CANCELAMENTO DA ASSINATURA NA STRIPE
      // =========================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractId(subscription.customer);
        const customerEmail = await resolveCustomerEmail(
          stripe,
          subscription.metadata?.customer_email,
          customerId
        );

        await suspendClinicFromStripe({
          email: customerEmail,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripeStatus: 'canceled',
          reason: 'cancelamento_stripe'
        });
        break;
      }

      // =========================================================================
      // CENÁRIO 2C / 3B: ALTERAÇÃO DE STATUS DA ASSINATURA NA STRIPE
      // =========================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractId(subscription.customer);
        const customerEmail = await resolveCustomerEmail(
          stripe,
          subscription.metadata?.customer_email,
          customerId
        );

        if (subscription.status === 'past_due' || subscription.status === 'unpaid' || subscription.status === 'canceled') {
          await suspendClinicFromStripe({
            email: customerEmail,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripeStatus: subscription.status === 'canceled' ? 'canceled' : 'past_due',
            reason: `stripe_subscription_${subscription.status}`
          });
        } else if (subscription.status === 'active' || subscription.status === 'trialing') {
          await recoverClinicFromStripe({
            email: customerEmail,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id
          });
        }
        break;
      }

      // =========================================================================
      // CENÁRIO 3: RECUPERAÇÃO AUTOMÁTICA (FATURA ATRASADA QUITADA)
      // =========================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = extractId(invoice.customer);
        const subscriptionId = extractInvoiceSubscriptionId(invoice);
        const customerEmail = await resolveCustomerEmail(stripe, invoice.customer_email, customerId);

        await recoverClinicFromStripe({
          email: customerEmail,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId
        });
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
    }
  } catch (handlerErr: any) {
    console.error(`[Stripe Webhook] Erro ao processar evento ${event.type}:`, handlerErr);
    // Retornar 500 apenas em erro inesperado grave de banco para a Stripe retentar depois
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
