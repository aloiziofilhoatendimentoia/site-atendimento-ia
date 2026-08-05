const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

async function updateNotificationNodes() {
  const res = await fetch('https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/8P6rcD7M9QvYG7jg', {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  if (!res.ok) return;
  const wf = await res.json();

  // Lista de nós para ajustar os números de envio dinâmicos
  const nodesToUpdate = [
    { name: 'Notificar_Humano', paramName: 'whatsapp_humano' },
    { name: 'Notificar_Humano_Agenda', paramName: 'whatsapp_agendamento' },
    { name: 'Notificar_Humano_Cancelar', paramName: 'whatsapp_agendamento' },
    { name: 'Notificar_Humano_Reagendar', paramName: 'whatsapp_agendamento' }
  ];

  for (const item of nodesToUpdate) {
    const node = wf.nodes.find(n => n.name === item.name);
    if (node && node.parameters) {
      // Se for nó de HTTP Request da Evolution API
      if (node.parameters.bodyParameters && node.parameters.bodyParameters.parameters) {
        const numParam = node.parameters.bodyParameters.parameters.find(p => p.name === 'number');
        if (numParam) {
          numParam.value = `={{ $('Encontrar Cliente Site').first()?.json?.${item.paramName} || $('Encontrar Cliente Site').first()?.json?.whatsapp_humano || $json.${item.paramName} }}`;
        }
      }
    }
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

  console.log('Updated 4 notification nodes status:', updateRes.status);
}

updateNotificationNodes().catch(console.error);
