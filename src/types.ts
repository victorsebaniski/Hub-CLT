/**
 * Hub CLT - Types & Interfaces
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  salarioBruto: number;
  dependentes: number;
  descontoPlanoSaude: number;
  descontoVT: number; // Percentual 0 to 6% or fixed value
  usarVTPercentual: boolean; // if true uses 6% limit, else fixed amount
  descontoOutros: number; // Outros descontos fixos (ex: previdência privada, sindicato)
  escalaTrabalho: '220' | '180' | '150' | '12x36' | '2x2';
  turnoTrabalho?: 'diurno' | 'noturno'; // Shift: Diurno (Dia) or Noturno Fixo (Noite 22h-05h)
  horasNoturnasTurnoFixo?: number; // Estimated night hours/month for fixed night shift
  diasUteisMes: number; // default 22
  domingosFeriados: number; // default 4
  temInsalubridade: boolean;
  grauInsalubridade: 10 | 20 | 40; // 10%, 20%, 40% sobre salário mínimo
  temPericulosidade: boolean; // 30% sobre salário base
  salarioMinimoVigente: number; // Default R$ 1.518,00 (2025/2026)
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  refreshToken?: string;
  createdAt: string;
  profile: UserProfile;
}

export interface InssTier {
  piso: number;
  teto: number;
  aliquota: number;
  valorCalculado: number;
  faixaTexto: string;
}

export interface IrrfTier {
  baseCalculo: number;
  aliquota: number;
  deducaoTabela: number;
  valorImposto: number;
  isIsento: boolean;
  usouDescontoSimplificado: boolean;
}

export interface MonthlyCalculationInput {
  horasExtras50: number; // quantidade de horas
  horasExtras100: number; // quantidade de horas
  horasNoturnas: number; // quantidade de horas adicionais
  faltasDias: number; // dias de falta não justificadas
  outrosProventos: number; // bônus ou comissão no mês
  outrosDescontosEventuais: number; // vale farmácia, atrasos, etc.
  temAdiantamento?: boolean; // Se calcula adiantamento quinzenal (default true)
  percentualAdiantamento?: number; // Percentual da quinzena (ex: 40%)
}

export interface MonthlyCalculationResult {
  salarioBrutoBase: number;
  valorHoraNormal: number;
  isTurnoNoturnoFixo: boolean;
  horasNoturnasTotais: number;
  proventos: {
    salarioBase: number;
    valorHorasExtras50: number;
    valorHorasExtras100: number;
    valorDSR: number;
    valorAdicionalNoturno: number;
    valorInsalubridade: number;
    valorPericulosidade: number;
    outrosProventos: number;
    totalProventos: number;
  };
  descontos: {
    valorInss: number;
    inssFaixas: InssTier[];
    valorIrrf: number;
    irrfDetalhes: IrrfTier;
    valorPlanoSaude: number;
    valorVT: number;
    valorFaltas: number;
    outrosDescontos: number;
    totalDescontos: number;
  };
  salarioLiquido: number;
  valorFgtsMes: number; // 8% recolhido pelo empregador
  aliquotaEfetivaInss: number;
  aliquotaEfetivaIrrf: number;
  // Detalhamento de Adiantamento Salarial / Quinzena vs Fechamento do Mês
  adiantamento: {
    ativo: boolean;
    percentual: number;
    valorQuinzena: number; // Valor pago no dia 15/20 sem descontos (ex: 40% do salário base)
    valorFechamentoMes: number; // Saldo líquido final pago no dia 30 / 5º dia útil
  };
  alertaFaltasExcessivas?: boolean;
}

export interface VacationInput {
  diasFerias: number; // Qtd de dias de férias a gozar (ex: 30, 20, 15, 14, 10, 5)
  venderAbonoPecuniario: boolean; // 10 dias vendidos em dinheiro
  adiantarPrimeiraParcela13: boolean; // Adiantar 50% do 13º
  mesRetornoGastosFixos: number; // Gastos fixos para planejar o vale da volta
}

export interface VacationResult {
  diasGozo: number;
  diasAbono: number;
  diasTrabalhadosMesRetorno: number;
  foiAjustado?: boolean;
  diasFeriasOriginal?: number;
  proventos: {
    brutoFerias: number; // Salário relativo aos dias de férias
    tercoConstitucional: number; // 1/3 sobre férias
    abonoPecuniarioBruto: number; // 10 dias brutos
    tercoAbonoPecuniario: number; // 1/3 do abono
    adiantamento13: number; // 50% do 13º se marcado
    totalProventos: number;
  };
  descontos: {
    inssFerias: number;
    irrfFerias: number;
    descontosFixosProporcionais: number;
    totalDescontos: number;
  };
  valorLiquidoReceberAntes: number; // Recebido 2 dias antes de sair
  valeDaVolta: {
    diasTrabalhados: number;
    previsaoSalarioMesRetornoBruto: number; // Salário proporcional aos dias trabalhados
    inssMesRetorno: number;
    irrfMesRetorno: number;
    vtMesRetorno: number; // VT proporcional apenas aos dias trabalhados (0 nos dias de férias)
    planoSaudeMesRetorno: number;
    outrosFixosMesRetorno: number;
    descontoAntecipadoFerias: number; // O valor proporcional de férias já antecipado
    saldoLiquidoMesRetorno: number; // O contracheque no mês do retorno
    deficitFinanceiroEstimado: number; // Comparado aos gastos fixos
    alertaSeveridade: 'verde' | 'amarelo' | 'vermelho';
    mensagemOrientacao: string;
  };
}

export interface SeveranceInput {
  dataAdmissao: string;
  dataRescisao: string;
  motivoRescisao: 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo_484a';
  avisoPrevio: 'trabalhado' | 'indenizado' | 'dispensado';
  saldoFgtsAtual: number;
  temFeriasVencidas: boolean;
  qtdPeriodosFeriasVencidas: number; // Ex: 1 ou 2
}

export interface SeveranceResult {
  diasTrabalhadosMesRescisao: number;
  mesesProporcionais13: number;
  mesesProporcionaisFerias: number;
  diasAvisoPrevioProporcional: number;
  erroData?: string;
  proventos: {
    saldoSalario: number;
    avisoPrevioIndenizado: number;
    decimoTerceiroProporcional: number;
    feriasVencidas: number;
    tercoFeriasVencidas: number;
    feriasProporcionais: number;
    tercoFeriasProporcionais: number;
    totalProventos: number;
  };
  descontos: {
    inssRescisao: number;
    irrfRescisao: number;
    avisoPrevioNaoCumpriu: number; // se pediu demissao e nao cumpriu
    totalDescontos: number;
  };
  liquidototalRescisorio: number;
  fgts: {
    multaRescisoria40ou20: number;
    podeSacarFgts: boolean;
    estimativaValorDisponivelSaque: number;
  };
  seguroDesemprego: {
    direitoSeguro: boolean;
    qtdParcelasEstimada: number;
    valorEstimadoParcela: number;
  };
}

export interface CalculationHistoryItem {
  id: string;
  userId: string;
  type: 'mensal' | 'ferias' | 'rescisao';
  title: string;
  date: string;
  summaryText: string;
  valorLiquidoPrincipal: number;
  detailsData:
    | { result: MonthlyCalculationResult }
    | { result: VacationResult }
    | { result: SeveranceResult }
    | MonthlyCalculationResult
    | VacationResult
    | SeveranceResult;
}
