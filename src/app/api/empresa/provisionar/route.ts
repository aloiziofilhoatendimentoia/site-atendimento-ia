import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID não fornecido.' }, { status: 400 });
    }

    // 1. Notificar o N8N Webhook Principal (Atendimento IA - Cadastramento)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            event: 'payment_success',
            empresaId: empresaId,
            message: 'Novo cliente cadastrado com sucesso e pagamento confirmado pelo Stripe!'
          })
        });
      } catch (err) {
        console.error('Falha ao disparar Webhook de Cadastramento:', err);
      }
    }

    // 2. Duplicar o Workflow Demonstração na API do N8N
    const n8nApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
    const n8nBaseApiUrl = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows';
    const demoWorkflowId = 'OLsd2Rtp3wQ3gHeB'; // O ID do workflow Demonstração (extraído de logs anteriores)

    try {
      // Baixar o workflow original
      const resOriginal = await fetch(`${n8nBaseApiUrl}/${demoWorkflowId}`, {
        headers: { 'X-N8N-API-KEY': n8nApiKey }
      });
      
      if (resOriginal.ok) {
        const originalWorkflow = await resOriginal.json();
        
        // Criar cópia modificando o nome
        const novoWorkflowPayload = {
          name: `Cliente Produto - Clinica ${empresaId} (Clone)`,
          nodes: originalWorkflow.nodes,
          connections: originalWorkflow.connections,
          settings: originalWorkflow.settings,
          staticData: null,
          meta: originalWorkflow.meta,
          tags: originalWorkflow.tags
        };

        const resCreate = await fetch(n8nBaseApiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey 
          },
          body: JSON.stringify(novoWorkflowPayload)
        });

        if (!resCreate.ok) {
          console.error('Erro na N8N API ao duplicar:', await resCreate.text());
        }
      }
    } catch (err) {
      console.error('Erro de conexão ao tentar duplicar workflow no n8n:', err);
    }

    return NextResponse.json({ success: true, message: 'Provisionamento iniciado com sucesso.' });
  } catch (error: any) {
    console.error('Erro geral no provisionador:', error);
    return NextResponse.json({ error: 'Erro interno no provisionamento.' }, { status: 500 });
  }
}
