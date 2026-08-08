/**
 * Hub CLT - Core CLT Mathematical Engine
 * Accurate updated labor law calculations (2025/2026) for Brazilian CLT Workers.
 */

import {
  UserProfile,
  MonthlyCalculationInput,
  MonthlyCalculationResult,
  InssTier,
  IrrfTier,
  VacationInput,
  VacationResult,
  SeveranceInput,
  SeveranceResult,
} from '../types';

export const SALARIO_MINIMO_DEFAULT = 1518.0;

/**
 * Returns hours divisor based on worker schedule scale
 */
export function getDivisorEscala(escala: UserProfile['escalaTrabalho']): number {
  switch (escala) {
    case '220':
      return 220;
    case '180':
    case '12x36':
    case '2x2':
      return 180;
    case '150':
      return 150;
    default:
      return 220;
  }
}

/**
 * Progressive INSS Calculation 2025/2026
 */
export function calculateINSS(baseCalculo: number): {
  valorTotalInss: number;
  faixas: InssTier[];
  aliquotaEfetiva: number;
} {
  const faixasLimites = [
    { piso: 0, teto: 1518.0, aliquota: 0.075, label: 'Até R$ 1.518,00 (7,5%)' },
    { piso: 1518.0, teto: 2793.88, aliquota: 0.09, label: 'De R$ 1.518,01 até R$ 2.793,88 (9,0%)' },
    { piso: 2793.88, teto: 4190.83, aliquota: 0.12, label: 'De R$ 2.793,89 até R$ 4.190,83 (12,0%)' },
    { piso: 4190.83, teto: 8157.41, aliquota: 0.14, label: 'De R$ 4.190,84 até R$ 8.157,41 (14,0%)' },
  ];

  let valorTotal = 0;
  const faixasResult: InssTier[] = [];

  for (const f of faixasLimites) {
    if (baseCalculo > f.piso) {
      const baseFaixa = Math.min(baseCalculo, f.teto) - f.piso;
      const valorFaixa = baseFaixa * f.aliquota;
      valorTotal += valorFaixa;

      faixasResult.push({
        piso: f.piso,
        teto: f.teto,
        aliquota: f.aliquota * 100,
        valorCalculado: Number(valorFaixa.toFixed(2)),
        faixaTexto: f.label,
      });
    } else {
      faixasResult.push({
        piso: f.piso,
        teto: f.teto,
        aliquota: f.aliquota * 100,
        valorCalculado: 0,
        faixaTexto: f.label,
      });
    }
  }

  // Cap at max INSS ceiling (Teto INSS ~ R$ 951,63)
  const tetoMaximoInss = 951.63;
  if (valorTotal > tetoMaximoInss) {
    valorTotal = tetoMaximoInss;
  }

  const aliquotaEfetiva = baseCalculo > 0 ? (valorTotal / baseCalculo) * 100 : 0;

  return {
    valorTotalInss: Number(valorTotal.toFixed(2)),
    faixas: faixasResult,
    aliquotaEfetiva: Number(aliquotaEfetiva.toFixed(2)),
  };
}

/**
 * IRRF Calculation (Imposto de Renda Retido na Fonte)
 * Uses standard deductions or simplified discount depending on what is most advantageous
 */
