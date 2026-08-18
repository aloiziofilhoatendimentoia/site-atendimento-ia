import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aloiziofilho2012@gmail.com';

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

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client não configurado.' }, { status: 500 });
    }

    // Buscar todas as empresas
    const { data: clinicas, error } = await supabase
      .from('CLIENTES ATENDIMENTO IA SITE')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clínicas do supabase:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    // Processar os dados JSON para retornar apenas o necessário para o dashboard
    const clinicasFormatadas = clinicas.map((clinica: any) => {
      let json = {};
      try {
        if (clinica.dados_completos_json) {
          json = JSON.parse(clinica.dados_completos_json);
        }
      } catch (e) {
        console.error('Erro ao fazer parse do JSON', e);
      }

      // @ts-ignore
      const especialistasArr = json.especialistas || [];
      const especialistasStr = Array.isArray(especialistasArr) 
        // @ts-ignore
        ? especialistasArr.map(e => e.nome).join(', ')
        : 'Nenhum cadastrado';

      // @ts-ignore
      let telefoneIA = json.suporte?.whatsapp_empresa || '';
      if (!telefoneIA && clinica.telefone) {
        telefoneIA = clinica.telefone; // Fallback
      }

      return {
        id: clinica.id,
        nome_empresa: clinica.nome_empresa || 'Empresa sem nome',
        nome_empresario: clinica.nome_empresario,
        email: clinica.email,
        telefone: telefoneIA,
        especialistas: especialistasStr || 'Não informado',
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
