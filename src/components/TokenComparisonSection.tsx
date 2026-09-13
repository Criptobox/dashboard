import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  BarChart3,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  Activity,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { TokenItem } from '../types';
import { TokenLogo } from './TokenLogo';
import { getTokenDetailedMetrics, formatLargeUsd } from '../data/tokenMetricsData';
import { getAssetRiskEvaluation } from '../utils/aiRiskScorer';

interface TokenComparisonSectionProps {
  tokens: TokenItem[];
  onOpenActionModal?: (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => void;
  onShowToast: (title: string, msg: string) => void;
  initialTokenAId?: string;
  initialTokenBId?: string;
}

export const TokenComparisonSection: React.FC<TokenComparisonSectionProps> = ({
  tokens,
  onOpenActionModal,
  onShowToast,
  initialTokenAId = 'eth',
  initialTokenBId = 'sol',
}) => {
  const [tokenAId, setTokenAId] = useState<string>(initialTokenAId);
  const [tokenBId, setTokenBId] = useState<string>(initialTokenBId);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [volumeChartMode, setVolumeChartMode] = useState<'usd' | 'percent'>('usd');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'marketCap' | 'aiRisk' | 'liquidity' | 'volume'>('all');

  // Find token items or fall back to first/second available
  const tokenA = useMemo(() => {
    return tokens.find((t) => t.id === tokenAId) || tokens[0] || null;
  }, [tokens, tokenAId]);

  const tokenB = useMemo(() => {
    const found = tokens.find((t) => t.id === tokenBId);
    if (found && found.id !== tokenA?.id) return found;
    return tokens.find((t) => t.id !== tokenA?.id) || tokens[1] || tokens[0] || null;
  }, [tokens, tokenBId, tokenA]);

  // Retrieve detailed metrics and AI risk analysis
  const metricsA = useMemo(() => (tokenA ? getTokenDetailedMetrics(tokenA) : null), [tokenA]);
  const metricsB = useMemo(() => (tokenB ? getTokenDetailedMetrics(tokenB) : null), [tokenB]);

  const riskA = useMemo(() => (tokenA ? getAssetRiskEvaluation(tokenA.symbol) : null), [tokenA]);
  const riskB = useMemo(() => (tokenB ? getAssetRiskEvaluation(tokenB.symbol) : null), [tokenB]);

  // Swap Token A & Token B
  const handleSwapTokens = () => {
    if (!tokenA || !tokenB) return;
    const prevA = tokenA.id;
    const prevB = tokenB.id;
    setTokenAId(prevB);
    setTokenBId(prevA);
    onShowToast('Posiciones Invertidas', `Comparando ${tokenB.symbol} frente a ${tokenA.symbol}`);
  };

  // Presets
  const handleSelectPreset = (aId: string, bId: string) => {
    setTokenAId(aId);
    setTokenBId(bId);
    const symA = tokens.find((t) => t.id === aId)?.symbol || aId;
    const symB = tokens.find((t) => t.id === bId)?.symbol || bId;
    onShowToast('Par Seleccionado', `${symA} vs ${symB}`);
  };

  // 7-day Historical Volume chart data
  const combinedVolumeChartData = useMemo(() => {
    if (!metricsA || !metricsB) return [];

    return metricsA.historicalVolume7d.map((ptA, index) => {
      const ptB = metricsB.historicalVolume7d[index] || { volumeUsd: 0 };
      const volA = ptA.volumeUsd;
      const volB = ptB.volumeUsd;
      const total = volA + volB || 1;

      return {
        day: ptA.dayLabel,
        date: ptA.date,
        volumeA: volumeChartMode === 'usd' ? Number((volA / 1e9).toFixed(3)) : Number(((volA / total) * 100).toFixed(1)),
        volumeB: volumeChartMode === 'usd' ? Number((volB / 1e9).toFixed(3)) : Number(((volB / total) * 100).toFixed(1)),
        rawUsdA: volA,
        rawUsdB: volB,
      };
    });
  }, [metricsA, metricsB, volumeChartMode]);

  if (!tokenA || !tokenB || !metricsA || !metricsB || !riskA || !riskB) {
    return null;
  }

  // Calculate comparative ratios & shares
  const totalMarketCap = metricsA.marketCapUsd + metricsB.marketCapUsd || 1;
  const shareCapA = (metricsA.marketCapUsd / totalMarketCap) * 100;
  const shareCapB = (metricsB.marketCapUsd / totalMarketCap) * 100;
  const capRatio = metricsA.marketCapUsd >= metricsB.marketCapUsd
    ? (metricsA.marketCapUsd / (metricsB.marketCapUsd || 1)).toFixed(1)
    : (metricsB.marketCapUsd / (metricsA.marketCapUsd || 1)).toFixed(1);
  const capLeader = metricsA.marketCapUsd >= metricsB.marketCapUsd ? tokenA : tokenB;

  const totalLiquidity = metricsA.totalLiquidityUsd + metricsB.totalLiquidityUsd || 1;
  const shareLiqA = (metricsA.totalLiquidityUsd / totalLiquidity) * 100;
  const shareLiqB = (metricsB.totalLiquidityUsd / totalLiquidity) * 100;
  const liqLeader = metricsA.totalLiquidityUsd >= metricsB.totalLiquidityUsd ? tokenA : tokenB;

  const totalVol24h = metricsA.volume24hUsd + metricsB.volume24hUsd || 1;
  const shareVolA = (metricsA.volume24hUsd / totalVol24h) * 100;
  const shareVolB = (metricsB.volume24hUsd / totalVol24h) * 100;
  const volLeader = metricsA.volume24hUsd >= metricsB.volume24hUsd ? tokenA : tokenB;

  // Lower risk score = safer
  const riskSafer = riskA.score <= riskB.score ? tokenA : tokenB;

  // Color tokens
  const colorA = '#4cd7f6'; // Cyan
  const colorB = '#d0bcff'; // Lavender / Purple

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#191b23] border border-[#3d494c]/60 shadow-xl transition-all">
      {/* Header bar with expand toggle */}
      <div className="p-4 border-b border-[#272a32] flex items-center justify-between gap-3 bg-[#1d1f27]/90 backdrop-blur-xs flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4cd7f6]/20 to-[#d0bcff]/20 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6] shrink-0 shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-code-sm text-[#e1e2ec]">
                Comparativa de Tokens Lado a Lado
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-code-sm bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-[#bcc9cd] mt-0.5">
              Análisis institucional: Market Cap, Auditoría IA, Liquidez y Volumen Histórico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Preset Selector Chips */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-code-sm">
            <button
              onClick={() => handleSelectPreset('eth', 'sol')}
              className={`px-2 py-1 rounded-lg border transition-all ${
                tokenA.id === 'eth' && tokenB.id === 'sol'
                  ? 'bg-[#4cd7f6]/20 border-[#4cd7f6] text-[#4cd7f6] font-bold'
                  : 'bg-[#10131a] border-[#3d494c]/40 text-[#bcc9cd] hover:text-[#e1e2ec]'
              }`}
            >
              ETH / SOL
            </button>
            <button
              onClick={() => handleSelectPreset('sol', 'link-base')}
              className={`px-2 py-1 rounded-lg border transition-all ${
                tokenA.id === 'sol' && tokenB.id === 'link-base'
                  ? 'bg-[#4cd7f6]/20 border-[#4cd7f6] text-[#4cd7f6] font-bold'
                  : 'bg-[#10131a] border-[#3d494c]/40 text-[#bcc9cd] hover:text-[#e1e2ec]'
              }`}
            >
              SOL / LINK
            </button>
            <button
              onClick={() => handleSelectPreset('eth', 'pol')}
              className={`px-2 py-1 rounded-lg border transition-all ${
                tokenA.id === 'eth' && tokenB.id === 'pol'
                  ? 'bg-[#4cd7f6]/20 border-[#4cd7f6] text-[#4cd7f6] font-bold'
                  : 'bg-[#10131a] border-[#3d494c]/40 text-[#bcc9cd] hover:text-[#e1e2ec]'
              }`}
            >
              ETH / POL
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#10131a] hover:bg-[#272a32] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#3d494c]/40 transition-all cursor-pointer"
            title={isExpanded ? 'Minimizar comparador' : 'Expandir comparador'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Dual Token Selector Bar */}
      <div className="p-4 bg-gradient-to-b from-[#14171f] to-[#191b23] border-b border-[#272a32]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Token A Selector Card */}
          <div className="p-3 rounded-xl bg-[#1d1f27] border-2 border-[#4cd7f6]/40 hover:border-[#4cd7f6]/70 transition-all shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TokenLogo symbol={tokenA.symbol} size="md" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#e1e2ec]">{tokenA.name}</span>
                    <span className="text-[10px] font-code-sm px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-semibold">
                      Token A
                    </span>
                  </div>
                  <span className="text-[11px] text-[#869397] font-code-sm">{tokenA.chainLabel}</span>
                </div>
              </div>

              {/* Selector dropdown for Token A */}
              <div className="relative">
                <select
                  value={tokenA.id}
                  onChange={(e) => {
                    const newId = e.target.value;
                    if (newId === tokenB.id) {
                      handleSwapTokens();
                    } else {
                      setTokenAId(newId);
                    }
                  }}
                  className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg bg-[#10131a] text-xs font-code-sm font-bold text-[#4cd7f6] border border-[#4cd7f6]/40 hover:border-[#4cd7f6] focus:outline-none cursor-pointer"
                >
                  {tokens.map((t) => (
                    <option key={`opt-a-${t.id}`} value={t.id} disabled={t.id === tokenB.id}>
                      {t.symbol} ({t.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#4cd7f6] absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quick stats for Token A */}
            <div className="mt-2.5 pt-2 border-t border-[#3d494c]/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#869397] block">Precio Actual</span>
                <span className="font-bold font-code-md text-sm text-[#e1e2ec]">
                  ${tokenA.priceUsd.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#869397] block">24h Variación</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-bold font-code-sm ${
                    tokenA.change24h >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {tokenA.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {tokenA.change24h >= 0 ? `+${tokenA.change24h}%` : `${tokenA.change24h}%`}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-[#869397] block">Saldo Cartera</span>
                <span className="font-code-sm text-xs text-[#bcc9cd]">
                  {tokenA.balance.toLocaleString()} {tokenA.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Center Swap Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-3 rounded-full bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] hover:text-[#4cd7f6] border border-[#3d494c]/60 shadow-lg hover:rotate-180 transition-all duration-300 active:scale-90 cursor-pointer"
              title="Invertir Token A y Token B"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Token B Selector Card */}
          <div className="p-3 rounded-xl bg-[#1d1f27] border-2 border-[#d0bcff]/40 hover:border-[#d0bcff]/70 transition-all shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TokenLogo symbol={tokenB.symbol} size="md" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#e1e2ec]">{tokenB.name}</span>
                    <span className="text-[10px] font-code-sm px-1.5 py-0.2 rounded bg-[#d0bcff]/20 text-[#d0bcff] font-semibold">
                      Token B
                    </span>
                  </div>
                  <span className="text-[11px] text-[#869397] font-code-sm">{tokenB.chainLabel}</span>
                </div>
              </div>

              {/* Selector dropdown for Token B */}
              <div className="relative">
                <select
                  value={tokenB.id}
                  onChange={(e) => {
                    const newId = e.target.value;
                    if (newId === tokenA.id) {
                      handleSwapTokens();
                    } else {
                      setTokenBId(newId);
                    }
                  }}
                  className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg bg-[#10131a] text-xs font-code-sm font-bold text-[#d0bcff] border border-[#d0bcff]/40 hover:border-[#d0bcff] focus:outline-none cursor-pointer"
                >
                  {tokens.map((t) => (
                    <option key={`opt-b-${t.id}`} value={t.id} disabled={t.id === tokenA.id}>
                      {t.symbol} ({t.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#d0bcff] absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quick stats for Token B */}
            <div className="mt-2.5 pt-2 border-t border-[#3d494c]/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#869397] block">Precio Actual</span>
                <span className="font-bold font-code-md text-sm text-[#e1e2ec]">
                  ${tokenB.priceUsd.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#869397] block">24h Variación</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-bold font-code-sm ${
                    tokenB.change24h >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {tokenB.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {tokenB.change24h >= 0 ? `+${tokenB.change24h}%` : `${tokenB.change24h}%`}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-[#869397] block">Saldo Cartera</span>
                <span className="font-code-sm text-xs text-[#bcc9cd]">
                  {tokenB.balance.toLocaleString()} {tokenB.symbol}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-5"
          >
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeCategoryTab === 'all'
                    ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                Todas las Métricas
              </button>
              <button
                onClick={() => setActiveCategoryTab('marketCap')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === 'marketCap'
                    ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                <span>Market Cap</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
              </button>
              <button
                onClick={() => setActiveCategoryTab('aiRisk')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === 'aiRisk'
                    ? 'bg-[#272a32] text-[#4edea3] shadow-sm'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#4edea3]" />
                <span>Riesgo IA</span>
              </button>
              <button
                onClick={() => setActiveCategoryTab('liquidity')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === 'liquidity'
                    ? 'bg-[#272a32] text-[#06b6d4] shadow-sm'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                <Droplets className="w-3 h-3 text-[#06b6d4]" />
                <span>Liquidez</span>
              </button>
              <button
                onClick={() => setActiveCategoryTab('volume')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === 'volume'
                    ? 'bg-[#272a32] text-[#d0bcff] shadow-sm'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                <BarChart3 className="w-3 h-3 text-[#d0bcff]" />
                <span>Volumen Histórico</span>
              </button>
            </div>

            {/* SECTION 1: MARKET CAP COMPARISON */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'marketCap') && (
              <div className="p-4 rounded-xl bg-[#14171f] border border-[#272a32] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                    <span className="text-xs font-bold text-[#e1e2ec] font-sans">
                      Capitalización de Mercado (Market Cap)
                    </span>
                  </div>
                  <span className="text-[11px] font-code-sm font-semibold px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30">
                    {capLeader.symbol} domina por {capRatio}x
                  </span>
                </div>

                {/* Side-by-side metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs font-code-sm">
                  {/* Token A Market Cap */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border-l-2 border-l-[#4cd7f6] border-y border-r border-[#272a32]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#869397]">{tokenA.symbol} Cap</span>
                      <span className="text-[10px] font-bold text-[#4cd7f6]">Rank #{metricsA.marketCapRank}</span>
                    </div>
                    <p className="text-base font-bold text-[#e1e2ec] mt-1">
                      {formatLargeUsd(metricsA.marketCapUsd)}
                    </p>
                    <div className="text-[10px] text-[#869397] mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>FDV:</span>
                        <span className="text-[#bcc9cd]">{formatLargeUsd(metricsA.fdvUsd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Circulante:</span>
                        <span className="text-[#bcc9cd]">{metricsA.circulatingSupply}</span>
                      </div>
                    </div>
                  </div>

                  {/* Token B Market Cap */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border-r-2 border-r-[#d0bcff] border-y border-l border-[#272a32]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#869397]">{tokenB.symbol} Cap</span>
                      <span className="text-[10px] font-bold text-[#d0bcff]">Rank #{metricsB.marketCapRank}</span>
                    </div>
                    <p className="text-base font-bold text-[#e1e2ec] mt-1">
                      {formatLargeUsd(metricsB.marketCapUsd)}
                    </p>
                    <div className="text-[10px] text-[#869397] mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>FDV:</span>
                        <span className="text-[#bcc9cd]">{formatLargeUsd(metricsB.fdvUsd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Circulante:</span>
                        <span className="text-[#bcc9cd]">{metricsB.circulatingSupply}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relative Proportion Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-code-sm text-[#869397]">
                    <span className="text-[#4cd7f6]">{tokenA.symbol}: {shareCapA.toFixed(1)}%</span>
                    <span className="text-[#d0bcff]">{tokenB.symbol}: {shareCapB.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[#10131a] flex">
                    <div
                      style={{ width: `${shareCapA}%` }}
                      className="h-full bg-[#4cd7f6] transition-all duration-500"
                    />
                    <div
                      style={{ width: `${shareCapB}%` }}
                      className="h-full bg-[#d0bcff] transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: AI RISK & SECURITY AUDIT */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'aiRisk') && (
              <div className="p-4 rounded-xl bg-[#14171f] border border-[#272a32] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4edea3]" />
                    <span className="text-xs font-bold text-[#e1e2ec] font-sans">
                      Auditoría de Riesgo IA (Menor puntuación = Menor riesgo)
                    </span>
                  </div>
                  <span className="text-[11px] font-code-sm font-semibold px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                    Más Seguro: {riskSafer.symbol}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-code-sm">
                  {/* Token A Risk */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border border-[#272a32] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4cd7f6]">{tokenA.symbol}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: riskA.bgColor, color: riskA.tagColor }}
                      >
                        {riskA.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-code-lg text-[#e1e2ec]">{riskA.score}</span>
                      <span className="text-[10px] text-[#869397]">/ 100 Riesgo Global</span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-[#3d494c]/30 text-[10px]">
                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Seguridad Contrato:</span>
                          <span className="text-[#4edea3] font-bold">{riskA.breakdown.contractSecurity}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#4edea3]"
                            style={{ width: `${riskA.breakdown.contractSecurity}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Estabilidad Volatilidad:</span>
                          <span className="text-[#4cd7f6] font-bold">{riskA.breakdown.historicalVolatility}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#4cd7f6]"
                            style={{ width: `${riskA.breakdown.historicalVolatility}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Salud Liquidez:</span>
                          <span className="text-[#d0bcff] font-bold">{riskA.breakdown.liquidityHealth}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#d0bcff]"
                            style={{ width: `${riskA.breakdown.liquidityHealth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#869397] italic leading-tight pt-1">
                      "{riskA.breakdown.contractNotes}"
                    </p>
                  </div>

                  {/* Token B Risk */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border border-[#272a32] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#d0bcff]">{tokenB.symbol}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: riskB.bgColor, color: riskB.tagColor }}
                      >
                        {riskB.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-code-lg text-[#e1e2ec]">{riskB.score}</span>
                      <span className="text-[10px] text-[#869397]">/ 100 Riesgo Global</span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-[#3d494c]/30 text-[10px]">
                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Seguridad Contrato:</span>
                          <span className="text-[#4edea3] font-bold">{riskB.breakdown.contractSecurity}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#4edea3]"
                            style={{ width: `${riskB.breakdown.contractSecurity}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Estabilidad Volatilidad:</span>
                          <span className="text-[#4cd7f6] font-bold">{riskB.breakdown.historicalVolatility}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#4cd7f6]"
                            style={{ width: `${riskB.breakdown.historicalVolatility}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[#869397] mb-0.5">
                          <span>Salud Liquidez:</span>
                          <span className="text-[#d0bcff] font-bold">{riskB.breakdown.liquidityHealth}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#10131a] overflow-hidden">
                          <div
                            className="h-full bg-[#d0bcff]"
                            style={{ width: `${riskB.breakdown.liquidityHealth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#869397] italic leading-tight pt-1">
                      "{riskB.breakdown.contractNotes}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: LIQUIDITY DEPTH & SLIPPAGE */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'liquidity') && (
              <div className="p-4 rounded-xl bg-[#14171f] border border-[#272a32] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#06b6d4]" />
                    <span className="text-xs font-bold text-[#e1e2ec] font-sans">
                      Liquidez en DEX & Eficiencia de Ejecución
                    </span>
                  </div>
                  <span className="text-[11px] font-code-sm font-semibold px-2 py-0.5 rounded-full bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30">
                    Líder: {liqLeader.symbol} ({formatLargeUsd(liqLeader === tokenA ? metricsA.totalLiquidityUsd : metricsB.totalLiquidityUsd)})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-code-sm">
                  {/* Token A Liquidity */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border border-[#272a32] space-y-2">
                    <span className="font-bold text-[#4cd7f6]">{tokenA.symbol} Liquidez</span>
                    <p className="text-base font-bold text-[#e1e2ec]">
                      {formatLargeUsd(metricsA.totalLiquidityUsd)}
                    </p>
                    <div className="space-y-1 text-[10px] text-[#869397] border-t border-[#3d494c]/30 pt-1.5">
                      <div className="flex justify-between">
                        <span>Slippage ($25k):</span>
                        <span className="text-[#4edea3] font-bold font-code-sm">
                          ~{metricsA.slippage25kPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profundidad ±2%:</span>
                        <span className="text-[#bcc9cd]">{formatLargeUsd(metricsA.depth2PercentUsd)}</span>
                      </div>
                      <div className="pt-0.5">
                        <span className="block text-[9px] text-[#869397]">Pools Principales:</span>
                        <span className="text-[10px] text-[#bcc9cd] truncate block font-sans">
                          {metricsA.mainDexPools[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Token B Liquidity */}
                  <div className="p-3 rounded-lg bg-[#1d1f27] border border-[#272a32] space-y-2">
                    <span className="font-bold text-[#d0bcff]">{tokenB.symbol} Liquidez</span>
                    <p className="text-base font-bold text-[#e1e2ec]">
                      {formatLargeUsd(metricsB.totalLiquidityUsd)}
                    </p>
                    <div className="space-y-1 text-[10px] text-[#869397] border-t border-[#3d494c]/30 pt-1.5">
                      <div className="flex justify-between">
                        <span>Slippage ($25k):</span>
                        <span className="text-[#4edea3] font-bold font-code-sm">
                          ~{metricsB.slippage25kPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profundidad ±2%:</span>
                        <span className="text-[#bcc9cd]">{formatLargeUsd(metricsB.depth2PercentUsd)}</span>
                      </div>
                      <div className="pt-0.5">
                        <span className="block text-[9px] text-[#869397]">Pools Principales:</span>
                        <span className="text-[10px] text-[#bcc9cd] truncate block font-sans">
                          {metricsB.mainDexPools[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liquidity share bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-code-sm text-[#869397]">
                    <span className="text-[#4cd7f6]">{tokenA.symbol}: {shareLiqA.toFixed(1)}%</span>
                    <span className="text-[#d0bcff]">{tokenB.symbol}: {shareLiqB.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[#10131a] flex">
                    <div
                      style={{ width: `${shareLiqA}%` }}
                      className="h-full bg-[#06b6d4] transition-all duration-500"
                    />
                    <div
                      style={{ width: `${shareLiqB}%` }}
                      className="h-full bg-[#d0bcff] transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: HISTORICAL VOLUME COMPARISON */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'volume') && (
              <div className="p-4 rounded-xl bg-[#14171f] border border-[#272a32] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#d0bcff]" />
                    <span className="text-xs font-bold text-[#e1e2ec] font-sans">
                      Volumen Histórico Comparado (Últimos 7 Días)
                    </span>
                  </div>

                  {/* USD vs Percent Switch */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#10131a] border border-[#3d494c]/40 text-[10px] font-code-sm">
                    <button
                      onClick={() => setVolumeChartMode('usd')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        volumeChartMode === 'usd'
                          ? 'bg-[#272a32] text-[#4cd7f6]'
                          : 'text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      USD ($B)
                    </button>
                    <button
                      onClick={() => setVolumeChartMode('percent')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        volumeChartMode === 'percent'
                          ? 'bg-[#272a32] text-[#d0bcff]'
                          : 'text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      Proporción (%)
                    </button>
                  </div>
                </div>

                {/* 24h & 7d Key Volume summary blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-code-sm">
                  <div className="p-2.5 rounded-lg bg-[#1d1f27] border border-[#272a32]">
                    <span className="text-[10px] text-[#869397] block">Volumen 24h ({tokenA.symbol})</span>
                    <span className="font-bold text-[#4cd7f6] text-sm mt-0.5 block">
                      {formatLargeUsd(metricsA.volume24hUsd)}
                    </span>
                    <span className="text-[10px] text-[#869397]">
                      Rotación: {(metricsA.volumeToMarketCapRatio * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#1d1f27] border border-[#272a32]">
                    <span className="text-[10px] text-[#869397] block">Volumen 24h ({tokenB.symbol})</span>
                    <span className="font-bold text-[#d0bcff] text-sm mt-0.5 block">
                      {formatLargeUsd(metricsB.volume24hUsd)}
                    </span>
                    <span className="text-[10px] text-[#869397]">
                      Rotación: {(metricsB.volumeToMarketCapRatio * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#1d1f27] border border-[#272a32]">
                    <span className="text-[10px] text-[#869397] block">Promedio 7D ({tokenA.symbol})</span>
                    <span className="font-bold text-[#bcc9cd] text-sm mt-0.5 block">
                      {formatLargeUsd(metricsA.volume7dAvgUsd)}
                    </span>
                    <span className="text-[10px] text-[#869397]">Diario consolidado</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#1d1f27] border border-[#272a32]">
                    <span className="text-[10px] text-[#869397] block">Promedio 7D ({tokenB.symbol})</span>
                    <span className="font-bold text-[#bcc9cd] text-sm mt-0.5 block">
                      {formatLargeUsd(metricsB.volume7dAvgUsd)}
                    </span>
                    <span className="text-[10px] text-[#869397]">Diario consolidado</span>
                  </div>
                </div>

                {/* Recharts Bar Chart side-by-side volume comparison */}
                <div className="w-full h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={combinedVolumeChartData}
                      margin={{ top: 8, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#272a32" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#869397"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#272a32' }}
                      />
                      <YAxis
                        stroke="#869397"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        unit={volumeChartMode === 'usd' ? 'B' : '%'}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-[#10131a]/95 border border-[#3d494c] shadow-xl text-xs font-code-sm space-y-1.5">
                              <span className="font-bold text-[#e1e2ec] block border-b border-[#272a32] pb-1">
                                {label} ({data.date})
                              </span>
                              <div className="flex items-center justify-between gap-4 text-[#4cd7f6]">
                                <span>{tokenA.symbol}:</span>
                                <span className="font-bold">
                                  {volumeChartMode === 'usd'
                                    ? formatLargeUsd(data.rawUsdA)
                                    : `${data.volumeA}%`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[#d0bcff]">
                                <span>{tokenB.symbol}:</span>
                                <span className="font-bold">
                                  {volumeChartMode === 'usd'
                                    ? formatLargeUsd(data.rawUsdB)
                                    : `${data.volumeB}%`}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={28}
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-[11px] font-code-sm text-[#bcc9cd]">
                            {value === 'volumeA' ? `${tokenA.symbol} (${volumeChartMode === 'usd' ? '$' : '%'})` : `${tokenB.symbol} (${volumeChartMode === 'usd' ? '$' : '%'})`}
                          </span>
                        )}
                      />
                      <Bar
                        dataKey="volumeA"
                        fill={colorA}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="volumeB"
                        fill={colorB}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bottom Executive AI Summary & Swap Trigger */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#161922] via-[#1a1e28] to-[#161922] border border-[#4cd7f6]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#e1e2ec] flex items-center gap-1.5">
                    Dictamen Comparativo Sentinel AI
                  </span>
                  <p className="text-[11px] text-[#bcc9cd] mt-0.5 leading-snug">
                    <strong className="text-[#4cd7f6]">{capLeader.symbol}</strong> ostenta mayor capitalización ({capRatio}x) y profundidad de liquidez, mientras que{' '}
                    <strong className="text-[#4edea3]">{riskSafer.symbol}</strong> ofrece la mejor puntuación de riesgo y menor volatilidad en 90 días.
                  </p>
                </div>
              </div>

              {onOpenActionModal && (
                <button
                  onClick={() => onOpenActionModal('swap', tokenA)}
                  className="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00a572] to-[#4edea3] hover:from-[#4edea3] hover:to-[#00a572] text-[#003824] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Swap {tokenA.symbol} ➔ {tokenB.symbol}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