export function calculateIRRF(
  baseBrutaParaIrrf: number,
  descontoInss: number,
  dependentesCount: number,
  outrasDeducoesLegais: number = 0
): {
  valorIrrf: number;
  detalhes: IrrfTier;
  aliquotaEfetiva: number;
} {
  const DEDUCAO_POR_DEPENDENTE = 189.59;
  const DESCONTO_SIMPLIFICADO_PADRAO = 564.8;

  // Deduction option A: Actual legal deductions (INSS + Dependents + Other)
  const deducoesLegais = descontoInss + dependentesCount * DEDUCAO_POR_DEPENDENTE + outrasDeducoesLegais;
  const baseCalculoLegais = Math.max(0, baseBrutaParaIrrf - deducoesLegais);

  // Deduction option B: Standard Simplified Deduction (INSS + R$ 564.80)
  const baseCalculoSimplificado = Math.max(0, baseBrutaParaIrrf - descontoInss - DESCONTO_SIMPLIFICADO_PADRAO);

  // Pick whichever base calculation is SMALLER (less tax)
  const usouSimplificado = baseCalculoSimplificado < baseCalculoLegais;
  const baseCalculoFinal = usouSimplificado ? baseCalculoSimplificado : baseCalculoLegais;

  let aliquota = 0;
  let deducaoTabela = 0;
  let isIsento = false;

  if (baseCalculoFinal <= 2259.2) {
    aliquota = 0;
    deducaoTabela = 0;
    isIsento = true;
  } else if (baseCalculoFinal <= 2826.65) {
    aliquota = 0.075;
    deducaoTabela = 169.44;
  } else if (baseCalculoFinal <= 3751.05) {
    aliquota = 0.15;
    deducaoTabela = 381.44;
  } else if (baseCalculoFinal <= 4664.68) {
    aliquota = 0.225;
    deducaoTabela = 662.77;
  } else {
    aliquota = 0.275;
    deducaoTabela = 896.0;
  }

  let valorImposto = baseCalculoFinal * aliquota - deducaoTabela;
  if (valorImposto < 0 || isIsento) {
    valorImposto = 0;
  }

  const aliquotaEfetiva = baseBrutaParaIrrf > 0 ? (valorImposto / baseBrutaParaIrrf) * 100 : 0;

  return {
    valorIrrf: Number(valorImposto.toFixed(2)),
    detalhes: {
      baseCalculo: Number(baseCalculoFinal.toFixed(2)),
      aliquota: aliquota * 100,
      deducaoTabela,
      valorImposto: Number(valorImposto.toFixed(2)),
      isIsento,
      usouDescontoSimplificado: usouSimplificado,
    },
    aliquotaEfetiva: Number(aliquotaEfetiva.toFixed(2)),
  };
}

/**
 * Auxiliary function to calculate labor additions (insalubridade, periculosidade, adicional noturno)
 */
export function calcularAdicionais(
  profile: UserProfile,
  inputHorasNoturnas: number = 0
): {
  valorInsalubridade: number;
  valorPericulosidade: number;
  valorAdicionalNoturno: number;
  horasNoturnasTotais: number;
  isTurnoNoturnoFixo: boolean;
  totalAdicionais: number;
} {
  const salarioMinimo = profile.salarioMinimoVigente || SALARIO_MINIMO_DEFAULT;
  const divisorEscala = getDivisorEscala(profile.escalaTrabalho);
  const valorHoraNormal = profile.salarioBruto / divisorEscala;

  // Insalubridade
  let valorInsalubridade = 0;
  if (profile.temInsalubridade) {
    const percent = (profile.grauInsalubridade || 20) / 100;
    valorInsalubridade = salarioMinimo * percent;
  }

  // Periculosidade
  let valorPericulosidade = 0;
  if (profile.temPericulosidade) {
    valorPericulosidade = profile.salarioBruto * 0.3;
  }

  // Turno Noturno Fixo & Horas Noturnas
  const isTurnoNoturnoFixo = profile.turnoTrabalho === 'noturno';
  const horasNoturnasFixoPerfil = isTurnoNoturnoFixo
    ? profile.horasNoturnasTurnoFixo && profile.horasNoturnasTurnoFixo > 0
      ? profile.horasNoturnasTurnoFixo
      : divisorEscala === 220
      ? 154
      : 140
    : 0;

  const horasNoturnasTotais = horasNoturnasFixoPerfil + inputHorasNoturnas;

  // Adicional Noturno (20% com hora noturna reduzida 52.5min => fator ~1.1428)
  const fatorHoraNoturna = 60 / 52.5;
  const valorAdicionalNoturno = horasNoturnasTotais * valorHoraNormal * 0.2 * fatorHoraNoturna;

  const totalAdicionais = valorInsalubridade + valorPericulosidade + valorAdicionalNoturno;

  return {
    valorInsalubridade,
    valorPericulosidade,
    valorAdicionalNoturno,
    horasNoturnasTotais,
    isTurnoNoturnoFixo,
    totalAdicionais,
  };
}

