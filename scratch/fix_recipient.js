const fs = require('fs');

async function fixRecipient() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  // Buscar workflow atualizado direto do n8n
  const getRes = await fetch(apiUrl, { headers: { 'X-N8N-API-KEY': apiKey } });
  const wf = await getRes.json();

  const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
  if (!targetNode) throw new Error('Nó não encontrado!');

  // Garantir URL correta
  targetNode.parameters.url = 'https://api-whatsapp.atendimentoiaclinicas.tech/message/sendText/NumeroDeTestes';

  // Atualizar número destinatário para o número pessoal do Aloizio (ESTÁTICO)
  const numberParam = targetNode.parameters.bodyParameters?.parameters?.find(p => p.name === 'number');
  if (numberParam) {
    numberParam.value = '5581979066573'; // Número pessoal do Aloizio
    console.log('✅ Número destinatário configurado para: 5581979066573');
  }

  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: {} };
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
    body: JSON.stringify(payload)
  });

  console.log('Status PUT:', putRes.status);
  if (putRes.ok) {
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    console.log('✅ n8n atualizado e reativado!');
  } else {
    console.error('Erro:', await putRes.text());
  }
}

fixRecipient().catch(console.error);
