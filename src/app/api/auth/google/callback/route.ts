import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`<html><body><h2>Erro na Autenticação</h2><p>${error}</p></body></html>`, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse(`<html><body><h2>Código não fornecido</h2></body></html>`, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  try {
    // Troca o Código de Autorização pelos Tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Falha ao obter os tokens.');
    }

    // Buscando E-mail do usuário para exibir na tela do painel
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userInfoRes.json();

    // Renderiza uma página HTML simples na janelinha Popup
    // Ela envia os Tokens (seguramente) via postMessage para a janela Pai (Painel do site) e se fecha sozinha.
    const htmlResponse = `
      <html>
        <head><title>Autenticado</title></head>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <h2 style="color: #10b981;">Google Conectado com Sucesso!</h2>
          <p>Você pode fechar esta janela caso ela não feche sozinha.</p>
          <script>
            // Envia os tokens extraídos para o site principal (Painel de Configuração)
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                payload: {
                  access_token: "${tokenData.access_token}",
                  refresh_token: "${tokenData.refresh_token || ''}",
                  email: "${userInfo.email || ''}",
                  expiry_date: ${Date.now() + (tokenData.expires_in * 1000)}
                }
              }, "*");
              // Fecha o popup após 1.5s pra dar tempo de processar
              setTimeout(() => { window.close(); }, 1500);
            } else {
              document.write("Página aberta fora do contexto do pop-up. Feche e tente pelo site.");
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, { status: 200, headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return new NextResponse(`<html><body><h2>Falha na comunicação com Google</h2><p>${err.message}</p></body></html>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
