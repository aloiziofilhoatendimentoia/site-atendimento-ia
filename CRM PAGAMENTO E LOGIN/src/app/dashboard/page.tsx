"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, Activity, MessageSquare, LogOut, Settings, Lock } from "lucide-react";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha simples definida no front-end provisoriamente para isolar o CRM.
    // Para segurança real em produção, usaremos cookies e rotas de api ou next-auth.
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
      
      setLoading(true);
      fetch('/api/clinics')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClinics(data.data);
          } else {
            setDbError("Nenhuma clínica pôde ser carregada ou erro no banco.");
          }
        })
        .catch(() => setDbError("Erro ao comunicar com o servidor (Banco de Dados não configurado)."))
        .finally(() => setLoading(false));

    } else {
      setError("Senha incorreta.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Painel Exclusivo</h1>
          <p className="text-slate-500 mb-8">Acesso restrito à equipe Atendimento IA.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Digite a senha de administrador" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-primary text-center"
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
              Acessar CRM
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col">
        <div className="mb-10">
          <Image src="/logo.jpg" alt="Atendimento IA Logo" width={140} height={40} className="object-contain" priority />
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium">
            <Activity size={20} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <Users size={20} />
            Minhas Clínicas
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <MessageSquare size={20} />
            Histórico de Chats
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <Settings size={20} />
            Configurações
          </a>
        </nav>

        <button onClick={() => setIsAuthenticated(false)} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium">
          <LogOut size={20} />
          Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Visão Geral Admin</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie todas as clínicas conectadas à Atendimento IA.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">A</div>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total de Clínicas (Real)</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{clinics.length}</h3>
            <p className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 inline-flex px-2 py-1 rounded-md">
              Do seu banco de dados
            </p>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Últimas Implantações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Nome da Clínica</th>
                  <th className="px-8 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Status da IA</th>
                  <th className="px-8 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Data de Entrada</th>
                  <th className="px-8 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-slate-500">
                      Carregando dados reais do sistema...
                    </td>
                  </tr>
                ) : clinics.length > 0 ? (
                  clinics.map((clinic, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-semibold text-slate-900 dark:text-white">{clinic.name}</p>
                        <p className="text-sm text-slate-500 capitalize">{clinic.type.toLowerCase()} | {clinic.phone}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {clinic.status === 'PENDING_PAYMENT' ? 'Pendente' : 'Online'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(clinic.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-8 py-5">
                        <button className="text-primary hover:text-primary/80 font-medium text-sm">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center">
                      <p className="text-slate-500 font-medium mb-1">Nenhuma clínica encontrada no banco de dados.</p>
                      {dbError && <p className="text-sm text-red-400">{dbError}</p>}
                    </td>
                  </tr>
                )}
                
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
