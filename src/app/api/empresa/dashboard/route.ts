import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getDashboardData } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

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
    const dashboardData = await getDashboardData(user.id);

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
