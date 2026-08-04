import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID não fornecido.' }, { status: 400 });
    }

    // 1. Notificar o N8N Webhook Principal (Atendimento IA - Cadastramento)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            event: 'payment_success',
            empresaId: empresaId,
            message: 'Novo cliente cadastrado com sucesso e pagamento confirmado pelo Stripe!'
          })
        });
      } catch (err) {
        console.error('Falha ao disparar Webhook de Cadastramento:', err);
      }
    }



    return NextResponse.json({ success: true, message: 'Provisionamento iniciado com sucesso.' });
  } catch (error: any) {
    console.error('Erro geral no provisionador:', error);
    return NextResponse.json({ error: 'Erro interno no provisionamento.' }, { status: 500 });
  }
}
