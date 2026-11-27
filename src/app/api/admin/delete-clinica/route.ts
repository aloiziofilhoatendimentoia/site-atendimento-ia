import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  getSupabaseAdmin,
  parseClinicJson,
  disconnectEvolutionInstances,
  cancelStripeSubscriptionSafe
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

    const { clinicaId, instanceName, cancelStripeSubscription = true } = await request.json();

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
    updatedJson.is_deleted = true;
    updatedJson.is_active = false;
    updatedJson.manual_override_suspended = true;
    updatedJson.suspended_reason = 'exclusao_manual_admin';
    updatedJson.suspended_at = new Date().toISOString();

    let stripeCanceled = false;
    if (cancelStripeSubscription && updatedJson.stripe_subscription_id) {
      stripeCanceled = await cancelStripeSubscriptionSafe(updatedJson.stripe_subscription_id);
      if (stripeCanceled) {
        updatedJson.stripe_status = 'canceled';
      }
    }

    const { error } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .update({ dados_completos_json: JSON.stringify(updatedJson) })
      .eq('id', clinicaId);

    if (error) {
      console.error('Erro ao excluir clínica:', error);
      return NextResponse.json({ error: 'Erro ao atualizar no banco de dados.' }, { status: 500 });
    }

    const evo = await disconnectEvolutionInstances(clinica, updatedJson, instanceName, true);

    return NextResponse.json(
      {
        success: true,
        message: stripeCanceled
          ? 'Clínica excluída, WhatsApp desconectado e assinatura recorrente cancelada na Stripe com sucesso.'
          : 'Clínica excluída e WhatsApp desconectado com sucesso.',
        logoutSuccess: evo.success,
        stripeCanceled
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro na API delete-clinica:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
