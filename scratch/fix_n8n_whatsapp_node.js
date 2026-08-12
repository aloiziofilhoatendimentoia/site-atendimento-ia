const fs = require('fs');

async function fixN8nNode() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  // Carregar workflow atual
  const rawJson = fs.readFileSync('scratch/active-wf-from-n8n.json', 'utf8');
  const wf = JSON.parse(rawJson);

  // Encontrar o nó Enviar Config WhatsApp
  const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
  if (!targetNode) throw new Error('Nó não encontrado!');

  // CORREÇÃO 1: URL deve usar NumeroDeTestes (instância do bot) - ESTÁTICO
  const oldUrl = targetNode.parameters.url;
  console.log('URL antiga:', oldUrl);
  targetNode.parameters.url = 'https://api-whatsapp.atendimentoiaclinicas.tech/message/sendText/NumeroDeTestes';
  console.log('URL nova:', targetNode.parameters.url);

  // CORREÇÃO 2: O número destinatário deve ser passado como OWNER_WHATSAPP (quem recebe notificações)
  // Vamos usar o número do webhook payload - $json.body.owner_whatsapp (a ser configurado)
  // Por ora, vamos usar um placeholder que o usuário precisa confirmar
  const numberParam = targetNode.parameters.bodyParameters?.parameters?.find(p => p.name === 'number');
  if (numberParam) {
    console.log('Número antigo:', numberParam.value);
    // SERÁ ATUALIZADO com o número real do Aloizio quando ele informar
    // Por ora colocamos como placeholder dinâmico caso venha no payload
    numberParam.value = '={{ $json.body.owner_whatsapp || "CONFIGURE_SEU_NUMERO" }}';
    console.log('Número novo (dinâmico):', numberParam.value);
  }

  // Enviar para o n8n
  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: {} };
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
    body: JSON.stringify(payload)
  });

  console.log('\nStatus PUT:', putRes.status);
  if (putRes.ok) {
    console.log('✅ Workflow atualizado com sucesso!');
    // Reativar
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    console.log('✅ Workflow reativado!');
  } else {
    const errText = await putRes.text();
    console.error('Erro:', errText.substring(0, 500));
  }
}

fixN8nNode().catch(console.error);
