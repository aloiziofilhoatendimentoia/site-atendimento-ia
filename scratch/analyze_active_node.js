const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/active-wf-from-n8n.json', 'utf8'));

const targetNode = wf.nodes.find(n => n.name === 'Enviar Config WhatsApp');
if (targetNode) {
  console.log('--- Node Completo ---');
  console.log(JSON.stringify(targetNode, null, 2));
} else {
  console.log('Node Enviar Config WhatsApp nao encontrado no workflow ativo!');
}
