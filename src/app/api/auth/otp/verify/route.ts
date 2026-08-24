import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { verifyOTP } from '@/lib/otp';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Faltando e-mail ou código.' }, { status: 400 });
    }

    // Verificar se o OTP é válido
    const isValid = verifyOTP(email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Código de verificação inválido ou expirado.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';
    const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();

    // Obter o usuário correspondente
    const user = await getUserByEmail(email);
    if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const userId = user ? user.id : 'admin-master-id';

    // Assinar Token JWT (igual ao login padrão)
    const token = jwt.sign(
      { id: userId, email: email },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expira em 7 dias
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login OTP realizado com sucesso!',
      user: {
        id: userId,
        email: email,
      }
    }, { status: 200 });

    // Definir o cookie seguro httpOnly para persistência de sessão do usuário
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Erro na API de verificação de OTP:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
