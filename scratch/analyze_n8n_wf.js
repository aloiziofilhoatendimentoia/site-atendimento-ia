const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/wf-from-n8n.json', 'utf8'));

console.log('--- Nomes dos Nodes no Workflow ---');
wf.nodes.forEach(n => {
  console.log(`- [${n.type}] Name: "${n.name}"`);
});

console.log('\n--- Procurando texto "Novo Cadastro" nos Nodes ---');
wf.nodes.forEach(n => {
  const nodeStr = JSON.stringify(n);
  if (nodeStr.includes('Novo Cadastro') || nodeStr.includes('cadastro') || nodeStr.includes('Clínica')) {
    console.log(`Encontrado match no node "${n.name}":`);
    console.log(JSON.stringify(n, null, 2));
  }
});
