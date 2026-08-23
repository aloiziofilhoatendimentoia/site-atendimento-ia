const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/otp/send/route.ts', 'utf8');

const regex = /\/\/ Verificar se o usu.rio existe[\s\S]*?status: 404 \}\);\s*\}/;

const replacement = `    // Verificar se o usuǭrio existe
    const user = await getUserByEmail(email);
    if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Este e-mail n\\u01D0o est\\u01ED cadastrado.' }, { status: 404 });
    }

    // CHECK IF ACTIVE
    if (!isAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
          const { data: clinica } = await supabaseAdmin
            .from('CLIENTES ATENDIMENTO IA SITE')
            .select('dados_completos_json')
            .eq('email', email)
            .single();
          
          let isActive = true;
          if (clinica && clinica.dados_completos_json) {
            try {
              const parsed = typeof clinica.dados_completos_json === 'string' ? JSON.parse(clinica.dados_completos_json) : clinica.dados_completos_json;
              if (parsed.is_active === false) isActive = false;
            } catch(e){}
          }
          if (isActive === false) {
            return NextResponse.json({ error: 'Sua assinatura encontra-se inativa, contate o suporte.' }, { status: 403 });
          }
        } catch(e) {}
      }
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/auth/otp/send/route.ts', code);
console.log("Injected active block successfully");
