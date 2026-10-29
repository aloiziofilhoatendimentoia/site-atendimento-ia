export type TipoClinica = 'medica' | 'odontologica' | 'outras';

export interface ClinicaTemplateConfig {
  id: TipoClinica;
  label: string;
  badge: string;
  subtitulo: string;
  nicho: string;
  tituloIdentidade: string;
  subtituloIdentidade: string;
  labelProfissional: string;
  placeholderClinica: string;
  placeholderProfissional: string;
  placeholderExameCustom: string;
  especialidadesSugeridas: string[];
  conveniosPadraoIniciais: string[];
  conveniosSugeridos: string[];
  procedimentosIniciais: string[];
  procedimentosSugeridos: string[];
  valoresSugeridos: string[];
  instrucoesIniciais: string[];
  instrucoesSugeridas: string[];
}

export const NOMES_ASSISTENTE_SUGERIDOS = [
  'Giovanna',
  'Sofia',
  'Clara',
  'Júlia',
  'Helena',
  'Beatriz'
];

export const ESTACIONAMENTO_SUGERIDOS = [
  'Estacionamento próprio e gratuito no local',
  'Estacionamento rotativo no prédio (pago)',
  'Convênio com estacionamento ao lado',
  'Vagas gratuitas em frente à clínica'
];

