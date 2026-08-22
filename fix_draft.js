const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

code = code.replace(
  `if (emailToUse) savedPayload = await getDraftPayload(emailToUse);\r\n      if (!savedPayload && whatsappParam) savedPayload = await getDraftPayload(whatsappParam);`,
  `if (emailToUse) {
        savedPayload = await getDraftPayload(emailToUse);
      } else if (whatsappParam) {
        savedPayload = await getDraftPayload(whatsappParam);
      }`
);
code = code.replace(
  `if (emailToUse) savedPayload = await getDraftPayload(emailToUse);\n      if (!savedPayload && whatsappParam) savedPayload = await getDraftPayload(whatsappParam);`,
  `if (emailToUse) {
        savedPayload = await getDraftPayload(emailToUse);
      } else if (whatsappParam) {
        savedPayload = await getDraftPayload(whatsappParam);
      }`
);

fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
console.log("Updated draft payload logic");
