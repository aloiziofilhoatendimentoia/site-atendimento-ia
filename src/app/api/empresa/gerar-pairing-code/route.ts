import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;
    const phoneNumber = payload.phoneNumber; // Formato internacional, ex: 5511999999999

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

    console.log(`Solicitando código de pareamento para a instância ${instanceName} e número ${cleanPhone}`);

    // Rota oficial da Evolution API V2 para gerar Código de Pareamento por telefone: POST /instance/connect/{instanceName}
    let res = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoKey,
      },
      body: JSON.stringify({
        number: cleanPhone
      })
    });

    // Se a instância não existir (404), tenta criar e rodar novamente
    if (!res.ok && res.status === 404) {
      console.log(`Instância ${instanceName} não existe. Criando nova instância...`);
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
        // Tenta conectar via pairing code novamente (POST /instance/connect/{instanceName})
        res = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evoKey,
          },
          body: JSON.stringify({
            number: cleanPhone
          })
        });
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      let friendlyError = 'Erro ao gerar pareamento.';
      try {
        const errJson = JSON.parse(errText);
        friendlyError = errJson.message || errJson.error || friendlyError;
      } catch (e) {
        friendlyError = errText || friendlyError;
      }
      return NextResponse.json({ error: 'Erro ao gerar código de pareamento: ' + friendlyError }, { status: res.status });
    }

    const data = await res.json();
    // A Evolution API V2 retorna o código em { code: "ABCDEFGH" } ou { pairingCode: "ABCDEFGH" }
    const code = data.code || data.pairingCode;

    if (!code) {
      return NextResponse.json({ error: 'Código não retornado pela Evolution. Certifique-se de que a instância não está conectada.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, pairingCode: code }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no gerar-pairing-code:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
