"use client";

import React, { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { 
  Building2, 
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
  QrCode,
  RefreshCw,
  XCircle,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'clinica' | 'integracoes' | 'horarios';

interface Especialista {
  nome: string;
  especialidade: string;
}

interface BlocoHorario {
  dias: string[];
  inicio: string;
  fim: string;
}

export default function ConfigurarClinicaPage() {
  const [currentTab, setCurrentTab] = useState<Tab>('clinica');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState(false);

  // 4. ESTADOS DO MODAL QR CODE
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // 1. DADOS DA CLÍNICA
  const [nomeClinica, setNomeClinica] = useState('');
  const [endereco, setEndereco] = useState('');
  const [whatsappClinica, setWhatsappClinica] = useState(''); // Número onde a IA vai responder clientes
  const [especialistas, setEspecialistas] = useState<Especialista[]>([{ nome: '', especialidade: '' }]);

  // 2. INTEGRAÇÕES (Z-API e CALENDAR)
  const [opcoesAgendamento, setOpcoesAgendamento] = useState({ whatsapp: false, calendar: false });
  const [emailCalendar, setEmailCalendar] = useState('');
  const [whatsappHumano, setWhatsappHumano] = useState(''); // Whatsapp para falar direto com o médico (escalada)
  const [whatsappReceberAgendamento, setWhatsappReceberAgendamento] = useState('');

  // 3. HORÁRIOS
  const [tempoConsulta, setTempoConsulta] = useState('30');
  const [valorConsulta, setValorConsulta] = useState('R$ 0,00');
  const [blocosHorario, setBlocosHorario] = useState<BlocoHorario[]>([
    { dias: [], inicio: '', fim: '' }
  ]);

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

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

  // Polling para verificar se o QR Code foi lido
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQrModal && instanceName) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/empresa/status-conexao?instance=${instanceName}`);
          if (res.ok) {
            const data = await res.json();
            if (data.state === 'open') {
              clearInterval(interval);
              window.location.href = '/sucesso';
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
  }, [showQrModal, instanceName]);

  const handleRegenerateQr = async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/empresa/gerar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao recarregar QR Code');
      if (data.evolutionQrCode) {
        setQrBase64(data.evolutionQrCode);
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setQrLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Abre a rota de Auth que geramos no backend para iniciar o OAuth Real
    window.open('/api/auth/google', '_blank', 'width=500,height=600');
  };

  const handleNextTab = () => {
    setErrorMessage('');
    if (currentTab === 'clinica') {
      if (!nomeClinica || !endereco || !whatsappClinica || especialistas.some(e => !e.nome || !e.especialidade)) {
        setErrorMessage('Preencha os dados da clínica, incluindo nome, endereço e todos os especialistas listados.');
        return;
      }
      setCurrentTab('integracoes');
    } else if (currentTab === 'integracoes') {
      if (!opcoesAgendamento.whatsapp && !opcoesAgendamento.calendar) {
        setErrorMessage('Escolha pelo menos uma opção de agendamento (WhatsApp ou Google Calendar).');
        return;
      }
      if (opcoesAgendamento.whatsapp && !whatsappReceberAgendamento) {
        setErrorMessage('Por favor, insira o número do WhatsApp onde você deseja receber os agendamentos.');
        return;
      }
      if (opcoesAgendamento.calendar && !googleConnected) {
        setErrorMessage('Para agendar via Google Calendar, é obrigatório conectar a conta Google.');
        return;
      }
      setCurrentTab('horarios');
    }
  };

  const handleSalvarConfiguracoes = async () => {
    setErrorMessage('');
    
    if (!nomeClinica || !endereco || !whatsappClinica || especialistas.some(e => !e.nome || !e.especialidade)) {
      setErrorMessage('Preencha os dados da clínica, incluindo nome, endereço e todos os especialistas listados.');
      setCurrentTab('clinica');
      return;
    }
    if (!opcoesAgendamento.whatsapp && !opcoesAgendamento.calendar) {
      setErrorMessage('Escolha pelo menos uma opção de agendamento (WhatsApp ou Google Calendar).');
      setCurrentTab('integracoes');
      return;
    }
    if (opcoesAgendamento.calendar && !googleConnected) {
      setErrorMessage('Para agendar via Google Calendar, é obrigatório conectar a conta Google.');
      setCurrentTab('integracoes');
      return;
    }
    if (!tempoConsulta || !valorConsulta || blocosHorario.some(b => b.dias.length === 0 || !b.inicio || !b.fim)) {
      setErrorMessage('Preencha os valores da consulta e os dias e horários de todos os blocos de expediente.');
      setCurrentTab('horarios');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        clinica: { nomeClinica, endereco, whatsappClinica, especialistas },
        integracoes: { opcoesAgendamento, emailCalendar, whatsappHumano, whatsappReceberAgendamento, googleConnected },
        horarios: { tempoConsulta, valorConsulta, blocosHorario },
        googleTokens: googleTokens
      };

      const res = await fetch('/api/empresa/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao conectar com o banco de dados.');

      if (data.evolutionQrCode) {
        setQrBase64(data.evolutionQrCode);
        setInstanceName(whatsappClinica.replace(/\D/g, ''));
        setShowQrModal(true);
      } else {
        window.location.href = '/sucesso';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar as configurações no servidor.');
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
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Sair</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* MENU LATERAL ESQUERDO */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col space-y-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Etapas de Implantação</h2>
          
          <button onClick={() => setCurrentTab('clinica')} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'clinica' ? 'bg-teal-600/10 border border-teal-500/50 text-teal-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'clinica' ? 'bg-teal-500/20 text-teal-400' : 'bg-[#27272a] text-gray-400'}`}><Stethoscope className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">1. Dados da Clínica</p>
              <p className="text-xs opacity-70">Identidade da IA</p>
            </div>
          </button>

          <button onClick={() => setCurrentTab('integracoes')} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'integracoes' ? 'bg-blue-600/10 border border-blue-500/50 text-blue-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'integracoes' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#27272a] text-gray-400'}`}><MessageCircle className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">2. Conexões Vitais</p>
              <p className="text-xs opacity-70">WhatsApp e Google</p>
            </div>
          </button>

          <button onClick={() => setCurrentTab('horarios')} className={`flex items-center space-x-3 w-full p-4 rounded-xl text-left transition-all ${currentTab === 'horarios' ? 'bg-purple-600/10 border border-purple-500/50 text-purple-400' : 'hover:bg-[#18181b] border border-transparent text-gray-400'}`}>
            <div className={`p-2 rounded-lg ${currentTab === 'horarios' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#27272a] text-gray-400'}`}><Calendar className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-sm">3. Regras da Agenda</p>
              <p className="text-xs opacity-70">Preço, Tempo e Horários</p>
            </div>
          </button>
        </div>

        {/* FORMULÁRIO CENTRAL */}
        <div className="flex-1 flex flex-col h-full">
          <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-6 sm:p-10 shadow-2xl flex-1 relative overflow-y-auto">
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
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nome da Clínica</label>
                    <input type="text" value={nomeClinica} onChange={(e) => setNomeClinica(e.target.value)} placeholder="Clínica Vitae" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">WhatsApp Oficial da Clínica *</label>
                    <input type="text" value={whatsappClinica} onChange={(e) => setWhatsappClinica(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                    <p className="text-xs text-gray-500 mt-1">O número onde a IA responderá os clientes.</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Endereço Físico do Consultório</label>
                    <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Avenida Paulista, 1000 - Sala 42" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                  </div>
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
              </div>
            )}

            {/* ABA: INTEGRAÇÕES */}
            {currentTab === 'integracoes' && (
              <div className="animate-fade-in space-y-6">
                <div className="border-b border-[#27272a] pb-6 mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Conexões Vitais</h3>
                  <p className="text-gray-400 text-sm">Onde e como a IA irá trabalhar para você.</p>
                </div>
                
                {/* Meios de Agendamento */}
                <div className="bg-[#181a1f] p-6 rounded-2xl border border-[#27272a] space-y-4">
                  <h4 className="font-bold text-white">Opções de Agendamento *</h4>
                  <p className="text-xs text-gray-400">Por onde o paciente poderá finalizar o agendamento? (Selecione pelo menos um)</p>
                  <div className="flex flex-col space-y-3 pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={opcoesAgendamento.whatsapp} onChange={(e) => setOpcoesAgendamento({...opcoesAgendamento, whatsapp: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500" />
                      <span className="text-gray-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        Agendamento Direto no WhatsApp
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={opcoesAgendamento.calendar} onChange={(e) => setOpcoesAgendamento({...opcoesAgendamento, calendar: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
                      <span className="text-gray-300 flex items-center">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                        Agendamento pelo Google Calendar
                      </span>
                    </label>
                  </div>
                </div>

                {/* Caixa Condicional de WhatsApp */}
                {opcoesAgendamento.whatsapp && (
                  <div className="bg-[#121417] p-6 rounded-2xl border border-teal-900/30 animate-fade-in">
                    <h4 className="font-bold text-white mb-1">WhatsApp para Receber Agendamentos</h4>
                    <p className="text-xs text-gray-400 mb-4">Insira o número onde você quer que a IA notifique sobre os agendamentos realizados.</p>
                    <input type="text" value={whatsappReceberAgendamento} onChange={(e) => setWhatsappReceberAgendamento(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[#181a1f] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" />
                  </div>
                )}

                {/* Login Google */}
                {opcoesAgendamento.calendar && (
                  <div className="bg-[#121417] p-6 rounded-2xl border border-blue-900/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white mb-1">Autorizar Google Calendar</h4>
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
                  <h4 className="font-bold text-white mb-1">Atendimento humano (falar com assistente humano)</h4>
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
                    <input type="text" value={valorConsulta} onChange={(e) => setValorConsulta(e.target.value)} placeholder="R$ 350,00" className="w-full bg-[#121417] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" />
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
              </div>
            )}

            {/* BOTÕES DE AÇÃO RODAPÉ */}
            <div className="mt-10 pt-6 border-t border-[#27272a] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4" /><span>Dados Protegidos</span>
              </div>
              
              <div className="flex space-x-3">
                {currentTab !== 'horarios' ? (
                  <button onClick={handleNextTab} className="px-6 py-3 bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold rounded-xl transition-colors flex items-center space-x-2">
                    <span>Próxima Etapa</span><ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSalvarConfiguracoes} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center space-x-2 disabled:opacity-50">
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
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Conecte sua IA ao WhatsApp</h3>
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

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left mb-8 w-full flex items-start space-x-3">
                <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-400/90 leading-relaxed">
                  <strong className="text-amber-500 block mb-1">Aviso de Segurança (Anti-Spam)</strong>
                  Este número ficará sob o controle exclusivo da nossa Inteligência Artificial para responder pacientes. <strong className="text-amber-300">Não utilize este número para fazer propagandas ou envios em massa (marketing)</strong>, sujeito a bloqueio definitivo do chip pelo WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-3">
                <button 
                  onClick={() => setShowQrModal(false)} 
                  className="flex-1 py-3 px-4 bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" /> <span>Voltar para Edição</span>
                </button>
                <button 
                  onClick={handleRegenerateQr}
                  disabled={qrLoading}
                  className="flex-1 py-3 px-4 bg-teal-600/10 border border-teal-500/30 hover:bg-teal-600/20 text-teal-400 font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${qrLoading ? 'animate-spin' : ''}`} /> <span>Gerar Novamente</span>
                </button>
              </div>

              <button 
                onClick={() => window.location.href = '/sucesso'}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center justify-center space-x-2 mt-4"
              >
                <span>Já Escaneei / Concluir Conexão</span>
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
