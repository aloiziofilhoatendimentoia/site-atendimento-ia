const fs = require('fs');
let code = fs.readFileSync('src/app/api/admin/clinicas/route.ts', 'utf8');
code = code.replace(
  "status: 'verificando', // serǭ testado no frontend",
  "status: 'verificando', // serǭ testado no frontend\n        is_active: clinica.is_active !== false,"
);
fs.writeFileSync('src/app/api/admin/clinicas/route.ts', code);
