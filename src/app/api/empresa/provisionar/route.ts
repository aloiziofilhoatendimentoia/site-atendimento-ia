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

    // 2. Enviar mensagem direta para o celular do dono via Evolution API (Notificação de novo cadastro iniciado)
    try {
      const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
      const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';
      await fetch(`${evoUrl}/message/sendText/NumeroDeTestes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": evoKey
        },
        body: JSON.stringify({
          number: "5581979066573", // Celular do dono
          text: `💰 *NOVO PAGAMENTO E CADASTRO INICIADO!*\n\nUma nova clínica realizou o pagamento e iniciou o cadastro no site.\n\n*ID da Empresa:* ${empresaId}\n\nAguardando configuração dos dados pelo cliente...`
        })
      });
    } catch (evoErr: any) {
      console.error("Falha ao notificar Evolution API sobre pagamento:", evoErr.message || evoErr);
    }

    return NextResponse.json({ success: true, message: 'Provisionamento iniciado com sucesso.' });
  } catch (error: any) {
    console.error('Erro geral no provisionador:', error);
    return NextResponse.json({ error: 'Erro interno no provisionamento.' }, { status: 500 });
  }
}
