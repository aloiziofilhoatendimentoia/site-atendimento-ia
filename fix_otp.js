const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/otp/send/route.ts', 'utf8');

const importSupabase = `import { createClient } from '@supabase/supabase-js';\nimport { NextResponse } from 'next/server';`;
code = code.replace(`import { NextResponse } from 'next/server';`, importSupabase);

const activeCheck = `
    if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Este e-mail no est cadastrado.' }, { status: 404 });
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
            .select('is_active')
            .eq('email', email)
            .single();
          
          if (clinica && clinica.is_active === false) {
            return NextResponse.json({ error: 'Sua assinatura encontra-se inativa, contate o suporte.' }, { status: 403 });
          }
        } catch(e) {}
      }
    }
`;

code = code.replace(
  `if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Este e-mail nǜo estǭ cadastrado.' }, { status: 404 });
    }`,
  activeCheck
);

fs.writeFileSync('src/app/api/auth/otp/send/route.ts', code);
console.log("Updated OTP route");
