const https = require('https');

const data = JSON.stringify({
  instance: "5581984943129",
  data: {
    key: {
      remoteJid: "5581979066573@s.whatsapp.net"
    },
    pushName: "Teste Interno (Aloizio)",
    message: {
      "conversation": "Quero agendar uma consulta agora. Meu nome é Aloizio. O especialista desejado é o Dr. Linaldo (Dentista). O motivo é limpeza de rotina. A data é para o dia 28 de Agosto de 2026, às 14:00."
    }
  }
});

const options = {
  hostname: 'n8n.atendimentoiaclinicas.tech',
  port: 443,
  path: '/webhook/demonstracao-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseBody = '';
  res.on('data', (d) => {
    responseBody += d;
  });
  res.on('end', () => {
    console.log("Response:", responseBody);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