export const CLINICA_TEMPLATES: Record<TipoClinica, ClinicaTemplateConfig> = {
  medica: {
    id: 'medica',
    label: 'Clínica Médica',
    badge: 'Médica & Diagnósticos',
    subtitulo: 'Consultórios médicos, especialidades, policlínicas e exames',
    nicho: 'Médico',
    tituloIdentidade: 'Configuração Rápida — Clínica Médica',
    subtituloIdentidade: 'Opções médicas já pré-carregadas para você configurar quase tudo apenas com cliques.',
    labelProfissional: 'Nome do(a) Médico(a)',
    placeholderClinica: 'Ex: Clínica São Lucas, Instituto CardioVida',
    placeholderProfissional: 'Ex: Dr. Roberto Almeida',
    placeholderExameCustom: 'Ex: Endoscopia, Ecocardiograma, Mapeamento de Retina...',
    especialidadesSugeridas: [
      'Clínica Médica',
      'Cardiologia',
      'Dermatologia',
      'Ginecologia e Obstetrícia',
      'Pediatria',
      'Ortopedia',
      'Endocrinologia',
      'Psiquiatria',
      'Oftalmologia',
      'Otorrinolaringologia',
      'Urologia',
      'Neurologia',
      'Gastroenterologia',
      'Geriatria'
    ],
    conveniosPadraoIniciais: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil'],
    conveniosSugeridos: [
      'Unimed',
      'Bradesco Saúde',
      'SulAmérica',
      'Amil',
      'Hapvida',
      'NotreDame Intermédica',
      'Porto Seguro',
      'Cassi',
      'Golden Cross',
      'Allianz Saúde',
      'Geap',
      'Mediservice'
    ],
    procedimentosIniciais: ['Consulta Médica', 'Consulta de Retorno'],
    procedimentosSugeridos: [
      'Consulta Médica',
      'Consulta de Retorno',
      'Check-up Completo',
      'Teleconsulta (Online)',
      'Eletrocardiograma (ECG)',
      'Ultrassonografia',
      'Exames Laboratoriais / Coleta',
      'Mapa / Holter 24h',
      'Preventivo / Papanicolau',
      'Pequenos Procedimentos',
      'Biópsia / Cauterização',
      'Avaliação Pré-Operatória',
      'Teste Ergométrico',
      'Aplicação / Injetáveis'
    ],
    valoresSugeridos: ['R$ 200,00', 'R$ 250,00', 'R$ 300,00', 'R$ 350,00', 'R$ 400,00', 'R$ 500,00'],
    instrucoesIniciais: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer exames anteriores ou receitas recentes (caso possua).'
    ],
    instrucoesSugeridas: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer exames anteriores ou receitas recentes (caso possua).',
      'Menores de 18 anos devem estar acompanhados por um responsável legal.',
      'Em caso de imprevisto, avisar com pelo menos 24h de antecedência para reagendamento.',
      'Informar na chegada lista de medicamentos de uso contínuo ou alergias.'
    ]
  },
  odontologica: {
    id: 'odontologica',
    label: 'Clínica Odontológica',
    badge: 'Odontologia & Sorriso',
    subtitulo: 'Consultórios odontológicos, ortodontia, implantes e estética dental',
    nicho: 'Odontológico',
    tituloIdentidade: 'Configuração Rápida — Clínica Odontológica',
    subtituloIdentidade: 'Especialidades, planos odontológicos e tratamentos dentários prontos para selecionar em 1 clique.',
    labelProfissional: 'Nome do(a) Dentista',
    placeholderClinica: 'Ex: Clínica Vitae Odontologia, Sorriso Prime',
    placeholderProfissional: 'Ex: Dr. Lucas Mendes',
    placeholderExameCustom: 'Ex: Cirurgia Gengival, Alinhador Invisalign, Sedação Consciente...',
    especialidadesSugeridas: [
      'Clínico Geral',
      'Ortodontia (Aparelho)',
      'Implantodontia',
      'Endodontia (Canal)',
      'Odontopediatria',
      'Estética / Clareamento & Lentes',
      'Harmonização Orofacial',
      'Prótese Dentária',
      'Cirurgia / Extração de Siso',
      'Periodontia'
    ],
    conveniosPadraoIniciais: ['OdontoPrev', 'Bradesco Dental', 'Amil Dental', 'SulAmérica Odonto'],
    conveniosSugeridos: [
      'OdontoPrev',
      'Bradesco Dental',
      'Amil Dental',
      'SulAmérica Odonto',
      'Uniodonto',
      'MetLife',
      'Hapvida +Odonto',
      'Porto Seguro Odonto',
      'Interodonto',
      'Odonto System',
      'DentalUni',
      'InpaO Dental'
    ],
    procedimentosIniciais: ['Avaliação Odontológica', 'Limpeza (Profilaxia)'],
    procedimentosSugeridos: [
      'Avaliação Odontológica',
      'Limpeza (Profilaxia)',
      'Clareamento Dental',
      'Aparelho Ortodôntico',
      'Manutenção de Aparelho',
      'Implante Dentário',
      'Extração / Dente do Siso',
      'Tratamento de Canal',
      'Restauração em Resina',
      'Lentes / Facetas Dentárias',
      'Prótese Dentária',
      'Raio-X / Panorâmica',
      'Atendimento Infantil',
      'Urgência / Dor de Dente',
      'Placa de Bruxismo'
    ],
    valoresSugeridos: ['R$ 100,00', 'R$ 150,00', 'R$ 200,00', 'R$ 250,00', 'R$ 300,00'],
    instrucoesIniciais: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer radiografias ou exames odontológicos recentes (caso possua).'
    ],
    instrucoesSugeridas: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer radiografias ou exames odontológicos recentes (caso possua).',
      'Realizar higiene bucal antes da consulta e informar uso de medicamentos contínuos.',
      'Menores de 18 anos devem estar acompanhados por um responsável legal.',
      'Em caso de imprevisto, avisar com pelo menos 24h de antecedência para reagendamento.'
    ]
  },
  outras: {
    id: 'outras',
    label: 'Outra Área / Estética',
    badge: 'Saúde, Terapias & Estética',
    subtitulo: 'Psicologia, nutrição, fisioterapia, biomedicina e clínicas multidisciplinares',
    nicho: 'Saúde & Estética',
    tituloIdentidade: 'Configuração Rápida — Saúde, Terapias & Estética',
    subtituloIdentidade: 'Opções pré-configuradas para clínicas multidisciplinares, estética e terapias.',
    labelProfissional: 'Nome do(a) Especialista',
    placeholderClinica: 'Ex: Clínica Equilíbrio, Espaço Essence Saúde',
    placeholderProfissional: 'Ex: Dra. Mariana Costa',
    placeholderExameCustom: 'Ex: Avaliação Postural, Microagulhamento, Terapia de Casal...',
    especialidadesSugeridas: [
      'Psicologia',
      'Nutrição',
      'Fisioterapia',
      'Estética Avançada',
      'Biomedicina Estética',
      'Fonoaudiologia',
      'Terapia Ocupacional',
      'Quiropraxia',
      'Podologia'
    ],
    conveniosPadraoIniciais: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil'],
    conveniosSugeridos: [
      'Unimed',
      'Bradesco Saúde',
      'SulAmérica',
      'Amil',
      'Hapvida',
      'Porto Seguro',
      'Cartão de Todos',
      'Wellhub (Gympass)',
      'TotalPass'
    ],
    procedimentosIniciais: ['Primeira Avaliação / Consulta', 'Sessão Individual'],
    procedimentosSugeridos: [
      'Primeira Avaliação / Consulta',
      'Sessão Individual',
      'Limpeza de Pele',
      'Toxina Botulínica (Botox)',
      'Preenchimento',
      'Bioestimulador de Colágeno',
      'Drenagem Linfática',
      'Bioimpedância',
      'Sessão de Fisioterapia / RPG',
      'Depilação / Laser',
      'Acompanhamento Mensal'
    ],
    valoresSugeridos: ['R$ 150,00', 'R$ 180,00', 'R$ 200,00', 'R$ 250,00', 'R$ 300,00'],
    instrucoesIniciais: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer exames anteriores ou encaminhamento (caso possua).'
    ],
    instrucoesSugeridas: [
      'Chegar com 15 minutos de antecedência.',
      'Trazer documento oficial com foto e carteirinha do convênio (se aplicável).',
      'Trazer exames anteriores ou encaminhamento (caso possua).',
      'Comparecer com roupas confortáveis (quando aplicável ao procedimento).',
      'Menores de 18 anos devem estar acompanhados por um responsável legal.',
      'Em caso de imprevisto, avisar com pelo menos 24h de antecedência para reagendamento.'
    ]
  }
};

export const ALL_PRESET_INSTRUCOES: string[] = Array.from(
  new Set([
    ...CLINICA_TEMPLATES.medica.instrucoesSugeridas,
    ...CLINICA_TEMPLATES.odontologica.instrucoesSugeridas,
    ...CLINICA_TEMPLATES.outras.instrucoesSugeridas
  ])
);
