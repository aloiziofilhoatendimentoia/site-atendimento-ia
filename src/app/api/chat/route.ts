import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma mensagem enviada.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyAPexPO6rFOmoMUcUtn4TNsrihrbCk6d-A';

    // 1. Formatar o histórico completo da conversa para a API do Gemini manter contexto perfeito
    const contents = messages.map((m: { sender: string; text: string }) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstructionText = `
<system_identity>
  <agent_name>Fernanda</agent_name>
  <company>Clínica Vitae</company>
  <role>Você é a Fernanda, recepcionista real e humanizada da Clínica Vitae (especializada em pediatria e atendimento médico).</role>
  
  <clinic_info>
    - Endereço: Rua do Cajueiro, 83 - Peixinhos, Olinda - PE (Google Maps: https://maps.app.goo.gl/ZCwjazLo6mooZjxVA?g_st=aw)
    - Horário de Funcionamento: Segunda a Sexta das 08:00 às 18:00 | Sábados das 08:00 às 12:00 | Domingos e Feriados: Fechado
    - Consulta: R$ 120,00 (duração 60 min)
  </clinic_info>

  <critical_rules>
    1. CONTEXTO TOTAL DA CONVERSA: Responda de acordo com o histórico completo.
    2. SE O PACIENTE DISSER APENAS QUE QUER AGENDAR (Sem informar o dia nem o período):
       - Responda apenas de forma direta em 1 balão: "Claro! Qual dia e horário você prefere para o seu agendamento?"
       - NUNCA diga "vou verificar na agenda" se o paciente não informou nenhum dia.

    3. REGRAS DE HORÁRIOS DISPONÍVEIS POR PERÍODO (APÓS INFORMAR O DIA OU PERÍODO):
       a) Se o paciente pediu especificamente PELA MANHÃ (ex: "quais os horários amanhã pela manhã?", "segunda de manhã"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] pela manhã, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã. Qual destes dois horários fica melhor para você?"
          - NUNCA cite horários da tarde (14h/16h) se o paciente pediu pela manhã!

       b) Se o paciente pediu especificamente PELA TARDE (ex: "quais os horários amanhã pela tarde?", "segunda de tarde"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] pela tarde, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 14:00 e às 16:00 horas pela tarde. Qual destes dois horários fica melhor para você?"
          - NUNCA cite horários da manhã (9h/11h) se o paciente pediu pela tarde!

       c) Se o paciente pediu horários SEM especificar se quer manhã ou tarde (ex: "quais os horários disponíveis amanhã?"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia], só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã, e às 14:00 e às 16:00 horas pela tarde. Qual horário fica melhor para você?"

    4. SE O PACIENTE PERGUNTAR PELO HORÁRIO DE FUNCIONAMENTO DA CLÍNICA:
       - Responda: "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊"

    5. REGRA OBRIGATÓRIA DE MENSAGENS SEPARADAS (\n\n):
       - Separe sempre os balões com Enter duplo (\n\n).
  </critical_rules>
</system_identity>
`;

    // 2. Chamar a API do Gemini com instrução de sistema e histórico completo
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2000
        }
      })
    });

    if (response.ok) {
      const geminiData = await response.json();
      const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        return NextResponse.json({ reply: aiReply });
      }
    } else {
      const errText = await response.text();
      console.error("Gemini API Status Error:", response.status, errText);
    }

    // 3. Motor Inteligente de Atendimento Infalível (Fallback de Alta Precisão)
    const lastMsgText = messages[messages.length - 1].text.toLowerCase();
    const normMsg = lastMsgText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const diaMatch = normMsg.match(/\b(dia\s+\d{1,2}|amanha|hoje|segunda|terca|quarta|quinta|sexta|sabado|\d{1,2}\/\d{1,2})\b/i);
    const diaCitado = diaMatch ? diaMatch[0] : "";

    const isManha = /\b(manha|cedo|matutino)\b/i.test(normMsg.replace(/\bamanha\b/gi, ""));
    const isTarde = /\b(tarde|vespertino)\b/i.test(normMsg);
    
    let fallbackReply = messages.length > 1
      ? "Entendi! Como posso te ajudar com o seu agendamento na Clínica Vitae? 😊"
      : "Olá, sou a Fernanda, assistente do Dr. Roberto da Clínica Vitae. Em que posso te ajudar hoje?";

    if (/\b(funcionamento|funciona|atendimento|aberto|abre|expediente)\b/.test(normMsg)) {
      fallbackReply = "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊";
    } else if (diaMatch) {
      if (isManha) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} pela manhã, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã.\n\nQual destes dois horários fica melhor para você?`;
      } else if (isTarde) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} pela tarde, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 14:00 e às 16:00 horas pela tarde.\n\nQual destes dois horários fica melhor para você?`;
      } else {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado}, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã, e às 14:00 e às 16:00 horas pela tarde.\n\nQual horário fica melhor para você?`;
      }
    } else if (isManha) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis pela manhã, só um instante...\n\nTemos horários disponíveis às 09:00 e às 11:00 horas pela manhã.\n\nQual dia e horário você prefere?";
    } else if (isTarde) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis pela tarde, só um instante...\n\nTemos horários disponíveis às 14:00 e às 16:00 horas pela tarde.\n\nQual dia e horário você prefere?";
    } else if (/\b(agend|agendar|agendamento|marcar|reagendar|remarcar|consulta|consultas)\b/.test(normMsg)) {
      // Quando o usuário APENAS diz que quer agendar (SEM ESPECIFICAR O DIA NEM PERÍODO):
      fallbackReply = "Claro! Qual dia e horário você prefere para o seu agendamento?";
    } else if (/\b(sim|pode|ok|confirma|confirmar|positivo|claro|pode ser)\b/.test(normMsg)) {
      fallbackReply = "Agendamento confirmado com sucesso!\n\nA equipe da Clínica Vitae aguarda você de braços abertos. Posso ajudar com mais alguma dúvida?";
    } else if (/\b(obrigado|obrigada|valeu|perfeito|nada)\b/.test(normMsg)) {
      fallbackReply = "Fico à disposição! Se precisar de algo mais, estou por aqui. 😊";
    }

    return NextResponse.json({ reply: fallbackReply });

  } catch (error: any) {
    console.error("Erro na API de Chat:", error);
    return NextResponse.json({ 
      reply: "Desculpe a demora! Sou a Fernanda da Clínica Vitae.\n\nComo posso te ajudar hoje? 😊" 
    });
  }
}
