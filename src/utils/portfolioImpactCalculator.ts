import { TokenItem } from '../types';
import { getAssetRiskEvaluation } from './aiRiskScorer';

export interface PortfolioRiskMetrics {
  totalValueUsd: number;
  weightedScore: number; // 0 - 100 (Lower = safer)
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskLabel: string;
  themeColor: string;
  weightedContractSecurity: number; // 0 - 100 (Higher = safer)
  weightedHistoricalVolatility: number; // 0 - 100 (Lower = safer)
  weightedLiquidityHealth: number; // 0 - 100 (Higher = deeper/healthier)
  maxConcentrationPercent: number;
  dominantTokenSymbol: string;
}

export interface SwapSimulationResult {
  fromToken: TokenItem;
  toToken: TokenItem;
  amountFrom: number;
  amountFromUsd: number;
  amountTo: number;
  amountToUsd: number;
  estimatedSlippagePercent: number;
  currentMetrics: PortfolioRiskMetrics;
  simulatedMetrics: PortfolioRiskMetrics;
  riskScoreDelta: number; // simulated - current
  riskScoreDeltaPercent: number;
  securityScoreDelta: number;
  volatilityScoreDelta: number;
  liquidityScoreDelta: number;
  concentrationDelta: number;
  verdict: 'favorable' | 'cautious' | 'high_risk' | 'neutral';
  verdictTitle: string;
  verdictDescription: string;
  bulletPoints: string[];
}

/**
 * Calculates current aggregate AI Risk metrics for a given portfolio token list.
 */
export const calculatePortfolioRisk = (tokens: TokenItem[]): PortfolioRiskMetrics => {
  const activeTokens = tokens.filter((t) => t.valueUsd > 0);
  const totalValueUsd = activeTokens.reduce((acc, t) => acc + t.valueUsd, 0);

  if (totalValueUsd === 0 || activeTokens.length === 0) {
    return {
      totalValueUsd: 0,
      weightedScore: 20,
      riskLevel: 'low',
      riskLabel: 'Riesgo Mínimo (Sin Activos)',
      themeColor: '#4edea3',
      weightedContractSecurity: 95,
      weightedHistoricalVolatility: 75,
      weightedLiquidityHealth: 95,
      maxConcentrationPercent: 0,
      dominantTokenSymbol: 'N/A',
    };
  }

  let weightedScoreAcc = 0;
  let weightedContractSecAcc = 0;
  let weightedVolatilityAcc = 0;
  let weightedLiquidityAcc = 0;
  let maxVal = -1;
  let dominantToken = activeTokens[0].symbol;

  for (const token of activeTokens) {
    const weight = token.valueUsd / totalValueUsd;
    const evalData = getAssetRiskEvaluation(token.symbol);

    weightedScoreAcc += evalData.score * weight;
    weightedContractSecAcc += evalData.breakdown.contractSecurity * weight;
    weightedVolatilityAcc += evalData.breakdown.historicalVolatility * weight;
    weightedLiquidityAcc += evalData.breakdown.liquidityHealth * weight;

    if (token.valueUsd > maxVal) {
      maxVal = token.valueUsd;
      dominantToken = token.symbol;
    }
  }

  const weightedScore = Math.round(weightedScoreAcc * 10) / 10;
  const maxConcentrationPercent = Math.round((maxVal / totalValueUsd) * 1000) / 10;

  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let riskLabel = 'Riesgo Global Bajo (Cartera Resiliente)';
  let themeColor = '#4edea3';

  if (weightedScore >= 60) {
    riskLevel = 'critical';
    riskLabel = 'Riesgo Crítico (Alta Exposición Especulativa)';
    themeColor = '#ff5449';
  } else if (weightedScore >= 40) {
    riskLevel = 'high';
    riskLabel = 'Riesgo Alto (Elevada Volatilidad)';
    themeColor = '#ff9800';
  } else if (weightedScore >= 25) {
    riskLevel = 'moderate';
    riskLabel = 'Riesgo Moderado (Crecimiento Activo)';
    themeColor = '#f3ba2f';
  } else {
    riskLevel = 'low';
    riskLabel = 'Riesgo Bajo (Alta Seguridad Institucional)';
    themeColor = '#4edea3';
  }

  return {
    totalValueUsd,
    weightedScore,
    riskLevel,
    riskLabel,
    themeColor,
    weightedContractSecurity: Math.round(weightedContractSecAcc * 10) / 10,
    weightedHistoricalVolatility: Math.round(weightedVolatilityAcc * 10) / 10,
    weightedLiquidityHealth: Math.round(weightedLiquidityAcc * 10) / 10,
    maxConcentrationPercent,
    dominantTokenSymbol: dominantToken,
  };
};

/**
 * Predicts and simulates how a specific swap will impact global AI risk.
 */
