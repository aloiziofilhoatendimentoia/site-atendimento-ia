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
  Send
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function LandingPage() {
  // --- LÓGICA DO CHAT WEB ---
  const [messages, setMessages] = useState<Message[]>([]);
  // Input já vem com a primeira frase predefinida para o usuário só enviar
  const [inputMsg, setInputMsg] = useState('Olá, bom dia!');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || isTyping) return;

    const userText = inputMsg.trim();
    const newTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Adiciona msg do usuário na tela
    const newMessages: Message[] = [...messages, { sender: 'user', text: userText, time: newTime }];
    setMessages(newMessages);
    setInputMsg('');
    setIsTyping(true);

    // Se for a PRIMEIRA MENSAGEM, o doutor responde localmente a saudação sem bater na API.
    if (newMessages.length === 1) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev, 
          { sender: 'bot', text: 'Olá, sou a **Fernanda**, assistente do Dr. Roberto da Clínica Vitae. Em que posso te ajudar hoje?', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
        ]);
        setIsTyping(false);
      }, 5000);
      return;
    }

    // Se for as próximas mensagens, chama o Gemini Cérebro na Rota API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      
      if (response.ok && data.reply) {
        // Fatiar a resposta em pequenas frases (baseado no \n\n da API)
        const frases = data.reply.split('\n\n').filter((f: string) => f.trim().length > 0);
        
        for (let i = 0; i < frases.length; i++) {
           const frase = frases[i];
           setIsTyping(true); // Liga a barrinha para a frase atual
           
           // Tempo de digitação realista e humanizado (para simular leitura e digitação humana)
           const readingDelay = Math.min(Math.max(5000, frase.length * 60), 12000);
           
           await new Promise(resolve => setTimeout(resolve, readingDelay)); // Espera digitando
           
           setMessages((prev) => [
             ...prev, 
             { sender: 'bot', text: frase, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
           ]);
           
           // Se tiver mais frases pela frente, pisca o isTyping pra false um segundinho
           if (i < frases.length - 1) {
              setIsTyping(false);
              await new Promise(resolve => setTimeout(resolve, 800)); // Pequena pausa onde ele "respira" antes de digitar o próximo balão
           }
        }
        setIsTyping(false);
      } else {
        throw new Error(data.error || 'Erro na API');
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev, 
          { sender: 'bot', text: 'Desculpe, meu sistema está indisponível no momento. Tente novamente mais tarde.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
        ]);
        setIsTyping(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen relative font-sans bg-slate-50 text-slate-900 overflow-x-hidden flex flex-col selection:bg-teal-200">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* LADO ESQUERDO: LINKS */}
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center flex-1 justify-start">
            <a href="#solucoes" className="text-slate-600 hover:text-teal-600 font-medium transition-colors whitespace-nowrap">Soluções</a>
            <a href="#simulador" className="text-slate-600 hover:text-teal-600 font-medium transition-colors whitespace-nowrap">Simule Agora</a>
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
            <Link 
              href="/dashboard"
              className="border border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-600 px-5 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap text-sm"
            >
              Acesse sua Clínica
            </Link>
            <Link 
              href="/pagamento"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-lg whitespace-nowrap text-sm"
            >
              Assinar Plano
            </Link>
          </div>
          
        </div>
      </nav>

      {/* HERO SECTION COM BACKGROUND */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        {/* Background Imagem Clara */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/bg-clinica.png')" }}
        >
          {/* Overlay suave para melhorar visibilidade do texto sem esconder o fundo */}
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* TEXTO HERO */}
            <div className="flex flex-col space-y-6 text-center lg:text-left bg-white/70 p-8 rounded-3xl backdrop-blur-md shadow-xl border border-white/50">
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

                <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-3 text-teal-700 font-bold text-xl pt-4 lg:pt-2 justify-center lg:justify-start">
                  <span className="bg-teal-100/80 px-4 py-2 rounded-full border border-teal-200 shadow-sm animate-pulse">
                    Teste nossa secretária virtual
                  </span>
                  {/* Seta gigante que gira dependendo de mobile ou desktop */}
                  <ArrowRight className="w-10 h-10 text-teal-600 hidden lg:block animate-bounce-x" style={{ animation: 'bounce-x 1s infinite' }} />
                  <ArrowRight className="w-10 h-10 text-teal-600 rotate-90 lg:hidden block animate-bounce" />
                </div>
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes bounce-x {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(25%); }
                }
              `}} />

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/pagamento"
                  className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Saiba Mais e Assine
                </Link>
                <a 
                  href="#simulador"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-semibold text-lg transition-colors flex items-center justify-center shadow-md"
                >
                  Simular Atendimento Web
                </a>
              </div>
            </div>

            {/* MOCKUP WHATSAPP (SIMULADOR DARK MODE PRETO) */}
            <div id="simulador" className="flex justify-center lg:justify-end relative mt-12 lg:mt-0">
              <div className="relative mx-auto border-slate-900 bg-slate-900 border-[8px] rounded-[2.5rem] h-[550px] w-[300px] sm:h-[650px] sm:w-[340px] shadow-2xl ring-1 ring-slate-800 overflow-hidden isolate flex flex-col transform hover:scale-[1.02] transition-transform duration-500">
                {/* Notch Preto */}
                <div className="w-[120px] sm:w-[148px] h-[18px] bg-slate-900 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-30 shadow-sm"></div>
                
                {/* WhatsApp UI */}
                <div className="absolute inset-0 bg-[#EFEAE2] flex flex-col font-sans">
                  {/* Background Padrão do WhatsApp clarinho */}
                  <div className="absolute inset-0 opacity-[0.05] z-0" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>
                  
                  {/* Header Chat */}
                  <div className="bg-[#008069] text-white p-3 pt-8 flex items-center space-x-3 z-10 shadow-sm">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#00A884]">
                        {/* Imagem de perfil gerada pela IA (logo-vitae.png) */}
                        <img src="/assets/logo-vitae.png" alt="Clinica Vitae" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">Clínica Vitae</h3>
                      <p className="text-xs text-teal-100 truncate">Online</p>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div ref={chatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-3 z-10 flex flex-col scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex justify-center mb-4 mt-2">
                      <span className="bg-[#E1F3FB] text-slate-600 text-[11px] px-3 py-1 rounded-lg uppercase tracking-wide font-medium shadow-sm">
                        Faça uma simulação do atendimento
                      </span>
                    </div>

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300`}>
                        <div className={`max-w-[85%] rounded-2xl p-2.5 shadow-sm text-sm relative ${
                          msg.sender === 'user' ? 'bg-[#E7FFDB] text-slate-800 rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                        }`}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-[14px] sm:text-[15px]">
                            {msg.text?.split(/(https?:\/\/[^\s]+|\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
                              if (part.startsWith('http://') || part.startsWith('https://')) {
                                return (
                                  <a
                                    key={index}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline break-all font-medium inline-block max-w-full"
                                  >
                                    {part}
                                  </a>
                                );
                              } else if (part.startsWith('**') && part.endsWith('**')) {
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
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-100">
                          <div className="flex items-center space-x-1.5 h-4 px-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Base (REAL) */}
                  <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] p-2 flex items-center space-x-2 z-10 border-t border-slate-200">
                    <input 
                      type="text"
                      className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-slate-800 shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                      placeholder="Fale com a IA..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      disabled={isTyping}
                    />
                    <button 
                      type="submit"
                      disabled={!inputMsg.trim() || isTyping}
                      className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#008f6f] disabled:opacity-50 transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </form>
                </div>
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
              "Agendamentos esquecidos no papel",
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
              { t: "Confirma presença sem intervenção", i: CheckCircle2 },
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
          <Link 
            href="/pagamento"
            className="inline-flex items-center px-8 py-4 bg-white text-[#004A7F] rounded-full font-bold text-lg hover:bg-slate-50 transition-colors shadow-xl"
          >
            Saiba Mais e Assine
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Logo size="md" className="grayscale opacity-70" />
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Atendimento IA. Inteligência Artificial para Clínicas.
          </p>
        </div>
      </footer>
    </div>
  );
}
