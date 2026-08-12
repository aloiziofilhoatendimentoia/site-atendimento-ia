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

    console.log(`[Pairing] Iniciando fluxo de pareamento para a instância ${instanceName} e número ${cleanPhone}`);

    // Passo 1: Deletar a instância se ela já existir para resetar o status 'connecting' ou 'qrcode'
    try {
      console.log(`[Pairing] Removendo instância existente ${instanceName} para reset de estado...`);
      await fetch(`${evoUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evoKey }
      });
    } catch (err) {
      console.log('[Pairing] Erro ou instância não existia ao deletar:', err);
    }

    // Passo 2: Criar a instância OBRIGATORIAMENTE com qrcode: false
    // Se a instância for criada com qrcode: true, ela entra em loop de QR Code e rejeita o pairing code
    console.log(`[Pairing] Criando nova instância ${instanceName} com qrcode: false...`);
    const createRes = await fetch(`${evoUrl}/instance/create`, {
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

    if (!createRes.ok) {
      const errTxt = await createRes.text();
      console.log(`[Pairing] Aviso ao criar instância: ${errTxt}`);
      
      // Se a instância já existe (already in use), fazemos logout para soltar a sessão e tentamos conectar diretamente
      if (createRes.status === 403 || errTxt.includes('already in use')) {
        try {
          await fetch(`${evoUrl}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': evoKey }
          });
        } catch (e) {
          console.log('[Pairing] Logout prévio falhou, tentando conectar diretamente...');
        }
      } else {
        return NextResponse.json({ error: `Falha ao recriar instância para pareamento: ${errTxt}` }, { status: createRes.status });
      }
    }

    // Passo 3: Solicitar o código de pareamento via GET
    console.log(`[Pairing] Solicitando código de pareamento para ${instanceName}?number=${cleanPhone}`);
    const res = await fetch(`${evoUrl}/instance/connect/${instanceName}?number=${cleanPhone}`, {
      method: 'GET',
      headers: {
        'apikey': evoKey,
      }
    });

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
    console.log('[Pairing] Resposta da Evolution API:', data);

    const code = data.pairingCode || data.code;

    // Se o código contiver '@', é uma string de QR Code e não um pairing code de 8 dígitos
    if (!code || code.includes('@')) {
      return NextResponse.json({ 
        error: 'A Evolution API não conseguiu gerar o código de pareamento de 8 dígitos e retornou um QR Code. Certifique-se de que o número digitado está correto e ativo no WhatsApp.' 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, pairingCode: code }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no gerar-pairing-code:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
