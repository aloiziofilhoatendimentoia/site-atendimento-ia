import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Variáveis de ambiente para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Inicialização do cliente Supabase se as credenciais estiverem disponíveis
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ---------------------------------------------------------------
// Cria e atualiza a tabela dedicada MAIÚSCULA de configuração
// da empresa, inserindo todas as informações do formulário.
// ---------------------------------------------------------------
export async function syncDynamicConfigTable(nomeEmpresa: string, fullData: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    // 1. Monta o objeto com as colunas exatas da tabela recém-criada
    const insertData = {
      nome_empresa: fullData.empresa?.nome_empresa || null,
      cnpj: fullData.empresa?.cnpj || null,
      nome_empresario: fullData.empresa?.nome_empresario || null,
      cpf: fullData.empresa?.cpf || null,
      nicho: fullData.empresa?.nicho || null,
      dias_funcionamento: fullData.suporte?.dias_funcionamento || null,
      horario_funcionamento: fullData.suporte?.horario_funcionamento || null,
      endereco: fullData.suporte?.endereco || null,
      whatsapp_empresa: fullData.suporte?.whatsapp_empresa || null,
      telefone_suporte: fullData.suporte?.telefone_suporte || null,
      link_pagamento: fullData.venda?.link_pagamento || null,
      chave_pix: fullData.venda?.chave_pix || null,
      usa_google_calendar: fullData.agendamento?.usa_google_calendar || false,
      usa_whatsapp: fullData.agendamento?.usa_whatsapp || false,
      whatsapp_agendamento: fullData.agendamento?.whatsapp_agendamento || null,
      servicos_json: fullData.servicos || []
    };

    // 2. Chama a função RPC enviando o nome da tabela E os dados em JSON de uma vez só!
    // (Isso resolve 100% o problema do cache do Supabase atrasar a criação)
    const { data: tableName, error: rpcError } = await supabase.rpc('criar_tabela_empresa_config', {
      p_nome_empresa: nomeEmpresa,
      p_dados: insertData
    });
    
    if (rpcError || !tableName) {
      console.error('[syncDynamic] Erro RPC criar_tabela_empresa_config:', rpcError?.message);
      return false;
    }

    console.log(`[syncDynamic] ✅ Tabela ${tableName} criada e preenchida com sucesso via SQL Nativo!`);
    return true;
  } catch (e: any) {
    console.error('[syncDynamic] Exceção:', e.message);
    return false;
  }
}

// Caminho do arquivo JSON para persistência local de fallback
const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');

// Interface para a estrutura do banco de dados local
interface LocalDatabase {
  users: any[];
  empresas: any[];
  suporte: any[];
  agendamentos: any[];
  google_integrations: any[];
  vendas: any[];
  servicos: any[];
}

// Inicializa o banco de dados local com estrutura de tabelas vazias se o arquivo não existir
function initLocalDb(): LocalDatabase {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const defaultDb: LocalDatabase = {
      users: [],
      empresas: [],
      suporte: [],
      agendamentos: [],
      google_integrations: [],
      vendas: [],
      servicos: [],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Garantir retrocompatibilidade e existencia das chaves para evitar TypeErrors
    if (!parsed.users) parsed.users = [];
    if (!parsed.empresas) parsed.empresas = [];
    if (!parsed.suporte) parsed.suporte = [];
    if (!parsed.agendamentos) parsed.agendamentos = [];
    if (!parsed.google_integrations) parsed.google_integrations = [];
    if (!parsed.vendas) parsed.vendas = [];
    if (!parsed.servicos) parsed.servicos = [];
    
    return parsed;
  } catch (error) {
    console.error('Erro ao ler local_db.json, reiniciando banco local:', error);
    const defaultDb: LocalDatabase = {
      users: [],
      empresas: [],
      suporte: [],
      agendamentos: [],
      google_integrations: [],
      vendas: [],
      servicos: [],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
}

// Salva os dados de volta no arquivo JSON
function saveLocalDb(db: LocalDatabase) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao gravar em local_db.json:', error);
  }
}

// Helper para gerar UUID simples caso estejamos no modo offline
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- MÉTODOS DE BANCO DE DADOS HÍBRIDOS ---

// 1. Usuários
export async function getUserByEmail(email: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha na consulta ao Supabase, tentando local:', e);
    }
  }

  // Fallback Local
  const db = initLocalDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(email: string, senhaHash: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, senha_hash: senhaHash }])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha ao inserir no Supabase, tentando local:', e);
    }
  }

  // Fallback Local
  const db = initLocalDb();
  // Verificar duplicidade local
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('E-mail já cadastrado.');
  }

  const newUser = {
    id: generateUUID(),
    email,
    senha_hash: senhaHash,
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveLocalDb(db);
  return newUser;
}

