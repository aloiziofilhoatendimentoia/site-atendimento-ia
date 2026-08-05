const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

async function updateWorkflow() {
  const res = await fetch('https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/8P6rcD7M9QvYG7jg', {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  const wf = await res.json();
  const node = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
  
  if (node) {
    const numberParam = node.parameters.bodyParameters.parameters.find(p => p.name === 'number');
    if (numberParam) {
      numberParam.value = "5581979066573";
    }
    const textParam = node.parameters.bodyParameters.parameters.find(p => p.name === 'text');
    if (textParam) {
      textParam.value = `=📋 *NOVO CADASTRO DE CLÍNICA*\n\n*Nome da Clínica:* {{ $json.body.nome_da_clinica || 'Não informado' }}\n*Endereço:* {{ $json.body.clinica && $json.body.clinica.endereco ? $json.body.clinica.endereco : ($json.body.endereco || 'Não informado') }}\n\n📱 *CONTATOS DA CLÍNICA:*\n*WhatsApp da IA:* {{ $json.body.whatsapp_ia || 'Não informado' }}\n*Atendimento Humano:* {{ $json.body.whatsapp_humano || 'Não informado' }}\n*Receber Agendamentos:* {{ $json.body.whatsapp_agendamento || 'Não informado' }}\n\n👨‍⚕️ *PROFISSIONAIS CADASTRADOS:*\n{{ $json.body.profissionais_formatados || 'Nenhum' }}\n\n⚙️ *CONFIGURAÇÃO DE AGENDA:*\n*Canais Escolhidos:* {{ $json.body.canais_escolhidos || 'Nenhum' }}\n\n🕒 *HORÁRIO DE ATENDIMENTO:*\n{{ Array.isArray($json.body.horarios?.blocosHorario) && $json.body.horarios.blocosHorario.length > 0 ? $json.body.horarios.blocosHorario.filter(b=>b.dias&&b.dias.length).map(b => '• ' + b.dias.join(', ') + ': das ' + (b.inicio||'08:00') + ' às ' + (b.fim||'18:00')).join('\\n') : ($json.body.horarios_formatados || ($json.body.dias_atendimento + ' - ' + $json.body.horarios_atendimento)) }}\n*Intervalo:* {{ $json.body.intervalo_consulta || 'Não informado' }}\n*Valor da Consulta:* {{ $json.body.valor_consulta || 'R$ 0,00' }}`;
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

    console.log('Update n8n status:', updateRes.status);
  }
}

updateWorkflow().catch(console.error);
