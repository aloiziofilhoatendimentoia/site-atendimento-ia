const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://api.supabase.atendimentoiaclinicas.tech';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NzYxMDg4MCwiZXhwIjo0OTMzMjg0NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.Iq31bKSZz_XYaTd_XJtJWj1ETP_yd_08LNu6pTzgVB4';

async function registerUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const email = 'aloiziofilho2012@gmail.com';
  
  console.log(`Verificando se o usuário ${email} já existe no banco Supabase...`);
  
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (existingUser) {
    console.log('Usuário já existe no banco:', existingUser);
    return;
  }
  
  console.log(`Registrando usuário ${email} no Supabase de Produção...`);
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([
      { email, senha_hash: 'no_password_otp_only' }
    ])
    .select()
    .single();
    
  if (insertError) {
    console.error('Erro ao registrar usuário:', insertError);
    return;
  }
  
  console.log('Usuário registrado com sucesso:', newUser);
  
  // Criar também uma empresa fictícia vinculada para que o dashboard não quebre ao ler
  console.log('Criando empresa padrão para teste...');
  const { data: newEmpresa, error: empresaError } = await supabase
    .from('empresas')
    .insert([
      {
        user_id: newUser.id,
        nome_empresa: 'Clínica de Teste do Doutor',
        cnpj: '00000000000000',
        nome_empresario: 'Dr. Aloizio',
        cpf: '000.000.000-00',
        nicho: 'Medicina'
      }
    ])
    .select()
    .single();
    
  if (empresaError) {
    console.error('Erro ao registrar empresa:', empresaError);
  } else {
    console.log('Empresa vinculada com sucesso:', newEmpresa);
  }
}

registerUser();
