import { NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword } = await request.json();

    // Validações básicas de entrada
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'As senhas não coincidem.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de e-mail inválido.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado em nossa plataforma.' },
        { status: 400 }
      );
    }

    // Criar hash da senha
    const senhaHash = hashPassword(password);

    // Criar usuário no banco (híbrido)
    const newUser = await createUser(email, senhaHash);

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso!',
        user: {
          id: newUser.id,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro na API de cadastro:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor ao criar sua conta.' },
      { status: 500 }
    );
  }
}
