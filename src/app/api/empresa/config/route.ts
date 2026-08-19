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
  getDashboardData,
  saveDraftPayload,
  getDraftPayload
} from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_atendimento_ia_key';

// GET /api/empresa/config - Retorna a estrutura completa de onboarding da clínica por JWT ou query params (email/whatsapp)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const whatsappParam = searchParams.get('whatsapp');

    let emailToUse = emailParam || '';

    if (!emailToUse) {
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get('auth_token');
      if (tokenCookie && tokenCookie.value) {
        try {
          const decoded: any = jwt.verify(tokenCookie.value, JWT_SECRET);
          emailToUse = decoded.email || '';
        } catch (e) {}
      }
    }

    let user = emailToUse ? await getUserByEmail(emailToUse) : null;
    let dashboardData = user ? await getDashboardData(user.id) : null;

    // Se não temos absolutamente nenhuma forma de identificar o usuário (sem e-mail e sem zap),
    // retornamos um perfil vazio (evita vazar a última clínica cadastrada para usuários anônimos)
    if (!emailToUse && !whatsappParam) {
      return NextResponse.json({
        success: true,
        data: null,
        onboardingData: {
          nomeClinica: '',
          nomeSecretaria: '',
          endereco: '',
          emailAdmin: '',
          whatsappClinica: '',
          especialistas: [{ nome: '', especialidade: '' }],
          opcoesAgendamento: { whatsapp: true, calendar: false },
          emailCalendar: '',
          whatsappHumano: '',
          whatsappReceberAgendamento: '',
          tempoConsulta: '30',
          valorConsulta: '',
          blocosHorario: [{ dias: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], inicio: '08:00', fim: '18:00' }]
        }
      }, { status: 200 });
    }

    // Buscar no Supabase nativo se houver whatsappParam ou se local_db não tiver os dados
    let siteClinic: any = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        let query = supabaseAdmin.from('CLIENTES ATENDIMENTO IA SITE').select('*');

        if (whatsappParam) {
          const clean = whatsappParam.replace(/\D/g, '');
          query = query.or(`telefone_principal.eq.${whatsappParam},telefone_principal.eq.${clean},telefone_principal.eq.55${clean}`);
        } else if (emailToUse) {
          query = query.eq('email', emailToUse);
        }

        const { data: clinics } = await query;
        if (clinics && clinics.length > 0) {
          siteClinic = clinics[0];
        }
      } catch (err) {
        console.error("Erro busca Supabase GET config:", err);
      }
    }

    // Tentar restaurar o rascunho completo do payload salvo (Supabase ou Local DB)
    let savedPayload: any = null;
    if (emailToUse) savedPayload = await getDraftPayload(emailToUse);
    if (!savedPayload && whatsappParam) savedPayload = await getDraftPayload(whatsappParam);

    if (!savedPayload && siteClinic?.dados_completos_json) {
      try {
        savedPayload = typeof siteClinic.dados_completos_json === 'string'
          ? JSON.parse(siteClinic.dados_completos_json)
          : siteClinic.dados_completos_json;
      } catch (e) {}
    }

    // Reconstruir o objeto onboardingData completo para o formulário
    const nomeClinica = savedPayload?.clinica?.nomeClinica || dashboardData?.empresa?.nome_empresa || siteClinic?.nome_clinica || '';
    const rawSecretaria = savedPayload?.clinica?.nomeSecretaria || siteClinic?.nome_secretaria || '';
    const nomeSecretaria = (rawSecretaria && rawSecretaria !== 'Secretária Virtual') ? rawSecretaria : '';
    const endereco = savedPayload?.clinica?.endereco || dashboardData?.suporte?.endereco || siteClinic?.endereco || '';
    const whatsappClinica = savedPayload?.clinica?.whatsappClinica || dashboardData?.suporte?.whatsapp_empresa || siteClinic?.telefone_principal || whatsappParam || '';
    const whatsappHumano = savedPayload?.integracoes?.whatsappHumano || dashboardData?.suporte?.telefone_suporte || '';
    const whatsappReceberAgendamento = savedPayload?.integracoes?.whatsappReceberAgendamento || dashboardData?.agendamento?.whatsapp_agendamento || '';

    let especialistasArr = savedPayload?.clinica?.especialistas || [{ nome: '', especialidade: '' }];
    if ((!especialistasArr || especialistasArr.length === 0 || !especialistasArr[0].nome) && siteClinic?.especialistas) {
      const parsed = String(siteClinic.especialistas)
        .split('\n')
        .map(line => {
          const match = line.match(/-?\s*(?:Dr\.|Dra\.)?\s*([^(]+)\(([^)]+)\)/i);
          if (match) {
            return { nome: match[1].trim(), especialidade: match[2].trim() };
          }
          return { nome: line.replace(/^-/, '').trim(), especialidade: 'Geral' };
        })
        .filter(e => e.nome);
      if (parsed.length > 0) especialistasArr = parsed;
    }

    const tempoConsulta = savedPayload?.horarios?.tempoConsulta || '30';
    const valorConsulta = savedPayload?.horarios?.valorConsulta || '';
    const blocosHorario = savedPayload?.horarios?.blocosHorario || [{ dias: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], inicio: '08:00', fim: '18:00' }];

    const onboardingData = {
      nomeClinica,
      nomeSecretaria,
      endereco,
      emailAdmin: savedPayload?.ownerEmail || siteClinic?.email || emailToUse || '',
      whatsappClinica,
      especialistas: especialistasArr,
      opcoesAgendamento: savedPayload?.integracoes?.opcoesAgendamento || {
        whatsapp: dashboardData?.agendamento?.usa_whatsapp ?? true,
        calendar: dashboardData?.agendamento?.usa_google_calendar ?? false
      },
      emailCalendar: savedPayload?.integracoes?.emailCalendar || '',
      whatsappHumano,
      whatsappReceberAgendamento,
      tempoConsulta,
      valorConsulta,
      blocosHorario
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      onboardingData
    }, { status: 200 });

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
    const ownerEmail = payload.ownerEmail || 'atendimentoia35@gmail.com';
    let user = await getUserByEmail(ownerEmail);
    if (!user) {
      user = await createUser(ownerEmail, 'no_password_otp_only');
    }

    // Buscar o rascunho ANTERIOR antes de sobrescrever com o novo payload
    const previousDraft = (await getDraftPayload(ownerEmail)) || (await getDraftPayload(whatsappClinica));

    // Salvar o novo rascunho completo local e em nuvem
    if (ownerEmail) await saveDraftPayload(ownerEmail, payload);
    if (whatsappClinica) await saveDraftPayload(whatsappClinica, payload);

    let hasChanges = true;
    let eventType = 'novo_cadastro';
    let supabaseStatus = 'Não Tentou';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Normalizar número de telefone para dígitos limpos
        let cleanPhone = whatsappClinica.replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = '55' + cleanPhone;
        }

        // Buscar clínicas existentes na tabela de produção
        const { data: allRows, error: selectError } = await supabaseAdmin
          .from('CLIENTES ATENDIMENTO IA SITE')
          .select('*');

        if (selectError) {
          console.error("Erro select Supabase:", selectError);
        }

        const norm = (v: any) => (v === null || v === undefined) ? '' : String(v).trim();
        const normDigits = (v: any) => String(v || '').replace(/\D/g, '');

        // Localizar registro existente por telefone (com ou sem 55) ou por nome exato da clínica
        const existing = (allRows || []).find((r: any) => {
          const rDigits = normDigits(r.telefone_principal);
          if (!rDigits && !cleanPhone) return false;
          if (rDigits === cleanPhone || rDigits.endsWith(cleanPhone) || cleanPhone.endsWith(rDigits)) return true;
          if (norm(r.nome_clinica).toLowerCase() === norm(nomeClinica).toLowerCase()) return true;
          return false;
        });

        const fullJsonString = JSON.stringify(payload);

        if (existing || previousDraft) {
          // Já existe! É uma alteração de cadastro
          eventType = 'alteracao_cadastro';

          if (previousDraft) {
            const cleanObj = (obj: any) => ({
              clinica: obj?.clinica || {},
              integracoes: obj?.integracoes || {},
              horarios: obj?.horarios || {}
            });

            const oldSig = JSON.stringify(cleanObj(previousDraft));
            const newSig = JSON.stringify(cleanObj(payload));

            if (oldSig === newSig) {
              hasChanges = false;
              supabaseStatus = 'Pulado (Sem alterações)';
              console.log(`[Config] Nenhuma alteração real detectada nos dados completos (Draft local).`);
            } else {
              hasChanges = true;
              console.log(`[Config] Alteração detectada nos dados completos da clínica (Draft local).`);
            }
          } else if (existing?.dados_completos_json) {
            // Se o Draft foi limpo pelo redeploy, tentamos comparar diretamente com o JSON salvo no Supabase
            try {
              const oldJson = typeof existing.dados_completos_json === 'string' ? JSON.parse(existing.dados_completos_json) : existing.dados_completos_json;
              const cleanObj = (obj: any) => ({
                clinica: obj?.clinica || {},
                integracoes: obj?.integracoes || {},
                horarios: obj?.horarios || {}
              });
              
              const oldSig = JSON.stringify(cleanObj(oldJson));
              const newSig = JSON.stringify(cleanObj(payload));

              if (oldSig === newSig) {
                hasChanges = false;
                supabaseStatus = 'Pulado (Sem alterações)';
                console.log(`[Config] Nenhuma alteração detectada comparando com o JSON do Supabase.`);
              } else {
                hasChanges = true;
                console.log(`[Config] Alteração detectada comparando com o JSON do Supabase.`);
              }
            } catch(e) {
              hasChanges = true;
            }
          } else {
            // Comparação fallback com colunas de produção
            const sameName = norm(existing?.nome_clinica) === norm(nomeClinica);
            const sameAddress = norm(existing?.endereco) === norm(endereco);
            const sameSpecialists = norm(existing?.especialistas) === norm(especialistasStr);
            const sameChannels = norm(existing?.canais_escolhidos) === norm(canaisStr);

            if (sameName && sameAddress && sameSpecialists && sameChannels) {
              hasChanges = false;
              supabaseStatus = 'Pulado (Sem alterações)';
            } else {
              hasChanges = true;
            }
          }

          if (hasChanges && existing) {
            let updatePayload: any = {
              nome_clinica: nomeClinica,
              telefone_principal: cleanPhone || whatsappClinica,
              endereco: endereco,
              especialistas: especialistasStr,
              canais_escolhidos: canaisStr,
              dados_completos_json: fullJsonString,
              email: ownerEmail
            };

            let { error: updateError } = await supabaseAdmin
              .from('CLIENTES ATENDIMENTO IA SITE')
              .update(updatePayload)
              .eq('id', existing.id);

            // Fallback se a coluna dados_completos_json ou email não existir na tabela
            if (updateError && (updateError.message.includes('dados_completos_json') || updateError.message.includes('email'))) {
              delete updatePayload.dados_completos_json;
              delete updatePayload.email;
              const retry = await supabaseAdmin
                .from('CLIENTES ATENDIMENTO IA SITE')
                .update(updatePayload)
                .eq('id', existing.id);
              updateError = retry.error;
            }

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
          let insertPayload: any = {
            nome_clinica: nomeClinica,
            telefone_principal: cleanPhone || whatsappClinica,
            endereco: endereco,
            especialistas: especialistasStr,
            canais_escolhidos: canaisStr,
            dados_completos_json: fullJsonString,
            email: ownerEmail
          };

          let { error: insertError } = await supabaseAdmin
            .from('CLIENTES ATENDIMENTO IA SITE')
            .insert([insertPayload]);

          // Fallback se a coluna dados_completos_json ou email não existir na tabela
          if (insertError && (insertError.message.includes('dados_completos_json') || insertError.message.includes('email'))) {
            delete insertPayload.dados_completos_json;
            delete insertPayload.email;
            const retry = await supabaseAdmin
              .from('CLIENTES ATENDIMENTO IA SITE')
              .insert([insertPayload]);
            insertError = retry.error;
          }

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

    const tituloMensagem = eventType === 'alteracao_cadastro' 
      ? '📋 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*' 
      : '📋 *NOVO CADASTRO DE CLÍNICA*';

    const payloadWebhook = {
      ...payload,
      event: eventType, // 'novo_cadastro' ou 'alteracao_cadastro'
      titulo_mensagem: tituloMensagem,
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