export const simulateSwapImpact = (
  currentTokens: TokenItem[],
  fromTokenId: string,
  toTokenId: string,
  amountFrom: number
): SwapSimulationResult => {
  const fromToken = currentTokens.find((t) => t.id === fromTokenId) || currentTokens[0];
  const toToken = currentTokens.find((t) => t.id === toTokenId) || currentTokens[1] || currentTokens[0];

  const clampedAmountFrom = Math.max(0, Math.min(amountFrom, fromToken.balance));
  const amountFromUsd = clampedAmountFrom * fromToken.priceUsd;

  // Slippage and fee estimation (0.05% fee + 0.05% typical DEX impact)
  const estimatedSlippagePercent = 0.08;
  const netReceivedFactor = 1 - estimatedSlippagePercent / 100;
  const amountToUsd = amountFromUsd * netReceivedFactor;
  const amountTo = toToken.priceUsd > 0 ? amountToUsd / toToken.priceUsd : 0;

  // Clone and simulate updated portfolio
  const simulatedTokens: TokenItem[] = currentTokens.map((t) => {
    if (t.id === fromToken.id) {
      const newBalance = Math.max(0, t.balance - clampedAmountFrom);
      return {
        ...t,
        balance: newBalance,
        valueUsd: newBalance * t.priceUsd,
      };
    }
    if (t.id === toToken.id) {
      const newBalance = t.balance + amountTo;
      return {
        ...t,
        balance: newBalance,
        valueUsd: newBalance * t.priceUsd,
      };
    }
    return { ...t };
  });

  const currentMetrics = calculatePortfolioRisk(currentTokens);
  const simulatedMetrics = calculatePortfolioRisk(simulatedTokens);

  const riskScoreDelta = Math.round((simulatedMetrics.weightedScore - currentMetrics.weightedScore) * 10) / 10;
  const riskScoreDeltaPercent =
    currentMetrics.weightedScore > 0
      ? Math.round((riskScoreDelta / currentMetrics.weightedScore) * 1000) / 10
      : 0;

  const securityScoreDelta =
    Math.round((simulatedMetrics.weightedContractSecurity - currentMetrics.weightedContractSecurity) * 10) / 10;
  const volatilityScoreDelta =
    Math.round((simulatedMetrics.weightedHistoricalVolatility - currentMetrics.weightedHistoricalVolatility) * 10) / 10;
  const liquidityScoreDelta =
    Math.round((simulatedMetrics.weightedLiquidityHealth - currentMetrics.weightedLiquidityHealth) * 10) / 10;
  const concentrationDelta =
    Math.round((simulatedMetrics.maxConcentrationPercent - currentMetrics.maxConcentrationPercent) * 10) / 10;

  // Derive intelligent AI verdict
  let verdict: 'favorable' | 'cautious' | 'high_risk' | 'neutral' = 'neutral';
  let verdictTitle = 'Impacto Neutral en la Estructura de Riesgo';
  let verdictDescription =
    'El intercambio preserva la relación de estabilidad y solvencia actual de la cartera sin desbalancear los pesos de riesgo.';
  const bulletPoints: string[] = [];

  if (riskScoreDelta <= -2.5) {
    verdict = 'favorable';
    verdictTitle = 'Optimización Favorable: Reducción de Riesgo IA';
    verdictDescription = `Rotar $${amountFromUsd.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })} USD de ${fromToken.symbol} hacia ${toToken.symbol} mejora el perfil de seguridad global en ${Math.abs(
      riskScoreDelta
    )} puntos (${Math.abs(riskScoreDeltaPercent)}%).`;

    bulletPoints.push(
      `Disminuye la vulnerabilidad de la cartera canalizando fondos a un activo con mayor índice de auditoría formal.`
    );
    bulletPoints.push(
      `Mejora la resiliencia ante caídas bruscas de mercado reduciendo la beta de volatilidad ponderada.`
    );
    if (toToken.symbol === 'USDC') {
      bulletPoints.push('Incrementa tu reserva de liquidez estable lista para aprovechar compras en soporte.');
    }
  } else if (riskScoreDelta >= 4.0) {
    verdict = 'high_risk';
    verdictTitle = 'Alerta: Aumento Considerado del Riesgo Global';
    verdictDescription = `La operación incrementa el puntaje de riesgo de tu cartera en +${riskScoreDelta} puntos (+${riskScoreDeltaPercent}%), aumentando la exposición a oscilaciones de mercado.`;

    bulletPoints.push(
      `Mayor exposición a la volatilidad histórica de ${toToken.symbol} sin amortiguación de activos de refugio.`
    );
    if (simulatedMetrics.maxConcentrationPercent > 60) {
      bulletPoints.push(
        `Alerta de concentración: ${simulatedMetrics.dominantTokenSymbol} representará el ${simulatedMetrics.maxConcentrationPercent}% del portafolio consolidado.`
      );
    }
    bulletPoints.push('Se sugiere mantener órdenes de corte de pérdidas o escalonar el intercambio en tramos menores.');
  } else if (riskScoreDelta > 0.8) {
    verdict = 'cautious';
    verdictTitle = 'Variación Táctica Moderada (+Exposición)';
    verdictDescription = `El riesgo ponderado aumenta ligeramente (+${riskScoreDelta} pts). Esta rotación es coherente para buscar rendimiento adicional asumiendo una prima de volatilidad calculada.`;

    bulletPoints.push(
      `El activo de destino ${toToken.symbol} posee liquidez DEX robusta pero mayor dispersión de precios en 30 días.`
    );
    bulletPoints.push(`La puntuación de contratos inteligentes se mantiene dentro de los rangos de tolerancia segura.`);
  } else {
    verdict = 'neutral';
    verdictTitle = 'Transición Equilibrada (Impacto Bajo)';
    verdictDescription = `El desplazamiento de riesgo es mínimo (Δ ${
      riskScoreDelta > 0 ? `+${riskScoreDelta}` : riskScoreDelta
    } pts). Ambos activos comparten estándares de seguridad semejantes.`;

    bulletPoints.push('La distribución de liquidez multi-cadena permanece balanceada.');
    bulletPoints.push('No se comprometen los parámetros de tolerancia a caídas sistémicas.');
  }

  return {
    fromToken,
    toToken,
    amountFrom: clampedAmountFrom,
    amountFromUsd,
    amountTo,
    amountToUsd,
    estimatedSlippagePercent,
    currentMetrics,
    simulatedMetrics,
    riskScoreDelta,
    riskScoreDeltaPercent,
    securityScoreDelta,
    volatilityScoreDelta,
    liquidityScoreDelta,
    concentrationDelta,
    verdict,
    verdictTitle,
    verdictDescription,
    bulletPoints,
  };
};
