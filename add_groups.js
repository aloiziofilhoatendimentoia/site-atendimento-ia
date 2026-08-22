const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');
code = code.replace(
  'integration: "WHATSAPP-BAILEYS",\r\n          webhook: {',
  'integration: "WHATSAPP-BAILEYS",\r\n          groupsIgnore: true,\r\n          webhook: {'
);
code = code.replace(
  'integration: "WHATSAPP-BAILEYS",\n          webhook: {',
  'integration: "WHATSAPP-BAILEYS",\n          groupsIgnore: true,\n          webhook: {'
);
fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
