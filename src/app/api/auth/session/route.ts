import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getEmpresaByUserId } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

// GET /api/auth/session - Retorna o usuário logado atualmente e dados de sua empresa
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Verificar e decodificar token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (e) {
      // Token inválido ou expirado - remove o cookie
      const response = NextResponse.json({ authenticated: false, message: 'Sessão expirada' }, { status: 200 });
      response.cookies.delete('auth_token');
      return response;
    }

    if (!decoded || !decoded.email) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';
    const isAdmin = decoded.email.toLowerCase() === adminEmail.toLowerCase();

    // Buscar dados do usuário no banco
    const user = await getUserByEmail(decoded.email);
    if (!user && !isAdmin) {
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      response.cookies.delete('auth_token');
      return response;
    }

    // Buscar empresa associada (só se user existir)
    const empresa = user ? await getEmpresaByUserId(user.id) : null;

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      user: {
        id: user ? user.id : 'admin-master-id',
        email: decoded.email,
      },
      empresa: empresa || null,
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de sessão:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

// DELETE /api/auth/session - Efetua o Logout limpando o cookie de sessão
export async function DELETE() {
  try {
    const response = NextResponse.json({ message: 'Logout efetuado com sucesso.' }, { status: 200 });
    response.cookies.delete('auth_token');
    return response;
  } catch (error) {
    console.error('Erro ao deslogar:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao tentar deslogar.' }, { status: 500 });
  }
}
