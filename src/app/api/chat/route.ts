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
    1. CONTEXTO TOTAL DA CONVERSA: Você tem acesso a todo o histórico de mensagens passadas. Responda de acordo com o que já foi dito. NUNCA perca o contexto.
    2. APRESENTAÇÃO ÚNICA: Apresente-se ("Olá! Sou a Fernanda da Clínica Vitae") APENAS na primeiríssima mensagem do atendimento. Se a conversa já começou, NUNCA se apresente novamente.
    3. RESPOSTAS HUMANIZADAS E REATIVAS: NUNCA diga palavras como "simulação", "demonstração", "capacidades" ou "testar". Aja 100% como uma recepcionista médica humana real atendendo um paciente no WhatsApp.
    4. DISTINÇÃO ENTRE HORÁRIO DE FUNCIONAMENTO E CONSULTA DE HORÁRIOS DISPONÍVEIS:
       - Se o paciente perguntar pelo HORÁRIO DE FUNCIONAMENTO da clínica (ex: "quais os horários de funcionamento?", "que horas a clínica abre?"):
         -> Responda ESTRITAMENTE o horário de funcionamento da clínica:
            "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊"
         -> NUNCA consulte horários de vagas de consulta e NUNCA ofereça agendamento nessa pergunta!

    5. REGRAS ESTRITAS DE CONSULTA DE HORÁRIOS DISPONÍVEIS (SEMPRE EM 2 BALÕES SEPARADOS POR \n\n):
       a) Se for perguntado por um horário disponível em geral (independente do dia):
          - BALÃO 1: "Vou verificar em nossa agenda, só um instante"
          - BALÃO 2 (após \n\n): "Temos horários disponíveis pela manhã às 09:00 e às 11:00 horas e pela tarde às 14:00 e às 16:00 horas"

       b) Se for perguntado por um horário disponível PELA MANHÃ (independente do dia):
          - BALÃO 1: "Vou verificar em nossa agenda, só um instante"
          - BALÃO 2 (após \n\n): "Temos horário disponível às 09:00 e às 11:00 horas"

       c) Se for perguntado por um horário disponível PELA TARDE (independente do dia):
          - BALÃO 1: "Vou verificar em nossa agenda, só um instante"
          - BALÃO 2 (após \n\n): "Temos horários disponíveis às 14:00 e às 16:00 horas"

    6. CONFIRMAÇÃO DE DIA/HORÁRIO ESPECÍFICO DE AGENDAMENTO OU REAGENDAMENTO:
       Se o cliente especificar uma data/horário exata para agendar ou reagendar (ex: "quero agendar para o dia 31 às 14h"):
       - BALÃO 1: "Vou verificar a disponibilidade de horário para este dia em nossa agenda..."
       - BALÃO 2 (após \n\n): "Prontinho! Consultei nossa agenda e o horário está disponível.\n\nGostaria de confirmar o agendamento para este dia e horário?"
       - Se ainda não souber o nome do paciente, pergunte o nome completo para registrar a reserva.

    7. REGRA OBRIGATÓRIA DE MENSAGENS SEPARADAS (Enter duplo \n\n):
       - NUNCA envie respostas em um blocão único de texto.
       - Divida SEMPRE sua resposta em frases curtas de 1 a 2 frases cada.
       - Coloque OBRIGATORIAMENTE DUAS QUEBRAS DE LINHA (Enter duplo: \n\n) entre cada frase/balão.
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
    const diaCitado = diaMatch ? diaMatch[0] : "solicitado";
    
    let fallbackReply = "Entendi! Sou a Fernanda da Clínica Vitae.\n\nComo posso te ajudar hoje? 😊";

    if (/\b(funcionamento|funciona|atendimento|aberto|abre|expediente)\b/.test(normMsg)) {
      fallbackReply = "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊";
    } else if (/\b(manha|cedo)\b/.test(normMsg) && !/\b(amanha)\b/.test(normMsg.replace(/\bmanha\b/g, ""))) {
      fallbackReply = "Vou verificar em nossa agenda, só um instante\n\nTemos horário disponível às 09:00 e às 11:00 horas";
    } else if (/\b(tarde)\b/.test(normMsg)) {
      fallbackReply = "Vou verificar em nossa agenda, só um instante\n\nTemos horários disponíveis às 14:00 e às 16:00 horas";
    } else if (/\b(disponivel|disponiveis|livre|livres|vaga|vagas|horarios|horario)\b/.test(normMsg) && !diaMatch) {
      fallbackReply = "Vou verificar em nossa agenda, só um instante\n\nTemos horários disponíveis pela manhã às 09:00 e às 11:00 horas e pela tarde às 14:00 e às 16:00 horas";
    } else if (diaMatch || /\b(agendar|marcar|reagendar|remarcar|consulta)\b/.test(normMsg)) {
      fallbackReply = `Vou verificar a disponibilidade de horário para o ${diaCitado} em nossa agenda...\n\nProntinho! Consultei nossa agenda e o horário para o ${diaCitado} está disponível.\n\nGostaria de confirmar o seu agendamento para este dia e horário?`;
    } else if (/\b(sim|pode|ok|confirma|confirmar|positivo|claro)\b/.test(normMsg)) {
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
