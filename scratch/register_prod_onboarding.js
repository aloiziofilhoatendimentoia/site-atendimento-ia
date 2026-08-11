async function seedProductionOnboarding() {
  const email = 'aloiziofilho2012@gmail.com';
  console.log(`Disparando cadastramento de onboarding mock para a produção para registrar o e-mail: ${email}`);
  
  const payload = {
    ownerEmail: email,
    clinica: {
      nomeClinica: 'Clínica Vitae de Teste',
      nomeSecretaria: 'Fernanda',
      endereco: 'Av. Paulista, 1000 - São Paulo/SP',
      whatsappClinica: '5581979066573',
      especialistas: [
        { nome: 'Dr. Roberto', especialidade: 'Cardiologia' }
      ]
    },
    integracoes: {
      opcoesAgendamento: { whatsapp: true, calendar: false },
      emailCalendar: 'calendar@gmail.com',
      whatsappHumano: '5581999999999',
      whatsappReceberAgendamento: '5581999999999',
      googleConnected: false
    },
    horarios: {
      tempoConsulta: '30',
      valorConsulta: 'R$ 150,00',
      blocosHorario: [
        { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], inicio: '08:00', fim: '18:00' }
      ]
    },
    servicos: [
      { servico: 'Consulta Geral', valor: 150.00 }
    ],
    googleTokens: null
  };

  try {
    const res = await fetch('https://atendimentoiaclinicas.tech/api/empresa/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('--- RESPOSTA DO CADASTRAMENTO ---');
    console.log('Status HTTP:', res.status);
    console.log('Corpo da Resposta:', JSON.stringify(data, null, 2));
    console.log('---------------------------------');
  } catch (err) {
    console.error('Erro ao conectar com a produção:', err);
  }
}

seedProductionOnboarding();
