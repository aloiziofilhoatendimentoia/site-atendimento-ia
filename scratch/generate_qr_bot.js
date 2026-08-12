async function generateQr() {
  const evolutionUrl = 'https://api-whatsapp.atendimentoiaclinicas.tech';
  const evolutionKey = 'atendimentoia_mestre_evolution_2026';
  const instanceName = 'NumeroDeTestes';

  try {
    console.log(`1. Deletando instância "${instanceName}"...`);
    await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': evolutionKey }
    });
    console.log('Deletado.');

    console.log(`\n2. Criando instância com QR Code ativado...`);
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
    
    // QR Code pode vir em diferentes formatos
    const base64 = createData?.qrcode?.base64 || createData?.base64 || '';
    const pngUrl = createData?.qrcode?.url || '';
    
    if (base64) {
      console.log('\n✅ QR Code gerado com sucesso!');
      console.log('Para testar: salve o base64 a seguir e abra num decodificador');
      // Gravar o base64 em um arquivo HTML para o usuário abrir
      const fs = require('fs');
      const html = `<!DOCTYPE html><html><body style="background:#000;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
        <div style="background:#fff;padding:20px;border-radius:10px;text-align:center">
          <h2 style="font-family:sans-serif">QR Code para Reconectar o WhatsApp Bot</h2>
          <p style="font-family:sans-serif;color:#666">Escaneie este código com o número <strong>81 99546-2240</strong></p>
          <img src="${base64}" style="width:300px;height:300px"/>
          <p style="font-family:sans-serif;color:#f44">Este código expira em ~60 segundos</p>
        </div>
      </body></html>`;
      fs.writeFileSync('scratch/qrcode_bot.html', html);
      console.log('\n📄 QR Code HTML gerado em: scratch/qrcode_bot.html');
      console.log('Abra esse arquivo no navegador e escaneie com o celular!');
    } else {
      console.log('Resposta da API:', JSON.stringify(createData, null, 2));
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

generateQr();
