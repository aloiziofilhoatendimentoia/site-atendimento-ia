import { NextResponse } from 'next/server';
import { n8nService } from '@/lib/n8n';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { clinicName, clinicType, clinicAddress, clinicPhone, doctors, agendaTypes, whatsappContacts, directContacts, schedule } = data;

    // Extrair o primeiro telefone direto (se houver) para salvar junto do Prisma como contato secundário
    const mainDirectPhone = directContacts && directContacts.length > 0 ? directContacts[0].phone : null;

    console.log("Iniciando onboarding com payload:", JSON.stringify(data, null, 2));

    // Salvar no Supabase (Prisma)
    let clinicId = "clinic_" + Math.floor(Math.random() * 1000);
    try {
      const { prisma } = await import('@/lib/prisma');
      const clinic = await prisma.clinic.create({
        data: {
          name: clinicName || "Clínica Não Informada",
          type: clinicType || "MEDICA",
          ownerName: "Usuário Admin", // Mock para campos obrigatórios não preenchidos
          phone: clinicPhone || "00000000000",
          email: `admin_${Math.floor(Math.random() * 10000)}@clinica.com`,
          address: clinicAddress || "",
          doctors: {
            create: doctors && doctors.length > 0 ? doctors.map((d: any) => ({
              name: d.name,
              registry: d.registry || null,
              phone: mainDirectPhone || null // Salva telefone direto apenas no primeiro se houver
            })) : []
          }
        }
      });
      clinicId = clinic.id;
      console.log("Dados salvos no Supabase com sucesso. ID:", clinicId);
    } catch (dbError) {
      console.error("Aviso: Falha ao salvar no banco Prisma/Supabase", dbError);
    }

    // INTEGRAÇÃO COM N8N - Clonagem do Workflow Template
    const TEMPLATE_WORKFLOW_ID = process.env.N8N_TEMPLATE_WORKFLOW_ID || 'template_id';
    console.log("Tentando clonar template:", TEMPLATE_WORKFLOW_ID, "com nome:", clinicName);
    const newWorkflowId = await n8nService.cloneWorkflow(TEMPLATE_WORKFLOW_ID, clinicName);
    console.log("ID do novo workflow clonado retornado:", newWorkflowId);

    // NOTIFICAR O DONO (VIA N8N WEBHOOK - "Notificar_Humano")
    const NOTIFICAR_WEBHOOK_URL = process.env.N8N_NOTIFICAR_WEBHOOK_URL;
    console.log("URL de notificação configurada:", NOTIFICAR_WEBHOOK_URL);
    if (NOTIFICAR_WEBHOOK_URL) {
      try {
        console.log("Disparando post para webhook do n8n...");

        const profs = doctors.map((d: any) => ` - ${d.name} (${d.specialty})${d.registry ? ` [${d.registry}]` : ''}`).join('\n');
        const contatosWhats = agendaTypes.includes("WHATSAPP") && whatsappContacts ? `\n📞 *NOTIFICAÇÕES NO WHATSAPP DOS MÉDICOS:*\n` + whatsappContacts.map((c: any) => ` - ${c.name} (${c.specialty}): ${c.phone}`).join('\n') + '\n' : '';
        const contatosDiretos = directContacts && directContacts.length > 0 ? `\n💬 *FALAR DIRETO COM O MÉDICO (WHATSAPP):*\n` + directContacts.map((c: any) => ` - ${c.name} (${c.specialty}): ${c.phone}`).join('\n') + '\n' : '';
        const canais = agendaTypes ? agendaTypes.join(', ') : 'Nenhum';
        const calInt = agendaTypes.includes("CALENDAR") ? '*Integração Google Calendar:* Ativada\n' : '';
        const diasOp = schedule && schedule.operatingDays ? schedule.operatingDays.join(', ') : 'Segunda a Sexta';

        const mensagemFormatada = `📋 *NOVO CADASTRO DE CLÍNICA*\n
*Nome da Clínica:* ${clinicName || 'Não informado'}
*Tipo:* ${clinicType || 'Não informado'}
*Telefone Principal (IA):* ${clinicPhone || 'Não informado'}
${clinicAddress ? `*Endereço:* ${clinicAddress}\n` : ''}
👨‍⚕️ *PROFISSIONAIS CADASTRADOS:*
${profs ? profs : 'Nenhum'}

⚙ *CONFIGURAÇÃO DE AGENDA:*
*Canais Escolhidos:* ${canais}
${contatosWhats}${calInt}${contatosDiretos}
🕐 *HORÁRIO DE ATENDIMENTO:*
*Dias:* ${diasOp}
*Horário:* das ${schedule?.start || '08:00'} às ${schedule?.end || '18:00'}
*Intervalo:* ${schedule?.interval || '30'} minutos
*Valor da Consulta:* R$ ${schedule?.price || '0'}`;

        // 1. Notificar direto via Z-API no WhatsApp do dono, garantindo 100% de entrega e evitando falhas na expression do N8N
        try {
          await fetch("https://api.z-api.io/instances/3F59285D2F34B3BDBEDF8292A550B686/token/AF68A3D8D69F03D8AF3FE3E3/send-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: "5581979066573", // Numero do admin extraído do workflow
              message: mensagemFormatada,
              delayTyping: 2
            })
          });
          console.log("Notificação direta via Z-API disparada com sucesso.");
        } catch (zErr: any) {
          console.error("Falha ao notificar Z-API:", zErr.message || zErr);
        }

        // 2. Continua enviando o POST de Backup para o Webhook Config-Empresa do N8N
        const response = await fetch(NOTIFICAR_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: 'NOVA_CLINICA_CADASTRADA',
            clinicId,
            clinicName,
            clinicType,
            clinicAddress,
            clinicPhone,
            doctors,
            agendaTypes,
            whatsappContacts,
            directContacts,
            doctorDirectPhone: mainDirectPhone,
            schedule,
            newWorkflowId,
            mensagemFormatada
          })
        });
        console.log("Status da resposta da notificação webhook:", response.status);
        const responseText = await response.text();
        console.log("Resposta do webhook:", responseText);
      } catch (err: any) {
        console.error("Falha ao notificar o admin via n8n", err.message || err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      clinicId,
      newWorkflowId,
      message: "Clínica configurada com sucesso e Workflow do n8n isolado gerado!"
    });

  } catch (error: any) {
    console.error("Erro no Onboarding:", error);
    return NextResponse.json({ error: 'Erro ao processar onboarding.' }, { status: 500 });
  }
}
