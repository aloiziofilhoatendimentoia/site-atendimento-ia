import nodemailer from 'nodemailer';
import path from 'path';

// Configuracao do transporter usando SMTP.
// Recomenda-se colocar essas variaveis no .env.local
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER, // Ex: contato@atendimentoiaclinicas.tech
    pass: process.env.SMTP_PASS, // Senha do email oficial
  },
});

export async function sendWelcomeEmail(toEmail: string, customerName?: string) {
  const name = customerName ? customerName : 'Cliente';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d6efd;">Bem-vindo(a) à Atendimento IA Clínicas! 🎉</h2>
      
      <p>Olá, <strong>${name}</strong>,</p>
      
      <p>Parabéns pela excelente escolha! Sua clínica acaba de dar um grande passo rumo à inovação. Nosso Agente de IA integrado ao WhatsApp e Google Agenda já está pronto para otimizar seus agendamentos.</p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">IMPORTANTE:</h3>
        <p style="margin-bottom: 0; color: #856404;">
          A IA funciona diretamente ligada ao whatsapp. Caso o dispositivo desconecte de alguma forma basta acessar o nosso site <a href="https://atendimentoiaclinicas.tech" style="color: #0d6efd; text-decoration: underline;">https://atendimentoiaclinicas.tech</a> clique em "Acesse sua cl&iacute;nica" e fa&ccedil;a a conex&atilde;o novamente.
        </p>
      </div>

      <p>Em anexo a este e-mail, você encontra os <strong>Termos de Uso e Adesão</strong> do nosso serviço (em formato PDF), conforme acordado no momento da assinatura.</p>

      <p>Estamos muito felizes em ter sua clínica conosco!</p>
      
      <p>Um abraço,<br/><strong>Equipe Atendimento IA Clínicas</strong></p>
    </div>
  `;

  // Caminho para o PDF gerado
  const pdfPath = path.join(process.cwd(), 'public', 'Termos_de_Uso.pdf');

  const mailOptions = {
    from: `"Atendimento IA Clínicas" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Bem-vindo(a) à Atendimento IA Clínicas! + Termos de Uso 🚀',
    html: htmlContent,
    attachments: [
      {
        filename: 'Termos_de_Uso_Atendimento_IA.pdf',
        path: pdfPath,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar e-mail de boas-vindas:', error);
    throw error;
  }
}
