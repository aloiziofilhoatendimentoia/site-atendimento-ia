const fs = require('fs');
const path = require('path');

const sourceFile = 'src/app/api/admin/toggle-status/route.ts';
const targetDir = 'src/app/api/admin/delete-clinica';
const targetFile = path.join(targetDir, 'route.ts');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let code = fs.readFileSync(sourceFile, 'utf8');

// Replace is_active with is_deleted logic
code = code.replace(/const { clinicaId, is_active, instanceName } = await request\.json\(\);/, 'const { clinicaId, instanceName } = await request.json();');
code = code.replace(/updatedJson\.is_active = is_active;/, 'updatedJson.is_deleted = true; updatedJson.is_active = false;');
code = code.replace(/if \(is_active === false && instanceName\) \{/, 'if (instanceName) {');
code = code.replace(/message: `Clnica \$\{is_active \? 'ativada' : 'suspensa'\} com sucesso\.`/, 'message: `Clínica excluída com sucesso.`');
code = code.replace(/Erro na API toggle-status:/, 'Erro na API delete-clinica:');

fs.writeFileSync(targetFile, code);
console.log("Created delete-clinica route.");
