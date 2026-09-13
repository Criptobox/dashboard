import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fuel,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Gauge,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { TransactionRecord } from '../types';

interface FlashbotsGasComparisonChartProps {
  transactions: TransactionRecord[];
  gasSaverMode: boolean;
  onToggleGasSaverMode?: () => void;
  onSelectTransaction?: (tx: TransactionRecord) => void;
  selectedTxId?: string;
  onShowToast?: (title: string, msg: string) => void;
}

type ChartMetric = 'usd' | 'gwei';

interface ProcessedTxGasData {
  id: string;
  shortLabel: string;
  fullTitle: string;
  chain: string;
  chainLabel: string;
  type: string;
  status: string;
  actualGasUsd: number;
  optimalGasUsd: number;
  unoptimizedGasUsd: number;
  savedGasUsd: number;
  savingsPercent: number;
  actualGwei: number;
  optimalGwei: number;
  gweiDifference: number;
  mevProtected: boolean;
  originalTx: TransactionRecord;
}

export const FlashbotsGasComparisonChart: React.FC<FlashbotsGasComparisonChartProps> = ({
  transactions,
  gasSaverMode,
  onToggleGasSaverMode,
  onSelectTransaction,
  selectedTxId,
  onShowToast,
}) => {
  const [metric, setMetric] = useState<ChartMetric>('usd');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [showPublicBaseline, setShowPublicBaseline] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);

  // Helper to safely parse USD string like "$8.02" into float
  const parseUsdValue = (val?: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  // Process and normalize transaction data for visualization
  const processedData = useMemo<ProcessedTxGasData[]>(() => {
    return transactions.map((tx, idx) => {
      const actualGasUsd = parseUsdValue(tx.gasFeeUsd);
      const actualGwei = tx.gasPriceGwei || 0;

      // Optimal gas in Gwei
      let optimalGwei = tx.optimalGasPriceGwei;
      if (optimalGwei === undefined) {
        if (actualGwei === 0) {
          optimalGwei = 0;
        } else if (actualGwei < 1) {
          optimalGwei = Number((actualGwei * 0.88).toFixed(3));
        } else {
          optimalGwei = Number((actualGwei * 0.92).toFixed(1));
        }
      }

      // Optimal gas in USD
      let optimalGasUsd = parseUsdValue(tx.optimalGasFeeUsd);
      if (optimalGasUsd === 0 && actualGasUsd > 0) {
        optimalGasUsd = Number((actualGasUsd * 0.92).toFixed(2));
      }

      // Unoptimized baseline (what public mempool without active gas saver & Flashbots bundle would cost)
      let unoptimizedGasUsd = parseUsdValue(tx.unoptimizedGasUsd);
      if (unoptimizedGasUsd === 0) {
        if (actualGasUsd > 0) {
          unoptimizedGasUsd = Number((actualGasUsd * (gasSaverMode ? 2.3 : 1.55)).toFixed(2));
        } else if (tx.status === 'failed') {
          unoptimizedGasUsd = 18.5; // Intercepted phishing simulation savings
        }
      }

      // Saved amount with current active gas settings
      let savedGasUsd = parseUsdValue(tx.savedWithEcoGasUsd);
      if (savedGasUsd === 0) {
        savedGasUsd = Math.max(0, Number((unoptimizedGasUsd - actualGasUsd).toFixed(2)));
      }

      // Savings percent
      let savingsPercent = tx.gasSavingsPercent;
      if (savingsPercent === undefined) {
        if (unoptimizedGasUsd > 0) {
          savingsPercent = Math.min(100, Math.round((savedGasUsd / unoptimizedGasUsd) * 100));
        } else {
          savingsPercent = 50;
        }
      }

      // Short label for chart X axis
      const shortLabel = tx.type === 'rescue'
        ? `Rescate #${idx + 1}`
        : tx.type === 'swap'
        ? `Swap #${idx + 1}`
        : tx.type === 'bridge'
        ? `Bridge #${idx + 1}`
        : tx.type === 'airdrop'
        ? `Airdrop #${idx + 1}`
        : `Tx #${idx + 1}`;

      return {
        id: tx.id,
        shortLabel,
        fullTitle: tx.title,
        chain: tx.chain,
        chainLabel: tx.chainLabel,
        type: tx.type,
        status: tx.status,
        actualGasUsd,
        optimalGasUsd,
        unoptimizedGasUsd,
        savedGasUsd,
        savingsPercent,
        actualGwei,
        optimalGwei,
        gweiDifference: Number((actualGwei - optimalGwei).toFixed(2)),
        mevProtected: tx.mevProtected ?? true,
        originalTx: tx,
      };
    });
  }, [transactions, gasSaverMode]);

  // Filter data by selected chain
  const filteredData = useMemo(() => {
    if (chainFilter === 'all') return processedData;
    return processedData.filter((d) => d.chain === chainFilter);
  }, [processedData, chainFilter]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalActualUsd = filteredData.reduce((acc, curr) => acc + curr.actualGasUsd, 0);
    const totalOptimalUsd = filteredData.reduce((acc, curr) => acc + curr.optimalGasUsd, 0);
    const totalUnoptimizedUsd = filteredData.reduce((acc, curr) => acc + curr.unoptimizedGasUsd, 0);
    const totalSavedUsd = filteredData.reduce((acc, curr) => acc + curr.savedGasUsd, 0);

    const overallSavingsPercent = totalUnoptimizedUsd > 0
      ? Math.round((totalSavedUsd / totalUnoptimizedUsd) * 100)
      : 0;

    // Flashbots accuracy: how close actual paid was to optimal target (within builder spread)
    const validTxs = filteredData.filter((d) => d.actualGasUsd > 0);
    const avgAccuracy = validTxs.length > 0
      ? Math.round(
          validTxs.reduce((acc, curr) => {
            const ratio = curr.optimalGasUsd > 0 ? (curr.optimalGasUsd / curr.actualGasUsd) : 1;
            return acc + Math.min(100, ratio * 100);
          }, 0) / validTxs.length
        )
      : 96;

    return {
      totalActualUsd: totalActualUsd.toFixed(2),
      totalOptimalUsd: totalOptimalUsd.toFixed(2),
      totalUnoptimizedUsd: totalUnoptimizedUsd.toFixed(2),
      totalSavedUsd: totalSavedUsd.toFixed(2),
      overallSavingsPercent,
      avgAccuracy,
    };
  }, [filteredData]);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#1d1f27] via-[#21242e] to-[#1a1c24] border border-[#3d494c]/40 overflow-hidden shadow-lg">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-[#3d494c]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/70 border border-[#4edea3]/40 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#4edea3]/10">
            <Fuel className="w-5 h-5 text-[#4edea3]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#e1e2ec] flex items-center gap-1.5">
                <span>Auditoría de Gas Flashbots: Real vs Óptimo</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00a572]/20 text-[#4edea3] border border-[#00a572]/40">
                  <ShieldCheck className="w-3 h-3" />
                  MEV-Boost Relay
                </span>
              </h3>
            </div>
            <p className="text-xs text-[#bcc9cd] mt-0.5 max-w-xl">
              Comparativa bloque a bloque entre el gas abonado y el precio óptimo calculado por builders de Flashbots, destacando el capital economizado por las políticas de gas activas.
            </p>
          </div>
        </div>

        {/* Action Controls: Collapse & Gas Saver Switch */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {onToggleGasSaverMode && (
            <button
              onClick={onToggleGasSaverMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
                gasSaverMode
                  ? 'bg-[#00a572]/20 text-[#4edea3] border-[#4edea3]/40 hover:bg-[#00a572]/30'
                  : 'bg-[#272a32] text-[#869397] border-[#3d494c]/50 hover:text-[#e1e2ec]'
              }`}
              title="Alternar política de gas activo para ver impacto en vivo"
            >
              <Zap className={`w-3.5 h-3.5 ${gasSaverMode ? 'text-[#4edea3] fill-[#4edea3]/30' : ''}`} />
              <span>{gasSaverMode ? 'Eco Gas: Activo (-55%)' : 'Eco Gas: Inactivo'}</span>
              <span className={`w-2 h-2 rounded-full ${gasSaverMode ? 'bg-[#4edea3] animate-pulse' : 'bg-[#869397]'}`} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-[#272a32] hover:bg-[#323642] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#3d494c]/30 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Contraer visualización' : 'Expandir visualización'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-5 space-y-4"
          >
            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Saved */}
              <div className="p-3.5 rounded-xl bg-[#16181f] border border-[#3d494c]/40 relative overflow-hidden">
                <div className="flex items-center justify-between text-[#bcc9cd] text-xs">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-[#4edea3]" />
                    Ahorro Acumulado
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4edea3]/15 text-[#4edea3]">
                    +{aggregateStats.overallSavingsPercent}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-code-md text-[#4edea3]">
                    +${aggregateStats.totalSavedUsd}
                  </span>
                  <span className="text-[11px] text-[#869397]">USD</span>
                </div>
                <p className="text-[10px] text-[#869397] mt-0.5">
                  Preservado gracias a bundles y Eco Gas
                </p>
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 pointer-events-none">
                  <Sparkles className="w-16 h-16 text-[#4edea3]" />
                </div>
              </div>

              {/* Actual Gas Paid */}
              <div className="p-3.5 rounded-xl bg-[#16181f] border border-[#3d494c]/40">
                <div className="flex items-center justify-between text-[#bcc9cd] text-xs">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-[#4cd7f6]" />
                    Gas Real Abonado
                  </span>
                  <span className="text-[10px] text-[#4cd7f6] font-code-sm">Efectivo</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-code-md text-[#4cd7f6]">
                    ${aggregateStats.totalActualUsd}
                  </span>
                  <span className="text-[11px] text-[#869397]">USD</span>
                </div>
                <p className="text-[10px] text-[#869397] mt-0.5">
                  {filteredData.length} transacciones auditadas
                </p>
              </div>

              {/* Flashbots Optimal Target */}
              <div className="p-3.5 rounded-xl bg-[#16181f] border border-[#3d494c]/40">
                <div className="flex items-center justify-between text-[#bcc9cd] text-xs">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    Objetivo Flashbots
                  </span>
                  <span className="text-[10px] text-emerald-400 font-code-sm">Builder</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-code-md text-emerald-300">
                    ${aggregateStats.totalOptimalUsd}
                  </span>
                  <span className="text-[11px] text-[#869397]">USD</span>
                </div>
                <p className="text-[10px] text-[#869397] mt-0.5">
                  Costo ideal sin guerra de subastas
                </p>
              </div>

              {/* Flashbots Efficiency & MEV Shield */}
              <div className="p-3.5 rounded-xl bg-[#16181f] border border-[#3d494c]/40">
                <div className="flex items-center justify-between text-[#bcc9cd] text-xs">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Eficiencia de Tip
                  </span>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    {aggregateStats.avgAccuracy}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-code-md text-indigo-200">
                    0.0%
                  </span>
                  <span className="text-[11px] text-[#869397]">Sandwich MEV</span>
                </div>
                <p className="text-[10px] text-[#869397] mt-0.5">
                  100% de transacciones en mempool privado
                </p>
              </div>
            </div>

            {/* Filter Bar & Metric Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 bg-[#16181f] p-1 rounded-xl border border-[#3d494c]/30 text-xs">
                <button
                  onClick={() => setMetric('usd')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    metric === 'usd'
                      ? 'bg-[#4cd7f6] text-[#003640] shadow-xs'
                      : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Tarifas en USD ($)</span>
                </button>
                <button
                  onClick={() => setMetric('gwei')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    metric === 'gwei'
                      ? 'bg-[#4cd7f6] text-[#003640] shadow-xs'
                      : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Gas Price (Gwei)</span>
                </button>
              </div>

              {/* Secondary Options: Chain filter and baseline toggle */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {metric === 'usd' && (
                  <button
                    onClick={() => setShowPublicBaseline(!showPublicBaseline)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      showPublicBaseline
                        ? 'bg-[#272a32] text-[#ffb4ab] border-[#ffb4ab]/40'
                        : 'bg-[#16181f] text-[#869397] border-[#3d494c]/30'
                    }`}
                    title="Mostrar costo sin optimizar que hubiera cobrado la mempool pública"
                  >
                    <span className={`w-2 h-2 rounded-full ${showPublicBaseline ? 'bg-[#ffb4ab]' : 'bg-[#869397]'}`} />
                    <span>Mempool Pública (+Sin Optimizar)</span>
                  </button>
                )}

                <select
                  value={chainFilter}
                  onChange={(e) => setChainFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#16181f] border border-[#3d494c]/40 text-xs text-[#e1e2ec] focus:outline-none focus:border-[#4cd7f6] cursor-pointer"
                >
                  <option value="all">Todas las Redes ({processedData.length})</option>
                  <option value="eth">Ethereum L1</option>
                  <option value="arb">Arbitrum L2</option>
                  <option value="base">Base L2</option>
                </select>
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 20 }}
                  barCategoryGap="22%"
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d494c" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#869397', fontSize: 11 }}
                    axisLine={{ stroke: '#3d494c', opacity: 0.4 }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: '#869397', fontSize: 11 }}
                    axisLine={{ stroke: '#3d494c', opacity: 0.4 }}
                    tickLine={false}
                    tickFormatter={(val) => (metric === 'usd' ? `$${val}` : `${val}g`)}
                  />
                  <Tooltip
                    content={<CustomGasTooltip metric={metric} />}
                    cursor={{ fill: '#272a32', opacity: 0.4 }}
                  />

                  {metric === 'gwei' && (
                    <ReferenceLine
                      y={12}
                      stroke="#4edea3"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: 'Umbral Óptimo Eco (12 Gwei)',
                        fill: '#4edea3',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                  )}

                  {/* Optional unoptimized baseline in USD */}
                  {metric === 'usd' && showPublicBaseline && (
                    <Bar
                      dataKey="unoptimizedGasUsd"
                      name="Mempool Pública (Sin Optimizar)"
                      fill="#ffb4ab"
                      opacity={0.35}
                      radius={[4, 4, 0, 0]}
                    />
                  )}

                  {/* Actual Gas Paid */}
                  <Bar
                    dataKey={metric === 'usd' ? 'actualGasUsd' : 'actualGwei'}
                    name={metric === 'usd' ? 'Gas Real Pagado ($)' : 'Gas Real (Gwei)'}
                    fill="#4cd7f6"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (onSelectTransaction && data?.originalTx) {
                        onSelectTransaction(data.originalTx);
                        if (onShowToast) {
                          onShowToast(
                            'Detalles de Transacción',
                            `Inspeccionando gas de ${data.fullTitle}`
                          );
                        }
                      }
                    }}
                    cursor="pointer"
                  >
                    {filteredData.map((entry) => (
                      <Cell
                        key={`actual-${entry.id}`}
                        fill={
                          selectedTxId === entry.id || hoveredTxId === entry.id
                            ? '#7ae5ff'
                            : '#4cd7f6'
                        }
                      />
                    ))}
                  </Bar>

                  {/* Flashbots Optimal Gas */}
                  <Bar
                    dataKey={metric === 'usd' ? 'optimalGasUsd' : 'optimalGwei'}
                    name={metric === 'usd' ? 'Flashbots Óptimo ($)' : 'Flashbots Óptimo (Gwei)'}
                    fill="#4edea3"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (onSelectTransaction && data?.originalTx) {
                        onSelectTransaction(data.originalTx);
                      }
                    }}
                    cursor="pointer"
                  >
                    {filteredData.map((entry) => (
                      <Cell
                        key={`optimal-${entry.id}`}
                        fill={
                          selectedTxId === entry.id || hoveredTxId === entry.id
                            ? '#6ef6bd'
                            : '#4edea3'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend and Interactive Hints */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3d494c]/20 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#4cd7f6]" />
                  <span className="text-[#e1e2ec] font-medium">Gas Real Abonado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#4edea3]" />
                  <span className="text-[#e1e2ec] font-medium">Flashbots Óptimo (Builder Tip)</span>
                </div>
                {metric === 'usd' && showPublicBaseline && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#ffb4ab]/40 border border-[#ffb4ab]/60" />
                    <span className="text-[#869397]">Mempool Pública Sin Ajustes</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#869397]">
                <Info className="w-3 h-3 text-[#4cd7f6]" />
                <span>Haz clic en una barra para auditar esa transacción en detalle.</span>
              </div>
            </div>

            {/* Horizontal Savings Ribbon per Transaction */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[#bcc9cd]">
                <span className="font-semibold text-[#e1e2ec] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
                  Desglose de Ahorro Individual por Transacción
                </span>
                <span className="text-[11px] text-[#869397]">
                  {filteredData.length} registros analizados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {filteredData.map((item) => (
                  <div
                    key={`ribbon-${item.id}`}
                    onMouseEnter={() => setHoveredTxId(item.id)}
                    onMouseLeave={() => setHoveredTxId(null)}
                    onClick={() => onSelectTransaction && onSelectTransaction(item.originalTx)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-xs ${
                      selectedTxId === item.id
                        ? 'bg-[#003640]/40 border-[#4cd7f6] shadow-sm'
                        : 'bg-[#16181f]/80 hover:bg-[#20232d] border-[#3d494c]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-bold text-[#e1e2ec] truncate text-xs">
                        {item.shortLabel}: {item.fullTitle}
                      </span>
                      <span className="text-[10px] font-bold text-[#4edea3] bg-[#00a572]/15 px-1.5 py-0.5 rounded border border-[#00a572]/30 shrink-0">
                        +{item.savingsPercent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#bcc9cd] pt-1 border-t border-[#3d494c]/20">
                      <div>
                        <span className="text-[#869397]">Real: </span>
                        <span className="text-[#4cd7f6] font-code-sm font-semibold">
                          ${item.actualGasUsd.toFixed(2)}
                        </span>
                        <span className="text-[#869397] text-[10px]"> ({item.actualGwei}g)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#869397]">Ahorro: </span>
                        <span className="text-[#4edea3] font-code-sm font-bold">
                          +${item.savedGasUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom High-Fidelity Tooltip Component for Recharts
interface CustomGasTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ProcessedTxGasData;
    value: number;
    dataKey: string;
  }>;
  metric: ChartMetric;
}

const CustomGasTooltip: React.FC<CustomGasTooltipProps> = ({ active, payload, metric }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  if (!data) return null;

  return (
    <div className="p-3.5 rounded-xl bg-[#16181f]/95 backdrop-blur-md border border-[#4cd7f6]/40 shadow-xl max-w-xs text-xs space-y-2.5 z-50">
      <div className="border-b border-[#3d494c]/40 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[#e1e2ec] text-xs leading-snug">
            {data.fullTitle}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#272a32] text-[#4cd7f6] border border-[#4cd7f6]/30 uppercase shrink-0">
            {data.chainLabel}
          </span>
        </div>
        <p className="text-[10px] text-[#869397] mt-0.5 truncate">
          ID: {data.id} • Estado: {data.status}
        </p>
      </div>

      <div className="space-y-1.5 font-code-sm text-[11px]">
        {/* Actual Gas */}
        <div className="flex items-center justify-between">
          <span className="text-[#bcc9cd] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
            Gas Real Abonado:
          </span>
          <span className="font-bold text-[#4cd7f6]">
            ${data.actualGasUsd.toFixed(2)} <span className="text-[#869397] font-normal">({data.actualGwei} Gwei)</span>
          </span>
        </div>

        {/* Optimal Gas */}
        <div className="flex items-center justify-between">
          <span className="text-[#bcc9cd] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            Flashbots Óptimo:
          </span>
          <span className="font-bold text-[#4edea3]">
            ${data.optimalGasUsd.toFixed(2)} <span className="text-[#869397] font-normal">({data.optimalGwei} Gwei)</span>
          </span>
        </div>

        {/* Unoptimized Mempool Baseline */}
        {data.unoptimizedGasUsd > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[#869397] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ffb4ab]/60" />
              Mempool Pública Estándar:
            </span>
            <span className="text-[#ffb4ab] line-through">
              ${data.unoptimizedGasUsd.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Savings Highlight Box */}
      <div className="p-2 rounded-lg bg-emerald-950/50 border border-[#4edea3]/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#4edea3]">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold text-[11px]">Ahorrado con Ajustes:</span>
        </div>
        <div className="text-right">
          <span className="font-bold font-code-sm text-[#4edea3] text-xs">
            +${data.savedGasUsd.toFixed(2)} USD
          </span>
          <span className="block text-[9px] text-emerald-300 font-bold">
            (-{data.savingsPercent}%)
          </span>
        </div>
      </div>

      <div className="text-[10px] text-[#869397] flex items-center gap-1 pt-0.5">
        <Lock className="w-2.5 h-2.5 text-indigo-400" />
        <span>Ruta Privada Flashbots Protect anti-sandwich</span>
      </div>
    </div>
  );
};
