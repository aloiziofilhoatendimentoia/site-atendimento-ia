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
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    };
    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const dateParts = formatter.formatToParts(now);
    const dayVal = dateParts.find(p => p.type === 'day')?.value || '';
    const monthVal = dateParts.find(p => p.type === 'month')?.value || '';
    const yearVal = dateParts.find(p => p.type === 'year')?.value || '';
    const weekdayVal = dateParts.find(p => p.type === 'weekday')?.value || '';

    const dataAtualTexto = `${dayVal}/${monthVal}/${yearVal}`;
    const diaDaSemanaTexto = weekdayVal ? weekdayVal.charAt(0).toUpperCase() + weekdayVal.slice(1) : "";

    const systemInstructionText = `
<system_identity>
  <agent_name>Fernanda</agent_name>
  <company>Clínica Vitae</company>
  <role>Você é a Fernanda, recepcionista real e humanizada da Clínica Vitae (especializada única e exclusivamente em pediatria e atendimento infantil).</role>
  
  <clinic_info>
    - Endereço: R. Barão de Souza Leão, 729 - Boa Viagem * Recife (Google Maps: https://maps.app.goo.gl/2W1J8uyGvsMkyDWz5)
    - Horário de Funcionamento: Segunda a Sexta das 08:00 às 18:00 | Sábados das 08:00 às 12:00 | Domingos e Feriados: Fechado
    - Consulta: R$ 120,00 (duração 60 min)
    - Data de Hoje (Horário de Brasília): ${diaDaSemanaTexto}, ${dataAtualTexto}
  </clinic_info>

  <critical_rules>
    1. CONTEXTO TOTAL DA CONVERSA: Responda de acordo com o histórico completo.
    
    2. SE O PACIENTE RESPONDER ESCOLHENDO UM DOS HORÁRIOS ESPECÍFICOS QUE VOCÊ ACABOU DE OFERECER/DIZER QUE ESTÃO DISPONÍVEIS (ex: após você enviar os horários disponíveis e perguntar "Qual horário fica melhor para você?", o paciente responde "às 09:00", "pode ser as 9" ou qualquer um dos horários que você listou):
       - NUNCA diga que vai "verificar a disponibilidade novamente", "consultar a agenda" ou "pré-reservar".
       - ANTES de confirmar o agendamento, verifique se o nome completo do paciente foi informado anteriormente na conversa.
       - SE O NOME COMPLETO NÃO FOI INFORMADO: Você deve responder com um único balão pedindo o nome: "Para finalizar, qual o nome completo do paciente?"
       - SE O NOME COMPLETO JÁ FOI INFORMADO: Responda obrigatoriamente em 3 balões separados por \n\n:
         * BALÃO 1: "Agendamento confirmado com sucesso! 🎉"
         * BALÃO 2: "**Ficha da consulta**:\n- Paciente: [Nome Completo do Paciente]\n- Data: [Data Calculada no formato DD/MM/AAAA]\n- Horário: [Horário Escolhido]"
         * BALÃO 3: "Posso ajudar em mais alguma coisa?"

    3. SE O PACIENTE DISSER O DIA E O HORÁRIO JUNTOS LOGO DE INÍCIO (sem você ter oferecido os horários disponíveis antes, ex: "quero agendar para amanhã às 14h", "amanhã as 10h"):
       - BALÃO 1: "Vou verificar a disponibilidade de horário para este dia em nossa agenda, só um instante..."
       - BALÃO 2: "Prontinho! Consultei nossa agenda e o horário está disponível."
       - SE O NOME COMPLETO NÃO FOI INFORMADO AINDA:
         * BALÃO 3: "Para finalizar, qual o nome completo do paciente?"
       - SE O NOME COMPLETO JÁ FOI INFORMADO:
         * BALÃO 3: "Agendamento confirmado com sucesso! 🎉"
         * BALÃO 4: "**Ficha da consulta**:\n- Paciente: [Nome Completo do Paciente]\n- Data: [Data Calculada no formato DD/MM/AAAA]\n- Horário: [Horário Escolhido]"
         * BALÃO 5: "Posso ajudar em mais alguma coisa?"

    4. SE O PACIENTE DISSER APENAS QUE QUER AGENDAR (Sem informar dia nem horário):
       - Responda apenas em 1 balão: "Claro! Qual dia e horário você prefere para o seu agendamento?"

    5. REGRAS DE HORÁRIOS DISPONÍVEIS POR PERÍODO (SE O PACIENTE INFORMAR APENAS O DIA OU PERÍODO):
       a) Se o paciente pediu especificamente PELA MANHÃ (ex: "quais os horários amanhã pela manhã?", "segunda de manhã"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] pela manhã, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã. Qual destes dois horários fica melhor para você?"

       b) Se o paciente pediu especificamente À TARDE (ex: "quais os horários amanhã à tarde?", "segunda à tarde"):
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia] à tarde, só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] à tarde, às 14:00 e às 16:00 horas. Qual destes dois horários fica melhor para você?"

       c) Se o paciente pediu horários SEM especificar se quer manhã ou tarde:
          - BALÃO 1: "Vou verificar a disponibilidade em nossa agenda para [dia], só um instante..."
          - BALÃO 2: "Temos horários disponíveis para [dia] às 09:00 e às 11:00 horas pela manhã, e à tarde, às 14:00 e às 16:00 horas. Qual horário fica melhor para você?"

    6. SE O AGENDAMENTO JÁ FOI CONFIRMADO ANTERIORMENTE na conversa (o robô enviou "Agendamento confirmado com sucesso" ou similar): NUNCA ofereça, sugira ou pergunte se o paciente gostaria de agendar uma consulta. Em vez disso, apenas tire a dúvida solicitada de forma direta e pergunte se precisa de mais alguma informação sobre a consulta.

    7. REGRA DE VALOR DA CONSULTA: Se o paciente perguntar apenas o VALOR ou preço da consulta, responda única e exclusivamente: "A consulta médica na Clínica Vitae tem o valor de R$ 120,00.", sem adicionar nenhuma palavra sobre reembolso, convênio, consulta particular ou oferecer agendamento.
    
    8. REGRA DE TEMPO DA CONSULTA: Se o paciente perguntar apenas o TEMPO ou duração da consulta, responda única e exclusivamente: "A consulta tem duração de 60 minutos de atendimento personalizado.", sem adicionar nada mais.
    
    9. REGRA DE VALOR E TEMPO JUNTOS: Se o paciente perguntar o valor e o tempo/duração juntos na mesma mensagem, envie obrigatoriamente em dois balões separados (separados por \n\n):
       - Balão 1: "A consulta médica na Clínica Vitae tem o valor de R$ 120,00."
       - Balão 2: "A consulta tem duração de 60 minutos de atendimento personalizado."

    11. REGRA DE REAGENDAMENTO (SE O PACIENTE SOLICITAR REAGENDAR, ALTERAR OU REMARCAR A CONSULTA):
        - Se o paciente solicitar reagendar a consulta E informar a nova data/horário (ex: "quero reagendar para dia 08 no mesmo horário"):
          * Você deve enviar obrigatoriamente 4 balões separados por \n\n:
            - BALÃO 1: "Vou verificar a disponibilidade para reagendamento em nossa agenda, só um instante..."
            - BALÃO 2: "Prontinho! Consultei nossa agenda e o seu agendamento foi reagendado com sucesso! 🎉"
            - BALÃO 3: "**Ficha da consulta**:\n- Paciente: [Nome Completo do Paciente]\n- Data: [Nova Data Calculada no formato DD/MM/AAAA]\n- Horário: [Novo Horário]"
            - BALÃO 4: "Posso ajudar em mais alguma coisa?"
        - Se o paciente disser apenas que quer reagendar (sem informar a nova data/horário):
          * Responda em 1 único balão: "Claro! Para qual dia e horário você deseja reagendar?"

    12. RESTRIÇÃO DE ESCOPO (GUARDRAIL):
        - A Fernanda é uma assistente focada exclusivamente no atendimento da Clínica Vitae.
        - Se o usuário fugir do assunto da clínica (ex: fizer perguntas sobre receitas culinárias, programação, outros estabelecimentos, piadas, curiosidades gerais ou qualquer assunto não relacionado a consultas, saúde ou à clínica), responda de forma educada e prestativa que você só pode falar de assuntos referentes a informações ou agendamentos da Clínica Vitae.

    13. DATA ATUAL E CÁLCULO DE DATA DA CONSULTA:
        - NUNCA repita datas relativas como "amanhã", "próximo domingo" ou similares na Ficha da consulta.
        - Usando a "Data de Hoje (Horário de Brasília)" fornecida no <clinic_info>, calcule mentalmente e escreva a data exata do agendamento no formato DD/MM/AAAA (ex: se hoje é segunda-feira 10/08/2026 e o paciente pede "amanhã", a data na ficha deve ser "11/08/2026"; se ele quer "próxima quarta", a data na ficha deve ser "12/08/2026").

    14. RESTRIÇÃO DE SAUDAÇÕES REPETIDAS:
        - NUNCA diga "Olá", "Olá!", "Tudo bem?", "Bom dia" ou qualquer outra saudação em mensagens que não sejam a primeira da conversa. Se a conversa já se iniciou e está se desenrolando, responda diretamente sem saudações redundantes.

    15. REGRA DE ENDEREÇO E LOCALIZAÇÃO (OBRIGATÓRIO EM 3 BALÕES SEPARADOS POR \n\n):
        - Se o paciente perguntar pelo endereço ou localização da clínica (ex: "qual o endereço?", "onde fica?"):
          * Se o agendamento NÃO foi confirmed ainda, envie obrigatoriamente 3 balões separados por \n\n:
            - BALÃO 1: "O endereço da Clínica Vitae é R. Barão de Souza Leão, 729 - Boa Viagem * Recife."
            - BALÃO 2: "Você pode conferir no Google Maps por este link: https://maps.app.goo.gl/2W1J8uyGvsMkyDWz5"
            - BALÃO 3: "Gostaria de agendar uma consulta conosco?"
          * Se o agendamento JÁ foi confirmado anteriormente, envie obrigatoriamente 3 balões separados por \n\n:
            - BALÃO 1: "O endereço da Clínica Vitae é R. Barão de Souza Leão, 729 - Boa Viagem * Recife."
            - BALÃO 2: "Você pode conferir no Google Maps por este link: https://maps.app.goo.gl/2W1J8uyGvsMkyDWz5"
            - BALÃO 3: "Posso ajudar em mais alguma coisa?"

    10. REGRA OBRIGATÓRIA DE MENSAGENS SEPARADAS (\n\n):
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
      let aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        // Correção de segurança de IA: Força a separação exata por Enter duplo (\n\n) 
        // caso a IA retorne tudo colado, com espaço, ou quebra simples
        aiReply = aiReply.replace(/\s*(Você pode conferir no Google Maps)/gi, "\n\n$1").trim();
        aiReply = aiReply.replace(/\s*(Posso ajudar em mais alguma coisa\?|Gostaria de agendar uma consulta conosco\?)/gi, "\n\n$1").trim();
        aiReply = aiReply.replace(/\s*(Prontinho! Consultei nossa agenda)/gi, "\n\n$1").trim();
        aiReply = aiReply.replace(/\s*(Para finalizar, qual o nome completo)/gi, "\n\n$1").trim();

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
    let horaCitada = horaMatch ? horaMatch[0] : "";
    if (!horaCitada) {
      for (let i = messages.length - 2; i >= 0; i--) {
        const text = messages[i].text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const match = text.match(/\b(09:00|11:00|14:00|16:00|09h|11h|14h|16h|9h|as 14|as 9|as 11|as 16|\d{1,2}\s*h|\d{1,2}\s*horas?)\b/i);
        if (match) {
          horaCitada = match[0];
          break;
        }
      }
    }

    const isManha = /\b(manha|cedo|matutino)\b/i.test(normMsg.replace(/\bamanha\b/gi, ""));
    const isTarde = /\b(tarde|vespertino)\b/i.test(normMsg);

    let nomePaciente = "";
    let isAguardandoNome = false;

    // Verificar se o bot pediu o nome na ultima mensagem
    const lastBotMsgIndex = messages.map((m: any) => m.sender).lastIndexOf('bot');
    if (lastBotMsgIndex !== -1) {
      const lastBotText = messages[lastBotMsgIndex].text.toLowerCase();
      if (lastBotText.includes("qual o nome completo do paciente")) {
        isAguardandoNome = true;
      }
    }

    // Tentar recuperar o nome do paciente no histórico
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].sender === 'bot' && messages[i].text.toLowerCase().includes("qual o nome completo do paciente")) {
        nomePaciente = messages[i + 1].text.trim();
        break;
      }
    }

    if (isAguardandoNome && !nomePaciente) {
      nomePaciente = messages[messages.length - 1].text.trim();
    }

    function getFormattedDateForDay(diaStr: string): string {
      if (!diaStr) return "";
      const today = new Date();
      // Ajuste de fuso horário para Brasília (UTC-3)
      const localToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      
      const norm = diaStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (norm.includes("hoje")) {
        return localToday.toLocaleDateString('pt-BR');
      }
      if (norm.includes("amanha")) {
        const tomorrow = new Date(localToday);
        tomorrow.setDate(localToday.getDate() + 1);
        return tomorrow.toLocaleDateString('pt-BR');
      }
      
      // Mapear dias da semana
      const diasSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
      const diaAtual = localToday.getDay(); // 0 = domingo, 1 = segunda, etc.
      
      for (let i = 0; i < 7; i++) {
        if (norm.includes(diasSemana[i])) {
          let diff = i - diaAtual;
          if (diff <= 0) diff += 7; // Próximo dia da semana
          const targetDate = new Date(localToday);
          targetDate.setDate(localToday.getDate() + diff);
          return targetDate.toLocaleDateString('pt-BR');
        }
      }
      
      // Se for formato dd/mm ou dia dd
      const matchDiaNum = norm.match(/\bdia\s+(\d{1,2})\b/i) || norm.match(/\b(\d{1,2})\/\d{1,2}\b/) || norm.match(/\b(\d{1,2})\b/);
      if (matchDiaNum) {
        const targetDay = parseInt(matchDiaNum[1], 10);
        const targetDate = new Date(localToday);
        if (targetDay < localToday.getDate()) {
          // Se o dia já passou no mês atual, assume o próximo mês
          targetDate.setMonth(localToday.getMonth() + 1);
        }
        targetDate.setDate(targetDay);
        return targetDate.toLocaleDateString('pt-BR');
      }

      return diaStr.charAt(0).toUpperCase() + diaStr.slice(1);
    }

    const diaFormatado = getFormattedDateForDay(diaCitado);
    const horaFormatada = horaCitada ? horaCitada.replace(/as\s*/gi, "").replace(/\bh\b/gi, ":00").trim() : "";
    
    let fallbackReply = hasConfirmedAppointment 
      ? "Como posso te ajudar hoje? Ficou alguma dúvida sobre o seu agendamento?"
      : "Como posso te ajudar hoje? Quer agendar uma consulta, saber o endereço da clínica ou consultar nossos horários?";

    // 1. Saudação simples (oi, olá, bom dia, boa tarde)
    if (/^(oi|ola|bom dia|boa tarde|boa noite|oii|oie|opa)[\s!.]*$/i.test(normMsg)) {
      const saudacao = messages.length <= 1 ? "Olá! " : "";
      fallbackReply = hasConfirmedAppointment
        ? `${saudacao}Em que posso te ajudar hoje? Ficou alguma dúvida sobre a sua consulta marcada ou quer saber mais sobre a clínica?`
        : `${saudacao}Em que posso te ajudar hoje? Gostaria de agendar uma consulta, saber nosso endereço ou consultar nossos horários de funcionamento?`;
    }
    // 2. Endereço e Localização (3 Balões Separados por \n\n)
    else if (/\b(endereco|localizacao|onde fica|onde e|como chegar|mapa|rua)\b/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "O endereço da Clínica Vitae é R. Barão de Souza Leão, 729 - Boa Viagem * Recife.\n\nVocê pode conferir no Google Maps por este link: https://maps.app.goo.gl/2W1J8uyGvsMkyDWz5\n\nPosso ajudar em mais alguma coisa?"
        : "O endereço da Clínica Vitae é R. Barão de Souza Leão, 729 - Boa Viagem * Recife.\n\nVocê pode conferir no Google Maps por este link: https://maps.app.goo.gl/2W1J8uyGvsMkyDWz5\n\nGostaria de agendar uma consulta conosco?";
    }
    // 3. Especialidades e Médicos
    else if (/\b(especialidade|especialidades|medico|doutor|dr|pediatra|pediatria)\b/i.test(normMsg)) {
      fallbackReply = hasConfirmedAppointment
        ? "A Clínica Vitae é especializada exclusivamente em pediatria e atendimento infantil com foco no desenvolvimento das crianças."
        : "A Clínica Vitae é especializada exclusivamente em pediatria e atendimento infantil. Nossos especialistas (como o Dr. Roberto) são focados em oferecer o melhor cuidado para os pequenos. 👶🏥\n\nGostaria de verificar a disponibilidade de horários para agendar uma consulta?";
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
    // 4b. Reagendamento
    else if (/\b(reagendar|remarcar|alterar|mudar)\b/i.test(normMsg)) {
      if (diaCitado && horaCitada) {
        fallbackReply = `Vou verificar a disponibilidade para reagendamento em nossa agenda, só um instante...\n\nProntinho! Consultei nossa agenda e o seu agendamento foi reagendado com sucesso! 🎉\n\n**Ficha da consulta**:\n- Paciente: ${nomePaciente || 'Paciente'}\n- Data: ${diaFormatado}\n- Horário: ${horaFormatada}\n\nPosso ajudar em mais alguma coisa?`;
      } else {
        fallbackReply = "Claro! Para qual dia e horário você deseja reagendar?";
      }
    }
    // 5. Se o paciente informou o DIA E O HORÁRIO JUNTOS (ou já temos ambos definidos)
    else if (diaCitado && horaCitada) {
      if (!nomePaciente) {
        fallbackReply = "Para finalizar, qual o nome completo do paciente?";
      } else {
        fallbackReply = `Agendamento confirmado com sucesso! 🎉\n\n**Ficha da consulta**:\n- Paciente: ${nomePaciente}\n- Data: ${diaFormatado}\n- Horário: ${horaFormatada}\n\nPosso ajudar em mais alguma coisa?`;
      }
    }
    // 6. Agendamento com dia citado (sem horário ainda)
    else if (diaMatch) {
      if (isManha) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} pela manhã, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã.\n\nQual destes dois horários fica melhor para você?`;
      } else if (isTarde) {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado} à tarde, só um instante...\n\nTemos horários disponíveis para ${diaCitado} à tarde, às 14:00 e às 16:00 horas.\n\nQual destes dois horários fica melhor para você?`;
      } else {
        fallbackReply = `Vou verificar a disponibilidade em nossa agenda para ${diaCitado}, só um instante...\n\nTemos horários disponíveis para ${diaCitado} às 09:00 e às 11:00 horas pela manhã, e à tarde, às 14:00 e às 16:00 horas.\n\nQual horário fica melhor para você?`;
      }
    }
    // 6. Consulta por período apenas (sem dia específico)
    else if (isManha) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis pela manhã, só um instante...\n\nTemos horários disponíveis às 09:00 e às 11:00 horas pela manhã.\n\nQual dia e horário você prefere?";
    } else if (isTarde) {
      fallbackReply = "Vou verificar em nossa agenda os horários disponíveis à tarde, só um instante...\n\nTemos horários disponíveis à tarde, às 14:00 e às 16:00 horas.\n\nQual dia e horário você prefere?";
    }
    // 7. Pedido genérico de agendamento (sem dia nem período)
    else if (/\b(agend|agendar|agendamento|marcar|reagendar|remarcar|consulta|consultas)\b/i.test(normMsg)) {
      fallbackReply = "Claro! Qual dia e horário você prefere para o seu agendamento?";
    }
    // 8. Confirmação (SÓ CONFIRMA SE O DIA E HORÁRIO JÁ FORAM DEFINIDOS)
    else if (/\b(sim|pode|ok|confirma|confirmar|positivo|claro|pode ser)\b/i.test(normMsg)) {
      if (diaCitado && horaCitada) {
        if (!nomePaciente) {
          fallbackReply = "Para finalizar, qual o nome completo do paciente?";
        } else {
          fallbackReply = `Agendamento confirmado com sucesso! 🎉\n\n**Ficha da consulta**:\n- Paciente: ${nomePaciente}\n- Data: ${diaFormatado}\n- Horário: ${horaFormatada}\n\nPosso ajudar em mais alguma coisa?`;
        }
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
