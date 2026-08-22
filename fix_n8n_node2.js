const https = require('https');
const options = {
  hostname: 'n8n.atendimentoiaclinicas.tech',
  path: '/api/v1/workflows/8P6rcD7M9QvYG7jg',
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
    
    const node = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
    if (node) {
      let text = node.parameters.bodyParameters.parameters.find(p => p.name === 'text');
      text.value = text.value.replace(/­ƒôï/g, '🆕');
      text.value = text.value.replace(/­ƒô▒/g, '📱');
      text.value = text.value.replace(/­ƒæ¿ÔÇìÔÜò´©Å/g, '👨‍⚕️');
      text.value = text.value.replace(/ÔÜÖ´©Å/g, '⚙️');
      text.value = text.value.replace(/­ƒòÆ/g, '🕒');
      text.value = text.value.replace(/ÔÇó/g, '•');
    }
    
    const putPayload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings,
      staticData: wf.staticData,
      meta: wf.meta,
      pinData: wf.pinData,
      tags: wf.tags
    };
    
    const putOptions = {
      hostname: 'n8n.atendimentoiaclinicas.tech',
      path: '/api/v1/workflows/8P6rcD7M9QvYG7jg',
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
        console.log("Update response:", pd);
      });
    });
    
    putReq.write(JSON.stringify(putPayload));
    putReq.end();
  });
});
req.end();
