const fs = require('fs');

async function updateTitleExpression() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  const getRes = await fetch(apiUrl, { headers: { 'X-N8N-API-KEY': apiKey } });
  const wf = await getRes.json();

  const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
  if (!targetNode) throw new Error('Nó não encontrado!');

  const textParam = targetNode.parameters.bodyParameters?.parameters?.find(p => p.name === 'text');
  if (textParam) {
    const oldText = textParam.value;
    console.log('Texto antigo:', oldText.substring(0, 100));

    // Substituir a expressão inicial pelo campo titulo_mensagem vindo do backend
    textParam.value = "={{ ($json.body.titulo_mensagem || '📋 *NOVO CADASTRO DE CLÍNICA*') }}\n\n" +
      "*Nome da Clínica:* {{ $json.body.nome_da_clinica || 'Não informado' }}\n" +
      "*Endereço:* {{ $json.body.clinica && $json.body.clinica.endereco ? $json.body.clinica.endereco : ($json.body.endereco || 'Não informado') }}\n\n" +
      "📱 *CONTATOS DA CLÍNICA:*\n" +
      "*WhatsApp da IA:* {{ $json.body.whatsapp_ia || 'Não informado' }}\n" +
      "*Atendimento Humano:* {{ $json.body.whatsapp_humano || 'Não informado' }}\n" +
      "*Receber Agendamentos:* {{ $json.body.whatsapp_agendamento || 'Não informado' }}\n\n" +
      "👨‍⚕️ *PROFISSIONAIS CADASTRADOS:*\n" +
      "{{ $json.body.profissionais_formatados || 'Nenhum' }}\n\n" +
      "⚙️ *CONFIGURAÇÃO DE AGENDA:*\n" +
      "*Canais Escolhidos:* {{ $json.body.canais_escolhidos || 'Nenhum' }}\n\n" +
      "🕒 *HORÁRIO DE ATENDIMENTO:*\n" +
      "{{ Array.isArray($json.body.horarios?.blocosHorario) && $json.body.horarios.blocosHorario.length > 0 ? $json.body.horarios.blocosHorario.filter(b=>b.dias&&b.dias.length).map(b => '• ' + b.dias.join(', ') + ': das ' + (b.inicio||'08:00') + ' às ' + (b.fim||'18:00')).join('\\n') : ($json.body.horarios_formatados || ($json.body.dias_atendimento + ' - ' + $json.body.horarios_atendimento)) }}\n" +
      "*Intervalo:* {{ $json.body.intervalo_consulta || 'Não informado' }}\n" +
      "*Valor da Consulta:* {{ $json.body.valor_consulta || 'R$ 0,00' }}";

    console.log('\nTexto novo:', textParam.value.substring(0, 100));
  }

  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: {} };
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
    body: JSON.stringify(payload)
  });

  if (putRes.ok) {
    await fetch(`${apiUrl}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`${apiUrl}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    console.log('\n✅ Workflow n8n atualizado com titulo_mensagem direto!');
  } else {
    console.error('Erro PUT:', await putRes.text());
  }
}

updateTitleExpression().catch(console.error);
