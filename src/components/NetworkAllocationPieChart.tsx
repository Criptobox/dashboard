import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { TokenItem } from '../types';
import { TokenLogo } from './TokenLogo';
import { PieChart as PieChartIcon, ArrowRight, Layers, Sparkles, Filter } from 'lucide-react';

interface NetworkAllocationPieChartProps {
  tokens: TokenItem[];
  currentChain: string;
  onSelectChain: (chainId: string) => void;
  hideBalance?: boolean;
  onShowToast?: (title: string, msg: string) => void;
}

interface ChainAllocation {
  id: string;
  name: string;
  shortName: string;
  value: number;
  percentage: number;
  color: string;
  badgeBg: string;
  tokenCount: number;
  tokens: string[]; // e.g. ['ETH']
  category: 'Capa Base L1' | 'Rollup L2' | 'Alt L1';
}

const CHAIN_METADATA: Record<
  string,
  { name: string; shortName: string; color: string; badgeBg: string; category: 'Capa Base L1' | 'Rollup L2' | 'Alt L1' }
> = {
  eth: {
    name: 'Ethereum',
    shortName: 'ETH',
    color: '#627eea',
    badgeBg: 'rgba(98, 126, 234, 0.15)',
    category: 'Capa Base L1',
  },
  sol: {
    name: 'Solana',
    shortName: 'SOL',
    color: '#14f195',
    badgeBg: 'rgba(20, 241, 149, 0.15)',
    category: 'Alt L1',
  },
  arb: {
    name: 'Arbitrum One',
    shortName: 'ARB',
    color: '#28a0f0',
    badgeBg: 'rgba(40, 160, 240, 0.15)',
    category: 'Rollup L2',
  },
  base: {
    name: 'Base',
    shortName: 'BASE',
    color: '#0052ff',
    badgeBg: 'rgba(0, 82, 255, 0.15)',
    category: 'Rollup L2',
  },
  polygon: {
    name: 'Polygon PoS',
    shortName: 'POL',
    color: '#8247e5',
    badgeBg: 'rgba(130, 71, 229, 0.15)',
    category: 'Alt L1',
  },
  op: {
    name: 'Optimism',
    shortName: 'OP',
    color: '#ff0420',
    badgeBg: 'rgba(255, 4, 32, 0.15)',
    category: 'Rollup L2',
  },
  bnb: {
    name: 'BNB Chain',
    shortName: 'BNB',
    color: '#f3ba2f',
    badgeBg: 'rgba(243, 186, 47, 0.15)',
    category: 'Alt L1',
  },
  avax: {
    name: 'Avalanche',
    shortName: 'AVAX',
    color: '#e84142',
    badgeBg: 'rgba(232, 65, 66, 0.15)',
    category: 'Alt L1',
  },
};

