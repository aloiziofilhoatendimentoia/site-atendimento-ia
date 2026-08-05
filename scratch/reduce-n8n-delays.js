const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

async function reduceDelays() {
  const workflowIds = ['8P6rcD7M9QvYG7jg', 'OLsd2Rtp3wQ3gHeB'];

  for (const id of workflowIds) {
    const res = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
      headers: { 'X-N8N-API-KEY': API_KEY }
    });
    if (!res.ok) continue;
    const wf = await res.json();

    let updated = false;
    for (const node of wf.nodes) {
      if (node.name === 'Wait Inteligente' && node.parameters) {
        node.parameters.amount = 1; // Reduzido de 2s para 1s (resposta 50% mais rápida)
        updated = true;
      }
    }

    if (updated) {
      const updateRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: { executionOrder: 'v1' }
        })
      });
      console.log(`Workflow ${id} (${wf.name}) delay reduced. Status: ${updateRes.status}`);
    }
  }
}

reduceDelays().catch(console.error);
