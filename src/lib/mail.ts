import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"Atendimento IA" <no-reply@atendimentoiaclinicas.tech>';

export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  console.log(`[Email] Iniciando envio de e-mail para ${email} com o código ${code}...`);

  // Se as credenciais básicas de SMTP não estiverem preenchidas, pulamos o disparo de rede real
  // e logamos para fins de teste. Mas se estiverem, enviamos por e-mail real!
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] Credenciais de SMTP (SMTP_USER/SMTP_PASS) não configuradas. E-mail real não enviado.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: `Código de Acesso - Atendimento IA: ${code}`,
      text: `Olá! Seu código de verificação temporário para acessar o painel da sua clínica é: ${code}\n\nEste código expira em 10 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #0d9488; text-align: center; margin-bottom: 20px;">Acesso ao Painel Atendimento IA</h2>
          <p>Olá,</p>
          <p>Seu código de verificação temporário para acessar o painel administrativo da sua clínica foi gerado.</p>
          <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">
            ${code}
          </div>
          <p style="color: #4b5563; font-size: 14px;">Este código é de uso único e expira em <strong>10 minutos</strong>. Se você não solicitou este código, por favor desconsidere este e-mail.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 0;">Atendimento IA © 2026. Todos os direitos reservados.</p>
        </div>
      `,
    });

    console.log(`[Email] E-mail enviado com sucesso: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[Email] Falha ao enviar e-mail SMTP:', err);
    return false;
  }
}
