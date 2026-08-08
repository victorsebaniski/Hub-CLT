import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ShieldAlert,
  Save,
  HelpCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserProfile, SeveranceInput, SeveranceResult, CalculationHistoryItem } from '../types';
import { calculateSeverance } from '../utils/cltMath';

interface ModuleRescisaoProps {
  profile: UserProfile;
  onSaveHistory: (type: 'rescisao', title: string, netAmount: number, details: CalculationHistoryItem['detailsData']) => void;
}

export const ModuleRescisao: React.FC<ModuleRescisaoProps> = ({ profile, onSaveHistory }) => {
  // Input State
  const [dataAdmissao, setDataAdmissao] = useState<string>('2023-03-15');
  const [dataRescisao, setDataRescisao] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [motivoRescisao, setMotivoRescisao] = useState<SeveranceInput['motivoRescisao']>('sem_justa_causa');
  const [avisoPrevio, setAvisoPrevio] = useState<SeveranceInput['avisoPrevio']>('indenizado');
  const [saldoFgtsAtual, setSaldoFgtsAtual] = useState<number>(12500);
  const [temFeriasVencidas, setTemFeriasVencidas] = useState<boolean>(false);
  const [qtdPeriodosFeriasVencidas, setQtdPeriodosFeriasVencidas] = useState<number>(1);

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Result via useMemo
  const result = React.useMemo<SeveranceResult>(() => {
    const input: SeveranceInput = {
      dataAdmissao,
      dataRescisao,
      motivoRescisao,
      avisoPrevio,
      saldoFgtsAtual,
      temFeriasVencidas,
      qtdPeriodosFeriasVencidas,
    };
    return calculateSeverance(profile, input);
  }, [
    profile,
    dataAdmissao,
    dataRescisao,
    motivoRescisao,
    avisoPrevio,
    saldoFgtsAtual,
    temFeriasVencidas,
    qtdPeriodosFeriasVencidas,
  ]);

  const handleSave = () => {
    const title = `Simulação de Rescisão (${motivoRescisao.replace(/_/g, ' ')})`;
    onSaveHistory('rescisao', title, result.liquidototalRescisorio, { result });
    setSavedMsg('Simulação de Rescisão salva no histórico!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Calculadora de Rescisão (Simulador de Acerto)</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Simulação precisa dos valores rescisórios: verbas rescisórias, aviso prévio proporcional, 13º salário, férias vencidas/proporcionais, multa do FGTS e seguro desemprego.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Salário de Referência</span>
          <p className="text-lg font-black text-purple-300">
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

      {result.erroData && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{result.erroData}</span>
        </div>
      )}

      {/* Inputs Form + Result Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Dados do Contrato e Desligamento</span>
            </h3>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Admissão *</label>
                <input
                  type="date"
                  required
                  id="input-rescisao-admissao"
                  value={dataAdmissao}
                  onChange={(e) => setDataAdmissao(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Rescisão *</label>
                <input
                  type="date"
                  required
                  id="input-rescisao-data"
                  value={dataRescisao}
                  onChange={(e) => setDataRescisao(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Desligamento *</label>
              <select
                id="select-rescisao-motivo"
                value={motivoRescisao}
                onChange={(e) => setMotivoRescisao(e.target.value as SeveranceInput['motivoRescisao'])}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="sem_justa_causa">Demissão sem justa causa (pelo Empregador)</option>
                <option value="pedido_demissao">Pedido de Demissão (pelo Empregado)</option>
                <option value="acordo_484a">Demissão por Acordo Consensual (Art. 484-A CLT)</option>
                <option value="com_justa_causa">Demissão COM justa causa</option>
              </select>
            </div>

            {/* Aviso Prévio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Situação do Aviso Prévio *</label>
              <select
                id="select-rescisao-aviso"
                value={avisoPrevio}
                onChange={(e) => setAvisoPrevio(e.target.value as SeveranceInput['avisoPrevio'])}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="indenizado">Aviso Prévio Indenizado (Pago em dinheiro)</option>
                <option value="trabalhado">Aviso Prévio Trabalhado (Cumprido)</option>
                <option value="dispensado">Dispensado / Não cumprido</option>
              </select>
            </div>

            {/* FGTS Balance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Saldo Atual do FGTS na Caixa (R$)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                id="input-rescisao-fgts"
                value={saldoFgtsAtual}
                onChange={(e) => setSaldoFgtsAtual(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Utilizado para calcular a multa de 40% (ou 20% em caso de acordo).
              </p>
            </div>

            {/* Expired Vacations */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="check-ferias-vencidas"
                  checked={temFeriasVencidas}
                  onChange={(e) => setTemFeriasVencidas(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="check-ferias-vencidas" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Possui Férias Vencidas não gozadas
                </label>
              </div>

              {temFeriasVencidas && (
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-xs text-slate-700">Períodos vencidos:</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    id="input-ferias-vencidas-qtd"
                    value={qtdPeriodosFeriasVencidas}
                    onChange={(e) => setQtdPeriodosFeriasVencidas(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            id="btn-salvar-rescisao"
            onClick={handleSave}
            className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Simulação de Rescisão</span>
          </button>
        </div>

        {/* Right Output Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Net Result Banner */}
          <div className="bg-gradient-to-br from-purple-800 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-purple-700 relative overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Total Rescisório Líquido (Pago pela Empresa)
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-purple-300">R$</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {result.liquidototalRescisorio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-purple-700/60 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-purple-300 block">Total Proventos</span>
                <span className="text-sm font-extrabold text-white">
                  R$ {result.proventos.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-purple-300 block">Total Descontos</span>
                <span className="text-sm font-extrabold text-red-300">
                  - R$ {result.descontos.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-semibold text-purple-300 block">Multa FGTS</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  + R$ {result.fgts.multaRescisoria40ou20.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Additional FGTS & Seguro Desemprego Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FGTS Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                FGTS Disponível para Saque
              </span>
              <p className="text-2xl font-black text-slate-900">
                R$ {result.fgts.estimativaValorDisponivelSaque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-600">
                {result.fgts.podeSacarFgts
                  ? `Inclui o saldo da conta (R$ ${saldoFgtsAtual.toFixed(2)}) + Multa Rescisória de R$ ${result.fgts.multaRescisoria40ou20.toFixed(2)}.`
                  : 'Neste motivo de desligamento, não há liberação de saque do FGTS.'}
              </p>
            </div>

            {/* Seguro Desemprego Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Estimativa de Seguro Desemprego
              </span>
              {result.seguroDesemprego.direitoSeguro ? (
                <div>
                  <p className="text-2xl font-black text-blue-700">
                    {result.seguroDesemprego.qtdParcelasEstimada} x R$ {result.seguroDesemprego.valorEstimadoParcela.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Total do benefício: R$ {(result.seguroDesemprego.qtdParcelasEstimada * result.seguroDesemprego.valorEstimadoParcela).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-red-600 pt-2">
                  Não elegível para Seguro Desemprego neste motivo de rescisão.
                </p>
              )}
            </div>
          </div>

          {/* Itemized Severance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Detalhamento de Rubricas Rescisórias
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 text-slate-800">
              <div className="flex justify-between pt-1">
                <span>Saldo de Salário ({result.diasTrabalhadosMesRescisao} dias)</span>
                <span className="font-semibold">R$ {result.proventos.saldoSalario.toFixed(2)}</span>
              </div>

              {result.proventos.avisoPrevioIndenizado > 0 && (
                <div className="flex justify-between pt-1 text-purple-700 font-medium">
                  <span>Aviso Prévio Indenizado ({result.diasAvisoPrevioProporcional} dias)</span>
                  <span className="font-semibold">+ R$ {result.proventos.avisoPrevioIndenizado.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <span>13º Salário Proporcional ({result.mesesProporcionais13}/12)</span>
                <span className="font-semibold">R$ {result.proventos.decimoTerceiroProporcional.toFixed(2)}</span>
              </div>

              {result.proventos.feriasVencidas > 0 && (
                <div className="flex justify-between pt-1">
                  <span>Férias Vencidas + 1/3</span>
                  <span className="font-semibold">
                    R$ {(result.proventos.feriasVencidas + result.proventos.tercoFeriasVencidas).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <span>Férias Proporcionais ({result.mesesProporcionaisFerias}/12) + 1/3</span>
                <span className="font-semibold">
                  R$ {(result.proventos.feriasProporcionais + result.proventos.tercoFeriasProporcionais).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between pt-2 text-red-600 font-medium">
                <span>Desconto INSS e IRRF sobre Rescisão</span>
                <span>- R$ {result.descontos.totalDescontos.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
