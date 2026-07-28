import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any, // Versão atualizada do Stripe
});

export async function POST(req: Request) {
  try {
    const { paymentMethod } = await req.json();
    
    const sessionPayload: Stripe.Checkout.SessionCreateParams = {
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
    };

    // O Stripe gerencia os métodos de pagamento ativos pelo seu Dashboard (cartão, pix, boleto).
    // Para forçar a exibição do Pix se ele estiver habilitado no seu painel:
    if (paymentMethod === "pix") {
      sessionPayload.payment_method_types = ['pix'];
      sessionPayload.mode = 'payment';
      sessionPayload.line_items = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Implantação + 1º Mês - Atendimento IA',
              description: 'Taxa de setup (R$ 599,00) + Primeiro mês de assinatura (R$ 397,00)',
            },
            unit_amount: 99600, // Total: R$ 996,00
          },
          quantity: 1,
        }
      ];
      sessionPayload.payment_method_options = {
        pix: {
          expires_after_seconds: 1800, // 30 minutos
        }
      };
    } else {
      // Cartão de Crédito clássico no modo assinatura recorrente
      sessionPayload.payment_method_types = ['card'];
      sessionPayload.mode = 'subscription';
      sessionPayload.line_items = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Plano Pro Médico - Mensalidade',
              description: 'Secretária Virtual Atendimento IA 24/7',
            },
            unit_amount: 39700, // R$ 397,00/mês
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Taxa de Adesão (Setup Único)',
              description: 'Treinamento, Instalação e Configuração da sua Secretária IA',
            },
            unit_amount: 59900, // R$ 599,00 pago uma vez
          },
          quantity: 1,
        },
      ];
      sessionPayload.subscription_data = {
        trial_period_days: 30,
      };
    }

    // Desativa o recurso 'Link' (autofill de 1-clique do Stripe) de forma correta nas configurações da sessão
    sessionPayload.payment_method_collection = 'always';

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
