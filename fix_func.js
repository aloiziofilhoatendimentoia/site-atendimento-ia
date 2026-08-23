const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const regex = /async function handleToggleStatus\([\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\}/;

const fixedFunction = `async function handleToggleStatus(clinica: any) {
    const currentActive = clinica.is_active !== false; // if undefined, it's true
    if (!confirm(\`Tem certeza que deseja \${currentActive ? 'SUSPENDER' : 'ATIVAR'} a clnica \${clinica.nome_empresa}?\`)) return;
    try {
      setLoading(true);
      const instanceName = clinica.telefone ? clinica.telefone.replace(/\\D/g, '') : null;
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicaId: clinica.id,
          is_active: !currentActive,
          instanceName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status');
      
      // Update local state
      setClinicas(prev => prev.map(c => c.id === clinica.id ? { ...c, is_active: !currentActive } : c));
      alert(data.message);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }`;

code = code.replace(regex, fixedFunction);
fs.writeFileSync('src/app/admin/page.tsx', code);
console.log("Entire handleToggleStatus rewritten!");
