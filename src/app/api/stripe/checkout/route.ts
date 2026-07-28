import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10', // ou a versão atual suportada
});

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Chave do Stripe não encontrada.');
    }

    const body = await req.json();
    const { email, plano = 'mensal', empresaId } = body;

    // Se quisermos criar um preço dinâmico, podemos usar `price_data`
    // Valor: R$ 397,00 (mensalidade + implantação juntos ou só mensal)
    // Para simplificar a demonstração, cobraremos R$ 39700 centavos
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Taxa de Adesão - IA Clínicas',
              description: 'Implantação da Secretária Virtual IA. A manutenção de R$ 397/mês será cobrada posteriormente.',
            },
            unit_amount: 59900, // R$ 599,00
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Em prod poderia ser 'subscription'
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configurar?empresa_id=${empresaId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configurar`,
      metadata: {
        empresaId: String(empresaId),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Erro no Stripe Checkout:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
