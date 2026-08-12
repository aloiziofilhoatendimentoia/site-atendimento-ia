const fs = require('fs');

const html = fs.readFileSync('scratch/qrcode_bot.html', 'utf8');
const match = html.match(/src="(data:image[^"]+)"/);

if (match) {
  const dataUrl = match[1];
  const base64 = dataUrl.replace('data:image/png;base64,', '');
  fs.writeFileSync('scratch/qr_only.png', Buffer.from(base64, 'base64'));
  console.log('PNG salvo com sucesso em scratch/qr_only.png');
} else {
  console.log('Não encontrou base64 no HTML');
  // Mostrar início do HTML para debug
  console.log(html.substring(0, 500));
}
