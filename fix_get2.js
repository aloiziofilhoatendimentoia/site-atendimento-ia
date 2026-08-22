const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

code = code.replace(
  /if \(whatsappParam\) \{[\s\S]*?\} else if \(emailToUse\) \{[\s\S]*?\}/,
  `if (emailToUse) {
            query = query.eq('email', emailToUse);
          } else if (whatsappParam) {
            const clean = whatsappParam.replace(/\\D/g, '');
            query = query.or(\`telefone_principal.eq.\${whatsappParam},telefone_principal.eq.\${clean},telefone_principal.eq.55\${clean}\`);
          }`
);

fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
console.log("Updated");
