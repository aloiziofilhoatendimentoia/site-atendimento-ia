const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

code = code.replace(
  "if (!confirm(`Tem certeza que deseja ${clinica.is_active ? 'SUSPENDER' : 'ATIVAR'} a clnica \\n${clinica.nome_empresa}?`)) return;",
  "const currentActive = clinica.is_active !== false;\n      if (!confirm(`Tem certeza que deseja ${currentActive ? 'SUSPENDER' : 'ATIVAR'} a clinica ${clinica.nome_empresa}?`)) return;"
);

code = code.replace(
  "is_active: !clinica.is_active,",
  "is_active: !currentActive,"
);

code = code.replace(
  "setClinicas(prev => prev.map(c => c.id === clinica.id ? { ...c, is_active: !clinica.is_active } : c));",
  "setClinicas(prev => prev.map(c => c.id === clinica.id ? { ...c, is_active: !currentActive } : c));"
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log("Fixed handleToggleStatus logic");
