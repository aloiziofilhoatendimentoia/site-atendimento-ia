import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

// Em produção, isso garante que a requisição venha realmente do Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } else {
      // Se não houver secret (dev sem ngrok), parse direto (NÃO RECOMENDADO EM PROD)
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Lidar com o evento do Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Pagamento aprovado para a sessão:', session.id);
      
      // Aqui nós iríamos atualizar o banco de dados (Prisma)
      // para marcar a Clinic como 'ONBOARDING' ou 'ACTIVE'
      // O onboarding será concluído no retorno do checkout pelo cliente.
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Renovação da assinatura paga:', invoice.id);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Assinatura cancelada:', subscription.id);
      // Aqui marcaríamos a clínica como suspensa
      break;

    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