// 2. Empresas
export async function getEmpresaByUserId(userId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha na consulta ao Supabase, tentando local:', e);
    }
  }

  // Fallback Local
  const db = initLocalDb();
  return db.empresas.find((e) => e.user_id === userId) || null;
}

export async function saveEmpresa(userId: string, data: { nome_empresa: string; cnpj: string; nome_empresario: string; cpf: string; nicho: string }) {
  if (supabase) {
    try {
      // Verifica se já existe
      const existing = await getEmpresaByUserId(userId);
      if (existing) {
        const { data: updated, error } = await supabase
          .from('empresas')
          .update(data)
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && updated) {
          return updated;
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('empresas')
          .insert([{ user_id: userId, ...data }])
          .select()
          .single();
        if (!error && inserted) {
          return inserted;
        }
      }
    } catch (e: any) {
      console.error('ERRO FATAL DO SUPABASE:', e.message, e);
    }
  }

  // Fallback Local
  const db = initLocalDb();
  let empresa = db.empresas.find((e) => e.user_id === userId);

  if (empresa) {
    Object.assign(empresa, data);
  } else {
    empresa = {
      id: generateUUID(),
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.empresas.push(empresa);
  }
  saveLocalDb(db);
  return empresa;
}

// 3. Suporte
export async function getSuporteByEmpresaId(empresaId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('suporte')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha no Supabase, usando local:', e);
    }
  }

  const db = initLocalDb();
  return db.suporte.find((s) => s.empresa_id === empresaId) || null;
}

export async function saveSuporte(empresaId: string, data: { dias_funcionamento: string; horario_funcionamento: string; endereco: string; whatsapp_empresa: string; telefone_suporte: string }) {
  if (supabase) {
    try {
      const existing = await getSuporteByEmpresaId(empresaId);
      if (existing) {
        const { data: updated, error } = await supabase
          .from('suporte')
          .update(data)
          .eq('empresa_id', empresaId)
          .select()
          .single();
        if (!error && updated) return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('suporte')
          .insert([{ empresa_id: empresaId, ...data }])
          .select()
          .single();
        if (!error && inserted) return inserted;
      }
    } catch (e) {
      console.warn('Falha ao salvar suporte no Supabase, tentando local:', e);
    }
  }

  const db = initLocalDb();
  let suporte = db.suporte.find((s) => s.empresa_id === empresaId);
  if (suporte) {
    Object.assign(suporte, data);
  } else {
    suporte = {
      id: generateUUID(),
      empresa_id: empresaId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.suporte.push(suporte);
  }
  saveLocalDb(db);
  return suporte;
}

// 4. Agendamentos
export async function getAgendamentosByEmpresaId(empresaId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha no Supabase, usando local:', e);
    }
  }

  const db = initLocalDb();
  return db.agendamentos.find((a) => a.empresa_id === empresaId) || null;
}

export async function saveAgendamentos(empresaId: string, data: { usa_google_calendar: boolean; usa_whatsapp: boolean; whatsapp_agendamento?: string }) {
  if (supabase) {
    try {
      const existing = await getAgendamentosByEmpresaId(empresaId);
      if (existing) {
        const { data: updated, error } = await supabase
          .from('agendamentos')
          .update(data)
          .eq('empresa_id', empresaId)
          .select()
          .single();
        if (!error && updated) return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('agendamentos')
          .insert([{ empresa_id: empresaId, ...data }])
          .select()
          .single();
        if (!error && inserted) return inserted;
      }
    } catch (e) {
      console.warn('Falha ao salvar agendamentos no Supabase, tentando local:', e);
    }
  }

  const db = initLocalDb();
  let agendamento = db.agendamentos.find((a) => a.empresa_id === empresaId);
  if (agendamento) {
    Object.assign(agendamento, data);
  } else {
    agendamento = {
      id: generateUUID(),
      empresa_id: empresaId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.agendamentos.push(agendamento);
  }
  saveLocalDb(db);
  return agendamento;
}

// 5. Integrações Google Agenda
export async function getGoogleIntegrationByEmpresaId(empresaId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('google_integrations')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha no Supabase, usando local:', e);
    }
  }

  const db = initLocalDb();
  return db.google_integrations.find((g) => g.empresa_id === empresaId) || null;
}

