const fs = require('fs');

async function generateAndSaveQr() {
  const evolutionUrl = 'https://api-whatsapp.atendimentoiaclinicas.tech';
  const evolutionKey = 'atendimentoia_mestre_evolution_2026';
  const instanceName = 'NumeroDeTestes';

  try {
    console.log(`1. Deletando instância "${instanceName}"...`);
    await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': evolutionKey }
    });

    console.log(`2. Criando instância com QR Code...`);
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });

    const createData = await createRes.json();
    const base64 = createData?.qrcode?.base64 || createData?.base64 || '';
    
    if (base64 && base64.startsWith('data:image')) {
      const pngData = base64.replace('data:image/png;base64,', '');
      fs.writeFileSync('scratch/qr_fresh.png', Buffer.from(pngData, 'base64'));
      console.log('SUCESSO: QR Code salvo em scratch/qr_fresh.png');
    } else {
      console.log('Sem base64. Dados:', JSON.stringify(createData, null, 2));
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

generateAndSaveQr();
