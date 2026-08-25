const fs = require('fs');

const promptFile = 'demo_prompt.txt';
let promptText = fs.readFileSync(promptFile, 'utf8');

const regex = /<handoff>[\s\S]*?<\/handoff>/;

const newHandoff = `<handoff>

  ATENÇÃO - REGRA DE CONTATO HUMANO:
  Verifique nos dados da clínica em <clinic_information> se o número de Notificar Humano (whatsapp_notificacao, notificar_humano ou similar) está preenchido.
  Se o número para notificação humana NÃO estiver preenchido (ou estiver em branco), a clínica faz o atendimento EXCLUSIVAMENTE de forma automática. 
  Nesse caso, se o usuário solicitar falar com um humano, NÃO acione as tools Notificar_Humano nem Desativar_atendimento. Apenas responda de forma educada: "Esta clínica realiza o atendimento exclusivamente de forma automática e não temos a opção de transferir para um atendente humano." e pergunte se pode ajudar em algo mais.

  CASO O NÚMERO DE NOTIFICAÇÃO HUMANA ESTEJA PREENCHIDO, Acione:
  - Desativar_atendimento
  - Notificar_Humano

  quando:
  - houver a necessidade ou for solicitado pelo usuário falar com o um assistente humano
  - houver falha persistente
  - faltar informação crítica
  - você não souber responder

  REGRA DE HORÁRIO COMERCIAL:
  Só acione o atendimento humano se estiver dentro do horário comercial, de 08:00 às 18:00 horas, horário de brasília, brasil, se estiver fora desse horário seja educado e diga que só pode passar para um assistente humano dentro desse horário, logo em seguida, mas não na mesma mensagem, pergunte se pode ajudar em algo mais.

</handoff>`;

promptText = promptText.replace(regex, newHandoff);
fs.writeFileSync(promptFile, promptText);
console.log("Updated prompt saved to demo_prompt.txt");

// Now update the n8n workflow
const wf = JSON.parse(fs.readFileSync('demo_wf.json', 'utf8'));
let agentNode = wf.nodes.find(n => n.name === 'AI Agent1' || n.name === 'Google Gemini Chat Model' || n.type === '@n8n/n8n-nodes-langchain.agent');

if (agentNode && agentNode.parameters && agentNode.parameters.options) {
  agentNode.parameters.options.systemMessage = promptText;
  fs.writeFileSync('demo_wf_updated.json', JSON.stringify(wf, null, 2));
  console.log("Updated workflow saved to demo_wf_updated.json");
} else {
  console.log("Could not update agentNode prompt!");
}

