import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Maximize2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type PerformanceTimeframe = '24h' | '7d' | '30d' | '90d' | '1y';

interface PortfolioDataPoint {
  timestamp: string;
  displayDate: string;
  fullDate: string;
  value: number;
  ethShare: number;
  solShare: number;
  stableShare: number;
  altShare: number;
  pnlDollar: number;
  pnlPercent: number;
}

interface PortfolioPerformanceChartProps {
  currentTotal: number;
  hideBalance?: boolean;
  currentChain?: string;
  onShowToast?: (title: string, msg: string) => void;
}

export const PortfolioPerformanceChart: React.FC<PortfolioPerformanceChartProps> = ({
  currentTotal,
  hideBalance = false,
  currentChain = 'all',
  onShowToast,
}) => {
  const [timeframe, setTimeframe] = useState<PerformanceTimeframe>('7d');
  const [activePoint, setActivePoint] = useState<PortfolioDataPoint | null>(null);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState<boolean>(false);

  // Generate realistic historical performance data points relative to current total value
  const chartData = useMemo<PortfolioDataPoint[]>(() => {
    const baseValue = currentTotal > 0 ? currentTotal : 84920.45;
    const points: PortfolioDataPoint[] = [];

    // Configuration according to timeframe
    let count = 7;
    let volatility = 0.015;
    let trendFactor = 0.054; // General positive market drift

    switch (timeframe) {
      case '24h':
        count = 12; // every 2 hours
        volatility = 0.006;
        trendFactor = 0.018;
        break;
      case '7d':
        count = 7; // daily
        volatility = 0.024;
        trendFactor = 0.062;
        break;
      case '30d':
        count = 30; // 30 days
        volatility = 0.038;
        trendFactor = 0.145;
        break;
      case '90d':
        count = 15; // every 6 days
        volatility = 0.045;
        trendFactor = 0.22;
        break;
      case '1y':
        count = 12; // monthly
        volatility = 0.06;
        trendFactor = 0.48;
        break;
    }

    // Deterministic pseudo-random seed based on index & currentTotal
    // Work backwards from baseValue so current point always matches currentTotal
    const rawMultipliers: number[] = [];
    let currentMultiplier = 1.0;
    rawMultipliers.unshift(currentMultiplier);

    // Pre-calculated wave pattern for realistic organic market curve
    const sineWaves = [
      -0.012, 0.018, -0.005, 0.022, 0.014, -0.018, -0.008, 0.031, 0.012, -0.025,
      0.015, -0.01, 0.02, 0.005, -0.015, 0.018, -0.008, 0.024, 0.011, -0.019,
      0.009, -0.014, 0.027, 0.016, -0.022, 0.019, -0.006, 0.021, 0.013, -0.016,
    ];

    for (let i = 1; i < count; i++) {
      const wave = sineWaves[i % sineWaves.length] * (volatility * 10);
      const stepTrend = (trendFactor / count);
      // Moving back in time: subtract trend, add inverse wave
      currentMultiplier = currentMultiplier - stepTrend + wave;
      // Floor at 0.4x to avoid negative/unrealistic crash
      currentMultiplier = Math.max(0.4, currentMultiplier);
      rawMultipliers.unshift(currentMultiplier);
    }

    // First point multiplier to normalize baseline
    const startMultiplier = rawMultipliers[0];
    const initialBaseline = (baseValue / rawMultipliers[rawMultipliers.length - 1]) * startMultiplier;

    const now = new Date('2026-09-13T10:45:00Z');

    for (let i = 0; i < count; i++) {
      const stepIndex = count - 1 - i;
      let pointDate = new Date(now);

      if (timeframe === '24h') {
        pointDate.setHours(now.getHours() - stepIndex * 2);
      } else if (timeframe === '7d') {
        pointDate.setDate(now.getDate() - stepIndex);
      } else if (timeframe === '30d') {
        pointDate.setDate(now.getDate() - stepIndex);
      } else if (timeframe === '90d') {
        pointDate.setDate(now.getDate() - stepIndex * 6);
      } else if (timeframe === '1y') {
        pointDate.setMonth(now.getMonth() - stepIndex);
      }

      // Exact current value for the very last point
      const computedValue = i === count - 1
        ? baseValue
        : Math.round((baseValue * (rawMultipliers[i] / rawMultipliers[count - 1])) * 100) / 100;

      const pnlDollar = computedValue - initialBaseline;
      const pnlPercent = initialBaseline > 0 ? (pnlDollar / initialBaseline) * 100 : 0;

      // Label format based on timeframe
      let displayDate = '';
      if (timeframe === '24h') {
        displayDate = `${pointDate.getHours().toString().padStart(2, '0')}:00`;
      } else if (timeframe === '7d') {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        displayDate = days[pointDate.getDay()];
      } else if (timeframe === '30d') {
        displayDate = `${pointDate.getDate()}/${pointDate.getMonth() + 1}`;
      } else if (timeframe === '90d') {
        displayDate = `${pointDate.getDate()} ${pointDate.toLocaleString('es-ES', { month: 'short' })}`;
      } else {
        displayDate = pointDate.toLocaleString('es-ES', { month: 'short' });
      }

      const fullDate = pointDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: timeframe === '24h' ? '2-digit' : undefined,
        minute: timeframe === '24h' ? '2-digit' : undefined,
      });

      // Relative asset composition shares
      points.push({
        timestamp: pointDate.toISOString(),
        displayDate,
        fullDate,
        value: computedValue,
        ethShare: Math.round(computedValue * 0.583 * 100) / 100,
        solShare: Math.round(computedValue * 0.252 * 100) / 100,
        stableShare: Math.round(computedValue * 0.10 * 100) / 100,
        altShare: Math.round(computedValue * 0.065 * 100) / 100,
        pnlDollar: parseFloat(pnlDollar.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
      });
    }

    return points;
  }, [currentTotal, timeframe]);

  // Selected or latest metric summary
  const displayedPoint = activePoint || chartData[chartData.length - 1];
  const startPoint = chartData[0];
  const totalChangeUsd = displayedPoint && startPoint
    ? displayedPoint.value - startPoint.value
    : 0;
  const totalChangePercent = startPoint && startPoint.value > 0
    ? (totalChangeUsd / startPoint.value) * 100
    : 0;

  const isPositive = totalChangeUsd >= 0;

  const formatCurrency = (val: number) => {
    if (hideBalance) return '••••••••';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTimeframeLabel = (tf: PerformanceTimeframe) => {
    switch (tf) {
      case '24h':
        return 'Últimas 24 Horas';
      case '7d':
        return 'Últimos 7 Días';
      case '30d':
        return 'Últimos 30 Días (1M)';
      case '90d':
        return 'Últimos 90 Días (3M)';
      case '1y':
        return 'Último Año (1A)';
    }
  };

  // Min and Max for custom Y-Axis scale padding
  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yDomainPadding = (maxValue - minValue) * 0.15 || 1000;
  const yDomain: [number, number] = [
    Math.max(0, Math.floor(minValue - yDomainPadding)),
    Math.ceil(maxValue + yDomainPadding),
  ];

  // Custom Chart Tooltip with Crosshair Context & Rich Metrics
  const CustomPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: PortfolioDataPoint = payload[0].payload;
      const isPointPositive = data.pnlDollar >= 0;

      return (
        <div className="rounded-xl bg-[#10131a]/95 backdrop-blur-md border border-[#3d494c]/80 p-3.5 shadow-2xl z-50 text-left min-w-[220px] pointer-events-none ring-1 ring-[#4cd7f6]/20">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-[#272a32]">
            <span className="text-[10px] text-[#869397] font-code-sm uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#4cd7f6]" />
              {data.fullDate}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#272a32] text-[#e1e2ec] font-code-sm font-semibold">
              {timeframe.toUpperCase()}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-extrabold font-code-sm text-white tracking-tight">
              {formatCurrency(data.value)}
            </span>
            <span className="text-[10px] font-code-sm font-medium text-[#869397]">USD</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`text-xs font-bold font-code-sm px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isPointPositive
                  ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                  : 'bg-[#ff5449]/20 text-[#ff5449] border border-[#ff5449]/30'
              }`}
            >
              {isPointPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {isPointPositive ? '+' : ''}
                {formatCurrency(data.pnlDollar)} ({isPointPositive ? '+' : ''}
                {data.pnlPercent}%)
              </span>
            </span>
          </div>
          <div className="text-[9px] text-[#869397] font-code-sm mt-1">
            vs. valor al inicio del periodo ({timeframe.toUpperCase()})
          </div>

          {showAssetBreakdown && (
            <div className="mt-3 pt-2.5 border-t border-[#272a32] space-y-1.5 text-[10px] font-code-sm">
              <div className="text-[9px] uppercase tracking-wider text-[#869397] font-bold">
                Distribución Patrimonial
              </div>
              <div className="flex justify-between items-center text-[#bcc9cd]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#627eea] shadow-sm" />
                  Ecosistema ETH:
                </span>
                <span className="font-bold text-white">{formatCurrency(data.ethShare)}</span>
              </div>
              <div className="flex justify-between items-center text-[#bcc9cd]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14f195] shadow-sm" />
                  Solana Cluster:
                </span>
                <span className="font-bold text-white">{formatCurrency(data.solShare)}</span>
              </div>
              <div className="flex justify-between items-center text-[#bcc9cd]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#28a0f0] shadow-sm" />
                  Stables / Liquidez:
                </span>
                <span className="font-bold text-white">{formatCurrency(data.stableShare)}</span>
              </div>
              <div className="flex justify-between items-center text-[#bcc9cd]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#d0bcff] shadow-sm" />
                  Alts & L2s:
                </span>
                <span className="font-bold text-white">{formatCurrency(data.altShare)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="portfolio-performance-chart"
      className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-3.5"
    >
      {/* Background ambient lighting effects */}
      <div
        className={`absolute top-0 right-0 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isPositive ? 'bg-[#4edea3]/10' : 'bg-[#ff5449]/10'
        }`}
      />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Timeframe Selector */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border ${
              isPositive
                ? 'bg-[#4edea3]/15 border-[#4edea3]/30 text-[#4edea3]'
                : 'bg-[#ff5449]/15 border-[#ff5449]/30 text-[#ff5449]'
            }`}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#e1e2ec] font-headline-lg tracking-tight">
                Rendimiento Histórico de Cartera
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4cd7f6] font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Tiempo Real Recharts</span>
              </span>
            </div>
            <p className="text-[11px] text-[#869397] mt-0.5">
              Evolución acumulada del valor patrimonial con soporte de vistas 7D y 30D.
            </p>
          </div>
        </div>

        {/* Timeframe pill selector: 24h, 7D, 30D, 90D, 1Y */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#10131a] border border-[#272a32] text-xs">
          {(['24h', '7d', '30d', '90d', '1y'] as PerformanceTimeframe[]).map((tf) => {
            const isSelected = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setActivePoint(null);
                  if (onShowToast) {
                    onShowToast(
                      `Rango Histórico: ${tf.toUpperCase()}`,
                      `Cargando datos de evolución para el periodo de ${getTimeframeLabel(tf)}.`
                    );
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-code-sm font-semibold transition-all ${
                  isSelected
                    ? isPositive
                      ? 'bg-[#272a32] text-[#4edea3] shadow-sm font-bold border border-[#4edea3]/30'
                      : 'bg-[#272a32] text-[#ff5449] shadow-sm font-bold border border-[#ff5449]/30'
                    : 'text-[#869397] hover:text-[#e1e2ec]'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Floating Metric Spotlight Bar */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-3 p-3 rounded-xl bg-[#10131a] border border-[#272a32]">
        <div>
          <span className="text-[10px] text-[#869397] font-code-sm uppercase tracking-wider block">
            {activePoint ? activePoint.fullDate : `Balance Actual (${getTimeframeLabel(timeframe)})`}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-code-md text-white tracking-tight flex items-baseline gap-2 mt-0.5">
            <span>{formatCurrency(displayedPoint.value)}</span>
            <span className="text-xs font-normal text-[#869397] font-code-sm">USD</span>
          </div>
        </div>

        {/* PnL Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              isPositive
                ? 'bg-[#4edea3]/15 border-[#4edea3]/30 text-[#4edea3]'
                : 'bg-[#ff5449]/15 border-[#ff5449]/30 text-[#ff5449]'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-bold font-code-sm">
              {isPositive ? '+' : ''}
              {formatCurrency(totalChangeUsd)} ({isPositive ? '+' : ''}
              {totalChangePercent.toFixed(2)}%)
            </span>
          </div>

          <button
            onClick={() => setShowAssetBreakdown(!showAssetBreakdown)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-code-sm font-semibold transition-all border ${
              showAssetBreakdown
                ? 'bg-[#4cd7f6]/20 border-[#4cd7f6]/40 text-[#4cd7f6]'
                : 'bg-[#191b23] border-[#272a32] text-[#869397] hover:text-[#e1e2ec]'
            }`}
            title="Alternar desglose de activos en tooltip"
          >
            <Layers className="w-3 h-3 inline mr-1" />
            <span>Desglose</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Performance Chart Canvas */}
      <div className="relative z-10 w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                setActivePoint(state.activePayload[0].payload as PortfolioDataPoint);
              }
            }}
            onMouseLeave={() => {
              setActivePoint(null);
            }}
          >
            <defs>
              <linearGradient id="performanceGreenGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4edea3" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#4cd7f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10131a" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="performanceRedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5449" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10131a" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#272a32" vertical={false} opacity={0.6} />

            <XAxis
              dataKey="displayDate"
              stroke="#869397"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis
              stroke="#869397"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              tickMargin={6}
            />

            <Tooltip
              content={<CustomPerformanceTooltip />}
              cursor={{
                stroke: isPositive ? '#4edea3' : '#ff5449',
                strokeWidth: 1.5,
                strokeDasharray: '4 4',
                strokeOpacity: 0.8,
              }}
              isAnimationActive={true}
              animationDuration={150}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#4edea3' : '#ff5449'}
              strokeWidth={2.5}
              fill={isPositive ? 'url(#performanceGreenGlow)' : 'url(#performanceRedGlow)'}
              activeDot={{
                r: 6,
                fill: isPositive ? '#4edea3' : '#ff5449',
                stroke: '#10131a',
                strokeWidth: 3,
                className: isPositive
                  ? 'drop-shadow-[0_0_10px_rgba(78,222,163,0.9)]'
                  : 'drop-shadow-[0_0_10px_rgba(255,84,73,0.9)]',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Performance Insights Footer */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#3d494c]/30 text-[11px] font-code-sm">
        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32]">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">Mínimo Periodo</span>
          <span className="font-bold text-[#e1e2ec] mt-0.5 block">{formatCurrency(minValue)}</span>
        </div>

        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32]">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">Máximo Periodo</span>
          <span className="font-bold text-[#4edea3] mt-0.5 block">{formatCurrency(maxValue)}</span>
        </div>

        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32]">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">Rango de Volatilidad</span>
          <span className="font-bold text-[#4cd7f6] mt-0.5 block">
            {(((maxValue - minValue) / (minValue || 1)) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32]">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">Estado de Red</span>
          <span className="font-bold text-[#4edea3] mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
            {currentChain === 'all' ? 'Multicadena (8)' : currentChain.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
