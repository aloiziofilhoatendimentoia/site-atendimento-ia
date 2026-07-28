const fs = require('fs');

async function run() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  const apiUrl = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows';

  const rawJson = fs.readFileSync('C:/Users/danig/workflow-demo.json', 'utf8');
  let wf = JSON.parse(rawJson);

  // 1. Alterar Nome
  wf.name = "Simulação do Site";
  delete wf.id;
  delete wf.createdAt;
  delete wf.updatedAt;
  delete wf.versionId;

  // 2. Nós proibidos para retirar
  const nodesToRemove = [
    "Redis7", "If1", "No Operation, do nothing", // Status Agente
    "Switch", "Edit Fields1", "imagem", "Download Imagem", "Edit Fields2", // Imagens e Audio
    "Analyze audio1", "Analyze an image1", "HTTP Request1", 
    "Redis4", "Redis5", "Redis6", // Redis imagens e audios
    "Buscar Evento", "Buscar Eventos", "Criar Evento", "Cancelar Evento", "Reagendar Evento", // Agenda
    "Notificar_Humano", "Notificar_Humano_Agenda", "Notificar_Humano_Cancelar", "Notificar_Humano_Reagendar", "Desativar_atendimento", // Human Handover
    "Simular Digitando", "Wait Inteligente", "Parar Digitando" // Efeitos WhatsApp (vamos manter só a resposta crua para o site ou limpar)
  ];

  // Mantemos o "Webhook" antigo? O Webhook antigo responde pelo Z-API. Para o Simulador, precisamos do "Respond to Webhook"
  // Vou trocar o Webhook principal
  const webhookIndex = wf.nodes.findIndex(n => n.name === 'Webhook');
  if (webhookIndex !== -1) {
    wf.nodes[webhookIndex].parameters = {
      httpMethod: 'POST',
      path: 'simulador-web',
      responseMode: 'lastNode',
      options: {}
    };
  }

  // A resposta original para Z-API era disparada no Loop Over Items -> Simular Digitando.
  // Vou remover o envio Z-API para retornar nativamente do N8N na resposta do Webhook.
  nodesToRemove.push("Loop Over Items", "Wait1", "Code2"); // Remove envio parcelado pro Z-API.

  // Filtramos os nodes
  wf.nodes = wf.nodes.filter(n => !nodesToRemove.includes(n.name));

  // 3. Atualizar o Agente de IA para responder de volta direto pro webhook (sem envio Z-API fragmentado)
  // O Agente N8N vai disparar e a saída dele deve cair na saída final do fluxo para o Webhook "RespondToWebhook" node (ou lastNode se o Webhook for responseMode lastNode).
  // Se eu coloquei "responseMode: 'lastNode'", o resultado do Agent vira a resposta HTTP.
  const agentIndex = wf.nodes.findIndex(n => n.name === 'AI Agent1');
  if (agentIndex !== -1) {
    let prompt = wf.nodes[agentIndex].parameters.options.systemMessage || '';
    // Limpar o prompt de instruções de Tool que foram deletadas
    prompt = prompt.replace(/<tools>[\s\S]*?<\/tools>/g, '');
    prompt = prompt.replace(/<core_behavior>[\s\S]*?<core_behavior>/g, ''); // Limpa agenda
    prompt = prompt.replace(/<handoff>[\s\S]*?<\/handoff>/g, '');
    prompt = prompt.replace(/<image_handling>[\s\S]*?<\/image_handling>/g, '');
    wf.nodes[agentIndex].parameters.options.systemMessage = prompt;
  }

  // 4. Limpar connections
  const newConnections = {};
  for (const nodeName in wf.connections) {
    if (nodesToRemove.includes(nodeName)) continue;
    
    newConnections[nodeName] = { main: [] };
    if (wf.connections[nodeName] && wf.connections[nodeName].main) {
      const conns = wf.connections[nodeName].main[0] || [];
      const validConns = conns.filter(c => !nodesToRemove.includes(c.node));
      
      if (validConns.length > 0) {
        newConnections[nodeName].main.push(validConns);
      }
    }

    // Se é o Agent e tiramos o Code2 que recebia dele, não tem saída!
    if (nodeName === 'AI Agent1') {
      newConnections[nodeName] = { main: [] };
    }
  }
  
  // O filtro estava ligado ao Status Agente (Redis7). Como deletamos Redis7, o Filtro deve ir pro próximo (Dados Lead).
  // Ah, o Filtro ia pra Dados Lead no Demonstration?
  // O 'Filtro' ia pra 'Dados Lead'. 'Dados Lead' ia pra 'Redis7'. 
  // Agora 'Dados Lead' precisa ir para onde Redis7 ia, ou direto pro 'texto' (Edit Fields -> AI Agent).
  newConnections['Dados Lead'] = {
    main: [[{ node: "texto", type: "main", index: 0 }]]
  };

  // Switch foi deletado. 'texto' era o que extraía do Switch e mandava para Redis3.
  // Já está assim.

  wf.connections = newConnections;

  // 5. Salvar payload e POST pra N8N
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: {}
  };

  fs.writeFileSync('C:/Users/danig/payload-simulador.json', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey
      },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    console.log(d.id ? 'Workflow Criado com ID: ' + d.id : d);
  } catch (err) {
    console.error(err);
  }
}

run();
