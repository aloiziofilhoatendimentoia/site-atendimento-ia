const fs = require('fs');
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows';

const options = {
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

function req(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const r = https.request(url, { ...options, method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  const data = await req(BASE_URL);
  const workflows = data.data;
  const wf = workflows.find(w => w.name.toLowerCase().includes('demonstra'));
  if (!wf) {
    console.log("Workflow não encontrado!");
    return;
  }
  
  console.log("Encontrado workflow:", wf.name, "ID:", wf.id);
  const wfDetails = await req(`${BASE_URL}/${wf.id}`);
  
  let modified = false;
  // Find the AI Agent node
  for (let node of wfDetails.nodes) {
    console.log(node.name, node.type);
    // Usually the prompt is in options.systemMessage or parameters.text
    if (node.type === '@n8n/n8n-nodes-langchain.agent' || node.name.includes('AI') || node.name.includes('Agent')) {
      console.log("Achou um candidato:", node.name);
      console.log(Object.keys(node.parameters || {}));
      
      let newPrompt = node.parameters.text || node.parameters.systemMessage || (node.parameters.options && node.parameters.options.systemMessage);
      
      if (newPrompt) {
        console.log("Modificando o prompt do nó", node.name);
        
        // Remove existing rule 15 if any
        newPrompt = newPrompt.replace(/15\..*?(\n\n|$)/gs, '');
        
        // Add the new rule for 2 balloons
        const rule15 = `
15. REGRA DE ENDEREÇO E LOCALIZAÇÃO (OBRIGATÓRIO EM 2 BALÕES SEPARADOS POR \\n\\n):
    - Se o paciente perguntar pelo endereço ou localização da clínica (ex: "qual o endereço?", "onde fica?"):
      * Você deve obrigatoriamente enviar 2 balões separados por \\n\\n:
        - BALÃO 1: "O nosso endereço é {{ $json.endereco }}."
        - BALÃO 2: "Você pode conferir a nossa localização no Google Maps por este link: {{ $json.linkGoogleMaps }}"`;
        
        newPrompt = newPrompt + "\n" + rule15;
        
        if (node.parameters.text) node.parameters.text = newPrompt;
        else if (node.parameters.systemMessage) node.parameters.systemMessage = newPrompt;
        else if (node.parameters.options && node.parameters.options.systemMessage) node.parameters.options.systemMessage = newPrompt;
        
        modified = true;
      }
    }
  }
  
  if (modified) {
    console.log("Enviando workflow modificado para o n8n...");
    const updateRes = await req(`${BASE_URL}/${wf.id}`, 'PUT', wfDetails);
    console.log("Sucesso! O workflow foi atualizado.");
  } else {
    console.log("Não foi possível encontrar ou modificar o prompt do Agente de IA.");
  }
}

run().catch(console.error);
