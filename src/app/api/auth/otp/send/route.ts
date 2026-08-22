import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { saveOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Por favor, insira seu e-mail.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'atendimentoia35@gmail.com';
    const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();

    // Verificar se o usuário existe
    const user = await getUserByEmail(email);
    if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Este e-mail não está cadastrado.' }, { status: 404 });
    }

    // Gerar um código aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar o código para verificação posterior (expira em 10 minutos)
    saveOTP(email, code);

    // Logs para o desenvolvedor ver no Coolify
    console.log(`[OTP] Código gerado para ${email}: ${code}`);

    // Tentar enviar o e-mail real via SMTP
    const emailSent = await sendOTPEmail(email, code);

    // Se o e-mail foi enviado com sucesso, não mostramos o código na tela por segurança.
    // Caso contrário (SMTP não configurado), retornamos o código para não bloquear o teste em homologação.
    return NextResponse.json({ 
      success: true, 
      message: emailSent ? 'Código enviado para o seu e-mail!' : 'Código gerado para teste.',
      emailSent,
      testCode: !emailSent ? code : undefined
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API de envio de OTP:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor: ' + error.message + '\n' + (error.stack || '')
    }, { status: 500 });
  }
}
