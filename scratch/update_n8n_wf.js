const fs = require('fs');

async function updateWf() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  const workflowId = 'UOGMjLYN0yH1HlxU';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  try {
    const rawJson = fs.readFileSync('scratch/config-wf-from-n8n.json', 'utf8');
    const wf = JSON.parse(rawJson);

    const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
    if (!targetNode) {
      throw new Error('Node Enviar Config WhatsApp não encontrado!');
    }

    const messageParam = targetNode.parameters.bodyParameters.parameters.find(p => p.name === 'message');
    if (!messageParam) {
      throw new Error('Parâmetro message não encontrado no node Enviar Config WhatsApp!');
    }

    const oldValue = messageParam.value;
    console.log('Old Value:', oldValue);

    // Substituir a string estática do cabeçalho pela expressão condicional ternária do n8n
    // Usando uma substituição segura independente de diferenças de quebras de linha (\n ou \r\n)
    let newValue = oldValue;
    if (oldValue.includes("'📋 *NOVO CADASTRO DE CLÍNICA*\\n\\n'")) {
      newValue = oldValue.replace(
        "'📋 *NOVO CADASTRO DE CLÍNICA*\\n\\n'",
        "($json.body.event === 'alteracao_cadastro' ? '📋 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' : '📋 *NOVO CADASTRO DE CLÍNICA*') + '\\n\\n'"
      );
    } else {
      // Fallback para caso as quebras de linha reais tenham sido interpretadas como literais de string
      newValue = oldValue.replace(
        "'📋 *NOVO CADASTRO DE CLÍNICA*\\n\\n'",
        "($json.body.event === 'alteracao_cadastro' ? '📋 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' : '📋 *NOVO CADASTRO DE CLÍNICA*') + '\\n\\n'"
      );
    }

    console.log('New Value:', newValue);
    messageParam.value = newValue;

    const payload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings || {}
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

    // Forçar desativação e ativação (Restart do trigger) para carregar as alterações
    console.log('Reiniciando workflow...');
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });

    console.log('Workflow UOGMjLYN0yH1HlxU atualizado e reiniciado com sucesso!');
  } catch (err) {
    console.error('Erro ao atualizar workflow:', err);
  }
}

updateWf();
