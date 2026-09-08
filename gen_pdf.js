const fs = require('fs');
const execSync = require('child_process').execSync;
const tmpDir = process.env.TEMP + '\\pdf-gen';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

try {
  if (!fs.existsSync(tmpDir + '/package.json')) {
    execSync('npm init -y', { cwd: tmpDir, stdio: 'ignore' });
  }
  if (!fs.existsSync(tmpDir + '/node_modules/pdfkit')) {
    execSync('npm install pdfkit', { cwd: tmpDir, stdio: 'ignore' });
  }
} catch (e) { console.error('Failed to init/install pdfkit'); }

const PDFDocument = require(tmpDir + '/node_modules/pdfkit');
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('public/Termos_de_Uso.pdf'));

doc.fontSize(20).text('TERMOS DE USO - ATENDIMENTO IA CLINICAS', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Estes Termos de Uso regem a utilizacao da plataforma Atendimento IA Clinicas e seus servicos integrados (WhatsApp e Google Agenda).');
doc.moveDown();
doc.fontSize(14).text('1. OBJETO DO SERVICO', { underline: true });
doc.fontSize(12).text('O servico consiste no fornecimento de um Agente de Inteligencia Artificial responsavel por atendimento automatizado via WhatsApp e agendamento de consultas via Google Calendar.');
doc.moveDown();
doc.fontSize(14).text('2. DEVERES DA CLINICA CONTRATANTE', { underline: true });
doc.fontSize(12).text('A CLINICA compromete-se a manter a conexao do WhatsApp ativa. Caso ocorra alguma queda de energia, perda de conexao de internet no aparelho hospedeiro ou se a Inteligencia Artificial for desconectada, EH DE INTEIRA RESPONSABILIDADE DA CLINICA acessar o painel principal do site, clicar em "ACESSE SUA CLINICA" e efetuar uma nova leitura do QR Code para restabelecer o servico.');
doc.moveDown();
doc.fontSize(14).text('3. ASSINATURA E PAGAMENTO', { underline: true });
doc.fontSize(12).text('A assinatura tem carater recorrente (mensal), processada por meio da plataforma Stripe. O servico estara ativo enquanto o pagamento estiver regularizado.');
doc.moveDown();
doc.fontSize(14).text('4. LIMITACAO DE RESPONSABILIDADE', { underline: true });
doc.fontSize(12).text('A Atendimento IA Clinicas nao se responsabiliza por instabilidades nativas nas plataformas de terceiros, tais como falhas nos servidores do WhatsApp (Meta) ou do Google Agenda, que possam impactar temporariamente a comunicacao.');
doc.moveDown();
doc.fontSize(14).text('5. PROTECAO DE DADOS (LGPD)', { underline: true });
doc.fontSize(12).text('A Plataforma atuara apenas como operadora da tecnologia. A CLINICA garante que possui as devidas bases legais para que a Inteligencia Artificial processe os dados de seus pacientes (como nomes, telefones e horarios), isentando a Atendimento IA Clinicas de qualquer responsabilidade sobre a coleta indevida dessas informacoes.');
doc.moveDown();
doc.fontSize(14).text('6. PRAZO E CANCELAMENTO', { underline: true });
doc.fontSize(12).text('A prestacao dos servicos vigora por prazo indeterminado. A CLINICA podera solicitar o cancelamento da assinatura a qualquer momento, sem exigencia de aviso previo ou cobranca de multas de fidelidade. O cancelamento interrompe as cobrancas dos meses seguintes, e o servico permanecera ativo ate o ultimo dia do ciclo mensal ja pago.');
doc.moveDown();
doc.fontSize(12).text('Ao realizar o pagamento e aderir ao plano, a CLINICA declara estar ciente e de pleno acordo com todas as condicoes supracitadas.', { align: 'justify' });

doc.end();
console.log('PDF created successfully!');
