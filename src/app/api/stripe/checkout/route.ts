import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getAppUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://atendimentoiaclinicas.tech').replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Chave secreta da Stripe não configurada no servidor.' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const metodo: 'cartao' | 'pix' = body.metodo === 'pix' ? 'pix' : 'cartao';
    const acceptedTerms = Boolean(body.acceptedTerms);
    const empresaId = body.empresaId ? String(body.empresaId) : '';

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Informe um e-mail válido para continuar.' }, { status: 400 });
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: 'Você precisa marcar "Li e concordo com os Termos de Uso" antes de prosseguir.' },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl(req);
    const termsUrl = `${appUrl}/Termos_de_Uso.pdf`;
    const acceptedAt = new Date().toISOString();

    const baseMetadata: Record<string, string> = {
      origin_method: metodo,
      customer_email: email,
      terms_accepted: 'true',
      terms_accepted_at: acceptedAt,
      ...(empresaId ? { empresaId } : {})
    };

    const buildSessionParams = (withNativeTosConsent: boolean): Stripe.Checkout.SessionCreateParams => {
      const common: Partial<Stripe.Checkout.SessionCreateParams> = {
        locale: 'pt-BR',
        customer_email: email,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        success_url: `${appUrl}/configurar?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
        cancel_url: `${appUrl}/pagamento?canceled=true`,
        metadata: baseMetadata,
        ...(withNativeTosConsent
          ? {
              consent_collection: {
                terms_of_service: 'required'
              },
              custom_text: {
                terms_of_service_acceptance: {
                  message: `Li e concordo com os [Termos de Uso e Adesão](${termsUrl}) da Atendimento IA Clínicas Tecnologia Ltda.`
                }
              }
            }
          : {
              custom_text: {
                submit: {
                  message: `Ao concluir o pagamento, você confirma que leu e concorda com os Termos de Uso disponíveis em ${termsUrl}.`
                }
              }
            })
      };

      if (metodo === 'pix') {
        return {
          ...common,
          mode: 'payment',
          customer_creation: 'always',
          payment_method_types: ['pix'],
          payment_method_options: {
            pix: {
              expires_after_seconds: 3600
            }
          },
          line_items: [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: 'Taxa de Adesão e Implantação — Atendimento IA Clínicas',
                  description:
                    'Implantação completa da Secretária Virtual IA 24/7 no WhatsApp + Google Agenda. A manutenção mensal de R$ 397,00/mês inicia somente após 30 dias.'
                },
                unit_amount: 59900 // R$ 599,00
              },
              quantity: 1
            }
          ]
        } as Stripe.Checkout.SessionCreateParams;
      }

      // Cartão de Crédito: cobra Taxa de Adesão R$ 599,00 hoje + Assinatura R$ 397,00/mês com 30 dias de carência
      return {
        ...common,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'Taxa de Adesão e Implantação — Atendimento IA Clínicas',
                description: 'Implantação completa da Secretária Virtual IA (cobrança única hoje).'
              },
              unit_amount: 59900 // R$ 599,00
            },
            quantity: 1
          },
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'Manutenção Mensal — Atendimento IA Clínicas',
                description: 'Atendimento 24/7 no WhatsApp + Google Agenda + Lembretes 24h (cobrada somente a partir do próximo mês).'
              },
              unit_amount: 39700, // R$ 397,00/mês
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1
          }
        ],
        subscription_data: {
          trial_period_days: 30,
          metadata: baseMetadata
        }
      } as Stripe.Checkout.SessionCreateParams;
    };

    let session: Stripe.Checkout.Session;
    try {
      // Tenta primeiro com o checkbox nativo "Li e concordo com os Termos de Uso" dentro da própria Stripe
      session = await stripe.checkout.sessions.create(buildSessionParams(true));
    } catch (firstErr: any) {
      const msg = String(firstErr?.message || '');
      // Se a URL de Termos de Serviço ainda não foi salva nos "Detalhes públicos" do painel Stripe,
      // usa fallback com custom_text sem quebrar o checkout!
      if (msg.toLowerCase().includes('terms of service') || msg.toLowerCase().includes('terms_of_service')) {
        console.warn('[Stripe Checkout] URL de Termos ainda não cadastrada no Dashboard Stripe; usando fallback custom_text.');
        session = await stripe.checkout.sessions.create(buildSessionParams(false));
      } else {
        throw firstErr;
      }
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, metodo }, { status: 200 });
  } catch (err: any) {
    console.error('Erro no Stripe Checkout:', err);
    const rawMsg = String(err?.message || 'Erro ao iniciar checkout na Stripe.');
    let friendlyMsg = rawMsg;
    if (rawMsg.toLowerCase().includes('pix')) {
      friendlyMsg =
        'O pagamento via PIX precisa estar habilitado na conta Stripe (Configurações > Formas de pagamento > PIX). Tente via Cartão ou ative o PIX no painel da Stripe.';
    }
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
