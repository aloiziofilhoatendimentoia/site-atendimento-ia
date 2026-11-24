import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;
    const phoneNumber = payload.phoneNumber; // Formato internacional, ex: 5511999999999
    const customWebhook = payload.webhookUrl;

    if (!instanceName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltando parâmetros' }, { status: 400 });
    }

    let cleanPhone = phoneNumber.replace(/\D/g, '');
    // Se o número digitado for brasileiro (10 ou 11 dígitos com DDD) mas sem o DDI (55), adiciona automaticamente
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone;
    }

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

    console.log(`[Pairing] Iniciando fluxo de pareamento para a instância ${instanceName} e número ${cleanPhone}`);

    // Passo 1: Deletar a instância se ela já existir para resetar o status 'connecting' ou 'qrcode'
    try {
      console.log(`[Pairing] Removendo instância existente ${instanceName} para reset de estado...`);
      await fetch(`${evoUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evoKey }
      });
      // Aguardar 800ms para a Evolution API purgar a sessão antiga no container
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.log('[Pairing] Erro ou instância não existia ao deletar:', err);
    }

    // Passo 2: Criar a instância OBRIGATORIAMENTE com qrcode: false
    console.log(`[Pairing] Criando nova instância ${instanceName} com qrcode: false...`);
    let createRes = await fetch(`${evoUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoKey
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: false,
        integration: "WHATSAPP-BAILEYS"
      })
    });

    // Se houve conflito 403 (already in use), força novo delete, aguarda 1.2s e tenta novamente
    if (!createRes.ok) {
      const errTxt = await createRes.text();
      console.log(`[Pairing] Aviso ao criar instância (tentativa 1): ${errTxt}`);
      
      if (createRes.status === 403 || errTxt.includes('already in use')) {
        console.log(`[Pairing] Tentando remoção forçada e segundo retentativa...`);
        try {
          await fetch(`${evoUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': evoKey }
          });
        } catch (e) {}
        await new Promise(r => setTimeout(r, 1200));

        createRes = await fetch(`${evoUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evoKey
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: false,
            integration: "WHATSAPP-BAILEYS"
          })
        });
      }
    }

    // Passo 2.5: Configurar Settings (recusar ligações sem duplicar mensagem) e Webhook Definitivo (com evento CALL)
    try {
      await fetch(`${evoUrl}/settings/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evoKey
        },
        body: JSON.stringify({
          rejectCall: true,
          msgCall: '',
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false
        })
      });

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
            events: ['MESSAGES_UPSERT', 'CALL']
          }
        })
      });
      console.log(`[Pairing] Settings (rejectCall) e Webhook (MESSAGES_UPSERT, CALL) configurados com sucesso para a instância ${instanceName}.`);
    } catch (err) {
      console.log(`[Pairing] Falha silenciosa ao configurar settings/webhook:`, err);
    }

    // Passo 3: Aguardar estabilização do socket Baileys e solicitar o código de pareamento via GET (com retry automático)
    await new Promise(r => setTimeout(r, 800));
    console.log(`[Pairing] Solicitando código de pareamento para ${instanceName}?number=${cleanPhone}`);

    let code: any = null;
    let lastError = 'Erro ao gerar pareamento.';
    let lastStatus = 400;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(`${evoUrl}/instance/connect/${instanceName}?number=${cleanPhone}`, {
        method: 'GET',
        headers: {
          apikey: evoKey,
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        lastStatus = res.status;
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          lastError = errJson.message || errJson.error || lastError;
        } catch (e) {}
      } else {
        const data = await res.json();
        console.log(`[Pairing] Resposta da Evolution API (tentativa ${attempt}):`, data);
        const candidate = data.pairingCode || data.code || data.pairing_code || (data.qrcode && data.qrcode.pairingCode);
        if (candidate && typeof candidate === 'string' && !candidate.includes('@')) {
          code = candidate;
          break;
        }
      }

      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    if (!code) {
      return NextResponse.json({
        error: lastError !== 'Erro ao gerar pareamento.'
          ? lastError
          : 'A Evolution API não retornou o código de pareamento de 8 dígitos. Verifique se o número está correto (55 + DDD + número) e tente novamente.'
      }, { status: lastStatus });
    }

    return NextResponse.json({ success: true, pairingCode: code }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no gerar-pairing-code:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
