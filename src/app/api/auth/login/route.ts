import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor, preencha o e-mail e a senha.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = verifyPassword(password, user.senha_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    // Assinar Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expira em 7 dias
    );

    // Criar a resposta de sucesso e definir o Cookie seguro HTTP-Only
    const response = NextResponse.json(
      {
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Definindo o cookie httpOnly de forma segura para sessões persistentes
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na API de login:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor ao tentar efetuar login.' },
      { status: 500 }
    );
  }
}
