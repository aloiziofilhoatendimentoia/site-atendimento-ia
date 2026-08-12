import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getDashboardData } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

import { createClient } from '@supabase/supabase-js';

// GET /api/empresa/dashboard - Retorna todas as configurações da empresa do usuário autenticado
export async function GET() {
  try {
    // 1. Validar autenticação do usuário
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
    }

    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não localizado.' }, { status: 401 });
    }

    // 2. Buscar todos os dados integrados do painel
    let dashboardData = await getDashboardData(user.id);

    // Fallback Supabase: Se não houver dados no banco local, busca a clínica salva no Supabase
    if (!dashboardData || !dashboardData.empresa) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
          const { data: clinics } = await supabaseAdmin
            .from('CLIENTES ATENDIMENTO IA SITE')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

          if (clinics && clinics.length > 0) {
            const c = clinics[0];
            dashboardData = {
              empresa: {
                id: String(c.id),
                nome_empresa: c.nome_clinica || 'Minha Clínica',
                cnpj: '00.000.000/0001-00',
                nome_empresario: 'Doutor(a)',
                cpf: '000.000.000-00',
                nicho: 'Médico'
              },
              suporte: {
                dias_funcionamento: 'seg,ter,qua,qui,sex',
                horario_funcionamento: '08:00 - 18:00',
                endereco: c.endereco || 'Endereço da Clínica',
                whatsapp_empresa: c.telefone_principal || '',
                telefone_suporte: c.telefone_principal || ''
              },
              agendamento: {
                usa_whatsapp: true,
                usa_google_calendar: false,
                whatsapp_agendamento: c.telefone_principal || ''
              },
              venda: { link_pagamento: '', chave_pix: '' },
              servicos: c.especialistas ? [{ servico: c.especialistas, valor: 0 }] : [],
              googleIntegration: null
            };
          }
        } catch (err) {
          console.error("Erro ao buscar Supabase fallback no dashboard:", err);
        }
      }
    }

    if (!dashboardData) {
      return NextResponse.json({
        success: false,
        message: 'Nenhuma empresa cadastrada para este usuário.'
      }, { status: 200 });
    }

    // 3. Retornar dados completos
    return NextResponse.json({
      success: true,
      data: {
        empresa: dashboardData.empresa,
        suporte: dashboardData.suporte,
        agendamento: dashboardData.agendamento,
        venda: dashboardData.venda,
        servicos: dashboardData.servicos,
        googleIntegration: dashboardData.googleIntegration
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de dados do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
