"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Logo from '@/components/Logo';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Calendar,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  RefreshCw,
  Smartphone,
  LogOut,
  Shield,
  Check,
  CreditCard,
  ClipboardList,
  MapPin,
  Car,
  Users,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  TipoClinica,
  CLINICA_TEMPLATES,
  NOMES_ASSISTENTE_SUGERIDOS,
  ESTACIONAMENTO_SUGERIDOS,
  ALL_PRESET_INSTRUCOES
} from './presets';

type Tab = 'clinica' | 'integracoes' | 'horarios' | 'procedimentos';

interface Especialista {
  nome: string;
  especialidade: string;
}

interface ExameProcedimento {
  nome: string;
  valor: string; // Opcional
  preparo: string; // Opcional
}

interface BlocoHorario {
  dias: string[];
  inicio: string;
  fim: string;
}

const DEFAULT_BLOCO_COMERCIAL: BlocoHorario[] = [
  { dias: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], inicio: '08:00', fim: '18:00' }
];

function splitSavedInstrucoes(fullText: string, fallbackPresets: string[]): { presets: string[]; custom: string } {
  if (!fullText || !fullText.trim()) {
    return { presets: fallbackPresets, custom: '' };
  }
  let remaining = fullText.trim();
  const matched: string[] = [];

  for (const preset of ALL_PRESET_INSTRUCOES) {
    if (remaining.includes(preset)) {
      matched.push(preset);
      remaining = remaining.split(preset).join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  return {
    presets: matched,
    custom: remaining
  };
}

function isUntouchedDefaultList(current: string[], allDefaultSets: string[][]): boolean {
  const normCurrent = [...current].map(s => s.trim().toLowerCase()).sort().join('|');
  if (!normCurrent) return true;
  return allDefaultSets.some(set => {
    const normSet = [...set].map(s => s.trim().toLowerCase()).sort().join('|');
    return normCurrent === normSet;
  });
}

function ConfigurarFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step') || '1';

  const currentTab: Tab =
    stepParam === '4'
      ? 'procedimentos'
      : stepParam === '3'
      ? 'horarios'
      : stepParam === '2'
      ? 'integracoes'
      : 'clinica';

  const [isFromDashboard, setIsFromDashboard] = useState(false);

  // PERFIL / MODELO PRÉ-DEFINIDO DA CLÍNICA (Médica | Odontológica | Outras)
  const [tipoClinica, setTipoClinica] = useState<TipoClinica>('medica');
  const activeTemplate = CLINICA_TEMPLATES[tipoClinica] || CLINICA_TEMPLATES.medica;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromDash =
        searchParams.get('from_dashboard') === 'true' || searchParams.get('source') === 'dashboard';
      if (fromDash) {
        setIsFromDashboard(true);
      } else {
        fetch('/api/auth/session')
          .then(res => res.json())
          .then(data => {
            if (data && data.authenticated) {
              setIsFromDashboard(true);
            }
          })
          .catch(() => {});
      }

      const isPaid = window.localStorage.getItem('licenca_paga') === 'true';
      const hasEmpresaId = searchParams.get('empresa_id') || searchParams.get('session_id');

      if (hasEmpresaId) {
        window.localStorage.setItem('licenca_paga', 'true');
        window.localStorage.setItem('onboarding_empresa_id', hasEmpresaId);
      } else if (!isPaid && !fromDash) {
        router.replace('/pagamento');
      }
    }
  }, [searchParams, router]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('form-scroll-container');
      if (el) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    scrollToTop();
  };

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ESTADOS DO MODAL QR CODE
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [qrLoading] = useState(false);

  // ESTADOS DE PAREAMENTO / DEVICE DETECTION
  const [, setIsMobileDevice] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'qr' | 'pairing'>('qr');
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('55');
  const pairingPhoneInputRef = React.useRef<HTMLInputElement>(null);

  // 1. DADOS DA CLÍNICA
  const [nomeClinica, setNomeClinica] = useState('');
  const [nomeSecretaria, setNomeSecretaria] = useState('');
  const [endereco, setEndereco] = useState('');
  const [whatsappClinica, setWhatsappClinica] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [especialistas, setEspecialistas] = useState<Especialista[]>([{ nome: '', especialidade: '' }]);

  // 1.0 LOCALIZAÇÃO & ACESSO
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [temEstacionamento, setTemEstacionamento] = useState<boolean | null>(null);
  const [detalhesEstacionamento, setDetalhesEstacionamento] = useState('');

  // 1.0.1 FAIXA ETÁRIA DE ATENDIMENTO
  const [faixasEtarias, setFaixasEtarias] = useState<string[]>(['Adultos', 'Idosos / Geriatria']);
  const [regrasFaixaEtaria, setRegrasFaixaEtaria] = useState('');

  const opcoesFaixaEtaria = [
    'Bebês (0 a 2 anos)',
    'Crianças / Pediatria (3 a 12 anos)',
    'Adolescentes',
    'Adultos',
    'Idosos / Geriatria'
  ];

  const toggleFaixaEtaria = (opcao: string) => {
    if (faixasEtarias.includes(opcao)) {
      setFaixasEtarias(faixasEtarias.filter(f => f !== opcao));
    } else {
      setFaixasEtarias([...faixasEtarias, opcao]);
    }
  };

  const selecionarTodasFaixasEtarias = () => {
    if (faixasEtarias.length === opcoesFaixaEtaria.length) {
      setFaixasEtarias(['Adultos']);
    } else {
      setFaixasEtarias([...opcoesFaixaEtaria]);
    }
  };

  // 1.1 CONVÊNIOS E PLANOS DE SAÚDE
  const [aceitaConvenio, setAceitaConvenio] = useState(true);
  const [conveniosSelecionados, setConveniosSelecionados] = useState<string[]>(
    CLINICA_TEMPLATES.medica.conveniosPadraoIniciais
  );
  const [novoConvenioInput, setNovoConvenioInput] = useState('');
  const [observacoesConvenio, setObservacoesConvenio] = useState('');

  const toggleConvenio = (nome: string) => {
    if (conveniosSelecionados.includes(nome)) {
      setConveniosSelecionados(conveniosSelecionados.filter(c => c !== nome));
    } else {
      setConveniosSelecionados([...conveniosSelecionados, nome]);
    }
  };

  const handleAddCustomConvenio = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = novoConvenioInput.trim();
    if (trimmed && !conveniosSelecionados.includes(trimmed)) {
      setConveniosSelecionados([...conveniosSelecionados, trimmed]);
      setNovoConvenioInput('');
    }
  };

  const removeConvenio = (nome: string) => {
    setConveniosSelecionados(conveniosSelecionados.filter(c => c !== nome));
  };

  // 2. INTEGRAÇÕES
  const [opcoesAgendamento, setOpcoesAgendamento] = useState({ whatsapp: true, calendar: true });
  const [emailCalendar, setEmailCalendar] = useState('');
  const [whatsappHumano, setWhatsappHumano] = useState('');
  const [whatsappReceberAgendamento, setWhatsappReceberAgendamento] = useState('');

  // 3. HORÁRIOS & PAGAMENTO
  const [tempoConsulta, setTempoConsulta] = useState('30');
  const [valorConsulta, setValorConsulta] = useState('R$ 0,00');
  const [prazoRetorno, setPrazoRetorno] = useState('Até 30 dias');
  const [modalidadeAtendimento, setModalidadeAtendimento] = useState('Apenas Presencial');
  const [blocosHorario, setBlocosHorario] = useState<BlocoHorario[]>(DEFAULT_BLOCO_COMERCIAL);

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const [formasPagamento, setFormasPagamento] = useState<string[]>([
    'Pix',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Dinheiro'
  ]);
  const [parcelamentoMaximo, setParcelamentoMaximo] = useState('Até 3x');
  const [regraJuros, setRegraJuros] = useState('Sem juros');

  const opcoesPagamento = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];

  const toggleFormaPagamento = (forma: string) => {
    if (formasPagamento.includes(forma)) {
      setFormasPagamento(formasPagamento.filter(f => f !== forma));
    } else {
      setFormasPagamento([...formasPagamento, forma]);
    }
  };

  // 4.0 EXAMES, PROCEDIMENTOS & RECOMENDAÇÕES (1-CLIQUE + PERSONALIZADO)
  const [examesProcedimentos, setExamesProcedimentos] = useState<ExameProcedimento[]>(
    CLINICA_TEMPLATES.medica.procedimentosIniciais.map(nome => ({ nome, valor: '', preparo: '' }))
  );
  const [novoExameNome, setNovoExameNome] = useState('');
  const [novoExameValor, setNovoExameValor] = useState('');
  const [novoExamePreparo, setNovoExamePreparo] = useState('');

  const [formaEntregaResultado, setFormaEntregaResultado] = useState<
    'whatsapp_recepcao' | 'link_site' | 'presencial_contato'
  >('whatsapp_recepcao');
  const [detalheEntregaResultado, setDetalheEntregaResultado] = useState('');

  const [instrucoesSelecionadas, setInstrucoesSelecionadas] = useState<string[]>(
    CLINICA_TEMPLATES.medica.instrucoesIniciais
  );
  const [instrucaoPersonalizada, setInstrucaoPersonalizada] = useState('');

  // Texto combinado final que vai para o Supabase, WhatsApp e IA do n8n
  const instrucoesGerais = [...instrucoesSelecionadas, instrucaoPersonalizada.trim()]
    .filter(Boolean)
    .join(' ');

  // Alternar entre as abas pré-definidas (Clínica Médica | Clínica Odontológica | Outra Área)
  const handleSelectTipoClinica = (novoTipo: TipoClinica) => {
    if (novoTipo === tipoClinica) return;
    const novoTpl = CLINICA_TEMPLATES[novoTipo];

    // Troca inteligente de convênios apenas se ainda estiver nos padrões iniciais intocados
    const allDefaultConvenios = [
      CLINICA_TEMPLATES.medica.conveniosPadraoIniciais,
      CLINICA_TEMPLATES.odontologica.conveniosPadraoIniciais,
      CLINICA_TEMPLATES.outras.conveniosPadraoIniciais
    ];
    if (isUntouchedDefaultList(conveniosSelecionados, allDefaultConvenios)) {
      setConveniosSelecionados([...novoTpl.conveniosPadraoIniciais]);
    }

    // Troca inteligente de procedimentos iniciais apenas se o cliente ainda não tiver editado valores/preparos ou personalizados
    const validExames = examesProcedimentos.filter(e => e.nome && e.nome.trim());
    const hasCustomDetails = validExames.some(e => (e.valor && e.valor.trim()) || (e.preparo && e.preparo.trim()));
    const allDefaultProcs = [
      CLINICA_TEMPLATES.medica.procedimentosIniciais,
      CLINICA_TEMPLATES.odontologica.procedimentosIniciais,
      CLINICA_TEMPLATES.outras.procedimentosIniciais
    ];
    if (!hasCustomDetails && isUntouchedDefaultList(validExames.map(e => e.nome), allDefaultProcs)) {
      setExamesProcedimentos(novoTpl.procedimentosIniciais.map(nome => ({ nome, valor: '', preparo: '' })));
    }

    // Troca inteligente das instruções iniciais apenas se ainda estiver nos padrões iniciais
    const allDefaultInstr = [
      CLINICA_TEMPLATES.medica.instrucoesIniciais,
      CLINICA_TEMPLATES.odontologica.instrucoesIniciais,
      CLINICA_TEMPLATES.outras.instrucoesIniciais
    ];
    if (isUntouchedDefaultList(instrucoesSelecionadas, allDefaultInstr)) {
      setInstrucoesSelecionadas([...novoTpl.instrucoesIniciais]);
    }

    setTipoClinica(novoTipo);
  };

  const isProcedimentoSelected = (nomeProc: string) => {
    const target = nomeProc.trim().toLowerCase();
    return examesProcedimentos.some(e => e.nome.trim().toLowerCase() === target);
  };

  const toggleProcedimentoSugerido = (nomeProc: string) => {
    const target = nomeProc.trim().toLowerCase();
    const exists = examesProcedimentos.some(e => e.nome.trim().toLowerCase() === target);
    const cleaned = examesProcedimentos.filter(e => e.nome && e.nome.trim() !== '');

    if (exists) {
      const next = cleaned.filter(e => e.nome.trim().toLowerCase() !== target);
      setExamesProcedimentos(next);
    } else {
      setExamesProcedimentos([...cleaned, { nome: nomeProc, valor: '', preparo: '' }]);
    }
  };

  const handleAddCustomExame = () => {
    const nomeTrim = novoExameNome.trim();
    if (!nomeTrim) return;
    const cleaned = examesProcedimentos.filter(e => e.nome && e.nome.trim() !== '');
    const alreadyExists = cleaned.some(e => e.nome.trim().toLowerCase() === nomeTrim.toLowerCase());
    if (!alreadyExists) {
      setExamesProcedimentos([
        ...cleaned,
        {
          nome: nomeTrim,
          valor: novoExameValor.trim(),
          preparo: novoExamePreparo.trim()
        }
      ]);
    }
    setNovoExameNome('');
    setNovoExameValor('');
    setNovoExamePreparo('');
  };

  const removeExameProcedimento = (index: number) => {
    setExamesProcedimentos(examesProcedimentos.filter((_, i) => i !== index));
  };

  const updateExameProcedimento = (index: number, campo: keyof ExameProcedimento, valor: string) => {
    const list = [...examesProcedimentos];
    list[index][campo] = valor;
    setExamesProcedimentos(list);
  };

  const toggleInstrucaoSugerida = (texto: string) => {
    if (instrucoesSelecionadas.includes(texto)) {
      setInstrucoesSelecionadas(instrucoesSelecionadas.filter(i => i !== texto));
    } else {
      setInstrucoesSelecionadas([...instrucoesSelecionadas, texto]);
    }
  };

  // Toggle de especialidade em 1 clique dentro do Corpo Clínico
  const toggleEspecialidadeProfissional = (index: number, espNome: string) => {
    const atual = especialistas[index]?.especialidade || '';
    const partes = atual
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const exists = partes.some(p => p.toLowerCase() === espNome.toLowerCase());
    let novasPartes: string[];
    if (exists) {
      novasPartes = partes.filter(p => p.toLowerCase() !== espNome.toLowerCase());
    } else {
      novasPartes = [...partes, espNome];
    }
    updateEspecialista(index, 'especialidade', novasPartes.join(', '));
  };

  // Detectar dispositivo móvel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      setIsMobileDevice(isMobile);
      if (isMobile) {
        setConnectionMode('pairing');
      }
    }
  }, []);

  useEffect(() => {
    if (showQrModal && connectionMode === 'pairing') {
      setTimeout(() => {
        if (pairingPhoneInputRef.current) {
          pairingPhoneInputRef.current.focus();
          const len = pairingPhoneInputRef.current.value.length;
          pairingPhoneInputRef.current.setSelectionRange(len, len);
        }
      }, 150);
    }
  }, [showQrModal, connectionMode]);

  useEffect(() => {
    if (showQrModal) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => {
        setShowQrModal(false);
        router.push('/configurar?step=4');
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showQrModal, router]);

  // Carregar dados salvos do localStorage e do Servidor (Cloud Persistence)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const applyLoadedData = (parsed: any) => {
        const loadedTipo: TipoClinica =
          parsed.tipoClinica === 'odontologica' || parsed.tipoClinica === 'outras' || parsed.tipoClinica === 'medica'
            ? parsed.tipoClinica
            : 'medica';
        if (parsed.tipoClinica) {
          setTipoClinica(loadedTipo);
        }
        if (parsed.nomeClinica) setNomeClinica(parsed.nomeClinica);
        if (parsed.nomeSecretaria) setNomeSecretaria(parsed.nomeSecretaria);
        if (parsed.endereco) setEndereco(parsed.endereco);
        if (parsed.emailAdmin) setEmailAdmin(parsed.emailAdmin);
        if (parsed.whatsappClinica) {
          setWhatsappClinica(parsed.whatsappClinica);
          const clean = parsed.whatsappClinica.replace(/\D/g, '');
          setPairingPhone(clean ? (clean.startsWith('55') ? clean : '55' + clean) : '55');
        }
        if (Array.isArray(parsed.especialistas) && parsed.especialistas.length > 0) {
          setEspecialistas(parsed.especialistas);
        }
        if (parsed.opcoesAgendamento) setOpcoesAgendamento(parsed.opcoesAgendamento);
        if (parsed.emailCalendar) setEmailCalendar(parsed.emailCalendar);
        if (parsed.whatsappHumano) setWhatsappHumano(parsed.whatsappHumano);
        if (parsed.whatsappReceberAgendamento) setWhatsappReceberAgendamento(parsed.whatsappReceberAgendamento);
        if (parsed.tempoConsulta) setTempoConsulta(parsed.tempoConsulta);
        if (parsed.valorConsulta) setValorConsulta(parsed.valorConsulta);
        if (parsed.prazoRetorno) setPrazoRetorno(parsed.prazoRetorno);
        if (parsed.modalidadeAtendimento) setModalidadeAtendimento(parsed.modalidadeAtendimento);
        if (Array.isArray(parsed.blocosHorario) && parsed.blocosHorario.length > 0) {
          const hasValidBlock = parsed.blocosHorario.some(
            (b: BlocoHorario) => Array.isArray(b.dias) && b.dias.length > 0 && b.inicio && b.fim
          );
          if (hasValidBlock) setBlocosHorario(parsed.blocosHorario);
        }
        if (parsed.convenios) {
          if (parsed.convenios.aceitaConvenio !== undefined) setAceitaConvenio(parsed.convenios.aceitaConvenio);
          if (Array.isArray(parsed.convenios.planos)) setConveniosSelecionados(parsed.convenios.planos);
          if (parsed.convenios.observacoes) setObservacoesConvenio(parsed.convenios.observacoes);
        }
        if (parsed.pontoReferencia) setPontoReferencia(parsed.pontoReferencia);
        if (parsed.temEstacionamento !== undefined && parsed.temEstacionamento !== null) {
          setTemEstacionamento(parsed.temEstacionamento);
        }
        if (parsed.detalhesEstacionamento) setDetalhesEstacionamento(parsed.detalhesEstacionamento);
        if (Array.isArray(parsed.faixasEtarias) && parsed.faixasEtarias.length > 0) {
          setFaixasEtarias(parsed.faixasEtarias);
        }
        if (parsed.regrasFaixaEtaria) setRegrasFaixaEtaria(parsed.regrasFaixaEtaria);
        if (Array.isArray(parsed.formasPagamento) && parsed.formasPagamento.length > 0) {
          setFormasPagamento(parsed.formasPagamento);
        }
        if (parsed.parcelamentoMaximo) setParcelamentoMaximo(parsed.parcelamentoMaximo);
        if (parsed.regraJuros) setRegraJuros(parsed.regraJuros);
        if (Array.isArray(parsed.examesProcedimentos) && parsed.examesProcedimentos.length > 0) {
          const valid = parsed.examesProcedimentos.filter((e: ExameProcedimento) => e && e.nome && e.nome.trim());
          if (valid.length > 0) setExamesProcedimentos(valid);
        }
        if (parsed.formaEntregaResultado) setFormaEntregaResultado(parsed.formaEntregaResultado);
        if (parsed.detalheEntregaResultado !== undefined) setDetalheEntregaResultado(parsed.detalheEntregaResultado);

        if (Array.isArray(parsed.instrucoesSelecionadas)) {
          setInstrucoesSelecionadas(parsed.instrucoesSelecionadas);
          if (parsed.instrucaoPersonalizada !== undefined) {
            setInstrucaoPersonalizada(parsed.instrucaoPersonalizada);
          }
        } else if (parsed.instrucoesGerais && typeof parsed.instrucoesGerais === 'string') {
          const split = splitSavedInstrucoes(
            parsed.instrucoesGerais,
            CLINICA_TEMPLATES[loadedTipo].instrucoesIniciais
          );
          setInstrucoesSelecionadas(split.presets);
          setInstrucaoPersonalizada(split.custom);
        }
      };

      const saved = localStorage.getItem('onboarding_data');
      if (saved) {
        try {
          applyLoadedData(JSON.parse(saved));
        } catch (e) {
          console.error('Erro ao carregar dados salvos do localStorage:', e);
        }
      }

      const email =
        localStorage.getItem('onboarding_email') ||
        localStorage.getItem('user_email') ||
        localStorage.getItem('email') ||
        '';
      if (email && !emailAdmin) setEmailAdmin(email);

      const whatsapp = localStorage.getItem('onboarding_whatsapp') || '';
      fetch(`/api/empresa/config?email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(whatsapp)}`)
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.onboardingData) {
            const ob = resData.onboardingData;
            // Só sobrescreve com dados da nuvem se existir clínica cadastrada na conta
            if (ob.nomeClinica || ob.whatsappClinica || ob.googleConnected) {
              applyLoadedData(ob);
              if (ob.whatsappClinica) {
                localStorage.setItem('onboarding_whatsapp', ob.whatsappClinica);
              }
              if (ob.googleConnected !== undefined) setGoogleConnected(ob.googleConnected);
              if (ob.googleTokens) setGoogleTokens(ob.googleTokens);
            }
          }
        })
        .catch(err => console.error('Erro ao carregar rascunho do servidor:', err));
    }
  }, []);

  // Salvar dados no localStorage sempre que mudar algum campo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = {
        tipoClinica,
        nomeClinica,
        nomeSecretaria,
        endereco,
        emailAdmin,
        whatsappClinica,
        especialistas,
        opcoesAgendamento,
        emailCalendar,
        whatsappHumano,
        whatsappReceberAgendamento,
        tempoConsulta,
        valorConsulta,
        prazoRetorno,
        modalidadeAtendimento,
        convenios: {
          aceitaConvenio,
          planos: conveniosSelecionados,
          observacoes: observacoesConvenio
        },
        pontoReferencia,
        temEstacionamento,
        detalhesEstacionamento,
        faixasEtarias,
        regrasFaixaEtaria,
        formasPagamento,
        parcelamentoMaximo,
        regraJuros,
        examesProcedimentos,
        formaEntregaResultado,
        detalheEntregaResultado,
        instrucoesSelecionadas,
        instrucaoPersonalizada,
        instrucoesGerais,
        blocosHorario
      };
      localStorage.setItem('onboarding_data', JSON.stringify(data));
    }
  }, [
    tipoClinica,
    nomeClinica,
    nomeSecretaria,
    endereco,
    emailAdmin,
    whatsappClinica,
    especialistas,
    opcoesAgendamento,
    emailCalendar,
    whatsappHumano,
    whatsappReceberAgendamento,
    tempoConsulta,
    valorConsulta,
    prazoRetorno,
    modalidadeAtendimento,
    blocosHorario,
    aceitaConvenio,
    conveniosSelecionados,
    observacoesConvenio,
    pontoReferencia,
    temEstacionamento,
    detalhesEstacionamento,
    faixasEtarias,
    regrasFaixaEtaria,
    formasPagamento,
    parcelamentoMaximo,
    regraJuros,
    examesProcedimentos,
    formaEntregaResultado,
    detalheEntregaResultado,
    instrucoesSelecionadas,
    instrucaoPersonalizada,
    instrucoesGerais
  ]);

  const handleGeneratePairingCode = async () => {
    if (!pairingPhone) {
      setErrorMessage('Por favor, digite o número do WhatsApp para pareamento.');
      return;
    }
    setPairingLoading(true);
    setErrorMessage('');
    try {
      const cleanPhone = pairingPhone.replace(/\D/g, '');
      const cleanClinica = whatsappClinica.replace(/\D/g, '');
      const targetInst =
        cleanClinica || cleanPhone || instanceName || `clinica_${Math.floor(1000 + Math.random() * 9000)}`;
      setInstanceName(targetInst);

      const res = await fetch('/api/empresa/gerar-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: targetInst, phoneNumber: pairingPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar código de pareamento');
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao gerar código de conexão.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/');
      }
    } catch (err) {
      console.error('Erro ao sair:', err);
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    }
  };

  // Funções Utilitárias para Arrays Dinâmicos
  const addEspecialista = () => setEspecialistas([...especialistas, { nome: '', especialidade: '' }]);
  const removeEspecialista = (index: number) =>
    setEspecialistas(especialistas.filter((_, i) => i !== index));
  const updateEspecialista = (index: number, field: keyof Especialista, value: string) => {
    const newEsp = [...especialistas];
    newEsp[index][field] = value;
    setEspecialistas(newEsp);
  };

  const addBlocoHorario = () =>
    setBlocosHorario([...blocosHorario, { dias: ['Sábado'], inicio: '08:00', fim: '12:00' }]);
  const removeBlocoHorario = (index: number) =>
    setBlocosHorario(blocosHorario.filter((_, i) => i !== index));
  const toggleDiaBloco = (index: number, dia: string) => {
    const newBlocos = [...blocosHorario];
    const diasAtuais = newBlocos[index].dias;
    if (diasAtuais.includes(dia)) {
      newBlocos[index].dias = diasAtuais.filter(d => d !== dia);
    } else {
      newBlocos[index].dias = [...diasAtuais, dia];
    }
    setBlocosHorario(newBlocos);
  };
  const updateHoraBloco = (index: number, field: 'inicio' | 'fim', value: string) => {
    const newBlocos = [...blocosHorario];
    newBlocos[index][field] = value;
    setBlocosHorario(newBlocos);
  };

  // Ações Google
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleTokens(event.data.payload);
        setGoogleConnected(true);
        if (event.data.payload.email) {
          setEmailCalendar(event.data.payload.email);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [isConnected, setIsConnected] = useState(false);

  // Polling para verificar se o QR Code foi lido + Refresh Automático do QR
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let qrRefreshInterval: NodeJS.Timeout;

    if (showQrModal && instanceName) {
      statusInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/empresa/status-conexao?instance=${instanceName}`);
          if (res.ok) {
            const data = await res.json();
            if (data.state === 'open') {
              setIsConnected(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);

      qrRefreshInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/empresa/gerar-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instanceName })
          });
          const data = await res.json();
          if (res.ok && data.evolutionQrCode) {
            setQrBase64(data.evolutionQrCode);
          }
        } catch (e) {
          console.error('Falha ao dar refresh automático no QR:', e);
        }
      }, 35000);
    }
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (qrRefreshInterval) clearInterval(qrRefreshInterval);
    };
  }, [showQrModal, instanceName]);

  const handleGoogleLogin = () => {
    window.open('/api/auth/google', '_blank', 'width=500,height=600');
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') rawValue = '0';
    const floatValue = parseInt(rawValue, 10) / 100;
    const formatted = floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    setValorConsulta(formatted);
  };

  const validateStep1 = (): string | null => {
    if (!nomeClinica || !nomeClinica.trim()) return 'Preencha o Nome da Clínica.';
    if (!nomeSecretaria || !nomeSecretaria.trim() || nomeSecretaria === 'Secretária Virtual') {
      return 'Escolha ou digite o Nome da Secretária(o) / Assistente da clínica.';
    }
    const cleanWp = whatsappClinica.replace(/\D/g, '');
    if (!cleanWp || cleanWp.length < 10) return 'Insira um WhatsApp Oficial da Clínica válido com DDD.';
    if (!emailAdmin || !emailAdmin.includes('@') || !emailAdmin.includes('.')) {
      return 'Preencha um E-mail de Administrador válido.';
    }
    if (!endereco || !endereco.trim()) return 'Preencha o Endereço Físico do Consultório.';
    if (!especialistas || especialistas.length === 0) {
      return 'Adicione pelo menos 1 profissional ao Corpo Clínico.';
    }
    for (let i = 0; i < especialistas.length; i++) {
      if (
        !especialistas[i].nome ||
        !especialistas[i].nome.trim() ||
        !especialistas[i].especialidade ||
        !especialistas[i].especialidade.trim()
      ) {
        return `Preencha o nome e selecione (ou digite) a especialidade do profissional ${i + 1}.`;
      }
    }

    if (!pontoReferencia || !pontoReferencia.trim()) {
      return 'Preencha um Ponto de Referência próximo para orientar os pacientes.';
    }
    if (temEstacionamento === null) {
      return 'Informe se a clínica possui estacionamento (clique em "Sim, Possui" ou "Não Possui").';
    }
    if (temEstacionamento === true && (!detalhesEstacionamento || !detalhesEstacionamento.trim())) {
      return 'Clique em uma das opções de estacionamento ou descreva brevemente como funciona.';
    }

    if (!faixasEtarias || faixasEtarias.length === 0) {
      return 'Selecione pelo menos 1 Faixa Etária atendida pela clínica.';
    }

    // Se digitou um convênio no campo personalizado mas não clicou em "Adicionar", considera válido
    const planosEfetivos = novoConvenioInput.trim()
      ? [...conveniosSelecionados, novoConvenioInput.trim()]
      : conveniosSelecionados;
    if (aceitaConvenio && (!planosEfetivos || planosEfetivos.length === 0)) {
      return 'Selecione pelo menos 1 convênio aceito ou marque a opção "100% Particular".';
    }

    return null;
  };

  const validateStep2 = (): string | null => {
    const step1Err = validateStep1();
    if (step1Err) return step1Err;

    if (!opcoesAgendamento.whatsapp && !opcoesAgendamento.calendar) {
      return 'Escolha pelo menos uma opção de agendamento (WhatsApp ou Google Agenda).';
    }
    if (opcoesAgendamento.whatsapp) {
      const cleanWpAgendamento = whatsappReceberAgendamento.replace(/\D/g, '');
      if (!cleanWpAgendamento || cleanWpAgendamento.length < 10) {
        return 'Insira o número do WhatsApp com DDD onde deseja receber os avisos de agendamento.';
      }
    }
    if (opcoesAgendamento.calendar && !googleConnected) {
      return 'Para sincronizar com o Google Agenda, clique em "Fazer Login no Google".';
    }
    return null;
  };

  const validateStep3 = (): string | null => {
    const step2Err = validateStep2();
    if (step2Err) return step2Err;

    if (!tempoConsulta || !tempoConsulta.trim()) return 'Selecione o Tempo de Consulta.';

    const cleanValor = valorConsulta.replace(/\D/g, '');
    if (!cleanValor || Number(cleanValor) === 0 || valorConsulta === 'R$ 0,00') {
      return 'Clique em uma sugestão de Valor da Consulta ou digite o valor cobrado.';
    }

    if (!blocosHorario || blocosHorario.length === 0) {
      return 'Adicione pelo menos 1 bloco de expediente com dias e horários.';
    }

    for (let i = 0; i < blocosHorario.length; i++) {
      const b = blocosHorario[i];
      if (!b.dias || b.dias.length === 0) {
        return `Selecione os dias da semana para o bloco de expediente ${i + 1}.`;
      }
      if (!b.inicio || b.inicio === '--:--' || !b.fim || b.fim === '--:--') {
        return `Preencha os horários de abertura e fechamento para o bloco ${i + 1}.`;
      }
    }

    if (!formasPagamento || formasPagamento.length === 0) {
      return 'Selecione pelo menos 1 Forma de Pagamento aceita pela clínica.';
    }

    return null;
  };

  const getEffectiveExamesList = (): ExameProcedimento[] => {
    const base = examesProcedimentos.filter(e => e.nome && e.nome.trim());
    if (novoExameNome.trim()) {
      const exists = base.some(e => e.nome.trim().toLowerCase() === novoExameNome.trim().toLowerCase());
      if (!exists) {
        return [
          ...base,
          {
            nome: novoExameNome.trim(),
            valor: novoExameValor.trim(),
            preparo: novoExamePreparo.trim()
          }
        ];
      }
    }
    return base;
  };

  const validateStep4 = (): string | null => {
    const step3Err = validateStep3();
    if (step3Err) return step3Err;

    const examesValidos = getEffectiveExamesList();
    if (examesValidos.length === 0) {
      return 'Selecione nos botões rápidos (ou adicione abaixo) pelo menos 1 Procedimento ou Exame realizado pela clínica.';
    }

    if (formaEntregaResultado === 'link_site' && (!detalheEntregaResultado || !detalheEntregaResultado.trim())) {
      return 'Informe o link do site onde o paciente acessa o resultado do exame.';
    }
    if (
      formaEntregaResultado === 'presencial_contato' &&
      (!detalheEntregaResultado || !detalheEntregaResultado.trim())
    ) {
      return 'Informe como o paciente retira o resultado (ex: horário na recepção ou telefone do setor).';
    }

    if (!instrucoesGerais || !instrucoesGerais.trim()) {
      return 'Marque pelo menos 1 instrução rápida de comparecimento ou escreva uma recomendação personalizada.';
    }

    return null;
  };

  const goToTab = (tab: Tab, keepError = false) => {
    if (!keepError) {
      setErrorMessage('');
    }
    if (tab === 'integracoes') {
      if (novoConvenioInput.trim()) handleAddCustomConvenio();
      const err = validateStep1();
      if (err) {
        showError(err);
        return;
      }
    } else if (tab === 'horarios') {
      const err = validateStep2();
      if (err) {
        showError(err);
        return;
      }
    } else if (tab === 'procedimentos') {
      const err = validateStep3();
      if (err) {
        showError(err);
        return;
      }
    }
    const stepNum =
      tab === 'procedimentos' ? '4' : tab === 'horarios' ? '3' : tab === 'integracoes' ? '2' : '1';
    router.push(`/configurar?step=${stepNum}`);
    setTimeout(scrollToTop, 50);
  };

  const handleNextTab = () => {
    setErrorMessage('');
    if (currentTab === 'clinica') {
      if (novoConvenioInput.trim()) handleAddCustomConvenio();
      const err = validateStep1();
      if (err) {
        showError(err);
        return;
      }
      goToTab('integracoes');
    } else if (currentTab === 'integracoes') {
      const err = validateStep2();
      if (err) {
        showError(err);
        return;
      }
      goToTab('horarios');
    } else if (currentTab === 'horarios') {
      const err = validateStep3();
      if (err) {
        showError(err);
        return;
      }
      goToTab('procedimentos');
    }
  };

  const handleSalvarConfiguracoes = async () => {
    setErrorMessage('');

    const err = validateStep4();
    if (err) {
      const step1Err = validateStep1();
      if (step1Err) {
        goToTab('clinica', true);
        showError(step1Err);
        return;
      }
      const step2Err = validateStep2();
      if (step2Err) {
        goToTab('integracoes', true);
        showError(step2Err);
        return;
      }
      const step3Err = validateStep3();
      if (step3Err) {
        goToTab('horarios', true);
        showError(step3Err);
        return;
      }
      showError(err);
      return;
    }

    const finalPlanos =
      novoConvenioInput.trim() && !conveniosSelecionados.includes(novoConvenioInput.trim())
        ? [...conveniosSelecionados, novoConvenioInput.trim()]
        : conveniosSelecionados;

    const finalExames = getEffectiveExamesList();
    if (novoExameNome.trim()) {
      setExamesProcedimentos(finalExames);
      setNovoExameNome('');
      setNovoExameValor('');
      setNovoExamePreparo('');
    }

    setSaving(true);

    try {
      const parcelamentoAtivo = formasPagamento.includes('Cartão de Crédito')
        ? parcelamentoMaximo
        : 'Não se aplica';
      const jurosAtivo = formasPagamento.includes('Cartão de Crédito') ? regraJuros : 'Não se aplica';

      const payload = {
        ownerEmail:
          emailAdmin ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('onboarding_email') ||
              localStorage.getItem('user_email') ||
              localStorage.getItem('email') ||
              null
            : null),
        nome_atendente: nomeSecretaria,
        clinica: {
          tipoClinica,
          nicho: activeTemplate.nicho,
          nomeClinica,
          nomeSecretaria,
          endereco,
          linkGoogleMaps: `https://maps.google.com/?q=${encodeURIComponent(endereco)}`,
          whatsappClinica,
          especialistas,
          convenios: {
            aceitaConvenio,
            planos: aceitaConvenio ? finalPlanos : [],
            observacoes: observacoesConvenio
          },
          localizacaoAcesso: {
            pontoReferencia,
            temEstacionamento,
            possuiEstacionamento: Boolean(temEstacionamento),
            detalhesEstacionamento: temEstacionamento
              ? detalhesEstacionamento
              : 'Não possui estacionamento no local'
          },
          faixaEtaria: {
            faixasPermitidas: faixasEtarias,
            faixas: faixasEtarias,
            regrasEspecificas: regrasFaixaEtaria
          },
          formasPagamento: {
            metodos: formasPagamento,
            parcelamentoCartao: parcelamentoAtivo,
            observacoes: jurosAtivo
          }
        },
        integracoes: {
          opcoesAgendamento,
          emailCalendar,
          whatsappHumano,
          whatsappReceberAgendamento,
          googleConnected
        },
        horarios: {
          tempoConsulta,
          valorConsulta,
          prazoRetorno,
          modalidadeAtendimento,
          blocosHorario,
          formasPagamento: {
            opcoesAceitas: formasPagamento,
            parcelamentoMaximo: parcelamentoAtivo,
            regraJuros: jurosAtivo
          }
        },
        procedimentosExames: {
          lista: finalExames,
          entregaResultados: {
            forma: formaEntregaResultado,
            detalhe:
              formaEntregaResultado === 'whatsapp_recepcao'
                ? 'A equipe da recepção envia pelo WhatsApp após o paciente informar Nome Completo e qual exame fez'
                : detalheEntregaResultado.trim()
          },
          instrucoesGerais
        },
        googleTokens
      };

      const res = await fetch('/api/empresa/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao conectar com o banco de dados.');

      const defaultQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://api-whatsapp.atendimentoiaclinicas.tech/manager`;
      setQrBase64(data.evolutionQrCode || defaultQr);
      const targetInstance = whatsappClinica.replace(/\D/g, '') || 'NumeroDeTestes';
      setInstanceName(targetInstance);
      const cleanPhone = whatsappClinica.replace(/\D/g, '');
      const defaultPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : '55';
      setPairingPhone(defaultPhone);
      setPairingCode('');
      setShowQrModal(true);
    } catch (err: any) {
      showError(err.message || 'Falha ao salvar as configurações no servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Lista combinada de convênios para exibir como chips (sugeridos da aba + qualquer personalizado já adicionado)
  const todosChipsConvenios = Array.from(
    new Set([...activeTemplate.conveniosSugeridos, ...conveniosSelecionados])
  );

  // Procedimentos personalizados (aqueles adicionados pela clínica que não estão nos botões sugeridos da aba atual)
  const examesValidosAtuais = examesProcedimentos
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => item.nome && item.nome.trim() !== '');

  return (
    <div className="min-h-screen bg-[#08090a] text-gray-100 font-sans flex flex-col relative overflow-hidden">
      {/* IMAGEM DE FUNDO PREMIUM (DARK) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.04] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg')`
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#08090a_100%)] pointer-events-none" />

      {/* HEADER DE NAVEGAÇÃO SUPERIOR */}
      <nav className="relative z-10 w-full border-b border-[#27272a] bg-[#0c0d0e]/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="scale-75 origin-left">
              <Logo size="md" />
            </div>
            <div className="h-6 w-px bg-[#27272a] mx-2 hidden sm:block"></div>
            <span className="text-sm font-semibold text-teal-500 hidden sm:block tracking-wide uppercase">
              Painel Inteligente de Implantação
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 hover:border-red-800/40 text-red-400 text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair / Limpar Sessão</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* MENU LATERAL ESQUERDO */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col space-y-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">
            Etapas Rápidas (2 a 3 min)
          </h2>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              goToTab('clinica');
            }}
            className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all cursor-pointer ${
              currentTab === 'clinica'
                ? 'bg-teal-600/10 border border-teal-500/50 text-teal-400'
                : 'hover:bg-[#18181b] border border-transparent text-gray-400'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentTab === 'clinica' ? 'bg-teal-500/20 text-teal-400' : 'bg-[#27272a] text-gray-400'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">1. Perfil da Clínica</p>
              <p className="text-xs opacity-70">Equipe, Local e Planos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              goToTab('integracoes');
            }}
            className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all cursor-pointer ${
              currentTab === 'integracoes'
                ? 'bg-blue-600/10 border border-blue-500/50 text-blue-400'
                : 'hover:bg-[#18181b] border border-transparent text-gray-400'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentTab === 'integracoes' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#27272a] text-gray-400'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">2. Conexões Vitais</p>
              <p className="text-xs opacity-70">WhatsApp e Google Agenda</p>
            </div>
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              goToTab('horarios');
            }}
            className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all cursor-pointer ${
              currentTab === 'horarios'
                ? 'bg-purple-600/10 border border-purple-500/50 text-purple-400'
                : 'hover:bg-[#18181b] border border-transparent text-gray-400'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentTab === 'horarios' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#27272a] text-gray-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">3. Regras da Agenda</p>
              <p className="text-xs opacity-70">Valor, Horários e Pagamento</p>
            </div>
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              goToTab('procedimentos');
            }}
            className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all cursor-pointer ${
              currentTab === 'procedimentos'
                ? 'bg-emerald-600/10 border border-emerald-500/50 text-emerald-400'
                : 'hover:bg-[#18181b] border border-transparent text-gray-400'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentTab === 'procedimentos'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#27272a] text-gray-400'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">4. Serviços & Preparo</p>
              <p className="text-xs opacity-70">Seleção em 1 Clique</p>
            </div>
          </button>

          {/* Card de dica de velocidade */}
          <div className="hidden lg:block mt-4 p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-[#121417] border border-teal-800/30">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs mb-1.5">
              <Zap className="w-4 h-4" />
              <span>Modo Seleção Rápida</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Escolha o ramo da clínica nas abas ao lado para carregar opções prontas. No final de cada bloco você também pode adicionar itens exclusivos da sua clínica.
            </p>
          </div>
        </div>

        {/* ÁREA CENTRAL */}
        <div className="flex-1 flex flex-col h-full space-y-5">
          {/* SELETOR DE ABAS PRÉ-DEFINIDAS: CLÍNICA MÉDICA | CLÍNICA ODONTOLÓGICA | OUTRA ÁREA */}
          <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Escolha o Modelo Pré-Configurado da sua Clínica:
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                Carrega especialidades, convênios e procedimentos prontos para clicar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ABA 1: CLÍNICA MÉDICA */}
              <button
                type="button"
                onClick={() => handleSelectTipoClinica('medica')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  tipoClinica === 'medica'
                    ? 'bg-teal-500/15 border-teal-500 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/40'
                    : 'bg-[#181a1f] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">🩺</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`font-bold text-sm ${tipoClinica === 'medica' ? 'text-white' : 'text-gray-200'}`}>
                      Clínica Médica
                    </p>
                    {tipoClinica === 'medica' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500 text-black rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                    Consultórios médicos, especialidades e exames
                  </p>
                </div>
              </button>

              {/* ABA 2: CLÍNICA ODONTOLÓGICA */}
              <button
                type="button"
                onClick={() => handleSelectTipoClinica('odontologica')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  tipoClinica === 'odontologica'
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                    : 'bg-[#181a1f] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">🦷</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`font-bold text-sm ${
                        tipoClinica === 'odontologica' ? 'text-white' : 'text-gray-200'
                      }`}
                    >
                      Clínica Odontológica
                    </p>
                    {tipoClinica === 'odontologica' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-400 text-black rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                    Odontologia geral, aparelhos, implantes e estética
                  </p>
                </div>
              </button>

              {/* ABA 3: OUTRA ÁREA / PERSONALIZADA */}
              <button
                type="button"
                onClick={() => handleSelectTipoClinica('outras')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  tipoClinica === 'outras'
                    ? 'bg-purple-500/15 border-purple-400 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/40'
                    : 'bg-[#181a1f] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">✨</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`font-bold text-sm ${tipoClinica === 'outras' ? 'text-white' : 'text-gray-200'}`}>
                      Outra Área / Estética
                    </p>
                    {tipoClinica === 'outras' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-400 text-black rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                    Psicologia, nutrição, fisio, estética ou personalizada
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* CONTAINER DO FORMULÁRIO */}
          <div
            id="form-scroll-container"
            className="bg-[#121417] border border-[#27272a] rounded-2xl p-6 sm:p-9 shadow-2xl flex-1 relative overflow-y-auto"
          >
            {errorMessage && (
              <div className="mb-7 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ETAPA 1: DADOS DA CLÍNICA (COM SELEÇÃO RÁPIDA + ADIÇÃO PERSONALIZADA) */}
            {/* ===================================================================== */}
            {currentTab === 'clinica' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-bold mb-2">
                    <span>{activeTemplate.badge}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{activeTemplate.tituloIdentidade}</h3>
                  <p className="text-gray-400 text-sm">{activeTemplate.subtituloIdentidade}</p>
                </div>

                {/* Dados Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nome da Clínica *</label>
                    <input
                      type="text"
                      value={nomeClinica}
                      onChange={e => setNomeClinica(e.target.value)}
                      placeholder={activeTemplate.placeholderClinica}
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Nome da Secretária(o) / Assistente *
                    </label>
                    <input
                      type="text"
                      value={nomeSecretaria === 'Secretária Virtual' ? '' : nomeSecretaria}
                      onChange={e => setNomeSecretaria(e.target.value)}
                      placeholder="Clique em uma sugestão abaixo ou digite qualquer nome"
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-gray-500 mr-1">1 clique:</span>
                      {NOMES_ASSISTENTE_SUGERIDOS.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNomeSecretaria(sug)}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            nomeSecretaria === sug
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-[#181a1f] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#14181d] border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-teal-400 inline" />
                        WhatsApp Oficial da Clínica *
                      </label>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        ⚠️ Use número já ativo
                      </span>
                    </div>
                    <input
                      type="text"
                      value={whatsappClinica}
                      onChange={e => setWhatsappClinica(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-[#181a1f] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors font-medium text-sm"
                    />
                    <p className="text-[11px] text-amber-200/80 mt-2 leading-relaxed">
                      💡 Evite chips comprados hoje (sem histórico), pois a Meta pode restringir números recém-ativados.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      E-mail do Administrador (Login) *
                    </label>
                    <input
                      type="email"
                      value={emailAdmin}
                      onChange={e => setEmailAdmin(e.target.value)}
                      placeholder="contato@suaclinica.com.br"
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Usado para acessar e editar suas configurações sempre que quiser.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Endereço Físico da Clínica *
                    </label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000 - Sala 42, Bela Vista - São Paulo/SP"
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Bloco: Ponto de Referência & Estacionamento (Com botões rápidos + campo personalizado) */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-teal-400" /> Localização & Estacionamento *
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">
                        Ponto de Referência Próximo *
                      </label>
                      <input
                        type="text"
                        value={pontoReferencia}
                        onChange={e => setPontoReferencia(e.target.value)}
                        placeholder="Ex: Em frente ao Shopping, ao lado da Farmácia Pague Menos"
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">
                        Possui Estacionamento no Local? *
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTemEstacionamento(true);
                            if (!detalhesEstacionamento) {
                              setDetalhesEstacionamento(ESTACIONAMENTO_SUGERIDOS[0]);
                            }
                          }}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                            temEstacionamento === true
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <Car className="w-4 h-4" /> Sim, Possui
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTemEstacionamento(false);
                            setDetalhesEstacionamento('');
                          }}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                            temEstacionamento === false
                              ? 'bg-red-500/20 text-red-300 border-red-500'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          Não Possui
                        </button>
                      </div>
                    </div>
                  </div>

                  {temEstacionamento === true && (
                    <div className="bg-[#121417] p-4 rounded-xl border border-teal-900/30 animate-fade-in space-y-3">
                      <label className="block text-xs font-semibold text-teal-300">
                        Selecione como funciona o estacionamento (1 clique) ou personalize abaixo:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ESTACIONAMENTO_SUGERIDOS.map(opcaoEst => (
                          <button
                            key={opcaoEst}
                            type="button"
                            onClick={() => setDetalhesEstacionamento(opcaoEst)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              detalhesEstacionamento === opcaoEst
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                                : 'bg-[#181a1f] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                            }`}
                          >
                            {detalhesEstacionamento === opcaoEst && <Check className="w-3.5 h-3.5 text-teal-400" />}
                            <span>{opcaoEst}</span>
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                          ➕ Ou edite / acrescente detalhes personalizados do estacionamento:
                        </label>
                        <input
                          type="text"
                          value={detalhesEstacionamento}
                          onChange={e => setDetalhesEstacionamento(e.target.value)}
                          placeholder="Ex: Subsolo com manobrista gratuito por 2 horas"
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloco: Corpo Clínico com Especialidades em 1 Clique + Campo Personalizado */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center">
                        <Stethoscope className="w-5 h-5 mr-2 text-teal-400" /> Corpo Clínico *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Digite o nome do profissional e clique nas especialidades pré-definidas (ou digite outra no campo abaixo).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {especialistas.map((esp, i) => {
                      const selecionadas = esp.especialidade
                        .split(',')
                        .map(s => s.trim().toLowerCase())
                        .filter(Boolean);

                      return (
                        <div
                          key={i}
                          className="bg-[#121417] p-4 rounded-xl border border-gray-800 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-semibold text-gray-300 mb-1">
                                {activeTemplate.labelProfissional} *
                              </label>
                              <input
                                type="text"
                                value={esp.nome}
                                onChange={e => updateEspecialista(i, 'nome', e.target.value)}
                                placeholder={activeTemplate.placeholderProfissional}
                                className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>

                            <div className="flex-1 w-full">
                              <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Especialidade Selecionada ( ou digite outra personalizada ) *
                              </label>
                              <input
                                type="text"
                                value={esp.especialidade}
                                onChange={e => updateEspecialista(i, 'especialidade', e.target.value)}
                                placeholder="Clique nos botões abaixo ou digite aqui..."
                                className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>

                            {especialistas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEspecialista(i)}
                                className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg cursor-pointer"
                                title="Remover profissional"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Botões Pré-Definidos de Especialidade em 1 Clique */}
                          <div>
                            <span className="text-[11px] text-gray-400 block mb-1.5">
                              ⚡ Clique para marcar/desmarcar especialidades de <strong>{activeTemplate.label}</strong>:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {activeTemplate.especialidadesSugeridas.map(sugEsp => {
                                const ativa = selecionadas.includes(sugEsp.toLowerCase());
                                return (
                                  <button
                                    key={sugEsp}
                                    type="button"
                                    onClick={() => toggleEspecialidadeProfissional(i, sugEsp)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                                      ativa
                                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60'
                                        : 'bg-[#181a1f] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                                    }`}
                                  >
                                    {ativa ? (
                                      <Check className="w-3 h-3 text-teal-400" />
                                    ) : (
                                      <Plus className="w-3 h-3 text-gray-500" />
                                    )}
                                    <span>{sugEsp}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addEspecialista}
                    className="mt-4 flex items-center space-x-2 text-sm text-teal-400 hover:text-teal-300 font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> <span>Adicionar Outro Profissional à Clínica</span>
                  </button>
                </div>

                {/* Bloco: Faixa Etária de Atendimento */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-400" /> Faixa Etária de Atendimento *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Clique nas idades atendidas pela clínica:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={selecionarTodasFaixasEtarias}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-colors w-fit cursor-pointer"
                    >
                      {faixasEtarias.length === opcoesFaixaEtaria.length
                        ? 'Desmarcar Todas'
                        : '✓ Atendemos Todas as Idades (1 Clique)'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opcoesFaixaEtaria.map(faixa => {
                      const isSelected = faixasEtarias.includes(faixa);
                      return (
                        <button
                          key={faixa}
                          type="button"
                          onClick={() => toggleFaixaEtaria(faixa)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-teal-400" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          {faixa}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-gray-800/70">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      ➕ Regra ou observação específica sobre idade (Opcional):
                    </label>
                    <input
                      type="text"
                      value={regrasFaixaEtaria}
                      onChange={e => setRegrasFaixaEtaria(e.target.value)}
                      placeholder="Ex: Crianças a partir de 4 anos apenas com a Dra. Júlia."
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Bloco: Convênios e Planos de Saúde (Adaptados à Aba + Campo Personalizado no Final) */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-800">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-teal-400" /> Convênios & Planos ({activeTemplate.label})
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Clique nos planos aceitos ou selecione <strong>100% Particular</strong> com 1 clique.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#121417] p-1.5 rounded-xl border border-gray-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAceitaConvenio(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          aceitaConvenio
                            ? 'bg-teal-500 text-black shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Aceitamos Planos
                      </button>
                      <button
                        type="button"
                        onClick={() => setAceitaConvenio(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !aceitaConvenio
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        100% Particular
                      </button>
                    </div>
                  </div>

                  {aceitaConvenio ? (
                    <div className="space-y-5 animate-fade-in">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                            Planos pré-definidos (clique para marcar ou desmarcar):
                          </label>
                          {conveniosSelecionados.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setConveniosSelecionados([])}
                              className="text-[11px] text-gray-400 hover:text-red-400 underline cursor-pointer"
                            >
                              Limpar seleção ({conveniosSelecionados.length})
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {todosChipsConvenios.map(plano => {
                            const isSelected = conveniosSelecionados.includes(plano);
                            return (
                              <button
                                key={plano}
                                type="button"
                                onClick={() => toggleConvenio(plano)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-sm'
                                    : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-teal-400" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-gray-500" />
                                )}
                                {plano}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ABA / BLOCO FINAL PARA ACRESCENTAR OUTRO CONVÊNIO PERSONALIZADO */}
                      <div className="bg-[#121417] p-4 rounded-xl border border-dashed border-gray-700 space-y-3">
                        <label className="block text-xs font-bold text-teal-300">
                          ➕ Acrescentar outro convênio, plano regional ou parceria que não está nos botões acima:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={novoConvenioInput}
                            onChange={e => setNovoConvenioInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomConvenio();
                              }
                            }}
                            placeholder="Digite o nome do plano (Ex: Sindicato, Plano Servidor, Cartão Parceria...)"
                            className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomConvenio()}
                            disabled={!novoConvenioInput.trim()}
                            className="px-4 py-2.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> Adicionar
                          </button>
                        </div>

                        {conveniosSelecionados.length > 0 && (
                          <div className="pt-2 border-t border-gray-800/60">
                            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
                              Planos confirmados pela sua clínica ({conveniosSelecionados.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {conveniosSelecionados.map(plano => (
                                <span
                                  key={plano}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-950/40 text-teal-200 border border-teal-700/40"
                                >
                                  {plano}
                                  <button
                                    type="button"
                                    onClick={() => removeConvenio(plano)}
                                    className="hover:text-red-400 text-gray-400 transition-colors ml-0.5 cursor-pointer"
                                    title="Remover"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Observações de Cobertura ou Reembolso (Opcional):
                        </label>
                        <input
                          type="text"
                          value={observacoesConvenio}
                          onChange={e => setObservacoesConvenio(e.target.value)}
                          placeholder="Ex: Consultas pelo plano; procedimentos estéticos apenas no particular."
                          className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#121417] p-5 rounded-xl border border-amber-500/20 animate-fade-in space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⭐</span>
                        <div>
                          <h5 className="text-sm font-bold text-amber-300">Atendimento Exclusivamente Particular</h5>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            A secretária informará com cordialidade que o atendimento é particular e que a clínica emite recibo/nota fiscal para reembolso junto ao plano do paciente, quando aplicável.
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          ➕ Observação personalizada sobre atendimento particular / reembolso (Opcional):
                        </label>
                        <input
                          type="text"
                          value={observacoesConvenio}
                          onChange={e => setObservacoesConvenio(e.target.value)}
                          placeholder="Ex: Emitimos nota fiscal detalhada para reembolso integral no seu convênio."
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ETAPA 2: CONEXÕES VITAIS (COM ATALHOS DE 1 CLIQUE PARA WHATSAPP)      */}
            {/* ===================================================================== */}
            {currentTab === 'integracoes' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-5">
                  <h3 className="text-2xl font-bold text-white mb-1">Conexões Vitais</h3>
                  <p className="text-gray-400 text-sm">
                    Informe onde sua equipe receberá os avisos de agendamento e conecte a agenda do Google.
                  </p>
                </div>

                {/* WhatsApp para Receber Agendamentos */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-teal-900/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24" fill="#25D366">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                        WhatsApp para Receber Novos Agendamentos *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Número da recepção ou gestor que receberá a ficha pronta a cada consulta marcada.
                      </p>
                    </div>
                    {whatsappClinica && (
                      <button
                        type="button"
                        onClick={() => setWhatsappReceberAgendamento(whatsappClinica)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-colors w-fit shrink-0 cursor-pointer"
                      >
                        Usar mesmo WhatsApp da clínica
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={whatsappReceberAgendamento}
                    onChange={e => setWhatsappReceberAgendamento(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Login Google Agenda */}
                {opcoesAgendamento.calendar && (
                  <div className="bg-[#181a1f] p-6 rounded-2xl border border-blue-900/40">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white mb-1 flex items-center">
                          <img
                            src="/google-agenda.svg"
                            className="w-5 h-5 mr-2 rounded object-contain"
                            alt="Google Agenda"
                          />
                          Conectar Google Agenda *
                        </h4>
                        <p className="text-xs text-gray-400">
                          Com 1 clique, autorize a IA a verificar horários livres, marcar e reagendar consultas automaticamente.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                          googleConnected
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                            : 'bg-white text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {googleConnected ? (
                          <>
                            <CheckCircle className="w-5 h-5" /> <span>Google Agenda Conectado</span>
                          </>
                        ) : (
                          <span>Fazer Login no Google</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Humano */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-indigo-400" />
                        WhatsApp para Transbordo Humano (Atendente / Recepção)
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Quando um paciente pedir para falar com uma pessoa ou tiver urgência, a IA avisará este número.
                      </p>
                    </div>
                    {(whatsappReceberAgendamento || whatsappClinica) && (
                      <button
                        type="button"
                        onClick={() => setWhatsappHumano(whatsappReceberAgendamento || whatsappClinica)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors w-fit shrink-0 cursor-pointer"
                      >
                        Usar mesmo número acima (1 Clique)
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={whatsappHumano}
                    onChange={e => setWhatsappHumano(e.target.value)}
                    placeholder="(11) 98888-8888"
                    className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ETAPA 3: REGRAS DA AGENDA (HORÁRIO COMERCIAL E PREÇOS EM 1 CLIQUE)    */}
            {/* ===================================================================== */}
            {currentTab === 'horarios' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-5">
                  <h3 className="text-2xl font-bold text-white mb-1">Regras da Agenda & Pagamento</h3>
                  <p className="text-gray-400 text-sm">
                    Já deixamos o horário comercial padrão pré-marcado para agilizar — ajuste apenas o que desejar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-purple-400" /> Duração Média da Consulta
                    </label>
                    <select
                      value={tempoConsulta}
                      onChange={e => setTempoConsulta(e.target.value)}
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="15">15 Minutos</option>
                      <option value="30">30 Minutos</option>
                      <option value="45">45 Minutos</option>
                      <option value="60">1 Hora</option>
                      <option value="120">2 Horas</option>
                    </select>
                  </div>

                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" /> Valor da Consulta / Avaliação *
                    </label>
                    <input
                      type="text"
                      value={valorConsulta}
                      onChange={handleValorChange}
                      placeholder="R$ 200,00"
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[11px] text-gray-500">1 clique:</span>
                      {activeTemplate.valoresSugeridos.map(valSug => (
                        <button
                          key={valSug}
                          type="button"
                          onClick={() => setValorConsulta(valSug)}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            valorConsulta === valSug
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-[#121417] border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {valSug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 text-blue-400" /> Direito a Retorno da Consulta
                    </label>
                    <select
                      value={prazoRetorno}
                      onChange={e => setPrazoRetorno(e.target.value)}
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Até 15 dias">Até 15 dias</option>
                      <option value="Até 30 dias">Até 30 dias</option>
                      <option value="A definir com o médico">A definir com o especialista</option>
                      <option value="Sem retorno gratuito incluso">Sem retorno gratuito incluso</option>
                    </select>
                  </div>

                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                      <Stethoscope className="w-4 h-4 mr-2 text-teal-400" /> Modalidade de Atendimento
                    </label>
                    <select
                      value={modalidadeAtendimento}
                      onChange={e => setModalidadeAtendimento(e.target.value)}
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Apenas Presencial">Apenas Presencial</option>
                      <option value="Presencial e Online (Vídeo)">Presencial e Online (Vídeo)</option>
                    </select>
                  </div>
                </div>

                {/* Blocos de Horários com Atalhos Rápidos + Personalização */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-white">Horário de Funcionamento da Clínica</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setBlocosHorario([
                            {
                              dias: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
                              inicio: '08:00',
                              fim: '18:00'
                            }
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 cursor-pointer"
                      >
                        ⚡ Seg a Sex (08h-18h)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBlocosHorario([
                            {
                              dias: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
                              inicio: '08:00',
                              fim: '18:00'
                            },
                            { dias: ['Sábado'], inicio: '08:00', fim: '12:00' }
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 cursor-pointer"
                      >
                        ⚡ Seg-Sex (08h-18h) + Sáb (08h-12h)
                      </button>
                    </div>
                  </div>

                  {blocosHorario.map((bloco, index) => (
                    <div key={index} className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                      <div className="flex justify-between items-start mb-3">
                        <label className="block text-sm font-semibold text-gray-300">
                          Dias de Atendimento {blocosHorario.length > 1 ? `(Bloco ${index + 1})` : ''}
                        </label>
                        {blocosHorario.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBlocoHorario(index)}
                            className="text-red-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {diasDaSemana.map(dia => (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => toggleDiaBloco(index, dia)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              bloco.dias.includes(dia)
                                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                : 'bg-[#121417] border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            {dia.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Abertura</label>
                          <input
                            type="time"
                            value={bloco.inicio}
                            onChange={e => updateHoraBloco(index, 'inicio', e.target.value)}
                            className="w-full bg-[#121417] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Fechamento</label>
                          <input
                            type="time"
                            value={bloco.fim}
                            onChange={e => updateHoraBloco(index, 'fim', e.target.value)}
                            className="w-full bg-[#121417] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addBlocoHorario}
                    className="flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300 font-bold transition-colors pt-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> <span>Adicionar Outro Horário Personalizado (Ex: Sábado ou Plantão)</span>
                  </button>
                </div>

                {/* Formas de Pagamento */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-purple-400" /> Formas de Pagamento Aceitas *
                  </h4>

                  <div className="flex flex-wrap gap-2.5">
                    {opcoesPagamento.map(forma => {
                      const isSelected = formasPagamento.includes(forma);
                      return (
                        <button
                          key={forma}
                          type="button"
                          onClick={() => toggleFormaPagamento(forma)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          {forma}
                        </button>
                      );
                    })}
                  </div>

                  {formasPagamento.includes('Cartão de Crédito') && (
                    <div className="bg-[#121417] p-4 rounded-xl border border-purple-900/30 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Parcelamento Máximo no Cartão
                        </label>
                        <select
                          value={parcelamentoMaximo}
                          onChange={e => setParcelamentoMaximo(e.target.value)}
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="1x (À vista)">1x (À vista)</option>
                          <option value="Até 2x">Até 2x</option>
                          <option value="Até 3x">Até 3x</option>
                          <option value="Até 4x">Até 4x</option>
                          <option value="Até 6x">Até 6x</option>
                          <option value="Até 10x">Até 10x</option>
                          <option value="Até 12x">Até 12x</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          ➕ Condição / Observação Personalizada (Opcional)
                        </label>
                        <input
                          type="text"
                          value={regraJuros}
                          onChange={e => setRegraJuros(e.target.value)}
                          placeholder="Ex: Sem juros, ou 5% de desconto no Pix"
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ETAPA 4: EXAMES, PROCEDIMENTOS & ORIENTAÇÕES (1 CLIQUE + ABA EXTRA)   */}
            {/* ===================================================================== */}
            {currentTab === 'procedimentos' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-5">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Procedimentos, Exames & Recomendações ({activeTemplate.label})
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Clique nos procedimentos que sua clínica realiza e marque as recomendações prontas. No final de cada seção, você pode acrescentar qualquer item personalizado.
                  </p>
                </div>

                {/* BLOCO 1: SELEÇÃO EM 1 CLIQUE DE PROCEDIMENTOS & EXAMES + ABA PERSONALIZADA NO FINAL */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-emerald-400" /> Procedimentos & Exames Realizados *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Clique nos botões abaixo para ativar ou desativar em 1 segundo:
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold shrink-0">
                      💰 Preço e Preparo são 100% Opcionais
                    </span>
                  </div>

                  {/* Botões Pré-Definidos em 1 Clique */}
                  <div className="flex flex-wrap gap-2">
                    {activeTemplate.procedimentosSugeridos.map(proc => {
                      const selecionado = isProcedimentoSelected(proc);
                      return (
                        <button
                          key={proc}
                          type="button"
                          onClick={() => toggleProcedimentoSugerido(proc)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            selecionado
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                          }`}
                        >
                          {selecionado ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          <span>{proc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista dos Procedimentos Selecionados (com Valor/Preparo opcional) */}
                  {examesValidosAtuais.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-bold text-gray-300 block">
                        ✓ Selecionados ({examesValidosAtuais.length}) — preencha valor ou preparo apenas se desejar:
                      </span>
                      <div className="space-y-2">
                        {examesValidosAtuais.map(({ item, originalIndex }) => (
                          <div
                            key={`${item.nome}-${originalIndex}`}
                            className="bg-[#121417] p-3 rounded-xl border border-gray-800/90 flex flex-col md:flex-row gap-2.5 items-center"
                          >
                            <div className="flex-1 w-full">
                              <input
                                type="text"
                                value={item.nome}
                                onChange={e => updateExameProcedimento(originalIndex, 'nome', e.target.value)}
                                className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="w-full md:w-40">
                              <input
                                type="text"
                                value={item.valor}
                                onChange={e => updateExameProcedimento(originalIndex, 'valor', e.target.value)}
                                placeholder="Valor (Opcional)"
                                className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="flex-1 w-full">
                              <input
                                type="text"
                                value={item.preparo}
                                onChange={e => updateExameProcedimento(originalIndex, 'preparo', e.target.value)}
                                placeholder="Preparo opcional (Ex: Jejum 8h)"
                                className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExameProcedimento(originalIndex)}
                              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Remover procedimento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ABA / BLOCO FINAL: ACRESCENTAR OUTRO PROCEDIMENTO OU EXAME PERSONALIZADO */}
                  <div className="bg-[#121417] p-4 rounded-xl border border-dashed border-emerald-700/50 space-y-3">
                    <label className="block text-xs font-bold text-emerald-300">
                      ➕ Acrescentar outro exame ou procedimento que não está nos botões pré-definidos:
                    </label>
                    <div className="flex flex-col md:flex-row gap-2.5">
                      <input
                        type="text"
                        value={novoExameNome}
                        onChange={e => setNovoExameNome(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomExame();
                          }
                        }}
                        placeholder={activeTemplate.placeholderExameCustom}
                        className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={novoExameValor}
                        onChange={e => setNovoExameValor(e.target.value)}
                        placeholder="Valor (Opcional)"
                        className="w-full md:w-36 bg-[#181a1f] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={novoExamePreparo}
                        onChange={e => setNovoExamePreparo(e.target.value)}
                        placeholder="Preparo (Opcional)"
                        className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomExame}
                        disabled={!novoExameNome.trim()}
                        className="px-4 py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: ENTREGA DE RESULTADOS DE EXAMES */}
                <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a] space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" /> Como o paciente recebe Resultados de Exames? *
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormaEntregaResultado('whatsapp_recepcao');
                        setDetalheEntregaResultado('');
                      }}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        formaEntregaResultado === 'whatsapp_recepcao'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          formaEntregaResultado === 'whatsapp_recepcao' ? 'text-emerald-400' : 'opacity-30'
                        }`}
                      />
                      <span>Pelo WhatsApp (A recepção envia)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaEntregaResultado('link_site')}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        formaEntregaResultado === 'link_site'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          formaEntregaResultado === 'link_site' ? 'text-emerald-400' : 'opacity-30'
                        }`}
                      />
                      <span>Por um Link / Site da Clínica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaEntregaResultado('presencial_contato')}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        formaEntregaResultado === 'presencial_contato'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          formaEntregaResultado === 'presencial_contato' ? 'text-emerald-400' : 'opacity-30'
                        }`}
                      />
                      <span>Buscar na Clínica ou Outro Número</span>
                    </button>
                  </div>

                  {formaEntregaResultado === 'whatsapp_recepcao' && (
                    <p className="text-[11px] text-emerald-300/80 bg-[#121417] px-3.5 py-2.5 rounded-xl border border-emerald-900/30">
                      ✓ A assistente pedirá o Nome Completo e qual exame o paciente realizou, e notificará sua recepção para enviar o resultado.
                    </p>
                  )}

                  {formaEntregaResultado === 'link_site' && (
                    <div className="animate-fade-in">
                      <input
                        type="text"
                        value={detalheEntregaResultado}
                        onChange={e => setDetalheEntregaResultado(e.target.value)}
                        placeholder="Cole aqui o link do portal de resultados (Ex: https://resultados.suaclinica.com.br)"
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {formaEntregaResultado === 'presencial_contato' && (
                    <div className="animate-fade-in">
                      <input
                        type="text"
                        value={detalheEntregaResultado}
                        onChange={e => setDetalheEntregaResultado(e.target.value)}
                        placeholder="Ex: Retirar na recepção de seg a sex das 8h às 17h, ou solicitar no setor (11) 99999-9999"
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* BLOCO 3: INSTRUÇÕES DE COMPARECIMENTO EM 1 CLIQUE + CAMPO EXTRA PERSONALIZADO */}
                <div className="bg-[#181a1f] p-5 sm:p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" /> Instruções & Recomendações aos Pacientes *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Já deixamos as orientações mais comuns marcadas — clique para ativar/desativar sem precisar digitar:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {activeTemplate.instrucoesSugeridas.map(instr => {
                      const marcada = instrucoesSelecionadas.includes(instr);
                      return (
                        <button
                          key={instr}
                          type="button"
                          onClick={() => toggleInstrucaoSugerida(instr)}
                          className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            marcada
                              ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
                              : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              marcada ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-gray-600'
                            }`}
                          >
                            {marcada && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{instr}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ABA / BLOCO FINAL PARA ACRESCENTAR REGRAS OU INSTRUÇÕES EXTRAS DA CLÍNICA */}
                  <div className="bg-[#121417] p-4 rounded-xl border border-dashed border-gray-700 space-y-2">
                    <label className="block text-xs font-bold text-emerald-300">
                      ➕ Acrescentar outra recomendação ou regra exclusiva da sua clínica (Opcional):
                    </label>
                    <textarea
                      rows={2}
                      value={instrucaoPersonalizada}
                      onChange={e => setInstrucaoPersonalizada(e.target.value)}
                      placeholder="Se quiser adicionar algum aviso extra que não esteja nas opções acima, digite aqui (Ex: Tolerância máxima de 15 minutos de atraso; não esquecer pedido médico carimbado...)"
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* BOTÕES DE AÇÃO RODAPÉ */}
            <div className="mt-9 pt-6 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Salvamento automático ativo | Suas escolhas ficam salvas a cada clique</span>
              </div>

              <div className="flex space-x-3 w-full sm:w-auto justify-end">
                {currentTab !== 'procedimentos' ? (
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="w-full sm:w-auto justify-center px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors flex items-center space-x-2 shadow-lg cursor-pointer"
                  >
                    <span>Próxima Etapa</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSalvarConfiguracoes}
                    disabled={saving}
                    className="w-full sm:w-auto justify-center px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <span>Criando Cérebro...</span>
                    ) : (
                      <>
                        <span>Finalizar e Ligar IA</span>
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DO QR CODE (TEMPO REAL) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-6 sm:p-10 shadow-2xl w-full max-w-lg relative">
            {isConnected ? (
              <div className="flex flex-col items-center text-center py-4 animate-fade-in space-y-6 w-full">
                <div className="relative">
                  <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-16 h-16 text-emerald-400" />
                  </div>
                  <span className="absolute bottom-1 right-1 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-[#121417]"></span>
                  </span>
                </div>

                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Conexão Verificada</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    WhatsApp Conectado com Sucesso!
                  </h3>
                  <p className="text-gray-300 text-sm mt-2 max-w-md">
                    Sua Inteligência Artificial já está ativada e pronta para responder os seus pacientes no WhatsApp oficial da clínica.
                  </p>
                </div>

                <div className="w-full bg-[#181a1f] border border-emerald-500/30 p-4 rounded-xl text-left text-xs text-gray-300 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Instância Ativa: {instanceName || whatsappClinica}</span>
                  </div>
                  <p>• Agendamentos automáticos ativados</p>
                  <p>• Respostas 24/7 com IA habilitadas</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('onboarding_data');
                    }
                    window.location.href = isFromDashboard ? '/dashboard' : '/';
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base rounded-xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <span>Concluir</span>
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mb-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Conecte sua IA ao WhatsApp</h3>

                <div className="flex border-b border-[#27272a] mb-4 w-full">
                  <button
                    type="button"
                    onClick={() => setConnectionMode('qr')}
                    className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                      connectionMode === 'qr'
                        ? 'border-teal-500 text-teal-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    QR Code (Computador)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectionMode('pairing')}
                    className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                      connectionMode === 'pairing'
                        ? 'border-teal-500 text-teal-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Conexão Direta (Celular)
                  </button>
                </div>

                {errorMessage && (
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-xs font-semibold text-left flex items-start space-x-2 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {connectionMode === 'qr' ? (
                  <>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 px-2">
                      No WhatsApp da clínica, abra <strong className="text-white">Aparelhos Conectados</strong> e escaneie o código abaixo:
                    </p>

                    <div className="bg-white p-3.5 rounded-xl shadow-inner mb-2.5 relative min-h-[210px] min-w-[210px] flex items-center justify-center">
                      {qrLoading ? (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-semibold">Gerando novo código...</span>
                        </div>
                      ) : (
                        <img src={qrBase64} alt="WhatsApp QR Code" className="w-[196px] h-[196px]" />
                      )}
                    </div>

                    <p className="text-center text-[11px] text-gray-500 mb-4 italic">
                      Atualização automática ativa por segurança.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 px-2">
                      Confira o WhatsApp da clínica (com 55 + DDD) para gerar o código de 8 dígitos:
                    </p>

                    <div className="w-full space-y-3 mb-4">
                      <div className="flex gap-2">
                        <input
                          ref={pairingPhoneInputRef}
                          type="text"
                          value={pairingPhone}
                          onChange={e => setPairingPhone(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 text-center text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleGeneratePairingCode}
                          disabled={pairingLoading || !pairingPhone}
                          className="px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center justify-center text-sm"
                        >
                          {pairingLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Gerar Código'}
                        </button>
                      </div>

                      {pairingCode ? (
                        <div className="bg-[#181a1f] border border-teal-500/30 p-4 rounded-2xl text-center space-y-3 animate-fade-in">
                          <span className="text-[11px] text-gray-400 uppercase tracking-widest block font-bold">
                            Código de Conexão
                          </span>
                          <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 tracking-wider font-mono select-all bg-[#0c0d0e] py-2.5 rounded-xl border border-[#27272a] shadow-inner">
                            {pairingCode}
                          </div>
                          <div className="text-left text-xs text-gray-300 space-y-1.5 pt-2 border-t border-gray-800">
                            <p className="font-semibold text-white">No WhatsApp do celular:</p>
                            <p>
                              1. Vá em <strong className="text-white">Aparelhos Conectados</strong> &gt;{' '}
                              <strong className="text-white">Conectar um aparelho</strong>.
                            </p>
                            <p>
                              2. Toque em <strong className="text-white">Conectar com número de telefone</strong> e digite o código acima.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#181a1f]/50 border border-dashed border-[#27272a] p-5 rounded-xl text-center text-xs text-gray-500">
                          Clique em &quot;Gerar Código&quot; para exibir a chave de 8 dígitos.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* CARD ÚNICO COMPACTO (2 LEMBRETES RÁPIDOS DE 1 LINHA CADA) */}
                <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-left w-full space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Lembretes rápidos antes de usar:</span>
                  </div>
                  <p className="text-[11px] text-amber-100/85 leading-snug">
                    • <strong className="text-amber-300">Desative mensagens automáticas</strong> do WhatsApp Business (Saudação/Ausência) e outros robôs.
                  </p>
                  <p className="text-[11px] text-amber-100/85 leading-snug">
                    • <strong className="text-amber-300">Não faça disparos em massa (spam)</strong> neste chip para evitar bloqueios pelo WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigurarClinicaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090a] text-white flex items-center justify-center font-bold">
          Carregando painel de implantação...
        </div>
      }
    >
      <ConfigurarFormContent />
    </Suspense>
  );
}
