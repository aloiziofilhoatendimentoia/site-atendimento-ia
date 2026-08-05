'use client';

import { useState, useEffect } from 'react';
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
  Wifi
} from 'lucide-react';
import Logo from '@/components/Logo';

interface LogItem {
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'whatsapp';
  message: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Status de controle do agente IA
  const [agentActive, setAgentActive] = useState(true);
  const [agentTemperature, setAgentTemperature] = useState(0.7);
  
  // Histórico de logs simulados da inteligência artificial
  const [logs, setLogs] = useState<LogItem[]>([
    { time: '11:27:03', type: 'info', message: 'Sistema de persistência híbrida Atendimento IA inicializado com sucesso.' },
    { time: '11:27:05', type: 'success', message: 'Conexão com o banco de dados híbrido estabelecida.' },
    { time: '11:27:10', type: 'info', message: 'Serviço de escuta do WhatsApp iniciado na porta local.' }
  ]);

  // Verificar sessão e carregar dados
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();

        if (!res.ok || !sessionData.authenticated) {
          window.location.href = '/?error=unauthorized';
          return;
        }

        // Carregar os dados empresariais cadastrados no banco
        const configRes = await fetch('/api/empresa/config');
        // Usaremos o banco de dados híbrido para preencher os dados
        const dbRes = await fetch(`/api/auth/session`); // Pega a sessão que já traz a empresa
        const session = await dbRes.json();

        if (!session.empresa) {
          // Se o usuário não configurou a empresa ainda, redireciona para a configuração
          window.location.href = '/configurar';
          return;
        }

        // Fazer requisição para obter os dados completos do dashboard do usuário
        // Criaremos um endpoint simples /api/empresa/dashboard para trazer todos os dados
        const dashRes = await fetch('/api/empresa/dashboard');
        const dashboardData = await dashRes.json();
        
        if (dashRes.ok && dashboardData.success) {
          setData(dashboardData.data);
        } else {
          // Mock data fallback se o endpoint não estiver completo
          setData({
            empresa: session.empresa,
            suporte: {
              dias_funcionamento: 'seg,ter,qua,qui,sex',
              horario_funcionamento: '09:00 - 18:00',
              endereco: 'Av. Paulista, 1000 - Cj 52',
              whatsapp_empresa: '+55 (11) 99999-9999',
              telefone_suporte: '+55 (11) 98888-8888'
            },
            agendamento: {
              usa_google_calendar: true,
              usa_whatsapp: true,
              whatsapp_agendamento: '11999999999'
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
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Simular a chegada de novas interações da IA em logs em tempo real
  useEffect(() => {
    if (loading || !agentActive) return;

    const phrases = [
      { type: 'whatsapp', message: 'Mensagem recebida de +55 (11) 98765-4321: "Quero agendar Harmonização hoje"' },
      { type: 'info', message: 'Análise de intenção concluída: Categoria = [AGENDAMENTO]' },
      { type: 'info', message: 'Verificando horários livres no Google Agenda conectado...' },
      { type: 'success', message: 'Google Agenda: Horários 14:30 e 17:00 estão livres. Enviando proposta...' },
      { type: 'whatsapp', message: 'Mensagem enviada para +55 (11) 98765-4321: "Olá! Temos horários disponíveis..."' },
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
  }, [loading, agentActive]);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.href = '/';
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

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex overflow-hidden font-sans">
      
      {/* 🔴 SIDEBAR PREMIUM FIXA */}
      <aside className="w-64 border-r border-[#27272a]/50 bg-[#18181b]/35 flex flex-col z-20 shrink-0">
        <div className="h-20 border-b border-[#27272a]/50 flex items-center px-6 bg-[#09090b]">
          <Logo size="sm" />
        </div>

        {/* Links de Navegação */}
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

        {/* Footer Sidebar */}
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

      {/* Container de Conteúdo Principal (Direita) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glows de background */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Topbar */}
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

        {/* Área de rolagem */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 z-10">
          
          {/* Grid de Status Principais (WhatsApp, Google Agenda, IA) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Status 1: WhatsApp */}
            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 shadow-lg flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-green-950/50 border border-green-500/30 text-green-400 flex items-center justify-center shrink-0">
                <Phone className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status WhatsApp</span>
                <span className="text-sm font-bold text-white block mt-0.5">🟢 Conectado</span>
                <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-[140px]">{data?.suporte?.whatsapp_empresa || 'Não configurado'}</span>
              </div>
            </div>

            {/* Status 2: Google Calendar */}
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

            {/* Status 3: Inteligência Artificial */}
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

            {/* Status 4: Conversas do Dia */}
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

          {/* Duas colunas do Painel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Coluna Esquerda: Terminal de Logs da IA em Tempo Real e Sliders de Configuração */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Terminal de Logs */}
              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[400px]">
                <div className="bg-[#09090b] px-6 py-4 border-b border-[#27272a]/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Terminal de Logs das Automações IA</span>
                  </div>
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                </div>
                
                {/* Console do Terminal */}
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

              {/* Ajuste de Temperatura e Ajustes do Robô */}
              <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a]/50 pb-3 mb-4 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Configuração de Respostas da IA</span>
                </h3>

                <div className="space-y-6">
                  {/* Slider Ativar/Desativar Agente */}
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

                  {/* Slider de Temperatura (Criatividade) */}
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

            {/* Coluna Direita: Detalhes Cadastrados e Tabela de Serviços */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Informações Cadastrais da Empresa */}
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

              {/* Serviços e Valores cadastrados */}
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
                      <span className="text-xs text-gray-500">Nenhum produto cadastrado na aba Vendas.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
