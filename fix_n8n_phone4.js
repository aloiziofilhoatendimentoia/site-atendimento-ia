const https = require('https');
const options = {
  hostname: 'n8n.atendimentoiaclinicas.tech',
  path: '/api/v1/workflows/OLsd2Rtp3wQ3gHeB',
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA'
  }
};

const req = https.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    let wf = JSON.parse(d);
    
    const node = wf.nodes.find(n => n.name === 'Puxar_Dados_Clinica');
    if (node) {
      let condition = node.parameters.filters.conditions.find(c => c.keyName === 'telefone_principal');
      
      condition.keyValue = "={{ $json.body.instance.startsWith('55') ? $json.body.instance : '55' + $json.body.instance }}";
    }
    
    const putPayload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: { executionOrder: 'v1' }
    };
    
    const putOptions = {
      hostname: 'n8n.atendimentoiaclinicas.tech',
      path: '/api/v1/workflows/OLsd2Rtp3wQ3gHeB',
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA',
        'Content-Type': 'application/json'
      }
    };
    
    const putReq = https.request(putOptions, putRes => {
      let pd = '';
      putRes.on('data', c => pd += c);
      putRes.on('end', () => {
        console.log("Update response:", pd.substring(0, 100));
      });
    });
    
    putReq.write(JSON.stringify(putPayload));
    putReq.end();
  });
});
req.end();
