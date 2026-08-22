import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';
const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
const evoGlobalApiKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Nǜo autorizado' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Sessǜo invǭlida' }, { status: 401 });
    }

    if (!decoded || !decoded.email || decoded.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { clinicaId, is_active, instanceName } = await request.json();

    if (!clinicaId) {
      return NextResponse.json({ error: 'ID da clnica obrigatrio.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase admin client nǜo configurado.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Buscar o JSON atual
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
      .eq('id', clinicaId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return NextResponse.json({ error: 'Erro ao atualizar no banco de dados.' }, { status: 500 });
    }

    // Se estiver suspendendo, desconectar da Evolution API (logout)
    let logoutSuccess = true;
    if (is_active === false && instanceName) {
      try {
        const evoRes = await fetch(`${evoUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evoGlobalApiKey
          }
        });
        if (!evoRes.ok) {
          console.warn(`Aviso: falha ao desconectar instǽncia ${instanceName}. Status: ${evoRes.status}`);
          logoutSuccess = false;
        }
      } catch (evoErr) {
        console.error('Erro de rede ao tentar deslogar instǽncia:', evoErr);
        logoutSuccess = false;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Clnica ${is_active ? 'ativada' : 'suspensa'} com sucesso.`,
      logoutSuccess
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API toggle-status:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
