import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const instanceName = payload.instanceName;
    const phoneNumber = payload.phoneNumber; // Formato internacional, ex: 5511999999999

    if (!instanceName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltando parâmetros' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

    // Rota da Evolution API para gerar Código de Pareamento por telefone
    const res = await fetch(`${evoUrl}/instance/connect/phone/${instanceName}?number=${cleanPhone}`, {
      method: 'GET',
      headers: {
        'apikey': evoKey,
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Erro ao gerar código de pareamento: ' + err }, { status: res.status });
    }

    const data = await res.json();
    const code = data.code;

    if (!code) {
      return NextResponse.json({ error: 'Código não retornado pela Evolution. Certifique-se de que a instância não está conectada.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, pairingCode: code }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no gerar-pairing-code:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
