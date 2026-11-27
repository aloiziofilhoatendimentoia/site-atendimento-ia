import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export async function sendWelcomeEmail(toEmail: string, customerName?: string, paymentMethod?: 'card' | 'pix') {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
  const SMTP_SECURE = SMTP_PORT === 465;
  const SMTP_USER = process.env.SMTP_USER || '';
  const SMTP_PASS = process.env.SMTP_PASS || '';
  const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `"Atendimento IA Clínicas" <${SMTP_USER}>` : '"Atendimento IA Clínicas" <no-reply@atendimentoiaclinicas.tech>');

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[Email Welcome] Credenciais SMTP_USER/SMTP_PASS não configuradas. E-mail não enviado.');
    return { success: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const name = customerName && customerName.trim() ? customerName.trim() : 'Cliente';
  const metodoTexto = paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'card' ? 'Cartão de Crédito' : 'Stripe';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(90deg, #0d9488, #004A7F); padding: 24px 28px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Bem-vindo(a) à Atendimento IA Clínicas! 🎉</h2>
      </div>

      <div style="padding: 28px;">
        <p style="font-size: 15px; margin-top: 0;">Olá, <strong>${name}</strong>,</p>
        
        <p style="font-size: 15px; line-height: 1.6;">
          Seu pagamento via <strong>${metodoTexto}</strong> foi confirmado com sucesso! Sua clínica acaba de dar um grande passo rumo ao atendimento automatizado 24 horas por dia no WhatsApp integrado ao Google Agenda.
        </p>

        <div style="text-align: center; margin: 26px 0;">
          <a href="https://atendimentoiaclinicas.tech/dashboard" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 8px; font-size: 15px;">
            Acessar Painel da Minha Clínica
          </a>
        </div>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 18px; margin: 22px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; margin-bottom: 6px; color: #92400e; font-size: 14px;">IMPORTANTE SOBRE A CONEXÃO DO WHATSAPP:</h3>
          <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
            A IA funciona diretamente ligada ao WhatsApp da clínica. Caso o WhatsApp da clínica desconecte por algum motivo, basta acessar <a href="https://atendimentoiaclinicas.tech" style="color: #0d9488; font-weight: bold;">https://atendimentoiaclinicas.tech</a>, clicar em <strong>"Acesse sua Clínica"</strong>, entrar com este e-mail e ler o QR Code novamente.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Em anexo a este e-mail, enviamos a cópia oficial dos <strong>Termos de Uso e Adesão</strong> (em formato PDF), conforme aceito eletronicamente no momento da contratação.
        </p>

        <p style="font-size: 14px; margin-bottom: 0;">
          Um abraço,<br/>
          <strong>Equipe Atendimento IA Clínicas</strong>
        </p>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #64748b;">
        <strong>Atendimento IA Clínicas Tecnologia Ltda</strong> — CNPJ: 70.233.704/0001-90<br/>
        Av. Paulista, 2073, Sala 2220, Bela Vista, São Paulo - SP, CEP 01311-940
      </div>
    </div>
  `;

  const pdfPath = path.join(process.cwd(), 'public', 'Termos_de_Uso.pdf');
  const attachments: any[] = [];
  if (fs.existsSync(pdfPath)) {
    attachments.push({
      filename: 'Termos_de_Uso_Atendimento_IA.pdf',
      path: pdfPath,
      contentType: 'application/pdf'
    });
  } else {
    console.warn('[Email Welcome] Arquivo public/Termos_de_Uso.pdf não encontrado no caminho:', pdfPath);
  }

  const mailOptions = {
    from: SMTP_FROM,
    to: toEmail,
    subject: 'Bem-vindo(a) à Atendimento IA Clínicas! + Termos de Uso 🚀',
    html: htmlContent,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Welcome] E-mail de boas-vindas enviado com sucesso para ${toEmail} (${metodoTexto}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Welcome] Erro ao enviar e-mail de boas-vindas:', error);
    throw error;
  }
}
