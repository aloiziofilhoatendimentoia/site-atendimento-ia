import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';
const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
const evoGlobalApiKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

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

    const { clinicaId, instanceName } = await request.json();

    if (!clinicaId) {
      return NextResponse.json({ error: 'ID da clínica obrigatório.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase admin client não configurado.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o registro atual da clínica
    const { data: clinica } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .select('*')
      .eq('id', clinicaId)
      .single();

    let updatedJson: any = {};
    if (clinica && clinica.dados_completos_json) {
      try {
        updatedJson = typeof clinica.dados_completos_json === 'string' ? JSON.parse(clinica.dados_completos_json) : clinica.dados_completos_json;
      } catch (e) {}
    }
    updatedJson.is_deleted = true; 
    updatedJson.is_active = false;

    // Atualizar status no Supabase via JSON
    const { error } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .update({ dados_completos_json: updatedJson })
      .eq('id', clinicaId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return NextResponse.json({ error: 'Erro ao atualizar no banco de dados.' }, { status: 500 });
    }

    // Desconectar e remover instâncias associadas na Evolution API
    let logoutSuccess = true;
    const candidates = new Set<string>();
    if (instanceName) candidates.add(String(instanceName).replace(/\D/g, ''));
    if (clinica?.telefone_principal) candidates.add(String(clinica.telefone_principal).replace(/\D/g, ''));
    if (updatedJson?.clinica?.whatsappClinica) candidates.add(String(updatedJson.clinica.whatsappClinica).replace(/\D/g, ''));
    if (updatedJson?.suporte?.whatsapp_empresa) candidates.add(String(updatedJson.suporte.whatsapp_empresa).replace(/\D/g, ''));

    try {
      const fetchRes = await fetch(`${evoUrl}/instance/fetchInstances`, {
        headers: { 'apikey': evoGlobalApiKey }
      });
      if (fetchRes.ok) {
        const allInst: any[] = await fetchRes.json();
        for (const inst of allInst) {
          const instClean = String(inst.name || '').replace(/\D/g, '');
          const ownerClean = String(inst.ownerJid || '').replace(/\D/g, '');
          for (const c of candidates) {
            if (!c) continue;
            if (instClean === c || ownerClean === c || instClean.endsWith(c) || c.endsWith(instClean) || ownerClean.endsWith(c) || c.endsWith(ownerClean)) {
              candidates.add(inst.name);
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao listar instâncias no delete-clinica:', e);
    }

    for (const instName of candidates) {
      if (!instName) continue;
      try {
        await fetch(`${evoUrl}/instance/logout/${instName}`, {
          method: 'DELETE',
          headers: { 'apikey': evoGlobalApiKey }
        });
        await fetch(`${evoUrl}/instance/delete/${instName}`, {
          method: 'DELETE',
          headers: { 'apikey': evoGlobalApiKey }
        });
        console.log(`[delete-clinica] Desconectado e deletado da Evolution API: ${instName}`);
      } catch (evoErr) {
        console.error(`Erro ao deslogar/deletar instância ${instName}:`, evoErr);
        logoutSuccess = false;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Clínica excluída com sucesso.`,
      logoutSuccess
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API delete-clinica:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