/**
 * Complete Monthly Paycheck Calculator (Modulo 2)
 */
export function calculateMonthlyPaycheck(
  profile: UserProfile,
  input: MonthlyCalculationInput
): MonthlyCalculationResult {
  const divisorEscala = getDivisorEscala(profile.escalaTrabalho);
  const valorHoraNormal = profile.salarioBruto / divisorEscala;

  // 1. Proventos e Adicionais
  const adicionais = calcularAdicionais(profile, input.horasNoturnas || 0);
  const {
    valorInsalubridade,
    valorPericulosidade,
    valorAdicionalNoturno,
    horasNoturnasTotais,
    isTurnoNoturnoFixo,
  } = adicionais;

  // Horas Extras 50% e 100%
  const valorHE50 = input.horasExtras50 * valorHoraNormal * 1.5;
  const valorHE100 = input.horasExtras100 * valorHoraNormal * 2.0;

  // DSR sobre Horas Extras = (Total HE / Dias Úteis) * Domingos e Feriados
  const totalHorasExtrasRs = valorHE50 + valorHE100;
  const diasUteis = profile.diasUteisMes || 22;
  const domingosFeriados = profile.domingosFeriados || 4;
  const valorDSR = diasUteis > 0 ? (totalHorasExtrasRs / diasUteis) * domingosFeriados : 0;

  const outrosProventos = input.outrosProventos || 0;

  const totalProventos =
    profile.salarioBruto +
    valorInsalubridade +
    valorPericulosidade +
    valorHE50 +
    valorHE100 +
    valorDSR +
    valorAdicionalNoturno +
    outrosProventos;

  // 2. Faltas (desconto por dia)
  const valorDiaNormal = profile.salarioBruto / 30;
  const valorFaltas = (input.faltasDias || 0) * valorDiaNormal;

  // Base para cálculo dos impostos
  const baseTributavel = Math.max(0, totalProventos - valorFaltas);

  // 3. Impostos (INSS e IRRF)
  const inssRes = calculateINSS(baseTributavel);
  const irrfRes = calculateIRRF(baseTributavel, inssRes.valorTotalInss, profile.dependentes);

  // 4. Descontos Fixos
  // Vale Transporte (Até 6% do salário bruto base ou o valor real informado)
  let valorVT = 0;
  if (profile.descontoVT > 0) {
    if (profile.usarVTPercentual) {
      const limite6Porcento = profile.salarioBruto * 0.06;
      valorVT = Math.min(limite6Porcento, profile.descontoVT);
    } else {
      valorVT = profile.descontoVT;
    }
  }

  const valorPlanoSaude = profile.descontoPlanoSaude || 0;
  const outrosDescontosFixos = profile.descontoOutros || 0;
  const outrosDescontosEventuais = input.outrosDescontosEventuais || 0;

  const totalDescontos =
    inssRes.valorTotalInss +
    irrfRes.valorIrrf +
    valorPlanoSaude +
    valorVT +
    valorFaltas +
    outrosDescontosFixos +
    outrosDescontosEventuais;

  const salarioLiquido = totalProventos - totalDescontos;

  // FGTS (8% recolhido pelo empregador sobre o total tributável)
  const valorFgtsMes = baseTributavel * 0.08;

  // 5. Adiantamento Salarial / Quinzena (Vale dia 15/20)
  const temAdiantamento = input.temAdiantamento !== undefined ? input.temAdiantamento : true;
  const percentualAdiantamento = input.percentualAdiantamento ?? 40;
  const valorQuinzena = temAdiantamento ? profile.salarioBruto * (percentualAdiantamento / 100) : 0;
  const valorFechamentoMes = Math.max(0, salarioLiquido - valorQuinzena);

  const alertaFaltasExcessivas = input.faltasDias > (profile.diasUteisMes || 22);

  return {
    salarioBrutoBase: profile.salarioBruto,
    valorHoraNormal: Number(valorHoraNormal.toFixed(2)),
    isTurnoNoturnoFixo,
    horasNoturnasTotais,
    alertaFaltasExcessivas,
    proventos: {
      salarioBase: profile.salarioBruto,
      valorHorasExtras50: Number(valorHE50.toFixed(2)),
      valorHorasExtras100: Number(valorHE100.toFixed(2)),
      valorDSR: Number(valorDSR.toFixed(2)),
      valorAdicionalNoturno: Number(valorAdicionalNoturno.toFixed(2)),
      valorInsalubridade: Number(valorInsalubridade.toFixed(2)),
      valorPericulosidade: Number(valorPericulosidade.toFixed(2)),
      outrosProventos: Number(outrosProventos.toFixed(2)),
      totalProventos: Number(totalProventos.toFixed(2)),
    },
    descontos: {
      valorInss: inssRes.valorTotalInss,
      inssFaixas: inssRes.faixas,
      valorIrrf: irrfRes.valorIrrf,
      irrfDetalhes: irrfRes.detalhes,
      valorPlanoSaude: Number(valorPlanoSaude.toFixed(2)),
      valorVT: Number(valorVT.toFixed(2)),
      valorFaltas: Number(valorFaltas.toFixed(2)),
      outrosDescontos: Number((outrosDescontosFixos + outrosDescontosEventuais).toFixed(2)),
      totalDescontos: Number(totalDescontos.toFixed(2)),
    },
    salarioLiquido: Number(salarioLiquido.toFixed(2)),
    valorFgtsMes: Number(valorFgtsMes.toFixed(2)),
    aliquotaEfetivaInss: inssRes.aliquotaEfetiva,
    aliquotaEfetivaIrrf: irrfRes.aliquotaEfetiva,
    adiantamento: {
      ativo: temAdiantamento,
      percentual: percentualAdiantamento,
      valorQuinzena: Number(valorQuinzena.toFixed(2)),
      valorFechamentoMes: Number(valorFechamentoMes.toFixed(2)),
    },
  };
}

