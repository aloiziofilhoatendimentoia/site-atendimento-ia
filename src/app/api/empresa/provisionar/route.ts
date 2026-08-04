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

    // 2. Enviar mensagem direta para o celular do dono via Z-API (Notificação de novo cadastro iniciado)
    try {
      await fetch("https://api.z-api.io/instances/3F59285D2F34B3BDBEDF8292A550B686/token/AF68A3D8D69F03D8AF3FE3E3/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "5581979066573", // Celular do dono
          message: `💰 *NOVO PAGAMENTO E CADASTRO INICIADO!*\n\nUma nova clínica realizou o pagamento e iniciou o cadastro no site.\n\n*ID da Empresa:* ${empresaId}\n\nAguardando configuração dos dados pelo cliente...`,
          delayTyping: 2
        })
      });
    } catch (zErr: any) {
      console.error("Falha ao notificar Z-API sobre pagamento:", zErr.message || zErr);
    }

    return NextResponse.json({ success: true, message: 'Provisionamento iniciado com sucesso.' });
  } catch (error: any) {
    console.error('Erro geral no provisionador:', error);
    return NextResponse.json({ error: 'Erro interno no provisionamento.' }, { status: 500 });
  }
}
