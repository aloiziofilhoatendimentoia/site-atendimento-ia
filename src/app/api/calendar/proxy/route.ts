import { NextResponse } from 'next/server';
import { getGoogleIntegrationByEmpresaId, saveGoogleIntegration } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { empresa_id, action, payload } = body;

    if (!empresa_id || !action) {
      return NextResponse.json({ error: 'Faltam parametros obrigatorios: empresa_id ou action' }, { status: 200 });
    }

    let integration = await getGoogleIntegrationByEmpresaId(empresa_id);
    if (!integration || !integration.access_token) {
      return NextResponse.json({ error: 'Google Calendar nao conectado para esta clinica.' }, { status: 200 });
    }

    // Checar se token esta vencido (damos margem de 1 minuto)
    const now = Date.now();
    if (integration.expiry_date && (integration.expiry_date - 60000) < now) {
      if (!integration.refresh_token) {
        return NextResponse.json({ error: 'Token expirado e sem refresh_token disponivel.' }, { status: 200 });
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return NextResponse.json({ error: 'Falha ao renovar token Google.', details: tokenData }, { status: 200 });
      }

      // Atualizar no banco
      const newExpiry = Date.now() + (tokenData.expires_in * 1000);
      integration = await saveGoogleIntegration(empresa_id, {
        google_email: integration.google_email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || integration.refresh_token,
        expiry_date: newExpiry,
        scopes: integration.scopes
      });
    }

    const accessToken = integration.access_token;
    
    // Funcao helper pra chamadas ao Google API
    const googleApiCall = async (url: string, method: string, data?: any) => {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      if (res.status === 204) return { success: true };
      const responseData = await res.json();
      if (!res.ok) {
        return { error: 'API do Google retornou erro', details: responseData };
      }
      return responseData;
    };

    let result = {};
    const baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    switch (action) {
      case 'Buscar Evento':
        if (!payload.eventId) return NextResponse.json({ error: 'eventId requirido para Buscar Evento' }, { status: 200 });
        result = await googleApiCall(`${baseUrl}/${payload.eventId}`, 'GET');
        break;

      case 'Buscar Eventos':
        const queryParams = new URLSearchParams();
        if (payload.timeMin) queryParams.append('timeMin', payload.timeMin);
        if (payload.timeMax) queryParams.append('timeMax', payload.timeMax);
        queryParams.append('singleEvents', 'true');
        queryParams.append('orderBy', 'startTime');
        result = await googleApiCall(`${baseUrl}?${queryParams.toString()}`, 'GET');
        break;

      case 'Criar Evento':
        if (!payload.start || !payload.end || !payload.summary) {
          return NextResponse.json({ error: 'start, end e summary requeridos para Criar Evento' }, { status: 200 });
        }
        const createData = {
          summary: payload.summary,
          description: payload.description || '',
          start: typeof payload.start === 'string' ? { dateTime: payload.start } : payload.start,
          end: typeof payload.end === 'string' ? { dateTime: payload.end } : payload.end
        };
        result = await googleApiCall(baseUrl, 'POST', createData);
        break;

      case 'Reagendar Evento':
        if (!payload.eventId || !payload.start || !payload.end) {
          return NextResponse.json({ error: 'eventId, start e end requeridos para Reagendar Evento' }, { status: 200 });
        }
        const patchData = {
          start: typeof payload.start === 'string' ? { dateTime: payload.start } : payload.start,
          end: typeof payload.end === 'string' ? { dateTime: payload.end } : payload.end
        };
        result = await googleApiCall(`${baseUrl}/${payload.eventId}`, 'PATCH', patchData);
        break;

      case 'Cancelar Evento':
        if (!payload.eventId) return NextResponse.json({ error: 'eventId requerido para Cancelar Evento' }, { status: 200 });
        result = await googleApiCall(`${baseUrl}/${payload.eventId}`, 'DELETE');
        break;

      default:
        return NextResponse.json({ error: `Acao nao reconhecida: ${action}` }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Erro no Proxy Google Calendar:', error);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
