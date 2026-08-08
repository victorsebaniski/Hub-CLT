import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Users,
  Building2,
  HeartPulse,
  Bus,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getDivisorEscala, SALARIO_MINIMO_DEFAULT } from '../utils/cltMath';
import { apiFetch } from '../utils/storage';

interface ModulePerfilBaseProps {
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const ModulePerfilBase: React.FC<ModulePerfilBaseProps> = ({ profile, onUpdateProfile }) => {
  const [salarioBruto, setSalarioBruto] = useState<number>(profile.salarioBruto || 3850);
  const [dependentes, setDependentes] = useState<number>(profile.dependentes || 0);
  const [descontoPlanoSaude, setDescontoPlanoSaude] = useState<number>(profile.descontoPlanoSaude || 0);
  const [descontoVT, setDescontoVT] = useState<number>(profile.descontoVT || 0);
  const [usarVTPercentual, setUsarVTPercentual] = useState<boolean>(
    profile.usarVTPercentual !== undefined ? profile.usarVTPercentual : true
  );
  const [descontoOutros, setDescontoOutros] = useState<number>(profile.descontoOutros || 0);
  const [escalaTrabalho, setEscalaTrabalho] = useState<UserProfile['escalaTrabalho']>(
    profile.escalaTrabalho || '220'
  );
  const [turnoTrabalho, setTurnoTrabalho] = useState<'diurno' | 'noturno'>(
    profile.turnoTrabalho || 'diurno'
  );
  const [horasNoturnasTurnoFixo, setHorasNoturnasTurnoFixo] = useState<number>(
    profile.horasNoturnasTurnoFixo !== undefined ? profile.horasNoturnasTurnoFixo : 154
  );

  const [temInsalubridade, setTemInsalubridade] = useState<boolean>(profile.temInsalubridade || false);
  const [grauInsalubridade, setGrauInsalubridade] = useState<10 | 20 | 40>(profile.grauInsalubridade || 20);
  const [temPericulosidade, setTemPericulosidade] = useState<boolean>(profile.temPericulosidade || false);

  const [diasUteisMes, setDiasUteisMes] = useState<number>(profile.diasUteisMes || 22);
  const [domingosFeriados, setDomingosFeriados] = useState<number>(profile.domingosFeriados || 4);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setSalarioBruto(profile.salarioBruto);
    setDependentes(profile.dependentes);
    setDescontoPlanoSaude(profile.descontoPlanoSaude);
    setDescontoVT(profile.descontoVT);
    setUsarVTPercentual(profile.usarVTPercentual);
    setDescontoOutros(profile.descontoOutros);
    setEscalaTrabalho(profile.escalaTrabalho);
    setTurnoTrabalho(profile.turnoTrabalho || 'diurno');
    setHorasNoturnasTurnoFixo(
      profile.horasNoturnasTurnoFixo !== undefined ? profile.horasNoturnasTurnoFixo : 154
    );
    setTemInsalubridade(profile.temInsalubridade);
    setGrauInsalubridade(profile.grauInsalubridade);
    setTemPericulosidade(profile.temPericulosidade);
    setDiasUteisMes(profile.diasUteisMes || 22);
    setDomingosFeriados(profile.domingosFeriados || 4);
  }, [profile]);

  // Derived calculations
  const divisor = getDivisorEscala(escalaTrabalho);
  const valorHoraNormal = salarioBruto > 0 ? salarioBruto / divisor : 0;

  let adicionalInsalubridadeRs = 0;
  if (temInsalubridade) {
    adicionalInsalubridadeRs = SALARIO_MINIMO_DEFAULT * (grauInsalubridade / 100);
  }

  let adicionalPericulosidadeRs = 0;
  if (temPericulosidade) {
    adicionalPericulosidadeRs = salarioBruto * 0.3;
  }

  let adicionalNoturnoFixoRs = 0;
  if (turnoTrabalho === 'noturno') {
    const fatorHoraNoturna = 60 / 52.5;
    adicionalNoturnoFixoRs = horasNoturnasTurnoFixo * valorHoraNormal * 0.2 * fatorHoraNoturna;
  }

  const salarioBrutoTotalComAdicionais =
    salarioBruto + adicionalInsalubridadeRs + adicionalPericulosidadeRs + adicionalNoturnoFixoRs;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (salarioBruto <= 0) {
      setErrorMsg('O salário bruto deve ser um valor maior que zero.');
      setSaving(false);
      return;
    }

    const updated: UserProfile = {
      ...profile,
      salarioBruto,
      dependentes,
      descontoPlanoSaude,
      descontoVT,
      usarVTPercentual,
      descontoOutros,
      escalaTrabalho,
      turnoTrabalho,
      horasNoturnasTurnoFixo,
      diasUteisMes,
      domingosFeriados,
      temInsalubridade,
      grauInsalubridade,
      temPericulosidade,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save via API endpoint
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });

      onUpdateProfile(response.profile || updated);
      setSuccessMsg('Perfil Base salvo com sucesso! Todos os módulos foram atualizados.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      // Fallback local state save
      onUpdateProfile(updated);
      setSuccessMsg('Perfil atualizado em memória local.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
            <Sliders className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Perfil Base (O Cofre do Usuário)</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Preencha suas informações salariais e contratuais uma única vez. Elas serão salvas e reutilizadas automaticamente nos simuladores de salário mensal, férias e rescisão!
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inputs (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Salário e Carga Horária */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Remuneração e Escala de Trabalho</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Salário Bruto Contratual (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    id="input-perfil-salario"
                    value={salarioBruto}
                    onChange={(e) => setSalarioBruto(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Salário registrado na carteira de trabalho (CTPS).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Escala de Trabalho (Jornada) *
                </label>
                <select
                  id="select-perfil-escala"
                  value={escalaTrabalho}
                  onChange={(e) => setEscalaTrabalho(e.target.value as UserProfile['escalaTrabalho'])}
                  className="w-full px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="220">220 horas/mês (Padrão 44h semanais)</option>
                  <option value="180">180 horas/mês (36h semanais / Turnos)</option>
                  <option value="12x36">Escala 12x36 (180 horas/mês)</option>
                  <option value="2x2">Escala 2x2 (180 horas/mês)</option>
                  <option value="150">150 horas/mês (30h semanais)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Define o divisor para o valor exato da sua hora normal.
                </p>
              </div>

              {/* Turno de Trabalho (Diurno vs Noturno Fixo) */}
              <div className="col-span-1 sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Turno de Trabalho Habitual</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Indique se você trabalha fixo no período diurno ou noturno (22h às 05h).
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <label className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="turnoTrabalho"
                        value="diurno"
                        checked={turnoTrabalho === 'diurno'}
                        onChange={() => setTurnoTrabalho('diurno')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>☀️ Diurno (Dia)</span>
                    </label>
                    <label className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 cursor-pointer">
                      <input
                        type="radio"
                        name="turnoTrabalho"
                        value="noturno"
                        checked={turnoTrabalho === 'noturno'}
                        onChange={() => setTurnoTrabalho('noturno')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>🌙 Noturno Fixo (Noite)</span>
                    </label>
                  </div>
                </div>

                {turnoTrabalho === 'noturno' && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        Horas Noturnas Fixas por Mês
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        id="input-perfil-horas-noturnas-fixas"
                        value={horasNoturnasTurnoFixo}
                        onChange={(e) => setHorasNoturnasTurnoFixo(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-bold text-purple-900 border border-purple-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/50"
                      />
                      <p className="text-[10px] text-purple-700 mt-1">
                        Padrão: 154h/mês (220h) ou 140h/mês (180h).
                      </p>
                    </div>

                    <div className="p-2.5 bg-purple-100/70 border border-purple-200 rounded-lg text-purple-950">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-800">
                        Adicional Noturno Fixo Estimado
                      </span>
                      <p className="text-sm font-extrabold text-purple-900 mt-0.5">
                        + R$ {adicionalNoturnoFixoRs.toFixed(2)} /mês
                      </p>
                      <p className="text-[10px] text-purple-700">
                        Aplica 20% + redução da hora noturna em todo o salário mensal!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Dependentes (IRRF)
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    id="input-perfil-dependentes"
                    value={dependentes}
                    onChange={(e) => setDependentes(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Abate R$ 189,59 por dependente no cálculo do Imposto de Renda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Dias Úteis Mês
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    id="input-perfil-dias-uteis"
                    value={diasUteisMes}
                    onChange={(e) => setDiasUteisMes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Domingos e Feriados
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    id="input-perfil-domingos"
                    value={domingosFeriados}
                    onChange={(e) => setDomingosFeriados(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Adicionais (Insalubridade e Periculosidade) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Adicionais de Risco / Ambiente de Trabalho</span>
            </h3>

            <div className="space-y-4">
              {/* Insalubridade */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="check-perfil-insalubridade"
                    checked={temInsalubridade}
                    onChange={(e) => setTemInsalubridade(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="check-perfil-insalubridade" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Recebe Adicional de Insalubridade
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Calculado sobre o Salário Mínimo (R$ {SALARIO_MINIMO_DEFAULT.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
                    </p>
                  </div>
                </div>

                {temInsalubridade && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-700">Grau:</span>
                    <select
                      id="select-perfil-grau-insalubridade"
                      value={grauInsalubridade}
                      onChange={(e) => setGrauInsalubridade(Number(e.target.value) as 10 | 20 | 40)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="10">Mínimo (10% - R$ 151,80)</option>
                      <option value="20">Médio (20% - R$ 303,60)</option>
                      <option value="40">Máximo (40% - R$ 607,20)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Periculosidade */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="check-perfil-periculosidade"
                    checked={temPericulosidade}
                    onChange={(e) => setTemPericulosidade(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="check-perfil-periculosidade" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Recebe Adicional de Periculosidade (30%)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Adiciona +30% sobre o seu salário bruto base (+ R$ {(salarioBruto * 0.3).toFixed(2)}).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Descontos Fixos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <HeartPulse className="w-4 h-4 text-red-600" />
              <span>Descontos Fixos Recorrentes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plano de Saúde (R$)</label>
                <div className="relative">
                  <HeartPulse className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="input-perfil-plano"
                    value={descontoPlanoSaude}
                    onChange={(e) => setDescontoPlanoSaude(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vale Transporte (R$)</label>
                <div className="relative">
                  <Bus className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="input-perfil-vt"
                    value={descontoVT}
                    onChange={(e) => setDescontoVT(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="mt-1.5 flex items-center space-x-1.5">
                  <input
                    type="checkbox"
                    id="check-perfil-vt-limit"
                    checked={usarVTPercentual}
                    onChange={(e) => setUsarVTPercentual(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="check-perfil-vt-limit" className="text-[10px] font-semibold text-slate-600">
                    Limitar a 6% do salário (Regra CLT)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Outros Descontos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="input-perfil-outros-descontos"
                  value={descontoOutros}
                  onChange={(e) => setDescontoOutros(Number(e.target.value))}
                  placeholder="Sindicato, farmácia..."
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              id="btn-perfil-salvar"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all transform hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando Perfil...' : 'Salvar Perfil Base'}</span>
            </button>
          </div>
        </div>

        {/* Live Profile Summary Card (Right Column) */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 sticky top-24">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">Resumo do Motor Trabalhista</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Valor da Hora Normal
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                  R$ {valorHoraNormal.toFixed(2)} /h
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Base: R$ {salarioBruto.toFixed(2)} ÷ {divisor} horas ({escalaTrabalho}h)
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Remuneração Total de Referência
                </span>
                <p className="text-xl font-bold text-blue-300 mt-0.5">
                  R$ {salarioBrutoTotalComAdicionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inclui salário base + adicionais fixos cadastrados.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Status das Variáveis
                </span>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Turno Habitual:</span>
                    <span className="font-bold text-white">
                      {turnoTrabalho === 'noturno' ? `🌙 Noturno (${horasNoturnasTurnoFixo}h/mês)` : '☀️ Diurno'}
                    </span>
                  </div>
                  {turnoTrabalho === 'noturno' && (
                    <div className="flex justify-between text-slate-300">
                      <span>Adicional Noturno Fixo:</span>
                      <span className="font-bold text-purple-300">+ R$ {adicionalNoturnoFixoRs.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Dependentes IR:</span>
                    <span className="font-bold text-white">{dependentes}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Insalubridade:</span>
                    <span className="font-bold text-white">
                      {temInsalubridade ? `${grauInsalubridade}% (R$ ${adicionalInsalubridadeRs.toFixed(2)})` : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Periculosidade:</span>
                    <span className="font-bold text-white">
                      {temPericulosidade ? `30% (R$ ${adicionalPericulosidadeRs.toFixed(2)})` : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-950/60 border border-blue-800/60 rounded-xl">
                <p className="text-[11px] text-blue-200 leading-relaxed">
                  💡 <strong>Garantia de Memória:</strong> Ao salvar, estas informações alimentam automaticamente as simulações dos Módulos 2 (Salário do Mês), 3 (Férias) e 4 (Rescisão).
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
