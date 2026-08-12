const fs = require('fs');

async function updateActiveUrl() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  try {
    const rawJson = fs.readFileSync('scratch/active-wf-from-n8n.json', 'utf8');
    const wf = JSON.parse(rawJson);

    const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
    if (!targetNode) {
      throw new Error('Node Enviar Config WhatsApp não encontrado!');
    }

    // Atualizar a URL para usar a instância dinâmica baseada no whatsapp_ia da clínica
    const oldUrl = targetNode.parameters.url;
    console.log('Old URL:', oldUrl);

    // Nova URL dinâmica
    const newUrl = "={{ 'https://api-whatsapp.atendimentoiaclinicas.tech/message/sendText/' + $json.body.whatsapp_ia.replace(/\\D/g, '') }}";
    console.log('New URL:', newUrl);
    targetNode.parameters.url = newUrl;

    // Também atualizar o parâmetro message (text) que já modificamos na rodada anterior
    const textParam = targetNode.parameters.bodyParameters.parameters.find(p => p.name === 'text');
    if (textParam) {
      const oldText = textParam.value;
      if (!oldText.includes('event === \'alteracao_cadastro\'')) {
        textParam.value = "={{ ($json.body.event === 'alteracao_cadastro' ? '📋 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' : '📋 *NOVO CADASTRO DE CLÍNICA*') }}\n\n" + oldText.replace("=📋 *NOVO CADASTRO DE CLÍNICA*\n\n", "");
        console.log('Atualizado texto do nó!');
      }
    }

    const payload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: {}
    };

    console.log('Enviando PUT para o n8n...');
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
      body: JSON.stringify(payload)
    });

    console.log('Resultado PUT Status:', putRes.status);
    const putData = await putRes.json();
    console.log('Resultado PUT Data:', JSON.stringify(putData, null, 2));

    // Reiniciar workflow
    console.log('Reiniciando workflow...');
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });

    console.log('Workflow ativo 8P6rcD7M9QvYG7jg atualizado com URL dinâmica!');
  } catch (err) {
    console.error('Erro ao atualizar URL:', err);
  }
}

updateActiveUrl();
