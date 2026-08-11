import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;

    if (!instanceName) {
      return NextResponse.json({ error: 'Faltando o parâmetro instanceName' }, { status: 400 });
    }

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

    // Passo 1: Deletar a instância se ela já existir para resetar o status 'connecting' ou 'qrcode'
    try {
      console.log(`[QR Code] Removendo instância existente ${instanceName} para reset de estado...`);
      await fetch(`${evoUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evoKey }
      });
    } catch (err) {
      console.log('[QR Code] Erro ao deletar:', err);
    }

    // Passo 2: Criar a instância fresh com qrcode: true
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

    if (!createRes.ok) {
      const errTxt = await createRes.text();
      return NextResponse.json({ error: `Falha ao recriar instância para QR Code: ${errTxt}` }, { status: createRes.status });
    }

    const createData = await createRes.json();
    let base64 = '';
    if (createData.qrcode && createData.qrcode.base64) {
      base64 = createData.qrcode.base64;
    } else if (createData.base64) {
      base64 = createData.base64;
    }

    // Passo 3: Se não veio no create, tenta connect
    if (!base64) {
      const res = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evoKey,
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          base64 = data.base64;
        } else if (data.qrcode && data.qrcode.base64) {
          base64 = data.qrcode.base64;
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