/**
 * Vacation & Return Month Simulator (Modulo 3 - Raio-X das Férias)
 */
export function calculateVacation(profile: UserProfile, input: VacationInput): VacationResult {
  const salarioBase = profile.salarioBruto;

  // Additions calculation via shared helper
  const adicionais = calcularAdicionais(profile, 0);
  const {
    valorInsalubridade: adicionalInsalubridade,
    valorPericulosidade: adicionalPericulosidade,
    valorAdicionalNoturno: adicionalNoturnoFixo,
    totalAdicionais,
  } = adicionais;

  const salarioBaseComAdicionais = salarioBase + totalAdicionais;

  // Days of vacation gozo (can be 30, 20, 15, 14, 10, 5, etc.)
  const rawRequestedDays = input.diasFerias || 30;
  let requestedDays = rawRequestedDays;
  if (input.venderAbonoPecuniario) {
    requestedDays = Math.min(20, requestedDays > 20 ? requestedDays - 10 : requestedDays);
  }
  const diasGozo = Math.max(1, Math.min(30, requestedDays));
  const foiAjustado = rawRequestedDays < 1 || rawRequestedDays > 30;
  const diasAbono = input.venderAbonoPecuniario ? 10 : 0;
  const diasTrabalhadosMesRetorno = Math.max(0, 30 - diasGozo);

  // 1. Proventos das Férias
  const valorDiaSalario = salarioBaseComAdicionais / 30;
  const brutoFerias = valorDiaSalario * diasGozo;
  const tercoConstitucional = brutoFerias / 3;

  let abonoPecuniarioBruto = 0;
  let tercoAbonoPecuniario = 0;

  if (diasAbono > 0) {
    abonoPecuniarioBruto = valorDiaSalario * diasAbono;
    tercoAbonoPecuniario = abonoPecuniarioBruto / 3;
  }

  let adiantamento13 = 0;
  if (input.adiantarPrimeiraParcela13) {
    adiantamento13 = salarioBase / 2;
  }

  const totalProventosFerias =
    brutoFerias + tercoConstitucional + abonoPecuniarioBruto + tercoAbonoPecuniario + adiantamento13;

  // 2. Descontos das Férias
  // Abono Pecuniário and its 1/3 are EXEMPT from INSS and IRRF by law!
  const baseTributavelFerias = brutoFerias + tercoConstitucional;

  const inssFerias = calculateINSS(baseTributavelFerias).valorTotalInss;
  const irrfFerias = calculateIRRF(baseTributavelFerias, inssFerias, profile.dependentes).valorIrrf;

  const totalDescontosFerias = inssFerias + irrfFerias;
  const valorLiquidoReceberAntes = totalProventosFerias - totalDescontosFerias;

  // 3. "Vale da Volta" (Return Month Cash Flow Alert)
  // Gross salary earned for days worked in return month (30 - diasGozo)
  const previsaoSalarioMesRetornoBruto = valorDiaSalario * diasTrabalhadosMesRetorno;

  // Return Month Taxes (INSS and IRRF over the worked days salary)
  const inssMesRetorno = diasTrabalhadosMesRetorno > 0 ? calculateINSS(previsaoSalarioMesRetornoBruto).valorTotalInss : 0;
  const irrfMesRetorno =
    diasTrabalhadosMesRetorno > 0
      ? calculateIRRF(previsaoSalarioMesRetornoBruto, inssMesRetorno, profile.dependentes).valorIrrf
      : 0;

  // Vale Transporte (VT) Discount in Return Month:
  // IMPORTANTE: VT e VR/VA NÃO SÃO DESCONTADOS NOS DIAS DE FÉRIAS (pois não houve uso do transporte).
  // O desconto de VT é proporcional apenas aos dias trabalhados (ou 0 se não trabalhou no mês).
  let vtMesRetorno = 0;
  if (profile.descontoVT > 0 && diasTrabalhadosMesRetorno > 0) {
    if (profile.usarVTPercentual) {
      vtMesRetorno = previsaoSalarioMesRetornoBruto * (profile.descontoVT / 100);
    } else {
      vtMesRetorno = (profile.descontoVT / 30) * diasTrabalhadosMesRetorno;
    }
  }

  const planoSaudeMesRetorno = profile.descontoPlanoSaude || 0;
  const outrosFixosMesRetorno = profile.descontoOutros || 0;

  const totalDescontosMesRetorno =
    inssMesRetorno + irrfMesRetorno + vtMesRetorno + planoSaudeMesRetorno + outrosFixosMesRetorno;

  const saldoLiquidoMesRetorno = previsaoSalarioMesRetornoBruto - totalDescontosMesRetorno;

  const gastosFixosComprometidos = input.mesRetornoGastosFixos || 1800;
  const deficitFinanceiroEstimado = gastosFixosComprometidos - Math.max(0, saldoLiquidoMesRetorno);

  let alertaSeveridade: 'verde' | 'amarelo' | 'vermelho' = 'verde';
  let mensagemOrientacao = '';

  if (diasGozo === 30) {
    alertaSeveridade = 'vermelho';
    mensagemOrientacao = `ALERTA DE CAIXA CRÍTICO ("Vale da Volta"): Como você tirou 30 dias de férias, seu contracheque no mês do retorno será de R$ ${saldoLiquidoMesRetorno.toFixed(
      2
    )} (salário R$ 0 e descontos fixos de plano/outros). Guarde pelo menos R$ ${gastosFixosComprometidos.toFixed(
      2
    )} do valor recebido antes das férias!`;
  } else if (saldoLiquidoMesRetorno <= 0) {
    alertaSeveridade = 'vermelho';
    mensagemOrientacao = `ALERTA DE CAIXA REDUZIDO: Ao gozar ${diasGozo} dias de férias, você trabalhou ${diasTrabalhadosMesRetorno} dias no mês de retorno. Seu saldo líquido no contracheque será de R$ ${saldoLiquidoMesRetorno.toFixed(
      2
    )}. Guarde pelo menos R$ ${gastosFixosComprometidos.toFixed(2)} das suas férias para quitar suas despesas!`;
  } else if (saldoLiquidoMesRetorno < gastosFixosComprometidos) {
    alertaSeveridade = 'amarelo';
    mensagemOrientacao = `ATENÇÃO PARCIAL: Ao tirar ${diasGozo} dias de férias e trabalhar ${diasTrabalhadosMesRetorno} dias no mês de retorno, seu contracheque será de R$ ${saldoLiquidoMesRetorno.toFixed(
      2
    )}, inferior aos seus gastos informados de R$ ${gastosFixosComprometidos.toFixed(
      2
    )}. Guarde a diferença (R$ ${deficitFinanceiroEstimado.toFixed(2)}) do seu valor das férias!`;
  } else {
    alertaSeveridade = 'verde';
    mensagemOrientacao = `SAÚDE FINANCEIRA OK: Com ${diasGozo} dias de férias, você trabalhou ${diasTrabalhadosMesRetorno} dias no mês de retorno e receberá R$ ${saldoLiquidoMesRetorno.toFixed(
      2
    )} de salário líquido no contracheque, cobrindo suas despesas!`;
  }

  return {
    diasGozo,
    diasAbono,
    diasTrabalhadosMesRetorno,
    foiAjustado,
    diasFeriasOriginal: rawRequestedDays,
    proventos: {
      brutoFerias: Number(brutoFerias.toFixed(2)),
      tercoConstitucional: Number(tercoConstitucional.toFixed(2)),
      abonoPecuniarioBruto: Number(abonoPecuniarioBruto.toFixed(2)),
      tercoAbonoPecuniario: Number(tercoAbonoPecuniario.toFixed(2)),
      adiantamento13: Number(adiantamento13.toFixed(2)),
      totalProventos: Number(totalProventosFerias.toFixed(2)),
    },
    descontos: {
      inssFerias: Number(inssFerias.toFixed(2)),
      irrfFerias: Number(irrfFerias.toFixed(2)),
      descontosFixosProporcionais: Number((planoSaudeMesRetorno + outrosFixosMesRetorno).toFixed(2)),
      totalDescontos: Number(totalDescontosFerias.toFixed(2)),
    },
    valorLiquidoReceberAntes: Number(valorLiquidoReceberAntes.toFixed(2)),
    valeDaVolta: {
      diasTrabalhados: diasTrabalhadosMesRetorno,
      previsaoSalarioMesRetornoBruto: Number(previsaoSalarioMesRetornoBruto.toFixed(2)),
      inssMesRetorno: Number(inssMesRetorno.toFixed(2)),
      irrfMesRetorno: Number(irrfMesRetorno.toFixed(2)),
      vtMesRetorno: Number(vtMesRetorno.toFixed(2)),
      planoSaudeMesRetorno: Number(planoSaudeMesRetorno.toFixed(2)),
      outrosFixosMesRetorno: Number(outrosFixosMesRetorno.toFixed(2)),
      descontoAntecipadoFerias: Number((salarioBaseComAdicionais - previsaoSalarioMesRetornoBruto).toFixed(2)),
      saldoLiquidoMesRetorno: Number(saldoLiquidoMesRetorno.toFixed(2)),
      deficitFinanceiroEstimado: Number(deficitFinanceiroEstimado.toFixed(2)),
      alertaSeveridade,
      mensagemOrientacao,
    },
  };
}

