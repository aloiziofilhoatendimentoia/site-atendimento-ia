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
      res.on('end', () => resolve(JSON.parse(data)));
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
      let sysMsg = null;
      
      // Locate the exact systemMessage location
      if (node.parameters && node.parameters.options && node.parameters.options.systemMessage) {
        sysMsg = node.parameters.options.systemMessage;
      }
      
      if (sysMsg) {
        console.log("Achei a systemMessage original!");
        
        // Remove the old rule if it was there
        sysMsg = sysMsg.replace(/- Quando o paciente perguntar onde fica a clínica.*?(?=\\n)/, '');
        sysMsg = sysMsg.replace(/- REGRA DE ENDEREÇO.*?(?=\\n\\n)/gs, '');
        
        // Build the new rule exactly as requested
        const novaRegra = `
    - REGRA DE ENDEREÇO E LOCALIZAÇÃO (OBRIGATÓRIO EM 2 BALÕES SEPARADOS POR \\\\n\\\\n):
      Se o paciente perguntar onde fica a clínica, envie EXACTAMENTE 2 balões:
      BALÃO 1: "Endereço físico: [RUA DO CAJUEIRO], [83] - [PEIXINHOS], [OLINDA] - [PERNAMBUCO]."
      BALÃO 2: "Você pode conferir no Google Maps por este link: [https://maps.app.goo.gl/ZCwjazLo6mooZjxVA?g_st=aw]"`;

        // Inject the new rule inside <rules>
        sysMsg = sysMsg.replace(/<rules>/, `<rules>\n${novaRegra}`);
        
        node.parameters.options.systemMessage = sysMsg;
        modified = true;
      }
    }
  }
  
  if (modified) {
    await req(BASE_URL, 'PUT', wfDetails);
    console.log("Atualizado via API com sucesso!");
  } else {
    console.log("Falha ao modificar");
  }
}

run().catch(console.error);
