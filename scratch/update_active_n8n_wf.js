const fs = require('fs');

async function updateActiveWf() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  try {
    const rawJson = fs.readFileSync('scratch/active-wf-from-n8n.json', 'utf8');
    const wf = JSON.parse(rawJson);

    const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
    if (!targetNode) {
      throw new Error('Node Enviar Config WhatsApp não encontrado no workflow ativo!');
    }

    const textParam = targetNode.parameters.bodyParameters.parameters.find(p => p.name === 'text');
    if (!textParam) {
      throw new Error('Parâmetro text não encontrado no node Enviar Config WhatsApp!');
    }

    const oldValue = textParam.value;
    console.log('Old Value:', oldValue);

    // Substituir "=📋 *NOVO CADASTRO DE CLÍNICA*\n\n" pelo cabeçalho dinâmico usando {{ }} do n8n
    const newValue = oldValue.replace(
      "=📋 *NOVO CADASTRO DE CLÍNICA*\n\n",
      "={{ ($json.body.event === 'alteracao_cadastro' ? '📋 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' : '📋 *NOVO CADASTRO DE CLÍNICA*') }}\n\n"
    );

    console.log('New Value:', newValue);
    textParam.value = newValue;

    // Passar a propriedade settings vazia para cumprir o requisito do n8n sem causar erros
    const payload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: {}
    };

    console.log('Enviando PUT para o n8n no workflow ativo com settings vazias...');
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
      body: JSON.stringify(payload)
    });

    console.log('Resultado PUT Status:', putRes.status);
    const putData = await putRes.json();
    console.log('Resultado PUT Data:', JSON.stringify(putData, null, 2));

    // Forçar desativação e ativação (Restart do trigger)
    console.log('Reiniciando workflow ativo...');
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });

    console.log('Workflow ativo 8P6rcD7M9QvYG7jg atualizado e reiniciado com sucesso!');
  } catch (err) {
    console.error('Erro ao atualizar workflow ativo:', err);
  }
}

updateActiveWf();
