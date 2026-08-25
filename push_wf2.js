const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/OLsd2Rtp3wQ3gHeB';

const wf = JSON.parse(fs.readFileSync('demo_wf_updated.json', 'utf8'));
delete wf.createdAt;
delete wf.updatedAt;

const options = {
  method: 'PUT',
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const req = https.request(BASE_URL, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Successfully updated workflow in n8n!");
    } else {
      console.log("Failed to update workflow. Status:", res.statusCode);
      console.log("Response:", data);
    }
  });
});

req.on('error', console.error);
req.write(JSON.stringify(wf));
req.end();
