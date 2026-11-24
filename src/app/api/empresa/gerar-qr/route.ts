import { NextResponse } from 'next/server';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;
    const customWebhook = payload.webhookUrl;
    const forceReset = Boolean(payload.forceReset);

    if (!instanceName) {
      return NextResponse.json({ error: 'Faltando o parâmetro instanceName' }, { status: 400 });
    }

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';
    const webhookUrl = customWebhook || process.env.N8N_WEBHOOK_URL_MESSAGES || 'https://n8n.atendimentoiaclinicas.tech/webhook/demonstracao-webhook';

    let base64 = '';
    let needsCleanRecreate = forceReset;

    // Passo 0: Inspecionar estado real da instância na Evolution API
    // Se já estiver conectada ('open'), nunca derruba!
    // Se estiver desconectada com erro 401/device_removed ou estado 'close' (sessão zumbi), força recriação limpa!
    try {
      const listRes = await fetch(`${evoUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { apikey: evoKey },
        cache: 'no-store'
      });
      if (listRes.ok) {
        const instances = await listRes.json();
        if (Array.isArray(instances)) {
          const existing = instances.find((i: any) => i.name === instanceName);
          if (!existing) {
            needsCleanRecreate = true;
          } else {
            const st = String(existing.connectionStatus || '').toLowerCase();
            if (st === 'open' || st === 'connected') {
              return NextResponse.json(
                { success: true, alreadyConnected: true, state: 'open' },
                { status: 200 }
              );
            }
            // Sessão zumbi após 401/device_removed ou status close precisa ser deletada e recriada limpa
            if (st === 'close' || existing.disconnectionReasonCode !== null) {
              console.log(
                `[QR Code] Instância ${instanceName} em estado sujo (status=${st}, reason=${existing.disconnectionReasonCode}). Executando reset limpo...`
              );
              needsCleanRecreate = true;
            }
          }
        }
      }
    } catch (errCheck) {
      console.log('[QR Code] Aviso ao checar fetchInstances:', errCheck);
    }

    // Passo 1: Se NÃO precisa recriar, tenta renovar o QR Code via connect diretamente
    if (!needsCleanRecreate) {
      try {
        const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: { apikey: evoKey },
          cache: 'no-store'
        });
        if (connectRes.ok) {
          const connectData = await connectRes.json();
          const b64 = connectData.base64 || (connectData.qrcode && connectData.qrcode.base64) || '';
          // Se count for muito alto (> 10) ou não vier base64 (ex: criada com qrcode:false no pairing), força recriação limpa
          if (b64 && (!connectData.count || Number(connectData.count) <= 10)) {
            base64 = b64;
          } else {
            needsCleanRecreate = true;
          }
        } else {
          needsCleanRecreate = true;
        }
      } catch (errConnect) {
        console.log('[QR Code] Falha no connect inicial, tentando recriação limpa:', errConnect);
        needsCleanRecreate = true;
      }
    }

    // Passo 2: Reset limpo (DELETE -> aguarda 900ms -> CREATE com qrcode: true + webhook + settings)
    if (needsCleanRecreate || !base64) {
      try {
        await fetch(`${evoUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: { apikey: evoKey }
        });
        await sleep(900);
      } catch (errDel) {
        console.log('[QR Code] Aviso ao deletar instância antiga:', errDel);
      }

      console.log(`[QR Code] Criando instância limpa ${instanceName} com qrcode: true...`);
      const createRes = await fetch(`${evoUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evoKey
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          rejectCall: true,
          msgCall: '',
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false,
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT', 'CALL']
          }
        })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        base64 = (createData.qrcode && createData.qrcode.base64) || createData.base64 || '';
      }

      // Se o create não devolveu o base64 de imediato, aguarda 1s e chama connect (até 2 tentativas)
      if (!base64) {
        for (let attempt = 0; attempt < 2 && !base64; attempt++) {
          await sleep(1000);
          try {
            const retryConnect = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
              method: 'GET',
              headers: { apikey: evoKey },
              cache: 'no-store'
            });
            if (retryConnect.ok) {
              const rData = await retryConnect.json();
              base64 = rData.base64 || (rData.qrcode && rData.qrcode.base64) || '';
            }
          } catch (e) {}
        }
      }
    }

    // Passo 3: Garantir settings e webhook ativos na instância
    try {
      await fetch(`${evoUrl}/settings/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evoKey
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

      await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evoKey
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
    } catch (err) {
      console.log('[QR Code] Falha silenciosa ao aplicar settings/webhook:', err);
    }

    if (!base64) {
      return NextResponse.json(
        { error: 'Não foi possível gerar um novo QR Code agora. Tente clicar em "Gerar novo QR Code" novamente.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, evolutionQrCode: base64 }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no gerar-qr:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
