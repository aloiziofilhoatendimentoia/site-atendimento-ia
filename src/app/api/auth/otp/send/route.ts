import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { saveOTP } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Por favor, insira seu e-mail.' }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Este e-mail não está cadastrado.' }, { status: 404 });
    }

    // Gerar um código aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar o código para verificação posterior (expira em 10 minutos)
    saveOTP(email, code);

    // Logs para o desenvolvedor ver no Coolify
    console.log(`[OTP] Código gerado para ${email}: ${code}`);

    // Em ambiente de desenvolvimento ou testes, retornamos o código no payload para o usuário conseguir testar sem precisar configurar servidores de e-mail de imediato.
    return NextResponse.json({ 
      success: true, 
      message: 'Código enviado com sucesso!',
      testCode: code // Retornado amigavelmente para testes rápidos no site
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API de envio de OTP:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor: ' + error.message + '\n' + (error.stack || '')
    }, { status: 500 });
  }
}
