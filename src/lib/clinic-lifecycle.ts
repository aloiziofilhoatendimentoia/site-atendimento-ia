import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getUserByEmail, createUser } from '@/lib/db';

const TABLE_CLINICAS = 'CLIENTES ATENDIMENTO IA SITE';

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) return null;
  return new Stripe(key);
}

export function parseClinicJson(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? { ...raw } : {};
}

export interface FindClinicCriteria {
  clinicaId?: string | number;
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Localiza uma clínica na tabela CLIENTES ATENDIMENTO IA SITE (inclusive se estiver marcada como is_deleted: true,
 * para suportar Ressurreição Automática de Conta quando o cliente voltar a pagar).
 */
export async function findClinicRow(
  supabaseAdmin: SupabaseClient,
  criteria: FindClinicCriteria
): Promise<{ row: any; json: Record<string, any> } | null> {
  if (criteria.clinicaId !== undefined && criteria.clinicaId !== null && criteria.clinicaId !== '') {
    const { data } = await supabaseAdmin
      .from(TABLE_CLINICAS)
      .select('*')
      .eq('id', criteria.clinicaId)
      .maybeSingle();
    if (data) return { row: data, json: parseClinicJson(data.dados_completos_json) };
  }

  const { data: allRows, error } = await supabaseAdmin
    .from(TABLE_CLINICAS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(allRows)) return null;

  const targetEmail = criteria.email ? criteria.email.trim().toLowerCase() : '';
  const targetSub = criteria.stripeSubscriptionId ? String(criteria.stripeSubscriptionId).trim() : '';
  const targetCus = criteria.stripeCustomerId ? String(criteria.stripeCustomerId).trim() : '';

  // 1. Prioridade máxima: match exato por stripe_subscription_id
  if (targetSub) {
    for (const row of allRows) {
      const json = parseClinicJson(row.dados_completos_json);
      if (json.stripe_subscription_id && String(json.stripe_subscription_id) === targetSub) {
        return { row, json };
      }
    }
  }

  // 2. Match por stripe_customer_id
  if (targetCus) {
    for (const row of allRows) {
      const json = parseClinicJson(row.dados_completos_json);
      if (json.stripe_customer_id && String(json.stripe_customer_id) === targetCus) {
        return { row, json };
      }
    }
  }

  // 3. Match por e-mail (coluna email ou ownerEmail / stripe_email no JSON)
  if (targetEmail) {
    for (const row of allRows) {
      const json = parseClinicJson(row.dados_completos_json);
      const candidates = [row.email, json.ownerEmail, json.stripe_email, json.clinica?.emailAdmin]
        .filter(Boolean)
        .map((e: any) => String(e).trim().toLowerCase());
      if (candidates.includes(targetEmail)) {
        return { row, json };
      }
    }
  }

  return null;
}

/**
 * Desconecta (e opcionalmente deleta) todas as instâncias da Evolution API vinculadas a uma clínica.
 */
export async function disconnectEvolutionInstances(
  clinica: any,
  parsedJson: Record<string, any>,
  extraInstanceName?: string | null,
  deleteInstance = false
): Promise<{ success: boolean; affected: string[] }> {
  const evoUrl = process.env.EVOLUTION_API_URL || 'https://api-whatsapp.atendimentoiaclinicas.tech';
  const evoKey = process.env.EVOLUTION_API_KEY || 'atendimentoia_mestre_evolution_2026';

  const candidates = new Set<string>();
  const addCandidate = (val: any) => {
    if (!val) return;
    const digits = String(val).replace(/\D/g, '');
    if (digits) candidates.add(digits);
    const raw = String(val).trim();
    if (raw && !raw.includes(' ')) candidates.add(raw);
  };

  addCandidate(extraInstanceName);
  addCandidate(clinica?.telefone_principal);
  addCandidate(parsedJson?.clinica?.whatsappClinica);
  addCandidate(parsedJson?.suporte?.whatsapp_empresa);

  if (candidates.size === 0) {
    return { success: true, affected: [] };
  }

  const matchedNames = new Set<string>();

  try {
    const fetchRes = await fetch(`${evoUrl}/instance/fetchInstances`, {
      headers: { apikey: evoKey },
      cache: 'no-store'
    });
    if (fetchRes.ok) {
      const allInst: any[] = await fetchRes.json();
      if (Array.isArray(allInst)) {
        for (const inst of allInst) {
          if (!inst?.name) continue;
          const instClean = String(inst.name || '').replace(/\D/g, '');
          const ownerClean = String(inst.ownerJid || '').replace(/\D/g, '');
          for (const c of candidates) {
            const cDigits = c.replace(/\D/g, '');
            if (
              inst.name === c ||
              (cDigits &&
                (instClean === cDigits ||
                  ownerClean === cDigits ||
                  (instClean && (instClean.endsWith(cDigits) || cDigits.endsWith(instClean))) ||
                  (ownerClean && (ownerClean.endsWith(cDigits) || cDigits.endsWith(ownerClean)))))
            ) {
              matchedNames.add(inst.name);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[clinic-lifecycle] Erro ao listar instâncias Evolution API:', e);
  }

  // Fallback para os nomes diretos caso fetchInstances não liste
  if (matchedNames.size === 0) {
    for (const c of candidates) {
      if (c.length >= 10) matchedNames.add(c);
    }
  }

  let success = true;
  const affected: string[] = [];

  for (const instName of matchedNames) {
    // Segurança: jamais derrubar o robô comercial principal da Atendimento IA por acidente
    if (instName === '81995462240' || instName === '5581995462240') continue;
    try {
      await fetch(`${evoUrl}/instance/logout/${instName}`, {
        method: 'DELETE',
        headers: { apikey: evoKey }
      });
      if (deleteInstance) {
        await fetch(`${evoUrl}/instance/delete/${instName}`, {
          method: 'DELETE',
          headers: { apikey: evoKey }
        });
      }
      affected.push(instName);
      console.log(`[clinic-lifecycle] Evolution ${deleteInstance ? 'logout+delete' : 'logout'} executado em: ${instName}`);
    } catch (evoErr) {
      console.error(`[clinic-lifecycle] Erro Evolution API na instância ${instName}:`, evoErr);
      success = false;
    }
  }

  return { success, affected };
}

/**
 * Garante que o e-mail possui usuário cadastrado para conseguir fazer login OTP no /dashboard.
 */
async function ensureOtpUserExists(email: string) {
  try {
    const existing = await getUserByEmail(email);
    if (!existing) {
      await createUser(email, 'no_password_otp_only');
      console.log(`[clinic-lifecycle] Usuário OTP criado automaticamente para: ${email}`);
    }
  } catch (err) {
    console.warn(`[clinic-lifecycle] Aviso ao garantir usuário OTP para ${email}:`, err);
  }
}

export interface ActivateClinicParams {
  email: string;
  customerName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod: 'card' | 'pix';
  sessionId?: string;
  termsAcceptedAt?: string;
}

/**
 * Cenário 1 & 4: Compra Aprovada (Cartão ou PIX) e "Ressurreição de Conta" (mesmo se estava excluída/suspensa).
 * Retorna se o e-mail de boas-vindas com Termos de Uso deve ser enviado (idempotente por sessionId).
 */
export async function activateOrResurrectClinic(params: ActivateClinicParams): Promise<{
  ok: boolean;
  clinicId?: any;
  action: 'created' | 'resurrected' | 'activated' | 'error';
  shouldSendWelcomeEmail: boolean;
}> {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, action: 'error', shouldSendWelcomeEmail: false };
  }

  await ensureOtpUserExists(normalizedEmail);

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('[clinic-lifecycle] Supabase admin não configurado.');
    return { ok: false, action: 'error', shouldSendWelcomeEmail: true };
  }

  const found = await findClinicRow(supabaseAdmin, {
    email: normalizedEmail,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId
  });

  const nowIso = new Date().toISOString();

  if (found) {
    const { row, json } = found;
    const wasDeleted = json.is_deleted === true;
    const sentSessions: string[] = Array.isArray(json.welcome_email_sessions) ? json.welcome_email_sessions : [];
    const alreadySentForSession = Boolean(params.sessionId && sentSessions.includes(params.sessionId));

    json.is_active = true;
    json.is_deleted = false;
    json.ownerEmail = json.ownerEmail || normalizedEmail;
    json.stripe_email = normalizedEmail;
    if (params.stripeCustomerId) json.stripe_customer_id = params.stripeCustomerId;
    if (params.stripeSubscriptionId) json.stripe_subscription_id = params.stripeSubscriptionId;
    json.stripe_status = 'active';
    json.stripe_payment_method = params.paymentMethod;
    if (params.sessionId) json.stripe_last_session_id = params.sessionId;
    json.terms_accepted_at = params.termsAcceptedAt || nowIso;
    json.stripe_updated_at = nowIso;
    delete json.suspended_reason;
    delete json.suspended_at;
    delete json.manual_override_suspended;

    const { error } = await supabaseAdmin
      .from(TABLE_CLINICAS)
      .update({
        email: row.email || normalizedEmail,
        dados_completos_json: JSON.stringify(json)
      })
      .eq('id', row.id);

    if (error) {
      console.error('[clinic-lifecycle] Erro ao atualizar/ressuscitar clínica no Supabase:', error);
      return { ok: false, action: 'error', shouldSendWelcomeEmail: !alreadySentForSession };
    }

    console.log(
      `[clinic-lifecycle] Clínica ${row.id} (${normalizedEmail}) ${wasDeleted ? 'RESSUSCITADA' : 'ATIVADA'} via Stripe (${params.paymentMethod}).`
    );
    return {
      ok: true,
      clinicId: row.id,
      action: wasDeleted ? 'resurrected' : 'activated',
      shouldSendWelcomeEmail: !alreadySentForSession
    };
  }

  // Novo cliente: criar linha base na tabela CLIENTES ATENDIMENTO IA SITE
  const initialJson: Record<string, any> = {
    ownerEmail: normalizedEmail,
    stripe_email: normalizedEmail,
    is_active: true,
    is_deleted: false,
    stripe_customer_id: params.stripeCustomerId || null,
    stripe_subscription_id: params.stripeSubscriptionId || null,
    stripe_status: 'active',
    stripe_payment_method: params.paymentMethod,
    stripe_last_session_id: params.sessionId || null,
    terms_accepted_at: params.termsAcceptedAt || nowIso,
    stripe_updated_at: nowIso,
    welcome_email_sessions: [],
    clinica: {
      nomeClinica: params.customerName ? `Clínica ${params.customerName}` : 'Nova Clínica (Em Configuração)',
      nomeEmpresario: params.customerName || ''
    }
  };

  const payloadDB: Record<string, any> = {
    nome_clinica: params.customerName ? `Clínica ${params.customerName}` : 'Nova Clínica (Em Configuração)',
    telefone_principal: '',
    endereco: '',
    especialistas: '',
    canais_escolhidos: 'A configurar',
    email: normalizedEmail,
    dados_completos_json: JSON.stringify(initialJson)
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from(TABLE_CLINICAS)
    .insert([payloadDB])
    .select('id')
    .single();

  if (insertError) {
    console.error('[clinic-lifecycle] Erro ao criar clínica base no Supabase:', insertError);
    return { ok: false, action: 'error', shouldSendWelcomeEmail: true };
  }

  console.log(`[clinic-lifecycle] Nova clínica criada no Supabase (id=${inserted?.id}) para ${normalizedEmail}.`);
  return {
    ok: true,
    clinicId: inserted?.id,
    action: 'created',
    shouldSendWelcomeEmail: true
  };
}

/**
 * Registra que o e-mail de boas-vindas com Termos de Uso já foi enviado para determinada sessão (evita duplicatas).
 */
export async function markWelcomeEmailSent(email: string, sessionId?: string) {
  if (!sessionId) return;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  const found = await findClinicRow(supabaseAdmin, { email });
  if (!found) return;

  const { row, json } = found;
  const sentSessions: string[] = Array.isArray(json.welcome_email_sessions) ? json.welcome_email_sessions : [];
  if (!sentSessions.includes(sessionId)) {
    sentSessions.push(sessionId);
    json.welcome_email_sessions = sentSessions.slice(-10);
    json.welcome_email_last_sent_at = new Date().toISOString();
    await supabaseAdmin
      .from(TABLE_CLINICAS)
      .update({ dados_completos_json: JSON.stringify(json) })
      .eq('id', row.id);
  }
}

/**
 * Cenário 2: Inadimplência ou Cancelamento na Stripe -> Suspende no Supabase e desconecta WhatsApp na Evolution API.
 */
export async function suspendClinicFromStripe(params: {
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeStatus: 'past_due' | 'canceled' | 'unpaid';
  reason: string;
}): Promise<{ ok: boolean; found: boolean; affectedInstances: string[] }> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return { ok: false, found: false, affectedInstances: [] };

  const found = await findClinicRow(supabaseAdmin, {
    email: params.email,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId
  });

  if (!found) {
    console.warn('[clinic-lifecycle] Clínica não encontrada para suspensão Stripe:', params);
    return { ok: true, found: false, affectedInstances: [] };
  }

  const { row, json } = found;
  json.is_active = false;
  json.stripe_status = params.stripeStatus;
  json.suspended_reason = params.reason;
  json.suspended_at = new Date().toISOString();
  json.stripe_updated_at = new Date().toISOString();
  if (params.stripeCustomerId) json.stripe_customer_id = params.stripeCustomerId;
  if (params.stripeSubscriptionId) json.stripe_subscription_id = params.stripeSubscriptionId;

  const { error } = await supabaseAdmin
    .from(TABLE_CLINICAS)
    .update({ dados_completos_json: JSON.stringify(json) })
    .eq('id', row.id);

  if (error) {
    console.error('[clinic-lifecycle] Erro ao suspender clínica no Supabase:', error);
    return { ok: false, found: true, affectedInstances: [] };
  }

  const evo = await disconnectEvolutionInstances(row, json, undefined, false);
  console.log(
    `[clinic-lifecycle] Clínica ${row.id} (${row.email}) SUSPENSA automaticamente (${params.reason}). WhatsApp desconectado: [${evo.affected.join(', ')}]`
  );

  return { ok: true, found: true, affectedInstances: evo.affected };
}

/**
 * Cenário 3: Recuperação Automática (invoice.payment_succeeded) -> Reativa no Supabase.
 * Respeita caso o administrador tenha excluído manualmente a clínica (is_deleted: true) ou aplicado suspensão manual.
 */
export async function recoverClinicFromStripe(params: {
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<{ ok: boolean; found: boolean; reactivated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return { ok: false, found: false, reactivated: false };

  const found = await findClinicRow(supabaseAdmin, {
    email: params.email,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId
  });

  if (!found) {
    return { ok: true, found: false, reactivated: false };
  }

  const { row, json } = found;

  // Se o admin excluiu manualmente a clínica ou suspendeu por decisão administrativa, não reativar em renovação automática
  if (json.is_deleted === true || json.manual_override_suspended === true) {
    console.log(`[clinic-lifecycle] Clínica ${row.id} possui trava manual/exclusão; ignorando reativação automática de invoice.`);
    return { ok: true, found: true, reactivated: false };
  }

  json.is_active = true;
  json.stripe_status = 'active';
  json.stripe_updated_at = new Date().toISOString();
  if (params.stripeCustomerId) json.stripe_customer_id = params.stripeCustomerId;
  if (params.stripeSubscriptionId) json.stripe_subscription_id = params.stripeSubscriptionId;
  delete json.suspended_reason;
  delete json.suspended_at;

  const { error } = await supabaseAdmin
    .from(TABLE_CLINICAS)
    .update({ dados_completos_json: JSON.stringify(json) })
    .eq('id', row.id);

  if (error) {
    console.error('[clinic-lifecycle] Erro ao reativar clínica no Supabase:', error);
    return { ok: false, found: true, reactivated: false };
  }

  console.log(`[clinic-lifecycle] Clínica ${row.id} (${row.email}) REATIVADA automaticamente via invoice.payment_succeeded.`);
  return { ok: true, found: true, reactivated: true };
}

/**
 * Cancela uma assinatura ativa na Stripe (usado opcionalmente quando o Admin exclui/encerra uma clínica manualmente).
 */
export async function cancelStripeSubscriptionSafe(stripeSubscriptionId?: string | null): Promise<boolean> {
  if (!stripeSubscriptionId) return false;
  const stripe = getStripeClient();
  if (!stripe) return false;

  try {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
    console.log(`[clinic-lifecycle] Assinatura Stripe ${stripeSubscriptionId} cancelada com sucesso.`);
    return true;
  } catch (err: any) {
    console.warn(`[clinic-lifecycle] Aviso ao cancelar assinatura Stripe ${stripeSubscriptionId}:`, err?.message || err);
    return false;
  }
}
