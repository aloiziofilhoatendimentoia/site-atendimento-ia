"use client";

import Image from "next/image";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-14 shadow-xl shadow-slate-200/40 dark:shadow-none text-center relative overflow-hidden">
        
        {/* Confetes / Efeito Visual de Sucesso */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500 delay-100">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Tudo Pronto! 🎉
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">
          Recebemos as configurações da sua clínica com sucesso. O processo de implantação da sua nova secretária já começou.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8 flex flex-col sm:flex-row items-center gap-4 text-left animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-primary/10 text-primary p-3 rounded-full shrink-0">
            <Clock size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Prazo de Ativação</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              A inteligência artificial estará <strong>online e funcionando em até 2 horas</strong>. Você será avisado assim que ela fizer o primeiro atendimento!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-medium">Você já pode fechar esta página com segurança.</p>
          <div className="flex justify-center text-primary animate-pulse">
            <Sparkles size={24} />
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center opacity-60">
        <Image src="/logo.jpg" alt="Atendimento IA" width={140} height={40} className="object-contain mx-auto grayscale opacity-70" />
      </div>
    </div>
  );
}
