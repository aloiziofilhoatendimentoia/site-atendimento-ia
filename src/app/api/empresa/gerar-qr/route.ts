import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;
    const customWebhook = payload.webhookUrl;

    if (!instanceName) {
      return NextResponse.json({ error: 'Faltando o parâmetro instanceName' }, { status: 400 });
    }

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

    let base64 = '';

    // Passo 1: Verificar se a instância já existe e apenas renovar o QR Code via connect
    try {
      const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': evoKey }
      });
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        if (connectData.base64) {
          base64 = connectData.base64;
        } else if (connectData.qrcode && connectData.qrcode.base64) {
          base64 = connectData.qrcode.base64;
        }
      }
    } catch (errConnect) {
      console.log('[QR Code] Instância não existia ou falha no connect inicial:', errConnect);
    }

    // Passo 2: Se ainda não obteve QR Code (instância não existe ou precisa ser criada)
    if (!base64) {
      console.log(`[QR Code] Criando nova instância ${instanceName} com qrcode: true...`);
      const createRes = await fetch(`${evoUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evoKey
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData.qrcode && createData.qrcode.base64) {
          base64 = createData.qrcode.base64;
        } else if (createData.base64) {
          base64 = createData.base64;
        }

        // Configurar o Webhook Definitivo da Instância
        try {
          const webhookUrl = customWebhook || process.env.N8N_WEBHOOK_URL_MESSAGES || 'https://n8n.atendimentoiaclinicas.tech/webhook/demonstracao-webhook';
          await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evoKey
            },
            body: JSON.stringify({
              webhook: {
                enabled: true,
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: false,
                events: ['MESSAGES_UPSERT']
              }
            })
          });
          console.log(`[QR Code] Webhook configurado com sucesso para a instância ${instanceName}.`);
        } catch (err) {
          console.log(`[QR Code] Falha silenciosa ao configurar webhook:`, err);
        }
      } else {
        // Se a instância já existia e deu 403, tentar connect novamente
        const retryConnect = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evoKey }
        });
        if (retryConnect.ok) {
          const rData = await retryConnect.json();
          base64 = rData.base64 || (rData.qrcode && rData.qrcode.base64) || '';
        }
      }
    }

    if (!base64) {
      return NextResponse.json({ error: 'QR Code não retornado pela Evolution. A instância já pode estar conectada.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, evolutionQrCode: base64 }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no gerar-qr:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
