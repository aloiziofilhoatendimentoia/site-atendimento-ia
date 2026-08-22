const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace("let payloadDB = {", "let payloadDB: any = {");

fs.writeFileSync(file, content, "utf8");
console.log("Fixed TS error!");
