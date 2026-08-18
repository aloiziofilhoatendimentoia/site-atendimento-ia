const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: err1 } = await supabase.from('users').select('*').limit(1);
  if (err1) console.log("users table missing or error:", err1.message);
  else console.log("users table exists!", users);

  const { data: empresas, error: err2 } = await supabase.from('empresas').select('*').limit(1);
  if (err2) console.log("empresas table missing or error:", err2.message);
  else console.log("empresas table exists!", empresas);
}
run();
