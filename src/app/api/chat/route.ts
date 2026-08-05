import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma mensagem enviada.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY || '';

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
    2. SE O PACIENTE DISSER O DIA E O HORÁRIO JUNTOS (ex: "quero agendar para o dia 31 às 14h"):
       - BALÃO 1: "Vou verificar a disponibilidade do horário das [horário] para o [dia] em nossa agenda, só um instante..."
       - BALÃO 2: "Prontinho! Consultei nossa agenda e o horário das [horário] para o [dia] está disponível e pré-reservado.\n\nGostaria de confirmar a sua consulta para este dia e horário?"
       - NUNCA pergunte "qual horário fica melhor" se o paciente já informou o horário!

    3. SE O PACIENTE DISSER APENAS QUE QUER AGENDAR (Sem informar dia nem horário):
       - Responda apenas em 1 balão: "Claro! Qual dia e horário você prefere para o seu agendamento?"

    4. REGRAS DE HORÁRIOS DISPONÍVEIS POR PERÍODO (SE O PACIENTE INFORMAR APENAS O DIA OU PERÍODO):
       a) Se o paciente pediu especificamente PELA MANHÃ (ex: "quais os horários amanhã pela manhã?", "segunda de manhã"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] pela manhã, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã. Qual destes dois horários fica melhor para você?"

       b) Se o paciente pediu especificamente PELA TARDE (ex: "quais os horários amanhã pela tarde?", "segunda de tarde"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] pela tarde, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 14:00 e às 16:00 horas pela tarde. Qual destes dois horários fica melhor para você?"

       c) Se o paciente pediu horários SEM especificar se quer manhã ou tarde:
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia], só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã, e às 14:00 e às 16:00 horas pela tarde. Qual horário fica melhor para você?"

    6. SE O AGENDAMENTO JÁ FOI CONFIRMADO ANTERIORMENTE na conversa (o robô enviou "Agendamento confirmado com sucesso" ou similar): NUNCA ofereça, sugira ou pergunte se o paciente gostaria de agendar uma consulta. Em vez disso, apenas tire a dúvida solicitada de forma direta e pergunte se precisa de mais alguma informação sobre a consulta.

    7. REGRA DE VALOR DA CONSULTA: Se o paciente perguntar apenas o VALOR ou preço da consulta, responda única e exclusivamente: "A consulta médica na Clínica Vitae tem o valor de R$ 120,00.", sem adicionar nenhuma palavra sobre reembolso, convênio, consulta particular ou oferecer agendamento.
    
    8. REGRA DE TEMPO DA CONSULTA: Se o paciente perguntar apenas o TEMPO ou duração da consulta, responda única e exclusivamente: "A consulta tem duração de 60 minutos de atendimento personalizado.", sem adicionar nada mais.
    
    9. REGRA DE VALOR E TEMPO JUNTOS: Se o paciente perguntar o valor e o tempo/duração juntos na mesma mensagem, envie obrigatoriamente em dois balões separados (separados por \n\n):
       - Balão 1: "A consulta médica na Clínica Vitae tem o valor de R$ 120,00."
       - Balão 2: "A consulta tem duração de 60 minutos de atendimento personalizado."

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

    const hasConfirmedAppointment = messages.some((m: any) => 
      m.sender === 'bot' && 
      (m.text.includes('confirmado com sucesso') || m.text.includes('agendamento confirmado') || m.text.includes('Agendamento confirmado'))
    );

    const diaMatch = normMsg.match(/\b(dia\s+\d{1,2}|amanha|hoje|segunda|terca|quarta|quinta|sexta|sabado|\d{1,2}\/\d{1,2})\b/i);
    let diaCitado = diaMatch ? diaMatch[0] : "";
    if (!diaCitado) {
      for (let i = messages.length - 2; i >= 0; i--) {
        const text = messages[i].text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const match = text.match(/\b(dia\s+\d{1,2}|amanha|hoje|segunda|terca|quarta|quinta|sexta|sabado|\d{1,2}\/\d{1,2})\b/i);
        if (match) {
          diaCitado = match[0];
          break;
        }
      }
    }

    const horaMatch = normMsg.match(/\b(09:00|11:00|14:00|16:00|09h|11h|14h|16h|9h|as 14|as 9|as 11|as 16|\d{1,2}\s*h|\d{1,2}\s*horas?)\b/i);
    const horaCitada = horaMatch ? horaMatch[0] : "";

    const isManha = /\b(manha|cedo|matutino)\b/i.test(normMsg.replace(/\bamanha\b/gi, ""));
    const isTarde = /\b(tarde|vespertino)\b/i.test(normMsg);
    
    let fallbackReply = hasConfirmedAppointment 
      ? "Olá! Como posso te ajudar hoje? Ficou alguma dúvida sobre o seu agendamento?"
      : "Olá! Como posso te ajudar hoje? Quer agendar uma consulta, saber o endereço da clínica ou consultar nossos horários?";

    // 1. Saudação simples (oi, olá, bom dia, boa tarde)
    if (/^(oi|ola|bom dia|boa tarde|boa noite|oii|oie|opa)[\s!.]*$/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "Olá! Em que posso te ajudar hoje? Ficou alguma dúvida sobre a sua consulta marcada ou quer saber mais sobre a clínica?"
        : "Olá! Em que posso te ajudar hoje? Gostaria de agendar uma consulta, saber nosso endereço ou consultar nossos horários de funcionamento?";
    }
    // 2. Endereço e Localização
    else if (/\b(endereco|localizacao|onde fica|onde e|como chegar|mapa|rua)\b/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "Ficamos localizados na Rua do Cajueiro, 83 - Peixinhos, Olinda - PE.\n\nLink do Google Maps: https://maps.app.goo.gl/ZCwjazLo6mooZjxVA?g_st=aw"
        : "Ficamos localizados na Rua do Cajueiro, 83 - Peixinhos, Olinda - PE.\n\nLink do Google Maps: https://maps.app.goo.gl/ZCwjazLo6mooZjxVA?g_st=aw\n\nGostaria de agendar uma consulta conosco?";
    }
    // 3. Especialidades e Médicos
    else if (/\b(especialidade|especialidades|medico|doutor|dr|pediatra|pediatria)\b/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "A Clínica Vitae é especializada em pediatria e atendimento médico infantil com foco no desenvolvimento das crianças."
        : "A Clínica Vitae é especializada em pediatria e atendimento infantil. Nossos especialistas (como o Dr. Roberto) são focados em oferecer o melhor cuidado para os pequenos. 👶🏥\n\nGostaria de verificar a disponibilidade de horários para agendar uma consulta?";
    }
    // 3b. Valor e Tempo Juntos
    else if (/\b(valor|preco|quanto custa|quanto e|preco|consulta)\b/i.test(normMsg) && /\b(tempo|duracao|minutos|min|durar|hora|horas)\b/i.test(normMsg)) {
      fallbackReply = "A consulta médica na Clínica Vitae tem o valor de R$ 120,00.\n\nA consulta tem duração de 60 minutos de atendimento personalizado.";
    }
    // 3c. Tempo / Duração
    else if (/\b(tempo|duracao|minutos|min|durar|hora|horas)\b/i.test(normMsg)) {
      fallbackReply = "A consulta tem duração de 60 minutos de atendimento personalizado.";
    }
    // 3d. Valor / Preço
    else if (/\b(valor|preco|quanto custa|quanto e|preco|particular|convenio|consulta)\b/i.test(normMsg)) {
      fallbackReply = "A consulta médica na Clínica Vitae tem o valor de R$ 120,00.";
    }
    // 4. Horário de Funcionamento da Clínica
    else if (/\b(funcionamento|funciona|atendimento|aberto|abre|expediente)\b/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊"
        : "Nosso horário de funcionamento é de Segunda a Sexta, das 08:00 às 18:00, e aos Sábados, das 08:00 às 12:00.\n\nDomingos e feriados estamos fechados. 😊\n\nQual dia e horário você prefere para a sua consulta?";
    }
    // 5. Se o paciente informou o DIA E O HORÁRIO JUNTOS
    else if (diaMatch && horaCitada) {
      fallbackReply = `Vou verificar a disponibilidade do horário das ${horaCitada} para o ${diaCitado} em nossa agenda, só um instante...\n\nProntinho! Consultei nossa agenda e o horário das ${horaCitada} para o ${diaCitado} está disponível e pré-reservado.\n\nGostaria de confirmar a sua consulta para este dia e horário?`;
    }
    // 6. Agendamento com dia citado (sem horário ainda)
    else if (diaMatch) {
      if (isManha) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} pela manhã, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã.\n\nQual destes dois horários fica melhor para você?`;
      } else if (isTarde) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} pela tarde, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 14:00 e às 16:00 horas pela tarde.\n\nQual destes dois horários fica melhor para você?`;
      } else {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado}, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã, e às 14:00 e às 16:00 horas pela tarde.\n\nQual horário fica melhor para você?`;
      }
    }
    // 6. Consulta por período apenas (sem dia específico)
    else if (isManha) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis pela manhã, só um instante...\n\nTemos horários disponíveis às 09:00 e às 11:00 horas pela manhã.\n\nQual dia e horário você prefere?";
    } else if (isTarde) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis pela tarde, só um instante...\n\nTemos horários disponíveis às 14:00 e às 16:00 horas pela tarde.\n\nQual dia e horário você prefere?";
    }
    // 7. Pedido genérico de agendamento (sem dia nem período)
    else if (/\b(agend|agendar|agendamento|marcar|reagendar|remarcar|consulta|consultas)\b/i.test(normMsg)) {
      fallbackReply = "Claro! Qual dia e horário você prefere para o seu agendamento?";
    }
    // 8. Confirmação (SÓ CONFIRMA SE O DIA JÁ FOI CITADO ANTERIORMENTE NA CONVERSA)
    else if (/\b(sim|pode|ok|confirma|confirmar|positivo|claro|pode ser|09:00|11:00|14:00|16:00|9h|11h|14h|16h|9|11|14|16)\b/i.test(normMsg)) {
      if (diaCitado) {
        fallbackReply = "Agendamento confirmado com sucesso! 🎉\n\nA equipe da Clínica Vitae aguarda você de braços abertos. Posso ajudar com mais alguma dúvida?";
      } else {
        fallbackReply = "Claro! Qual dia e horário você prefere para o seu agendamento?";
      }
    }
    // 9. Agradecimento e despedida
    else if (/\b(obrigado|obrigada|valeu|perfeito|nada|tchau|ate logo)\b/i.test(normMsg)) {
      fallbackReply = "Fico à disposição! Se precisar de algo mais, estou por aqui. Tenha um ótimo dia! 😊";
    }

    return NextResponse.json({ reply: fallbackReply });

  } catch (error: any) {
    console.error("Erro na API de Chat:", error);
    return NextResponse.json({ 
      reply: "Desculpe a demora! Sou a Fernanda da Clínica Vitae.\n\nComo posso te ajudar hoje? 😊" 
    });
  }
}
