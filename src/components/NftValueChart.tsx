import React, { useState, useMemo } from 'react';
import { NftItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface NftValueChartProps {
  nfts: NftItem[];
  onShowToast?: (title: string, msg: string) => void;
}

interface ChartDataPoint {
  name: string;
  shortName: string;
  valueUsd: number;
  percentage: number;
  floorPrice: string;
  chain: string;
  color: string;
  count: number;
}

// Color palette matching OmniVault cyberpunk institutional theme
const COLLECTION_COLORS: Record<string, string> = {
  'Bored Ape Yacht Club': '#4cd7f6', // Cyan ETH
  'Pudgy Penguins': '#d0bcff',      // Purple
  'Mad Lads': '#4edea3',            // Emerald Solana
  'DeGods': '#acedff',              // Light Blue
};

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: '#4cd7f6',
  Solana: '#4edea3',
  'ETH / Polygon': '#d0bcff',
};

export const NftValueChart: React.FC<NftValueChartProps> = ({ nfts, onShowToast }) => {
  const [groupBy, setGroupBy] = useState<'collection' | 'chain'>('collection');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Helper to extract numeric USD value from strings like "~$42,752"
  const parseUsd = (str: string): number => {
    const digits = str.replace(/[^0-9]/g, '');
    return parseInt(digits, 10) || 0;
  };

  // Compute total NFT portfolio value in USD
  const totalValueUsd = useMemo(() => {
    return nfts.reduce((acc, nft) => acc + parseUsd(nft.floorUsd), 0);
  }, [nfts]);

  // Transform data based on groupBy selection
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (groupBy === 'collection') {
      const grouped: Record<string, {
        valueUsd: number;
        floorPrice: string;
        chain: string;
        count: number;
        color: string;
      }> = {};

      nfts.forEach((nft) => {
        const val = parseUsd(nft.floorUsd);
        if (!grouped[nft.collection]) {
          grouped[nft.collection] = {
            valueUsd: 0,
            floorPrice: nft.floorPrice,
            chain: nft.chain,
            count: 0,
            color: COLLECTION_COLORS[nft.collection] || '#4cd7f6',
          };
        }
        grouped[nft.collection].valueUsd += val;
        grouped[nft.collection].count += 1;
      });

      return Object.entries(grouped)
        .map(([colName, data]) => {
          let short = colName;
          if (colName === 'Bored Ape Yacht Club') short = 'BAYC';
          else if (colName === 'Pudgy Penguins') short = 'Pudgy';
          else if (colName === 'Mad Lads') short = 'MadLads';
          else if (colName === 'DeGods') short = 'DeGods';

          return {
            name: colName,
            shortName: short,
            valueUsd: data.valueUsd,
            percentage: totalValueUsd > 0 ? (data.valueUsd / totalValueUsd) * 100 : 0,
            floorPrice: data.floorPrice,
            chain: data.chain,
            color: data.color,
            count: data.count,
          };
        })
        .sort((a, b) => b.valueUsd - a.valueUsd);
    } else {
      // Group by chain
      const grouped: Record<string, { valueUsd: number; count: number; color: string }> = {};

      nfts.forEach((nft) => {
        const val = parseUsd(nft.floorUsd);
        const chainKey = nft.chain;
        if (!grouped[chainKey]) {
          grouped[chainKey] = {
            valueUsd: 0,
            count: 0,
            color: CHAIN_COLORS[chainKey] || '#4edea3',
          };
        }
        grouped[chainKey].valueUsd += val;
        grouped[chainKey].count += 1;
      });

      return Object.entries(grouped)
        .map(([chainName, data]) => ({
          name: chainName,
          shortName: chainName.replace(' / Polygon', ' + POL'),
          valueUsd: data.valueUsd,
          percentage: totalValueUsd > 0 ? (data.valueUsd / totalValueUsd) * 100 : 0,
          floorPrice: `${data.count} NFT${data.count > 1 ? 's' : ''}`,
          chain: chainName,
          color: data.color,
          count: data.count,
        }))
        .sort((a, b) => b.valueUsd - a.valueUsd);
    }
  }, [nfts, groupBy, totalValueUsd]);

  // Top asset calculation for metric pill
  const topItem = chartData[0];

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      return (
        <div className="bg-[#10131a]/95 backdrop-blur-md border border-[#3d494c] p-3 rounded-xl shadow-2xl z-50 min-w-[180px]">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#272a32]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
              <span className="text-xs font-bold text-[#e1e2ec] font-sans">{data.name}</span>
            </div>
            <span className="text-[10px] font-code-sm text-[#bcc9cd]">{data.chain}</span>
          </div>

          <div className="pt-2 flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#bcc9cd] uppercase font-sans">Valor Valuado:</span>
              <span className="text-xs font-bold font-code-md text-[#4edea3]">
                ${data.valueUsd.toLocaleString()} USD
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#bcc9cd] uppercase font-sans">Cuota Portafolio:</span>
              <span className="text-xs font-bold font-code-md text-[#4cd7f6]">
                {data.percentage.toFixed(1)}%
              </span>
            </div>

            {data.floorPrice && (
              <div className="flex items-baseline justify-between pt-0.5 border-t border-[#272a32]/60">
                <span className="text-[10px] text-[#869397]">Floor Unitario:</span>
                <span className="text-[11px] font-code-sm text-[#e1e2ec] font-medium">{data.floorPrice}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-[#1d1f27] border border-[#3d494c]/40 p-4 shadow-lg flex flex-col gap-3">
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#e1e2ec] font-sans">Distribución de Valor</h3>
            <span className="text-[11px] text-[#bcc9cd]">Valuación por colección y cadena</span>
          </div>
        </div>

        {/* Group Selector Pill Tabs */}
        <div className="flex items-center bg-[#10131a] p-0.5 rounded-xl border border-[#272a32]">
          <button
            type="button"
            onClick={() => {
              setGroupBy('collection');
              if (onShowToast) onShowToast('Vista de Colecciones', 'Visualizando valor desglosado por colección');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
              groupBy === 'collection'
                ? 'bg-[#4cd7f6] text-[#003640] shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            Colección
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupBy('chain');
              if (onShowToast) onShowToast('Vista por Cadena', 'Visualizando concentración de capital por red');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
              groupBy === 'chain'
                ? 'bg-[#4cd7f6] text-[#003640] shadow-sm'
                : 'text-[#869397] hover:text-[#e1e2ec]'
            }`}
          >
            Red / Cadena
          </button>
        </div>
      </div>

      {/* Top Asset & Portfolio Value Overview Pills */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-[#10131a]/80 border border-[#272a32] flex flex-col justify-between">
          <span className="text-[10px] text-[#bcc9cd] uppercase font-sans font-semibold">
            Valor Consolidado
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-code-lg text-sm sm:text-base font-bold text-[#4edea3]">
              ${totalValueUsd.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#869397]">USD</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#10131a]/80 border border-[#272a32] flex flex-col justify-between">
          <span className="text-[10px] text-[#bcc9cd] uppercase font-sans font-semibold">
            {groupBy === 'collection' ? 'Mayor Participación' : 'Cadena Líder'}
          </span>
          <div className="flex items-baseline justify-between mt-0.5 min-w-0">
            <span className="font-sans text-xs font-bold text-[#e1e2ec] truncate">
              {topItem ? topItem.shortName : 'N/A'}
            </span>
            <span className="font-code-sm text-[11px] font-bold text-[#4cd7f6] shrink-0 ml-1">
              {topItem ? `${topItem.percentage.toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-52 sm:h-56 pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 8, left: -14, bottom: 2 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setActiveBarIndex(Number(state.activeTooltipIndex));
              }
            }}
            onMouseLeave={() => setActiveBarIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#272a32" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="shortName"
              stroke="#869397"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#272a32' }}
              tick={{ fill: '#bcc9cd', fontWeight: 600 }}
            />
            <YAxis
              stroke="#869397"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#869397' }}
              tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(76, 215, 246, 0.06)' }}
            />
            <Bar
              dataKey="valueUsd"
              radius={[6, 6, 0, 0]}
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={activeBarIndex === null || activeBarIndex === index ? 0.92 : 0.45}
                  stroke={activeBarIndex === index ? '#ffffff' : entry.color}
                  strokeWidth={activeBarIndex === index ? 1.5 : 0}
                  className="transition-all duration-200 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic Breakdown Legend with Progress Bars */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#272a32]">
        {chartData.map((item, idx) => (
          <div
            key={idx}
            className={`p-1.5 px-2 rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer ${
              activeBarIndex === idx ? 'bg-[#272a32]' : 'hover:bg-[#191b23]'
            }`}
            onMouseEnter={() => setActiveBarIndex(idx)}
            onMouseLeave={() => setActiveBarIndex(null)}
            onClick={() => {
              if (onShowToast) {
                onShowToast(item.name, `${item.percentage.toFixed(1)}% del portafolio ($${item.valueUsd.toLocaleString()} USD)`);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-[#e1e2ec] truncate">{item.name}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden xs:block w-16 bg-[#10131a] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="font-code-md text-xs font-bold text-[#e1e2ec] min-w-[55px] text-right">
                ${(item.valueUsd / 1000).toFixed(1)}k
              </span>
              <span className="font-code-sm text-[10px] text-[#4cd7f6] font-semibold min-w-[34px] text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
