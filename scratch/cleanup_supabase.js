const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://api.supabase.atendimentoiaclinicas.tech';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NzYxMDg4MCwiZXhwIjo0OTMzMjg0NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.Iq31bKSZz_XYaTd_XJtJWj1ETP_yd_08LNu6pTzgVB4';

async function cleanAndTest() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Limpar TODOS os registros de teste anteriores
  console.log('=== LIMPANDO REGISTROS ANTERIORES ===');
  const { data: all, error: listErr } = await supabase
    .from('CLIENTES ATENDIMENTO IA SITE')
    .select('id, nome_clinica, telefone_principal');

  if (listErr) {
    console.error('Erro ao listar:', listErr);
    return;
  }

  console.log(`Total de registros encontrados: ${all.length}`);
  all.forEach(r => console.log(`- ID: ${r.id} | ${r.nome_clinica} | ${r.telefone_principal}`));

  if (all.length > 0) {
    const ids = all.map(r => r.id);
    const { error: delErr } = await supabase
      .from('CLIENTES ATENDIMENTO IA SITE')
      .delete()
      .in('id', ids);

    if (delErr) {
      console.error('Erro ao deletar:', delErr);
    } else {
      console.log(`\n✅ ${ids.length} registro(s) deletado(s) com sucesso!`);
    }
  }

  // Verificar estado final
  const { data: final } = await supabase
    .from('CLIENTES ATENDIMENTO IA SITE')
    .select('*');
  console.log(`\nTabela agora tem ${final?.length || 0} registro(s). Pronto para os testes!`);
}

cleanAndTest();
