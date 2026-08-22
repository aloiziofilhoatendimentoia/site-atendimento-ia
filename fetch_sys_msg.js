const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/';
const wfs = ['OLsd2Rtp3wQ3gHeB', '8P6rcD7M9QvYG7jg'];

const options = {
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8'
  }
};

function req(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const r = https.request(url, { ...options, method }, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(data);
          resolve(JSON.parse(buffer.toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
    });
    r.on('error', reject);
    if (body) {
        const payload = JSON.stringify(body);
        r.setHeader('Content-Length', Buffer.byteLength(payload, 'utf8'));
        r.write(payload, 'utf8');
    }
    r.end();
  });
}

async function run() {
  for (const id of wfs) {
    const wf = await req(BASE_URL + id);
    let sysMsg = '';
    for (let node of wf.nodes) {
      if (node.type === '@n8n/n8n-nodes-langchain.agent') {
        if (node.parameters && node.parameters.options && node.parameters.options.systemMessage) {
          sysMsg = node.parameters.options.systemMessage;
        }
      }
    }
    fs.writeFileSync(`sysMsg_${id}.txt`, sysMsg, 'utf8');
    console.log(`Saved sysMsg_${id}.txt`);
  }
}

run().catch(console.error);
