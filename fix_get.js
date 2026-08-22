const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

const oldLogic = `          if (whatsappParam) {
            const clean = whatsappParam.replace(/\\D/g, '');
            query = query.or(\`telefone_principal.eq.\${whatsappParam},telefone_principal.eq.\${clean},telefone_principal.eq.55\${clean}\`);
          } else if (emailToUse) {
            query = query.eq('email', emailToUse);
          }`;

const newLogic = `          if (emailToUse) {
            query = query.eq('email', emailToUse);
          } else if (whatsappParam) {
            const clean = whatsappParam.replace(/\\D/g, '');
            query = query.or(\`telefone_principal.eq.\${whatsappParam},telefone_principal.eq.\${clean},telefone_principal.eq.55\${clean}\`);
          }`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
  console.log("Updated query logic successfully");
} else {
  console.log("Old logic not found in exactly this format");
}
