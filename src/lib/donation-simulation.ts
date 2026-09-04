import { useState, useEffect } from "react";

export interface DonationSimulationState {
  currentAmount: number;
  targetAmount: number;
  remainingAmount: number;
  percent: number;
  minutesSinceLastDonation: number;
  formattedCurrent: string;
  formattedTarget: string;
  formattedRemaining: string;
}

export interface SimulationConfig {
  baseAmount: number;
  targetAmount: number;
  maxCycleAmount: number;
  stepIncrement: number;
  intervalMinutes: number;
}

/**
 * 1. Meta das Velas & Insumos do Oratório (Checkout de Vela):
 * - Meta semanal de R$ 500,00 para materiais e consagração de velas de 7 dias
 * - Base inicial: R$ 174,30 (~34,8% da meta)
 * - Teto do ciclo: R$ 252,55 (~50,5% da meta) -> Longe de bater, faltam sempre > R$ 247!
 * - Incremento: R$ 15,65 a cada 20 minutos
 */
export const CANDLES_GOAL_CONFIG: SimulationConfig = {
  baseAmount: 174.3,
  targetAmount: 500.0,
  maxCycleAmount: 252.55,
  stepIncrement: 15.65,
  intervalMinutes: 20,
};

/**
 * 2. Meta da Cirurgia de Catarata da Médium Milena (Modal e Página /ajuda-milena):
 * - Procedimento médico oftalmológico bilateral completo com lentes intraoculares
 * - Meta total: R$ 8.500,00
 * - Base inicial: R$ 3.124,50 (~36,7% da meta)
 * - Teto do ciclo: R$ 4.380,50 (~51,5% da meta) -> Longe de bater, faltam sempre > R$ 4.100!
 * - Incremento: R$ 31,40 a cada 20 minutos (doações fraternas humanitárias)
 */
export const SURGERY_GOAL_CONFIG: SimulationConfig = {
  baseAmount: 3124.5,
  targetAmount: 8500.0,
  maxCycleAmount: 4380.5,
  stepIncrement: 31.4,
  intervalMinutes: 20,
};

/**
 * Calcula a simulação determinística de doações com base no relógio real:
 * - Mantém o valor sempre em patamar realista (longe de bater a meta de 100%)
 * - Sobe a cada `intervalMinutes` o incremento configurado
 * - Ao alcançar o teto do ciclo (`maxCycleAmount`), reinicia suavemente no valor inicial (`baseAmount`).
 */
export function calculateDonationSimulation(
  baseAmount = 174.3,
  targetAmount = 500.0,
  stepIncrement = 15.65,
  intervalMinutes = 20,
  maxCycleAmount?: number,
  referenceTimestamp = Date.now()
): DonationSimulationState {
  const effectiveMax =
    maxCycleAmount && maxCycleAmount > baseAmount
      ? maxCycleAmount
      : baseAmount + (targetAmount - baseAmount) * 0.45;

  const totalSteps = Math.max(1, Math.round((effectiveMax - baseAmount) / stepIncrement));
  const intervalMs = intervalMinutes * 60 * 1000;
  // O ciclo dura (totalSteps + 1) * intervalMs para manter o valor do topo por 1 intervalo antes de reiniciar
  const cycleDurationMs = (totalSteps + 1) * intervalMs;

  const cycleTimeMs = referenceTimestamp % cycleDurationMs;
  const currentStep = Math.min(totalSteps, Math.floor(cycleTimeMs / intervalMs));
  const timeInCurrentStep = cycleTimeMs % intervalMs;

  let current = baseAmount + currentStep * stepIncrement;
  if (current > effectiveMax) {
    current = baseAmount;
  }
  current = Math.round(current * 100) / 100;

  const remaining = Math.max(0, Math.round((targetAmount - current) * 100) / 100);
  const percent = Math.min(100, Math.round((current / targetAmount) * 1000) / 10);
  const minutesSinceLastDonation = Math.max(
    1,
    Math.min(intervalMinutes - 1, Math.floor(timeInCurrentStep / 60000))
  );

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return {
    currentAmount: current,
    targetAmount,
    remainingAmount: remaining,
    percent,
    minutesSinceLastDonation,
    formattedCurrent: `R$ ${formatCurrency(current)}`,
    formattedTarget: `R$ ${formatCurrency(targetAmount)}`,
    formattedRemaining: `R$ ${formatCurrency(remaining)}`,
  };
}

/**
 * Hook dedicado para a Meta de Velas & Insumos do Oratório (Meta R$ 500,00)
 */
export function useCandlesGoalSimulation(): DonationSimulationState {
  const [state, setState] = useState<DonationSimulationState>(() =>
    calculateDonationSimulation(
      CANDLES_GOAL_CONFIG.baseAmount,
      CANDLES_GOAL_CONFIG.targetAmount,
      CANDLES_GOAL_CONFIG.stepIncrement,
      CANDLES_GOAL_CONFIG.intervalMinutes,
      CANDLES_GOAL_CONFIG.maxCycleAmount
    )
  );

  useEffect(() => {
    const update = () => {
      setState(
        calculateDonationSimulation(
          CANDLES_GOAL_CONFIG.baseAmount,
          CANDLES_GOAL_CONFIG.targetAmount,
          CANDLES_GOAL_CONFIG.stepIncrement,
          CANDLES_GOAL_CONFIG.intervalMinutes,
          CANDLES_GOAL_CONFIG.maxCycleAmount
        )
      );
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return state;
}

/**
 * Hook dedicado para a Meta da Cirurgia de Catarata da Milena (Meta R$ 8.500,00)
 */
export function useSurgeryGoalSimulation(): DonationSimulationState {
  const [state, setState] = useState<DonationSimulationState>(() =>
    calculateDonationSimulation(
      SURGERY_GOAL_CONFIG.baseAmount,
      SURGERY_GOAL_CONFIG.targetAmount,
      SURGERY_GOAL_CONFIG.stepIncrement,
      SURGERY_GOAL_CONFIG.intervalMinutes,
      SURGERY_GOAL_CONFIG.maxCycleAmount
    )
  );

  useEffect(() => {
    const update = () => {
      setState(
        calculateDonationSimulation(
          SURGERY_GOAL_CONFIG.baseAmount,
          SURGERY_GOAL_CONFIG.targetAmount,
          SURGERY_GOAL_CONFIG.stepIncrement,
          SURGERY_GOAL_CONFIG.intervalMinutes,
          SURGERY_GOAL_CONFIG.maxCycleAmount
        )
      );
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return state;
}

/**
 * Hook genérico compatível com chamadas personalizadas
 */
export function useDonationSimulation(
  baseAmount = 174.3,
  targetAmount = 500.0,
  stepIncrement = 15.65,
  intervalMinutes = 20,
  maxCycleAmount?: number
): DonationSimulationState {
  const [state, setState] = useState<DonationSimulationState>(() =>
    calculateDonationSimulation(
      baseAmount,
      targetAmount,
      stepIncrement,
      intervalMinutes,
      maxCycleAmount
    )
  );

  useEffect(() => {
    const update = () => {
      setState(
        calculateDonationSimulation(
          baseAmount,
          targetAmount,
          stepIncrement,
          intervalMinutes,
          maxCycleAmount
        )
      );
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [baseAmount, targetAmount, stepIncrement, intervalMinutes, maxCycleAmount]);

  return state;
}
