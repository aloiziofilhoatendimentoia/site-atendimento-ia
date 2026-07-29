import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import {
  getUserByEmail,
  saveEmpresa,
  saveSuporte,
  saveAgendamentos,
  saveVendas,
  saveServicos,
  getDashboardData
} from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

// GET /api/empresa/config - Retorna os dados já salvos da empresa do usuário logado
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
    }

    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não localizado.' }, { status: 401 });
    }

    const dashboardData = await getDashboardData(user.id);
    return NextResponse.json({ success: true, data: dashboardData }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

// POST /api/empresa/config - Mock visual sem validação JWT para o simulador de vendas
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const nomeClinica = payload?.clinica?.nomeClinica || 'Sem Nome';
    const whatsappClinica = payload?.clinica?.whatsappClinica || 'Não informado';
    const endereco = payload?.suporte?.endereco || 'Não informado';
    const tempoConsulta = payload?.horarios?.tempoConsulta ? `${payload.horarios.tempoConsulta} min` : 'Não informado';
    const valorConsulta = payload?.horarios?.valorConsulta || 'R$ 0,00';
    
    // Formatando arrays em textos limpos
    const especialistas = payload?.clinica?.especialistas || [];
    const especialistasStr = especialistas.length > 0 
      ? especialistas.map((e: any) => `- ${e.nome || 'Dr'} (${e.especialidade || 'Geral'})`).join('\n')
      : 'Nenhum profissional cadastrado';

    const canaisArr = [];
    if (payload?.integracoes?.opcoesAgendamento?.whatsapp) canaisArr.push("WhatsApp");
    if (payload?.integracoes?.opcoesAgendamento?.calendar) canaisArr.push("Google Calendar");
    const canaisStr = canaisArr.length > 0 ? canaisArr.join(" e ") : 'Nenhum';



    // 1. SALVAR NO SUPABASE (TABELA CLIENTES ATENDIMENTO IA SITE)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let supabaseStatus = 'Não Tentou';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { error: insertError } = await supabaseAdmin
          .from('CLIENTES ATENDIMENTO IA SITE')
          .insert([
            {
              nome_clinica: nomeClinica,
              telefone_principal: whatsappClinica,
              endereco: endereco,
              especialistas: especialistasStr,
              canais_escolhidos: canaisStr
            }
          ]);
        if (insertError) {
          console.error("Erro insert Supabase:", insertError);
          supabaseStatus = 'Erro: ' + insertError.message;
        } else {
          supabaseStatus = 'Sucesso';
          console.log("✅ Cliente inserido na tabela CLIENTES ATENDIMENTO IA SITE com a ficha completa");
        }
      } catch (e: any) {
        console.error("Crash insert Supabase:", e);
        supabaseStatus = 'Crash: ' + e.message;
      }
    } else {
      supabaseStatus = 'Chaves do Supabase Ausentes';
    }

    let diasStr = 'Não informado';
    let horarioStr = 'Não informado';
    let horariosFormatadosStr = 'Não informado';

    if (payload?.horarios?.blocosHorario && Array.isArray(payload.horarios.blocosHorario) && payload.horarios.blocosHorario.length > 0) {
      const blocos = payload.horarios.blocosHorario.filter((b: any) => b.dias && b.dias.length > 0);
      if (blocos.length > 0) {
        const linhasFormatadas = blocos.map((b: any) => `• ${b.dias.join(', ')}: das ${b.inicio || '08:00'} às ${b.fim || '18:00'}`);
        horariosFormatadosStr = linhasFormatadas.join('\n');
        diasStr = linhasFormatadas.join('\n');
        horarioStr = blocos.map((b: any) => `${b.dias.join(', ')} (das ${b.inicio || '08:00'} às ${b.fim || '18:00'})`).join(' | ');
      }
    }

    const payloadWebhook = {
      ...payload,
      clinicName: nomeClinica, // Mantido para retrocompatibilidade
      nome_da_clinica: nomeClinica,
      whatsapp_ia: payload?.clinica?.whatsappClinica || 'Não informado',
      whatsapp_humano: payload?.integracoes?.whatsappHumano || 'Não informado',
      whatsapp_agendamento: payload?.integracoes?.whatsappReceberAgendamento || 'Não informado',
      profissionais_formatados: especialistasStr,
      canais_escolhidos: canaisStr,
      dias_atendimento: diasStr,
      horarios_atendimento: horarioStr,
      horarios_formatados: horariosFormatadosStr,
      intervalo_consulta: payload?.horarios?.tempoConsulta ? `${payload.horarios.tempoConsulta} minutos` : 'Não informado',
      valor_consulta: payload?.horarios?.valorConsulta || 'R$ 0,00'
    };

    // 2. Disparo pro n8n para acionar o Webhook e o WhatsApp do Médico
    // A URL utiliza o Endpoint de PRODUÇÃO do n8n (/webhook/) porque o workflow do cliente está ativado
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.atendimentoiaclinicas.tech/webhook/config-empresa';
    let n8nStatus = 'Não Disparado';
    
    if (n8nWebhookUrl) {
      try {
        const n8nRes = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWebhook),
        });
        n8nStatus = String(n8nRes.status);
      } catch (err: any) {
        n8nStatus = 'Erro de Conexão: ' + err.message;
      }
    }

    // 2. Duplicação (Clone) do Workflow Demonstração na conta do N8N
    const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
    const N8N_DEMO_ID = 'OLsd2Rtp3wQ3gHeB';
    const N8N_BASE_URL = 'https://n8n.atendimentoiaclinicas.tech/api/v1';
    let cloneStatus = 'Não Clonado';

    try {
      // 2.1 Criar Credencial do Google no N8N se os tokens foram fornecidos
      let googleCredentialId = null;
      let credName = `Google Calendar - ${nomeClinica}`;
      
      if (payload.googleTokens && payload.googleTokens.refresh_token) {
        const credBody = {
          name: credName,
          type: "googleCalendarOAuth2Api",
          nodesAccess: [{ nodeType: "n8n-nodes-base.googleCalendar", date: new Date().toISOString() }],
          data: {
            oauthTokenData: {
              access_token: payload.googleTokens.access_token,
              refresh_token: payload.googleTokens.refresh_token,
              scope: "https://www.googleapis.com/auth/calendar email profile",
              token_type: "Bearer",
              expiry_date: payload.googleTokens.expiry_date
            },
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
          }
        };

        const credRes = await fetch(`${N8N_BASE_URL}/credentials`, {
          method: 'POST',
          headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(credBody)
        });
        if (credRes.ok) {
          const credData = await credRes.json();
          googleCredentialId = credData.id;
        }
      }

      // 2.2 Baixar o workflow original
      const getRes = await fetch(`${N8N_BASE_URL}/workflows/${N8N_DEMO_ID}`, {
        method: 'GET',
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });
      
      if (getRes.ok) {
        const demoWorkflow = await getRes.json();
        
        // 2.3 Substituir IDs de Credencial nos Nós do Google e Injetar Credenciais Master (Redis, Z-API, Gemini)
        let mappedNodes = demoWorkflow.nodes;
        mappedNodes = mappedNodes.map((node: any) => {
          let newNode = { ...node };
          
          // A. Injetar Credencial Master do Redis
          if (newNode.type.toLowerCase().includes('redis') || (newNode.credentials && newNode.credentials.redis)) {
            newNode.credentials = { ...newNode.credentials, redis: { id: "Sh0bvRdlLRBVgxYU", name: "Redis custo zero" } };
          }
          
          // B. Injetar Credencial Master do HTTP Request (Z-API e afins)
          if (newNode.credentials && newNode.credentials.httpHeaderAuth) {
            newNode.credentials = { ...newNode.credentials, httpHeaderAuth: { id: "OPEJI2t9V8WS0Nju", name: "Header Auth account" } };
          }
          
          // C. Injetar Credencial Master do Google Gemini
          if (newNode.type.toLowerCase().includes('googlepalm') || (newNode.credentials && newNode.credentials.googlePalmApi)) {
            newNode.credentials = { ...newNode.credentials, googlePalmApi: { id: "tOMXobUMfC8Ns9MD", name: "Google Gemini(PaLM) Api account" } };
          }

          // D. Injetar Credencial Específica do Google Calendar do Cliente
          if (googleCredentialId && (newNode.type === 'n8n-nodes-base.googleCalendar' || (newNode.credentials && newNode.credentials.googleCalendarOAuth2Api))) {
            newNode.credentials = {
              ...newNode.credentials,
              googleCalendarOAuth2Api: { id: googleCredentialId, name: credName }
            };
          }
          
          return newNode;
        });

        // Modificar para os dados da nova clínica e limpar IDs
        const newWorkflow = {
          name: `Atendimento IA - ${nomeClinica}`,
          nodes: mappedNodes,
          connections: demoWorkflow.connections,
          settings: { executionOrder: 'v1' }
        };
        
        // Criar o Novo Workflow Clonado
        const postRes = await fetch(`${N8N_BASE_URL}/workflows`, {
          method: 'POST',
          headers: { 
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(newWorkflow)
        });
        
        cloneStatus = postRes.ok ? 'Sucesso' : 'Falha na Criação';
      } else {
        cloneStatus = 'Demonstração Não Encontrada';
      }
    } catch (error: any) {
      cloneStatus = 'Erro na API N8N: ' + error.message;
    }

    // 3. Criação de Instância na Evolution API
    const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
    const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';
    let evolutionStatus = 'Não Tentou';
    let evolutionQrCode = '';

    try {
      const instanceName = (whatsappClinica || '123456789').replace(/\D/g, '') || 'NumeroDeTestes'; 
      
      const evoRes = await fetch(`${evoUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evoKey
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (evoRes.ok) {
        const evoData = await evoRes.json();
        evolutionStatus = 'Sucesso';
        if (evoData.qrcode && evoData.qrcode.base64) {
           evolutionQrCode = evoData.qrcode.base64;
        } else if (evoData.base64) {
           evolutionQrCode = evoData.base64;
        }
      } else {
        evolutionStatus = `Falha: ${evoRes.statusText}`;
      }

      // Se a instância já existe (ex: 403 Forbidden) e não veio QR Code no create, tenta no connect
      if (!evolutionQrCode) {
        try {
          const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
            headers: { 'apikey': evoKey }
          });
          if (connectRes.ok) {
            const connectData = await connectRes.json();
            if (connectData.base64) {
              evolutionQrCode = connectData.base64;
            } else if (connectData.qrcode && connectData.qrcode.base64) {
              evolutionQrCode = connectData.qrcode.base64;
            } else if (connectData.code) {
              evolutionQrCode = connectData.code;
            }
          }
        } catch (eConnect) {
          console.error('Erro connect Evolution:', eConnect);
        }
      }

      // Se não obteve QR code dinâmico da Evolution API, gera um QR code válido para conectar
      if (!evolutionQrCode) {
        evolutionQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://api-whatsapp.atendimentoiaclinicas.tech/manager`;
      }
    } catch (err: any) {
      evolutionStatus = `Crash: ${err.message}`;
      evolutionQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://api-whatsapp.atendimentoiaclinicas.tech/manager`;
    }

    // Retorna sucesso instantâneo ignorando tokens (WOW effect de Instalação na demonstração)
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso (Simulação)',
      webhookStatus: n8nStatus,
      cloneStatus: cloneStatus,
      supabaseStatus: supabaseStatus,
      evolutionStatus: evolutionStatus,
      evolutionQrCode: evolutionQrCode
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro de processamento.' }, { status: 500 });
  }
}
