async function setupMaster() {
  const evolutionUrl = 'https://api-whatsapp.atendimentoiaclinicas.tech';
  const evolutionKey = 'atendimentoia_mestre_evolution_2026';
  const instanceName = 'NumeroDeTestes';

  // Testar com e sem o 9º dígito
  const phoneNumbers = [
    '5581995462240', // Com 9º dígito
    '558195462240'   // Sem 9º dígito
  ];

  for (const phoneNumber of phoneNumbers) {
    try {
      console.log(`\n========================================`);
      console.log(`Testando com número: ${phoneNumber}`);
      console.log(`========================================`);

      console.log(`1. Deletando instância anterior "${instanceName}" se existir...`);
      try {
        await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionKey }
        });
        console.log('Deletado.');
      } catch (e) {
        console.log('Erro deletar:', e.message);
      }

      console.log(`2. Criando instância "${instanceName}" com qrcode: false...`);
      const createRes = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: false,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      
      console.log('Status Criação:', createRes.status);
      await createRes.json();

      console.log('Aguardando 3 segundos...');
      await new Promise(r => setTimeout(r, 3000));

      console.log(`3. Solicitando Pairing Code para ${phoneNumber}...`);
      const pairRes = await fetch(`${evolutionUrl}/instance/connect/${instanceName}?number=${phoneNumber}`, {
        method: 'GET',
        headers: { 'apikey': evolutionKey }
      });

      console.log('Status Pareamento:', pairRes.status);
      const pairData = await pairRes.json();
      console.log('Resposta Pareamento:', JSON.stringify(pairData, null, 2));

      const code = pairData.pairingCode || pairData.code;
      if (code && !code.includes('@')) {
        console.log(`\n🌟 SUCESSO ABSOLUTO!`);
        console.log(`CÓDIGO DE PAREAMENTO: ${code}`);
        console.log(`Número bem-sucedido: ${phoneNumber}`);
        break; // Achou! Interrompe o loop
      } else {
        console.log('Retornou QR Code ou nulo, tentando próximo número...');
      }
    } catch (err) {
      console.error('Erro no loop para o número ' + phoneNumber, err);
    }
  }
}

setupMaster();
