import React, { useState, useEffect } from 'react';
import {
  Palmtree,
  Sun,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Info,
  Calendar,
  Save,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  PiggyBank,
} from 'lucide-react';
import { UserProfile, VacationResult, CalculationHistoryItem } from '../types';
import { calculateVacation } from '../utils/cltMath';

interface ModuleFeriasProps {
  profile: UserProfile;
  onSaveHistory: (type: 'ferias', title: string, netAmount: number, details: CalculationHistoryItem['detailsData']) => void;
}

export const ModuleFerias: React.FC<ModuleFeriasProps> = ({ profile, onSaveHistory }) => {
  // Inputs
  const [diasFerias, setDiasFerias] = useState<number>(30);
  const [venderAbonoPecuniario, setVenderAbonoPecuniario] = useState<boolean>(false);
  const [adiantarPrimeiraParcela13, setAdiantarPrimeiraParcela13] = useState<boolean>(false);
  const [mesRetornoGastosFixos, setMesRetornoGastosFixos] = useState<number>(1800);

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Result via useMemo
  const result = React.useMemo<VacationResult>(() => {
    return calculateVacation(profile, {
      diasFerias,
      venderAbonoPecuniario,
      adiantarPrimeiraParcela13,
      mesRetornoGastosFixos,
    });
  }, [profile, diasFerias, venderAbonoPecuniario, adiantarPrimeiraParcela13, mesRetornoGastosFixos]);

  const handleSave = () => {
    const title = `Simulação de Férias (${diasFerias} dias${venderAbonoPecuniario ? ' + Abono' : ''})`;
    onSaveHistory('ferias', title, result.valorLiquidoReceberAntes, { result });
    setSavedMsg('Simulação de Férias salva no histórico!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Palmtree className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Raio-X das Férias & "Vale da Volta"</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Descubra quanto dinheiro vai cair na sua conta antes de sair de férias E previna-se contra a armadilha do mês do retorno (quando o salário vem zerado ou reduzido).
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Salário Base</span>
          <p className="text-lg font-black text-amber-300">
            R$ {profile.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {result.foiAjustado && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Ajustamos os dias de férias para {result.diasGozo} dias (limite permitido por lei, entre 1 e 30 dias).
          </span>
        </div>
      )}

      {/* Inputs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Configuração e Fracionamento das Férias</span>
        </h3>

        {/* Flexible Days Selector */}
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Dias de Férias a Gozar neste Período</span>
              </label>
              <p className="text-[11px] text-slate-600 mt-0.5">
                A CLT permite fracionar as férias em até 3 vezes (um período não menor que 14 dias e os demais não menores que 5 dias).
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300">
                {diasFerias} dias selecionados
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[30, 20, 15, 14, 10, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiasFerias(d)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  diasFerias === d
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {d} dias {d === 30 ? '(Integral)' : d === 20 ? '(2/3)' : d === 15 ? '(Metade)' : ''}
              </button>
            ))}

            <div className="flex items-center space-x-1.5 ml-auto">
              <span className="text-[11px] font-bold text-slate-600">Outro:</span>
              <input
                type="number"
                min="1"
                max="30"
                id="input-dias-ferias-custom"
                value={diasFerias}
                onChange={(e) => setDiasFerias(Math.max(1, Math.min(30, Number(e.target.value))))}
                className="w-16 px-2 py-1 text-xs font-extrabold text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-center bg-white"
              />
              <span className="text-xs font-semibold text-slate-500">dias</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option A: Sell 10 days */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="check-vender-abono"
                checked={venderAbonoPecuniario}
                onChange={(e) => setVenderAbonoPecuniario(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="check-vender-abono" className="text-xs font-bold text-slate-900 cursor-pointer">
                Vender 10 dias (Abono Pecuniário)
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Recebe 10 dias em dinheiro com 1/3 extra (totalmente isento de INSS/IRRF).
            </p>
          </div>

          {/* Option B: 13th advance */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="check-adiantamento-13"
                checked={adiantarPrimeiraParcela13}
                onChange={(e) => setAdiantarPrimeiraParcela13(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="check-adiantamento-13" className="text-xs font-bold text-slate-900 cursor-pointer">
                Adiantar 1ª Parcela do 13º (50%)
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Adiciona +50% do salário base bruto no pagamento das férias.
            </p>
          </div>

          {/* Option C: Fixed expenses in return month */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Seus Gastos Fixos do Mês de Retorno (R$)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              id="input-gastos-retorno"
              value={mesRetornoGastosFixos}
              onChange={(e) => setMesRetornoGastosFixos(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-[11px] text-slate-500">
              Aluguel, água, luz, mercado... usaremos para alertar sobre seu fluxo de caixa.
            </p>
          </div>
        </div>
      </div>

      {/* TWO HIGH-IMPACT IMPACT PANELS (REQUIREMENT 4 - MÓDULO 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: Valor a Receber Antes de Sair */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Valor a Receber Antes das Férias
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Até 2 dias antes do início
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                Valor Líquido Caindo na Conta
              </span>
              <p className="text-3xl font-black text-emerald-800 mt-1">
                R$ {result.valorLiquidoReceberAntes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Remuneração de {result.diasGozo} dias de gozo + 1/3 Constitucional
                {venderAbonoPecuniario ? ' + 10 dias de Abono' : ''}.
              </p>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs divide-y divide-slate-100 text-slate-700">
              <div className="flex justify-between pt-1">
                <span>Remuneração Bruta de Férias ({result.diasGozo} dias)</span>
                <span className="font-semibold text-slate-900">R$ {result.proventos.brutoFerias.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Terço Constitucional (1/3)</span>
                <span className="font-semibold text-slate-900">R$ {result.proventos.tercoConstitucional.toFixed(2)}</span>
              </div>

              {venderAbonoPecuniario && (
                <>
                  <div className="flex justify-between pt-1 text-emerald-800">
                    <span>Abono Pecuniário (10 dias isentos)</span>
                    <span className="font-semibold">R$ {result.proventos.abonoPecuniarioBruto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-emerald-800">
                    <span>Terço do Abono Pecuniário</span>
                    <span className="font-semibold">R$ {result.proventos.tercoAbonoPecuniario.toFixed(2)}</span>
                  </div>
                </>
              )}

              {adiantarPrimeiraParcela13 && (
                <div className="flex justify-between pt-1 text-blue-800">
                  <span>Adiantamento 50% do 13º Salário</span>
                  <span className="font-semibold">R$ {result.proventos.adiantamento13.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 text-red-600 font-medium">
                <span>Descontos Impostos (INSS + IRRF sobre Férias)</span>
                <span>- R$ {result.descontos.totalDescontos.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              id="btn-salvar-ferias"
              onClick={handleSave}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Simulação de Férias</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: O Alerta do "Vale da Volta" */}
        <div
          className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between ${
            result.valeDaVolta.alertaSeveridade === 'vermelho'
              ? 'bg-red-50/80 border-red-300'
              : result.valeDaVolta.alertaSeveridade === 'amarelo'
              ? 'bg-amber-50/80 border-amber-300'
              : 'bg-emerald-50/80 border-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200/80">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Raio-X: O "Vale da Volta"</span>
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  result.valeDaVolta.alertaSeveridade === 'vermelho'
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-amber-500 text-white border-amber-600'
                }`}
              >
                Mês do Retorno Trabalhado
              </span>
            </div>

            {/* Severity Banner */}
            <div
              className={`p-4 rounded-xl border mb-4 space-y-2 ${
                result.valeDaVolta.alertaSeveridade === 'vermelho'
                  ? 'bg-white border-red-300 text-red-900'
                  : 'bg-white border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="text-xs font-extrabold uppercase">
                  {result.valeDaVolta.alertaSeveridade === 'vermelho'
                    ? 'Alerta Crítico de Mês Zerado'
                    : 'Atenção com as Contas de Retorno'}
                </span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {result.valeDaVolta.mensagemOrientacao}
              </p>
            </div>

            {/* Return Month Cash Flow Numbers & Detailed Breakdown */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Dias Trabalhados no Mês de Retorno:</span>
                <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {result.diasTrabalhadosMesRetorno} dias de trabalho ({result.diasGozo} dias em férias)
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>Salario Bruto Proporcional ({result.diasTrabalhadosMesRetorno} dias trabalhados):</span>
                <span className="font-bold text-slate-900">
                  R$ {result.valeDaVolta.previsaoSalarioMesRetornoBruto.toFixed(2)}
                </span>
              </div>

              {result.diasTrabalhadosMesRetorno > 0 && (
                <>
                  <div className="flex justify-between items-center text-red-600">
                    <span>(-) Impostos (INSS + IRRF do Mês de Retorno):</span>
                    <span className="font-medium">
                      - R$ {(result.valeDaVolta.inssMesRetorno + result.valeDaVolta.irrfMesRetorno).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-red-600">
                    <span>(-) Desconto de Vale Transporte (Apenas dias trabalhados):</span>
                    <span className="font-medium">
                      - R$ {result.valeDaVolta.vtMesRetorno.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* VT / VR Legal Non-Deduction Callout */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-[11px] text-emerald-900">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Isenção de Desconto de VT / VR/VA nas Férias</span>
                </div>
                <p className="text-emerald-700 leading-snug">
                  Como você esteve em férias por <strong>{result.diasGozo} dias</strong>, <strong>NÃO há desconto de Vale Transporte (VT) nem Vale Refeição/Alimentação (VR/VA)</strong> relativos a esses dias, pois esses benefícios destinam-se exclusivamente ao deslocamento e refeição dos dias trabalhados.
                </p>
              </div>

              <div className="flex justify-between items-center text-red-600">
                <span>(-) Descontos Fixos do Mês (Plano de Saúde e Outros):</span>
                <span className="font-medium">
                  - R$ {(result.valeDaVolta.planoSaudeMesRetorno + result.valeDaVolta.outrosFixosMesRetorno).toFixed(2)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900">Contracheque do Mês de Retorno:</span>
                <span
                  className={
                    result.valeDaVolta.saldoLiquidoMesRetorno <= 0 ? 'text-red-600' : 'text-emerald-600'
                  }
                >
                  R$ {result.valeDaVolta.saldoLiquidoMesRetorno.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-blue-900 text-white rounded-xl space-y-1 text-xs">
            <p className="font-bold flex items-center space-x-1 text-amber-300">
              <PiggyBank className="w-4 h-4" />
              <span>Dica de Ouro de Educação Financeira:</span>
            </p>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Guarde pelo menos <strong>R$ {mesRetornoGastosFixos.toFixed(2)}</strong> do valor recebido antes das férias em uma reserva separada para pagar suas contas de água, luz, aluguel e mercado no mês de retorno!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