function getExactYearsBetween(dtStart: Date, dtEnd: Date): number {
  if (dtEnd <= dtStart) return 0;
  let years = dtEnd.getFullYear() - dtStart.getFullYear();
  const m = dtEnd.getMonth() - dtStart.getMonth();
  if (m < 0 || (m === 0 && dtEnd.getDate() < dtStart.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

/**
 * Rescisão / Severance Simulator (Modulo 4)
 */
export function calculateSeverance(profile: UserProfile, input: SeveranceInput): SeveranceResult {
  const salarioBase = profile.salarioBruto;

  const dtAdmissao = new Date(input.dataAdmissao);
  const dtRescisao = new Date(input.dataRescisao);

  if (isNaN(dtAdmissao.getTime()) || isNaN(dtRescisao.getTime()) || dtRescisao <= dtAdmissao) {
    return {
      diasTrabalhadosMesRescisao: 0,
      mesesProporcionais13: 0,
      mesesProporcionaisFerias: 0,
      diasAvisoPrevioProporcional: 30,
      erroData: 'A data de rescisão deve ser posterior à data de admissão.',
      proventos: {
        saldoSalario: 0,
        avisoPrevioIndenizado: 0,
        decimoTerceiroProporcional: 0,
        feriasVencidas: 0,
        tercoFeriasVencidas: 0,
        feriasProporcionais: 0,
        tercoFeriasProporcionais: 0,
        totalProventos: 0,
      },
      descontos: {
        inssRescisao: 0,
        irrfRescisao: 0,
        avisoPrevioNaoCumpriu: 0,
        totalDescontos: 0,
      },
      liquidototalRescisorio: 0,
      fgts: {
        multaRescisoria40ou20: 0,
        podeSacarFgts: false,
        estimativaValorDisponivelSaque: 0,
      },
      seguroDesemprego: {
        direitoSeguro: false,
        qtdParcelasEstimada: 0,
        valorEstimadoParcela: 0,
      },
    };
  }

  // Calculates worked days in rescission month
  const diasTrabalhadosMesRescisao = dtRescisao.getDate();

  // Calculate tenure years using exact calendar dates
  const anosCompletos = getExactYearsBetween(dtAdmissao, dtRescisao);

  // Proportional 13th (Months in current calendar year with >= 15 days worked)
  const mesRescisao = dtRescisao.getMonth() + 1; // 1-12
  let meses13 = mesRescisao;
  if (diasTrabalhadosMesRescisao < 15) {
    meses13 = Math.max(0, mesRescisao - 1);
  }

  // Proportional Vacation months (Fraction of 12 since last anniversary)
  let mesesFeriasProporcionais = (dtRescisao.getMonth() - dtAdmissao.getMonth() + 12) % 12;
  if (dtRescisao.getDate() >= dtAdmissao.getDate()) {
    mesesFeriasProporcionais += 1;
  }
  if (mesesFeriasProporcionais > 12) mesesFeriasProporcionais = 12;
  if (mesesFeriasProporcionais === 0) mesesFeriasProporcionais = 12;

  // Proportional Notice Period (Lei 12.506: 30 days + 3 days per full year up to 90 days)
  const diasAvisoPrevioProporcional = Math.min(90, 30 + anosCompletos * 3);

  // Proventos calculations
  const valorDia = salarioBase / 30;

  let saldoSalario = valorDia * diasTrabalhadosMesRescisao;
  let avisoPrevioIndenizado = 0;
  let decimoTerceiroProporcional = (salarioBase / 12) * meses13;
  let feriasVencidas = input.temFeriasVencidas ? salarioBase * (input.qtdPeriodosFeriasVencidas || 1) : 0;
  let tercoFeriasVencidas = feriasVencidas / 3;
  let feriasProporcionais = (salarioBase / 12) * mesesFeriasProporcionais;
  let tercoFeriasProporcionais = feriasProporcionais / 3;

  let avisoNaoCumpriuDesconto = 0;
  let multaFgtsPercent = 0.4; // 40% default sem justa causa
  let podeSacarFgts = true;
  let direitoSeguroDesemprego = true;

  if (input.motivoRescisao === 'com_justa_causa') {
    avisoPrevioIndenizado = 0;
    decimoTerceiroProporcional = 0; // Loss of proportional 13th
    feriasProporcionais = 0; // Loss of proportional vacation
    tercoFeriasProporcionais = 0;
    multaFgtsPercent = 0;
    podeSacarFgts = false;
    direitoSeguroDesemprego = false;
  } else if (input.motivoRescisao === 'pedido_demissao') {
    avisoPrevioIndenizado = 0;
    if (input.avisoPrevio === 'dispensado') {
      avisoNaoCumpriuDesconto = salarioBase; // Desconto de 1 mês de aviso
    }
    multaFgtsPercent = 0;
    podeSacarFgts = false;
    direitoSeguroDesemprego = false;
  } else if (input.motivoRescisao === 'acordo_484a') {
    avisoPrevioIndenizado = (valorDia * diasAvisoPrevioProporcional) / 2; // 50% do aviso
    multaFgtsPercent = 0.2; // 20% de multa
    podeSacarFgts = true; // pode sacar até 80% do FGTS
    direitoSeguroDesemprego = false;
  } else {
    // sem_justa_causa
    if (input.avisoPrevio === 'indenizado') {
      avisoPrevioIndenizado = valorDia * diasAvisoPrevioProporcional;
    }
  }

  const totalProventosRescisao =
    saldoSalario +
    avisoPrevioIndenizado +
    decimoTerceiroProporcional +
    feriasVencidas +
    tercoFeriasVencidas +
    feriasProporcionais +
    tercoFeriasProporcionais;

  // Taxes on Rescisão
  const baseInssRescisao = saldoSalario + decimoTerceiroProporcional;
  const inssRescisao = calculateINSS(baseInssRescisao).valorTotalInss;

  const baseIrrfRescisao = baseInssRescisao - inssRescisao;
  const irrfRescisao = calculateIRRF(baseIrrfRescisao, inssRescisao, profile.dependentes).valorIrrf;

  const totalDescontosRescisao = inssRescisao + irrfRescisao + avisoNaoCumpriuDesconto;

  const liquidototalRescisorio = Math.max(0, totalProventosRescisao - totalDescontosRescisao);

  // FGTS
  const saldoFgtsBase = input.saldoFgtsAtual || 0;
  const multaRescisoria = saldoFgtsBase * multaFgtsPercent;
  const estimativaValorDisponivelSaque = podeSacarFgts ? saldoFgtsBase + multaRescisoria : 0;

  // Seguro Desemprego Estimate
  let qtdParcelas = 0;
  let valorParcela = 0;

  if (direitoSeguroDesemprego) {
    if (anosCompletos < 1) qtdParcelas = 3;
    else if (anosCompletos < 2) qtdParcelas = 4;
    else qtdParcelas = 5;

    // Standard insurance bracket formula
    if (salarioBase <= 2041.39) {
      valorParcela = salarioBase * 0.8;
    } else if (salarioBase <= 3402.65) {
      valorParcela = 1633.11 + (salarioBase - 2041.39) * 0.5;
    } else {
      valorParcela = 2313.74; // Teto seguro desemprego
    }
  }

  return {
    diasTrabalhadosMesRescisao,
    mesesProporcionais13: meses13,
    mesesProporcionaisFerias: mesesFeriasProporcionais,
    diasAvisoPrevioProporcional,
    proventos: {
      saldoSalario: Number(saldoSalario.toFixed(2)),
      avisoPrevioIndenizado: Number(avisoPrevioIndenizado.toFixed(2)),
      decimoTerceiroProporcional: Number(decimoTerceiroProporcional.toFixed(2)),
      feriasVencidas: Number(feriasVencidas.toFixed(2)),
      tercoFeriasVencidas: Number(tercoFeriasVencidas.toFixed(2)),
      feriasProporcionais: Number(feriasProporcionais.toFixed(2)),
      tercoFeriasProporcionais: Number(tercoFeriasProporcionais.toFixed(2)),
      totalProventos: Number(totalProventosRescisao.toFixed(2)),
    },
    descontos: {
      inssRescisao: Number(inssRescisao.toFixed(2)),
      irrfRescisao: Number(irrfRescisao.toFixed(2)),
      avisoPrevioNaoCumpriu: Number(avisoNaoCumpriuDesconto.toFixed(2)),
      totalDescontos: Number(totalDescontosRescisao.toFixed(2)),
    },
    liquidototalRescisorio: Number(liquidototalRescisorio.toFixed(2)),
    fgts: {
      multaRescisoria40ou20: Number(multaRescisoria.toFixed(2)),
      podeSacarFgts,
      estimativaValorDisponivelSaque: Number(estimativaValorDisponivelSaque.toFixed(2)),
    },
    seguroDesemprego: {
      direitoSeguro: direitoSeguroDesemprego,
      qtdParcelasEstimada: qtdParcelas,
      valorEstimadoParcela: Number(valorParcela.toFixed(2)),
    },
  };
}
