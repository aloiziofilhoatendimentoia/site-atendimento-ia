const fs = require('fs');
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/OLsd2Rtp3wQ3gHeB';

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
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error("Error parsing response:", data);
          reject(e);
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  const wfDetails = await req(BASE_URL);
  let modified = false;
  
  for (let node of wfDetails.nodes) {
    if (node.type === '@n8n/n8n-nodes-langchain.agent') {
      if (node.parameters && node.parameters.options && node.parameters.options.systemMessage) {
        let sysMsg = node.parameters.options.systemMessage;
        
        console.log("Achou systemMessage. Tamanho atual:", sysMsg.length);
        
        // Find the index of <rules>
        const rulesIndex = sysMsg.indexOf('<rules>');
        if (rulesIndex !== -1) {
          // Remove the old rule string
          const stringToRemove = "- Quando o paciente perguntar onde fica a clínica, forneça SEMPRE o endereço físico completo acompanhado do link do Google Maps.";
          sysMsg = sysMsg.replace(stringToRemove, "");
          
          const newRule = `
    - REGRA DE ENDEREÇO E LOCALIZAÇÃO (OBRIGATÓRIO EM 2 BALÕES SEPARADOS POR \\n\\n):
      Se o paciente perguntar onde fica a clínica, envie EXACTAMENTE 2 balões:
      BALÃO 1: "Endereço físico: [RUA DO CAJUEIRO], [83] - [PEIXINHOS], [OLINDA] - [PERNAMBUCO]."
      BALÃO 2: "Você pode conferir no Google Maps por este link: [https://maps.app.goo.gl/ZCwjazLo6mooZjxVA?g_st=aw]"`;
          
          // Insert the new rule right after <rules>
          sysMsg = sysMsg.replace('<rules>', '<rules>' + newRule);
          
          node.parameters.options.systemMessage = sysMsg;
          modified = true;
          console.log("Modificação feita localmente na string!");
        }
      }
    }
  }
  
  if (modified) {
    console.log("Enviando PUT request para salvar no n8n...");
    const payload = {
      name: wfDetails.name,
      nodes: wfDetails.nodes,
      connections: wfDetails.connections,
      settings: {}
    };
    const updateRes = await req(BASE_URL, 'PUT', payload);
    console.log("Resposta do PUT:", updateRes.id ? "Sucesso ID: " + updateRes.id : updateRes);
  } else {
    console.log("Nada modificado.");
  }
}

run().catch(console.error);
