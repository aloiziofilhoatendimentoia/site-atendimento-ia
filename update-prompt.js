const fs = require('fs');

async function run() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  const workflowId = 'X7a388u2Ze8uoxVn';
  const apiUrl = `https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}`;

  try {
    const rawJson = fs.readFileSync('C:/Users/danig/Downloads/Site Atendimento IA/wf-atual.json', 'utf8');
    let wf = JSON.parse(rawJson);

    const agent = wf.nodes.find(n => n.name === 'AI Agent1');
    if (!agent) {
      console.error('Agent não encontrado!');
      return;
    }

    let prompt = agent.parameters.options.systemMessage;

    const newCoreBehavior = `<core_behavior>

ATENÇÃO PARA O SETOR DE AGENDAMENTOS (SIMULAÇÃO):
Quando o paciente solicitar um agendamento, siga RIGOROSAMENTE estas etapas:
1. Primeiro, pergunte o dia, o horário e o nome do paciente (se ele ainda não tiver fornecido o nome).
2. Após ele responder, responda de forma educada que irá consultar se está disponível o horário. (Não informe que está agendado nesta mesma mensagem, apenas diga que vai consultar e aguarde).
3. Na resposta subsequente, quando ele aguardar, responda que o horário está disponível e o agendamento está feito com sucesso, e pergunte se pode ajudar em mais alguma coisa.

</core_behavior>`;

    // Substituir usando Regex ou match entre tags <core_behavior>
    const regex = /<core_behavior>[\s\S]*?(<\/core_behavior>|<core_behavior>)/;
    
    if (regex.test(prompt)) {
      prompt = prompt.replace(regex, newCoreBehavior);
      agent.parameters.options.systemMessage = prompt;
    } else {
      console.log('Sessão core_behavior não encontrada!');
      return;
    }

    const payload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings || {},
      active: true
    };

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey },
      body: JSON.stringify(payload)
    });
    
    // Forçar Restart
    await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}/deactivate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });
    await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${workflowId}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': apiKey } });

    console.log('Prompt Principal modificado com sucesso!');
  } catch (err) {
    console.error(err);
  }
}

run();
