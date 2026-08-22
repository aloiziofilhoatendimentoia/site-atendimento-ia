const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/const tituloMensagem = eventType[\s\S]*?NOVO CADASTRO.*?;/g, 
`const tituloMensagem = eventType === 'alteracao_cadastro'
      ? '🔄 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' 
      : '📋 *NOVO CADASTRO DE CLÍNICA*';`);

fs.writeFileSync(file, content, "utf8");
console.log("Fixed tituloMensagem!");
