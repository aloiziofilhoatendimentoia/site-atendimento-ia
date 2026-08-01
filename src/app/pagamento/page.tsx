"use client";

import React, { useState } from 'react';
import Logo from '@/components/Logo';
import { CreditCard, QrCode, CheckCircle, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PagamentoPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'cartao' | 'pix'>('cartao');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixGerado, setPixGerado] = useState(false);

  const handleVoltarInicio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/');
  };

  const handlePagarCartao = async () => {
    if (!email) {
      setError('Por favor, informe um e-mail válido para a licença.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const stripeRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const stripeData = await stripeRes.json();
      
      if (!stripeRes.ok) throw new Error(stripeData.error || 'Erro ao gerar pagamento.');
      
      window.location.href = stripeData.url;
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
      setLoading(false);
    }
  };

  const handlePagarPix = () => {
    if (!email) {
      setError('Por favor, informe um e-mail válido para a licença.');
      return;
    }
    setError('');
    setLoading(true);
    // Simula a geração de um QR Code Pix
    setTimeout(() => {
      setPixGerado(true);
      setLoading(false);
    }, 1500);
  };

  const isEmailValid = email.trim().length > 3 && email.includes('@') && email.includes('.');

  return (
    <div className="min-h-screen bg-[#08090a] text-gray-100 font-sans flex flex-col items-center pt-6 px-4">
      {/* HEADER LOGO */}
      <div className="w-full max-w-4xl flex items-center justify-center mb-8">
        <Logo size="md" />
      </div>
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* RESUMO DO PEDIDO */}
        <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-8 flex flex-col h-fit shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Resumo do Plano</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-gray-300">
              <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <span className="font-semibold">Implantação da Secretária IA</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
              <span className="font-semibold">Conexão com Google Calendar</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <svg className="w-5 h-5 flex-shrink-0 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span className="font-semibold">Atendimento 24 horas por dia, 7 dias por semana no seu WhatsApp</span>
            </div>
          </div>

          <div className="bg-[#181a1f] p-4 rounded-xl border border-gray-800 space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Taxa de Adesão (Hoje)</span>
              <span className="font-semibold text-white">R$ 599,00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Manutenção Mensal</span>
              <span className="text-gray-300">R$ 397,00/mês</span>
            </div>
            <div className="text-xs text-teal-400 text-right mt-1">*Cobrada só a partir do próximo mês</div>
            
            <div className="border-t border-gray-700 my-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg text-white">Total a pagar hoje</span>
              <span className="font-bold text-2xl text-teal-400">R$ 599,00</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500 justify-center">
            <ShieldCheck className="w-4 h-4" />
            <span>Pagamento 100% seguro processado pela Stripe</span>
          </div>
        </div>

        {/* FORMA DE PAGAMENTO */}
        <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-8 flex flex-col shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Pagamento Seguro</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">E-mail para Licença e Acesso *</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doutor@clinica.com.br"
              className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
            {!isEmailValid && (
              <p className="text-xs text-amber-400 mt-1">Preencha um e-mail válido para liberar o botão de pagamento.</p>
            )}
          </div>

          <div className="flex space-x-4 mb-6">
            <button 
              type="button"
              onClick={() => setTab('cartao')}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center space-x-2 border transition-colors ${tab === 'cartao' ? 'bg-teal-600/10 border-teal-500 text-teal-400' : 'bg-transparent border-gray-800 text-gray-400 hover:text-white'}`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">Cartão</span>
            </button>
            <button 
              type="button"
              onClick={() => setTab('pix')}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center space-x-2 border transition-colors ${tab === 'pix' ? 'bg-teal-600/10 border-teal-500 text-teal-400' : 'bg-transparent border-gray-800 text-gray-400 hover:text-white'}`}
            >
              <QrCode className="w-5 h-5" />
              <span className="font-semibold">PIX</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {tab === 'cartao' && (
            <div className="flex flex-col mt-auto">
              <p className="text-sm text-gray-400 mb-6 text-center">
                Você será redirecionado para o ambiente seguro da Stripe para inserir os dados do cartão.
              </p>
              <button 
                type="button"
                onClick={handlePagarCartao}
                disabled={loading || !isEmailValid}
                className={`w-full py-4 font-bold rounded-xl flex items-center justify-center transition-colors ${
                  isEmailValid && !loading 
                    ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-lg' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60 border border-gray-700'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>Ir para Checkout Seguro</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {tab === 'pix' && !pixGerado && (
            <div className="flex flex-col mt-auto">
              <p className="text-sm text-gray-400 mb-6 text-center">
                Aprovação instantânea. A liberação do seu painel é automática após o pagamento.
              </p>
              <button 
                type="button"
                onClick={handlePagarPix}
                disabled={loading || !isEmailValid}
                className={`w-full py-4 font-bold rounded-xl flex items-center justify-center transition-colors ${
                  isEmailValid && !loading 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60 border border-gray-700'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>Gerar QR Code PIX</span>
                    <QrCode className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {tab === 'pix' && pixGerado && (
            <div className="flex flex-col items-center mt-auto animate-fade-in">
              <div className="bg-white p-4 rounded-xl mb-4">
                {/* Mock QR CODE IMG */}
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-800" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 text-center">
                Escaneie o QR Code com o app do seu banco ou copie a chave abaixo:
              </p>
              <div className="w-full flex items-center space-x-2 bg-[#181a1f] border border-gray-800 rounded-lg p-3 mb-6">
                <code className="text-teal-400 text-xs flex-1 truncate">00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426655440000520400005303986...</code>
                <button className="text-gray-400 hover:text-white px-2">Copiar</button>
              </div>
              
              {/* Botão para Simular o Pagamento Aprovado no Fluxo Pix */}
              <Link href="/configurar" className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-center rounded-xl transition-colors">
                Simular Pagamento Confirmado e Configurar Clínica
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
