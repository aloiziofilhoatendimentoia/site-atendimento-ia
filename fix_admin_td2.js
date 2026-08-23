const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const regex = /({clinica\.telefone[^}]*})[\s\S]*?<\/td>[\s\S]*?<\/tr>/;

if (code.match(regex)) {
  const replacement = `$1
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
  
  // also fix colSpan=4 to colSpan=5
  code = code.replace(/colSpan=\{4\}/, 'colSpan={5}');
  
  fs.writeFileSync('src/app/admin/page.tsx', code);
  console.log("Button injected successfully");
} else {
  console.log("Could not find the target to replace");
}

