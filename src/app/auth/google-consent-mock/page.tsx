'use client';

import { useState } from 'react';
import { Calendar, Shield, Mail, ArrowRight, Check } from 'lucide-react';

export default function GoogleConsentMock() {
  const [email, setEmail] = useState('contato.atendimentoia@gmail.com');
  const [loading, setLoading] = useState(false);

  const handleAllow = () => {
    setLoading(true);
    // Redireciona para o callback simulado
    setTimeout(() => {
      window.location.href = `/api/auth/google/callback?code=mock_code_${Math.random().toString(36).substring(7)}&email=${encodeURIComponent(email)}`;
    }, 1200);
  };

  const handleCancel = () => {
    window.location.href = '/configurar?google_error=consent_denied';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Card Principal Glassmorphism */}
      <div className="w-full max-w-md bg-[#18181b]/70 border border-[#27272a] backdrop-blur-xl rounded-2xl p-8 shadow-2xl z-10 relative">
        {/* Logos */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
            {/* Google Logo Simulado */}
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500" />
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border border-purple-500">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Atendimento IA</h1>
          <p className="text-sm text-gray-400 mt-1">solicita acesso à sua Conta do Google</p>
        </div>

        {/* Campo de e-mail simulado */}
        <div className="mb-6 bg-[#27272a]/50 border border-[#3f3f46] rounded-lg p-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Selecione a Conta do Google
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <Mail className="w-4 h-4 text-purple-400 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full font-medium"
              placeholder="seuemail@gmail.com"
              required
            />
          </div>
        </div>

        {/* Escopos Solicitados */}
        <div className="mb-8 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Esta aplicação deseja permissão para:
          </p>

          <div className="flex items-start space-x-3 bg-[#27272a]/30 p-3 rounded-lg border border-[#27272a]">
            <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-200">Ver e gerenciar seus calendários</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permite ler, criar e alterar calendários no seu Google Agenda.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-[#27272a]/30 p-3 rounded-lg border border-[#27272a]">
            <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-200">Ver e gerenciar eventos de calendário</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permite agendar, modificar e remover eventos no seu Google Calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Notificação de segurança */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 mb-6 bg-purple-950/20 border border-purple-900/30 p-3 rounded-lg">
          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Sua conexão com o Google Agenda é criptografada e 100% segura.</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 font-medium rounded-lg text-sm transition-colors focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-medium rounded-lg text-sm transition-colors focus:outline-none flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Conectando...</span>
              </>
            ) : (
              <span>Permitir</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
