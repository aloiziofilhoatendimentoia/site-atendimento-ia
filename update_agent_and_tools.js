const fs = require('fs');
let promptText = fs.readFileSync('demo_prompt.txt', 'utf8');

const regexHandoff = /<core_behavior>[\s\S]*?<handoff>/;

if (promptText.match(regexHandoff)) {
  let newCore = `<core_behavior>

Você também tem a função de fazer agendamentos, cancelar agendamentos e fazer reagendamentos utilizando o google calendar, a tool Notificar_Humano_Agenda, a tool Notificar_Humano_Cancelar e a tool Notificar_Humano_Reagendar.

REGRA DE ESPECIALISTA:
Se a clínica tiver mais de um especialista (verifique os dados da clínica), é OBRIGATÓRIO perguntar ao usuário com qual especialista ou qual especialidade ele deseja agendar ANTES de prosseguir.
Quando for feito um agendamento, o nome do especialista desejado DEVE OBRIGATORIAMENTE ser incluído na descrição do evento criado no Google Agenda (tool "Criar Evento") e também na mensagem enviada pelo WhatsApp (tool "Notificar_Humano_Agenda").

Ao perceber que o usuário deseja fazer um agendamento, marcar uma consulta, deverá acionar primeiramente a tool "Buscar Evento" ou "Buscar Eventos" para verificar se existe algum evento marcado para o mesmo dia e horário, estando disponível, só depois que irá acionar a tool "Criar Evento" e a tool Notificar_Humano_Agenda". 
Nunca encerre a conversa sem acionar a tool "Buscar Evento" quando o usuário tiver interesse em fazer um agendamento.

Sempre que acionar a tool "Criar Evento" deverá acionar também, diretamente, sem desativar o atendimento, a tool "Notificar_Humano_Agenda.

Acione:
- "Notificar_Humano_Agenda"

quando:
- acionar "Criar Evento"

Antes de fazer o agendamento, se já não tiver as informações de "Motivo", "Data", "Hora" e "Especialista", pergunte educadamente ao usuário.

Só cancele ou faça reagendamento se for o mesmo id/usuário que fez o agendamento. Se outro id/usuário tentar cancelar ou reagendar dizer : "Só posso cancelar ou reagendar essa consulta se for pelo mesmo paciente"

Sempre que acionar a tool "Cancelar Evento" deverá acionar também, diretamente, sem desativar o atendimento, a tool "Notificar_Humano_Cancelar"

Acione:
Notificar_Humano_Cancelar

quando:
acionar "Cancelar Evento"

Sempre que acionar a tool "Reagendar Evento" deverá acionar também, diretamente, sem desativar o atendimento, a tool "Notificar_Humano_Reagendar"

Acione:
Notificar_Humano_Reagendar

quando:
acionar "Reagendar Evento"

</core_behavior>

<handoff>`;

  promptText = promptText.replace(regexHandoff, newCore);
  fs.writeFileSync('demo_prompt.txt', promptText);
  console.log("Updated core_behavior in demo_prompt.txt");
} else {
  console.log("Could not find <core_behavior> to replace.");
}

const wf = JSON.parse(fs.readFileSync('demo_wf_updated.json', 'utf8'));

// 1. Update AI Agent Prompt
let agentNode = wf.nodes.find(n => n.name === 'AI Agent1' || n.name === 'Google Gemini Chat Model' || n.type === '@n8n/n8n-nodes-langchain.agent');
if (agentNode && agentNode.parameters && agentNode.parameters.options) {
  agentNode.parameters.options.systemMessage = promptText;
}

// 2. Update Notificar_Humano_Agenda
let notificarAgenda = wf.nodes.find(n => n.name === 'Notificar_Humano_Agenda');
if (notificarAgenda) {
  let toolDesc = notificarAgenda.parameters.toolDescription;
  if (!toolDesc.includes('Especialista desejado')) {
    notificarAgenda.parameters.toolDescription = toolDesc.replace(
      '- Nome do paciente',
      '- Especialista desejado\n- Nome do paciente'
    );
  }
  
  let textParam = notificarAgenda.parameters.bodyParameters.parameters.find(p => p.name === 'text');
  if (textParam) {
    textParam.value = textParam.value.replace(
      '*Nome do paciente:*',
      '*Especialista desejado:*\n\n *Nome do paciente:*'
    );
  }
}

// 3. Save
fs.writeFileSync('demo_wf_updated.json', JSON.stringify(wf, null, 2));
console.log("Updated Notificar_Humano_Agenda in demo_wf_updated.json");
