const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const regex = /{clinica.telefone \|\| 'Nǜo Configurado'}\r?\n\s*<\/td>\r?\n\s*<\/tr>/;

if (code.match(regex)) {
  const replacement = `{clinica.telefone || 'Nǜo Configurado'}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(clinica)}
                          className={\`px-3 py-1 rounded text-xs font-bold uppercase transition-colors border \${
                            clinica.is_active !== false
                              ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/50'
                              : 'bg-green-950/30 text-green-400 border-green-900/50 hover:bg-green-900/50'
                          }\`}
                        >
                          {clinica.is_active !== false ? 'Suspender' : 'Ativar'}
                        </button>
                      </td>
                    </tr>`;
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/admin/page.tsx', code);
  console.log("Button injected successfully");
} else {
  console.log("Could not find the target to replace");
}

