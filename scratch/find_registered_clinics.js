const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://api.supabase.atendimentoiaclinicas.tech';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NzYxMDg4MCwiZXhwIjo0OTMzMjg0NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.Iq31bKSZz_XYaTd_XJtJWj1ETP_yd_08LNu6pTzgVB4';

async function findClinics() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data, error } = await supabase
    .from('CLIENTES ATENDIMENTO IA SITE')
    .select('*')
    .or('telefone_principal.like.%99546%,telefone_principal.like.%99594%');
    
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Resultados encontrados:');
    console.log(JSON.stringify(data, null, 2));
  }
}

findClinics();
