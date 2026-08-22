const fs = require('fs');
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
const BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/';
const wfs = ['OLsd2Rtp3wQ3gHeB', '8P6rcD7M9QvYG7jg', '8P6rcD7M9QvyG7Jg'];

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
          if(buffer.length === 0) return resolve(null);
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
  // Read UTF-16 LE file
  let rawData = fs.readFileSync('temp_workflows.json', 'utf16le');
  if (rawData.charCodeAt(0) === 0xFEFF) {
    rawData = rawData.slice(1);
  }
  const data = JSON.parse(rawData);
  
  const wf1 = data.data.find(w => w.id === 'OLsd2Rtp3wQ3gHeB');
  const wf2 = data.data.find(w => w.id === '8P6rcD7M9QvYG7jg' || w.id === '8P6rcD7M9QvyG7Jg');
  
  if (wf1) {
    console.log("Restoring", wf1.name, "...");
    const payload = {
        name: wf1.name,
        nodes: wf1.nodes,
        connections: wf1.connections,
        settings: {}
    };
    const res = await req(BASE_URL + wf1.id, 'PUT', payload);
    console.log("Response:", res.id ? "SUCCESS" : res);
  }
  
  if (wf2) {
    console.log("Restoring", wf2.name, "...");
    const payload = {
        name: wf2.name,
        nodes: wf2.nodes,
        connections: wf2.connections,
        settings: {}
    };
    const targetId = wf2.id.toLowerCase() === '8p6rcd7m9qvyg7jg' ? '8P6rcD7M9QvYG7jg' : wf2.id;
    const res = await req(BASE_URL + targetId, 'PUT', payload);
    console.log("Response:", res.id ? "SUCCESS" : res);
  }
}

run().catch(console.error);
