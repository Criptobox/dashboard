import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenItem, ScreenTab, TransactionRecord } from '../types';
import { TokenLogo } from './TokenLogo';
import { TokenRowItem } from './TokenRowItem';
import { AiRiskBadge } from './AiRiskBadge';
import { TransactionHistoryView } from './TransactionHistoryView';
import { NetworkHeatmapWidget } from './NetworkHeatmapWidget';
import { NetworkAllocationPieChart } from './NetworkAllocationPieChart';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { MarketPulseBackground } from './MarketPulseBackground';
import { TokenComparisonSection } from './TokenComparisonSection';
import { PortfolioImpactCalculator } from './PortfolioImpactCalculator';
import { calculatePortfolioRisk } from '../utils/portfolioImpactCalculator';
import { INITIAL_TRANSACTIONS } from '../data/mockData';
import {
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  GitFork,
  ShieldAlert,
  ArrowRight,
  Activity,
  Gauge,
  Layers,
  ChevronRight,
  Fuel,
  Radar,
  Sparkles,
  RefreshCw,
  Zap,
  Scale,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';

interface DashboardScreenProps {
  tokens: TokenItem[];
  currentChain: string;
  onSelectChain: (chain: string) => void;
  onNavigateTab: (tab: ScreenTab) => void;
  onOpenActionModal: (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => void;
  gasSaverMode: boolean;
  onToggleGasSaverMode: () => void;
  readyAirdropsCount?: number;
  onShowToast: (title: string, msg: string) => void;
  onSimulateMarketPulse?: () => void;
  transactions?: TransactionRecord[];
  onUpdateTransactions?: (updater: (prev: TransactionRecord[]) => TransactionRecord[]) => void;
  isRealPortfolio?: boolean;
  isLoadingRealPortfolio?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  tokens,
  currentChain,
  onSelectChain,
  onNavigateTab,
  onOpenActionModal,
  gasSaverMode,
  onToggleGasSaverMode,
  readyAirdropsCount = 2,
  onShowToast,
  onSimulateMarketPulse,
  transactions = INITIAL_TRANSACTIONS,
  onUpdateTransactions,
  isRealPortfolio = false,
  isLoadingRealPortfolio = false,
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState<'tokens' | 'impact' | 'compare' | 'defi' | 'history'>('tokens');
  const [compareTokenAId, setCompareTokenAId] = useState<string>('eth');
  const [compareTokenBId, setCompareTokenBId] = useState<string>('sol');

  // Compute live portfolio risk metrics
  const portfolioRisk = React.useMemo(() => calculatePortfolioRisk(tokens), [tokens]);

  const handleCompareTokenFromRow = (selectedToken: TokenItem) => {
    if (selectedToken.id === compareTokenAId) {
      // Already selected as Token A
    } else {
      setCompareTokenBId(compareTokenAId);
      setCompareTokenAId(selectedToken.id);
    }
    setActiveAssetTab('compare');
    onShowToast('Comparador de Tokens', `Analizando métricas de ${selectedToken.symbol} frente a frente`);
  };

  const chainsBar = [
    { id: 'all', name: 'Todas (8)', val: 84920.45 },
    { id: 'eth', name: 'Ethereum', val: 49530.12, icon: 'eth' },
    { id: 'sol', name: 'Solana', val: 21375.00, icon: 'sol' },
    { id: 'arb', name: 'Arbitrum', val: 8450.00, dot: '#4cd7f6' },
    { id: 'polygon', name: 'Polygon', val: 2142.00, dot: '#d0bcff' },
    { id: 'base', name: 'Base', val: 3423.33, dot: '#06b6d4' },
    { id: 'bnb', name: 'BNB Chain', val: 0.00, dot: '#6ffbbe' },
    { id: 'op', name: 'Optimism', val: 0.00, dot: '#ffb4ab' },
    { id: 'avax', name: 'Avalanche', val: 0.00, dot: '#93000a' },
  ];

  // Calculate filtered tokens
  const filteredTokens = currentChain === 'all'
    ? tokens
    : tokens.filter((t) => t.chain === currentChain);

  // Calculate dynamic consolidated value from tokens
  const totalTokensValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const activeChainTokens = currentChain === 'all'
    ? tokens
    : tokens.filter((t) => t.chain === currentChain);
  const chainValue = activeChainTokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const displayTotal = currentChain === 'all' ? totalTokensValue : chainValue;

  const [isSyncingPrices, setIsSyncingPrices] = useState(false);
  const [pulseCount, setPulseCount] = useState(1);
  const prevPriceHash = useRef(tokens.map((t) => t.priceUsd).join(','));

  // Automatically trigger subtle particle pulse animation whenever token prices update
  useEffect(() => {
    const currentPriceHash = tokens.map((t) => t.priceUsd).join(',');
    if (prevPriceHash.current !== currentPriceHash) {
      prevPriceHash.current = currentPriceHash;
      setPulseCount((prev) => prev + 1);
    }
  }, [tokens]);

  // Overall market trend based on tokens 24h weighted change
  const totalChange24h = tokens.reduce((sum, t) => sum + (t.change24h * t.valueUsd), 0) / (totalTokensValue || 1);
  const marketTrend: 'bullish' | 'bearish' | 'neutral' =
    totalChange24h >= 0.05 ? 'bullish' : totalChange24h <= -0.05 ? 'bearish' : 'neutral';

  const handleSyncPrices = () => {
    setIsSyncingPrices(true);
    setPulseCount((prev) => prev + 1);
    if (onSimulateMarketPulse) {
      onSimulateMarketPulse();
    }
    setTimeout(() => {
      setIsSyncingPrices(false);
    }, 700);
  };

  return (
    <div className="relative flex flex-col w-full px-4 lg:px-6 space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Dynamic Particle Background reacting to Market Pulse & Price Updates */}
      <MarketPulseBackground
        pulseTrigger={pulseCount}
        isSyncing={isSyncingPrices}
        marketTrend={marketTrend}
      />

      {/* Consolidated Balance Card */}
      <div className="relative z-10 overflow-hidden rounded-2xl bg-[#272a32]/80 backdrop-blur-xs border border-[#3d494c]/50 p-5 shadow-xl">
        {/* Ambient Holographic Glow Blooms */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#4cd7f6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#4edea3]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#bcc9cd] uppercase tracking-widest font-semibold font-sans">
              Valor Neto Consolidado
            </span>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="text-[#bcc9cd] hover:text-[#4cd7f6] transition-colors p-1 rounded-md"
              title={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {isLoadingRealPortfolio ? (
              <span
                className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 text-[9px] font-code-sm font-bold uppercase tracking-wider animate-pulse"
                title="Consultando tu saldo real on-chain"
              >
                Leyendo Wallet...
              </span>
            ) : isRealPortfolio ? (
              <span
                className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 text-[9px] font-code-sm font-bold uppercase tracking-wider"
                title="Balance leído directamente de tu wallet conectada"
              >
                Saldo Real
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-full bg-[#d0bcff]/15 text-[#d0bcff] border border-[#d0bcff]/30 text-[9px] font-code-sm font-bold uppercase tracking-wider"
                title="Portafolio de demostración — conecta tu wallet para ver tu saldo real"
              >
                Demo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncPrices}
              disabled={isSyncingPrices}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10131a]/80 hover:bg-[#10131a] text-[#4cd7f6] border border-[#4cd7f6]/30 text-[10px] font-code-sm font-semibold transition-all cursor-pointer active:scale-95"
              title="Pulsar oráculo de precios y emitir onda reactiva de partículas"
            >
              <Zap className={`w-3 h-3 ${isSyncingPrices ? 'animate-bounce text-[#4edea3]' : 'text-[#4cd7f6]'}`} />
              <span className="hidden sm:inline">Market Pulse:</span>
              <span>{isSyncingPrices ? 'PULSANDO...' : 'EN VIVO'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
            </button>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-code-sm text-xs font-bold">+8.42%</span>
            </div>
          </div>
        </div>

        {/* Main Balance with Animated Entrance/Exit */}
        <div className="relative z-10 mt-2.5 flex items-baseline gap-1">
          <span className="font-code-sm text-base text-[#4cd7f6] font-semibold">$</span>
          <div className="relative overflow-hidden inline-flex">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h1
                key={hideBalance ? 'hidden' : displayTotal.toFixed(2)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="font-display-lg-mobile text-3xl sm:text-4xl text-[#e1e2ec] tracking-tight font-code-lg font-bold"
              >
                {hideBalance ? '••••••••' : displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.h1>
            </AnimatePresence>
          </div>
          <span className="font-code-sm text-xs text-[#bcc9cd] font-medium ml-1">USD</span>
        </div>

        {/* Sparkline Micro-Chart */}
        <div className="relative z-10 mt-4 pt-1">
          <div className="flex justify-between items-end mb-1 text-xs">
            <span className="text-[11px] text-[#bcc9cd]">24h Rendimiento</span>
            <span className="font-code-sm text-xs text-[#4edea3] font-semibold">+$6,589.10 hoy</span>
          </div>

          <div className="w-full h-12">
            <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 340 48">
              <defs>
                <linearGradient id="balanceGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#4edea3" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#10131a" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#4cd7f6" />
                  <stop offset="65%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#4edea3" />
                </linearGradient>
              </defs>
              <path
                d="M0,42 C30,40 50,44 80,36 C110,28 135,32 165,22 C195,12 215,26 245,14 C275,2 300,10 340,4 L340,48 L0,48 Z"
                fill="url(#balanceGlow)"
              />
              <path
                d="M0,42 C30,40 50,44 80,36 C110,28 135,32 165,22 C195,12 215,26 245,14 C275,2 300,10 340,4"
                stroke="url(#strokeGradient)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
              <circle cx="339" cy="4" r="3.5" className="fill-[#4edea3] drop-shadow-[0_0_6px_#4edea3]" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Action Orb Buttons */}
      <div className="relative z-10 grid grid-cols-4 gap-2 py-1">
        <button
          onClick={() => onOpenActionModal('send')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#4cd7f6] shadow-lg shadow-[#4cd7f6]/10 border border-[#3d494c]/40 transition-transform active:scale-95 group-hover:border-[#4cd7f6]/50">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-[#e1e2ec]">Enviar</span>
        </button>

        <button
          onClick={() => onOpenActionModal('receive')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#4edea3] shadow-lg shadow-[#4edea3]/10 border border-[#3d494c]/40 transition-transform active:scale-95 group-hover:border-[#4edea3]/50">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-[#e1e2ec]">Recibir</span>
        </button>

        <button
          onClick={() => onOpenActionModal('swap')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#d0bcff] shadow-lg shadow-[#d0bcff]/10 border border-[#3d494c]/40 transition-transform active:scale-95 group-hover:border-[#d0bcff]/50">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-[#e1e2ec]">Swap</span>
        </button>

        <button
          onClick={() => onOpenActionModal('bridge')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#acedff] shadow-lg shadow-[#06b6d4]/10 border border-[#3d494c]/40 transition-transform active:scale-95 group-hover:border-[#acedff]/50">
            <GitFork className="w-6 h-6 rotate-90" />
          </div>
          <span className="text-xs font-semibold text-[#e1e2ec]">Bridge</span>
        </button>
      </div>

      {/* Callout Banners: AI Risk Overview, Rescue Alert & Airdrop Radar */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:items-stretch">
      {/* Global Portfolio AI Risk Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#191b23] via-[#1c1f28] to-[#242731] p-4 border border-[#3d494c]/50 shadow-md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border"
              style={{
                backgroundColor: `${portfolioRisk.themeColor}1a`,
                borderColor: `${portfolioRisk.themeColor}40`,
                color: portfolioRisk.themeColor,
              }}
            >
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#e1e2ec]">Riesgo IA Global de Cartera</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold font-code-sm"
                  style={{
                    backgroundColor: `${portfolioRisk.themeColor}25`,
                    color: portfolioRisk.themeColor,
                  }}
                >
                  {portfolioRisk.weightedScore} / 100 • {portfolioRisk.riskLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#bcc9cd] mt-0.5">
                Seguridad contratos: <span className="text-[#4edea3] font-semibold">{portfolioRisk.weightedContractSecurity}%</span> • Volatilidad: <span className="text-[#4cd7f6] font-semibold">{portfolioRisk.weightedHistoricalVolatility}%</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveAssetTab('impact');
              onShowToast('Calculadora de Impacto', 'Simula la variación del riesgo antes de ejecutar un swap');
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] hover:text-[#acedff] border border-[#4cd7f6]/40 text-xs font-bold font-sans flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Simular Impacto Swap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Smart Security Rescue Alert Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#191b23] via-[#1d1f27] to-[#272a32] p-4 border border-[#3d494c]/50 shadow-md">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#4edea3] to-[#4cd7f6]" />
        <div className="flex items-start justify-between gap-3 pl-1">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0 mt-0.5 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#4edea3] uppercase font-code-sm font-bold tracking-wider">
                  Hallazgo de Rescate
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
              </div>
              <p className="text-sm text-[#e1e2ec] mt-1 font-semibold leading-snug">
                Detectados <span className="font-code-sm font-bold text-[#4cd7f6]">$4,280 USD</span> en contratos inactivos
              </p>
              <p className="text-xs text-[#bcc9cd] mt-0.5">
                2 fondos atrapados listos para recuperar a bóveda fría.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pl-1 flex items-center justify-end">
          <button
            onClick={() => onNavigateTab('rescue')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00a572] hover:bg-[#4edea3] text-[#003824] hover:text-[#002113] font-sans text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <span>Iniciar Rescate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Airdrop Hunter Radar Callout Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#191b23] via-[#1d1f27] to-[#1a1e28] border border-[#4edea3]/40 p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0">
              <Radar className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#e1e2ec]">Cacería de Airdrops</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00a572]/20 text-[#4edea3] text-[10px] font-extrabold font-code-sm">
                  {readyAirdropsCount} LISTOS
                </span>
              </div>
              <p className="text-xs text-[#bcc9cd] mt-0.5">
                $5,841.00 USD listos para reclamar (LayerZero y Hyperliquid).
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('airdrops')}
            className="shrink-0 px-3 py-1.5 rounded-full bg-[#4edea3] hover:bg-[#00a572] text-[#003824] hover:text-[#ffffff] text-xs font-bold font-sans flex items-center gap-1 transition-all active:scale-95"
          >
            <span>Ver Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </div>

      {/* Portfolio Performance Line Chart (Recharts) */}
      <PortfolioPerformanceChart
        currentTotal={displayTotal}
        hideBalance={hideBalance}
        currentChain={currentChain}
        onShowToast={onShowToast}
      />

      {/* Network Asset Allocation Chart & Real-time Gas Heatmap, side by side on desktop */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-stretch">
        <NetworkAllocationPieChart
          tokens={tokens}
          currentChain={currentChain}
          onSelectChain={onSelectChain}
          hideBalance={hideBalance}
          onShowToast={onShowToast}
        />

        <NetworkHeatmapWidget
          currentChain={currentChain}
          onSelectChain={onSelectChain}
          onOpenActionModal={onOpenActionModal}
          gasSaverMode={gasSaverMode}
          onShowToast={onShowToast}
        />
      </div>

      {/* Horizontal Multi-Chain Carousel */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#bcc9cd] uppercase tracking-wider font-semibold font-code-sm">
            Redes Activas
          </span>
          <span className="font-code-sm text-xs text-[#869397]">8 conectadas</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-4 px-4 scrollbar-none">
          {chainsBar.map((ch) => {
            const isSelected = currentChain === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChain(ch.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-code-sm text-xs shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-md shadow-[#4cd7f6]/20'
                    : 'bg-[#1d1f27] text-[#e1e2ec] hover:bg-[#272a32] border border-[#3d494c]/30'
                }`}
              >
                {ch.id === 'all' ? (
                  <Activity className="w-3.5 h-3.5" />
                ) : ch.id === 'eth' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#627eea]" />
                ) : ch.id === 'sol' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14f195]" />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.dot || '#4cd7f6' }} />
                )}
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Segmented Navigation Tabs */}
      <div className="pt-1">
        <div className="flex p-1 rounded-xl bg-[#191b23] border border-[#272a32] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveAssetTab('tokens')}
            className={`flex-1 min-w-[70px] py-2 text-center rounded-lg text-xs font-bold transition-all ${
              activeAssetTab === 'tokens'
                ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
                : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => {
              setActiveAssetTab('impact');
              onShowToast('Calculadora de Impacto', 'Prediciendo cambios de riesgo IA para swaps de cartera');
            }}
            className={`flex-1 min-w-[95px] py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeAssetTab === 'impact'
                ? 'bg-[#272a32] text-[#4edea3] shadow-sm'
                : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Impacto IA</span>
          </button>
          <button
            onClick={() => {
              setActiveAssetTab('compare');
              onShowToast('Comparador Lado a Lado', 'Comparativa institucional de Market Cap, Riesgo IA, Liquidez y Volumen');
            }}
            className={`flex-1 min-w-[85px] py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeAssetTab === 'compare'
                ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comparar</span>
          </button>
          <button
            onClick={() => {
              setActiveAssetTab('defi');
              onShowToast('Staking DeFi', 'Sincronizando posiciones de rendimiento en Aave y Uniswap');
            }}
            className={`flex-1 min-w-[75px] py-2 text-center rounded-lg text-xs font-bold transition-all ${
              activeAssetTab === 'defi'
                ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
                : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
            }`}
          >
            DeFi
          </button>
          <button
            onClick={() => {
              setActiveAssetTab('history');
              onShowToast('Historial Multichain', 'Consultando las últimas 24 transacciones');
            }}
            className={`flex-1 min-w-[75px] py-2 text-center rounded-lg text-xs font-bold transition-all ${
              activeAssetTab === 'history'
                ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
                : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Token Portfolio Asset Feed Header & Pyth Oracle Status */}
      <div className="flex items-center justify-between pt-1 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#e1e2ec]">
            {activeAssetTab === 'tokens'
              ? `Tokens en Cartera (${filteredTokens.length})`
              : activeAssetTab === 'impact'
              ? 'Calculadora de Impacto & Riesgo IA'
              : activeAssetTab === 'compare'
              ? 'Comparativa Lado a Lado de Tokens'
              : activeAssetTab === 'defi'
              ? 'Posiciones de Rendimiento'
              : `Historial de Bloques & Mempool (${transactions.length})`}
          </span>
          {activeAssetTab === 'tokens' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4edea3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span>Pyth Oracle</span>
            </div>
          )}
          {activeAssetTab === 'impact' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4edea3]">
              <Sparkles className="w-2.5 h-2.5 text-[#4edea3]" />
              <span>Motor Predictivo Cuántico</span>
            </div>
          )}
          {activeAssetTab === 'compare' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4cd7f6]">
              <Sparkles className="w-2.5 h-2.5 text-[#4edea3]" />
              <span>Auditoría IA & Métricas</span>
            </div>
          )}
          {activeAssetTab === 'defi' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4edea3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span>Aave & Lido APY</span>
            </div>
          )}
          {activeAssetTab === 'history' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4cd7f6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
              <span>RPC Mempool Live</span>
            </div>
          )}
        </div>

        {activeAssetTab === 'tokens' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setActiveAssetTab('impact');
                onShowToast('Calculadora de Impacto', 'Prediciendo cambios de riesgo IA para swaps de cartera');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4edea3] text-[11px] font-semibold transition-all border border-[#4edea3]/40 cursor-pointer shadow-sm active:scale-95"
              title="Abrir calculadora de impacto y riesgo IA para swaps"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulador IA</span>
              <span className="sm:hidden">Impacto</span>
            </button>
            <button
              onClick={() => {
                setActiveAssetTab('compare');
                onShowToast('Comparador', 'Accediendo a la comparativa de tokens lado a lado');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] text-[11px] font-semibold transition-all border border-[#4cd7f6]/40 cursor-pointer shadow-sm active:scale-95"
              title="Abrir vista dedicada del comparador de tokens"
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comparar</span>
            </button>
            <button
              onClick={handleSyncPrices}
              disabled={isSyncingPrices}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] text-[11px] font-semibold transition-all border border-[#3d494c]/40 cursor-pointer disabled:opacity-60"
              title="Sincronizar cotizaciones en vivo con el oráculo Pyth"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPrices ? 'animate-spin text-[#4edea3]' : ''}`} />
              <span className="hidden sm:inline">{isSyncingPrices ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Asset Content with Motion Transitions */}
      <AnimatePresence mode="wait">
        {activeAssetTab === 'tokens' && (
          <motion.div
            key="tab-tokens"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Portfolio Impact Risk Calculator Widget */}
            <PortfolioImpactCalculator
              tokens={tokens}
              onOpenActionModal={onOpenActionModal}
              onShowToast={onShowToast}
            />

            {/* Inline Interactive Token Comparison Module */}
            <TokenComparisonSection
              tokens={tokens}
              onOpenActionModal={onOpenActionModal}
              onShowToast={onShowToast}
              initialTokenAId={compareTokenAId}
              initialTokenBId={compareTokenBId}
            />

            <motion.div layout className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[#869397] uppercase tracking-wider font-code-sm">
                  Desglose de Cartera Individual
                </span>
                <span className="text-[11px] text-[#869397]">
                  Usa "Comparar" o el "Simulador IA"
                </span>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredTokens.length === 0 ? (
                  <motion.div
                    key="empty-tokens"
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 rounded-2xl bg-[#1d1f27] text-center border border-[#272a32]"
                  >
                    <Layers className="w-8 h-8 text-[#869397] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#e1e2ec]">No hay tokens en esta red</p>
                    <p className="text-xs text-[#bcc9cd] mt-1">
                      Selecciona "Todas (8)" para ver el saldo consolidado
                    </p>
                  </motion.div>
                ) : (
                  filteredTokens.map((token) => (
                    <TokenRowItem
                      key={token.id}
                      token={token}
                      hideBalance={hideBalance}
                      onOpenActionModal={onOpenActionModal}
                      onCompareToken={handleCompareTokenFromRow}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {activeAssetTab === 'impact' && (
          <motion.div
            key="tab-impact"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            <PortfolioImpactCalculator
              tokens={tokens}
              onOpenActionModal={onOpenActionModal}
              onShowToast={onShowToast}
            />
          </motion.div>
        )}

        {activeAssetTab === 'compare' && (
          <motion.div
            key="tab-compare"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            <TokenComparisonSection
              tokens={tokens}
              onOpenActionModal={onOpenActionModal}
              onShowToast={onShowToast}
              initialTokenAId={compareTokenAId}
              initialTokenBId={compareTokenBId}
            />
          </motion.div>
        )}

        {activeAssetTab === 'defi' && (
          <motion.div
            key="tab-defi"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-2.5"
          >
            <div className="p-3.5 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenLogo symbol="USDC" size="lg" />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-sm text-[#e1e2ec]">Aave v3 Lending Vault</h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#00a572]/20 text-[#4edea3] font-code-sm text-[10px] font-bold">
                      5.42% APY
                    </span>
                    <AiRiskBadge symbol="USDC" tokenName="Aave v3 USDC Vault" size="sm" />
                  </div>
                  <p className="text-xs text-[#bcc9cd] mt-0.5">Depósito Activo • Ganancia diaria ~$2.80</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-code-md text-sm font-bold text-[#e1e2ec]">$18,450.00</span>
                <span className="block font-code-sm text-xs text-[#4edea3]">+$124.18 acum.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenLogo symbol="ETH" size="lg" />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-sm text-[#e1e2ec]">Lido Liquid Staking (wstETH)</h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-code-sm text-[10px] font-bold">
                      3.85% APR
                    </span>
                    <AiRiskBadge symbol="ETH" tokenName="Lido Liquid Staking" size="sm" />
                  </div>
                  <p className="text-xs text-[#bcc9cd] mt-0.5">Ethereum L1 • Rendimiento de Consenso</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-code-md text-sm font-bold text-[#e1e2ec]">$12,890.40</span>
                <span className="block font-code-sm text-xs text-[#bcc9cd]">3.85 wstETH</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeAssetTab === 'history' && (
          <motion.div
            key="tab-history"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <TransactionHistoryView
              transactions={transactions}
              onUpdateTransactions={onUpdateTransactions}
              onShowToast={onShowToast}
              gasSaverMode={gasSaverMode}
              onToggleGasSaverMode={onToggleGasSaverMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gas Saver Mode & Network Telemetry Card */}
      <div className={`p-3.5 rounded-2xl border transition-all ${
        gasSaverMode
          ? 'bg-[#00a572]/10 border-[#4edea3]/40 shadow-md shadow-[#4edea3]/5'
          : 'bg-[#191b23] border-[#272a32]'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              gasSaverMode ? 'bg-[#00a572]/20 text-[#4edea3]' : 'bg-[#272a32] text-[#869397]'
            }`}>
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#e1e2ec]">
                  {gasSaverMode ? 'Modo de Ahorro de Gas: ACTIVO' : 'Modo de Ahorro de Gas: INACTIVO'}
                </span>
                <span className={`w-2 h-2 rounded-full ${gasSaverMode ? 'bg-[#4edea3] animate-ping' : 'bg-[#3d494c]'}`} />
              </div>
              <p className="text-[11px] text-[#bcc9cd] mt-0.5">
                {gasSaverMode
                  ? 'Tarifas reducidas un ~55% (Prioridad Eco: 7 Gwei). Bundles en horario off-peak.'
                  : 'Prioridad estándar en mempool (14 Gwei). Activa el modo para reducir tarifas.'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleGasSaverMode}
            className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 shrink-0 ${
              gasSaverMode
                ? 'bg-[#4edea3] text-[#003824] hover:bg-[#00a572] hover:text-white'
                : 'bg-[#272a32] text-[#e1e2ec] hover:bg-[#32353d] border border-[#3d494c]'
            }`}
          >
            {gasSaverMode ? 'Desactivar' : 'Activar Ahorro'}
          </button>
        </div>
      </div>
    </div>
  );
};
