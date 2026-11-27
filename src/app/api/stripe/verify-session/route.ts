import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id não informado.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe não configurada.' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === 'paid' || session.status === 'complete';
    const email = session.customer_details?.email || session.customer_email || session.metadata?.customer_email || '';

    return NextResponse.json(
      {
        paid,
        status: session.status,
        paymentStatus: session.payment_status,
        email,
        metodo: session.metadata?.origin_method || (session.mode === 'subscription' ? 'cartao' : 'pix')
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Stripe verify-session] Erro:', err?.message || err);
    return NextResponse.json({ error: 'Não foi possível validar a sessão de pagamento.' }, { status: 400 });
  }
}
