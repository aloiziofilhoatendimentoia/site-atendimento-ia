const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

const regex = /const fullJsonString = JSON\.stringify\(payload\);/;
const replacement = `
        let currentIsActive = true;
        if (existing?.dados_completos_json) {
          try {
            const parsed = typeof existing.dados_completos_json === 'string' ? JSON.parse(existing.dados_completos_json) : existing.dados_completos_json;
            if (parsed.is_active === false) currentIsActive = false;
          } catch(e){}
        }
        payload.is_active = currentIsActive;
        const fullJsonString = JSON.stringify(payload);
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
console.log("Updated config route to preserve is_active in JSON");
