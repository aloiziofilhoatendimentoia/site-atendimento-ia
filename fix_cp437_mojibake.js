const fs = require('fs');
const https = require('https');

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

const replacements = {
  "├ç├âO": "ÇÃO",
  "├ç├òES": "ÇÕES",
  "├º├úo": "ção",
  "├º├╡es": "ções",
  "├¡": "í",
  "├º": "ç",
  "├╡": "õ",
  "├ú": "ã",
  "├á": "à",
  "├│": "ó",
  "├ë": "É",
  "├í": "á",
  "├⌐": "é",
  "├¬": "ê",
  "├║": "ú",
  "├ô": "Ô",
  "├ç": "Ç",
  "├â": "Â",
  "├ì": "Í",
  "├ô": "Ó",
  "├ü": "Á",
  "├®": "é",
  "├Á": "õ"
};

async function run() {
  for (const id of wfs) {
    let wf = await req(BASE_URL + id);
    if (!wf) continue;
    
    let wfStr = JSON.stringify(wf);
    let originalWfStr = wfStr;
    
    // Sort replacements by length descending to replace longer sequences first
    const entries = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
    for (const [bad, good] of entries) {
      wfStr = wfStr.split(bad).join(good);
    }
    
    if (wfStr !== originalWfStr) {
        console.log(`Sending update for ${id}...`);
        const updatedWf = JSON.parse(wfStr);
        const payload = {
            name: updatedWf.name,
            nodes: updatedWf.nodes,
            connections: updatedWf.connections,
            settings: {}
        };
        const res = await req(BASE_URL + id, 'PUT', payload);
        console.log(`Response for ${id}:`, res.id ? 'SUCCESS' : res);
    } else {
        console.log(`No changes needed for ${id}`);
    }
  }
}

run().catch(console.error);
