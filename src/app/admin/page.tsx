'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  PhoneOff,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import Logo from '@/components/Logo';

interface Clinica {
  id: string;
  nome_empresa: string;
  nome_empresario: string;
  email: string;
  telefone: string;
  especialistas: string;
  status: 'verificando' | 'online' | 'offline';
  created_at: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    try {
      // Verificar sessão admin
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok || !sessionData.authenticated || !sessionData.isAdmin) {
        window.location.replace('/');
        return;
      }

      await loadClinicas();
    } catch (e) {
      console.error(e);
      window.location.replace('/');
    }
  }

  async function handleToggleStatus(clinica: any) {
    if (!confirm(`Tem certeza que deseja ${clinica.is_active ? 'SUSPENDER' : 'ATIVAR'} a clnica ${clinica.nome_empresa}?`)) return;
    try {
      setLoading(true);
      const instanceName = clinica.telefone ? clinica.telefone.replace(/\D/g, '') : null;
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicaId: clinica.id,
          is_active: !clinica.is_active,
          instanceName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status');
      
      // Update local state
      setClinicas(prev => prev.map(c => c.id === clinica.id ? { ...c, is_active: !clinica.is_active } : c));
      alert(data.message);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadClinicas() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/clinicas');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar');
      }

      setClinicas(data.clinicas);
      
      // Assincronamente checar status de WhatsApp de cada uma
      checkAllWhatsappStatuses(data.clinicas);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkAllWhatsappStatuses(lista: Clinica[]) {
    // Inicializar stats
    let total = lista.length;
    let on = 0;
    let off = 0;
    setStats({ total, online: on, offline: off });

    const newList = [...lista];

    // Fazer requisições em paralelo para checar status
    for (let i = 0; i < newList.length; i++) {
      const c = newList[i];
      if (!c.telefone) {
        c.status = 'offline';
        off++;
        updateStats(total, on, off, newList);
        continue;
      }

      const instanceName = c.telefone.replace(/\D/g, '');
      try {
        const res = await fetch(`/api/empresa/status-conexao?instance=${instanceName}`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.state === 'open') {
            c.status = 'online';
            on++;
          } else {
            c.status = 'offline';
            off++;
          }
        } else {
          c.status = 'offline';
          off++;
        }
      } catch (e) {
        c.status = 'offline';
        off++;
      }
      
      // Update reativo a cada clinica testada
      updateStats(total, on, off, newList);
    }
  }

  function updateStats(t: number, on: number, off: number, list: Clinica[]) {
    setStats({ total: t, online: on, offline: off });
    setClinicas([...list]);
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.replace('/');
    } catch (e) {
      window.location.replace('/');
    }
  };

  const filteredClinicas = clinicas.filter(c => 
    c.nome_empresa.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && clinicas.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center flex-col space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Validando Credenciais Master...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex flex-col font-sans">
      
      {/* HEADER MASTER */}
      <header className="h-20 border-b border-[#27272a] bg-[#0c0d0f] flex items-center justify-between px-8 z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <Logo size="sm" />
          <div className="h-8 w-[1px] bg-[#27272a] mx-2" />
          <div className="flex items-center space-x-2 bg-purple-950/30 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-900/50">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Modo Administrador</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-red-400 transition-colors bg-[#18181b] hover:bg-red-950/20 px-4 py-2 rounded-xl border border-[#27272a] hover:border-red-900/50"
        >
          <span>Sair do Sistema</span>
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* CARDS HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121417] border border-[#27272a] p-6 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total de Clínicas</span>
              <span className="text-3xl font-extrabold text-white">{stats.total}</span>
            </div>
            <div className="w-12 h-12 bg-blue-950/40 text-blue-400 rounded-full flex items-center justify-center border border-blue-900/30">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#121417] border border-green-900/30 p-6 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-green-500/70 uppercase tracking-widest block mb-1">Online (WhatsApp OK)</span>
              <span className="text-3xl font-extrabold text-green-400">{stats.online}</span>
            </div>
            <div className="w-12 h-12 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-green-900/30">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#121417] border border-red-900/30 p-6 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest block mb-1">Offline (Desconectadas)</span>
              <span className="text-3xl font-extrabold text-red-400">{stats.offline}</span>
            </div>
            <div className="w-12 h-12 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center border border-red-900/30">
              <PhoneOff className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* TABELA DE CLÍNICAS */}
        <div className="bg-[#121417] border border-[#27272a] rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-white">Gestão de Clínicas</h2>
              <button
                onClick={() => loadClinicas()}
                disabled={loading}
                className="flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Atualizar lista e testar conexões"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
            
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0c0d0f] border border-[#27272a] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c0d0f] border-b border-[#27272a]">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-64">Clínica</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Especialistas</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-48">WhatsApp da IA</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/50">
                {filteredClinicas.map((clinica) => (
                  <tr key={clinica.id} className="hover:bg-[#18181b] transition-colors">
                    <td className="py-4 px-6">
                      {clinica.status === 'verificando' && (
                        <div className="flex items-center space-x-2 text-gray-400" title="Verificando...">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                      {clinica.status === 'online' && (
                        <div className="flex items-center space-x-2 text-green-400 bg-green-950/30 px-3 py-1 rounded-full w-max border border-green-900/50">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Online</span>
                        </div>
                      )}
                      {clinica.status === 'offline' && (
                        <div className="flex items-center space-x-2 text-red-400 bg-red-950/30 px-3 py-1 rounded-full w-max border border-red-900/50">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Offline</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white block">{clinica.nome_empresa} {clinica.is_active === false && <span className="text-red-500 text-[10px] uppercase ml-2 bg-red-950/50 px-2 py-0.5 rounded border border-red-900">(Suspensa)</span>}</span>
                      <span className="text-xs text-gray-500">{clinica.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-2xl">
                        {clinica.especialistas && clinica.especialistas !== 'Não informado' ? (
                          clinica.especialistas.split(', ').map((esp, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-950/40 text-blue-300 border border-blue-900/40"
                            >
                              {esp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">Não informado</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-purple-300">
                      {clinica.telefone || 'Não Configurado'}
                    </td>
                  </tr>
                ))}

                {filteredClinicas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      Nenhuma clínica encontrada.
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
