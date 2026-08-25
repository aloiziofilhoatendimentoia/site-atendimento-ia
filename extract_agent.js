const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('demo_wf.json', 'utf8'));
wf.nodes.forEach(n => {
  if (n.type.includes('agent') || n.name.toLowerCase().includes('agent')) {
    console.log(`Node: ${n.name} (${n.type})`);
    console.log(Object.keys(n.parameters || {}));
    if (n.parameters && n.parameters.options) {
      console.log("Options:", Object.keys(n.parameters.options));
      if (n.parameters.options.systemMessage) {
        fs.writeFileSync('demo_prompt.txt', n.parameters.options.systemMessage);
        console.log("Extracted systemMessage into demo_prompt.txt");
      }
    }
  }
});
