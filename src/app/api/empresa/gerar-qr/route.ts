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

    // Para gerar um novo QR Code de uma instância que já existe (e não está conectada), 
    // bate-se na rota /instance/connect
    const res = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evoKey,
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Erro ao gerar QR Code: ' + err }, { status: res.status });
    }

    const data = await res.json();
    
    let base64 = '';
    // A V2 costuma retornar { base64: "...", code: "..." }
    if (data.base64) {
      base64 = data.base64;
    } else if (data.qrcode && data.qrcode.base64) {
      base64 = data.qrcode.base64;
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
