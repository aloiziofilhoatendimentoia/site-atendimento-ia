"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, Plus, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";

// Ícone do WhatsApp inline como SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0Zm0 29.333a13.258 13.258 0 0 1-6.784-1.863l-.486-.29-5.027 1.188 1.21-4.904-.317-.502A13.25 13.25 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333Zm7.27-9.778c-.398-.2-2.353-1.161-2.718-1.294-.365-.133-.631-.2-.897.2-.266.398-1.03 1.294-1.263 1.56-.232.266-.465.299-.863.1-.398-.2-1.682-.62-3.204-1.978-1.184-1.057-1.984-2.363-2.217-2.762-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.2-.233.266-.398.398-.664.133-.266.067-.498-.033-.698-.1-.2-.897-2.162-1.23-2.96-.323-.776-.65-.67-.897-.682l-.764-.013c-.266 0-.698.1-1.063.498-.365.398-1.396 1.362-1.396 3.323 0 1.96 1.43 3.856 1.628 4.122.2.266 2.815 4.3 6.82 6.027.953.412 1.697.658 2.276.842.956.304 1.827.261 2.516.158.767-.115 2.353-.962 2.685-1.89.332-.927.332-1.722.232-1.89-.1-.166-.366-.266-.764-.465Z"/>
  </svg>
);

