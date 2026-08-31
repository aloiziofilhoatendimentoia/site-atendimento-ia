import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendWelcomeEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-06-24.dahlia', 
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado.');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Erro na assinatura do webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manipular os eventos da Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      const customerEmail = session.customer_details?.email;
      const customerName = session.customer_details?.name || 'Cliente';

      if (customerEmail) {
        console.log(`Disparando e-mail de boas-vindas para: ${customerEmail}`);
        try {
          await sendWelcomeEmail(customerEmail, customerName);
          console.log('E-mail enviado com sucesso via Webhook.');
        } catch (emailError) {
          console.error('Falha ao enviar e-mail no Webhook:', emailError);
          // Mesmo se falhar o e-mail, respondemos 200 para a Stripe nao ficar retentando eternamente
        }
      } else {
        console.log('Nenhum e-mail encontrado na sessao de checkout.');
      }
      break;
    
    // Outros eventos podem ser tratados aqui futuramente (ex: cancelamento)
    case 'customer.subscription.deleted':
      // const subscription = event.data.object;
      break;

    default:
      console.log(`Evento nao tratado ignorado: ${event.type}`);
  }

  // Resposta de sucesso para a Stripe (importante para avisar que recebemos o evento)
  return NextResponse.json({ received: true }, { status: 200 });
}
