import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || clientId.includes('seu-google-client-id-aqui')) {
    // Retorna uma página de erro explicando que faltam chaves
    return new NextResponse(`
      <html><body>
      <h2 style="font-family: sans-serif;">Aviso do Sistema (Agência)</h2>
      <p style="font-family: sans-serif;">Você precisa configurar o GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env.local e criar um aplicativo no Google Cloud Console.</p>
      </body></html>
    `, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  // Monta a URL de autenticação Offline para gerar Refresh Token (Obrigatório para o N8N funcionar em background)
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=https://www.googleapis.com/auth/calendar email profile` +
    `&access_type=offline` + 
    `&prompt=consent`; // prompt=consent é crucial para forçar a entrega do refresh_token sempre que ele clicar

  return NextResponse.redirect(authUrl);
}
