import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance');

    if (!instanceName) {
      return NextResponse.json({ error: 'Faltando o parâmetro instanceName' }, { status: 400 });
    }

    const evoUrl = process.env.EVOLUTION_API_URL || '';
    const evoKey = process.env.EVOLUTION_API_KEY || '';

    if (!evoUrl || !evoKey) {
      return NextResponse.json({ error: 'Chaves do servidor ausentes' }, { status: 500 });
    }

    // Consultando o status da conexão na Evolution API
    const res = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evoKey,
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao consultar a Evolution API' }, { status: res.status });
    }

    const data = await res.json();
    
    // A estrutura na V2 costuma retornar { instance: { state: "open" } }
    // Ou direto { state: "open" }
    const state = data?.instance?.state || data?.state || 'unknown';

    return NextResponse.json({ state }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no status-conexao:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
