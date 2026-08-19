import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance');

    if (!instanceName) {
      return NextResponse.json({ error: 'Faltando o parâmetro instanceName' }, { status: 400 });
    }

    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

    const clean = instanceName.replace(/\D/g, '');
    const variants = [instanceName];
    if (clean) {
      if (!variants.includes(clean)) variants.push(clean);
      const with55 = clean.startsWith('55') ? clean : '55' + clean;
      const without55 = clean.startsWith('55') ? clean.slice(2) : clean;
      if (!variants.includes(with55)) variants.push(with55);
      if (!variants.includes(without55)) variants.push(without55);
    }

    let isConnected = false;
    let finalState = 'offline';

    // 1. Tentar consultar estado diretamente por cada variante de nome de instância
    for (const v of variants) {
      try {
        const res = await fetch(`${evoUrl}/instance/connectionState/${v}`, {
          method: 'GET',
          headers: { 'apikey': evoKey },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data?.instance?.state || data?.state || data?.status || '';
          const s = String(raw).toLowerCase();
          if (s === 'open' || s === 'connected') {
            isConnected = true;
            finalState = 'open';
            break;
          } else if (s) {
            finalState = s;
          }
        }
      } catch (err) {
        // continua para próxima variante
      }
    }

    // 2. Fallback: Buscar na lista de todas as instâncias da Evolution API se ainda não confirmou 'open'
    if (!isConnected) {
      try {
        const listRes = await fetch(`${evoUrl}/instance/fetchInstances`, {
          headers: { 'apikey': evoKey },
          cache: 'no-store'
        });
        if (listRes.ok) {
          const instances = await listRes.json();
          if (Array.isArray(instances)) {
            const match = instances.find((inst: any) => {
              const instName = String(inst.name || '').replace(/\D/g, '');
              const owner = String(inst.ownerJid || '').replace(/\D/g, '');
              return variants.some(v => {
                const vClean = v.replace(/\D/g, '');
                return (vClean && (instName === vClean || owner === vClean || owner.endsWith(vClean) || vClean.endsWith(owner))) || inst.name === v;
              });
            });

            if (match) {
              const status = String(match.connectionStatus || match.state || '').toLowerCase();
              if (status === 'open' || status === 'connected') {
                isConnected = true;
                finalState = 'open';
              } else if (status) {
                finalState = status;
              }
            }
          }
        }
      } catch (errList) {
        console.error('Erro fallback fetchInstances:', errList);
      }
    }

    return NextResponse.json({ 
      state: isConnected ? 'open' : (finalState === 'open' ? 'open' : 'offline'), 
      rawState: finalState,
      isConnected 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no status-conexao:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
