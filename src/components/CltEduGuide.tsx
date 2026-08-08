import React from 'react';
import {
  HelpCircle,
  BookOpen,
  Clock,
  ShieldCheck,
  Palmtree,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Award,
} from 'lucide-react';

export const CltEduGuide: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Guia de Direitos e Termos Trabalhistas (CLT)</h2>
          <p className="text-xs text-slate-300 mt-1">
            Respostas simples e diretas para entender seu contracheque e garantir que nenhum centavo do seu trabalho seja esquecido.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Horas Extras e DSR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Como funciona a Hora Extra e o DSR?</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            As Horas Extras prestadas de segunda a sábado têm adicional mínimo de <strong>50%</strong>. Já as horas trabalhadas em domingos e feriados sem folga compensatória são pagas a <strong>100%</strong>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">
            <strong>O que é DSR?</strong> O Descanso Semanal Remunerado incide sobre o valor total das horas extras que você faz no mês, aumentando o valor que você recebe nos repousos semanais!
          </p>
        </div>

        {/* Card 2: Adicional Noturno */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Adicional Noturno e Hora Reduzida</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Quem trabalha entre 22h e 05h tem direito ao adicional noturno de no mínimo <strong>20%</strong> sobre a hora normal.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed bg-purple-50 p-3 rounded-xl border border-purple-100">
            <strong>Hora Ficta Noturna:</strong> A hora noturna não dura 60 minutos, mas sim <strong>52 minutos e 30 segundos</strong>! Isso significa que 7 horas de trabalho noturno equivalem a 8 horas normais pagas.
          </p>
        </div>

        {/* Card 3: Adicionais de Risco */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Insalubridade x Periculosidade</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Insalubridade:</strong> Paga a quem trabalha exposto a agentes nocivos à saúde (ruído, calor, produtos químicos). Os graus são 10% (mínimo), 20% (médio) e 40% (máximo), calculados sobre o <strong>Salário Mínimo Nacional</strong>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Periculosidade:</strong> Paga a quem trabalha em atividades com risco de vida (eletricidade, inflamáveis, segurança). Adiciona <strong>30%</strong> sobre o seu <strong>Salário Base Bruto</strong>.
          </p>
        </div>

        {/* Card 4: Férias e Abono Pecuniário */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Palmtree className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Regras de Férias e "Vender Férias"</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Após 12 meses de trabalho (período aquisitivo), o trabalhador adquire direito a 30 dias de férias com o acréscimo de <strong>1/3 constitucional</strong>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
            <strong>Abono Pecuniário:</strong> O trabalhador pode escolher "vender" até 10 dias de suas férias para o empregador. O valor pago por esses 10 dias + 1/3 é <strong>totalmente isento de impostos (INSS e IRRF)</strong>!
          </p>
        </div>
      </div>
    </div>
  );
};
