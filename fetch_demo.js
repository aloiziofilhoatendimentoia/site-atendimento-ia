const https = require('https');
const fs = require('fs');

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
    fs.writeFileSync('demo_wf.json', data);
    console.log("Saved demo_wf.json");
    
    // Now extract the prompt
    const wf = JSON.parse(data);
    const agentNode = wf.nodes.find(n => n.name === 'AI Agent1' || n.name === 'Google Gemini Chat Model' || n.type === '@n8n/n8n-nodes-langchain.agent');
    if (agentNode && agentNode.parameters && agentNode.parameters.prompt) {
      fs.writeFileSync('demo_prompt.txt', agentNode.parameters.prompt);
      console.log("Saved demo_prompt.txt");
    } else {
      console.log("Could not find agent prompt in the workflow.");
      // let's look for "prompt" in any node
      wf.nodes.forEach(n => {
        if (n.parameters && n.parameters.prompt) {
          console.log(`Found prompt in node: ${n.name}`);
        }
      });
    }
  });
}).on('error', console.error);
