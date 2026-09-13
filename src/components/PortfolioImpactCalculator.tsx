import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TokenItem,
} from '../types';
import { TokenLogo } from './TokenLogo';
import { AiRiskBadge } from './AiRiskBadge';
import {
  simulateSwapImpact,
  calculatePortfolioRisk,
  SwapSimulationResult,
} from '../utils/portfolioImpactCalculator';
import {
  BrainCircuit,
  ArrowRightLeft,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PortfolioImpactCalculatorProps {
  tokens: TokenItem[];
  onOpenActionModal: (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => void;
  onShowToast: (title: string, message: string) => void;
}

export const PortfolioImpactCalculator: React.FC<PortfolioImpactCalculatorProps> = ({
  tokens,
  onOpenActionModal,
  onShowToast,
}) => {
  const availableTokens = useMemo(() => tokens.filter((t) => t.priceUsd > 0), [tokens]);

  const [fromTokenId, setFromTokenId] = useState<string>(() => {
    // Default to a token with positive balance (e.g. sol or eth)
    const solToken = availableTokens.find((t) => t.symbol === 'SOL');
    if (solToken && solToken.balance > 0) return solToken.id;
    return availableTokens[0]?.id || 'eth';
  });

  const [toTokenId, setToTokenId] = useState<string>(() => {
    const usdcToken = availableTokens.find((t) => t.symbol === 'USDC');
    if (usdcToken) return usdcToken.id;
    return availableTokens[1]?.id || availableTokens[0]?.id || 'usdc-arb';
  });

  const fromToken = useMemo(() => {
    return availableTokens.find((t) => t.id === fromTokenId) || availableTokens[0];
  }, [availableTokens, fromTokenId]);

  const toToken = useMemo(() => {
    return availableTokens.find((t) => t.id === toTokenId) || availableTokens[1] || availableTokens[0];
  }, [availableTokens, toTokenId]);

  const [percentSelection, setPercentSelection] = useState<number>(50);
  const [customAmountStr, setCustomAmountStr] = useState<string>(() => {
    const defaultAmount = fromToken ? (fromToken.balance * 0.5) : 0;
    return defaultAmount > 0 ? defaultAmount.toFixed(4) : '0';
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Sync custom input when percentage changes or token changes
  const handleSelectPercentage = (pct: number) => {
    setPercentSelection(pct);
    if (fromToken) {
      const calculated = (fromToken.balance * (pct / 100));
      setCustomAmountStr(calculated > 0 ? calculated.toFixed(4) : '0');
    }
  };

  const handleAmountInputChange = (val: string) => {
    setCustomAmountStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && fromToken && fromToken.balance > 0) {
      const calculatedPct = Math.round((parsed / fromToken.balance) * 100);
      setPercentSelection(Math.min(100, Math.max(0, calculatedPct)));
    }
  };

  const handleSwitchTokens = () => {
    const prevFrom = fromTokenId;
    const prevTo = toTokenId;
    setFromTokenId(prevTo);
    setToTokenId(prevFrom);

    const newFromToken = availableTokens.find((t) => t.id === prevTo);
    if (newFromToken) {
      const newAmt = newFromToken.balance * (percentSelection / 100);
      setCustomAmountStr(newAmt > 0 ? newAmt.toFixed(4) : '0');
    }
    onShowToast('Simulador Invertido', `Ahora analizando venta de ${toToken.symbol} por ${fromToken.symbol}`);
  };

  const handleSelectPreset = (scenarioName: string, fromSym: string, toSym: string, pct: number) => {
    const fToken = availableTokens.find((t) => t.symbol === fromSym);
    const tToken = availableTokens.find((t) => t.symbol === toSym);

    if (fToken && tToken) {
      setFromTokenId(fToken.id);
      setToTokenId(tToken.id);
      setPercentSelection(pct);
      const calculated = fToken.balance * (pct / 100);
      setCustomAmountStr(calculated > 0 ? calculated.toFixed(4) : '0');
      onShowToast(`Escenario: ${scenarioName}`, `Simulando cambio del ${pct}% de ${fromSym} a ${toSym}`);
    }
  };

  const numericAmountFrom = useMemo(() => {
    const parsed = parseFloat(customAmountStr);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, fromToken?.balance || 0));
  }, [customAmountStr, fromToken]);

  // Execute simulation
  const simulation: SwapSimulationResult = useMemo(() => {
    return simulateSwapImpact(availableTokens, fromTokenId, toTokenId, numericAmountFrom);
  }, [availableTokens, fromTokenId, toTokenId, numericAmountFrom]);

  // Overall risk metrics
  const { currentMetrics, simulatedMetrics, riskScoreDelta, riskScoreDeltaPercent } = simulation;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#191b23] via-[#1b1e26] to-[#21242d] border border-[#4cd7f6]/40 shadow-xl">
      {/* Top Ambient Glow Lines */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#4cd7f6] via-[#4edea3] to-[#805ad5]" />

      {/* Header bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-[#3d494c]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6] shrink-0 shadow-inner">
            <BrainCircuit className="w-5 h-5 text-[#4cd7f6] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#e1e2ec] tracking-tight">
                Calculadora de Impacto en Portafolio
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 text-[10px] font-code-sm font-bold">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Simulador IA</span>
              </span>
            </div>
            <p className="text-xs text-[#bcc9cd] mt-0.5 leading-relaxed">
              Predice la variación exacta del riesgo ponderado, volatilidad y contratos inteligentes antes de ejecutar un swap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#e1e2ec] transition-all cursor-pointer"
            title={isCollapsed ? 'Expandir calculadora' : 'Minimizar calculadora'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 sm:p-5 space-y-5"
          >
            {/* Quick Scenario Preset Chips */}
            <div>
              <span className="text-[11px] font-semibold text-[#869397] uppercase tracking-wider font-code-sm block mb-2">
                Escenarios Rápidos de Prueba
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Cobertura Defensiva', 'SOL', 'USDC', 50)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] border border-[#3d494c]/50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm">🛡️</span>
                  <span>50% SOL ➔ USDC (Defensivo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Consolidación ETH', 'POL', 'ETH', 100)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] border border-[#3d494c]/50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm">💎</span>
                  <span>100% POL ➔ ETH (Calidad AAA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Rotación Crecimiento', 'USDC', 'SOL', 35)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] border border-[#3d494c]/50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm">⚡</span>
                  <span>35% USDC ➔ SOL (Alfa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Infraestructura Oráculos', 'ETH', 'LINK', 20)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] border border-[#3d494c]/50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm">🌐</span>
                  <span>20% ETH ➔ LINK (Oráculo)</span>
                </button>
              </div>
            </div>

            {/* Interactive Simulation Controls (From -> Switch -> To) */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
              {/* Token Origen (Vender) */}
              <div className="rounded-xl bg-[#10131a] p-3.5 border border-[#3d494c]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#bcc9cd] uppercase tracking-wider font-code-sm">
                    1. Vender / Saliente
                  </span>
                  <span className="text-[11px] text-[#869397] font-code-sm">
                    Saldo:{' '}
                    <span className="text-[#e1e2ec] font-semibold">
                      {fromToken.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {fromToken.symbol}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative min-w-[130px]">
                    <select
                      value={fromTokenId}
                      onChange={(e) => {
                        setFromTokenId(e.target.value);
                        const sel = availableTokens.find((t) => t.id === e.target.value);
                        if (sel) {
                          const newAmt = sel.balance * (percentSelection / 100);
                          setCustomAmountStr(newAmt > 0 ? newAmt.toFixed(4) : '0');
                        }
                      }}
                      className="w-full appearance-none bg-[#272a32] hover:bg-[#32353d] border border-[#3d494c] text-[#e1e2ec] font-bold text-xs rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:border-[#4cd7f6] cursor-pointer"
                    >
                      {availableTokens.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === toTokenId}>
                          {t.symbol} - {t.name} ({t.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#bcc9cd] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={fromToken.balance}
                      value={customAmountStr}
                      onChange={(e) => handleAmountInputChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1b1e26] border border-[#3d494c]/60 rounded-lg px-3 py-2 text-right font-code-sm text-sm text-[#e1e2ec] font-semibold focus:outline-none focus:border-[#4cd7f6]"
                    />
                    <div className="text-[10px] text-[#869397] font-code-sm text-right mt-0.5">
                      ≈ ${(numericAmountFrom * fromToken.priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                  </div>
                </div>

                {/* Percentage Quick Selector */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSelectPercentage(pct)}
                      className={`flex-1 py-1 text-center rounded text-[11px] font-code-sm font-semibold transition-all cursor-pointer ${
                        percentSelection === pct
                          ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                          : 'bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd]'
                      }`}
                    >
                      {pct === 100 ? 'MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[#869397]">
                  <span>Riesgo Actual:</span>
                  <AiRiskBadge symbol={fromToken.symbol} size="sm" />
                </div>
              </div>

              {/* Central Swap Switch Action */}
              <div className="flex justify-center my-1 md:my-0">
                <button
                  type="button"
                  onClick={handleSwitchTokens}
                  className="w-10 h-10 rounded-full bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] hover:text-[#4edea3] border border-[#3d494c]/60 flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:rotate-180 duration-300 cursor-pointer"
                  title="Invertir dirección de tokens para la simulación"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Token Destino (Recibir) */}
              <div className="rounded-xl bg-[#10131a] p-3.5 border border-[#3d494c]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#bcc9cd] uppercase tracking-wider font-code-sm">
                    2. Recibir / Destino
                  </span>
                  <span className="text-[11px] text-[#869397] font-code-sm">
                    Precio: <span className="text-[#e1e2ec]">${toToken.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative min-w-[130px]">
                    <select
                      value={toTokenId}
                      onChange={(e) => setToTokenId(e.target.value)}
                      className="w-full appearance-none bg-[#272a32] hover:bg-[#32353d] border border-[#3d494c] text-[#e1e2ec] font-bold text-xs rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:border-[#4edea3] cursor-pointer"
                    >
                      {availableTokens.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === fromTokenId}>
                          {t.symbol} - {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#bcc9cd] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex-1 rounded-lg bg-[#1b1e26] border border-[#3d494c]/60 px-3 py-2 text-right">
                    <div className="font-code-sm text-sm text-[#4edea3] font-bold">
                      +{simulation.amountTo.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </div>
                    <div className="text-[10px] text-[#869397] font-code-sm mt-0.5">
                      ≈ ${simulation.amountToUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[#869397]">
                  <span>Ruta & Slippage:</span>
                  <span className="text-[#bcc9cd] font-code-sm font-semibold">
                    1inch Router ({simulation.estimatedSlippagePercent}% imp.)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[#869397]">
                  <span>Riesgo Destino:</span>
                  <AiRiskBadge symbol={toToken.symbol} size="sm" />
                </div>
              </div>
            </div>

            {/* PREDICTIVE RISK OUTCOME SPOTLIGHT CARD */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#10131a] via-[#161922] to-[#12151d] border border-[#3d494c]/60 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#e1e2ec] uppercase font-code-sm tracking-wider">
                    Pronóstico de Riesgo IA de la Cartera
                  </span>
                  <span className="text-[10px] text-[#869397] font-code-sm">
                    (Escala 0 = Máxima Seguridad, 100 = Riesgo Crítico)
                  </span>
                </div>

                {/* Delta Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-code-sm font-bold border ${
                    riskScoreDelta < -0.2
                      ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/40'
                      : riskScoreDelta > 0.5
                      ? 'bg-[#ff9800]/15 text-[#ffb74d] border-[#ff9800]/40'
                      : 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/40'
                  }`}
                >
                  {riskScoreDelta < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-[#4edea3]" />
                  ) : riskScoreDelta > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#ffb74d]" />
                  ) : (
                    <Activity className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {riskScoreDelta > 0 ? `+${riskScoreDelta}` : riskScoreDelta} pts ({riskScoreDeltaPercent > 0 ? `+${riskScoreDeltaPercent}%` : `${riskScoreDeltaPercent}%`})
                  </span>
                  <span className="text-[10px] opacity-85 font-normal">
                    {riskScoreDelta < -0.2
                      ? '• Más Seguro'
                      : riskScoreDelta > 0.5
                      ? '• Mayor Exposición'
                      : '• Neutro'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Dual Score Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Current State */}
                <div className="rounded-xl bg-[#1b1e26] p-3.5 border border-[#3d494c]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#bcc9cd] uppercase font-code-sm">
                      Cartera Actual
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold font-code-sm"
                      style={{ backgroundColor: `${currentMetrics.themeColor}20`, color: currentMetrics.themeColor }}
                    >
                      {currentMetrics.riskLabel.split('(')[0].trim()}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-code-lg font-extrabold text-[#e1e2ec]">
                      {currentMetrics.weightedScore}
                    </span>
                    <span className="text-xs text-[#869397] font-code-sm">/ 100</span>
                  </div>

                  <div className="w-full bg-[#10131a] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, currentMetrics.weightedScore))}%`,
                        backgroundColor: currentMetrics.themeColor,
                      }}
                    />
                  </div>

                  <div className="text-[10px] text-[#869397] flex justify-between pt-0.5">
                    <span>Activo principal:</span>
                    <span className="text-[#e1e2ec] font-semibold font-code-sm">
                      {currentMetrics.dominantTokenSymbol} ({currentMetrics.maxConcentrationPercent}%)
                    </span>
                  </div>
                </div>

                {/* Simulated Projected State */}
                <div className="rounded-xl bg-[#1b1e26] p-3.5 border border-[#4cd7f6]/40 shadow-inner space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg bg-[#4cd7f6]/20 border-l border-b border-[#4cd7f6]/30 text-[9px] font-code-sm text-[#4cd7f6] font-bold">
                    PROYECCIÓN
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#4cd7f6] uppercase font-code-sm">
                      Post-Swap Simulado
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold font-code-sm"
                      style={{ backgroundColor: `${simulatedMetrics.themeColor}20`, color: simulatedMetrics.themeColor }}
                    >
                      {simulatedMetrics.riskLabel.split('(')[0].trim()}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-code-lg font-extrabold"
                      style={{ color: simulatedMetrics.themeColor }}
                    >
                      {simulatedMetrics.weightedScore}
                    </span>
                    <span className="text-xs text-[#869397] font-code-sm">/ 100</span>
                    <span className="text-xs font-bold font-code-sm ml-auto text-[#e1e2ec]">
                      {riskScoreDelta < 0 ? (
                        <span className="text-[#4edea3]">↓ {Math.abs(riskScoreDelta)} pts</span>
                      ) : riskScoreDelta > 0 ? (
                        <span className="text-[#ffb74d]">↑ +{riskScoreDelta} pts</span>
                      ) : (
                        <span className="text-[#4cd7f6]">= Sin cambio</span>
                      )}
                    </span>
                  </div>

                  <div className="w-full bg-[#10131a] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, simulatedMetrics.weightedScore))}%`,
                        backgroundColor: simulatedMetrics.themeColor,
                      }}
                    />
                  </div>

                  <div className="text-[10px] text-[#869397] flex justify-between pt-0.5">
                    <span>Nueva concentración:</span>
                    <span className="text-[#e1e2ec] font-semibold font-code-sm">
                      {simulatedMetrics.dominantTokenSymbol} ({simulatedMetrics.maxConcentrationPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* DUAL POSITION RISK SPECTRUM GAUGE */}
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#869397] font-code-sm">
                  <span>Espectro de Riesgo Global</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                      0-25 Bajo
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#f3ba2f]" />
                      26-40 Moderado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff9800]" />
                      41-60 Alto
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff5449]" />
                      61+ Crítico
                    </span>
                  </div>
                </div>

                <div className="relative h-4 rounded-full bg-gradient-to-r from-[#4edea3] via-[#f3ba2f] to-[#ff5449] opacity-85 shadow-inner">
                  {/* Current Marker */}
                  <div
                    className="absolute -top-1 bottom-0 w-3 -ml-1.5 h-6 rounded-sm bg-white border-2 border-[#10131a] shadow-md transition-all duration-500 z-10"
                    style={{ left: `${Math.min(97, Math.max(3, currentMetrics.weightedScore))}%` }}
                    title={`Puntaje Actual: ${currentMetrics.weightedScore}`}
                  >
                    <div className="w-full h-full bg-[#10131a] rounded-[1px] flex items-center justify-center">
                      <span className="w-1 h-2 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Simulated Marker */}
                  <div
                    className="absolute -top-1 bottom-0 w-3 -ml-1.5 h-6 rounded-sm bg-[#4cd7f6] border-2 border-[#003640] shadow-md transition-all duration-500 z-20"
                    style={{ left: `${Math.min(97, Math.max(3, simulatedMetrics.weightedScore))}%` }}
                    title={`Puntaje Simulado: ${simulatedMetrics.weightedScore}`}
                  >
                    <div className="w-full h-full bg-[#4cd7f6] rounded-[1px] flex items-center justify-center">
                      <span className="w-1 h-2 bg-[#003640] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#869397] px-0.5">
                  <span className="flex items-center gap-1 text-[#e1e2ec]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Marcador Blanco: Riesgo Actual ({currentMetrics.weightedScore})
                  </span>
                  <span className="flex items-center gap-1 text-[#4cd7f6] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                    Marcador Cyan: Post-Swap ({simulatedMetrics.weightedScore})
                  </span>
                </div>
              </div>
            </div>

            {/* MULTIDIMENSIONAL PILLARS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Pillar 1: Contract Security */}
              <div className="p-3 rounded-xl bg-[#10131a] border border-[#3d494c]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#bcc9cd] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>Seguridad Contratos</span>
                  </span>
                  <span
                    className={`text-[10px] font-code-sm font-bold ${
                      simulation.securityScoreDelta >= 0 ? 'text-[#4edea3]' : 'text-[#ff9800]'
                    }`}
                  >
                    {simulation.securityScoreDelta >= 0 ? `+${simulation.securityScoreDelta}%` : `${simulation.securityScoreDelta}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 font-code-sm">
                  <span className="text-sm font-bold text-[#e1e2ec]">
                    {simulatedMetrics.weightedContractSecurity}%
                  </span>
                  <span className="text-[10px] text-[#869397]">
                    (antes {currentMetrics.weightedContractSecurity}%)
                  </span>
                </div>
                <div className="w-full bg-[#272a32] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#4edea3] rounded-full transition-all"
                    style={{ width: `${simulatedMetrics.weightedContractSecurity}%` }}
                  />
                </div>
              </div>

              {/* Pillar 2: Historical Volatility */}
              <div className="p-3 rounded-xl bg-[#10131a] border border-[#3d494c]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#bcc9cd] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#4cd7f6]" />
                    <span>Volatilidad Beta</span>
                  </span>
                  <span
                    className={`text-[10px] font-code-sm font-bold ${
                      simulation.volatilityScoreDelta <= 0 ? 'text-[#4edea3]' : 'text-[#ffb74d]'
                    }`}
                  >
                    {simulation.volatilityScoreDelta >= 0 ? `+${simulation.volatilityScoreDelta}%` : `${simulation.volatilityScoreDelta}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 font-code-sm">
                  <span className="text-sm font-bold text-[#e1e2ec]">
                    {simulatedMetrics.weightedHistoricalVolatility}%
                  </span>
                  <span className="text-[10px] text-[#869397]">
                    (antes {currentMetrics.weightedHistoricalVolatility}%)
                  </span>
                </div>
                <div className="w-full bg-[#272a32] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#4cd7f6] rounded-full transition-all"
                    style={{ width: `${simulatedMetrics.weightedHistoricalVolatility}%` }}
                  />
                </div>
              </div>

              {/* Pillar 3: DEX Liquidity Depth */}
              <div className="p-3 rounded-xl bg-[#10131a] border border-[#3d494c]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#bcc9cd] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#acedff]" />
                    <span>Salud Liquidez</span>
                  </span>
                  <span
                    className={`text-[10px] font-code-sm font-bold ${
                      simulation.liquidityScoreDelta >= 0 ? 'text-[#4edea3]' : 'text-[#ff9800]'
                    }`}
                  >
                    {simulation.liquidityScoreDelta >= 0 ? `+${simulation.liquidityScoreDelta}%` : `${simulation.liquidityScoreDelta}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 font-code-sm">
                  <span className="text-sm font-bold text-[#e1e2ec]">
                    {simulatedMetrics.weightedLiquidityHealth}%
                  </span>
                  <span className="text-[10px] text-[#869397]">
                    (antes {currentMetrics.weightedLiquidityHealth}%)
                  </span>
                </div>
                <div className="w-full bg-[#272a32] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#acedff] rounded-full transition-all"
                    style={{ width: `${simulatedMetrics.weightedLiquidityHealth}%` }}
                  />
                </div>
              </div>

              {/* Pillar 4: Dominant Asset Concentration */}
              <div className="p-3 rounded-xl bg-[#10131a] border border-[#3d494c]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#bcc9cd] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#f3ba2f]" />
                    <span>Concentración Máx</span>
                  </span>
                  <span
                    className={`text-[10px] font-code-sm font-bold ${
                      simulatedMetrics.maxConcentrationPercent > 65
                        ? 'text-[#ff5449]'
                        : simulation.concentrationDelta <= 0
                        ? 'text-[#4edea3]'
                        : 'text-[#f3ba2f]'
                    }`}
                  >
                    {simulation.concentrationDelta >= 0 ? `+${simulation.concentrationDelta}%` : `${simulation.concentrationDelta}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 font-code-sm">
                  <span className="text-sm font-bold text-[#e1e2ec]">
                    {simulatedMetrics.maxConcentrationPercent}%
                  </span>
                  <span className="text-[10px] text-[#869397]">
                    ({simulatedMetrics.dominantTokenSymbol})
                  </span>
                </div>
                <div className="w-full bg-[#272a32] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      simulatedMetrics.maxConcentrationPercent > 65 ? 'bg-[#ff5449]' : 'bg-[#f3ba2f]'
                    }`}
                    style={{ width: `${Math.min(100, simulatedMetrics.maxConcentrationPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI PREDICTIVE VERDICT & RECOMMENDATIONS BOX */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                simulation.verdict === 'favorable'
                  ? 'bg-[#00a572]/10 border-[#4edea3]/40'
                  : simulation.verdict === 'high_risk'
                  ? 'bg-[#ff5449]/10 border-[#ff5449]/40'
                  : simulation.verdict === 'cautious'
                  ? 'bg-[#f3ba2f]/10 border-[#f3ba2f]/40'
                  : 'bg-[#4cd7f6]/10 border-[#4cd7f6]/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    simulation.verdict === 'favorable'
                      ? 'bg-[#4edea3]/20 text-[#4edea3]'
                      : simulation.verdict === 'high_risk'
                      ? 'bg-[#ff5449]/20 text-[#ff5449]'
                      : simulation.verdict === 'cautious'
                      ? 'bg-[#f3ba2f]/20 text-[#f3ba2f]'
                      : 'bg-[#4cd7f6]/20 text-[#4cd7f6]'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[#e1e2ec] font-sans">
                      {simulation.verdictTitle}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-code-sm font-bold uppercase ${
                        simulation.verdict === 'favorable'
                          ? 'bg-[#4edea3]/20 text-[#4edea3]'
                          : simulation.verdict === 'high_risk'
                          ? 'bg-[#ff5449]/20 text-[#ff5449]'
                          : simulation.verdict === 'cautious'
                          ? 'bg-[#f3ba2f]/20 text-[#f3ba2f]'
                          : 'bg-[#4cd7f6]/20 text-[#4cd7f6]'
                      }`}
                    >
                      {simulation.verdict === 'favorable'
                        ? 'Auditoría: Recomendada'
                        : simulation.verdict === 'high_risk'
                        ? 'Auditoría: Requiere Precaución'
                        : simulation.verdict === 'cautious'
                        ? 'Auditoría: Exposición Activa'
                        : 'Auditoría: Balanceada'}
                    </span>
                  </div>

                  <p className="text-xs text-[#bcc9cd] leading-relaxed">
                    {simulation.verdictDescription}
                  </p>

                  <ul className="space-y-1 pt-1">
                    {simulation.bulletPoints.map((bp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#e1e2ec]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPercentSelection(50);
                  const resetAmt = fromToken.balance * 0.5;
                  setCustomAmountStr(resetAmt > 0 ? resetAmt.toFixed(4) : '0');
                  onShowToast('Simulador Restablecido', 'Valores de intercambio reajustados al 50%');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#e1e2ec] text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Simulación</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onShowToast(
                      'Swap Pre-configurado',
                      `Cargando orden de swap de ${numericAmountFrom} ${fromToken.symbol} hacia ${toToken.symbol}`
                    );
                    onOpenActionModal('swap', fromToken);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4cd7f6] hover:bg-[#38bdf8] text-[#003640] font-sans text-xs font-bold transition-all shadow-md shadow-[#4cd7f6]/20 cursor-pointer active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Proceder con este Swap en Vivo</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
