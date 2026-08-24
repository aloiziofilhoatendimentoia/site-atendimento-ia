const fs = require('fs');
let code = fs.readFileSync('src/app/api/admin/clinicas/route.ts', 'utf8');

const regex = /status: 'verificando', \/\/ ser. testado no frontend\r?\n\s*created_at: clinica\.created_at\r?\n\s*\};/;

const replacement = `status: 'verificando', // ser\u01ED testado no frontend
        created_at: clinica.created_at,
        is_active: json.is_active !== false
      };`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/api/admin/clinicas/route.ts', code);
  console.log("Added is_active to clinicas route");
} else {
  console.log("Regex didn't match.");
}
