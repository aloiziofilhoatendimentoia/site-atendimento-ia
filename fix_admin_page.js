const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// Add handleToggleStatus function
const handleToggleLogic = `  async function handleToggleStatus(clinica: any) {
    if (!confirm(\`Tem certeza que deseja \${clinica.is_active ? 'SUSPENDER' : 'ATIVAR'} a clnica \${clinica.nome_empresa}?\`)) return;
    try {
      setLoading(true);
      const instanceName = clinica.telefone ? clinica.telefone.replace(/\\D/g, '') : null;
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicaId: clinica.id,
          is_active: !clinica.is_active,
          instanceName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status');
      
      // Update local state
      setClinicas(prev => prev.map(c => c.id === clinica.id ? { ...c, is_active: !clinica.is_active } : c));
      alert(data.message);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadClinicas() {`;

code = code.replace("  async function loadClinicas() {", handleToggleLogic);

// Add Acoes header
code = code.replace(
  '<th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-48">WhatsApp da IA</th>',
  '<th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-48">WhatsApp da IA</th>\n                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Acoes</th>'
);

// Add Button cell
const tdContent = `</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(clinica)}
                        className={\`px-3 py-1 rounded text-xs font-bold uppercase transition-colors border \${
                          clinica.is_active
                            ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/50'
                            : 'bg-green-950/30 text-green-400 border-green-900/50 hover:bg-green-900/50'
                        }\`}
                      >
                        {clinica.is_active ? 'Suspender' : 'Ativar'}
                      </button>
                    </td>
                  </tr>`;

code = code.replace(
  '</td>\n                  </tr>',
  tdContent
);

// Add visual indicator to name
code = code.replace(
  '<span className="font-bold text-white block">{clinica.nome_empresa}</span>',
  '<span className="font-bold text-white block">{clinica.nome_empresa} {clinica.is_active === false && <span className="text-red-500 text-[10px] uppercase ml-2 bg-red-950/50 px-2 py-0.5 rounded border border-red-900">(Suspensa)</span>}</span>'
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log("Updated admin page");