// Ícone do Google inline como SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type Doctor = { name: string; specialty: string; registry: string };
type WhatsAppContact = { name: string; specialty: string; phone: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Passo 1: Clínica
  const [clinicName, setClinicName] = useState("");
  const [clinicType, setClinicType] = useState("MEDICA");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");

  // Passo 2: Médicos
  const [doctors, setDoctors] = useState<Doctor[]>([{ name: "", specialty: "", registry: "" }]);

  // Passo 3: Agenda
  const [agendaTypes, setAgendaTypes] = useState<string[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([{ name: "", specialty: "", phone: "" }]);

  // Passo 4: Falar direto com o médico (Opcional)
  const [directContacts, setDirectContacts] = useState<WhatsAppContact[]>([{ name: "", specialty: "", phone: "" }]);

  // Passo 5: Horários e Regras
  const [operatingDays, setOperatingDays] = useState<string[]>(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]);
  const [schedule, setSchedule] = useState({ start: "08:00", end: "18:00", interval: 30, price: 0 });

  const toggleDay = (day: string) => {
    setOperatingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleAgenda = (type: string) => {
    setAgendaTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleNextStep = () => {
    setIsLoading(true);
    setTimeout(() => { setStep(step + 1); setIsLoading(false); }, 600);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clinicName, 
          clinicType, 
          clinicAddress, 
          clinicPhone,
          doctors, 
          agendaTypes, 
          whatsappContacts, 
          directContacts,
          schedule: {
            ...schedule,
            operatingDays
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Redireciona para a nova tela de sucesso do cliente
        router.push('/sucesso');
      } else {
        alert("Erro no onboarding: " + data.error);
        setIsLoading(false);
      }
    } catch {
      alert("Erro ao contatar o servidor.");
      setIsLoading(false);
    }
  };

  // Helpers Médicos
  const addDoctor = () => setDoctors([...doctors, { name: "", specialty: "", registry: "" }]);
  const removeDoctor = (i: number) => setDoctors(doctors.filter((_, idx) => idx !== i));
  const updateDoctor = (i: number, field: string, value: string) => {
    const d = [...doctors]; d[i] = { ...d[i], [field]: value }; setDoctors(d);
  };

  // Helpers WhatsApp Contacts
  const addWhatsApp = () => setWhatsappContacts([...whatsappContacts, { name: "", specialty: "", phone: "" }]);
  const removeWhatsApp = (i: number) => setWhatsappContacts(whatsappContacts.filter((_, idx) => idx !== i));
  const updateWhatsApp = (i: number, field: string, value: string) => {
    const w = [...whatsappContacts]; w[i] = { ...w[i], [field]: value }; setWhatsappContacts(w);
  };

  // Helpers Direct Contacts (Passo 4)
  const addDirectContact = () => setDirectContacts([...directContacts, { name: "", specialty: "", phone: "" }]);
  const removeDirectContact = (i: number) => setDirectContacts(directContacts.filter((_, idx) => idx !== i));
  const updateDirectContact = (i: number, field: string, value: string) => {
    const d = [...directContacts]; d[i] = { ...d[i], [field]: value }; setDirectContacts(d);
  };

  const inputClass = "w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:border-primary text-sm";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
      <header className="w-full py-4 px-8 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Image src="/logo.jpg" alt="Atendimento IA" width={180} height={50} className="object-contain" priority />
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Pagamento Confirmado! 🎉</h1>
          <p className="text-slate-500 dark:text-slate-400">Agora vamos configurar sua inteligência artificial. É rápido e fácil.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
          {/* Progress */}
          <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }}></div>
          <p className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-widest">Passo {step} de 5</p>

          {/* ============ PASSO 1 ============ */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">1</span>
                Dados da Clínica
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Clínica</label>
                  <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Ex: Clínica Sorriso Perfeito" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Clínica</label>
                  <select value={clinicType} onChange={e => setClinicType(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="MEDICA">Médica (Geral, Dermatologia, Psiquiatria, etc)</option>
                    <option value="ODONTOLOGICA">Odontológica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço Físico Completo</label>
                  <input type="text" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp da Clínica</label>
                  <input type="text" value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} placeholder="Ex: (11) 98888-8888" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all" />
                  <p className="text-xs text-slate-400 mt-1">Este é o número principal que a Inteligência Artificial fará os atendimentos.</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={handleNextStep} disabled={isLoading || !clinicName || !clinicAddress || !clinicPhone} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Próximo Passo <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ============ PASSO 2 ============ */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">2</span>
                Profissionais e Especialidades
              </h2>
              <div className="space-y-5">
                {doctors.map((doc, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative">
                    {doctors.length > 1 && (
                      <button onClick={() => removeDoctor(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome do Profissional</label>
                        <input type="text" value={doc.name} onChange={e => updateDoctor(idx, "name", e.target.value)} placeholder="Dr. Carlos Silva" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Especialidade</label>
                        <input type="text" value={doc.specialty} onChange={e => updateDoctor(idx, "specialty", e.target.value)} placeholder="Ex: Cardiologia" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{clinicType === "ODONTOLOGICA" ? "CRO" : "CRM"} (Opcional)</label>
                        <input type="text" value={doc.registry} onChange={e => updateDoctor(idx, "registry", e.target.value)} placeholder="Número do Conselho" className={inputClass} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addDoctor} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Plus size={18} /> Adicionar outro profissional
                </button>
              </div>
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Voltar</button>
                <button type="button" onClick={handleNextStep} disabled={isLoading || !doctors[0].name || !doctors[0].specialty} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Próximo Passo <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ============ PASSO 3 ============ */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">3</span>
                Como os agendamentos chegarão?
              </h2>
              <p className="text-sm text-slate-500 mb-6">Selecione uma ou as duas opções.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Card WhatsApp */}
                <div
                  onClick={() => toggleAgenda("WHATSAPP")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all select-none ${agendaTypes.includes("WHATSAPP") ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"}`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${agendaTypes.includes("WHATSAPP") ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-emerald-600"}`}>
                    <WhatsAppIcon />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Via WhatsApp</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${agendaTypes.includes("WHATSAPP") ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                      {agendaTypes.includes("WHATSAPP") && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Receba a confirmação do agendamento direto no seu WhatsApp.</p>
                </div>

                {/* Card Google Calendar */}
                <div
                  onClick={() => toggleAgenda("CALENDAR")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all select-none ${agendaTypes.includes("CALENDAR") ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200 dark:border-slate-700 hover:border-blue-300"}`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${agendaTypes.includes("CALENDAR") ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <GoogleIcon />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Google Calendar</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${agendaTypes.includes("CALENDAR") ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                      {agendaTypes.includes("CALENDAR") && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Conecte a conta do Google para marcar na agenda automaticamente.</p>
                </div>
              </div>

              {/* Sub-formulário WhatsApp */}
              {agendaTypes.includes("WHATSAPP") && (
                <div className="mt-4 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 animate-in fade-in duration-300">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm">
                    <WhatsAppIcon /> Contatos para receber agendamentos
                  </h3>
                  <div className="space-y-4">
                    {whatsappContacts.map((c, idx) => (
                      <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                        {whatsappContacts.length > 1 && (
                          <button onClick={() => removeWhatsApp(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Médico</label>
                            <input type="text" value={c.name} onChange={e => updateWhatsApp(idx, "name", e.target.value)} placeholder="Dr. Ana Souza" className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Especialidade</label>
                            <input type="text" value={c.specialty} onChange={e => updateWhatsApp(idx, "specialty", e.target.value)} placeholder="Ex: Clínico Geral" className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Número WhatsApp</label>
                            <input type="text" value={c.phone} onChange={e => updateWhatsApp(idx, "phone", e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addWhatsApp} className="w-full py-2.5 border-2 border-dashed border-emerald-300 dark:border-emerald-600 rounded-xl text-emerald-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                      <Plus size={16} /> Adicionar outro contato
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-formulário Google Calendar */}
              {agendaTypes.includes("CALENDAR") && (
                <div className="mt-4 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 animate-in fade-in duration-300">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm flex items-center gap-2">
                    <GoogleIcon /> Conecte sua conta do Google
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Faça login para que a IA consiga verificar horários livres e criar eventos automaticamente na agenda da clínica.</p>
                  <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-sm">
                    <GoogleIcon /> Fazer login com o Google
                  </button>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Voltar</button>
                <button type="button" onClick={handleNextStep} disabled={isLoading || agendaTypes.length === 0 || (agendaTypes.includes("WHATSAPP") && (!whatsappContacts[0]?.name || !whatsappContacts[0]?.phone))} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Próximo Passo <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ============ PASSO 4 ============ */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">4</span>
                Falar Diretamente com o Médico
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Caso deseje, você pode cadastrar o WhatsApp do médico responsável. A IA <strong>só repassará o atendimento para este número caso o paciente solicite especificamente</strong> falar com o médico. (Opcional)
              </p>
              
              <div className="space-y-4">
                {directContacts.map((c, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                    {directContacts.length > 1 && (
                      <button onClick={() => removeDirectContact(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Médico</label>
                        <input type="text" value={c.name} onChange={e => updateDirectContact(idx, "name", e.target.value)} placeholder="Dr. Lucas" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Especialidade</label>
                        <input type="text" value={c.specialty} onChange={e => updateDirectContact(idx, "specialty", e.target.value)} placeholder="Ex: Clínico Geral" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp de Contato</label>
                        <input type="text" value={c.phone} onChange={e => updateDirectContact(idx, "phone", e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button onClick={addDirectContact} className="w-full py-2.5 border-2 border-dashed border-primary/30 dark:border-primary/50 rounded-xl text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                  <Plus size={16} /> Adicionar mais médicos
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">Deixar os campos em branco fará com que o paciente seja direcionado apenas para a recepção.</p>
              </div>

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Voltar</button>
                <button type="button" onClick={handleNextStep} disabled={isLoading} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 transition-all">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Próximo Passo <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ============ PASSO 5 ============ */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">5</span>
                Regras de Atendimento
              </h2>
              <div className="space-y-5">
                {/* Dias de Funcionamento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dias de Funcionamento</label>
                  <div className="flex flex-wrap gap-2">
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => {
                      const isSelected = operatingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-primary border-primary text-white shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Abertura</label>
                    <input type="time" value={schedule.start} onChange={e => setSchedule({ ...schedule, start: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fechamento</label>
                    <input type="time" value={schedule.end} onChange={e => setSchedule({ ...schedule, end: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duração Média da Consulta</label>
                    <select value={schedule.interval} onChange={e => setSchedule({ ...schedule, interval: Number(e.target.value) })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-primary">
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1 hora e 30 minutos</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da Consulta (R$)</label>
                    <input type="number" min="0" step="10" value={schedule.price || ""} onChange={e => setSchedule({ ...schedule, price: Number(e.target.value) })} placeholder="Ex: 250" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Voltar</button>
                <button type="button" onClick={handleFinish} disabled={isLoading} className="h-12 px-8 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-secondary/30 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Finalizar Implantação</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
