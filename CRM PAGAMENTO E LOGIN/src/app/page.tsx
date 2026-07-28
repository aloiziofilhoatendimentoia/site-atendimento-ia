"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [showPixModal, setShowPixModal] = useState(false);

  const handleCheckout = async () => {
    if (paymentMethod === "pix") {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowPixModal(true);
      }, 1000);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao iniciar o checkout.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar o checkout.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Header Premium */}
      <header className="w-full py-4 px-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Atendimento IA Logo" width={180} height={50} className="object-contain" priority />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <ShieldCheck size={18} className="text-secondary" />
          Ambiente 100% Seguro
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Value Proposition */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-6 border border-secondary/20">
              <Zap size={16} />
              Atendimento 24h por dia, 7 dias por semana
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
              Aumente seus agendamentos com <span className="text-primary">Inteligência Artificial</span>.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Nossa secretária virtual atende todos os seus pacientes de forma humanizada, responde dúvidas, cadastra na agenda e nunca deixa ninguém esperando. Tudo em minutos.
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Agendamento automático diretamente na sua agenda",
              "Privacidade total e segurança de dados dos seus pacientes",
              "Atendimento instantâneo, fim da fila de espera no WhatsApp",
              "Painel de controle simples e assistente de implantação"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={20} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Checkout Card */}
        <div className="relative">
          {/* Decorator Blur */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-[2rem] blur-xl opacity-20 dark:opacity-30"></div>
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Plano Pro Médico</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Tudo que você precisa para automatizar sua clínica hoje.</p>

            <div className="flex items-end gap-2 mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">R$ 397</span>
              <span className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-1">/ mês</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Taxa de Setup Única</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configuração de toda a arquitetura</p>
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">R$ 599</span>
            </div>

            {/* Opções de Método de Pagamento */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Escolha como pagar:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMethod === "pix"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l10 10-10 10L2 12z" />
                  </svg>
                  Pix / QR Code
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Processando...
                </>
              ) : (
                <>
                  {paymentMethod === "pix" ? "Gerar QR Code Pix" : "Assinar e Começar Agora"}
                  <ArrowRight size={22} />
                </>
              )}
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-6 font-medium">
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>
        </div>
      </main>

      {/* Pix Payment Modal */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pagamento via Pix</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Escaneie o QR Code abaixo para finalizar sua ativação.</p>
            
            <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center p-4 mb-6 border border-slate-200 dark:border-slate-700">
              {/* QR Code Simulado Premium */}
              <svg className="w-full h-full text-slate-900 dark:text-white" viewBox="0 0 100 100" fill="currentColor">
                <rect x="10" y="10" width="20" height="20" />
                <rect x="15" y="15" width="10" height="10" fill="white" />
                <rect x="70" y="10" width="20" height="20" />
                <rect x="75" y="15" width="10" height="10" fill="white" />
                <rect x="10" y="70" width="20" height="20" />
                <rect x="15" y="75" width="10" height="10" fill="white" />
                <rect x="35" y="35" width="30" height="30" />
                <rect x="40" y="40" width="20" height="20" fill="white" />
                <rect x="45" y="45" width="10" height="10" />
                {/* Random Pix patterns */}
                <rect x="35" y="15" width="10" height="10" />
                <rect x="50" y="10" width="5" height="15" />
                <rect x="15" y="45" width="15" height="5" />
                <rect x="75" y="45" width="15" height="10" />
                <rect x="45" y="75" width="15" height="5" />
                <rect x="70" y="70" width="10" height="10" />
              </svg>
            </div>

            <div className="mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Chave Pix Copia e Cola</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value="00020101021226930014br.gov.bcb.pix2571pix-qr.atendimentoia.com.br/qr/v2/996.00BRL" 
                  className="flex-1 h-11 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText("00020101021226930014br.gov.bcb.pix2571pix-qr.atendimentoia.com.br/qr/v2/996.00BRL");
                    alert("Copiado com sucesso!");
                  }}
                  className="h-11 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/95 transition-all"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="text-left bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl mb-6 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Valor Total:</span>
                <span className="font-bold text-slate-900 dark:text-white">R$ 996,00</span>
              </div>
              <p className="text-xs text-slate-400">Setup Único (R$ 599) + 1º Mês (R$ 397)</p>
            </div>

            <button
              onClick={() => window.location.href = "/onboarding"}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              Confirmar Pagamento e Iniciar
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => setShowPixModal(false)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              Voltar e alterar método
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
