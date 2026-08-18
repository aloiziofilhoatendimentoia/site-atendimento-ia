const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching clinics from CLIENTES ATENDIMENTO IA SITE...");
  const { data, error } = await supabase
    .from('CLIENTES ATENDIMENTO IA SITE')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data.length} clinics. Latest ones:`);
  data.forEach((row, idx) => {
    console.log(`\n--- Clinic ${idx + 1} ---`);
    console.log(`Columns in DB: ${Object.keys(row).join(', ')}`);
  });

  console.log("\nTesting getUserByEmail logic...");
  const emailToTest = 'aloiziofilho2012@gmail.com';
  
  const clienteFound = data.find((c) => {
    if (!c.dados_completos_json) return false;
    try {
      const json = typeof c.dados_completos_json === 'string' ? JSON.parse(c.dados_completos_json) : c.dados_completos_json;
      return json.ownerEmail && json.ownerEmail.toLowerCase() === emailToTest.toLowerCase();
    } catch(err) { return false; }
  });

  if (clienteFound) {
    console.log(`SUCCESS: Found user ${emailToTest} in CLIENTES ATENDIMENTO IA SITE (ID: ${clienteFound.id})`);
  } else {
    console.log(`FAILED: Could not find user ${emailToTest} in the latest 5 rows.`);
    
    // Search the whole table just in case
    console.log("Searching the whole table for the email...");
    const { data: allData } = await supabase.from('CLIENTES ATENDIMENTO IA SITE').select('id, dados_completos_json');
    const foundInAll = allData?.find((c) => {
      if (!c.dados_completos_json) return false;
      try {
        const json = typeof c.dados_completos_json === 'string' ? JSON.parse(c.dados_completos_json) : c.dados_completos_json;
        return json.ownerEmail && json.ownerEmail.toLowerCase() === emailToTest.toLowerCase();
      } catch(err) { return false; }
    });
    
    if (foundInAll) {
      console.log(`Found in whole table: ID ${foundInAll.id}`);
    } else {
      console.log(`Still NOT FOUND in whole table!`);
    }
  }
}

run();
