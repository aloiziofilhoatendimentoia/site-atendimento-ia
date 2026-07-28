"use client";

import React, { useState } from 'react';
import Logo from '@/components/Logo';
import { CreditCard, QrCode, CheckCircle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PagamentoPage() {
  const [tab, setTab] = useState<'cartao' | 'pix'>('cartao');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixGerado, setPixGerado] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#08090a] text-gray-100 font-sans flex flex-col items-center pt-10 px-4">
      <Logo size="lg" className="mb-8 scale-150 origin-center" />
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* RESUMO DO PEDIDO */}
        <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-8 flex flex-col h-fit shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Resumo do Plano</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-gray-300">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span>Implantação da Secretária IA</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span>Conexão com Google Calendar</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span>Atendimento 24/7 no WhatsApp</span>
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
            <label className="block text-sm font-medium text-gray-400 mb-2">E-mail para Licença e Acesso</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doutor@clinica.com.br"
              className="w-full bg-[#181a1f] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex space-x-4 mb-6">
            <button 
              onClick={() => setTab('cartao')}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center space-x-2 border transition-colors ${tab === 'cartao' ? 'bg-teal-600/10 border-teal-500 text-teal-400' : 'bg-transparent border-gray-800 text-gray-400 hover:text-white'}`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">Cartão</span>
            </button>
            <button 
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
                onClick={handlePagarCartao}
                disabled={loading}
                className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
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
                onClick={handlePagarPix}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
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
              <Link href="/sucesso" className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-center rounded-xl transition-colors">
                Simular Pagamento Confirmado
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
