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
  "Cl??nica": "Clínica",
  "cl??nica": "clínica",
  "Cl??nia": "Clínica",
  "Endere??o": "Endereço",
  "endere??o": "endereço",
  "f??sico": "físico",
  "S??bados": "Sábados",
  "??s": "às",
  "Dura????o": "Duração",
  "forne??a": "forneça",
  "S?? ": "Só ",
  "s?? ": "só ",
  "hor??rios": "horários",
  "hor??rio": "horário",
  "necess??rio": "necessário",
  "espa??o": "espaço",
  " ?? ": " é ",
  "M??dica": "Médica",
  "respons??vel": "responsável",
  "CR??TICA": "CRÍTICA",
  "par??grafo": "parágrafo",
  "OBRIGAT??RIO": "OBRIGATÓRIO",
  "SEPARA????O": "SEPARAÇÃO",
  "T??CNICA": "TÉCNICA",
  "D'??GUA": "D'ÁGUA",
  "informa????es": "informações",
  "r??pido": "rápido",
  "usu??rio": "usuário",
  "Voc??": "Você",
  "tamb??m": "também",
  "fun????o": "função",
  "dispon??vel": "disponível",
  "ir??": "irá",
  "j??": "já",
  "n??o": "não",
  "fa??a": "faça",
  "bras??lia": "brasília",
  "?f??": "📍",
  "a????es": "ações",
  "conte??do": "conteúdo",
  "rob??ticas": "robóticas",
  "op????o": "opção",
  "est??": "está",
  "Localiza????o": "Localização",
  
  // File 2 fixes
  "Voc?": "Você",
  "? um": "é um",
  "? explicar": "é explicar",
  "miss?o": "missão",
  "? mostrar": "é mostrar",
  "secret?rias": "secretárias",
  "cl?nicas": "clínicas",
  "m?dicas": "médicas",
  "odontol??gicas": "odontológicas",
  "intelig?ncia": "inteligência",
  "dispon?veis": "disponíveis",
  "Aten??o": "Atenção",
  "servi?os": "serviços",
  "??nica": "única",
  "n?o": "não",
  "automa??o": "automação",
  "SOLU??ES": "SOLUÇÕES",
  "autom?ticos": "automáticos",
  "informa??es": "informações",
  "quebra-cabe?as": "quebra-cabeças",
  "usu?rio": "usuário",
  "CR?TICA": "CRÍTICA",
  "par?grafo": "parágrafo",
  "OBRIGAT?RIO": "OBRIGATÓRIO",
  "m?ximo": "máximo",
  "SEPARA??O": "SEPARAÇÃO",
  "T?CNICA": "TÉCNICA",
  "D'?GUA": "D'ÁGUA",
  "r?pido": "rápido",
  "ades?o": "adesão",
  "manuten??o": "manutenção",
  "s?? ": "só ",
  "ser?": "será",
  "m?s": "mês",
  "ap??s": "após",
  "ofere?a": "ofereça",
  "endere?o": "endereço",
  "f?sico": "físico",
  "escrit??rio": "escritório",
  "p??blico": "público",
  "cr?tica": "crítica",
  "voc?": "você",
  "hor?rio": "horário",
  "?s": "às",
  "bras?lia": "brasília",
  "j?": "já",
  "est?": "está",
  "op??o": "opção",
  "execu??o": "execução",
  "a??es": "ações",
  "conte??do": "conteúdo",
  "oferea": "ofereça",
  "??udio": "Áudio",
  "DEMONSTRA????O": "DEMONSTRAÇÃO",
  "ATEN????O": "ATENÇÃO",
  "Aten??o": "Atenção"
};

async function run() {
  for (const id of wfs) {
    let wf = await req(BASE_URL + id);
    if (!wf) continue;
    
    let wfStr = JSON.stringify(wf);
    let originalWfStr = wfStr;
    
    for (const [bad, good] of Object.entries(replacements)) {
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
