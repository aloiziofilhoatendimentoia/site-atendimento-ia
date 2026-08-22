const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/otp/send/route.ts', 'utf8');

const regex = /\.select\('is_active'\)[\s\S]*?\.single\(\);[\s\S]*?if \(clinica && clinica\.is_active === false\) \{/;
const replacement = `.select('dados_completos_json')
            .eq('email', email)
            .single();
          
          let isActive = true;
          if (clinica && clinica.dados_completos_json) {
            try {
              const parsed = typeof clinica.dados_completos_json === 'string' ? JSON.parse(clinica.dados_completos_json) : clinica.dados_completos_json;
              if (parsed.is_active === false) isActive = false;
            } catch(e){}
          }
          if (isActive === false) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/auth/otp/send/route.ts', code);
console.log("Updated OTP route to read from JSON");
