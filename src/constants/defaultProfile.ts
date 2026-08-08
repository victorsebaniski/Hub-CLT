import { UserProfile } from '../types';
import { SALARIO_MINIMO_DEFAULT } from '../utils/cltMath';

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  id: 'usr_demo',
  name: 'Operador Fabril CLT',
  email: 'operador@clt.com.br',
  salarioBruto: 3850.0,
  dependentes: 1,
  descontoPlanoSaude: 180.0,
  descontoVT: 231.0, // 6%
  usarVTPercentual: true,
  descontoOutros: 50.0, // Sindicato
  escalaTrabalho: '220',
  diasUteisMes: 22,
  domingosFeriados: 4,
  temInsalubridade: true,
  grauInsalubridade: 20,
  temPericulosidade: false,
  salarioMinimoVigente: SALARIO_MINIMO_DEFAULT,
  updatedAt: new Date().toISOString(),
};