export async function saveGoogleIntegration(empresaId: string, data: { google_email: string; access_token: string; refresh_token: string; expiry_date: number; scopes: string }) {
  if (supabase) {
    try {
      const existing = await getGoogleIntegrationByEmpresaId(empresaId);
      if (existing) {
        const { data: updated, error } = await supabase
          .from('google_integrations')
          .update(data)
          .eq('empresa_id', empresaId)
          .select()
          .single();
        if (!error && updated) return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('google_integrations')
          .insert([{ empresa_id: empresaId, ...data }])
          .select()
          .single();
        if (!error && inserted) return inserted;
      }
    } catch (e) {
      console.warn('Falha ao salvar integração Google no Supabase, tentando local:', e);
    }
  }

  const db = initLocalDb();
  let integration = db.google_integrations.find((g) => g.empresa_id === empresaId);
  if (integration) {
    Object.assign(integration, data);
  } else {
    integration = {
      id: generateUUID(),
      empresa_id: empresaId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.google_integrations.push(integration);
  }
  saveLocalDb(db);
  return integration;
}

// 6. Vendas
export async function getVendasByEmpresaId(empresaId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falha no Supabase, usando local:', e);
    }
  }

  const db = initLocalDb();
  return db.vendas.find((v) => v.empresa_id === empresaId) || null;
}

export async function saveVendas(empresaId: string, data: { link_pagamento?: string; chave_pix?: string }) {
  if (supabase) {
    try {
      const existing = await getVendasByEmpresaId(empresaId);
      if (existing) {
        const { data: updated, error } = await supabase
          .from('vendas')
          .update(data)
          .eq('empresa_id', empresaId)
          .select()
          .single();
        if (!error && updated) return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('vendas')
          .insert([{ empresa_id: empresaId, ...data }])
          .select()
          .single();
        if (!error && inserted) return inserted;
      }
    } catch (e) {
      console.warn('Falha ao salvar vendas no Supabase, tentando local:', e);
    }
  }

  const db = initLocalDb();
  let venda = db.vendas.find((v) => v.empresa_id === empresaId);
  if (venda) {
    Object.assign(venda, data);
  } else {
    venda = {
      id: generateUUID(),
      empresa_id: empresaId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.vendas.push(venda);
  }
  saveLocalDb(db);
  return venda;
}

// 7. Serviços
export async function getServicosByEmpresaId(empresaId: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      if (data) return data;
    } catch (e) {
      console.warn('Falha no Supabase, usando local:', e);
    }
  }

  const db = initLocalDb();
  return db.servicos.filter((s) => s.empresa_id === empresaId);
}

export async function saveServicos(empresaId: string, servicosList: Array<{ servico: string; valor: number }>) {
  if (supabase) {
    try {
      // Deleta antigos
      const { error: delError } = await supabase.from('servicos').delete().eq('empresa_id', empresaId);
      if (delError) throw delError;
      
      // Insere novos
      if (servicosList.length > 0) {
        const inserts = servicosList.map((s) => ({ empresa_id: empresaId, servico: s.servico, valor: s.valor }));
        const { data, error } = await supabase.from('servicos').insert(inserts).select();
        if (error) throw error;
        if (data) return data;
      }
      return [];
    } catch (e) {
      console.warn('Falha ao salvar serviços no Supabase, tentando local:', e);
    }
  }

  const db = initLocalDb();
  // Deletar antigos locais
  db.servicos = db.servicos.filter((s) => s.empresa_id !== empresaId);
  
  // Inserir novos locais
  const insertedList = servicosList.map((s) => ({
    id: generateUUID(),
    empresa_id: empresaId,
    servico: s.servico,
    valor: s.valor,
    created_at: new Date().toISOString(),
  }));
  db.servicos.push(...insertedList);
  saveLocalDb(db);
  return insertedList;
}

// 8. Obter todos os dados do painel do usuário
export async function getDashboardData(userId: string) {
  const empresa = await getEmpresaByUserId(userId);
  if (!empresa) return null;

  const empresaId = empresa.id;
  const [suporte, agendamento, googleIntegration, venda, servicos] = await Promise.all([
    getSuporteByEmpresaId(empresaId),
    getAgendamentosByEmpresaId(empresaId),
    getGoogleIntegrationByEmpresaId(empresaId),
    getVendasByEmpresaId(empresaId),
    getServicosByEmpresaId(empresaId),
  ]);

  return {
    empresa,
    suporte,
    agendamento,
    googleIntegration,
    venda,
    servicos,
  };
}
