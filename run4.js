const fs = require('fs');
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows';
const WF_ID = 'OLsd2Rtp3wQ3gHeB';

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
  console.log('Fetching workflow...');
  const wf = await req(BASE_URL + '/' + WF_ID);
  if (!wf.nodes) return;
  const webhookNode = wf.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  const dadosLeadNode = wf.nodes.find(n => n.name === 'Dados Lead');
  let supabaseNode = wf.nodes.find(n => n.name === 'Puxar_Dados_Clinica');
  if (!supabaseNode) {
    supabaseNode = {
      parameters: {
        operation: 'getAll',
        tableId: 'CLIENTES ATENDIMENTO IA SITE',
        returnAll: false,
        limit: 1,
        filters: {
          conditions: [
            {
              keyName: 'telefone_principal',
              condition: 'eq',
              keyValue: '={{ $json.instance }}'
            }
          ]
        }
      },
      id: 'uuid-supabase-' + Date.now(),
      name: 'Puxar_Dados_Clinica',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [webhookNode.position[0] + 200, webhookNode.position[1]],
      credentials: {
        supabaseApi: {
          id: 'bHl8sC1pLg4bTj2K',
          name: 'Supabase account'
        }
      }
    };
    wf.nodes.push(supabaseNode);
  }
  const wfAtendimento = await req(BASE_URL + '/8P6rcD7M9QvYG7jg');
  const atndSupabase = wfAtendimento.nodes.find(n => n.type === 'n8n-nodes-base.supabase');
  if (atndSupabase && atndSupabase.credentials) supabaseNode.credentials = atndSupabase.credentials;
  if (wf.connections[webhookNode.name] && wf.connections[webhookNode.name].main && wf.connections[webhookNode.name].main[0]) {
    wf.connections[webhookNode.name].main[0] = wf.connections[webhookNode.name].main[0].filter(c => c.node !== dadosLeadNode.name);
    wf.connections[webhookNode.name].main[0].push({ node: supabaseNode.name, type: 'main', index: 0 });
  }
  if (!wf.connections[supabaseNode.name]) wf.connections[supabaseNode.name] = { main: [[]] };
  wf.connections[supabaseNode.name].main[0] = [{ node: dadosLeadNode.name, type: 'main', index: 0 }];
  const agentNode = wf.nodes.find(n => n.name === 'AI Agent1' || n.name === 'Google Gemini Chat Model' || n.type === '@n8n/n8n-nodes-langchain.agent');
  if (agentNode) {
    let prompt = agentNode.parameters.options?.systemMessage || agentNode.parameters.text;
    if (prompt) {
      prompt = prompt.replace(/<agent_name>.*?<\/agent_name>/s, '<agent_name>Assistente Virtual</agent_name>');
      prompt = prompt.replace(/<company>.*?<\/company>/s, '<company>{{ $(\'Puxar_Dados_Clinica\').first().json.nome_clinica }}</company>');
      const newClinicInfo = `<clinic_information>\n    Aqui estao os dados completos e configuracoes da clinica (em formato JSON):\n    {{ $(\'Puxar_Dados_Clinica\').first().json.dados_completos_json }}\n  </clinic_information>`;
      prompt = prompt.replace(/<clinic_information>.*?<\/clinic_information>/s, newClinicInfo);
      if (agentNode.parameters.options?.systemMessage) agentNode.parameters.options.systemMessage = prompt;
      else if (agentNode.parameters.text) agentNode.parameters.text = prompt;
    }
  }
  
  // Clean up object for PUT
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: {},
    staticData: wf.staticData,
    pinData: wf.pinData,
    tags: wf.tags
  };

  console.log('Uploading updated workflow...');
  const res = await req(BASE_URL + '/' + WF_ID, 'PUT', payload);
  console.log('Response:', res.id ? 'Success! ID: ' + res.id : res);
}
run().catch(console.error);
