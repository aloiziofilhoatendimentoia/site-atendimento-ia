import React from 'react';
import Link from 'next/link';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-xl rounded-2xl">
        <div className="mb-8">
          <Link href="/" className="text-[#00B4D8] font-semibold hover:underline">
            &larr; Voltar para a página inicial
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-[#004A7F] mb-6">Política de Privacidade</h1>
        <p className="text-sm text-slate-500 mb-10">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introdução</h2>
            <p>O <strong>Atendimento IA</strong> valoriza a privacidade dos seus clientes (clínicas, consultórios e profissionais de saúde). Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos as informações da sua clínica e dos seus pacientes.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Acesso à Integração do Google Agenda (Google APIs)</h2>
            <p className="mb-4">O nosso sistema requer acesso à sua conta do Google Agenda (Google Calendar) para que a Inteligência Artificial possa ler horários livres e marcar consultas de forma automatizada e segura.</p>
            <div className="bg-slate-100 p-4 border-l-4 border-[#00B4D8] rounded">
              <h3 className="font-semibold text-slate-800 mb-2">Conformidade com as Políticas do Google (Uso Limitado)</h3>
              <p className="text-sm">O uso e a transferência das informações recebidas das APIs do Google para qualquer outro aplicativo feitos pelo <strong>Atendimento IA</strong> estão estritamente em conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#00B4D8] hover:underline">Política de Dados de Usuários dos Serviços de API do Google</a>, incluindo os requisitos de <em>Uso Limitado (Limited Use)</em>. Nós não usamos dados das APIs do Google para desenvolver, melhorar ou treinar modelos generalizados de inteligência artificial.</p>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Compartilhamento e Segurança de Dados</h2>
            <p>Garantimos que as informações da agenda da sua clínica jamais serão vendidas ou compartilhadas com terceiros. Seus dados e tokens do Google são criptografados em nossos bancos de dados com tecnologia de ponta. A qualquer momento, você pode revogar nosso acesso pelo painel de segurança da sua conta Google.</p>
          </section>
        </div>
      </div>
    </div>
  );
}