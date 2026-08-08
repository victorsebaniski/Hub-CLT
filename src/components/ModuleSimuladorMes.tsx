import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Clock,
  Moon,
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  MinusCircle,
  PlusCircle,
  Info,
  Calendar,
} from 'lucide-react';
import { UserProfile, MonthlyCalculationInput, MonthlyCalculationResult, CalculationHistoryItem } from '../types';
import { calculateMonthlyPaycheck } from '../utils/cltMath';

interface ModuleSimuladorMesProps {
  profile: UserProfile;
  onSaveHistory: (type: 'mensal', title: string, netAmount: number, details: CalculationHistoryItem['detailsData']) => void;
}

export const ModuleSimuladorMes: React.FC<ModuleSimuladorMesProps> = ({ profile, onSaveHistory }) => {
  // Input State
  const [horasExtras50, setHorasExtras50] = useState<number>(0);
  const [horasExtras100, setHorasExtras100] = useState<number>(0);
  const [horasNoturnas, setHorasNoturnas] = useState<number>(0);
  const [faltasDias, setFaltasDias] = useState<number>(0);
  const [outrosProventos, setOutrosProventos] = useState<number>(0);
  const [outrosDescontosEventuais, setOutrosDescontosEventuais] = useState<number>(0);

  // Salary Advance State
  const [temAdiantamento, setTemAdiantamento] = useState<boolean>(true);
  const [percentualAdiantamento, setPercentualAdiantamento] = useState<number>(40);

  const [showInssDetails, setShowInssDetails] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Recalculate whenever inputs or profile change via useMemo
  const result = React.useMemo<MonthlyCalculationResult>(() => {
    const input: MonthlyCalculationInput = {
      horasExtras50,
      horasExtras100,
      horasNoturnas,
      faltasDias,
      outrosProventos,
      outrosDescontosEventuais,
      temAdiantamento,
      percentualAdiantamento,
    };
    return calculateMonthlyPaycheck(profile, input);
  }, [
    profile,
    horasExtras50,
    horasExtras100,
    horasNoturnas,
    faltasDias,
    outrosProventos,
    outrosDescontosEventuais,
    temAdiantamento,
    percentualAdiantamento,
  ]);

  const handleSaveSimulation = () => {
    const title = `Simulação de Mês (${new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})`;
    onSaveHistory('mensal', title, result.salarioLiquido, { input: { horasExtras50, horasExtras100, horasNoturnas }, result });
    setSavedMsg('Simulação mensal salva no histórico com sucesso!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Calculator className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Simulador do Mês (Salário Líquido + Extras)</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Simule suas Horas Extras (50% e 100%), DSR, Adicional Noturno e Adicionais. Calcule o seu salário líquido exato do mês antes do contracheque chegar!
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Salário Base Carregado</span>
          <p className="text-lg font-black text-blue-300">
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

      {result.alertaFaltasExcessivas && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Atenção: O número de faltas digitado ({faltasDias} dias) excede os dias úteis cadastrados do mês ({profile.diasUteisMes || 22} dias).
            O salário líquido calculado pode resultar em um valor excessivamente reduzido ou zerado.
          </span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Lançamento de Horas Extras e Turnos</span>
            </h3>

            {/* HE 50% */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Horas Extras 50% (Dias úteis/sábados)</label>
                <span className="text-[11px] font-bold text-blue-600">
                  + R$ {(horasExtras50 * result.valorHoraNormal * 1.5).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-he50-minus"
                  onClick={() => setHorasExtras50((v) => Math.max(0, v - 1))}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  id="input-he50"
                  value={horasExtras50}
                  onChange={(e) => setHorasExtras50(Math.max(0, Number(e.target.value)))}
                  className="w-full text-center py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <button
                  type="button"
                  id="btn-he50-plus"
                  onClick={() => setHorasExtras50((v) => v + 1)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Valor da HE 50%: R$ {(result.valorHoraNormal * 1.5).toFixed(2)} /hora.
              </p>
            </div>

            {/* HE 100% */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Horas Extras 100% (Domingos/Feriados)</label>
                <span className="text-[11px] font-bold text-blue-600">
                  + R$ {(horasExtras100 * result.valorHoraNormal * 2.0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-he100-minus"
                  onClick={() => setHorasExtras100((v) => Math.max(0, v - 1))}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  id="input-he100"
                  value={horasExtras100}
                  onChange={(e) => setHorasExtras100(Math.max(0, Number(e.target.value)))}
                  className="w-full text-center py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <button
                  type="button"
                  id="btn-he100-plus"
                  onClick={() => setHorasExtras100((v) => v + 1)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Valor da HE 100%: R$ {(result.valorHoraNormal * 2.0).toFixed(2)} /hora.
              </p>
            </div>

            {/* Horas Noturnas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Moon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Horas Trabalhadas à Noite (22h às 05h)</span>
                </label>
                <span className="text-[11px] font-bold text-purple-600">
                  + R$ {result.proventos.valorAdicionalNoturno.toFixed(2)}
                </span>
              </div>

              {result.isTurnoNoturnoFixo && (
                <div className="mb-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[11px] flex items-start space-x-2 animate-fadeIn">
                  <Moon className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">🌙 Turno Noturno Fixo Ativo no Perfil</span>
                    <p className="text-[10px] text-purple-700 mt-0.5">
                      {result.horasNoturnasTotais - horasNoturnas}h noturnas mensais habituais do seu perfil já estão sendo calculadas. Digite abaixo apenas se você trabalhou horas noturnas <strong>adicionais/esporádicas</strong>.
                    </p>
                  </div>
                </div>
              )}

              <input
                type="number"
                min="0"
                step="0.5"
                id="input-noturnas"
                value={horasNoturnas}
                onChange={(e) => setHorasNoturnas(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Aplica adicional de 20% + redução da hora noturna (52 min 30 seg). Total no mês: {result.horasNoturnasTotais}h.
              </p>
            </div>

            {/* Outros Eventuais */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bônus / Comissões (R$)</label>
                <input
                  type="number"
                  min="0"
                  id="input-outros-proventos"
                  value={outrosProventos}
                  onChange={(e) => setOutrosProventos(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Faltas Não Justificadas (Dias)</label>
                <input
                  type="number"
                  min="0"
                  id="input-faltas"
                  value={faltasDias}
                  onChange={(e) => setFaltasDias(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-red-600 font-bold"
                />
              </div>
            </div>

            {/* Adiantamento Salarial / Quinzena (Vale dia 15/20) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Adiantamento Salarial / Quinzena</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="check-tem-adiantamento"
                    checked={temAdiantamento}
                    onChange={(e) => setTemAdiantamento(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="check-tem-adiantamento" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Recebe Vale (Dia 15/20)
                  </label>
                </div>
              </div>

              {temAdiantamento && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Percentual do Adiantamento:</span>
                    <span className="text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {percentualAdiantamento}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPercentualAdiantamento(pct)}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                          percentualAdiantamento === pct
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {pct}% {pct === 40 ? '(Padrão)' : ''}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-800 leading-tight">
                    💡 As empresas geralmente pagam 40% do salário bruto no dia 15 ou 20 <strong>sem descontos</strong>, e os 60% restantes no dia 30 ou 5º dia útil com os impostos e faltas abatidos.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            id="btn-salvar-simulacao-mes"
            onClick={handleSaveSimulation}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Simulação no Histórico</span>
          </button>
        </div>

        {/* Right Output Column (7 Cols) - Highlight Card & Holerite Digital */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Net Result Banner Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-xl border border-emerald-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <DollarSign className="w-48 h-48 text-white" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
              Salário Líquido Estimado do Mês
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-200">R$</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {result.salarioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-emerald-500/40 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Total Proventos</span>
                <span className="text-sm font-extrabold text-white">
                  R$ {result.proventos.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Total Descontos</span>
                <span className="text-sm font-extrabold text-emerald-100">
                  - R$ {result.descontos.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-200 block">FGTS do Mês (8%)</span>
                <span className="text-sm font-extrabold text-emerald-200">
                  R$ {result.valorFgtsMes.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown in 2 Installments Card (Quinzena vs Fechamento) */}
          {result.adiantamento.ativo ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Divisão de Pagamento em 2 Parcelas (Quinzena & Mês)
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  Vale de {result.adiantamento.percentual}% Ativo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1st Installment (Quinzena) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-50 border border-blue-200 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                      1ª Parcela: Quinzena (Vale)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                      Dia 15 ou 20
                    </span>
                  </div>
                  <p className="text-2xl font-black text-blue-900 mt-1">
                    R$ {result.adiantamento.valorQuinzena.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium mt-1">
                    {result.adiantamento.percentual}% do salário base <strong>sem descontos de folha</strong>.
                  </p>
                </div>

                {/* 2nd Installment (Fechamento) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-50 border border-emerald-200 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      2ª Parcela: Fechamento do Mês
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                      Dia 30 / 5º dia útil
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-900 mt-1">
                    R$ {result.adiantamento.valorFechamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Saldo restante com extras e <strong>todos os descontos</strong> (INSS, IRRF, VT, Vale quinzena).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">Soma Líquida das 2 Parcelas no Mês:</span>
                <span className="text-sm font-extrabold text-slate-900">
                  R$ {result.salarioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold">Pagamento em Parcela Única (100% no fechamento do mês)</span>
              <span className="font-bold text-slate-900">
                R$ {result.salarioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Digital Paycheck Simulator (Holerite Digital) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Holerite Digital Discriminado
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                Ref: Mês Vigente
              </span>
            </div>

            {/* Proventos Table */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block border-b border-emerald-100 pb-1">
                (+) Proventos / Ganhos
              </span>

              <div className="text-xs space-y-1.5 divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-1 text-slate-800">
                  <span>Salário Base Contratual</span>
                  <span className="font-semibold text-slate-900">
                    R$ {result.proventos.salarioBase.toFixed(2)}
                  </span>
                </div>

                {result.proventos.valorInsalubridade > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Adicional de Insalubridade ({profile.grauInsalubridade}%)</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorInsalubridade.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.valorPericulosidade > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Adicional de Periculosidade (30%)</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorPericulosidade.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.valorHorasExtras50 > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Horas Extras 50% ({horasExtras50}h)</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorHorasExtras50.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.valorHorasExtras100 > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Horas Extras 100% ({horasExtras100}h)</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorHorasExtras100.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.valorDSR > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span className="flex items-center space-x-1">
                      <span>DSR sobre Horas Extras</span>
                      <Info className="w-3 h-3 text-slate-400" title="Descanso Semanal Remunerado sobre Horas Extras" />
                    </span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorDSR.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.valorAdicionalNoturno > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Adicional Noturno ({horasNoturnas}h)</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.valorAdicionalNoturno.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.proventos.outrosProventos > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Outros Bônus e Comissões</span>
                    <span className="font-semibold text-emerald-700">
                      + R$ {result.proventos.outrosProventos.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Descontos Table */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-red-700 uppercase tracking-wider block border-b border-red-100 pb-1">
                (-) Descontos Obrigatórios e Fixos
              </span>

              <div className="text-xs space-y-1.5 divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-1 text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>INSS (Previdência Social)</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({result.aliquotaEfetivaInss}% efetiva)
                    </span>
                  </div>
                  <span className="font-semibold text-red-600">
                    - R$ {result.descontos.valorInss.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>IRRF (Imposto de Renda)</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({result.descontos.irrfDetalhes.isIsento ? 'Isento' : `${result.aliquotaEfetivaIrrf}% efetiva`})
                    </span>
                  </div>
                  <span className="font-semibold text-red-600">
                    - R$ {result.descontos.valorIrrf.toFixed(2)}
                  </span>
                </div>

                {result.descontos.valorPlanoSaude > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Plano de Saúde</span>
                    <span className="font-semibold text-red-600">
                      - R$ {result.descontos.valorPlanoSaude.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.descontos.valorVT > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Vale Transporte</span>
                    <span className="font-semibold text-red-600">
                      - R$ {result.descontos.valorVT.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.descontos.valorFaltas > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Desconto por Faltas ({faltasDias} dias)</span>
                    <span className="font-semibold text-red-600">
                      - R$ {result.descontos.valorFaltas.toFixed(2)}
                    </span>
                  </div>
                )}

                {result.descontos.outrosDescontos > 0 && (
                  <div className="flex justify-between items-center pt-1 text-slate-800">
                    <span>Outros Descontos Fixos e Eventuais</span>
                    <span className="font-semibold text-red-600">
                      - R$ {result.descontos.outrosDescontos.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Accordion for Progressive INSS Details */}
            <div className="mt-5 pt-3 border-t border-slate-200">
              <button
                type="button"
                id="btn-toggle-inss-faixas"
                onClick={() => setShowInssDetails(!showInssDetails)}
                className="w-full flex items-center justify-between text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                <span>Entenda o Cálculo do INSS por Faixas (Tabela Progressiva 2025/2026)</span>
                {showInssDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showInssDetails && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                  <p className="text-slate-600 text-[11px] mb-2">
                    O INSS não cobra a alíquota cheia sobre todo o salário, mas sim por parcelas (faixas progressivas):
                  </p>
                  {result.descontos.inssFaixas.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700 border-b border-slate-200/60 pb-1">
                      <span>{f.faixaTexto}</span>
                      <span className="font-mono font-bold text-slate-900">
                        R$ {f.valorCalculado.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 flex justify-between font-bold text-slate-900 text-xs">
                    <span>Total INSS Retido:</span>
                    <span>R$ {result.descontos.valorInss.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quinzena & Fechamento Summary in Paycheck */}
            {result.adiantamento.ativo && (
              <div className="mt-5 pt-3 border-t border-slate-200 space-y-2">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">
                  Partilha de Depósitos do Mês (Quinzena x Fechamento)
                </span>
                <div className="text-xs space-y-1.5 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="font-medium">1ª Parcela (Pago no dia 15/20 - Vale de {result.adiantamento.percentual}%)</span>
                    <span className="font-bold text-blue-800">
                      R$ {result.adiantamento.valorQuinzena.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="font-medium">(-) Vale do Adiantamento Deduzido no Fechamento</span>
                    <span className="font-bold text-red-600">
                      - R$ {result.adiantamento.valorQuinzena.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-extrabold border-t border-blue-200 pt-1.5 text-xs">
                    <span>(=) 2ª Parcela a Receber no Fechamento do Mês</span>
                    <span className="text-emerald-700 font-black text-sm">
                      R$ {result.adiantamento.valorFechamentoMes.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
