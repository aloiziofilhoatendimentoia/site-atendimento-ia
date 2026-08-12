const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://api.supabase.atendimentoiaclinicas.tech';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NzYxMDg4MCwiZXhwIjo0OTMzMjg0NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.Iq31bKSZz_XYaTd_XJtJWj1ETP_yd_08LNu6pTzgVB4';

async function deleteUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const email = 'aloiziofilho2012@gmail.com';
  
  console.log(`Buscando ID do usuário ${email}...`);
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
    
  if (findError || !user) {
    console.log('Usuário não encontrado ou já deletado.');
    return;
  }
  
  console.log(`Deletando empresas associadas ao user_id ${user.id}...`);
  await supabase.from('empresas').delete().eq('user_id', user.id);
  
  console.log(`Deletando usuário ${email}...`);
  const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id);
  
  if (deleteError) {
    console.error('Erro ao deletar usuário:', deleteError);
  } else {
    console.log('Usuário deletado com sucesso do banco de produção!');
  }
}

deleteUser();
