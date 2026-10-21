"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Logo from '@/components/Logo';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MessageCircle, 
  Calendar, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  QrCode,
  RefreshCw,
  XCircle,
  Smartphone,
  LogOut,
  Shield,
  Check,
  CreditCard,
  ClipboardList,
  MapPin,
  Car,
  Users
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'clinica' | 'integracoes' | 'horarios' | 'procedimentos';

interface Especialista {
  nome: string;
  especialidade: string;
}

interface ExameProcedimento {
  nome: string;
  valor: string; // Opcional (R$ 0,00 ou texto vazio)
  preparo: string; // Opcional (Jejum, etc)
}

interface BlocoHorario {
  dias: string[];
  inicio: string;
  fim: string;
}

function ConfigurarFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step') || '1';

  const currentTab: Tab = stepParam === '4' ? 'procedimentos' : stepParam === '3' ? 'horarios' : stepParam === '2' ? 'integracoes' : 'clinica';

  const [isFromDashboard, setIsFromDashboard] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromDash = searchParams.get('from_dashboard') === 'true' || searchParams.get('source') === 'dashboard';
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
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    scrollToTop();
  };
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState(false);

  // 4. ESTADOS DO MODAL QR CODE
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // 5. ESTADOS DE PAREAMENTO / DEVICE DETECTION
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'qr' | 'pairing'>('qr');
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('55');
  const pairingPhoneInputRef = React.useRef<HTMLInputElement>(null);

  // 1. DADOS DA CLÍNICA
  const [nomeClinica, setNomeClinica] = useState('');
  const [nomeSecretaria, setNomeSecretaria] = useState('');
  const [endereco, setEndereco] = useState('');
  const [whatsappClinica, setWhatsappClinica] = useState(''); // Número onde a IA vai responder clientes
  const [emailAdmin, setEmailAdmin] = useState(''); // E-mail para acesso
  const [especialistas, setEspecialistas] = useState<Especialista[]>([{ nome: '', especialidade: '' }]);

  // 1.0 LOCALIZAÇÃO & ACESSO (Ponto de referência e estacionamento)
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [temEstacionamento, setTemEstacionamento] = useState<boolean | null>(null);
  const [detalhesEstacionamento, setDetalhesEstacionamento] = useState('');

  // 1.0.1 FAIXA ETÁRIA DE ATENDIMENTO
  const [faixasEtarias, setFaixasEtarias] = useState<string[]>(['Adultos']);
  const [regrasFaixaEtaria, setRegrasFaixaEtaria] = useState('');

  const opcoesFaixaEtaria = ['Bebês (0 a 2 anos)', 'Crianças / Pediatria (3 a 12 anos)', 'Adolescentes', 'Adultos', 'Idosos / Geriatria'];

  const toggleFaixaEtaria = (opcao: string) => {
    if (faixasEtarias.includes(opcao)) {
      setFaixasEtarias(faixasEtarias.filter(f => f !== opcao));
    } else {
      setFaixasEtarias([...faixasEtarias, opcao]);
    }
  };

  // 3.1 FORMAS DE PAGAMENTO & PARCELAMENTO
  const [formasPagamento, setFormasPagamento] = useState<string[]>(['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro']);
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

  // 4.0 EXAMES, PROCEDIMENTOS & RECOMENDAÇÕES
  const [examesProcedimentos, setExamesProcedimentos] = useState<ExameProcedimento[]>([
    { nome: '', valor: '', preparo: '' }
  ]);
  const [formaEntregaResultado, setFormaEntregaResultado] = useState<'whatsapp_recepcao' | 'link_site' | 'presencial_contato'>('whatsapp_recepcao');
  const [detalheEntregaResultado, setDetalheEntregaResultado] = useState('');
  const [instrucoesGerais, setInstrucoesGerais] = useState('');

  const addExameProcedimento = () => {
    setExamesProcedimentos([...examesProcedimentos, { nome: '', valor: '', preparo: '' }]);
  };

  const removeExameProcedimento = (index: number) => {
    if (examesProcedimentos.length > 1) {
      setExamesProcedimentos(examesProcedimentos.filter((_, i) => i !== index));
    }
  };

  const updateExameProcedimento = (index: number, campo: keyof ExameProcedimento, valor: string) => {
    const list = [...examesProcedimentos];
    list[index][campo] = valor;
    setExamesProcedimentos(list);
  };

  // 1.1 CONVÊNIOS E PLANOS DE SAÚDE
  const [aceitaConvenio, setAceitaConvenio] = useState(true);
  const [conveniosSelecionados, setConveniosSelecionados] = useState<string[]>([
    'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil'
  ]);
  const [novoConvenioInput, setNovoConvenioInput] = useState('');
  const [observacoesConvenio, setObservacoesConvenio] = useState('');

  const conveniosSugeridos = [
    'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida', 
    'Porto Seguro', 'Cassi', 'Golden Cross', 'Allianz Saúde', 'NotreDame Intermédica'
  ];

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

  // 2. INTEGRAÇÕES (Z-API e CALENDAR)
  const [opcoesAgendamento, setOpcoesAgendamento] = useState({ whatsapp: true, calendar: true });
  const [emailCalendar, setEmailCalendar] = useState('');
  const [whatsappHumano, setWhatsappHumano] = useState(''); // Whatsapp para falar direto com o médico (escalada)
  const [whatsappReceberAgendamento, setWhatsappReceberAgendamento] = useState('');

  // 3. HORÁRIOS
  const [tempoConsulta, setTempoConsulta] = useState('30');
  const [valorConsulta, setValorConsulta] = useState('R$ 0,00');
  const [prazoRetorno, setPrazoRetorno] = useState('Até 30 dias');
  const [modalidadeAtendimento, setModalidadeAtendimento] = useState('Apenas Presencial');
  const [blocosHorario, setBlocosHorario] = useState<BlocoHorario[]>([
    { dias: [], inicio: '', fim: '' }
  ]);

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Detectar dispositivo móvel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
      if (isMobile) {
        setConnectionMode('pairing');
      }
    }
  }, []);

  // Focar no input de pareamento e colocar o cursor no final (após o "55")
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

  // Interceptar a seta de voltar do navegador com o Modal de Conexão aberto (Volta para Etapa 3 - Regras da Agenda)
  useEffect(() => {
    if (showQrModal) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = (e: PopStateEvent) => {
        setShowQrModal(false);
        router.push('/configurar?step=3');
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
      const saved = localStorage.getItem('onboarding_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.nomeClinica) setNomeClinica(parsed.nomeClinica);
          if (parsed.nomeSecretaria) setNomeSecretaria(parsed.nomeSecretaria);
          if (parsed.endereco) setEndereco(parsed.endereco);
          if (parsed.emailAdmin) setEmailAdmin(parsed.emailAdmin);
          if (parsed.whatsappClinica) {
            setWhatsappClinica(parsed.whatsappClinica);
            const clean = parsed.whatsappClinica.replace(/\D/g, '');
            setPairingPhone(clean ? (clean.startsWith('55') ? clean : '55' + clean) : '55');
          }
          if (parsed.especialistas) setEspecialistas(parsed.especialistas);
          if (parsed.opcoesAgendamento) setOpcoesAgendamento(parsed.opcoesAgendamento);
          if (parsed.emailCalendar) setEmailCalendar(parsed.emailCalendar);
          if (parsed.whatsappHumano) setWhatsappHumano(parsed.whatsappHumano);
          if (parsed.whatsappReceberAgendamento) setWhatsappReceberAgendamento(parsed.whatsappReceberAgendamento);
          if (parsed.tempoConsulta) setTempoConsulta(parsed.tempoConsulta);
          if (parsed.valorConsulta) setValorConsulta(parsed.valorConsulta);
          if (parsed.prazoRetorno) setPrazoRetorno(parsed.prazoRetorno);
          if (parsed.modalidadeAtendimento) setModalidadeAtendimento(parsed.modalidadeAtendimento);
          if (parsed.blocosHorario) setBlocosHorario(parsed.blocosHorario);
          if (parsed.convenios) {
            if (parsed.convenios.aceitaConvenio !== undefined) setAceitaConvenio(parsed.convenios.aceitaConvenio);
            if (Array.isArray(parsed.convenios.planos)) setConveniosSelecionados(parsed.convenios.planos);
            if (parsed.convenios.observacoes) setObservacoesConvenio(parsed.convenios.observacoes);
          }
          if (parsed.pontoReferencia) setPontoReferencia(parsed.pontoReferencia);
          if (parsed.temEstacionamento !== undefined) setTemEstacionamento(parsed.temEstacionamento);
          if (parsed.detalhesEstacionamento) setDetalhesEstacionamento(parsed.detalhesEstacionamento);
          if (Array.isArray(parsed.faixasEtarias) && parsed.faixasEtarias.length > 0) setFaixasEtarias(parsed.faixasEtarias);
          if (parsed.regrasFaixaEtaria) setRegrasFaixaEtaria(parsed.regrasFaixaEtaria);
          if (Array.isArray(parsed.formasPagamento) && parsed.formasPagamento.length > 0) setFormasPagamento(parsed.formasPagamento);
          if (parsed.parcelamentoMaximo) setParcelamentoMaximo(parsed.parcelamentoMaximo);
          if (parsed.regraJuros) setRegraJuros(parsed.regraJuros);
          if (Array.isArray(parsed.examesProcedimentos) && parsed.examesProcedimentos.length > 0) setExamesProcedimentos(parsed.examesProcedimentos);
          if (parsed.formaEntregaResultado) setFormaEntregaResultado(parsed.formaEntregaResultado);
          if (parsed.detalheEntregaResultado !== undefined) setDetalheEntregaResultado(parsed.detalheEntregaResultado);
          if (parsed.instrucoesGerais) setInstrucoesGerais(parsed.instrucoesGerais);
        } catch (e) {
          console.error("Erro ao carregar dados salvos do localStorage:", e);
        }
      }

      // Buscar do Servidor para sincronização em nuvem
      const email = localStorage.getItem('onboarding_email') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (email && !emailAdmin) setEmailAdmin(email);

      const whatsapp = localStorage.getItem('onboarding_whatsapp') || '';
      fetch(`/api/empresa/config?email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(whatsapp)}`)
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.onboardingData) {
            const ob = resData.onboardingData;
            if (ob.nomeClinica) setNomeClinica(ob.nomeClinica);
            if (ob.nomeSecretaria) setNomeSecretaria(ob.nomeSecretaria);
            if (ob.endereco) setEndereco(ob.endereco);
            if (ob.emailAdmin) setEmailAdmin(ob.emailAdmin);
            if (ob.whatsappClinica) {
              setWhatsappClinica(ob.whatsappClinica);
              const clean = ob.whatsappClinica.replace(/\D/g, '');
              setPairingPhone(clean ? (clean.startsWith('55') ? clean : '55' + clean) : '55');
              localStorage.setItem('onboarding_whatsapp', ob.whatsappClinica);
            }
            if (ob.especialistas && ob.especialistas.length > 0) setEspecialistas(ob.especialistas);
            if (ob.opcoesAgendamento) setOpcoesAgendamento(ob.opcoesAgendamento);
            if (ob.whatsappHumano) setWhatsappHumano(ob.whatsappHumano);
            if (ob.whatsappReceberAgendamento) setWhatsappReceberAgendamento(ob.whatsappReceberAgendamento);
            if (ob.googleConnected !== undefined) setGoogleConnected(ob.googleConnected);
            if (ob.googleTokens) setGoogleTokens(ob.googleTokens);
            if (ob.tempoConsulta) setTempoConsulta(ob.tempoConsulta);
            if (ob.valorConsulta) setValorConsulta(ob.valorConsulta);
            if (ob.prazoRetorno) setPrazoRetorno(ob.prazoRetorno);
            if (ob.modalidadeAtendimento) setModalidadeAtendimento(ob.modalidadeAtendimento);
            if (ob.blocosHorario && ob.blocosHorario.length > 0) setBlocosHorario(ob.blocosHorario);
            if (ob.convenios) {
              if (ob.convenios.aceitaConvenio !== undefined) setAceitaConvenio(ob.convenios.aceitaConvenio);
              if (Array.isArray(ob.convenios.planos)) setConveniosSelecionados(ob.convenios.planos);
              if (ob.convenios.observacoes) setObservacoesConvenio(ob.convenios.observacoes);
            }
            if (ob.pontoReferencia) setPontoReferencia(ob.pontoReferencia);
            if (ob.temEstacionamento !== undefined) setTemEstacionamento(ob.temEstacionamento);
            if (ob.detalhesEstacionamento) setDetalhesEstacionamento(ob.detalhesEstacionamento);
            if (Array.isArray(ob.faixasEtarias) && ob.faixasEtarias.length > 0) setFaixasEtarias(ob.faixasEtarias);
            if (ob.regrasFaixaEtaria) setRegrasFaixaEtaria(ob.regrasFaixaEtaria);
            if (Array.isArray(ob.formasPagamento) && ob.formasPagamento.length > 0) setFormasPagamento(ob.formasPagamento);
            if (ob.parcelamentoMaximo) setParcelamentoMaximo(ob.parcelamentoMaximo);
            if (ob.regraJuros) setRegraJuros(ob.regraJuros);
            if (Array.isArray(ob.examesProcedimentos) && ob.examesProcedimentos.length > 0) setExamesProcedimentos(ob.examesProcedimentos);
            if (ob.formaEntregaResultado) setFormaEntregaResultado(ob.formaEntregaResultado);
            if (ob.detalheEntregaResultado !== undefined) setDetalheEntregaResultado(ob.detalheEntregaResultado);
            if (ob.instrucoesGerais) setInstrucoesGerais(ob.instrucoesGerais);
          }
        })
        .catch(err => console.error("Erro ao carregar rascunho do servidor:", err));
    }
  }, []);

  // Salvar dados no localStorage sempre que mudar algum campo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = {
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
        instrucoesGerais,
        blocosHorario
      };
      localStorage.setItem('onboarding_data', JSON.stringify(data));
    }
  }, [
    nomeClinica, nomeSecretaria, endereco, whatsappClinica, especialistas,
    opcoesAgendamento, emailCalendar, whatsappHumano, whatsappReceberAgendamento,
    tempoConsulta, valorConsulta, prazoRetorno, modalidadeAtendimento, blocosHorario,
    pontoReferencia, temEstacionamento, detalhesEstacionamento, faixasEtarias,
    regrasFaixaEtaria, formasPagamento, parcelamentoMaximo, regraJuros,
    examesProcedimentos, formaEntregaResultado, detalheEntregaResultado, instrucoesGerais
  ]);

  const handleGeneratePairingCode = async () => {
    if (!pairingPhone) {
      setErrorMessage("Por favor, digite o número do WhatsApp para pareamento.");
      return;
    }
    setPairingLoading(true);
    setErrorMessage('');
    try {
      const cleanPhone = pairingPhone.replace(/\D/g, '');
      const cleanClinica = whatsappClinica.replace(/\D/g, '');
      const targetInst = cleanClinica || cleanPhone || instanceName || `clinica_${Math.floor(1000 + Math.random() * 9000)}`;
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
  const removeEspecialista = (index: number) => setEspecialistas(especialistas.filter((_, i) => i !== index));
  const updateEspecialista = (index: number, field: keyof Especialista, value: string) => {
    const newEsp = [...especialistas];
    newEsp[index][field] = value;
    setEspecialistas(newEsp);
  };

  const addBlocoHorario = () => setBlocosHorario([...blocosHorario, { dias: [], inicio: '', fim: '' }]);
  const removeBlocoHorario = (index: number) => setBlocosHorario(blocosHorario.filter((_, i) => i !== index));
  const toggleDiaBloco = (index: number, dia: string) => {
    const newBlocos = [...blocosHorario];
    const diasAtuais = newBlocos[index].dias;
    if (diasAtuais.includes(dia)) {
      newBlocos[index].dias = diasAtuais.filter(d => d !== dia);
    } else {
      newBlocos[index].dias.push(dia);
    }
    setBlocosHorario(newBlocos);
  };
  const updateHoraBloco = (index: number, field: 'inicio' | 'fim', value: string) => {
    const newBlocos = [...blocosHorario];
    newBlocos[index][field] = value;
    setBlocosHorario(newBlocos);
  }

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

      // Auto-refresh do QR Code a cada 35 segundos
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

  

  const handleGoogleDisconnect = async () => {
    if(confirm("Tem certeza que deseja desconectar o Google Agenda? Isso removerá a integração imediatamente.")) {
      setGoogleConnected(false);
      setGoogleTokens(null);
      try {
        const payload = {
          ownerEmail: emailAdmin || (typeof window !== 'undefined' ? (localStorage.getItem('onboarding_email') || localStorage.getItem('user_email') || localStorage.getItem('email') || null) : null),
          clinica: { nomeClinica, nomeSecretaria, endereco, linkGoogleMaps: `https://maps.google.com/?q=${encodeURIComponent(endereco)}`, whatsappClinica, especialistas, convenios: { aceitaConvenio, planos: aceitaConvenio ? conveniosSelecionados : [], observacoes: observacoesConvenio } },
          integracoes: { opcoesAgendamento, emailCalendar, whatsappHumano, whatsappReceberAgendamento, googleConnected: false },
          horarios: { tempoConsulta, valorConsulta, blocosHorario },
          googleTokens: null,
          forceDisconnect: true
        };
        const res = await fetch('/api/empresa/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert("O Google Agenda foi desconectado e as configurações foram atualizadas com sucesso!");
        } else {
          alert("Aviso: Falha ao salvar a desconexão no banco. Clique em Salvar Configurações.");
        }
      } catch (err) {
        alert("Erro ao salvar. Clique no botão de Salvar Configurações.");
      }
    }
  };

  const handleGoogleLogin = () => {
    // Abre a rota de Auth que geramos no backend para iniciar o OAuth Real
    window.open('/api/auth/google', '_blank', 'width=500,height=600');
  };

  const handlePrevTab = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage('');
    if (currentTab === 'procedimentos') {
      goToTab('horarios');
    } else if (currentTab === 'horarios') {
      goToTab('integracoes');
    } else if (currentTab === 'integracoes') {
      goToTab('clinica');
    } else if (currentTab === 'clinica') {
      router.push('/pagamento');
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, ''); // keep only numbers
    if (rawValue === '') rawValue = '0';
    const floatValue = parseInt(rawValue, 10) / 100;
    const formatted = floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorConsulta(formatted);
  };

  const validateStep1 = (): string | null => {
    if (!nomeClinica || !nomeClinica.trim()) return 'Preencha o Nome da Clínica.';
    if (!nomeSecretaria || !nomeSecretaria.trim() || nomeSecretaria === 'Secretária Virtual') {
      return 'Preencha o Nome da Secretária(o) Virtual.';
    }
    const cleanWp = whatsappClinica.replace(/\D/g, '');
    if (!cleanWp || cleanWp.length < 10) return 'Insira um WhatsApp Oficial da Clínica válido com DDD.';
    if (!emailAdmin || !emailAdmin.includes('@') || !emailAdmin.includes('.')) return 'Preencha um E-mail de Administrador válido.';
    if (!endereco || !endereco.trim()) return 'Preencha o Endereço Físico do Consultório.';
    if (!especialistas || especialistas.length === 0) return 'Adicione pelo menos 1 médico ao Corpo Clínico.';
    for (let i = 0; i < especialistas.length; i++) {
      if (!especialistas[i].nome || !especialistas[i].nome.trim() || !especialistas[i].especialidade || !especialistas[i].especialidade.trim()) {
        return `Preencha o nome e a especialidade do médico ${i + 1}.`;
      }
    }

    // Validação obrigatória de Ponto de Referência e Estacionamento
    if (!pontoReferencia || !pontoReferencia.trim()) {
      return 'Preencha o Ponto de Referência da clínica para orientar os pacientes.';
    }
    if (temEstacionamento === null) {
      return 'Informe se a clínica possui estacionamento (Selecione Sim ou Não).';
    }
    if (temEstacionamento === true && (!detalhesEstacionamento || !detalhesEstacionamento.trim())) {
      return 'Descreva os detalhes do estacionamento (Ex: Gratuito, Rotativo pago, Convênio).';
    }

    // Validação obrigatória de Faixa Etária
    if (!faixasEtarias || faixasEtarias.length === 0) {
      return 'Selecione pelo menos 1 Faixa Etária de atendimento permitida na clínica.';
    }

    // Validação obrigatória de Convênios
    if (aceitaConvenio && (!conveniosSelecionados || conveniosSelecionados.length === 0)) {
      return 'Selecione ou adicione pelo menos 1 convênio aceito, ou marque a opção 100% Particular.';
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
        return 'Insira o número do WhatsApp com DDD onde deseja receber os agendamentos.';
      }
    }
    if (opcoesAgendamento.calendar && !googleConnected) {
      return 'Para agendar via Google Agenda, é obrigatório conectar a conta Google.';
    }
    return null;
  };

  const validateStep3 = (): string | null => {
    const step2Err = validateStep2();
    if (step2Err) return step2Err;

    if (!tempoConsulta || !tempoConsulta.trim()) return 'Selecione o Tempo de Consulta.';
    
    const cleanValor = valorConsulta.replace(/\D/g, '');
    if (!cleanValor || Number(cleanValor) === 0 || valorConsulta === 'R$ 0,00') {
      return 'Informe o Valor da Consulta (não pode ser R$ 0,00).';
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

    // Validação obrigatória de Formas de Pagamento
    if (!formasPagamento || formasPagamento.length === 0) {
      return 'Selecione pelo menos 1 Forma de Pagamento aceita pela clínica (Ex: Pix, Cartão, Dinheiro).';
    }

    return null;
  };

  const validateStep4 = (): string | null => {
    const step3Err = validateStep3();
    if (step3Err) return step3Err;

    // Pelo menos 1 exame ou procedimento com nome preenchido
    const examesValidos = examesProcedimentos.filter(e => e.nome && e.nome.trim());
    if (examesValidos.length === 0) {
      return 'Cadastre pelo menos 1 Exame ou Procedimento oferecido pela clínica (o valor é opcional).';
    }

    if (formaEntregaResultado === 'link_site' && (!detalheEntregaResultado || !detalheEntregaResultado.trim())) {
      return 'Informe o link do site onde o paciente acessa o resultado do exame.';
    }
    if (formaEntregaResultado === 'presencial_contato' && (!detalheEntregaResultado || !detalheEntregaResultado.trim())) {
      return 'Informe como o paciente retira o resultado (ex: horário na recepção ou telefone do setor).';
    }

    // Instruções gerais obrigatórias
    if (!instrucoesGerais || !instrucoesGerais.trim()) {
      return 'Preencha as Instruções e Recomendações aos Pacientes (Ex: Chegar com 15 min de antecedência, trazer documentos/exames).';
    }

    return null;
  };

  const goToTab = (tab: Tab, keepError = false) => {
    if (!keepError) {
      setErrorMessage('');
    }
    if (tab === 'integracoes') {
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
    }
    if (tab === 'procedimentos') {
      const err = validateStep3();
      if (err) {
        showError(err);
        return;
      }
    }
    const stepNum = tab === 'procedimentos' ? '4' : tab === 'horarios' ? '3' : tab === 'integracoes' ? '2' : '1';
    router.push(`/configurar?step=${stepNum}`);
    setTimeout(scrollToTop, 50);
  };

  const handleNextTab = () => {
    setErrorMessage('');
    if (currentTab === 'clinica') {
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

    setSaving(true);

    try {
      const payload = {
        ownerEmail: emailAdmin || (typeof window !== 'undefined' 
          ? (localStorage.getItem('onboarding_email') || localStorage.getItem('user_email') || localStorage.getItem('email') || null) 
          : null),
        clinica: { 
          nomeClinica, 
          nomeSecretaria, 
          endereco, 
          linkGoogleMaps: `https://maps.google.com/?q=${encodeURIComponent(endereco)}`,
          whatsappClinica, 
          especialistas,
          convenios: {
            aceitaConvenio,
            planos: aceitaConvenio ? conveniosSelecionados : [],
            observacoes: observacoesConvenio
          },
          localizacaoAcesso: {
            pontoReferencia,
            temEstacionamento,
            detalhesEstacionamento: temEstacionamento ? detalhesEstacionamento : 'Não possui estacionamento no local'
          },
          faixaEtaria: {
            faixasPermitidas: faixasEtarias,
            regrasEspecificas: regrasFaixaEtaria
          }
        },
        integracoes: { opcoesAgendamento, emailCalendar, whatsappHumano, whatsappReceberAgendamento, googleConnected },
        horarios: { 
          tempoConsulta, 
          valorConsulta, 
          prazoRetorno,
          modalidadeAtendimento,
          blocosHorario,
          formasPagamento: {
            opcoesAceitas: formasPagamento,
            parcelamentoMaximo: formasPagamento.includes('Cartão de Crédito') ? parcelamentoMaximo : 'Não se aplica',
            regraJuros: formasPagamento.includes('Cartão de Crédito') ? regraJuros : 'Não se aplica'
          }
        },
        procedimentosExames: {
          lista: examesProcedimentos.filter(e => e.nome && e.nome.trim()),
          entregaResultados: {
            forma: formaEntregaResultado,
            detalhe: formaEntregaResultado === 'whatsapp_recepcao'
              ? 'A equipe da recepção envia pelo WhatsApp após o paciente informar Nome Completo e qual exame fez'
              : detalheEntregaResultado.trim()
          },
          instrucoesGerais: instrucoesGerais
        },
        googleTokens: googleTokens
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

  return (
    <div className="min-h-screen bg-[#08090a] text-gray-100 font-sans flex flex-col relative overflow-hidden">
      
      {/* 🌌 IMAGEM DE FUNDO PREMIUM (DARK) */}
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] mix-blend-screen pointer-events-none" style={{ backgroundImage: `url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg')` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#08090a_100%)] pointer-events-none" />

      {/* HEADER DE NAVEGAÇÃO SUPERIOR */}
      <nav className="relative z-10 w-full border-b border-[#27272a] bg-[#0c0d0e]/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="scale-75 origin-left"><Logo size="md" /></div>
            <div className="h-6 w-px bg-[#27272a] mx-2 hidden sm:block"></div>
            <span className="text-sm font-semibold text-teal-500 hidden sm:block tracking-wide uppercase">Painel Médico de Implantação</span>
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

      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* MENU LATERAL ESQUERDO */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col space-y-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Etapas de Implantação</h2>
          
          <button type="button" onClick={(e) => { e.preventDefault(); goToTab('clinica'); }} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'clinica' ? 'bg-teal-600/10 border border-teal-500/50 text-teal-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'clinica' ? 'bg-teal-500/20 text-teal-400' : 'bg-[#27272a] text-gray-400'}`}><Stethoscope className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">1. Dados da Clínica</p>
              <p className="text-xs opacity-70">Identidade da IA</p>
            </div>
          </button>

          <button type="button" onClick={(e) => { e.preventDefault(); goToTab('integracoes'); }} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'integracoes' ? 'bg-blue-600/10 border border-blue-500/50 text-blue-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'integracoes' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#27272a] text-gray-400'}`}><MessageCircle className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">2. Conexões Vitais</p>
              <p className="text-xs opacity-70">WhatsApp e Google</p>
            </div>
          </button>

          <button type="button" onClick={(e) => { e.preventDefault(); goToTab('horarios'); }} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'horarios' ? 'bg-purple-600/10 border border-purple-500/50 text-purple-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'horarios' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#27272a] text-gray-400'}`}><Calendar className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">3. Regras da Agenda</p>
              <p className="text-xs opacity-70">Preço, Horários e Pagamento</p>
            </div>
          </button>

          <button type="button" onClick={(e) => { e.preventDefault(); goToTab('procedimentos'); }} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'procedimentos' ? 'bg-emerald-600/10 border border-emerald-500/50 text-emerald-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'procedimentos' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#27272a] text-gray-400'}`}><ClipboardList className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">4. Exames & Preparo</p>
              <p className="text-xs opacity-70">Procedimentos e Orientações</p>
            </div>
          </button>
        </div>

        {/* FORMULÁRIO CENTRAL */}
        <div className="flex-1 flex flex-col h-full">
          <div id="form-scroll-container" className="bg-[#121417] border border-[#27272a] rounded-2xl p-6 sm:p-10 shadow-2xl flex-1 relative overflow-y-auto">
            {errorMessage && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* ABA: CLÍNICA */}
            {currentTab === 'clinica' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-6 mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Identidade Médica</h3>
                  <p className="text-gray-400 text-sm">Configure a clínica e adicione o corpo clínico da sua IA.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nome da Clínica *</label>
                    <input type="text" value={nomeClinica} onChange={(e) => setNomeClinica(e.target.value)} placeholder="Clínica Vitae" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nome da Secretária(o) Virtual *</label>
                    <input type="text" value={nomeSecretaria === 'Secretária Virtual' ? '' : nomeSecretaria} onChange={(e) => setNomeSecretaria(e.target.value)} placeholder="Ex: Sofia, Dra. Clara, Secretária Julia" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                    <p className="text-xs text-gray-500 mt-1">O nome com o qual a IA se apresentará aos pacientes.</p>
                  </div>
                  <div className="p-4 bg-[#14181d] border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-base font-bold text-teal-400 flex items-center gap-1.5">
                        <MessageCircle className="w-5 h-5 text-teal-400 inline" />
                        WhatsApp Oficial da Clínica *
                      </label>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        ⚠️ Não cadastre um WhatsApp recém-criado
                      </span>
                    </div>
                    <input type="text" value={whatsappClinica} onChange={(e) => setWhatsappClinica(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[#181a1f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors font-medium text-base" />
                    <p className="text-xs text-amber-200/80 mt-2 leading-relaxed">
                      💡 <strong>Dica de Segurança:</strong> Utilize o número oficial ou já aquecido da clínica (com histórico de conversas). Chips novos ativados no mesmo dia correm alto risco de bloqueio temporário pela Meta.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">E-mail do Administrador (Login) *</label>
                    <input type="email" value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} placeholder="doutor@clinica.com.br" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                    <p className="text-xs text-gray-500 mt-1">O e-mail usado para acessar o painel posteriormente.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Endereço Físico do Consultório *</label>
                    <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Avenida Paulista, 1000 - Sala 42" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                  </div>
                </div>

                {/* Bloco: Ponto de Referência & Estacionamento */}
                <div className="mt-6 bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-5">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-teal-400" /> Ponto de Referência & Estacionamento *
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">
                        Ponto de Referência Próximo *
                      </label>
                      <input 
                        type="text" 
                        value={pontoReferencia} 
                        onChange={(e) => setPontoReferencia(e.target.value)} 
                        placeholder="Ex: Em frente ao Shopping, ao lado do Banco do Brasil" 
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors" 
                      />
                      <p className="text-[11px] text-gray-500 mt-1">A IA indicará este ponto quando o paciente perguntar onde fica a clínica.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">
                        Possui Estacionamento no Local? *
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTemEstacionamento(true)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
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
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
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
                    <div className="bg-[#121417] p-4 rounded-xl border border-teal-900/30 animate-fade-in">
                      <label className="block text-xs font-semibold text-teal-300 mb-2">
                        Instruções do Estacionamento aos Pacientes *
                      </label>
                      <input 
                        type="text" 
                        value={detalhesEstacionamento} 
                        onChange={(e) => setDetalhesEstacionamento(e.target.value)} 
                        placeholder="Ex: Estacionamento rotativo no subsolo (pago) ou Vagas gratuitas exclusivas na frente" 
                        className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors" 
                      />
                    </div>
                  )}
                </div>

                {/* Bloco Dinâmico de Especialistas */}
                <div className="mt-8 bg-[#181a1f] p-6 rounded-2xl border border-[#27272a]">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-teal-500" /> Corpo Clínico</h4>
                  <div className="space-y-4">
                    {especialistas.map((esp, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-4 items-end bg-[#121417] p-4 rounded-xl border border-gray-800">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do Médico</label>
                          <input type="text" value={esp.nome} onChange={(e) => updateEspecialista(i, 'nome', e.target.value)} placeholder="Dr. Roberto" className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500" />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Especialidade</label>
                          <input type="text" value={esp.especialidade} onChange={(e) => updateEspecialista(i, 'especialidade', e.target.value)} placeholder="Ortodontia" className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500" />
                        </div>
                        <button onClick={() => removeEspecialista(i)} disabled={especialistas.length === 1} className="p-2 mb-0.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg disabled:opacity-30">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addEspecialista} className="mt-4 flex items-center space-x-2 text-sm text-teal-400 hover:text-teal-300 font-bold transition-colors">
                    <Plus className="w-4 h-4" /> <span>Adicionar Outro Especialista</span>
                  </button>
                </div>

                {/* Bloco: Faixa Etária de Atendimento */}
                <div className="mt-6 bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-teal-400" /> Faixa Etária de Atendimento *
                  </h4>
                  <p className="text-xs text-gray-400">
                    Selecione quais faixas etárias os especialistas da sua clínica atendem (obrigatório pelo menos uma):
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {opcoesFaixaEtaria.map(faixa => {
                      const isSelected = faixasEtarias.includes(faixa);
                      return (
                        <button
                          key={faixa}
                          type="button"
                          onClick={() => toggleFaixaEtaria(faixa)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Plus className="w-3.5 h-3.5 text-gray-500" />}
                          {faixa}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Observações sobre idade ou atendimento pediátrico (Opcional):
                    </label>
                    <input 
                      type="text" 
                      value={regrasFaixaEtaria} 
                      onChange={(e) => setRegrasFaixaEtaria(e.target.value)} 
                      placeholder="Ex: Atendimento infantil a partir de 2 anos de idade com a Dra. Giovanna." 
                      className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors" 
                    />
                  </div>
                </div>

                {/* Bloco de Convênios e Planos de Saúde */}
                <div className="mt-8 bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-800">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-teal-400" /> Convênios & Planos de Saúde
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        A IA usará essas informações para confirmar aos pacientes se a clínica aceita os planos ou atende particular.
                      </p>
                    </div>

                    {/* Switch Aceita Convênios ou Particular */}
                    <div className="flex items-center gap-2 bg-[#121417] p-1.5 rounded-xl border border-gray-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAceitaConvenio(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                      {/* Tags de Seleção Rápida */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                          Selecione os planos aceitos (clique para ativar/desativar):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {conveniosSugeridos.map((plano) => {
                            const isSelected = conveniosSelecionados.includes(plano);
                            return (
                              <button
                                key={plano}
                                type="button"
                                onClick={() => toggleConvenio(plano)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-sm'
                                    : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                                }`}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Plus className="w-3.5 h-3.5 text-gray-500" />}
                                {plano}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Input para Adicionar Convênio Customizado */}
                      <div className="bg-[#121417] p-4 rounded-xl border border-gray-800">
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Adicionar outro convênio, plano local ou parceria:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={novoConvenioInput}
                            onChange={(e) => setNovoConvenioInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomConvenio();
                              }
                            }}
                            placeholder="Ex: Cartão de Todos, Sindicato dos Bancários, Mediservice..."
                            className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomConvenio()}
                            disabled={!novoConvenioInput.trim()}
                            className="px-4 py-2.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Adicionar
                          </button>
                        </div>

                        {/* Lista de Convênios Selecionados Ativos */}
                        {conveniosSelecionados.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-800/60">
                            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
                              Planos que a IA confirmará aos pacientes ({conveniosSelecionados.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {conveniosSelecionados.map((plano) => (
                                <span
                                  key={plano}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-950/40 text-teal-200 border border-teal-700/40"
                                >
                                  {plano}
                                  <button
                                    type="button"
                                    onClick={() => removeConvenio(plano)}
                                    className="hover:text-red-400 text-gray-400 transition-colors ml-0.5"
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

                      {/* Observações / Regra de Cobertura */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Observações de Cobertura ou Regra de Reembolso (Opcional):
                        </label>
                        <input
                          type="text"
                          value={observacoesConvenio}
                          onChange={(e) => setObservacoesConvenio(e.target.value)}
                          placeholder="Ex: Consultas pelo plano; procedimentos estéticos e cirúrgicos apenas no particular."
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          A IA usará esta orientação caso o paciente pergunte detalhes sobre o que o plano cobre.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Caso a clínica seja 100% particular */
                    <div className="bg-[#121417] p-5 rounded-xl border border-amber-500/20 animate-fade-in space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⭐</span>
                        <div>
                          <h5 className="text-sm font-bold text-amber-300">Atendimento Exclusivamente Particular</h5>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Quando os pacientes perguntarem sobre planos de saúde no WhatsApp, a IA informará com elegância que a clínica atende de forma particular para oferecer total dedicação, e reforçará a emissão de recibo/nota fiscal detalhada para que o paciente solicite o reembolso diretamente ao plano.
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Instrução para a IA sobre Reembolso / Particular (Opcional):
                        </label>
                        <input
                          type="text"
                          value={observacoesConvenio}
                          onChange={(e) => setObservacoesConvenio(e.target.value)}
                          placeholder="Ex: Fornecemos nota fiscal detalhada com CRM para reembolso imediato."
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA: INTEGRAÇÕES */}
            {currentTab === 'integracoes' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-6 mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Conexões Vitais</h3>
                  <p className="text-gray-400 text-sm">Onde e como a IA irá trabalhar para você.</p>
                </div>
                
                
                {/* WhatsApp para Receber Agendamentos */}
                <div className="bg-[#121417] p-6 rounded-2xl border border-teal-900/30 animate-fade-in">
                  <h4 className="font-bold text-white mb-1 flex items-center"><svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>WhatsApp para Receber Agendamentos</h4>
                  <p className="text-xs text-gray-400 mb-4">Insira o número onde você quer que a IA notifique sobre os agendamentos realizados.</p>
                  <input type="text" value={whatsappReceberAgendamento} onChange={(e) => setWhatsappReceberAgendamento(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                </div>

                {/* Login Google */}
                {opcoesAgendamento.calendar && (
                  <div className="bg-[#121417] p-6 rounded-2xl border border-blue-900/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white mb-1 flex items-center"><img src="/google-agenda.svg" className="w-5 h-5 mr-2 rounded object-contain" alt="Google Agenda" />Autorizar Google Agenda</h4>
                        <p className="text-xs text-gray-400">Dê permissão para nossa IA criar eventos na sua agenda.</p>
                      </div>
                      <button onClick={handleGoogleLogin} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${googleConnected ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-white text-gray-900 hover:bg-gray-100'}`}>
                        {googleConnected ? <><CheckCircle className="w-5 h-5" /> <span>Conectado</span></> : <span>Fazer Login no Google</span>}
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Humano */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a]">
                  <h4 className="font-bold text-white mb-1 flex items-center"><svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>Atendimento humano (falar com assistente humano)</h4>
                  <p className="text-xs text-gray-400 mb-4">Caso o paciente deseje falar com um assistente humano, a IA notificará este número.</p>
                  <input type="text" value={whatsappHumano} onChange={(e) => setWhatsappHumano(e.target.value)} placeholder="(11) 98888-8888" className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>
            )}

            {/* ABA: HORÁRIOS */}
            {currentTab === 'horarios' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-6 mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Regras da Agenda</h3>
                  <p className="text-gray-400 text-sm">Tempo, valores e os horários que a IA vai disponibilizar.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center"><Clock className="w-4 h-4 mr-2 text-purple-400" /> Tempo de Consulta</label>
                    <select value={tempoConsulta} onChange={(e) => setTempoConsulta(e.target.value)} className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                      <option value="15">15 Minutos</option>
                      <option value="30">30 Minutos</option>
                      <option value="45">45 Minutos</option>
                      <option value="60">1 Hora</option>
                      <option value="120">2 Horas</option>
                    </select>
                  </div>
                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center"><DollarSign className="w-4 h-4 mr-2 text-green-400" /> Valor da Consulta</label>
                    <input type="text" value={valorConsulta} onChange={handleValorChange} placeholder="R$ 150,00" className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" />
                  </div>
                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center"><RefreshCw className="w-4 h-4 mr-2 text-blue-400" /> Direito a Retorno da Consulta</label>
                    <select value={prazoRetorno} onChange={(e) => setPrazoRetorno(e.target.value)} className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                      <option value="Até 15 dias">Até 15 dias</option>
                      <option value="Até 30 dias">Até 30 dias</option>
                      <option value="A definir com o médico">A definir com o médico</option>
                      <option value="Sem retorno gratuito incluso">Sem retorno gratuito incluso</option>
                    </select>
                  </div>
                  <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a]">
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center"><Stethoscope className="w-4 h-4 mr-2 text-teal-400" /> Tipo de Atendimento</label>
                    <select value={modalidadeAtendimento} onChange={(e) => setModalidadeAtendimento(e.target.value)} className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500">
                      <option value="Apenas Presencial">Apenas Presencial</option>
                      <option value="Presencial e Online (Vídeo)">Presencial e Online (Vídeo)</option>
                    </select>
                  </div>
                </div>

                {/* Blocos de Horários Dinâmicos */}
                <div className="space-y-4">
                  <h4 className="font-bold text-white">Blocos de Expediente</h4>
                  {blocosHorario.map((bloco, index) => (
                    <div key={index} className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a]">
                      <div className="flex justify-between items-start mb-4">
                        <label className="block text-sm font-semibold text-gray-300">Dias da Semana</label>
                        <button onClick={() => removeBlocoHorario(index)} disabled={blocosHorario.length === 1} className="text-red-500 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {diasDaSemana.map(dia => (
                          <button key={dia} onClick={() => toggleDiaBloco(index, dia)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${bloco.dias.includes(dia) ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-[#121417] border-gray-800 text-gray-400 hover:text-white'}`}>
                            {dia.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Abertura</label>
                          <input type="time" value={bloco.inicio} onChange={(e) => updateHoraBloco(index, 'inicio', e.target.value)} className="w-full bg-[#121417] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">Fechamento</label>
                          <input type="time" value={bloco.fim} onChange={(e) => updateHoraBloco(index, 'fim', e.target.value)} className="w-full bg-[#121417] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addBlocoHorario} className="flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300 font-bold transition-colors pt-2">
                    <Plus className="w-4 h-4" /> <span>Adicionar Novo Bloco (Ex: Sábado 08h as 12h)</span>
                  </button>
                </div>

                {/* Bloco: Formas de Pagamento Aceitas */}
                <div className="mt-8 bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-5">
                  <h4 className="text-base font-bold text-white flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-purple-400" /> Formas de Pagamento Aceitas *
                  </h4>
                  <p className="text-xs text-gray-400">
                    Selecione quais opções a clínica aceita para que a IA informe os pacientes no WhatsApp:
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {opcoesPagamento.map(forma => {
                      const isSelected = formasPagamento.includes(forma);
                      return (
                        <button
                          key={forma}
                          type="button"
                          onClick={() => toggleFormaPagamento(forma)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                              : 'bg-[#121417] text-gray-400 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Plus className="w-3.5 h-3.5 text-gray-500" />}
                          {forma}
                        </button>
                      );
                    })}
                  </div>

                  {formasPagamento.includes('Cartão de Crédito') && (
                    <div className="bg-[#121417] p-5 rounded-xl border border-purple-900/30 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Parcelamento Máximo no Cartão *
                        </label>
                        <select
                          value={parcelamentoMaximo}
                          onChange={(e) => setParcelamentoMaximo(e.target.value)}
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
                          Condição de Juros / Parcelas (Opcional)
                        </label>
                        <input
                          type="text"
                          value={regraJuros}
                          onChange={(e) => setRegraJuros(e.target.value)}
                          placeholder="Ex: Sem juros ou Com acréscimo da operadora"
                          className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA: PROCEDIMENTOS & EXAMES */}
            {currentTab === 'procedimentos' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-6 mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Exames, Procedimentos & Orientações</h3>
                  <p className="text-gray-400 text-sm">Cadastre os serviços oferecidos e as recomendações de preparo aos pacientes.</p>
                </div>

                {/* Lista de Exames e Procedimentos */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-emerald-400" /> Tabela de Exames e Procedimentos *
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Cadastre os exames realizados. A IA consultará esta lista quando o paciente perguntar se vocês realizam o procedimento.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold shrink-0">
                      💰 Valor do Exame é 100% OPCIONAL
                    </span>
                  </div>

                  <div className="space-y-4">
                    {examesProcedimentos.map((exame, idx) => (
                      <div key={idx} className="bg-[#121417] p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            Nome do Exame / Procedimento *
                          </label>
                          <input
                            type="text"
                            value={exame.nome}
                            onChange={(e) => updateExameProcedimento(idx, 'nome', e.target.value)}
                            placeholder="Ex: Hemograma, Ultrassonografia, Limpeza Dental, Raio-X"
                            className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="w-full md:w-44">
                          <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                            <span>Valor</span>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase">(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            value={exame.valor}
                            onChange={(e) => updateExameProcedimento(idx, 'valor', e.target.value)}
                            placeholder="Ex: R$ 80,00 ou deixe vazio"
                            className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                            <span>Preparo / Requisitos</span>
                            <span className="text-[10px] text-gray-500 uppercase">(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            value={exame.preparo}
                            onChange={(e) => updateExameProcedimento(idx, 'preparo', e.target.value)}
                            placeholder="Ex: Jejum de 8h, trazer pedido médico"
                            className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeExameProcedimento(idx)}
                          disabled={examesProcedimentos.length === 1}
                          className="p-2 mb-0.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg disabled:opacity-30 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addExameProcedimento}
                    className="flex items-center space-x-2 text-sm text-emerald-400 hover:text-emerald-300 font-bold transition-colors pt-1"
                  >
                    <Plus className="w-4 h-4" /> <span>Adicionar Outro Exame / Procedimento</span>
                  </button>
                </div>

                {/* Entrega de Resultados de Exames (Simples, rápido e sem termos técnicos) */}
                <div className="bg-[#181a1f] p-5 rounded-2xl border border-[#27272a] space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" /> Como o paciente recebe o Resultado dos Exames? *
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Escolha uma opção para a secretária virtual responder quando perguntarem se o exame ficou pronto:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => { setFormaEntregaResultado('whatsapp_recepcao'); setDetalheEntregaResultado(''); }}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 ${
                        formaEntregaResultado === 'whatsapp_recepcao'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check className={`w-4 h-4 shrink-0 ${formaEntregaResultado === 'whatsapp_recepcao' ? 'text-emerald-400' : 'opacity-30'}`} />
                      <span>Pelo WhatsApp (A recepção envia)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaEntregaResultado('link_site')}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 ${
                        formaEntregaResultado === 'link_site'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check className={`w-4 h-4 shrink-0 ${formaEntregaResultado === 'link_site' ? 'text-emerald-400' : 'opacity-30'}`} />
                      <span>Por um Link / Site da Clínica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaEntregaResultado('presencial_contato')}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 ${
                        formaEntregaResultado === 'presencial_contato'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-[#121417] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Check className={`w-4 h-4 shrink-0 ${formaEntregaResultado === 'presencial_contato' ? 'text-emerald-400' : 'opacity-30'}`} />
                      <span>Buscar na Clínica ou Outro Número</span>
                    </button>
                  </div>

                  {formaEntregaResultado === 'whatsapp_recepcao' && (
                    <p className="text-[11px] text-emerald-300/80 bg-[#121417] px-3.5 py-2.5 rounded-xl border border-emerald-900/30">
                      ✓ A secretária virtual pedirá o Nome Completo e qual exame o paciente fez, e avisará sua recepção para enviar o resultado.
                    </p>
                  )}

                  {formaEntregaResultado === 'link_site' && (
                    <div className="animate-fade-in">
                      <input
                        type="text"
                        value={detalheEntregaResultado}
                        onChange={(e) => setDetalheEntregaResultado(e.target.value)}
                        placeholder="Cole aqui o link onde o paciente vê o resultado (Ex: https://resultados.suaclinica.com.br)"
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {formaEntregaResultado === 'presencial_contato' && (
                    <div className="animate-fade-in">
                      <input
                        type="text"
                        value={detalheEntregaResultado}
                        onChange={(e) => setDetalheEntregaResultado(e.target.value)}
                        placeholder="Ex: Buscar na recepção de seg a sex das 8h às 17h, ou pedir no WhatsApp (11) 99999-9999"
                        className="w-full bg-[#121417] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Instruções e Recomendações Gerais aos Pacientes */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" /> Instruções & Recomendações de Comparecimento *
                    </h4>
                    <span className="text-xs text-emerald-400 font-semibold">Obrigatório</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    A IA enviará essas orientações aos pacientes sempre que confirmar um agendamento ou quando o paciente perguntar o que precisa levar:
                  </p>
                  <textarea
                    rows={4}
                    value={instrucoesGerais}
                    onChange={(e) => setInstrucoesGerais(e.target.value)}
                    placeholder="Ex: Chegar com 15 minutos de antecedência. Trazer documento oficial com foto, carteirinha do convênio (se houver) e exames anteriores. É permitido 1 acompanhante por paciente."
                    className="w-full bg-[#121417] border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* BOTÕES DE AÇÃO RODAPÉ */}
            <div className="mt-10 pt-6 border-t border-[#27272a] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Dados Protegidos | Use as setas do navegador para voltar</span>
              </div>
              
              <div className="flex space-x-3">
                {currentTab !== 'procedimentos' ? (
                  <button type="button" onClick={handleNextTab} className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors flex items-center space-x-2 shadow-lg cursor-pointer">
                    <span>Próxima Etapa</span><ArrowRight className="w-4 h-4" />
                </button>
                ) : (
                  <button type="button" onClick={handleSalvarConfiguracoes} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center space-x-2 disabled:opacity-50 cursor-pointer">
                    {saving ? <span>Criando Cérebro...</span> : <><span>Finalizar e Ligar IA</span><CheckCircle className="w-5 h-5" /></>}
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
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">WhatsApp Conectado com Sucesso!</h3>
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
                    window.location.href = '/';
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base rounded-xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <span>Concluir</span>
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Conecte sua IA ao WhatsApp</h3>

                {/* Seletor de Modo de Conexão */}
                <div className="flex border-b border-[#27272a] mb-6 w-full">
                  <button
                    type="button"
                    onClick={() => setConnectionMode('qr')}
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                      connectionMode === 'pairing' 
                        ? 'border-teal-500 text-teal-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Conexão Direta (Celular)
                  </button>
                </div>

                {errorMessage && (
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-xs font-semibold text-left flex items-start space-x-2 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {connectionMode === 'qr' ? (
                  <>
                    <p className="text-gray-400 text-sm mb-6 px-4">
                      Pegue o celular da clínica, abra o WhatsApp, vá em <strong className="text-white">Aparelhos Conectados</strong> e escaneie o código abaixo.
                    </p>

                    <div className="bg-white p-4 rounded-xl shadow-inner mb-6 relative min-h-[220px] min-w-[220px] flex items-center justify-center">
                      {qrLoading ? (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-semibold">Gerando novo código...</span>
                        </div>
                      ) : (
                        <img src={qrBase64} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" />
                      )}
                    </div>

                    <div className="w-full mb-6">
                      <p className="text-center text-xs text-gray-500 mb-6 italic">O QR Code é atualizado automaticamente por segurança.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-6 px-4">
                      Insira o número do WhatsApp da clínica com o código do país e DDD para gerar o código de pareamento.
                    </p>

                    <div className="w-full space-y-4 mb-6">
                      <div className="flex gap-2">
                        <input
                          ref={pairingPhoneInputRef}
                          type="text"
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 text-center"
                        />
                        <button
                          onClick={handleGeneratePairingCode}
                          disabled={pairingLoading || !pairingPhone}
                          className="px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center justify-center"
                        >
                          {pairingLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Gerar Código"}
                        </button>
                      </div>

                      {pairingCode ? (
                        <div className="bg-[#181a1f] border border-teal-500/30 p-6 rounded-2xl text-center space-y-4 animate-fade-in">
                          <span className="text-xs text-gray-400 uppercase tracking-widest block font-bold">Código de Conexão</span>
                          <div className="text-3xl font-extrabold text-teal-400 tracking-wider font-mono select-all bg-[#0c0d0e] py-3 rounded-xl border border-[#27272a] shadow-inner">
                            {pairingCode}
                          </div>
                          <div className="text-left text-xs text-gray-300 space-y-2 pt-2 border-t border-gray-800">
                            <p className="font-semibold text-white">Como conectar no seu WhatsApp:</p>
                            <p>1. Abra o WhatsApp no celular que deseja conectar.</p>
                            <p>2. Vá em <strong className="text-white">Aparelhos Conectados</strong> &gt; <strong className="text-white">Conectar um aparelho</strong>.</p>
                            <p>3. Toque em <strong className="text-white">Conectar com número de telefone</strong> na parte inferior.</p>
                            <p>4. Insira o código acima na tela do seu celular.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#181a1f]/50 border border-dashed border-[#27272a] p-8 rounded-xl text-center text-sm text-gray-500">
                          Clique em "Gerar Código" para obter a chave de pareamento de 8 dígitos.
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left mb-4 w-full flex items-start space-x-3">
                  <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-400/90 leading-relaxed">
                    <strong className="text-amber-500 block mb-1">Aviso de Segurança (Anti-Spam)</strong>
                    Este número ficará sob o controle exclusivo da nossa Inteligência Artificial para responder pacientes. <strong className="text-amber-300">Não utilize este número para fazer propagandas ou envios em massa (marketing)</strong>, sujeito a bloqueio definitivo do chip pelo WhatsApp.
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#08090a] text-white flex items-center justify-center font-bold">
        Carregando painel de implantação...
      </div>
    }>
      <ConfigurarFormContent />
    </Suspense>
  );
}
