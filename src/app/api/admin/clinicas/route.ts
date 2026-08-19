import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';

export async function GET() {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase admin client não configurado.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as empresas
    const { data: clinicas, error } = await supabaseAdmin
      .from('CLIENTES ATENDIMENTO IA SITE')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clínicas do supabase:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    // Processar os dados JSON para retornar apenas o necessário para o dashboard
    const clinicasFormatadas = clinicas.map((clinica: any) => {
      let json: any = {};
      try {
        if (clinica.dados_completos_json) {
          json = typeof clinica.dados_completos_json === 'string'
            ? JSON.parse(clinica.dados_completos_json)
            : clinica.dados_completos_json;
        }
      } catch (e) {
        console.error('Erro ao fazer parse do JSON', e);
      }

      // Buscar especialistas em todos os formatos possíveis
      const especialistasArr = json.clinica?.especialistas || json.especialistas || [];
      let especialistasStr = '';
      if (Array.isArray(especialistasArr) && especialistasArr.length > 0) {
        especialistasStr = especialistasArr
          .map((e: any) => {
            if (!e) return '';
            if (typeof e === 'string') return e;
            const nome = e.nome || '';
            const esp = e.especialidade || '';
            if (nome && esp) return `${nome} (${esp})`;
            return nome || esp || '';
          })
          .filter(Boolean)
          .join(', ');
      }

      // Fallback para a coluna direta do Supabase
      if (!especialistasStr && clinica.especialistas) {
        especialistasStr = String(clinica.especialistas)
          .split('\n')
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(Boolean)
          .join(', ');
      }

      if (!especialistasStr) {
        especialistasStr = 'Não informado';
      }

      // Buscar WhatsApp oficial da IA
      let telefoneIA = json.clinica?.whatsappClinica || json.suporte?.whatsapp_empresa || clinica.telefone_principal || clinica.telefone || '';

      return {
        id: clinica.id,
        nome_empresa: clinica.nome_clinica || clinica.nome_empresa || json.clinica?.nomeClinica || 'Empresa sem nome',
        nome_empresario: clinica.nome_empresario || json.clinica?.nomeEmpresario || '',
        email: clinica.email || json.ownerEmail || '',
        telefone: telefoneIA,
        especialistas: especialistasStr,
        status: 'verificando', // será testado no frontend
        created_at: clinica.created_at
      };
    });

    return NextResponse.json({ 
      success: true, 
      clinicas: clinicasFormatadas 
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API admin:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
