import { describe, it, expect } from 'vitest';
import {
  calculateINSS,
  calculateIRRF,
  calculateMonthlyPaycheck,
  calcularAdicionais,
} from './cltMath';
import { UserProfile, MonthlyCalculationInput } from '../types';
import { DEFAULT_DEMO_PROFILE } from '../constants/defaultProfile';

describe('cltMath Engine Tests', () => {
  describe('calculateINSS', () => {
    it('deve calcular corretamente a primeira faixa do INSS (7.5%)', () => {
      const result = calculateINSS(1518.0);
      expect(result.valorTotalInss).toBeCloseTo(113.85, 2);
      expect(result.aliquotaEfetiva).toBeCloseTo(7.5, 2);
    });

    it('deve respeitar o teto máximo do INSS para salários elevados', () => {
      const resultHighSalary = calculateINSS(15000.0);
      expect(resultHighSalary.valorTotalInss).toBe(951.63);
    });

    it('deve calcular INSS progressivo para faixa intermediária', () => {
      const result = calculateINSS(3000.0);
      expect(result.valorTotalInss).toBeGreaterThan(200);
      expect(result.valorTotalInss).toBeLessThan(300);
      expect(result.valorTotalInss).toBeLessThanOrEqual(951.63);
    });
  });

  describe('calculateIRRF', () => {
    it('deve aplicar isenção de IRRF quando a base estiver na faixa de isenção', () => {
      // Salário de R$ 2.200 com INSS R$ 165
      // Base com desconto simplificado: 2200 - 165 - 564.80 = 1470.20 (<= 2259.20)
      const result = calculateIRRF(2200.0, 165.0, 0);
      expect(result.valorIrrf).toBe(0);
      expect(result.detalhes.isIsento).toBe(true);
    });

    it('deve calcular IRRF corretamente para salários tributados', () => {
      // Base bruta 6000, INSS teto 951.63, 0 dependentes
      const result = calculateIRRF(6000.0, 951.63, 0);
      expect(result.valorIrrf).toBeGreaterThan(0);
      expect(result.detalhes.isIsento).toBe(false);
    });

    it('deve considerar dependentes na dedução legal do IRRF', () => {
      const semDependentes = calculateIRRF(5000.0, 500.0, 0);
      const comDoisDependentes = calculateIRRF(5000.0, 500.0, 2);
      expect(comDoisDependentes.valorIrrf).toBeLessThanOrEqual(semDependentes.valorIrrf);
    });
  });

  describe('calcularAdicionais', () => {
    it('deve calcular adicionais de insalubridade e periculosidade corretamente', () => {
      const testProfile: UserProfile = {
        ...DEFAULT_DEMO_PROFILE,
        salarioBruto: 3000.0,
        temInsalubridade: true,
        grauInsalubridade: 20,
        temPericulosidade: true,
        salarioMinimoVigente: 1518.0,
      };

      const adicionais = calcularAdicionais(testProfile, 0);
      expect(adicionais.valorInsalubridade).toBeCloseTo(303.6, 2); // 20% de 1518
      expect(adicionais.valorPericulosidade).toBeCloseTo(900.0, 2); // 30% de 3000
      expect(adicionais.totalAdicionais).toBeCloseTo(1203.6, 2);
    });
  });

  describe('calculateMonthlyPaycheck', () => {
    it('deve calcular o holerite mensal completo para perfil padrão', () => {
      const input: MonthlyCalculationInput = {
        horasExtras50: 0,
        horasExtras100: 0,
        horasNoturnas: 0,
        faltasDias: 0,
        outrosProventos: 0,
        outrosDescontosEventuais: 0,
      };

      const result = calculateMonthlyPaycheck(DEFAULT_DEMO_PROFILE, input);

      expect(result.salarioBrutoBase).toBe(3850.0);
      expect(result.proventos.totalProventos).toBeGreaterThanOrEqual(3850.0);
      expect(result.descontos.valorInss).toBeGreaterThan(0);
      expect(result.salarioLiquido).toBeGreaterThan(0);
      expect(result.valorFgtsMes).toBeCloseTo(result.proventos.totalProventos * 0.08, 1);
    });

    it('deve incluir horas extras e DSR nos proventos', () => {
      const inputWithHE: MonthlyCalculationInput = {
        horasExtras50: 10,
        horasExtras100: 5,
        horasNoturnas: 0,
        faltasDias: 0,
        outrosProventos: 0,
        outrosDescontosEventuais: 0,
      };

      const result = calculateMonthlyPaycheck(DEFAULT_DEMO_PROFILE, inputWithHE);

      expect(result.proventos.valorHorasExtras50).toBeGreaterThan(0);
      expect(result.proventos.valorHorasExtras100).toBeGreaterThan(0);
      expect(result.proventos.valorDSR).toBeGreaterThan(0);
    });
  });
});
