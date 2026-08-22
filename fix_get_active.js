const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

const regex = /is_active: siteClinic\?\.is_active !== false,/;
const replacement = `is_active: (() => {
          try {
            const parsed = typeof siteClinic?.dados_completos_json === 'string' ? JSON.parse(siteClinic.dados_completos_json) : (siteClinic?.dados_completos_json || {});
            return parsed.is_active !== false;
          } catch(e) { return true; }
        })(),`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
console.log("Updated config GET route to read is_active from JSON");
