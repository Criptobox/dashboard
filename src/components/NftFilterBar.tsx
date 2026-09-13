import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Crown,
  Zap,
  Diamond,
  Layers,
  Shield,
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ChainFilterOption {
  id: string;
  name: string;
  count: number;
  dotColor?: string;
}

export interface CollectionFilterOption {
  name: string;
  count: number;
}

export interface RarityFilterOption {
  id: string;
  label: string;
  tier: string;
  count: number;
  badgeStyle: string;
  iconType: 'crown' | 'sparkles' | 'zap' | 'diamond' | 'shield';
}

interface NftFilterBarProps {
  selectedChain: string;
  onSelectChain: (chain: string) => void;
  chains: ChainFilterOption[];
  selectedCollection: string;
  onSelectCollection: (collection: string) => void;
  collections: CollectionFilterOption[];
  selectedRarity: string;
  onSelectRarity: (rarity: string) => void;
  rarities: RarityFilterOption[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'price-desc' | 'price-asc' | 'rarity-rank' | 'name';
  onSortChange: (sort: 'price-desc' | 'price-asc' | 'rarity-rank' | 'name') => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const NftFilterBar: React.FC<NftFilterBarProps> = ({
  selectedChain,
  onSelectChain,
  chains,
  selectedCollection,
  onSelectCollection,
  collections,
  selectedRarity,
  onSelectRarity,
  rarities,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
  onResetFilters,
  hasActiveFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Active filter count (excluding default 'all')
  const activeCount =
    (selectedChain !== 'all' ? 1 : 0) +
    (selectedCollection !== 'all' ? 1 : 0) +
    (selectedRarity !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (sortBy !== 'price-desc' ? 1 : 0);

  const getRarityIcon = (type: RarityFilterOption['iconType']) => {
    switch (type) {
      case 'crown':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'zap':
        return <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />;
      case 'diamond':
        return <Diamond className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-[#869397]" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 px-4 pb-2">
      {/* Top Search & Filter Trigger Bar */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#869397] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por ID (#4821) o nombre..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#14161f] border border-[#272a32] text-xs text-[#e1e2ec] placeholder-[#869397] focus:outline-none focus:border-[#4cd7f6]/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#869397] hover:text-[#e1e2ec] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-10 px-3.5 rounded-xl text-xs font-semibold font-sans flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
            isExpanded || activeCount > 0
              ? 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/40 shadow-sm'
              : 'bg-[#14161f] hover:bg-[#1d1f27] text-[#bcc9cd] border-[#272a32]'
          }`}
          title="Abrir filtros avanzados (Cadena, Colección, Rareza)"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#4cd7f6] text-[#003640] font-bold text-[10px] font-code-sm">
              {activeCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#869397]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#869397]" />
          )}
        </button>

        {/* Sort Trigger */}
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="h-10 pl-8 pr-3 rounded-xl bg-[#14161f] border border-[#272a32] text-xs font-semibold text-[#bcc9cd] focus:outline-none focus:border-[#4cd7f6]/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="price-desc">Mayor Valor USD</option>
            <option value="price-asc">Menor Valor USD</option>
            <option value="rarity-rank">Mayor Rareza</option>
            <option value="name">Alfabético</option>
          </select>
          <ArrowDownUp className="w-3.5 h-3.5 text-[#869397] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {isExpanded && (
        <div className="p-4 rounded-2xl bg-[#14161f] border border-[#272a32] flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header of Drawer */}
          <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#4cd7f6]" />
              <span className="text-xs font-bold text-[#e1e2ec] uppercase tracking-wider font-sans">
                Filtros Multicriterio de Bóveda
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="text-xs text-[#ff5449] hover:text-[#ff7966] font-code-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer Todo</span>
              </button>
            )}
          </div>

          {/* 1. FILTER BY CHAIN */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-code-sm font-bold uppercase tracking-wider text-[#869397]">
              1. Filtrar por Cadena
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onSelectChain('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedChain === 'all'
                    ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                    : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#272a32]'
                }`}
              >
                Todas ({totalCount})
              </button>
              {chains.map((c) => {
                const isSelected = selectedChain.toLowerCase() === c.id.toLowerCase();
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectChain(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                        : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#272a32]'
                    }`}
                  >
                    {c.dotColor && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.dotColor }}
                      />
                    )}
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-70 font-code-sm">({c.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. FILTER BY RARITY */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-code-sm font-bold uppercase tracking-wider text-[#869397]">
              2. Filtrar por Rareza
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                onClick={() => onSelectRarity('all')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                  selectedRarity === 'all'
                    ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                    : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#272a32]'
                }`}
              >
                <span>Todas las Rarezas</span>
                <span className="text-[10px] font-code-sm opacity-80">({totalCount})</span>
              </button>
              {rarities.map((r) => {
                const isSelected = selectedRarity === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelectRarity(r.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#272a32] text-white border-[#4cd7f6] shadow-sm'
                        : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border-[#272a32]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getRarityIcon(r.iconType)}
                      <span className="truncate">{r.label}</span>
                    </div>
                    <span className="text-[10px] font-code-sm text-[#869397] shrink-0">
                      ({r.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. FILTER BY COLLECTION */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-code-sm font-bold uppercase tracking-wider text-[#869397]">
              3. Filtrar por Colección
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onSelectCollection('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCollection === 'all'
                    ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                    : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#272a32]'
                }`}
              >
                Todas ({totalCount})
              </button>
              {collections.map((col) => {
                const isSelected = selectedCollection === col.name;
                return (
                  <button
                    key={col.name}
                    onClick={() => onSelectCollection(col.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4cd7f6] text-[#003640] font-bold shadow-sm'
                        : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#272a32]'
                    }`}
                  >
                    <Layers className="w-3 h-3 opacity-60" />
                    <span>{col.name}</span>
                    <span className="text-[10px] opacity-70 font-code-sm">({col.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar & Live Counter */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#869397] font-code-sm text-[11px]">
            Mostrando <strong className="text-[#e1e2ec]">{filteredCount}</strong> de {totalCount} activos
          </span>

          {/* Applied Filter Tags */}
          {selectedChain !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272a32] text-[#4cd7f6] border border-[#4cd7f6]/30 text-[11px] font-medium">
              <span>Cadena: {selectedChain}</span>
              <button
                onClick={() => onSelectChain('all')}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedRarity !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272a32] text-amber-300 border border-amber-400/30 text-[11px] font-medium">
              <span>Rareza: {selectedRarity}</span>
              <button
                onClick={() => onSelectRarity('all')}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCollection !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272a32] text-[#d0bcff] border border-[#d0bcff]/30 text-[11px] font-medium">
              <span>Colección: {selectedCollection}</span>
              <button
                onClick={() => onSelectCollection('all')}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272a32] text-[#4edea3] border border-[#4edea3]/30 text-[11px] font-medium">
              <span>"{searchQuery}"</span>
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-[11px] font-code-sm text-[#869397] hover:text-[#ff5449] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
