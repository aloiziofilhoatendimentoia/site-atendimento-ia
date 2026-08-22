const fs = require('fs');
let code = fs.readFileSync('src/app/api/admin/clinicas/route.ts', 'utf8');

code = code.replace(
  "is_active: clinica.is_active !== false,",
  "is_active: json.is_active !== false,"
);

fs.writeFileSync('src/app/api/admin/clinicas/route.ts', code);
console.log("Updated admin clinicas route to read from JSON");
