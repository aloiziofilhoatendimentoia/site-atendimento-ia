const https = require('https');
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/OLsd2Rtp3wQ3gHeB';

const options = {
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Accept': 'application/json'
  }
};

https.get(BASE_URL, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const wf = JSON.parse(data);
    const agentNode = wf.nodes.find(n => n.name === 'AI Agent1');
    if (agentNode.parameters.options.systemMessage.includes('Apenas responda de forma educada: "Esta clínica realiza o atendimento exclusivamente de forma automática e não temos a opção de transferir para um atendente humano."')) {
      console.log("SUCCESS! The prompt contains the new instructions!");
    } else {
      console.log("FAILED. The prompt does NOT contain the new instructions.");
    }
  });
});
