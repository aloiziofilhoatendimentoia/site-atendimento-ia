const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

const start = content.indexOf("const tituloMensagem");
if (start !== -1) {
  const end = content.indexOf(";", start) + 1;
  const replacement = `const tituloMensagem = eventType === 'alteracao_cadastro' 
      ? '🔄 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' 
      : '🆕 *NOVO CADASTRO DE CLÍNICA*';`;
  content = content.substring(0, start) + replacement + content.substring(end);
  fs.writeFileSync(file, content, "utf8");
  console.log("Replaced successfully via indexOf");
} else {
  console.log("Could not find const tituloMensagem");
}
