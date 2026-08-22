const fs = require('fs');
let code = fs.readFileSync('src/app/api/admin/toggle-status/route.ts', 'utf8');

const regex = /\/\/ Atualizar status no Supabase[\s\S]*?\.eq\('id', clinicaId\);/;
const replacement = `    // Buscar o JSON atual
    const { data: clinica } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .select('dados_completos_json')
      .eq('id', clinicaId)
      .single();

    let updatedJson = {};
    if (clinica && clinica.dados_completos_json) {
      try {
        updatedJson = typeof clinica.dados_completos_json === 'string' ? JSON.parse(clinica.dados_completos_json) : clinica.dados_completos_json;
      } catch (e) {}
    }
    updatedJson.is_active = is_active;

    // Atualizar status no Supabase via JSON
    const { error } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .update({ dados_completos_json: updatedJson })
      .eq('id', clinicaId);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/admin/toggle-status/route.ts', code);
console.log("Updated toggle-status route to update JSON");
