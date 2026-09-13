import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenLogo } from './TokenLogo';
import {
  Flame,
  Zap,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Layers,
  Fuel,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';

export type TxSimulationType = 'swap' | 'transfer' | 'defi';

export interface ChainGasMetric {
  id: string; // 'eth' | 'arb' | 'op' | 'base'
  name: string;
  shortName: string;
  typeBadge: string;
  baseFeeGwei: number;
  priorityFeeGwei: number;
  totalGwei: number;
  congestionScore: number; // 0 to 100
  heatStatus: 'low' | 'optimal' | 'moderate' | 'high';
  statusLabel: string;
  blockTimeSec: number;
  tps: number;
  trend: 'down' | 'up' | 'stable';
  trendPercent: number;
  costsUsd: {
    swap: number;
    transfer: number;
    defi: number;
  };
  savingsVsEthPercent: number; // 0 for Eth, e.g. 99.4% for Base
  blobGasActive: boolean;
}

interface NetworkHeatmapWidgetProps {
  currentChain: string;
  onSelectChain: (chain: string) => void;
  onOpenActionModal: (type: 'send' | 'receive' | 'swap' | 'bridge') => void;
  gasSaverMode: boolean;
  onShowToast: (title: string, msg: string) => void;
}

const INITIAL_CHAINS_GAS: ChainGasMetric[] = [
  {
    id: 'base',
    name: 'Base',
    shortName: 'BASE',
    typeBadge: 'L2 Rollup (OP Stack)',
    baseFeeGwei: 0.0021,
    priorityFeeGwei: 0.0003,
    totalGwei: 0.0024,
    congestionScore: 12,
    heatStatus: 'optimal',
    statusLabel: 'Mínimo Histórico',
    blockTimeSec: 2.0,
    tps: 78.4,
    trend: 'down',
    trendPercent: -12.4,
    costsUsd: {
      swap: 0.03,
      transfer: 0.004,
      defi: 0.08,
    },
    savingsVsEthPercent: 99.6,
    blobGasActive: true,
  },
  {
    id: 'arb',
    name: 'Arbitrum One',
    shortName: 'ARB',
    typeBadge: 'L2 Nitro Rollup',
    baseFeeGwei: 0.078,
    priorityFeeGwei: 0.012,
    totalGwei: 0.09,
    congestionScore: 22,
    heatStatus: 'optimal',
    statusLabel: 'Muy Bajo',
    blockTimeSec: 0.25,
    tps: 64.1,
    trend: 'down',
    trendPercent: -6.1,
    costsUsd: {
      swap: 0.09,
      transfer: 0.012,
      defi: 0.22,
    },
    savingsVsEthPercent: 98.8,
    blobGasActive: true,
  },
  {
    id: 'op',
    name: 'Optimism',
    shortName: 'OP',
    typeBadge: 'L2 Superchain',
    baseFeeGwei: 0.0048,
    priorityFeeGwei: 0.0009,
    totalGwei: 0.0057,
    congestionScore: 18,
    heatStatus: 'optimal',
    statusLabel: 'Régimen Óptimo',
    blockTimeSec: 2.0,
    tps: 36.8,
    trend: 'stable',
    trendPercent: -1.2,
    costsUsd: {
      swap: 0.06,
      transfer: 0.008,
      defi: 0.16,
    },
    savingsVsEthPercent: 99.2,
    blobGasActive: true,
  },
  {
    id: 'eth',
    name: 'Ethereum L1',
    shortName: 'ETH',
    typeBadge: 'Capa Base (L1)',
    baseFeeGwei: 13.8,
    priorityFeeGwei: 1.5,
    totalGwei: 15.3,
    congestionScore: 71,
    heatStatus: 'moderate',
    statusLabel: 'Congestión Media',
    blockTimeSec: 12.0,
    tps: 13.9,
    trend: 'up',
    trendPercent: 4.8,
    costsUsd: {
      swap: 7.85,
      transfer: 0.94,
      defi: 16.4,
    },
    savingsVsEthPercent: 0,
    blobGasActive: false,
  },
];

// Hour matrix for weekly sweet spots (UTC hours)
const HOURLY_HEATMAP_HOURS = [
  { hour: '00-04h', status: 'optimal', label: 'Valle (Mínimo)', avgGwei: '9-11 Gwei' },
  { hour: '04-08h', status: 'optimal', label: 'Valle Asia/EU', avgGwei: '8-12 Gwei' },
  { hour: '08-12h', status: 'moderate', label: 'Apertura Londres', avgGwei: '14-18 Gwei' },
  { hour: '12-16h', status: 'high', label: 'Pico NY + Londres', avgGwei: '22-32 Gwei' },
  { hour: '16-20h', status: 'high', label: 'Pico Wall St', avgGwei: '20-28 Gwei' },
  { hour: '20-24h', status: 'moderate', label: 'Cierre de Sesión', avgGwei: '13-16 Gwei' },
];

export const NetworkHeatmapWidget: React.FC<NetworkHeatmapWidgetProps> = ({
  currentChain,
  onSelectChain,
  onOpenActionModal,
  gasSaverMode,
  onShowToast,
}) => {
  const [metrics, setMetrics] = useState<ChainGasMetric[]>(INITIAL_CHAINS_GAS);
  const [txType, setTxType] = useState<TxSimulationType>('swap');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextUpdateSeconds, setNextUpdateSeconds] = useState(8);
  const [showHourlySchedule, setShowHourlySchedule] = useState(false);
  const [selectedChainDetail, setSelectedChainDetail] = useState<string | null>(null);

  // Live periodic simulation countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNextUpdateSeconds((prev) => {
        if (prev <= 1) {
          // Trigger micro pulse
          simulateLiveGasFluctuation();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const simulateLiveGasFluctuation = () => {
    setMetrics((prev) =>
      prev.map((c) => {
        const delta = (Math.random() - 0.48) * 0.08; // small delta
        const newTotal = Math.max(0.001, c.totalGwei * (1 + delta));
        const trend: 'down' | 'up' | 'stable' = delta < -0.01 ? 'down' : delta > 0.01 ? 'up' : 'stable';
        const trendPercent = parseFloat((delta * 100).toFixed(1));

        // Adjust cost proportionally
        const ratio = newTotal / (c.totalGwei || 1);
        const newCosts = {
          swap: parseFloat((c.costsUsd.swap * ratio).toFixed(3)),
          transfer: parseFloat((c.costsUsd.transfer * ratio).toFixed(4)),
          defi: parseFloat((c.costsUsd.defi * ratio).toFixed(3)),
        };

        return {
          ...c,
          totalGwei: parseFloat(newTotal.toFixed(newTotal < 0.01 ? 4 : 2)),
          trend,
          trendPercent,
          costsUsd: newCosts,
        };
      })
    );
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    simulateLiveGasFluctuation();
    setNextUpdateSeconds(10);
    setTimeout(() => {
      setIsRefreshing(false);
      onShowToast(
        'Oráculo de Gas Actualizado',
        'Tasas de blobs EIP-4844 y mempool sincronizadas en tiempo real.'
      );
    }, 600);
  };

  // Find the cheapest chain for the selected transaction type
  const sortedByCheapest = [...metrics].sort(
    (a, b) => a.costsUsd[txType] - b.costsUsd[txType]
  );
  const recommendedChain = sortedByCheapest[0];
  const ethMetric = metrics.find((m) => m.id === 'eth') || metrics[metrics.length - 1];

  // Helper for heatmap colors
  const getHeatmapStyling = (status: 'low' | 'optimal' | 'moderate' | 'high') => {
    switch (status) {
      case 'optimal':
        return {
          bgBadge: 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30',
          barColor: 'bg-[#4edea3]',
          cardBorder: 'border-[#4edea3]/30 hover:border-[#4edea3]/60',
          glow: 'from-[#4edea3]/10 to-transparent',
          tempLabel: 'Óptimo (Frío)',
        };
      case 'low':
        return {
          bgBadge: 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30',
          barColor: 'bg-[#4cd7f6]',
          cardBorder: 'border-[#4cd7f6]/30 hover:border-[#4cd7f6]/60',
          glow: 'from-[#4cd7f6]/10 to-transparent',
          tempLabel: 'Muy Bajo',
        };
      case 'moderate':
        return {
          bgBadge: 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/30',
          barColor: 'bg-[#facc15]',
          cardBorder: 'border-[#facc15]/30 hover:border-[#facc15]/60',
          glow: 'from-[#facc15]/10 to-transparent',
          tempLabel: 'Moderado (Cálido)',
        };
      case 'high':
        return {
          bgBadge: 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30',
          barColor: 'bg-[#ffb4ab]',
          cardBorder: 'border-[#ffb4ab]/40 hover:border-[#ffb4ab]/70',
          glow: 'from-[#ffb4ab]/15 to-transparent',
          tempLabel: 'Congestión Alta',
        };
    }
  };

  const formatCost = (val: number) => {
    if (val < 0.01) {
      return `<$0.01`;
    }
    return `$${val.toFixed(2)}`;
  };

  return (
    <div
      id="network-heatmap-widget"
      className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-4"
    >
      {/* Ambient background bloom */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#4edea3]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title, Live Status & Refresh Button */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6] shadow-sm">
            <Flame className="w-4 h-4 text-[#4cd7f6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#e1e2ec] font-headline-lg tracking-tight">
                Mapa de Calor de Gas en Redes
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 text-[10px] font-code-sm font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                <span>En Vivo</span>
              </span>
            </div>
            <p className="text-[11px] text-[#869397] mt-0.5">
              Tarifas en tiempo real para decidir la red más rápida y económica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#bcc9cd]">
            <Clock className="w-3 h-3 text-[#4cd7f6]" />
            <span>Refresco en {nextUpdateSeconds}s</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] border border-[#3d494c]/40 text-[#e1e2ec] hover:text-[#4cd7f6] transition-all disabled:opacity-50"
            title="Sincronizar oráculo de gas ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4cd7f6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transaction Type Simulator Selector */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-[#10131a] border border-[#272a32]">
        <div className="flex items-center gap-1 text-[11px] text-[#bcc9cd] pl-1 font-semibold font-code-sm">
          <Fuel className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span>Calcular para:</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTxType('swap')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              txType === 'swap'
                ? 'bg-[#272a32] text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Swap DEX</span>
          </button>

          <button
            onClick={() => setTxType('transfer')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              txType === 'transfer'
                ? 'bg-[#272a32] text-[#4edea3] border border-[#4edea3]/30 shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Transferencia</span>
          </button>

          <button
            onClick={() => setTxType('defi')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              txType === 'defi'
                ? 'bg-[#272a32] text-[#d0bcff] border border-[#d0bcff]/30 shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Staking / DeFi</span>
          </button>
        </div>
      </div>

      {/* Smart Decision Recommendation Callout */}
      {recommendedChain && (
        <div className="relative z-10 rounded-xl bg-gradient-to-r from-[#003824]/40 via-[#10131a] to-[#003640]/30 border border-[#4edea3]/40 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/20 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#4edea3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4edea3] font-code-sm">
                  Mejor Red Recomendada
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                  {recommendedChain.savingsVsEthPercent}% Menos Gas vs L1
                </span>
              </div>
              <p className="text-xs text-[#e1e2ec] mt-0.5">
                Usa <span className="font-bold text-[#4edea3]">{recommendedChain.name}</span>: coste estimado{' '}
                <span className="font-code-sm font-bold text-white">
                  {formatCost(recommendedChain.costsUsd[txType])}
                </span>{' '}
                con confirmación en{' '}
                <span className="font-code-sm text-[#4cd7f6]">{recommendedChain.blockTimeSec}s</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectChain(recommendedChain.id);
                onShowToast(
                  `Red Cambiada a ${recommendedChain.name}`,
                  `Cartera configurada en la red más económica con oráculo blob activo.`
                );
              }}
              className="px-3 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shadow-sm"
            >
              <span>Usar {recommendedChain.shortName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Cards Grid (Ethereum, Arbitrum, Optimism, Base) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((chain) => {
          const styling = getHeatmapStyling(chain.heatStatus);
          const isSelected = currentChain === chain.id;
          const isCheapest = recommendedChain.id === chain.id;
          const isExpanded = selectedChainDetail === chain.id;
          const cost = chain.costsUsd[txType];

          return (
            <div
              key={chain.id}
              className={`relative rounded-xl bg-gradient-to-b from-[#272a32]/80 to-[#191b23] border transition-all duration-150 p-3.5 flex flex-col justify-between group ${
                isSelected
                  ? 'border-[#4cd7f6] ring-1 ring-[#4cd7f6]/40 shadow-lg'
                  : isCheapest
                  ? 'border-[#4edea3]/50 shadow-md'
                  : 'border-[#3d494c]/40 hover:border-[#3d494c]'
              }`}
            >
              {/* Header: Logo, Name, Badge, Congestion */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <TokenLogo symbol={chain.shortName} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg">
                          {chain.name}
                        </span>
                        {isCheapest && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] text-[9px] font-bold uppercase">
                            Más Barato
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#4cd7f6]/20 border border-[#4cd7f6]/30 text-[#4cd7f6] text-[9px] font-bold uppercase">
                            Activa
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#869397] font-code-sm block">
                        {chain.typeBadge}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-code-sm font-bold uppercase ${styling.bgBadge}`}
                  >
                    {styling.tempLabel}
                  </span>
                </div>

                {/* Primary Metric: Estimated Transaction Cost */}
                <div className="mt-3 pt-2.5 border-t border-[#3d494c]/30 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#869397] font-code-sm block">
                      Coste Estimado ({txType === 'swap' ? 'Swap' : txType === 'transfer' ? 'Envío' : 'DeFi'})
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold font-code-sm text-white tracking-tight">
                        {formatCost(cost)}
                      </span>
                      <span className="text-xs text-[#bcc9cd] font-code-sm">USD</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 font-code-sm text-xs font-bold text-[#e1e2ec]">
                      <Fuel className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      <span>{chain.totalGwei} Gwei</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {chain.trend === 'down' ? (
                        <span className="text-[10px] text-[#4edea3] font-code-sm flex items-center">
                          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                          {chain.trendPercent}%
                        </span>
                      ) : chain.trend === 'up' ? (
                        <span className="text-[10px] text-[#ffb4ab] font-code-sm flex items-center">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                          +{chain.trendPercent}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#bcc9cd] font-code-sm">Estable</span>
                      )}
                      <span className="text-[10px] text-[#869397]">• {chain.blockTimeSec}s block</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Congestion Bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-code-sm text-[#869397]">
                    <span>Índice de Saturación</span>
                    <span className="text-[#e1e2ec] font-bold">{chain.congestionScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#10131a] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${styling.barColor}`}
                      style={{ width: `${Math.min(100, Math.max(5, chain.congestionScore))}%` }}
                    />
                  </div>
                </div>

                {/* Savings vs Ethereum Comparison */}
                {chain.id !== 'eth' && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#bcc9cd] bg-[#10131a]/60 px-2 py-1 rounded-md border border-[#272a32]">
                    <span className="text-[#869397]">Ahorro vs Ethereum:</span>
                    <span className="font-code-sm font-bold text-[#4edea3]">
                      -{chain.savingsVsEthPercent}% (${(ethMetric.costsUsd[txType] - cost).toFixed(2)} USD)
                    </span>
                  </div>
                )}
                {chain.id === 'eth' && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#bcc9cd] bg-[#10131a]/60 px-2 py-1 rounded-md border border-[#272a32]">
                    <span className="text-[#869397]">Seguridad L1:</span>
                    <span className="font-code-sm font-semibold text-[#facc15]">
                      Máxima Descentralización
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons & detail toggle */}
              <div className="mt-3 pt-2 border-t border-[#3d494c]/20 flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectChain(chain.id);
                    onShowToast(`Red Seleccionada`, `Cartera conectada a ${chain.name}`);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold font-code-sm transition-all text-center ${
                    isSelected
                      ? 'bg-[#4cd7f6] text-[#003640] font-bold'
                      : 'bg-[#10131a] hover:bg-[#272a32] text-[#e1e2ec] border border-[#272a32]'
                  }`}
                >
                  {isSelected ? 'Red Activa' : 'Fijar Red'}
                </button>

                <button
                  onClick={() => {
                    onSelectChain(chain.id);
                    onOpenActionModal(txType === 'swap' ? 'swap' : 'send');
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4edea3] hover:text-[#6ffbbe] border border-[#4edea3]/30 text-xs font-bold font-sans transition-all flex items-center gap-1 active:scale-95"
                  title={`Ejecutar ${txType === 'swap' ? 'Swap' : 'Envío'} en ${chain.name}`}
                >
                  <span>{txType === 'swap' ? 'Swap' : 'Enviar'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => setSelectedChainDetail(isExpanded ? null : chain.id)}
                  className="p-1.5 rounded-lg bg-[#10131a] hover:bg-[#272a32] text-[#869397] hover:text-[#e1e2ec] transition-colors"
                  title="Ver desglose EIP-1559"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expandable EIP-1559 & Blob Data Breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 pt-2 border-t border-[#3d494c]/20 text-[10px] space-y-1 font-code-sm text-[#869397]"
                  >
                    <div className="flex justify-between">
                      <span>Tarifa Base (Base Fee):</span>
                      <span className="text-[#e1e2ec] font-bold">{chain.baseFeeGwei} Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Propina Prioridad (Priority Tip):</span>
                      <span className="text-[#e1e2ec] font-bold">{chain.priorityFeeGwei} Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimiento Red (TPS):</span>
                      <span className="text-[#4cd7f6] font-bold">{chain.tps} tx/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Optimización Blobs EIP-4844:</span>
                      <span className={chain.blobGasActive ? 'text-[#4edea3] font-bold' : 'text-[#869397]'}>
                        {chain.blobGasActive ? 'Habilitado (-95% gas)' : 'N/A (L1)'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Gas Saver Mode & MEV Protection banner in heatmap */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#10131a] border border-[#272a32] text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${gasSaverMode ? 'text-[#4edea3]' : 'text-[#869397]'}`} />
          <span className="text-[#bcc9cd]">
            {gasSaverMode
              ? 'Protección Flashbots MEV & Gas Saver: Transacciones protegidas contra front-running y sandwich attacks.'
              : 'Modo Ahorro de Gas inactivo: Las transacciones se envían por mempool público estándar.'}
          </span>
        </div>

        <button
          onClick={() => setShowHourlySchedule(!showHourlySchedule)}
          className="text-[#4cd7f6] hover:underline font-code-sm text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>{showHourlySchedule ? 'Ocultar Horarios Valle' : 'Ver Horarios Valle del Gas'}</span>
          {showHourlySchedule ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Best Times / Hourly Congestion Matrix */}
      <AnimatePresence>
        {showHourlySchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden rounded-xl bg-[#10131a] border border-[#272a32] p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span className="text-xs font-bold text-[#e1e2ec]">
                  Matriz de Congestión Horaria (Horarios UTC)
                </span>
              </div>
              <span className="text-[10px] text-[#869397] font-code-sm">
                Basado en 30 días de datos on-chain
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {HOURLY_HEATMAP_HOURS.map((h, i) => {
                const isOpt = h.status === 'optimal';
                const isMod = h.status === 'moderate';
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border text-center font-code-sm ${
                      isOpt
                        ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                        : isMod
                        ? 'bg-[#facc15]/10 border-[#facc15]/30 text-[#facc15]'
                        : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">{h.hour}</span>
                    <span className="block text-[9px] mt-0.5 opacity-90">{h.label}</span>
                    <span className="block text-[10px] font-bold mt-1 text-white">{h.avgGwei}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-[#bcc9cd] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#4cd7f6] shrink-0" />
              <span>
                <strong>Consejo Pro:</strong> Para transacciones en Ethereum L1, programa contratos entre 00:00 y 08:00 UTC para ahorrar hasta un 65% en gas fees. En L2 (Base, Arbitrum, Optimism), las tarifas son ultra bajas las 24 horas gracias a los blobs EIP-4844.
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
