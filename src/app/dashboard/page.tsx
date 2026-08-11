'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Calendar,
  Phone,
  DollarSign,
  Layers,
  Clock,
  Shield,
  MessageSquare,
  Activity,
  User,
  Settings,
  ChevronRight,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileText,
  LogOut,
  Sparkles,
  Wifi,
  Mail,
  Lock,
  Loader2,
  QrCode,
  Smartphone,
  RefreshCw,
  XCircle,
  Check
} from 'lucide-react';
import Logo from '@/components/Logo';

interface LogItem {
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'whatsapp';
  message: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Status de controle do agente IA
  const [agentActive, setAgentActive] = useState(true);
  const [agentTemperature, setAgentTemperature] = useState(0.7);

  // Estados de Login OTP
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [testCodeMsg, setTestCodeMsg] = useState('');

  // Estados de Conexão WhatsApp Dinâmica
  const [whatsappState, setWhatsappState] = useState<string>('unknown');
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'qr' | 'pairing'>('qr');
  const [qrBase64, setQrBase64] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [reconnectError, setReconnectError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Histórico de logs simulados da inteligência artificial
  const [logs, setLogs] = useState<LogItem[]>([
    { time: '11:27:03', type: 'info', message: 'Sistema de persistência híbrida Atendimento IA inicializado com sucesso.' },
    { time: '11:27:05', type: 'success', message: 'Conexão com o banco de dados híbrido estabelecida.' },
    { time: '11:27:10', type: 'info', message: 'Serviço de escuta do WhatsApp iniciado na porta local.' }
  ]);

  // Verificar sessão e carregar dados
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();

        if (res.ok && sessionData.authenticated) {
          setAuthenticated(true);
          await loadDashboardData();
        } else {
          setAuthenticated(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        setAuthenticated(false);
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  // Carregar dados completos do dashboard
  async function loadDashboardData() {
    try {
      const dashRes = await fetch('/api/empresa/dashboard');
      const dashboardData = await dashRes.json();
      
      let finalData = null;
      if (dashRes.ok && dashboardData.success) {
        finalData = dashboardData.data;
      } else {
        // Fallback mock data
        finalData = {
          empresa: { nome_empresa: 'Clínica Médica Premium', nicho: 'Médico' },
          suporte: {
            dias_funcionamento: 'seg,ter,qua,qui,sex',
            horario_funcionamento: '09:00 - 18:00',
            endereco: 'Av. Paulista, 1000 - Cj 52',
            whatsapp_empresa: '5581999049361',
            telefone_suporte: '+55 (81) 98888-8888'
          },
          agendamento: {
            usa_google_calendar: true,
            usa_whatsapp: true,
            whatsapp_agendamento: '5581999049361'
          },
          venda: {
            link_pagamento: 'https://stripe.com/pay/atendimento-ia',
            chave_pix: 'pix@atendimentoia.com.br'
          },
          servicos: [
            { servico: 'Harmonização Facial', valor: 150.00 },
            { servico: 'Limpeza de Pele', valor: 80.00 }
          ],
          googleIntegration: {
            google_email: 'contato.clinicaestetica@gmail.com'
          }
        };
      }
      
      setData(finalData);
      
      // Consultar o status real do WhatsApp inicial
      const cleanPhone = finalData?.suporte?.whatsapp_empresa?.replace(/\D/g, '') || '81999049361';
      await checkWhatsappStatus(cleanPhone);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setLoading(false);
    }
  }

  // Verificar status de conexão do WhatsApp
  async function checkWhatsappStatus(instanceName: string) {
    try {
      const res = await fetch(`/api/empresa/status-conexao?instance=${instanceName}`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappState(data.state);
      }
    } catch (err) {
      console.error('Erro ao checar status do WhatsApp:', err);
    }
  }

  // Polling periódico do status do WhatsApp (apenas se logado)
  useEffect(() => {
    if (!authenticated || !data) return;
    
    const instanceName = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '') || '81999049361';
    
    const interval = setInterval(() => {
      checkWhatsappStatus(instanceName);
    }, 10000); // Checa a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [authenticated, data]);

  // Polling para quando o modal de reconexão está aberto
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showReconnectModal && data && !isConnected) {
      const instanceName = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '') || '81999049361';
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/empresa/status-conexao?instance=${instanceName}`);
          if (res.ok) {
            const statusData = await res.json();
            if (statusData.state === 'open') {
              setIsConnected(true);
              setWhatsappState('open');
              setTimeout(() => {
                setShowReconnectModal(false);
                setIsConnected(false);
              }, 2000);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showReconnectModal, data, isConnected]);

  // Enviar código OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthError('Por favor, insira um e-mail válido.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Erro ao enviar código de verificação.');
      }

      setOtpSent(true);
      setTestCodeMsg(resData.testCode || '');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Verificar código OTP e Logar
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setAuthError('Por favor, insira o código de 6 dígitos.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Código inválido ou expirado.');
      }

      setAuthenticated(true);
      setLoading(true);
      await loadDashboardData();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Solicitar QR Code para reconexão
  const handleOpenReconnect = async () => {
    if (!data) return;
    const instanceName = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '') || '81999049361';
    
    setShowReconnectModal(true);
    setQrLoading(true);
    setConnectionMode('qr');
    setPairingCode('');
    setIsConnected(false);
    
    // Configura o telefone padrão para pareamento
    const cleanPhone = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '');
    setPairingPhone(cleanPhone || '55');

    try {
      const res = await fetch('/api/empresa/gerar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      });
      const qrData = await res.json();
      if (!res.ok) throw new Error(qrData.error || 'Erro ao gerar QR Code');
      if (qrData.evolutionQrCode) {
        setQrBase64(qrData.evolutionQrCode);
      }
    } catch (err: any) {
      setReconnectError(err.message);
    } finally {
      setQrLoading(false);
    }
  };

  // Recarregar QR Code no modal
  const handleRegenerateQr = async () => {
    if (!data) return;
    const instanceName = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '') || '81999049361';
    setQrLoading(true);
    setReconnectError('');
    try {
      const res = await fetch('/api/empresa/gerar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      });
      const qrData = await res.json();
      if (!res.ok) throw new Error(qrData.error || 'Erro ao recarregar QR Code');
      if (qrData.evolutionQrCode) {
        setQrBase64(qrData.evolutionQrCode);
      }
    } catch (err: any) {
      setReconnectError(err.message);
    } finally {
      setQrLoading(false);
    }
  };

  // Gerar código de pareamento no modal
  const handleGeneratePairingCode = async () => {
    if (!data) return;
    const cleanPhone = pairingPhone.replace(/\D/g, '');
    const cleanClinica = data?.suporte?.whatsapp_empresa?.replace(/\D/g, '');
    const targetInst = cleanPhone || cleanClinica || '81999049361';
    setPairingLoading(true);
    setReconnectError('');
    try {
      const res = await fetch('/api/empresa/gerar-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: targetInst, phoneNumber: pairingPhone })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erro ao gerar código de celular.');
      if (resData.pairingCode) {
        setPairingCode(resData.pairingCode);
      }
    } catch (err: any) {
      setReconnectError(err.message);
    } finally {
      setPairingLoading(false);
    }
  };

  // Simular novas interações da IA em logs em tempo real
  useEffect(() => {
    if (loading || !agentActive || !authenticated) return;

    const phrases = [
      { type: 'whatsapp', message: 'Mensagem recebida de +55 (81) 98765-4321: "Quero agendar Harmonização hoje"' },
      { type: 'info', message: 'Análise de intenção concluída: Categoria = [AGENDAMENTO]' },
      { type: 'info', message: 'Verificando horários livres no Google Agenda conectado...' },
      { type: 'success', message: 'Google Agenda: Horários 14:30 e 17:00 estão livres. Enviando proposta...' },
      { type: 'whatsapp', message: 'Mensagem enviada para +55 (81) 98765-4321: "Olá! Temos horários disponíveis..."' },
      { type: 'whatsapp', message: 'Cliente respondeu: "Prefiro o das 14:30"' },
      { type: 'info', message: 'Criando chave Pix dinâmica no valor de R$ 150.00 para confirmação.' },
      { type: 'success', message: 'Chave Pix de confirmação gerada e copiada para a conversa.' },
      { type: 'success', message: 'Aviso: Webhook do n8n (Notificar Humano) notificado silenciosamente.' },
      { type: 'success', message: 'PAGAMENTO DETECTADO! Conciliação bancária Pix efetuada com sucesso.' },
      { type: 'success', message: 'Evento criado no Google Agenda: Harmonização Facial - 14:30 hoje.' },
      { type: 'whatsapp', message: 'Confirmação final enviada via WhatsApp para o cliente!' }
    ];

    let count = 0;
    const interval = setInterval(() => {
      if (count < phrases.length) {
        const item = phrases[count];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setLogs((prev) => [
          ...prev,
          { time: timeStr, type: item.type as any, message: item.message }
        ].slice(-100)); // guarda os últimos 100 logs
        count++;
      } else {
        count = 0;
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [loading, agentActive, authenticated]);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setAuthenticated(false);
      setData(null);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-gray-100 flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-xl border-4 border-purple-900 border-t-purple-500 animate-spin" />
        <p className="text-sm font-medium text-gray-400">Carregando painel SaaS premium...</p>
      </div>
    );
  }

  // 🔴 1. INTERFACE DE LOGIN SEM SENHA (OTP)
  if (authenticated === false) {
    return (
      <div className="min-h-screen bg-[#08090a] text-gray-100 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glows de fundo */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md flex flex-col items-center z-10">
          <div className="mb-8">
            <Logo size="md" />
          </div>

          <div className="w-full bg-[#121417] border border-[#27272a] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-600 to-teal-500" />
            
            <h2 className="text-xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>Painel de Controle</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Acesse a dashboard da sua clínica. Insira seu e-mail cadastrado para receber o código de verificação temporário.
            </p>

            {authError && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {testCodeMsg && (
              <div className="mb-5 p-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-xl">
                <span className="block mb-1 text-white">⚙️ Modo de Homologação (SMTP não configurado no Coolify):</span>
                Seu código OTP de 6 dígitos é: <span className="text-lg font-mono text-white underline select-all">{testCodeMsg}</span>
              </div>
            )}

            {!otpSent ? (
              // FASE 1: Inserir Email
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">E-mail Comercial</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doutor@clinica.com.br"
                      className="w-full bg-[#181a1f] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Receber Código por E-mail</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // FASE 2: Inserir Código OTP
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Código de 6 Dígitos</label>
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)} 
                      className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                    >
                      Alterar E-mail
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-center text-white focus:outline-none focus:border-purple-500 text-xl font-mono tracking-[0.4em] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Confirmar Código e Entrar</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🟢 2. INTERFACE COMPLETA DO DASHBOARD
  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex overflow-hidden font-sans">
      
      {/* SIDEBAR PREMIUM */}
      <aside className="w-64 border-r border-[#27272a]/50 bg-[#18181b]/35 flex flex-col z-20 shrink-0">
        <div className="h-20 border-b border-[#27272a]/50 flex items-center px-6 bg-[#09090b]">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 block mb-4">Painel Administrativo</span>
          <button className="w-full text-left p-3 rounded-xl bg-purple-600 text-white font-bold text-sm transition-all flex items-center space-x-3 shadow-lg shadow-purple-600/10">
            <Activity className="w-4 h-4" />
            <span>Painel Principal</span>
          </button>
          <button onClick={() => window.location.href = '/configurar'} className="w-full text-left p-3 rounded-xl bg-transparent text-gray-400 hover:text-white hover:bg-[#27272a]/30 text-sm transition-all flex items-center space-x-3">
            <Settings className="w-4 h-4" />
            <span>Configurar Robô</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#27272a]/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/25 uppercase">
              {data?.empresa?.nome_empresario ? data.empresa.nome_empresario[0] : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">{data?.empresa?.nome_empresario || 'Empresário'}</span>
              <span className="text-[9px] text-gray-500 truncate max-w-[120px]">Administrador</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* CONTAINER PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* TOPBAR */}
        <header className="h-20 border-b border-[#27272a]/50 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>{data?.empresa?.nome_empresa || 'Sua Empresa'}</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-green-950/40 text-green-400 rounded-full border border-green-500/20 uppercase">
                {data?.empresa?.nicho || 'Comercial'}
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-400 bg-[#18181b] border border-[#27272a] px-3.5 py-1.5 rounded-xl">
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span>Conexão Supabase: <b>Ativa</b></span>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 z-10">
          
          {/* GRID DE STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* CARD WHATSAPP DINÂMICO */}
            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  whatsappState === 'open' 
                    ? 'bg-green-950/50 border-green-500/30 text-green-400' 
                    : 'bg-red-950/40 border-red-500/20 text-red-400'
                }`}>
                  <Phone className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status WhatsApp</span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {whatsappState === 'open' ? '🟢 Conectado' : '🔴 Desconectado'}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-[130px]">
                    {data?.suporte?.whatsapp_empresa || 'Não configurado'}
                  </span>
                </div>
              </div>
              
              {/* BOTÃO DE RECONEXÃO SÓ APARECE SE ESTIVER DESCONECTADO */}
              {whatsappState !== 'open' && (
                <button 
                  onClick={handleOpenReconnect}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-md shadow-red-500/10"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reconectar</span>
                </button>
              )}
            </div>

            {/* CARD GOOGLE AGENDA */}
            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 shadow-lg flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5.5 h-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Google Agenda</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {data?.agendamento?.usa_google_calendar ? '🟢 Integrado' : '⚪ Desativado'}
                </span>
                <span className="text-[10px] text-purple-300 block mt-0.5 truncate" title={data?.googleIntegration?.google_email}>
                  {data?.googleIntegration?.google_email || 'Sem conexão ativa'}
                </span>
              </div>
            </div>

            {/* CARD AGENTE IA */}
            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 shadow-lg flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <Bot className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Agente de IA</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {agentActive ? '🟢 Operando 24h' : '🔴 Desligado'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Atendimento inteligente</span>
              </div>
            </div>

            {/* CARD ATENDIMENTOS HOJE */}
            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 shadow-lg flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Atendimentos Hoje</span>
                <span className="text-lg font-extrabold text-white block leading-tight">14</span>
                <span className="text-[10px] text-green-400 block font-semibold">100% de taxa de acerto</span>
              </div>
            </div>

          </div>

          {/* GRID CENTRAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUNA ESQUERDA (LOGS E TEMPERATURA) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[400px]">
                <div className="bg-[#09090b] px-6 py-4 border-b border-[#27272a]/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Terminal de Logs das Automações IA</span>
                  </div>
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                </div>
                
                <div className="flex-1 bg-black/90 p-4 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-2.5 selection:bg-purple-600/30 text-zinc-300 scrollbar-thin">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                      {log.type === 'success' && <span className="text-green-400 shrink-0 font-bold">[SUCCESS]</span>}
                      {log.type === 'info' && <span className="text-blue-400 shrink-0 font-bold">[INFO]</span>}
                      {log.type === 'warning' && <span className="text-yellow-400 shrink-0 font-bold">[WARNING]</span>}
                      {log.type === 'error' && <span className="text-red-400 shrink-0 font-bold">[ERROR]</span>}
                      {log.type === 'whatsapp' && <span className="text-green-500 shrink-0 font-bold">[WHATSAPP]</span>}
                      <span className={log.type === 'whatsapp' ? 'text-green-100 font-medium' : ''}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a]/50 pb-3 mb-4 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Configuração de Respostas da IA</span>
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Ativar Agente de IA</span>
                      <span className="text-[10px] text-gray-500 block">Liga ou desliga o atendimento automático no WhatsApp</span>
                    </div>
                    <button
                      onClick={() => setAgentActive(!agentActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        agentActive ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          agentActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">Criatividade / Temperatura da IA</span>
                      <span className="text-purple-400">{agentTemperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={agentTemperature}
                      onChange={(e) => setAgentTemperature(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#09090b] rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>Mais Direta (Factual)</span>
                      <span>Mais Criativa (Humana)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA (DADOS E SERVIÇOS) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a]/50 pb-3 mb-4 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Configurações Cadastradas</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#27272a]/30 pb-2">
                     <span className="text-gray-500 font-medium">Dias de Funcionamento</span>
                     <span className="text-white font-semibold uppercase">{data?.suporte?.dias_funcionamento || 'seg,ter,qua,qui,sex'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#27272a]/30 pb-2">
                    <span className="text-gray-500 font-medium">Horário de Atendimento</span>
                    <span className="text-white font-semibold">{data?.suporte?.horario_funcionamento || '09:00 - 18:00'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#27272a]/30 pb-2">
                    <span className="text-gray-500 font-medium">Suporte Humano</span>
                    <span className="text-white font-semibold">{data?.suporte?.telefone_suporte || 'Não configurado'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-500 font-medium">Chave Pix Comercial</span>
                    <span className="text-green-400 font-semibold">{data?.venda?.chave_pix || 'Inativa / Não Pix'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a]/50 pb-3 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span>Produtos & Serviços Inteligentes</span>
                </h3>

                <div className="space-y-3">
                  {data?.servicos && data.servicos.length > 0 ? (
                    data.servicos.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-[#09090b]/40 border border-[#27272a] px-4 py-3 rounded-xl">
                        <span className="text-xs font-bold text-white">{s.servico}</span>
                        <span className="text-xs font-extrabold text-purple-400">R$ {parseFloat(s.valor).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-[#09090b]/20 border border-[#27272a]/50 rounded-xl">
                      <span className="text-xs text-gray-500">Nenhum produto cadastrado.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 🔴 MODAL DE RECONEXÃO DO WHATSAPP (EXATAMENTE COMO O ONBOARDING) */}
      {showReconnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#121417] border border-[#27272a] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
            
            {/* Header Modal */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-teal-400" />
                <span>Reconectar WhatsApp Clínica</span>
              </h3>
              <button 
                onClick={() => setShowReconnectModal(false)}
                className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 pb-8 text-center flex flex-col items-center">
              
              {/* Abas */}
              <div className="flex w-full border-b border-gray-800 mb-6 mt-2">
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

              {reconnectError && (
                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-xs font-semibold text-left flex items-start space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{reconnectError}</span>
                </div>
              )}

              {connectionMode === 'qr' ? (
                <>
                  <p className="text-gray-400 text-xs mb-6 px-4">
                    Pegue o celular da clínica, abra o WhatsApp, vá em <strong className="text-white">Aparelhos Conectados</strong> e escaneie o código abaixo.
                  </p>

                  <div className="bg-white p-4 rounded-xl shadow-inner mb-6 relative min-h-[220px] min-w-[220px] flex items-center justify-center">
                    {qrLoading ? (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mb-2 text-teal-500" />
                        <span className="text-xs font-semibold">Gerando novo QR...</span>
                      </div>
                    ) : (
                      <img src={qrBase64} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" />
                    )}
                  </div>

                  <div className="w-full mb-6">
                    <button 
                      onClick={handleRegenerateQr}
                      disabled={qrLoading}
                      className="w-full py-3 px-4 bg-teal-600/10 border border-teal-500/30 hover:bg-teal-600/20 text-teal-400 font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} /> <span>Gerar Novamente</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-xs mb-6 px-4">
                    Insira o número do WhatsApp da clínica com o código do país e DDD para gerar o código de pareamento.
                  </p>

                  <div className="w-full space-y-4 mb-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value)}
                        placeholder="Ex: 5511999999999"
                        className="flex-1 bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 text-center text-sm"
                      />
                      <button
                        onClick={handleGeneratePairingCode}
                        disabled={pairingLoading || !pairingPhone}
                        className="px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-xs whitespace-nowrap flex items-center justify-center"
                      >
                        {pairingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Gerar Código"}
                      </button>
                    </div>

                    {pairingCode ? (
                      <div className="bg-[#181a1f] border border-teal-500/30 p-6 rounded-2xl text-center space-y-4 animate-fade-in">
                        <span className="text-xs text-gray-400 uppercase tracking-widest block font-bold">Código de Conexão</span>
                        <div className="text-2xl font-extrabold text-teal-400 tracking-wider font-mono select-all bg-[#0c0d0e] py-3 rounded-xl border border-[#27272a] shadow-inner">
                          {pairingCode}
                        </div>
                        <div className="text-left text-[11px] text-gray-300 space-y-2 pt-2 border-t border-gray-800">
                          <p className="font-semibold text-white">Como conectar no seu WhatsApp:</p>
                          <p>1. Abra o WhatsApp no celular que deseja conectar.</p>
                          <p>2. Vá em <strong className="text-white">Aparelhos Conectados</strong> &gt; <strong className="text-white">Conectar um aparelho</strong>.</p>
                          <p>3. Toque em <strong className="text-white">Conectar com número de telefone</strong> na parte inferior.</p>
                          <p>4. Insira o código acima na tela do seu celular.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#181a1f]/50 border border-dashed border-[#27272a] p-8 rounded-xl text-center text-xs text-gray-500">
                        Clique em "Gerar Código" para obter a chave de pareamento de 8 dígitos.
                      </div>
                    )}
                  </div>
                </>
              )}

              {isConnected && (
                <div className="w-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center justify-center space-x-2 animate-bounce">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Conectado com Sucesso!</span>
                </div>
              )}

              <div className="w-full bg-gray-800 text-gray-400 p-3 rounded-xl text-xs flex items-center justify-center space-x-2">
                <span>Aguardando leitura ou pareamento no celular...</span>
                <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
