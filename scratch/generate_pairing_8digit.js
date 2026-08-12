async function setupMaster8Digit() {
  const evolutionUrl = 'https://api-whatsapp.atendimentoiaclinicas.tech';
  const evolutionKey = 'atendimentoia_mestre_evolution_2026';
  const instanceName = 'NumeroDeTestes';
  const phoneNumber = '558195462240'; // Sem o 9º dígito

  try {
    console.log(`1. Deletando instância anterior "${instanceName}"...`);
    try {
      await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionKey }
      });
      console.log('Deletado.');
    } catch (e) {
      console.log('Erro deletar:', e.message);
    }

    console.log(`2. Criando instância "${instanceName}" para 8 dígitos...`);
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: false,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    await createRes.json();

    console.log('Aguardando 3 segundos...');
    await new Promise(r => setTimeout(r, 3000));

    console.log(`3. Solicitando Pairing Code para ${phoneNumber}...`);
    const pairRes = await fetch(`${evolutionUrl}/instance/connect/${instanceName}?number=${phoneNumber}`, {
      method: 'GET',
      headers: { 'apikey': evolutionKey }
    });

    const pairData = await pairRes.json();
    const code = pairData.pairingCode || pairData.code;
    if (code && !code.includes('@')) {
      console.log(`\n🌟 CÓDIGO DE PAREAMENTO GERADO (8 DÍGITOS): ${code}`);
    } else {
      console.log('Erro ao gerar código:', pairData);
    }
  } catch (err) {
    console.error(err);
  }
}

setupMaster8Digit();
