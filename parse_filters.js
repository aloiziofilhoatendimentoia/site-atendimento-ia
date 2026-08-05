const fs = require('fs');

async function run() {
  const n8nApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  const n8nBaseUrl = 'https://n8n.atendimentoiaclinicas.tech/api/v1';
  const workflowId = '8P6rcD7M9QvYG7jg';

  try {
    const res = await fetch(`${n8nBaseUrl}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey
      }
    });
    if (res.ok) {
      const wf = await res.json();
      const filtro = wf.nodes.find(n => n.name === 'Filtro');
      const if1 = wf.nodes.find(n => n.name === 'If1');

      console.log('--- FILTRO NODE ---');
      console.log(JSON.stringify(filtro?.parameters, null, 2));

      console.log('--- IF1 NODE ---');
      console.log(JSON.stringify(if1?.parameters, null, 2));
    } else {
      console.error('Erro ao buscar:', res.status);
    }
  } catch (err) {
    console.error('Falha:', err);
  }
}
run();
