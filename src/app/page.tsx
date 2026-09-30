"use client";

import React, { useState, useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { 
  Phone, 
  Calendar, 
  HeartPulse, 
  Stethoscope, 
  CheckCircle2, 
  ChevronRight, 
  XCircle,
  Clock,
  UserCheck,
  Shield,
  Star,
  ArrowRight,
  Check,
  MapPin,
  ExternalLink,
  Sparkles,
  Wifi,
  Battery,
  Cloud,
  Send,
  ArrowLeft,
  Store,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ScriptStep {
  sender: 'user' | 'bot';
  text?: string;
  isMapCard?: boolean;
  typingDelay?: number;
}

const CONVERSATION_SCRIPT: ScriptStep[] = [
  { sender: 'user', text: 'Olá, bom dia! Gostaria de tirar umas dúvidas sobre a clínica.' },
  { sender: 'bot', text: 'Olá! Seja muito bem-vindo(a) à Clínica Vitae Odontologia. 😊', typingDelay: 7500 },
  { sender: 'bot', text: 'Sou a **Giovanna**, assistente da equipe. Como posso te ajudar hoje?', typingDelay: 8500 },
  { sender: 'user', text: 'O Dr. Lucas ainda atende aí? Queria ver se consigo consulta com ele.' },
  { sender: 'bot', text: 'Sim, com certeza! O Dr. Lucas atende aqui como cirurgião-dentista, cuidando de limpeza profilática, restaurações e próteses dentárias.', typingDelay: 9500 },
  { sender: 'bot', text: 'Além dele, nossa equipe conta também com a Dra. Camila (especialista em manutenção de aparelhos e ortodontia) e o Dr. Marcelo (cirurgião-dentista especialista em implantes e extrações). Temos excelente disponibilidade com todos eles! 🦷✨', typingDelay: 12000 },
  { sender: 'user', text: 'Que ótimo! E qual é o valor da avaliação inicial?' },
  { sender: 'bot', text: 'A consulta de avaliação odontológica com check-up digital completo tem o valor de R$ 120,00. Esse valor já inclui o planejamento detalhado do tratamento, avaliação da gengiva e fotos intraorais.', typingDelay: 11000 },
  { sender: 'user', text: 'Entendi, perfeito. E quais são os dias e horários de funcionamento de vocês?' },
  { sender: 'bot', text: 'Nosso horário de funcionamento é de Segunda a Sexta das 08:00 às 19:00, e aos Sábados das 08:00 às 13:00.\n\nFechamos apenas aos domingos e feriados. 😊', typingDelay: 10000 },
  { sender: 'user', text: 'Onde a clínica fica localizada?' },
  { sender: 'bot', text: 'Estamos localizados na Av. Boa Viagem, 1420 - Sala 402 - Boa Viagem, Recife/PE.', typingDelay: 8000 },
  { sender: 'bot', isMapCard: true, typingDelay: 7000 },
  { sender: 'user', text: 'Perfeito, achei bem perto! Quero marcar com o Dr. Lucas para amanhã.' },
  { sender: 'bot', text: 'Vou verificar a disponibilidade em nossa agenda, só um instante...', typingDelay: 7500 },
  { sender: 'bot', text: 'Temos horários disponíveis para amanhã com o Dr. Lucas às 10:00 e às 15:30 horas.\n\nQual destes dois horários fica melhor para você?', typingDelay: 10000 },
  { sender: 'user', text: 'Pode ser às 10:00, por favor.' },
  { sender: 'bot', text: 'Combinado! Para finalizar e emitir sua ficha, qual o nome completo do paciente?', typingDelay: 8000 },
  { sender: 'user', text: 'Mariana Souza Alves' },
  { sender: 'bot', text: 'Agendamento confirmado com sucesso! 🎉', typingDelay: 7000 },
  { sender: 'bot', text: '**Ficha do Agendamento Odontológico**:\n- Paciente: Mariana Souza Alves\n- Cirurgião-Dentista: Dr. Lucas\n- Data: Amanhã às 10:00h\n- Local: Av. Boa Viagem, 1420 - Sala 402', typingDelay: 10500 },
  { sender: 'bot', text: 'Já reservei a sala e seu horário no sistema. Qualquer dúvida antes da consulta, estamos à disposição por aqui! Tenha um ótimo dia e até breve! 💙🦷', typingDelay: 11000 },
];

export default function LandingPage() {
  const [messages, setMessages] = useState<Array<ScriptStep & { time: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const phoneSectionRef = useRef<HTMLDivElement>(null);

  // Monitora quando o aparelho celular entra no campo de visão do usuário
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPhoneVisible(true);
        }
      },
      {
        threshold: 0.35 // Ativa quando pelo menos 35% do celular já estiver na tela (ideal para PC e celulares)
      }
    );

    if (phoneSectionRef.current) {
      observer.observe(phoneSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Só inicia a simulação quando o celular estiver visível na tela
    if (!isPhoneVisible) return;

    let isCancelled = false;

    async function runScript() {
      while (!isCancelled) {
        setMessages([]);
        setIsTyping(false);
        // Pausa inicial confortável de 5 segundos para o visitante se situar
        await new Promise(r => setTimeout(r, 5000));

        for (let i = 0; i < CONVERSATION_SCRIPT.length; i++) {
          if (isCancelled) break;
          const step = CONVERSATION_SCRIPT[i];
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (step.sender === 'user') {
            // Tempo humano de leitura e resposta do paciente (5.5 segundos)
            await new Promise(r => setTimeout(r, 5500));
            if (isCancelled) break;
            setMessages(prev => [...prev, { ...step, time }]);
          } else {
            setIsTyping(true);
            const delay = step.typingDelay || 8500;
            await new Promise(r => setTimeout(r, delay));
            if (isCancelled) break;
            setIsTyping(false);
            setMessages(prev => [...prev, { ...step, time }]);
            // Pausa humana entre mensagens da secretária (3.5 segundos)
            await new Promise(r => setTimeout(r, 3500));
          }
        }

        // Aguarda 22 segundos antes de reiniciar o ciclo completo
        await new Promise(r => setTimeout(r, 22000));
      }
    }

    runScript();

    return () => {
      isCancelled = true;
    };
  }, [isPhoneVisible]);

  return (
    <div className="min-h-screen relative font-sans bg-slate-50 text-slate-900 overflow-x-hidden flex flex-col selection:bg-teal-200">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* LADO ESQUERDO: LINKS */}
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center flex-1 justify-start">
            <a href="#solucoes" className="text-slate-600 hover:text-teal-600 font-medium transition-colors whitespace-nowrap">Soluções</a>
            <a href="#planos" className="text-slate-600 hover:text-teal-600 font-medium transition-colors whitespace-nowrap">Planos</a>
          </div>

          {/* CENTRO: LOGO GIGANTE */}
          <div className="flex-shrink-0 flex items-center justify-center flex-1">
            <div className="scale-[2.0] md:scale-[2.5] lg:scale-[3.0] transform origin-center my-4 md:my-8 transition-transform">
              <Logo size="xl" className="object-contain" />
            </div>
          </div>

          {/* LADO DIREITO: BOTÃO DE ASSINATURA & ACESSO */}
          <div className="flex items-center flex-1 justify-end gap-3">
            <div className="flex flex-col items-center">
              <button 
                onClick={(e) => { e.preventDefault(); alert("🚀 EM BREVE! A plataforma estará disponível nos próximos dias."); }}
                className="relative group overflow-hidden border border-slate-300 hover:border-red-500 text-slate-700 px-5 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap text-sm min-w-[150px]"
              >
                <span className="group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                  Acesse sua Clínica
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-600 font-black text-lg tracking-widest bg-white/95 backdrop-blur-sm z-10">
                  EM BREVE
                </span>
              </button>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Pós pagamento</span>
            </div>
            
            <button 
              onClick={(e) => { e.preventDefault(); alert("🚀 EM BREVE! A plataforma estará disponível nos próximos dias."); }}
              className="relative group overflow-hidden bg-teal-600 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-lg whitespace-nowrap text-sm min-w-[130px]"
            >
              <span className="group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                Assinar Plano
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-100 font-black text-lg tracking-widest bg-red-600 z-10">
                EM BREVE
              </span>
            </button>
          </div>
          
        </div>
      </nav>

      {/* HERO SECTION COM BACKGROUND */}
      <section className="relative pt-16 pb-28 overflow-hidden bg-white">
        {/* Background Imagem Clara */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/bg-clinica.png')" }}
        >
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            
            {/* TEXTO HERO */}
            <div className="flex flex-col space-y-6 text-center lg:text-left bg-white/70 p-8 sm:p-10 rounded-3xl backdrop-blur-md shadow-xl border border-white/50">
              <div className="inline-flex items-center justify-center lg:justify-start space-x-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 font-semibold text-sm border border-teal-100 w-fit mx-auto lg:mx-0">
                <Shield className="w-4 h-4" />
                <span>Não fornecemos automação, fornecemos mais pacientes</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Sua Clínica Atende Pacientes <span className="text-teal-600">24 Horas</span> por Dia
              </h1>
              
              <div className="flex flex-col space-y-5">
                <p className="text-xl sm:text-2xl text-slate-700 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span>
                    <strong className="text-teal-600 font-extrabold bg-teal-50 px-3.5 py-1 rounded-xl border border-teal-200 shadow-sm inline-block my-1">
                      Inteligência Artificial
                    </strong>{' '}
                    trabalhando para a sua clínica: equipe menor e mais agendamentos de consultas.
                  </span>
                  <span className="inline-flex items-center gap-2 mt-1">
                    {/* Ícone WhatsApp Oficial Verde */}
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    {/* Ícone Google Agenda */}
                    <img src="/google-agenda.svg" className="w-8 h-8 rounded-lg object-contain shadow-md border border-slate-200" alt="Google Agenda" />
                  </span>
                </p>

                <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-3 text-teal-800 font-bold text-lg sm:text-xl pt-4 lg:pt-2 justify-center lg:justify-start">
                  <span className="bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-300 text-teal-800 px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600 animate-spin" style={{ animationDuration: '4s' }} />
                    Veja a nossa Secretária em Ação
                  </span>
                  <ArrowRight className="w-9 h-9 text-teal-600 hidden lg:block animate-bounce-x" style={{ animation: 'bounce-x 1s infinite' }} />
                  <ArrowRight className="w-9 h-9 text-teal-600 rotate-90 lg:hidden block animate-bounce" />
                </div>
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes bounce-x {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(25%); }
                }
              `}} />
            </div>

            {/* MOCKUP iPHONE MODERNO (TITANIUM NATURAL COM DYNAMIC ISLAND) */}
            <div ref={phoneSectionRef} id="simulador" className="flex flex-col items-center justify-center lg:justify-end relative mt-6 lg:mt-0">
              
              {/* Moldura Externa do iPhone (Bordas Ultrafinas, Titânio e Reflexo) */}
              <div className="relative mx-auto bg-slate-900 border-[10px] border-slate-800 rounded-[3rem] h-[610px] w-[310px] sm:h-[660px] sm:w-[350px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.4)] ring-1 ring-white/20 overflow-hidden flex flex-col transform hover:scale-[1.01] transition-transform duration-500">
                
                {/* Dynamic Island Moderna no Topo */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 bg-black h-[22px] w-[86px] rounded-full flex items-center justify-between px-2.5 shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-slate-800"></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500/80 animate-pulse"></div>
                </div>

                {/* WhatsApp UI Interna */}
                <div className="absolute inset-0 bg-[#EFEAE2] flex flex-col font-sans">
                  {/* Fundo Padrão Clássico */}
                  <div className="absolute inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>
                  
                  {/* Status Bar Estilo iOS */}
                  <div className="bg-[#008069] text-white pt-1.5 px-6 pb-1 flex justify-between items-center text-[11px] font-semibold tracking-tight z-20">
                    <span>09:41</span>
                    <div className="flex items-center space-x-1.5 opacity-90">
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Header Chat WhatsApp Business Oficial (Idêntico à Imagem do Usuário) */}
                  <div className="bg-[#008069] text-white px-2.5 py-2.5 flex items-center justify-between z-10 shadow-sm border-b border-[#006e5a]">
                    <div className="flex items-center space-x-2 min-w-0">
                      <ArrowLeft className="w-5 h-5 text-white shrink-0 cursor-pointer opacity-95" />
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/40 shadow-xs shrink-0">
                        <img src="/assets/logo-vitae.png" alt="Clinica Vitae Odontologia" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[13px] sm:text-[14px] truncate leading-tight">Clínica Vitae Odontologia</h3>
                        <p className="text-[10px] text-teal-100 flex items-center gap-1 leading-none mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                          Online
                        </p>
                      </div>
                    </div>

                    {/* Ícones da Direita do Topo: Loja (Business), Telefone com seta dropdown, e Três Pontinhos */}
                    <div className="flex items-center space-x-2.5 text-white opacity-95 shrink-0 pl-1">
                      <Store className="w-4 h-4 cursor-pointer" />
                      <div className="flex items-center cursor-pointer">
                        <Phone className="w-4 h-4" />
                        <span className="text-[8px] ml-0.5">▼</span>
                      </div>
                      <MoreVertical className="w-4 h-4 cursor-pointer" />
                    </div>
                  </div>

                  {/* Feed de Mensagens Animado */}
                  <div ref={chatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-3 z-10 flex flex-col scrollbar-hide pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex justify-center mb-2 mt-1">
                      <span className="bg-[#E1F3FB] text-slate-700 text-[10px] sm:text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-xs border border-teal-100/50">
                        Atendimento Odontológico 24h
                      </span>
                    </div>

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}>
                        
                        {/* Se for o Card de Localização Google Maps */}
                        {msg.isMapCard ? (
                          <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-white overflow-hidden shadow-sm border border-slate-200">
                            <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                              <img 
                                src="/assets/bg-clinica.png" 
                                alt="Fachada Clínica Vitae Odontologia" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                                <span className="p-1 rounded-full bg-red-600 text-white shadow-sm">
                                  <MapPin className="w-3.5 h-3.5 fill-current" />
                                </span>
                                <span className="text-xs font-bold drop-shadow-md">Clínica Vitae Odontologia</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50">
                              <div className="flex items-center justify-between">
                                <p className="text-[12px] font-bold text-slate-800">Av. Boa Viagem, 1420 - Sala 402</p>
                                <span className="flex items-center text-amber-500 text-[11px] font-bold">
                                  ★ 4.9
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">Boa Viagem • Recife/PE</p>
                              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  Abrir no Google Maps
                                </span>
                                <span className="text-[10px] text-slate-400">{msg.time}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Balão de Texto Regular */
                          <div className={`max-w-[88%] rounded-2xl p-2.5 shadow-sm text-sm relative ${
                            msg.sender === 'user' ? 'bg-[#E7FFDB] text-slate-800 rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                          }`}>
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px] sm:text-[14.5px]">
                              {msg.text?.split(/(https?:\/\/[^\s]+|\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                                } else if (part.startsWith('*') && part.endsWith('*')) {
                                  return <span key={index} className="font-semibold text-slate-900">{part.slice(1, -1)}</span>;
                                }
                                return part;
                              })}
                            </p>
                            <div className="flex justify-end items-center mt-1 space-x-1">
                              <span className="text-[10px] text-slate-400">{msg.time}</span>
                              {msg.sender === 'user' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}

                    {/* Três Pontinhos de Digitando (Humanizado) */}
                    {isTyping && (
                      <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-slate-100 flex items-center space-x-1.5">
                          <span className="text-[11px] text-slate-400 font-medium mr-1">Digitando</span>
                          <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barra Inferior Oficial WhatsApp (Idêntica à Imagem de Referência do Usuário) */}
                  <div className="bg-transparent px-2 py-2 flex items-center space-x-1.5 z-10">
                    {/* Campo em Cápsula Branca com Emoji, Mensagem, Clipe e Câmera */}
                    <div className="flex-1 bg-white rounded-full px-3 py-2 flex items-center justify-between shadow-sm border border-slate-100">
                      <div className="flex items-center space-x-2 text-slate-400 flex-1 min-w-0">
                        <Smile className="w-5 h-5 text-slate-400 shrink-0 cursor-pointer" />
                        <span className="text-sm text-slate-400 truncate">Mensagem</span>
                      </div>
                      <div className="flex items-center space-x-2.5 text-slate-400 shrink-0 pr-0.5">
                        <Paperclip className="w-4 h-4 -rotate-45 cursor-pointer text-slate-400 hover:text-slate-600" />
                        <Camera className="w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-600" />
                      </div>
                    </div>

                    {/* Botão Redondo Verde do Microfone de Áudio */}
                    <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white shadow-md shrink-0 cursor-pointer">
                      <Mic className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                </div>

                {/* Home Indicator Inferior do iPhone */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-900 rounded-full z-40 opacity-70"></div>
              </div>

              {/* BOTÃO DE ALTA CONVERSÃO: LOCALIZADO LOGO ABAIXO DO CELULAR */}
              <div className="w-full max-w-[340px] sm:max-w-[360px] pt-5 flex justify-center">
                <button 
                  onClick={(e) => { e.preventDefault(); alert("🚀 EM BREVE! A plataforma estará disponível nos próximos dias."); }}
                  className="relative group overflow-hidden w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center cursor-pointer border border-teal-500"
                >
                  <span className="group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Saiba Mais e Assine
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-100 font-black text-2xl tracking-widest bg-red-600 z-10">
                    EM BREVE
                  </span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO PROBLEMA - COM ENFASE ABSURDA */}
      <section id="beneficios" className="py-24 bg-red-50 relative overflow-hidden">
        {/* Adicionando Elementos de Tensão Visual (Listras, alertas) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-rose-600 to-red-500"></div>
        <div className="absolute top-10 left-10 opacity-10">
          <XCircle className="w-64 h-64 text-red-500" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center justify-center space-x-2 px-6 py-2 mb-6 rounded-full bg-red-100 text-red-700 font-extrabold text-sm tracking-wider uppercase border border-red-200 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>O PROBLEMA SILENCIOSO</span>
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              Sua clínica está <span className="text-red-600">perdendo pacientes</span> todos os dias sem você saber?
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 font-medium">
              Falhas no atendimento e lentidão no WhatsApp custam caro para a sua agenda.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Ligações perdidas no meio do dia",
              "WhatsApp ignorado por horas",
              "Consultas perdidas por causa da bateria",
              "Pacientes desistindo pela demora",
              "Secretária sobrecarregada",
              "Consultas não confirmadas a tempo"
            ].map((problem, idx) => (
              <div key={idx} className="bg-white border-l-8 border-red-500 rounded-2xl p-8 flex items-start space-x-5 shadow-2xl hover:shadow-red-900/10 hover:-translate-y-2 transition-all transform duration-300">
                <div className="bg-red-100 p-3 rounded-full flex-shrink-0 mt-1">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <span className="text-slate-900 font-bold text-xl leading-tight">{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO SOLUÇÃO - COM ENFASE MAJESTOSA */}
      <section id="solucoes" className="py-28 relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900">
        {/* Brilho de Fundo da Solução */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center justify-center space-x-2 px-6 py-2 mb-6 rounded-full bg-teal-500/30 text-teal-100 font-extrabold text-sm tracking-wider uppercase border border-teal-400/50 shadow-lg">
              <Star className="w-4 h-4 text-teal-300" />
              <span>A SOLUÇÃO DEFINITIVA</span>
              <Star className="w-4 h-4 text-teal-300" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
              A Inteligência Artificial Faz Tudo Isso Por Você <span className="text-teal-400 border-b-4 border-teal-400 pb-1">Automático.</span>
            </h2>
            <p className="text-xl md:text-2xl text-teal-100/90 font-medium max-w-3xl mx-auto">
              Deixe a tecnologia de ponta cuidar da triagem e do agendamento, enquanto sua equipe foca apenas no acolhimento presencial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { t: "Responde pacientes em 2 segundos (24h)", i: Clock },
              { 
                t: "Agenda consultas na hora via WhatsApp", 
                customIcon: (
                  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                )
              },
              { t: "Responde mesmo sem bateria ou internet", i: Cloud },
              { t: "Reagenda horários inteligentemente", i: ArrowRight },
              { 
                t: "Integra com Google Agenda direto no site", 
                customIcon: (
                  <img src="/google-agenda.svg" className="w-11 h-11 object-contain rounded-md" alt="Google Agenda" />
                )
              },
              { t: "Passa para um humano em casos urgentes", i: UserCheck }
            ].map((solution, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl hover:bg-white/20 transition-all hover:-translate-y-2 transform duration-300 group">
                <div className="bg-gradient-to-r from-teal-400 to-teal-500 p-5 rounded-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center w-20 h-20">
                  {solution.customIcon ? (
                    solution.customIcon
                  ) : (
                    <solution.i className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex flex-col justify-center min-h-[48px]">
                  <span className="text-white font-bold text-2xl leading-tight">{solution.t}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL / PLANOS */}
      <section id="planos" className="py-20 bg-[#004A7F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Descubra Como Sua Clínica Pode Atender Pacientes 24 Horas por Dia
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Impressione seus pacientes e transforme o atendimento da sua clínica agora mesmo.
          </p>
          {/*
          <Link 
            href="/pagamento"
            className="inline-flex items-center px-8 py-4 bg-white text-[#004A7F] rounded-full font-bold text-lg hover:bg-slate-50 transition-colors shadow-xl"
          >
            Saiba Mais e Assine
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          */}
          <button 
            onClick={(e) => { e.preventDefault(); alert("🚀 EM BREVE! A plataforma estará disponível nos próximos dias."); }}
            className="relative group overflow-hidden inline-flex items-center px-8 py-4 bg-white text-[#004A7F] rounded-full font-bold text-lg shadow-xl min-w-[250px]"
          >
            <span className="group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center w-full">
              Saiba Mais e Assine
              <ArrowRight className="w-5 h-5 ml-2" />
            </span>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-600 font-black text-2xl tracking-widest bg-white z-10">
              EM BREVE
            </span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Coluna Esquerda: Contatos */}
          <div className="flex flex-col items-start space-y-4">
            
            <div className="flex flex-col space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                <span>81 99546-2240</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>atendimentoia35@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
                <a href="https://instagram.com/atendimentoiaclinicas.tech" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">@atendimentoiaclinicas.tech</a>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Copyright e Privacidade */}
          <div className="flex flex-col md:items-end items-start space-y-2 mt-8 md:mt-0">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Atendimento IA. Inteligência Artificial para Clínicas.
            </p>
            <Link href="/privacidade" className="text-slate-500 text-sm hover:text-white transition-colors underline">
              Política de Privacidade
            </Link>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
