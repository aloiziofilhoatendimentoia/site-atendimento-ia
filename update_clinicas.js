const fs = require('fs');

let code = fs.readFileSync('src/app/api/admin/clinicas/route.ts', 'utf8');
code = code.replace(
  'is_active: json.is_active !== false\n      };\n    });\n\n    return NextResponse.json({',
  'is_active: json.is_active !== false,\n        is_deleted: json.is_deleted === true\n      };\n    }).filter(c => !c.is_deleted);\n\n    return NextResponse.json({'
);
fs.writeFileSync('src/app/api/admin/clinicas/route.ts', code);
console.log("Updated clinicas route filter");
