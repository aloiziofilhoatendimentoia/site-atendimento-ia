const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/active-wf-from-n8n.json', 'utf8'));

console.log('--- Conexões do nó "Webhook Config Site" ---');
const connections = wf.connections['Webhook Config Site'];
console.log(JSON.stringify(connections, null, 2));

console.log('\n--- Conexões do nó "Enviar Config WhatsApp" ---');
const connections2 = wf.connections['Enviar Config WhatsApp'];
console.log(JSON.stringify(connections2, null, 2));
