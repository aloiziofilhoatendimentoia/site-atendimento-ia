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
            <p>O <strong>Atendimento IA</strong> valoriza a privacidade dos seus clientes (clínicas, consultórios e profissionais de saúde). Esta Política de Privacidade explica como coletamos, usamos, compartilhamos, protegemos e excluímos as informações da sua clínica e dos seus pacientes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Acesso e Uso de Dados do Google (Google APIs)</h2>
            <p className="mb-4">O nosso sistema solicita acesso ao seu <strong>Google Agenda (Google Calendar)</strong> exclusivamente para permitir que a nossa Inteligência Artificial automatize o processo de marcação de consultas.</p>
            
            <h3 className="font-semibold text-slate-800 mt-4 mb-2">2.1. Quais dados são acessados?</h3>
            <p className="mb-4">O aplicativo acessa estritamente os eventos do seu Google Agenda (horários ocupados, títulos de eventos e detalhes de agendamento).</p>

            <h3 className="font-semibold text-slate-800 mt-4 mb-2">2.2. Como os dados são usados?</h3>
            <p className="mb-4">Nós lemos os eventos para identificar horários livres para novos pacientes e gravamos novos eventos na agenda quando um agendamento é confirmado via WhatsApp. O aplicativo não lê, não acessa e não interage com seus e-mails do Gmail ou arquivos do Google Drive.</p>

            <div className="bg-slate-100 p-4 border-l-4 border-[#00B4D8] rounded mt-6">
              <h3 className="font-semibold text-slate-800 mb-2">Conformidade de Uso Limitado (Limited Use)</h3>
              <p className="text-sm">O uso e a transferência das informações recebidas das APIs do Google para qualquer outro aplicativo feitos pelo <strong>Atendimento IA</strong> estão estritamente em conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#00B4D8] hover:underline">Política de Dados de Usuários dos Serviços de API do Google</a>, incluindo os requisitos de <em>Uso Limitado (Limited Use)</em>. Nós não usamos, sob hipótese alguma, dados recebidos das APIs do Google para desenvolver, melhorar ou treinar modelos generalizados e/ou de aprendizado de máquina (Machine Learning) ou Inteligência Artificial (AI).</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Compartilhamento e Proteção (Segurança)</h2>
            <p>Garantimos que as informações da agenda da sua clínica <strong>jamais serão vendidas, alugadas ou compartilhadas com terceiros</strong> (salvo exigência legal). Seus dados e tokens de acesso (OAuth) do Google são protegidos utilizando criptografia AES-256 no banco de dados e trânsito seguro via protocolo HTTPS (TLS/SSL). O acesso a esses dados é estritamente limitado à arquitetura interna necessária para a execução do serviço de agendamento.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Retenção e Exclusão de Dados</h2>
            <p>Os dados de token do Google Agenda permanecem em nossos servidores apenas enquanto você mantiver uma assinatura ativa conosco. Se você cancelar a sua assinatura ou desconectar o Google Agenda pelo nosso painel, <strong>todos os seus tokens de acesso (OAuth) serão imediata e permanentemente excluídos</strong> de nosso banco de dados. Você também pode revogar nosso acesso a qualquer momento diretamente pelo painel de segurança da sua conta Google.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Contato</h2>
            <p>Para dúvidas ou solicitações de exclusão manual de dados, entre em contato conosco através do suporte da nossa plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}