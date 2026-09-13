import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenItem } from '../types';
import { TokenLogo } from './TokenLogo';
import {
  TrendingUp,
  Percent,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
  Coins,
  Calendar,
  Layers,
  ArrowUpRight,
  HelpCircle,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export type YieldStrategyType = 'staking' | 'lending' | 'liquidity' | 'restaking';
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type TimeHorizon = '1d' | '30d' | '180d' | '1y' | '3y';
export type CompoundFrequency = 'daily' | 'weekly' | 'monthly' | 'annual';

interface TokenYieldStrategy {
  type: YieldStrategyType;
  label: string;
  protocol: string;
  baseApy: number; // e.g. 3.82 for 3.82%
  risk: 'low' | 'medium' | 'high';
  lockupDays: number;
  description: string;
  tagColor: string;
}

interface TokenYieldConfig {
  strategies: TokenYieldStrategy[];
  defaultStrategyIndex: number;
}

const TOKEN_YIELD_CATALOG: Record<string, TokenYieldConfig> = {
  ETH: {
    defaultStrategyIndex: 0,
    strategies: [
      {
        type: 'staking',
        label: 'Liquid Staking (LST)',
        protocol: 'Lido (stETH)',
        baseApy: 3.85,
        risk: 'low',
        lockupDays: 0,
        description: 'Validación de consenso en Ethereum con liquidez inmediata',
        tagColor: '#627eea',
      },
      {
        type: 'restaking',
        label: 'Restaking AVS',
        protocol: 'EigenLayer / Symbiotic',
        baseApy: 5.40,
        risk: 'medium',
        lockupDays: 7,
        description: 'Seguridad compartida para oráculos y puentes con recompensas extra',
        tagColor: '#8247e5',
      },
      {
        type: 'lending',
        label: 'Lending Vault',
        protocol: 'Aave v3 Core',
        baseApy: 2.15,
        risk: 'low',
        lockupDays: 0,
        description: 'Préstamo sobrecolateralizado en mercados monetarios',
        tagColor: '#28a0f0',
      },
    ],
  },
  SOL: {
    defaultStrategyIndex: 0,
    strategies: [
      {
        type: 'staking',
        label: 'Liquid Staking MEV',
        protocol: 'Jito Labs (JitoSOL)',
        baseApy: 7.45,
        risk: 'low',
        lockupDays: 0,
        description: 'Staking de Solana con captura de propinas MEV distribuidas a validadores',
        tagColor: '#14f195',
      },
      {
        type: 'lending',
        label: 'Lending Market',
        protocol: 'Kamino Finance',
        baseApy: 6.20,
        risk: 'low',
        lockupDays: 0,
        description: 'Préstamos descentralizados y depósitos de margen en Solana',
        tagColor: '#4cd7f6',
      },
      {
        type: 'liquidity',
        label: 'Concentrated DEX LP',
        protocol: 'Raydium CLMM',
        baseApy: 12.80,
        risk: 'high',
        lockupDays: 0,
        description: 'Rango de liquidez activa SOL-USDC con comisiones por intercambio',
        tagColor: '#d0bcff',
      },
    ],
  },
  USDC: {
    defaultStrategyIndex: 0,
    strategies: [
      {
        type: 'lending',
        label: 'Stable Lending Vault',
        protocol: 'Aave v3 (Arbitrum)',
        baseApy: 5.85,
        risk: 'low',
        lockupDays: 0,
        description: 'Demanda institucional de préstamos con garantías de alta calidad',
        tagColor: '#28a0f0',
      },
      {
        type: 'restaking',
        label: 'Yield Dollar',
        protocol: 'Maker / Sky (sUSDS)',
        baseApy: 8.75,
        risk: 'medium',
        lockupDays: 0,
        description: 'Rendimiento de bonos del tesoro tokenizados y comisiones de protocolo',
        tagColor: '#4edea3',
      },
      {
        type: 'liquidity',
        label: 'Stableswap Pool',
        protocol: 'Curve Finance',
        baseApy: 7.10,
        risk: 'low',
        lockupDays: 0,
        description: 'Fondo de liquidez tri-stablecoin con cero riesgo de impermanent loss',
        tagColor: '#f3ba2f',
      },
    ],
  },
  LINK: {
    defaultStrategyIndex: 0,
    strategies: [
      {
        type: 'staking',
        label: 'Chainlink Staking v0.2',
        protocol: 'Chainlink Network',
        baseApy: 4.32,
        risk: 'low',
        lockupDays: 0,
        description: 'Seguridad para oráculos CCIP y fuentes de precios verificables',
        tagColor: '#0052ff',
      },
      {
        type: 'lending',
        label: 'Money Market',
        protocol: 'Aave v3 (Base)',
        baseApy: 3.10,
        risk: 'low',
        lockupDays: 0,
        description: 'Préstamos colateralizados de LINK para creadores de mercado',
        tagColor: '#4cd7f6',
      },
    ],
  },
  POL: {
    defaultStrategyIndex: 0,
    strategies: [
      {
        type: 'staking',
        label: 'Validator Delegated Staking',
        protocol: 'Polygon PoS Hub',
        baseApy: 5.65,
        risk: 'low',
        lockupDays: 2,
        description: 'Delegación a nodos validadores oficiales de la red Polygon PoS',
        tagColor: '#8247e5',
      },
      {
        type: 'lending',
        label: 'Polygon Lending Vault',
        protocol: 'Aave v3 Polygon',
        baseApy: 3.90,
        risk: 'low',
        lockupDays: 0,
        description: 'Interés por préstamos a operadores de finanzas descentralizadas',
        tagColor: '#28a0f0',
      },
    ],
  },
};

interface YieldEstimatorWidgetProps {
  tokens: TokenItem[];
  currentChain: string;
  onOpenActionModal?: (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => void;
  gasSaverMode: boolean;
  onShowToast?: (title: string, msg: string) => void;
}

export const YieldEstimatorWidget: React.FC<YieldEstimatorWidgetProps> = ({
  tokens,
  currentChain,
  onOpenActionModal,
  gasSaverMode,
  onShowToast,
}) => {
  // State for interactive simulation controls
  const [allocationPercent, setAllocationPercent] = useState<number>(75);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('1y');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [compoundFreq, setCompoundFreq] = useState<CompoundFrequency>('daily');
  const [customApyDelta, setCustomApyDelta] = useState<number>(0); // -3% to +5%
  const [useChainFilter, setUseChainFilter] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Per-token toggles and selected strategy
  const [tokenExclusions, setTokenExclusions] = useState<Record<string, boolean>>({});
  const [tokenStrategyOverride, setTokenStrategyOverride] = useState<Record<string, number>>({});

  // Filter eligible tokens based on chain setting
  const activeTokens = useMemo(() => {
    if (useChainFilter && currentChain !== 'all') {
      return tokens.filter((t) => t.chain === currentChain);
    }
    return tokens;
  }, [tokens, currentChain, useChainFilter]);

  // Risk profile multipliers & defaults
  const riskMultiplier = useMemo(() => {
    switch (riskProfile) {
      case 'conservative':
        return 0.9;
      case 'aggressive':
        return 1.45;
      case 'balanced':
      default:
        return 1.1;
    }
  }, [riskProfile]);

  // Compounding periods (n in compound formula)
  const compoundN = useMemo(() => {
    switch (compoundFreq) {
      case 'daily':
        return 365;
      case 'weekly':
        return 52;
      case 'monthly':
        return 12;
      case 'annual':
      default:
        return 1;
    }
  }, [compoundFreq]);

  // Time in years (t in compound formula)
  const timeInYears = useMemo(() => {
    switch (timeHorizon) {
      case '1d':
        return 1 / 365;
      case '30d':
        return 30 / 365;
      case '180d':
        return 180 / 365;
      case '3y':
        return 3;
      case '1y':
      default:
        return 1;
    }
  }, [timeHorizon]);

  // Compute calculated returns per token
  const tokenProjections = useMemo(() => {
    return activeTokens.map((token) => {
      const isExcluded = !!tokenExclusions[token.id];
      const catalog = TOKEN_YIELD_CATALOG[token.symbol];
      const strategyIndex = tokenStrategyOverride[token.id] ?? (catalog ? catalog.defaultStrategyIndex : 0);
      const strategy = catalog?.strategies[strategyIndex] || {
        type: 'staking' as YieldStrategyType,
        label: 'Staking General',
        protocol: 'Validador Oficial',
        baseApy: 4.5,
        risk: 'low' as const,
        lockupDays: 0,
        description: 'Rendimiento estándar estimado para este activo',
        tagColor: '#4cd7f6',
      };

      // Base APY adjusted by risk profile + user slider delta
      const effectiveApyPercent = Math.max(
        0.5,
        parseFloat((strategy.baseApy * riskMultiplier + customApyDelta).toFixed(2))
      );
      const effectiveApyDecimal = effectiveApyPercent / 100;

      // Principal deployed
      const principalUsd = isExcluded
        ? 0
        : (token.valueUsd * (allocationPercent / 100));
      const principalNative = isExcluded
        ? 0
        : (token.balance * (allocationPercent / 100));

      // Compound Interest Algorithm: A = P * (1 + r/n)^(n*t)
      // Earned = A - P
      const compoundFactor = Math.pow(1 + effectiveApyDecimal / compoundN, compoundN * timeInYears);
      const earnedUsd = principalUsd * (compoundFactor - 1);
      const earnedNative = principalNative * (compoundFactor - 1);

      // Gas estimate to stake/deposit (simulated based on L1 vs L2)
      const isL1 = token.chain === 'eth';
      const estimatedGasUsd = isL1 ? (gasSaverMode ? 3.4 : 5.8) : (gasSaverMode ? 0.08 : 0.15);
      const breakEvenDays = earnedUsd > 0 ? ((estimatedGasUsd / (earnedUsd / (timeInYears * 365)))) : 0;

      return {
        token,
        isExcluded,
        strategy,
        strategyIndex,
        availableStrategies: catalog?.strategies || [strategy],
        effectiveApyPercent,
        principalUsd,
        principalNative,
        earnedUsd,
        earnedNative,
        estimatedGasUsd,
        breakEvenDays: Math.min(999, Math.max(0.1, breakEvenDays)),
      };
    });
  }, [
    activeTokens,
    tokenExclusions,
    tokenStrategyOverride,
    allocationPercent,
    riskMultiplier,
    customApyDelta,
    compoundN,
    timeInYears,
    gasSaverMode,
  ]);

  // Totals calculations
  const totals = useMemo(() => {
    const totalWalletUsd = activeTokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);
    const totalDeployedUsd = tokenProjections.reduce((sum, item) => sum + item.principalUsd, 0);
    const totalEarnedUsd = tokenProjections.reduce((sum, item) => sum + item.earnedUsd, 0);
    const totalGasCostUsd = tokenProjections
      .filter((item) => !item.isExcluded && item.principalUsd > 0)
      .reduce((sum, item) => sum + item.estimatedGasUsd, 0);

    // Blended weighted APY
    const weightedApy = totalDeployedUsd > 0
      ? tokenProjections.reduce(
          (sum, item) => sum + (item.effectiveApyPercent * item.principalUsd),
          0
        ) / totalDeployedUsd
      : 0;

    // Daily income (365 days)
    const dailyIncomeUsd = totalEarnedUsd / (timeInYears * 365);
    const monthlyIncomeUsd = dailyIncomeUsd * 30;
    const annualIncomeUsd = dailyIncomeUsd * 365;

    return {
      totalWalletUsd,
      totalDeployedUsd,
      totalEarnedUsd,
      totalGasCostUsd,
      weightedApy: parseFloat(weightedApy.toFixed(2)),
      dailyIncomeUsd,
      monthlyIncomeUsd,
      annualIncomeUsd,
      idleUsd: Math.max(0, totalWalletUsd - totalDeployedUsd),
    };
  }, [activeTokens, tokenProjections, timeInYears]);

  const formatUsd = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTimeHorizonLabel = (th: TimeHorizon) => {
    switch (th) {
      case '1d':
        return 'en 1 Día';
      case '30d':
        return 'en 30 Días (1 Mes)';
      case '180d':
        return 'en 6 Meses';
      case '3y':
        return 'en 3 Años (Compuesto)';
      case '1y':
      default:
        return 'en 1 Año (APY)';
    }
  };

  return (
    <div
      id="yield-estimator-widget"
      className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-4"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#4edea3]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title, Live Status & Quick Action */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#e1e2ec] font-headline-lg tracking-tight">
                Simulador de Rendimientos (Yield Estimator)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4cd7f6] font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#4cd7f6]" />
                <span>Algoritmo Compuesto APY</span>
              </span>
            </div>
            <p className="text-[11px] text-[#869397] mt-0.5">
              Calcula los retornos potenciales de staking y préstamos DeFi con reinversión automática.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Chain Filter */}
          <button
            onClick={() => {
              setUseChainFilter(!useChainFilter);
              if (onShowToast) {
                onShowToast(
                  !useChainFilter ? 'Filtro por Red Activado' : 'Simulación Multicadena',
                  !useChainFilter
                    ? `Simulando solo activos en la red seleccionada (${currentChain.toUpperCase()})`
                    : 'Simulando el 100% de la cartera consolidada en todas las redes.'
                );
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-code-sm font-semibold transition-all border ${
              useChainFilter
                ? 'bg-[#4cd7f6]/15 border-[#4cd7f6]/40 text-[#4cd7f6]'
                : 'bg-[#10131a] border-[#272a32] text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            {useChainFilter ? `Red: ${currentChain.toUpperCase()}` : 'Toda la Cartera'}
          </button>

          {/* Toggle Minimize/Maximize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-[#10131a] border border-[#272a32] text-[#869397] hover:text-[#e1e2ec] transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Hero Metrics Card: Total Projected Return & Compounding Rate */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-[#10131a] border border-[#272a32]">
              {/* Primary Projected Gain Display */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-2 border-b md:border-b-0 md:border-r border-[#272a32] pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-code-sm uppercase tracking-wider text-[#869397] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#4edea3]" />
                    Retorno Estimado {getTimeHorizonLabel(timeHorizon)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-code-sm font-bold">
                    +{totals.weightedApy}% APY Promedio
                  </span>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-code-md text-white tracking-tight flex items-baseline gap-2">
                    <span className="text-[#4edea3]">+{formatUsd(totals.totalEarnedUsd)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-code-sm text-[#bcc9cd] mt-1">
                    <span>
                      Diario: <strong className="text-white">+{formatUsd(totals.dailyIncomeUsd)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Mensual: <strong className="text-white">+{formatUsd(totals.monthlyIncomeUsd)}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-[#869397] font-code-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#4edea3]" />
                  <span>
                    Capital Desplegado: <strong className="text-[#e1e2ec]">{formatUsd(totals.totalDeployedUsd)}</strong> ({allocationPercent}% de cartera)
                  </span>
                </div>
              </div>

              {/* Strategy Profile & Frequency Quick Controls */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-3 md:pl-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-code-sm text-[#869397] font-semibold">
                      Perfil de Riesgo & Estrategia
                    </span>
                    <span className="text-[10px] font-code-sm text-[#4cd7f6]">
                      {riskProfile === 'conservative'
                        ? 'Bajo Riesgo (LSTs & Aave)'
                        : riskProfile === 'balanced'
                        ? 'Equilibrado (Restaking)'
                        : 'Alto Retorno (DEX LPs)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#191b23] border border-[#272a32]">
                    <button
                      onClick={() => setRiskProfile('conservative')}
                      className={`py-1 rounded text-center text-xs font-semibold font-code-sm transition-all ${
                        riskProfile === 'conservative'
                          ? 'bg-[#272a32] text-[#4edea3] shadow-sm font-bold'
                          : 'text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      Conservador
                    </button>
                    <button
                      onClick={() => setRiskProfile('balanced')}
                      className={`py-1 rounded text-center text-xs font-semibold font-code-sm transition-all ${
                        riskProfile === 'balanced'
                          ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm font-bold'
                          : 'text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      Equilibrado
                    </button>
                    <button
                      onClick={() => setRiskProfile('aggressive')}
                      className={`py-1 rounded text-center text-xs font-semibold font-code-sm transition-all ${
                        riskProfile === 'aggressive'
                          ? 'bg-[#272a32] text-[#f3ba2f] shadow-sm font-bold'
                          : 'text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      Max Yield
                    </button>
                  </div>
                </div>

                {/* Horizon Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-code-sm text-[#869397] font-semibold">
                      Plazo de Proyección
                    </span>
                    <span className="text-[10px] font-code-sm text-[#bcc9cd]">
                      {compoundFreq === 'daily' ? 'Capitalización Diaria (365x)' : 'Capitalización Periódica'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(['1d', '30d', '180d', '1y', '3y'] as TimeHorizon[]).map((th) => (
                      <button
                        key={th}
                        onClick={() => setTimeHorizon(th)}
                        className={`flex-1 py-1 rounded text-center text-[11px] font-code-sm font-semibold transition-all ${
                          timeHorizon === th
                            ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                            : 'bg-[#191b23] text-[#869397] hover:text-[#e1e2ec] border border-[#272a32]'
                        }`}
                      >
                        {th === '1d' ? '1D' : th === '30d' ? '1M' : th === '180d' ? '6M' : th === '1y' ? '1A' : '3A'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Allocation Slider & Controls Bar */}
            <div className="p-3 rounded-xl bg-[#10131a]/70 border border-[#272a32] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg">
                    Asignación de Cartera en Rendimiento:
                  </span>
                  <span className="text-xs font-extrabold font-code-sm text-[#4edea3]">
                    {allocationPercent}% ({formatUsd(totals.totalDeployedUsd)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setAllocationPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-code-sm font-semibold transition-all ${
                        allocationPercent === pct
                          ? 'bg-[#4cd7f6] text-[#003640] font-bold'
                          : 'bg-[#272a32] text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="ml-1 p-1 rounded bg-[#272a32] text-[#bcc9cd] hover:text-[#4cd7f6] transition-colors"
                    title="Ajustes Avanzados de Simulación"
                  >
                    <Sliders className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Slider Track */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={allocationPercent}
                  onChange={(e) => setAllocationPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#272a32] rounded-lg appearance-none cursor-pointer accent-[#4edea3]"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-[#869397] font-code-sm">
                <span>Reserva líquida en billetera: <strong className="text-[#bcc9cd]">{formatUsd(totals.idleUsd)}</strong></span>
                <span>Fórmula: Interés compuesto A = P(1 + r/n)^nt</span>
              </div>

              {/* Collapsible Advanced Parameters */}
              <AnimatePresence>
                {showAdvancedSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="pt-2 border-t border-[#272a32] grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {/* Compounding frequency */}
                    <div>
                      <span className="text-[10px] text-[#869397] font-code-sm uppercase font-semibold block mb-1">
                        Frecuencia de Reinversión
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['daily', 'weekly', 'monthly', 'annual'] as CompoundFrequency[]).map((cf) => (
                          <button
                            key={cf}
                            onClick={() => setCompoundFreq(cf)}
                            className={`py-1 text-[10px] font-code-sm rounded transition-all ${
                              compoundFreq === cf
                                ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40 font-bold'
                                : 'bg-[#191b23] text-[#869397] hover:text-[#e1e2ec] border border-[#272a32]'
                            }`}
                          >
                            {cf === 'daily' ? 'Diaria' : cf === 'weekly' ? 'Semanal' : cf === 'monthly' ? 'Mensual' : 'Anual'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* APY Boost / Market Delta Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] font-code-sm mb-1">
                        <span className="text-[#869397] uppercase font-semibold">Simular Variación de Mercado</span>
                        <span className="text-[#4cd7f6] font-bold">{customApyDelta >= 0 ? `+${customApyDelta}%` : `${customApyDelta}%`}</span>
                      </div>
                      <input
                        type="range"
                        min="-3"
                        max="6"
                        step="0.5"
                        value={customApyDelta}
                        onChange={(e) => setCustomApyDelta(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#272a32] rounded-lg appearance-none cursor-pointer accent-[#4cd7f6]"
                      />
                      <div className="flex justify-between text-[9px] text-[#869397] mt-0.5">
                        <span>Mercado Bajista (-3%)</span>
                        <span>Normal</span>
                        <span>Fiebre DeFi (+6%)</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Token-by-Token Yield Strategy Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#4edea3]" />
                  Desglose por Token y Estrategia Recomendada
                </span>
                <span className="text-[10px] text-[#869397] font-code-sm">
                  {tokenProjections.filter((p) => !p.isExcluded).length} activos participando
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {tokenProjections.map((item) => {
                  const {
                    token,
                    isExcluded,
                    strategy,
                    availableStrategies,
                    strategyIndex,
                    effectiveApyPercent,
                    principalUsd,
                    principalNative,
                    earnedUsd,
                    earnedNative,
                    estimatedGasUsd,
                    breakEvenDays,
                  } = item;

                  return (
                    <div
                      key={token.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isExcluded
                          ? 'bg-[#10131a]/40 border-[#272a32]/60 opacity-60'
                          : 'bg-[#10131a] border-[#272a32] hover:border-[#3d494c]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Left: Checkbox, Token Info & Protocol Badge */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => {
                              setTokenExclusions((prev) => ({
                                ...prev,
                                [token.id]: !prev[token.id],
                              }));
                            }}
                            className="w-4 h-4 rounded bg-[#272a32] border-[#3d494c] text-[#4edea3] focus:ring-0 cursor-pointer"
                            title={isExcluded ? 'Incluir en el simulador' : 'Excluir del simulador'}
                          />

                          <TokenLogo symbol={token.symbol} size="md" />

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg">
                                {token.symbol}
                              </span>
                              <span className="text-[10px] text-[#869397] font-code-sm">
                                ({token.chainLabel})
                              </span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-code-sm font-bold uppercase"
                                style={{
                                  backgroundColor: `${strategy.tagColor}20`,
                                  color: strategy.tagColor,
                                }}
                              >
                                {strategy.protocol}
                              </span>
                            </div>

                            {/* Strategy description */}
                            <p className="text-[10px] text-[#869397] mt-0.5 line-clamp-1">
                              {strategy.description}
                            </p>
                          </div>
                        </div>

                        {/* Middle: Strategy Dropdown Selector */}
                        <div className="flex items-center gap-2">
                          {availableStrategies.length > 1 && !isExcluded ? (
                            <select
                              value={strategyIndex}
                              onChange={(e) => {
                                setTokenStrategyOverride((prev) => ({
                                  ...prev,
                                  [token.id]: Number(e.target.value),
                                }));
                              }}
                              className="px-2 py-1 rounded-lg bg-[#191b23] border border-[#272a32] text-[11px] font-code-sm text-[#e1e2ec] cursor-pointer focus:outline-none focus:border-[#4cd7f6]"
                            >
                              {availableStrategies.map((strat, sIdx) => (
                                <option key={sIdx} value={sIdx}>
                                  {strat.protocol} ({strat.baseApy}% APY)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] font-code-sm text-[#869397]">
                              {strategy.label}
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-code-sm text-xs font-bold">
                            {effectiveApyPercent}% APY
                          </span>
                        </div>

                        {/* Right: Projected Yield & Action Button */}
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-xs font-extrabold font-code-sm text-white">
                              {isExcluded ? '$0.00' : `+${formatUsd(earnedUsd)}`}
                            </div>
                            <div className="text-[10px] font-code-sm text-[#4edea3]">
                              {isExcluded
                                ? 'Pausado'
                                : `+${earnedNative.toFixed(4)} ${token.symbol}`}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (onOpenActionModal) {
                                onOpenActionModal('swap', token);
                              } else if (onShowToast) {
                                onShowToast(
                                  `Estrategia ${strategy.protocol}`,
                                  `Preparando depósito de ${token.symbol} con ${effectiveApyPercent}% APY.`
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] text-[11px] font-code-sm font-bold flex items-center gap-1 transition-all active:scale-95 border border-[#3d494c]/40"
                          >
                            <span>Depositar</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Gas & Break-even Telemetry Sub-bar */}
                      {!isExcluded && principalUsd > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-[#272a32]/60 flex flex-wrap items-center justify-between text-[10px] font-code-sm text-[#869397]">
                          <div className="flex items-center gap-2">
                            <span>
                              Principal: <strong className="text-[#bcc9cd]">{principalNative.toFixed(3)} {token.symbol}</strong> ({formatUsd(principalUsd)})
                            </span>
                            <span>•</span>
                            <span>Gas estimado: <strong className="text-[#e1e2ec]">{formatUsd(estimatedGasUsd)}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[#4edea3]" />
                            <span>Amortización de gas en <strong>{breakEvenDays < 1 ? '< 1 día' : `${breakEvenDays.toFixed(1)} días`}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Summary & Execution Footer */}
            <div className="pt-2 border-t border-[#3d494c]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#869397] font-code-sm">
                <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                <span>
                  Protección MEV y enrutamiento óptimo activados por el oráculo de cartera.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onShowToast) {
                      onShowToast(
                        'Estrategia de Rendimiento Optimizada',
                        `Configuración aplicada: ${allocationPercent}% de cartera generando ${totals.weightedApy}% APY (~${formatUsd(totals.annualIncomeUsd)}/año).`
                      );
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4edea3] hover:bg-[#00a572] text-[#003824] hover:text-[#ffffff] font-bold font-code-sm flex items-center gap-1.5 shadow-md shadow-[#4edea3]/20 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar Estrategia de Staking</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
