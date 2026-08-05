const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

async function removeDuplicateSupabaseNode() {
  const res = await fetch('https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/8P6rcD7M9QvYG7jg', {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  if (!res.ok) return;
  const wf = await res.json();
  
  // Remover nó Salvar Cliente Site Supabase de nodes
  wf.nodes = wf.nodes.filter(n => n.name !== 'Salvar Cliente Site Supabase');
  
  // Limpar conexões do Webhook Config Site
  if (wf.connections['Webhook Config Site'] && wf.connections['Webhook Config Site'].main) {
    wf.connections['Webhook Config Site'].main[0] = wf.connections['Webhook Config Site'].main[0].filter(c => c.node !== 'Salvar Cliente Site Supabase');
  }

  const updateRes = await fetch('https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/8P6rcD7M9QvYG7jg', {
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

  console.log('Removed duplicate node from n8n status:', updateRes.status);
}

removeDuplicateSupabaseNode().catch(console.error);
