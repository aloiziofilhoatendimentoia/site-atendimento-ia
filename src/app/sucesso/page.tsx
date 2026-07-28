"use client";

import { CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-white flex flex-col items-center justify-center p-6 text-center">
      <Logo size="xl" className="mb-12" />
      
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
          Parabéns!
        </h1>
        <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
          Sua secretária virtual estará conectada e trabalhando para você 24 horas por dia em até 2 horas.
        </p>
        <div className="pt-4 flex items-start space-x-2 text-sm text-teal-400/80 max-w-md text-left bg-teal-900/10 p-4 rounded-xl border border-teal-900/30">
          <span className="font-bold text-lg leading-none">*</span>
          <p>
            Implantações solicitadas após o horário comercial (após as 19h), só terão as secretárias ativadas a partir das 08h da manhã do dia seguinte.
          </p>
        </div>
      </div>
    </div>
  );
}