export const NetworkAllocationPieChart: React.FC<NetworkAllocationPieChartProps> = ({
  tokens,
  currentChain,
  onSelectChain,
  hideBalance = false,
  onShowToast,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'details'>('chart');

  // Compute total portfolio value
  const totalValue = tokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);

  // Group tokens by chain
  const chainGroups = tokens.reduce((acc, t) => {
    const chainKey = t.chain || 'eth';
    if (!acc[chainKey]) {
      acc[chainKey] = {
        totalUsd: 0,
        count: 0,
        symbols: new Set<string>(),
      };
    }
    acc[chainKey].totalUsd += t.valueUsd || 0;
    acc[chainKey].count += 1;
    acc[chainKey].symbols.add(t.symbol);
    return acc;
  }, {} as Record<string, { totalUsd: number; count: number; symbols: Set<string> }>);

  // Build structured allocation list
  const allocations: ChainAllocation[] = Object.keys(chainGroups)
    .map((chainKey) => {
      const meta = CHAIN_METADATA[chainKey] || {
        name: chainKey.toUpperCase(),
        shortName: chainKey.toUpperCase(),
        color: '#4cd7f6',
        badgeBg: 'rgba(76, 215, 246, 0.15)',
        category: 'Alt L1' as const,
      };

      const val = chainGroups[chainKey].totalUsd;
      const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
      const symbolList: string[] = Array.from(chainGroups[chainKey].symbols);

      return {
        id: chainKey,
        name: meta.name,
        shortName: meta.shortName,
        value: parseFloat(val.toFixed(2)),
        percentage: parseFloat(pct.toFixed(1)),
        color: meta.color,
        badgeBg: meta.badgeBg,
        tokenCount: chainGroups[chainKey].count,
        tokens: symbolList,
        category: meta.category,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Compute category rollups
  const rollupL2Percentage = allocations
    .filter((a) => a.category === 'Rollup L2')
    .reduce((sum, a) => sum + a.percentage, 0);

  const activeItem = activeIndex !== null && allocations[activeIndex]
    ? allocations[activeIndex]
    : allocations.find((a) => a.id === currentChain) || allocations[0];

  const formatUsd = (amount: number) => {
    if (hideBalance) return '••••••••';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Custom Tooltip component for Recharts
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChainAllocation = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#10131a] border border-[#272a32] p-2.5 shadow-2xl z-50 text-left min-w-[170px] pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg">
              {data.name}
            </span>
            <span className="ml-auto text-[10px] font-code-sm font-bold text-[#4cd7f6] bg-[#4cd7f6]/15 px-1.5 py-0.2 rounded">
              {data.percentage}%
            </span>
          </div>
          <div className="text-sm font-extrabold text-white font-code-sm">
            {formatUsd(data.value)}
          </div>
          <div className="text-[10px] text-[#869397] font-code-sm mt-1 flex justify-between items-center border-t border-[#272a32] pt-1">
            <span>{data.tokenCount} token{data.tokenCount > 1 ? 's' : ''} ({data.tokens.join(', ')})</span>
            <span className="text-[#bcc9cd]">{data.category}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="network-allocation-pie-chart"
      className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-4"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[#627eea]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#14f195]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title, Active Network Tag & View Switcher */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#627eea]/15 border border-[#627eea]/30 flex items-center justify-center text-[#627eea] shadow-sm">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#e1e2ec] font-headline-lg tracking-tight">
                Distribución de Activos por Red
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#10131a] border border-[#272a32] text-[10px] font-code-sm text-[#4edea3] font-semibold">
                {allocations.length} Redes Activas
              </span>
            </div>
            <p className="text-[11px] text-[#869397] mt-0.5">
              Porcentaje consolidado de capital repartido en capas L1 y rollups L2.
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#10131a] border border-[#272a32] text-xs">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === 'chart'
                ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            Gráfico Circular
          </button>
          <button
            onClick={() => setViewMode('details')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewMode === 'details'
                ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            Lista Desglosada
          </button>
        </div>
      </div>

      {/* Main Chart + Legend Layout or Detailed View */}
      {viewMode === 'chart' ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Interactive Pie Chart (Left/Top on Mobile, 5 cols on desktop) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
            <div className="w-full h-[210px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={allocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#1d1f27"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(entry: any) => {
                      const targetId = entry?.id || entry?.payload?.id;
                      const targetName = entry?.name || entry?.payload?.name;
                      const targetPct = entry?.percentage ?? entry?.payload?.percentage;
                      if (targetId) {
                        onSelectChain(targetId);
                        if (onShowToast) {
                          onShowToast(
                            `Red Seleccionada: ${targetName || targetId}`,
                            `Filtrando activos de cartera en ${targetName || targetId}${targetPct !== undefined ? ` (${targetPct}% del total)` : ''}.`
                          );
                        }
                      }
                    }}
                    cursor="pointer"
                  >
                    {allocations.map((entry, index) => {
                      const isSelected = currentChain === entry.id;
                      const isHovered = activeIndex === index;
                      return (
                        <Cell
                          key={`cell-${entry.id}`}
                          fill={entry.color}
                          opacity={
                            activeIndex !== null
                              ? isHovered
                                ? 1
                                : 0.35
                              : currentChain === 'all' || isSelected
                              ? 1
                              : 0.45
                          }
                          style={{
                            transition: 'all 0.2s ease',
                            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                            transformOrigin: 'center center',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-[10px] font-code-sm uppercase tracking-wider text-[#869397] block">
                  {activeItem ? activeItem.name : 'Total'}
                </span>
                <span className="text-lg sm:text-xl font-bold font-code-sm text-white tracking-tight">
                  {activeItem ? `${activeItem.percentage}%` : '100%'}
                </span>
                <span className="text-[11px] text-[#4cd7f6] font-code-sm font-semibold max-w-[100px] truncate">
                  {activeItem ? formatUsd(activeItem.value) : formatUsd(totalValue)}
                </span>
              </div>
            </div>

            <span className="text-[10px] text-[#869397] font-code-sm mt-1 text-center">
              Pasa el cursor o pulsa una sección para filtrar la red
            </span>
          </div>

          {/* Legend / Network Breakdown Rows (Right, 7 cols on desktop) */}
          <div className="md:col-span-7 space-y-2">
            {allocations.map((chain, index) => {
              const isSelected = currentChain === chain.id;
              const isHovered = activeIndex === index;

              return (
                <motion.div
                  key={chain.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => {
                    onSelectChain(chain.id);
                    if (onShowToast) {
                      onShowToast(
                        `Red Filtrada: ${chain.name}`,
                        `Mostrando ${chain.tokenCount} token(s) en ${chain.name}.`
                      );
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#10131a] border-[#4cd7f6] ring-1 ring-[#4cd7f6]/30 shadow-md'
                      : isHovered
                      ? 'bg-[#272a32] border-[#3d494c]'
                      : 'bg-[#10131a]/60 border-[#272a32] hover:bg-[#10131a]'
                  }`}
                >
                  {/* Left: Chain Icon, Color Dot, Name & Category */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: chain.color }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg truncate">
                          {chain.name}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] text-[9px] font-code-sm font-bold uppercase">
                            Activa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#869397] font-code-sm mt-0.5">
                        <span>{chain.tokenCount} token{chain.tokenCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{chain.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Proportion Bar, USD Amount & Percentage */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="w-16 sm:w-24 hidden sm:block">
                      <div className="w-full h-1.5 rounded-full bg-[#272a32] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, chain.percentage)}%`,
                            backgroundColor: chain.color,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-extrabold font-code-sm text-white">
                        {formatUsd(chain.value)}
                      </div>
                      <div className="text-[10px] font-code-sm font-bold text-[#4cd7f6]">
                        {chain.percentage}%
                      </div>
                    </div>

                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-[#4cd7f6] translate-x-0.5' : 'text-[#869397]'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Detailed List View Mode */
        <div className="relative z-10 space-y-2">
          {allocations.map((chain) => {
            const isSelected = currentChain === chain.id;

            return (
              <div
                key={chain.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#10131a] border-[#4cd7f6] ring-1 ring-[#4cd7f6]/40 shadow-lg'
                    : 'bg-[#10131a]/70 border-[#272a32] hover:border-[#3d494c]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: chain.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#e1e2ec] font-headline-lg">
                          {chain.name}
                        </span>
                        <span
                          className="px-2 py-0.2 rounded-md text-[10px] font-code-sm font-semibold"
                          style={{ backgroundColor: chain.badgeBg, color: chain.color }}
                        >
                          {chain.category}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] text-[9px] font-code-sm font-bold uppercase">
                            Red Activa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-[#869397] font-code-sm">Tokens:</span>
                        {chain.tokens.map((sym) => (
                          <span
                            key={sym}
                            className="px-1.5 py-0.2 rounded bg-[#272a32] text-[#e1e2ec] text-[9px] font-code-sm font-bold"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold font-code-sm text-white">
                        {formatUsd(chain.value)}
                      </div>
                      <div className="text-[11px] font-code-sm font-bold text-[#4cd7f6]">
                        {chain.percentage}% del total
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectChain(chain.id);
                        if (onShowToast) {
                          onShowToast(
                            `Filtro de Red Activado: ${chain.name}`,
                            `Cartera sincronizada con ${chain.name}.`
                          );
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-code-sm font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#4cd7f6] text-[#003640]'
                          : 'bg-[#272a32] text-[#e1e2ec] hover:bg-[#32353d] border border-[#3d494c]/40'
                      }`}
                    >
                      {isSelected ? 'Activa' : 'Fijar Red'}
                    </button>
                  </div>
                </div>

                {/* Progress bar in detailed mode */}
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-[#272a32] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(3, chain.percentage)}%`,
                      backgroundColor: chain.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategic Portfolio Insights Footer */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#3d494c]/30">
        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#869397] uppercase tracking-wider font-code-sm block">
              Dominancia Mayoritaria
            </span>
            <span className="text-xs font-bold text-[#e1e2ec] font-code-sm">
              {allocations[0]?.name || 'Ethereum'} ({allocations[0]?.percentage || 0}%)
            </span>
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: allocations[0]?.color || '#627eea' }}
          />
        </div>

        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#869397] uppercase tracking-wider font-code-sm block">
              Presencia en Rollups L2
            </span>
            <span className="text-xs font-bold text-[#4edea3] font-code-sm">
              {rollupL2Percentage.toFixed(1)}% (Arbitrum + Base)
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
        </div>

        <div className="p-2 rounded-xl bg-[#10131a] border border-[#272a32] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#869397] uppercase tracking-wider font-code-sm block">
              Filtro Activo
            </span>
            <span className="text-xs font-bold text-[#4cd7f6] font-code-sm">
              {currentChain === 'all'
                ? 'Todas las Redes'
                : allocations.find((a) => a.id === currentChain)?.name || currentChain}
            </span>
          </div>
          <button
            onClick={() => {
              onSelectChain('all');
              if (onShowToast) {
                onShowToast('Vista Global', 'Mostrando todos los activos en todas las cadenas.');
              }
            }}
            className="text-[10px] font-code-sm font-semibold text-[#869397] hover:text-[#4cd7f6] transition-colors"
          >
            {currentChain !== 'all' ? 'Ver Todas' : 'Global'}
          </button>
        </div>
      </div>
    </div>
  );
};
