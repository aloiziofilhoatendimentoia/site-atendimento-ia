import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import {
  getUserByEmail,
  createUser,
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
    const nomeSecretaria = payload?.clinica?.nomeSecretaria || 'Secretária Virtual';
    const whatsappClinica = payload?.clinica?.whatsappClinica || 'Não informado';
    const whatsappHumano = payload?.integracoes?.whatsappHumano || 'Não informado';
    const whatsappReceberAgendamento = payload?.integracoes?.whatsappReceberAgendamento || 'Não informado';
    const endereco = payload?.clinica?.endereco || payload?.suporte?.endereco || 'Não informado';
    const tempoConsulta = payload?.horarios?.tempoConsulta ? `${payload.horarios.tempoConsulta} min` : 'Não informado';
    const valorConsulta = payload?.horarios?.valorConsulta || 'R$ 0,00';
    
    // Formatando arrays em textos limpos
    const especialistas = payload?.clinica?.especialistas || [];
    const especialistasStr = especialistas.length > 0 
      ? especialistas.map((e: any) => `- ${e.nome || 'Dr'} (${e.especialidade || 'Geral'})`).join('\n')
      : 'Nenhum profissional cadastrado';

    const canaisArr = [];
    if (payload?.integracoes?.opcoesAgendamento?.whatsapp) canaisArr.push("WhatsApp");
    if (payload?.integracoes?.opcoesAgendamento?.calendar) canaisArr.push("Google Agenda");
    const canaisStr = canaisArr.length > 0 ? canaisArr.join(" e ") : 'Nenhum';

    let diasStr = 'seg,ter,qua,qui,sex';
    let horarioStr = '09:00 - 18:00';

    if (payload?.horarios?.blocosHorario && Array.isArray(payload.horarios.blocosHorario) && payload.horarios.blocosHorario.length > 0) {
      const blocos = payload.horarios.blocosHorario.filter((b: any) => b.dias && b.dias.length > 0);
      if (blocos.length > 0) {
        const linhasFormatadas = blocos.map((b: any) => `• ${b.dias.join(', ')}: das ${b.inicio || '08:00'} às ${b.fim || '18:00'}`);
        diasStr = blocos[0].dias.join(', ');
        horarioStr = `das ${blocos[0].inicio || '08:00'} às ${blocos[0].fim || '18:00'}`;
      }
    }

    const cnpj = payload?.clinica?.cnpj || '00000000000000';
    const nomeEmpresario = payload?.clinica?.nomeEmpresario || payload?.clinica?.nome_empresario || 'Doutor';
    const cpf = payload?.clinica?.cpf || '000.000.000-00';
    const nicho = payload?.clinica?.nicho || 'Médico';

    // 1. SALVAR/CRIAR USUÁRIO E VINCULAR EMPRESA NO BANCO HÍBRIDO (SUPABASE / LOCAL_DB)
    const ownerEmail = payload.ownerEmail || 'aloiziofilho2012@gmail.com';
    let user = await getUserByEmail(ownerEmail);
    if (!user) {
      user = await createUser(ownerEmail, 'no_password_otp_only');
    }
    
    let hasChanges = true;
    let eventType = 'novo_cadastro';
    let supabaseStatus = 'Não Tentou';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Buscar se a clínica já existe na tabela de produção
        const { data: existingRows, error: selectError } = await supabaseAdmin
          .from('CLIENTES ATENDIMENTO IA SITE')
          .select('*')
          .eq('telefone_principal', whatsappClinica);

        if (selectError) {
          console.error("Erro select Supabase:", selectError);
        }

        const norm = (v: any) => (v === null || v === undefined) ? '' : String(v).trim();

        if (existingRows && existingRows.length > 0) {
          // Já existe! É uma alteração de cadastro
          eventType = 'alteracao_cadastro';
          const existing = existingRows[0];

          // Comparação profunda dos campos chaves para determinar se houve alteração real
          const sameName = norm(existing.nome_clinica) === norm(nomeClinica);
          const sameAddress = norm(existing.endereco) === norm(endereco);
          const sameSpecialists = norm(existing.especialistas) === norm(especialistasStr);
          const sameChannels = norm(existing.canais_escolhidos) === norm(canaisStr);

          if (sameName && sameAddress && sameSpecialists && sameChannels) {
            hasChanges = false;
            supabaseStatus = 'Pulado (Sem alterações)';
            console.log(`[Config] Nenhuma alteração real detectada para a clínica de telefone ${whatsappClinica}.`);
          } else {
            // Houve alteração real -> Atualizar registro existente
            const { error: updateError } = await supabaseAdmin
              .from('CLIENTES ATENDIMENTO IA SITE')
              .update({
                nome_clinica: nomeClinica,
                endereco: endereco,
                especialistas: especialistasStr,
                canais_escolhidos: canaisStr
              })
              .eq('id', existing.id);

            if (updateError) {
              console.error("Erro update Supabase:", updateError);
              supabaseStatus = 'Erro update: ' + updateError.message;
            } else {
              supabaseStatus = 'Sucesso (Atualizado)';
              console.log("✅ Cliente atualizado na tabela CLIENTES ATENDIMENTO IA SITE");
            }
          }
        } else {
          // Novo cadastro! Inserir novo registro
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
            supabaseStatus = 'Erro insert: ' + insertError.message;
          } else {
            supabaseStatus = 'Sucesso (Inserido)';
            console.log("✅ Novo cliente inserido na tabela CLIENTES ATENDIMENTO IA SITE");
          }
        }

        // Salvar em segundo plano nos modelos de fallback para compatibilidade interna
        const empresa = await saveEmpresa(user.id, {
          nome_empresa: nomeClinica,
          cnpj,
          nome_empresario: nomeEmpresario,
          cpf,
          nicho
        });
        if (empresa) {
          await Promise.all([
            saveSuporte(empresa.id, {
              dias_funcionamento: diasStr,
              horario_funcionamento: horarioStr,
              endereco,
              whatsapp_empresa: whatsappClinica,
              telefone_suporte: whatsappHumano
            }),
            saveAgendamentos(empresa.id, {
              usa_google_calendar: payload?.integracoes?.opcoesAgendamento?.calendar || false,
              usa_whatsapp: payload?.integracoes?.opcoesAgendamento?.whatsapp || false,
              whatsapp_agendamento: whatsappReceberAgendamento
            }),
            saveVendas(empresa.id, {
              link_pagamento: payload?.venda?.link_pagamento || '',
              chave_pix: payload?.venda?.chave_pix || ''
            }),
            saveServicos(empresa.id, payload?.servicos || [])
          ]);
        }
      } catch (e: any) {
        console.error("Crash processamento Supabase:", e);
        supabaseStatus = 'Crash: ' + e.message;
      }
    }

    const payloadWebhook = {
      ...payload,
      event: eventType, // 'novo_cadastro' ou 'alteracao_cadastro'
      clinicName: nomeClinica,
      nome_da_clinica: nomeClinica,
      whatsapp_ia: whatsappClinica,
      whatsapp_humano: whatsappHumano,
      whatsapp_agendamento: whatsappReceberAgendamento,
      profissionais_formatados: especialistasStr,
      canais_escolhidos: canaisStr,
      dias_atendimento: diasStr,
      horarios_atendimento: horarioStr,
      intervalo_consulta: tempoConsulta,
      valor_consulta: valorConsulta
    };

    // 3. Disparo pro n8n para acionar o Webhook e o WhatsApp do Médico (apenas se houver alterações!)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.atendimentoiaclinicas.tech/webhook/config-empresa';
    let n8nStatus = 'Não Disparado (Sem alterações)';
    
    if (hasChanges && n8nWebhookUrl) {
      n8nStatus = 'Não Disparado';
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

    // 4. Criação de Instância na Evolution API
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

      if (!evolutionQrCode) {
        evolutionQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://api-whatsapp.atendimentoiaclinicas.tech/manager`;
      }
    } catch (err: any) {
      evolutionStatus = `Crash: ${err.message}`;
      evolutionQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://api-whatsapp.atendimentoiaclinicas.tech/manager`;
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      webhookStatus: n8nStatus,
      supabaseStatus: supabaseStatus,
      evolutionStatus: evolutionStatus,
      evolutionQrCode: evolutionQrCode
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no config POST:', error);
    return NextResponse.json({ error: 'Erro de processamento.' }, { status: 500 });
  }
}
