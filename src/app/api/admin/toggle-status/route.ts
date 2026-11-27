import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  getSupabaseAdmin,
  parseClinicJson,
  disconnectEvolutionInstances
} from '@/lib/clinic-lifecycle';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    if (!decoded || !decoded.email || decoded.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { clinicaId, is_active, instanceName } = await request.json();

    if (!clinicaId) {
      return NextResponse.json({ error: 'ID da clínica obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client não configurado.' }, { status: 500 });
    }

    const { data: clinica } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .select('*')
      .eq('id', clinicaId)
      .single();

    const updatedJson = parseClinicJson(clinica?.dados_completos_json);
    updatedJson.is_active = Boolean(is_active);

    if (is_active === false) {
      updatedJson.manual_override_suspended = true;
      updatedJson.suspended_reason = 'suspensao_manual_admin';
      updatedJson.suspended_at = new Date().toISOString();
    } else {
      updatedJson.is_deleted = false;
      delete updatedJson.manual_override_suspended;
      delete updatedJson.suspended_reason;
      delete updatedJson.suspended_at;
    }

    const { error } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .update({ dados_completos_json: JSON.stringify(updatedJson) })
      .eq('id', clinicaId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return NextResponse.json({ error: 'Erro ao atualizar no banco de dados.' }, { status: 500 });
    }

    let logoutSuccess = true;
    if (is_active === false) {
      const evo = await disconnectEvolutionInstances(clinica, updatedJson, instanceName, false);
      logoutSuccess = evo.success;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Clínica ${is_active ? 'ativada' : 'suspensa'} manualmente com sucesso.`,
        logoutSuccess
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro na API toggle-status:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
