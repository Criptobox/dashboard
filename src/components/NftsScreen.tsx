import React, { useState } from 'react';
import { NftItem } from '../types';
import { NftValueChart } from './NftValueChart';
import {
  NftFilterBar,
  ChainFilterOption,
  CollectionFilterOption,
  RarityFilterOption,
} from './NftFilterBar';
import {
  Bell,
  BellRing,
  RefreshCw,
  Grid,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  Zap,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  Store,
  Sparkles,
  Crown,
  Diamond,
  Shield,
  Search,
  RotateCcw,
  Layers,
} from 'lucide-react';

interface NftsScreenProps {
  nfts: NftItem[];
  onToggleAlert: (id: string) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const NftsScreen: React.FC<NftsScreenProps> = ({
  nfts,
  onToggleAlert,
  onShowToast,
}) => {
  // Advanced Filter States
  const [activeMarketplace, setActiveMarketplace] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price-desc' | 'price-asc' | 'rarity-rank' | 'name'>('price-desc');

  const [alertModalNft, setAlertModalNft] = useState<NftItem | null>(null);
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [alertThreshold, setAlertThreshold] = useState<string>('13.50');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Dynamic NFT Portfolio Totals
  const totalNftUsd = nfts.reduce((acc, nft) => {
    const digits = nft.floorUsd.replace(/[^0-9]/g, '');
    return acc + (parseInt(digits, 10) || 0);
  }, 0);
  const totalNftEth = (totalNftUsd / 3340).toFixed(1);

  // Chain Filter Options
  const chainOptions: ChainFilterOption[] = [
    {
      id: 'Ethereum',
      name: 'Ethereum',
      count: nfts.filter((n) => n.chain.toLowerCase().includes('eth')).length,
      dotColor: '#627eea',
    },
    {
      id: 'Solana',
      name: 'Solana',
      count: nfts.filter((n) => n.chain.toLowerCase().includes('solana')).length,
      dotColor: '#14f195',
    },
    {
      id: 'Polygon',
      name: 'Polygon',
      count: nfts.filter((n) => n.chain.toLowerCase().includes('polygon')).length,
      dotColor: '#8247e5',
    },
    {
      id: 'Arbitrum',
      name: 'Arbitrum',
      count: nfts.filter((n) => n.chain.toLowerCase().includes('arbitrum')).length,
      dotColor: '#28a0f0',
    },
  ];

  // Collection Filter Options
  const uniqueCollections: string[] = Array.from(new Set(nfts.map((n) => n.collection)));
  const collectionOptions: CollectionFilterOption[] = uniqueCollections.map((name) => ({
    name,
    count: nfts.filter((n) => n.collection === name).length,
  }));

  // Rarity Filter Options
  const rarityOptions: RarityFilterOption[] = [
    {
      id: 'Mítico',
      label: 'Mítico (Top 1-3%)',
      tier: 'Mítico',
      count: nfts.filter((n) => n.rarityTier === 'Mítico').length,
      badgeStyle: 'from-amber-400/20 to-yellow-500/20 text-amber-300 border-amber-400/50',
      iconType: 'crown',
    },
    {
      id: 'Legendario',
      label: 'Legendario (Top 4-10%)',
      tier: 'Legendario',
      count: nfts.filter((n) => n.rarityTier === 'Legendario').length,
      badgeStyle: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/50',
      iconType: 'sparkles',
    },
    {
      id: 'Épico',
      label: 'Épico (Top 11-20%)',
      tier: 'Épico',
      count: nfts.filter((n) => n.rarityTier === 'Épico').length,
      badgeStyle: 'from-cyan-500/20 to-teal-500/20 text-[#4cd7f6] border-[#4cd7f6]/50',
      iconType: 'zap',
    },
    {
      id: 'Raro',
      label: 'Raro (Top 21-35%)',
      tier: 'Raro',
      count: nfts.filter((n) => n.rarityTier === 'Raro').length,
      badgeStyle: 'from-blue-500/20 to-sky-500/20 text-sky-300 border-sky-400/40',
      iconType: 'diamond',
    },
    {
      id: 'Común',
      label: 'Común (>35%)',
      tier: 'Común',
      count: nfts.filter((n) => n.rarityTier === 'Común').length,
      badgeStyle: 'bg-[#272a32] text-[#bcc9cd] border-[#3d494c]/40',
      iconType: 'shield',
    },
  ];

  const marketFilters = [
    { id: 'all', label: 'Todos', icon: 'all' },
    { id: 'opensea', label: 'OpenSea', dot: '#4cd7f6' },
    { id: 'blur', label: 'Blur', dot: '#d0bcff' },
    { id: 'magiceden', label: 'Magic Eden', dot: '#4edea3' },
    { id: 'tensor', label: 'Tensor', dot: '#acedff' },
    { id: 'trove', label: 'Trove', dot: '#6ffbbe' },
  ];

  const parseFloorUsd = (str: string) => {
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  };

  // Advanced Multi-Criteria Filter
  const filteredNfts = nfts.filter((nft) => {
    // 1. Marketplace Filter
    if (activeMarketplace !== 'all') {
      const matchMarket = nft.marketplaces.some((m) =>
        m.name.toLowerCase().replace(/\s+/g, '').includes(activeMarketplace)
      );
      if (!matchMarket) return false;
    }

    // 2. Chain Filter
    if (selectedChain !== 'all') {
      if (!nft.chain.toLowerCase().includes(selectedChain.toLowerCase())) {
        return false;
      }
    }

    // 3. Collection Filter
    if (selectedCollection !== 'all') {
      if (nft.collection !== selectedCollection) {
        return false;
      }
    }

    // 4. Rarity Filter
    if (selectedRarity !== 'all') {
      if (nft.rarityTier !== selectedRarity) {
        return false;
      }
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        nft.title.toLowerCase().includes(q) ||
        nft.tokenId.toLowerCase().includes(q) ||
        nft.collection.toLowerCase().includes(q);
      if (!matchQuery) return false;
    }

    return true;
  });

  // Sort displayed NFTs
  const displayedNfts = [...filteredNfts].sort((a, b) => {
    if (sortBy === 'price-desc') {
      return parseFloorUsd(b.floorUsd) - parseFloorUsd(a.floorUsd);
    }
    if (sortBy === 'price-asc') {
      return parseFloorUsd(a.floorUsd) - parseFloorUsd(b.floorUsd);
    }
    if (sortBy === 'rarity-rank') {
      return (a.rarityRank || 99999) - (b.rarityRank || 99999);
    }
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const hasActiveFilters =
    selectedChain !== 'all' ||
    selectedCollection !== 'all' ||
    selectedRarity !== 'all' ||
    activeMarketplace !== 'all' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'price-desc';

  const handleResetFilters = () => {
    setSelectedChain('all');
    setSelectedCollection('all');
    setSelectedRarity('all');
    setActiveMarketplace('all');
    setSearchQuery('');
    setSortBy('price-desc');
    onShowToast('Filtros Restablecidos', 'Mostrando todos los activos digitales en bóveda');
  };

  const handleOpenAlertModal = (nft?: NftItem) => {
    setAlertModalNft(nft || nfts[0]);
    if (nft) {
      const defaultVal = nft.floorPrice.split(' ')[0] || '10.0';
      setAlertThreshold(defaultVal);
    }
  };

  const handleSaveAlert = () => {
    if (!alertModalNft) return;
    setIsSavingAlert(true);
    setTimeout(() => {
      setIsSavingAlert(false);
      onShowToast(
        'Alerta Inteligente Activada',
        `${alertModalNft.title} ${alertType === 'above' ? 'supera' : 'cae de'} ${alertThreshold}`
      );
      setAlertModalNft(null);
    }, 600);
  };

  // Render Rarity Badge with chromatic tiers
  const renderRarityBadge = (nft: NftItem) => {
    const tier = nft.rarityTier || 'Raro';
    let style = 'bg-[#272a32] text-[#bcc9cd] border-[#3d494c]/40';
    let icon = <Shield className="w-3.5 h-3.5" />;

    if (tier === 'Mítico') {
      style =
        'bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-500/25 text-amber-300 border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
      icon = <Crown className="w-3.5 h-3.5 text-amber-400" />;
    } else if (tier === 'Legendario') {
      style =
        'bg-gradient-to-r from-purple-500/25 to-indigo-500/25 text-purple-300 border-purple-400/70 shadow-[0_0_10px_rgba(168,85,247,0.25)]';
      icon = <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    } else if (tier === 'Épico') {
      style =
        'bg-gradient-to-r from-cyan-500/25 to-teal-500/25 text-[#4cd7f6] border-[#4cd7f6]/70 shadow-[0_0_8px_rgba(76,215,246,0.25)]';
      icon = <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />;
    } else if (tier === 'Raro') {
      style = 'bg-gradient-to-r from-blue-500/20 to-sky-500/20 text-sky-300 border-sky-400/50';
      icon = <Diamond className="w-3.5 h-3.5 text-sky-400" />;
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRarity(tier);
          onShowToast('Filtro por Rareza', `Mostrando activos de nivel ${tier}`);
        }}
        title={`Filtrar por rareza ${tier}`}
        className={`px-2.5 py-1 rounded-lg border font-code-sm text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${style}`}
      >
        {icon}
        <span>{tier}</span>
        {nft.rarityRank && (
          <span className="opacity-90 font-mono text-[10px]">
            #{nft.rarityRank}
          </span>
        )}
        {nft.rarityPercentile && (
          <span className="opacity-80 text-[10px]">
            • {nft.rarityPercentile}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full pb-14 animate-in fade-in duration-200">
      {/* Metrics & Portfolio Pulse Overview */}
      <div className="px-4 lg:px-6 pt-1 pb-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#3d494c]/40 p-5 shadow-lg">
          {/* Ambient Glow Blooms */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#4cd7f6]/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#d0bcff]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#bcc9cd]">
                  Cartera NFT Consolidada
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#272a32] border border-[#3d494c]/30 font-code-sm text-xs text-[#4cd7f6] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                En vivo
              </span>
            </div>

            <div>
              <span className="text-xs text-[#bcc9cd] block font-sans">Valor Total Estimado</span>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <h1 className="font-display-lg-mobile text-3xl sm:text-4xl text-[#e1e2ec] font-bold tracking-tight font-code-lg">
                  {totalNftEth} ETH
                </h1>
                <span className="font-code-md text-sm text-[#4edea3] font-semibold">
                  (~${totalNftUsd.toLocaleString()} USD)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#272a32] text-[#bcc9cd] text-xs">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#4cd7f6]" />
                <span className="font-semibold text-[#e1e2ec]">{uniqueCollections.length} Colecciones</span>
                <span className="text-[#869397]">•</span>
                <span>{nfts.length} Activos en Bóveda</span>
              </div>

              <div className="flex items-center gap-1 font-code-sm text-[#4edea3] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                +3.8% (24h)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Portfolio Value Distribution Bar Chart (Recharts) */}
      <div className="px-4 lg:px-6 pb-4">
        <NftValueChart nfts={nfts} onShowToast={onShowToast} />
      </div>

      {/* Primary Action: Set Price / Bid Alert */}
      <div className="px-4 lg:px-6 pb-4">
        <button
          onClick={() => handleOpenAlertModal()}
          className="w-full h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#4cd7f6]/15 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Bell className="w-4 h-4 fill-current" />
          <span>Configurar Alerta de Ofertas / Floor</span>
        </button>
      </div>

      {/* ADVANCED FILTER BAR (Chain, Collection, Rarity, Search, Sort) */}
      <NftFilterBar
        selectedChain={selectedChain}
        onSelectChain={(chain) => {
          setSelectedChain(chain);
          onShowToast('Filtro por Cadena', chain === 'all' ? 'Todas las cadenas' : `Filtrando por ${chain}`);
        }}
        chains={chainOptions}
        selectedCollection={selectedCollection}
        onSelectCollection={(collection) => {
          setSelectedCollection(collection);
          onShowToast('Filtro por Colección', collection === 'all' ? 'Todas las colecciones' : `Filtrando por ${collection}`);
        }}
        collections={collectionOptions}
        selectedRarity={selectedRarity}
        onSelectRarity={(rarity) => {
          setSelectedRarity(rarity);
          onShowToast('Filtro por Rareza', rarity === 'all' ? 'Todas las rarezas' : `Filtrando por nivel ${rarity}`);
        }}
        rarities={rarityOptions}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={nfts.length}
        filteredCount={displayedNfts.length}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Marketplace Horizontal Scroller / Filter Tabs */}
      <div className="w-full pb-3">
        <div className="px-4 lg:px-6 flex items-center justify-between mb-2">
          <span className="text-xs text-[#bcc9cd] uppercase tracking-wider font-code-sm font-semibold">
            Marketplace Agregado
          </span>
          {activeMarketplace !== 'all' && (
            <button
              onClick={() => setActiveMarketplace('all')}
              className="text-xs text-[#4cd7f6] hover:underline font-code-sm cursor-pointer"
            >
              Ver todos
            </button>
          )}
        </div>

        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-0.5">
          {marketFilters.map((m) => {
            const isSelected = activeMarketplace === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMarketplace(m.id)}
                className={`h-9 px-3.5 rounded-full text-xs font-sans font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4cd7f6] text-[#003640] shadow-md shadow-[#4cd7f6]/20'
                    : 'bg-[#14161f] hover:bg-[#1d1f27] text-[#e1e2ec] border border-[#272a32]'
                }`}
              >
                {m.dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dot }} />}
                {m.id === 'all' && <Sparkles className="w-3.5 h-3.5" />}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NFT Gallery Feed */}
      <div className="px-4 lg:px-6 pt-1">
        {/* Empty State when filters yield 0 matches */}
        {displayedNfts.length === 0 && (
          <div className="p-8 rounded-2xl bg-[#14161f] border border-[#272a32] flex flex-col items-center justify-center text-center gap-3 my-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/40 flex items-center justify-center text-[#869397]">
              <Search className="w-6 h-6 text-[#4cd7f6]" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                Ningún NFT coincide con los filtros
              </h3>
              <p className="text-xs text-[#bcc9cd] max-w-xs leading-relaxed">
                No se encontraron activos digitales que cumplan con la combinación de cadena, colección o rareza seleccionada.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2.5 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {displayedNfts.map((nft) => (
          <div
            key={nft.id}
            className="rounded-2xl bg-[#1d1f27] border border-[#3d494c]/40 overflow-hidden shadow-xl flex flex-col transition-all hover:border-[#4cd7f6]/40"
          >
            {/* Media Header with Floating Badges */}
            <div className="relative w-full aspect-square bg-[#0b0e15] overflow-hidden">
              <img
                src={nft.imageUrl}
                alt={nft.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1d1f27] via-transparent to-black/40 pointer-events-none" />

              {/* Network Badge (Clickable Filter) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const targetChain = nft.chain.includes('Solana')
                    ? 'Solana'
                    : nft.chain.includes('Polygon')
                    ? 'Polygon'
                    : nft.chain.includes('Arbitrum')
                    ? 'Arbitrum'
                    : 'Ethereum';
                  setSelectedChain(targetChain);
                  onShowToast('Filtro por Cadena', `Filtrando por ${targetChain}`);
                }}
                title={`Filtrar por cadena ${nft.chain}`}
                className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0b0e15]/85 backdrop-blur-md px-3 py-1 rounded-full text-[#e1e2ec] border border-[#3d494c]/40 shadow-sm hover:border-[#4cd7f6]/60 transition-colors cursor-pointer"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      nft.chain.includes('Ethereum')
                        ? '#627eea'
                        : nft.chain.includes('Solana')
                        ? '#14f195'
                        : nft.chain.includes('Polygon')
                        ? '#8247e5'
                        : '#28a0f0',
                  }}
                />
                <span className="font-code-sm text-xs font-semibold tracking-wide">{nft.chain}</span>
              </button>

              {/* Quick Bell Alert Trigger */}
              <button
                onClick={() => {
                  onToggleAlert(nft.id);
                  onShowToast(
                    nft.alertActive ? 'Alerta desactivada' : 'Alerta activada',
                    `${nft.title} monitoreado en tiempo real`
                  );
                }}
                className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border cursor-pointer ${
                  nft.alertActive
                    ? 'bg-[#0b0e15]/90 text-[#d0bcff] border-[#d0bcff]/50 shadow-md shadow-[#d0bcff]/20'
                    : 'bg-[#0b0e15]/70 text-[#bcc9cd] border-[#3d494c]/40 hover:text-[#4cd7f6]'
                }`}
                title="Configurar Alerta de Precios"
              >
                {nft.alertActive ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>

              {/* Badges on Image (Rarity, Offer, Floor) */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between flex-wrap gap-2">
                <div className="bg-[#0b0e15]/90 backdrop-blur-md p-2 px-3 rounded-xl border border-[#3d494c]/40 shadow-md">
                  <span className="text-[10px] text-[#bcc9cd] uppercase font-sans font-semibold block">Floor Actual</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-sm text-base text-[#e1e2ec] font-bold font-code-lg">
                      {nft.floorPrice}
                    </span>
                    <span className="font-code-sm text-xs text-[#4edea3] font-semibold">{nft.floorUsd}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Chromatic Rarity Badge */}
                  {renderRarityBadge(nft)}

                  {nft.receivedOfferBadge && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#4edea3] text-[#003824] font-code-sm text-xs font-bold flex items-center gap-1 shadow-md">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {nft.receivedOfferBadge}
                    </span>
                  )}

                  {nft.huddleBadge && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#272a32] border border-[#3d494c]/40 text-[#d0bcff] font-code-sm text-xs font-semibold">
                      {nft.huddleBadge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body Content */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedCollection(nft.collection);
                        onShowToast('Filtro por Colección', `Filtrando por ${nft.collection}`);
                      }}
                      className="text-[11px] font-sans text-[#869397] hover:text-[#4cd7f6] uppercase tracking-wider font-semibold transition-colors truncate text-left cursor-pointer"
                      title="Filtrar por esta colección"
                    >
                      {nft.collection}
                    </button>
                  </div>
                  <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold truncate">{nft.title}</h2>
                  <span className="font-code-md text-xs text-[#4cd7f6] font-semibold">{nft.tokenId}</span>
                </div>

                {nft.alertThreshold && (
                  <div
                    onClick={() => handleOpenAlertModal(nft)}
                    className="flex items-center gap-1 bg-[#272a32] hover:bg-[#32353d] px-2.5 py-1 rounded-full text-[#bcc9cd] cursor-pointer transition-colors border border-[#3d494c]/30"
                  >
                    <Check className="w-3.5 h-3.5 text-[#d0bcff]" />
                    <span className="text-[11px] font-code-sm font-semibold truncate">
                      Alerta: {nft.alertThreshold}
                    </span>
                  </div>
                )}
              </div>

              {/* Marketplace Price Matrix */}
              <div className="rounded-xl bg-[#191b23] border border-[#272a32] p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[#869397] text-[11px] font-sans pb-1 border-b border-[#272a32]">
                  <span>Marketplace</span>
                  <span>Precio Listado</span>
                </div>

                {nft.marketplaces.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dotColor }} />
                      <span className="text-xs font-semibold text-[#e1e2ec]">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-code-md text-xs text-[#e1e2ec] font-semibold">{m.price}</span>
                      {m.note && (
                        <span
                          className={`font-code-sm text-[10px] ${
                            m.isBest ? 'text-[#4cd7f6] font-bold' : 'text-[#4edea3]'
                          }`}
                        >
                          {m.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {nft.instantBid && (
                  <div className="flex items-center justify-between py-1 pt-1.5 border-t border-[#272a32]">
                    <div className="flex items-center gap-1.5 text-[#bcc9cd]">
                      <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
                      <span className="text-xs">Oferta Instantánea</span>
                    </div>
                    <span className="font-code-md text-xs text-[#4edea3] font-bold">{nft.instantBid}</span>
                  </div>
                )}
              </div>

              {/* Card Interactive Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() =>
                    onShowToast(
                      `Conectando a ${nft.primaryActionLabel}`,
                      `Verificando firma de orden y liquidez para ${nft.title}`
                    )
                  }
                  className="flex-1 h-11 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-[#3d494c]/40 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-[#4cd7f6]" />
                  <span>{nft.primaryActionLabel}</span>
                </button>

                <button
                  onClick={() =>
                    onShowToast(
                      `Conectando a ${nft.secondaryActionLabel}`,
                      `Consultando libro de órdenes para ${nft.title}`
                    )
                  }
                  className="h-11 px-4 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#3d494c]/40 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-[#d0bcff]" />
                  <span>{nft.secondaryActionLabel}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Price Alert Configuration Modal */}
      {alertModalNft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#4cd7f6]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Nueva Alerta de Precio</h3>
              </div>
              <button
                onClick={() => setAlertModalNft(null)}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Colección o Token
              </label>
              <div className="p-3 rounded-xl bg-[#191b23] border border-[#272a32] flex items-center justify-between">
                <span className="font-semibold text-sm text-[#e1e2ec]">{alertModalNft.title}</span>
                <span className="font-code-sm text-xs text-[#4cd7f6]">Auto-Detectado</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Condición de Disparo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAlertType('above')}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    alertType === 'above'
                      ? 'bg-[#4cd7f6] text-[#003640] shadow-md shadow-[#4cd7f6]/20'
                      : 'bg-[#191b23] text-[#bcc9cd] hover:bg-[#272a32] border border-[#272a32]'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Floor Supera</span>
                </button>

                <button
                  onClick={() => setAlertType('below')}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    alertType === 'below'
                      ? 'bg-[#4cd7f6] text-[#003640] shadow-md shadow-[#4cd7f6]/20'
                      : 'bg-[#191b23] text-[#bcc9cd] hover:bg-[#272a32] border border-[#272a32]'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Floor Cae De</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Umbral Objetivo ({alertModalNft.chain.includes('Solana') ? 'SOL' : 'ETH'})
              </label>
              <div className="flex items-center bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2.5">
                <input
                  type="text"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="bg-transparent text-[#e1e2ec] font-code-lg text-lg focus:outline-none w-full font-bold"
                  placeholder="0.00"
                />
                <span className="font-code-md text-sm text-[#4cd7f6] font-bold">
                  {alertModalNft.chain.includes('Solana') ? 'SOL' : 'ETH'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveAlert}
                disabled={isSavingAlert}
                className="w-full h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4cd7f6]/20 transition-all active:scale-95 cursor-pointer"
              >
                {isSavingAlert ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Alerta...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Alerta Inteligente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

