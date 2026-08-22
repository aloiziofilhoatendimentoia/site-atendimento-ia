const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/blocosHorariOK\.length/g, "blocosHorario.length");
content = content.replace(/blocosHorariOK\.filter/g, "blocosHorario.filter");
content = content.replace(/Erro de processamentOK\./g, "Erro de processamento.");

fs.writeFileSync(file, content, "utf8");
console.log("Fixed OK bugs!");
