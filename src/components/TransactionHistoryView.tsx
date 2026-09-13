import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  Coins,
  KeyRound,
  Search,
  Filter,
  Plus,
  Zap,
  Fuel,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { TransactionRecord, TransactionInteractionType, TransactionStatus } from '../types';
import { TransactionDetailModal } from './TransactionDetailModal';

interface TransactionHistoryViewProps {
  transactions: TransactionRecord[];
  onUpdateTransactions?: (updater: (prev: TransactionRecord[]) => TransactionRecord[]) => void;
  onShowToast: (title: string, msg: string) => void;
  gasSaverMode?: boolean;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions: initialTxs,
  onUpdateTransactions,
  onShowToast,
  gasSaverMode = false,
}) => {
  // Local state initialized with props, kept synchronized
  const [txList, setTxList] = useState<TransactionRecord[]>(initialTxs);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync if initialTxs change externally
  useEffect(() => {
    setTxList(initialTxs);
  }, [initialTxs]);

  // Real-time block confirmation engine for pending transactions
  useEffect(() => {
    const hasPending = txList.some((tx) => tx.status === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      setTxList((prevList) => {
        let hasUpdated = false;
        const nextList = prevList.map((tx) => {
          if (tx.status !== 'pending') return tx;

          const increment = Math.floor(Math.random() * 4) + 2; // +2 to +5 blocks per tick
          const nextConfirmations = Math.min(tx.requiredConfirmations, tx.confirmations + increment);
          const isNowConfirmed = nextConfirmations >= tx.requiredConfirmations;

          if (isNowConfirmed) {
            hasUpdated = true;
            onShowToast(
              'Transacción Confirmada en Bloque',
              `${tx.title} ha alcanzado 64/64 confirmaciones.`
            );
            return {
              ...tx,
              confirmations: tx.requiredConfirmations,
              status: 'confirmed' as TransactionStatus,
              timestamp: 'Recién confirmada',
            };
          }

          return {
            ...tx,
            confirmations: nextConfirmations,
          };
        });

        if (hasUpdated && onUpdateTransactions) {
          onUpdateTransactions(() => nextList);
        }
        return nextList;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [txList, onShowToast, onUpdateTransactions]);

  const handleCopyHash = (e: React.MouseEvent, hash: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Hash Copiado', `${hash.slice(0, 8)}...${hash.slice(-6)}`);
  };

  const handleSpeedUpTx = (txId: string) => {
    setTxList((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            confirmations: Math.min(tx.requiredConfirmations, tx.confirmations + 24),
            gasPriceGwei: Number((tx.gasPriceGwei * 1.3).toFixed(1)),
          };
        }
        return tx;
      })
    );
    if (selectedTx && selectedTx.id === txId) {
      setSelectedTx((prev) =>
        prev
          ? {
              ...prev,
              confirmations: Math.min(prev.requiredConfirmations, prev.confirmations + 24),
              gasPriceGwei: Number((prev.gasPriceGwei * 1.3).toFixed(1)),
            }
          : null
      );
    }
    onShowToast('Gas Acelerado (+30%)', 'Transacción priorizada en los validadores de la mempool.');
  };

  const handleSimulateNewPendingTx = () => {
    const randomTypes: {
      type: TransactionInteractionType;
      typeLabel: string;
      title: string;
      desc: string;
      amount: string;
      usd: string;
      chain: string;
      chainLabel: string;
      method: string;
      explorerUrl: string;
      explorerName: string;
    }[] = [
      {
        type: 'swap',
        typeLabel: 'Canje Uniswap v3',
        title: 'Swap 0.35 ETH → USDC (Flashbots)',
        desc: 'Intercambio enrutado por constructor privado para evasión de arbitraje MEV',
        amount: '+1,168.40 USDC',
        usd: '+$1,168.40',
        chain: 'eth',
        chainLabel: 'Ethereum',
        method: 'exactInputSingle(params)',
        explorerUrl: 'https://etherscan.io/tx/0x',
        explorerName: 'Etherscan',
      },
      {
        type: 'rescue',
        typeLabel: 'OmniVault Rescue',
        title: 'Rescate de Depósito Atascado',
        desc: 'Bundle privado Flashbots para extracción de saldo en contrato L1',
        amount: '+$850.00 USDT',
        usd: '+$850.00',
        chain: 'eth',
        chainLabel: 'Ethereum',
        method: 'rescueVulnerableVault(address,bytes)',
        explorerUrl: 'https://etherscan.io/tx/0x',
        explorerName: 'Etherscan',
      },
      {
        type: 'send',
        typeLabel: 'Transferencia Base',
        title: 'Envío de Fondos a Smart Account',
        desc: 'Transferencia ERC-4337 con abstracción de cuenta nativa en Base L2',
        amount: '-0.15 ETH',
        usd: '-$501.20',
        chain: 'base',
        chainLabel: 'Base L2',
        method: 'transfer(address,uint256)',
        explorerUrl: 'https://basescan.org/tx/0x',
        explorerName: 'BaseScan',
      },
    ];

    const pick = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fullHash = `0x${randomHex}`;

    const newTx: TransactionRecord = {
      id: `tx-live-${Date.now()}`,
      hash: fullHash,
      chain: pick.chain,
      chainLabel: pick.chainLabel,
      type: pick.type,
      typeLabel: pick.typeLabel,
      title: pick.title,
      description: pick.desc,
      status: 'pending',
      confirmations: 2,
      requiredConfirmations: 64,
      timestamp: 'Ahora mismo (Mempool)',
      blockNumber: 20849340 + Math.floor(Math.random() * 10),
      fromAddress: '0x7F29b8A649c096EdfC7802Db349F899e072fa9B2',
      fromLabel: 'OmniVault Hot Wallet',
      toAddress: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
      toLabel: 'Flashbots Relay Bundler',
      amountDisplay: pick.amount,
      amountUsdDisplay: pick.usd,
      isPositive: !pick.amount.startsWith('-'),
      gasFeeEth: '0.00072 ETH',
      gasFeeUsd: '$2.40',
      gasUsed: '84,000 units',
      gasPriceGwei: 15.4,
      savedWithEcoGasUsd: '$4.10',
      contractMethod: pick.method,
      mevProtected: true,
      explorerUrl: `${pick.explorerUrl}${randomHex}`,
      explorerName: pick.explorerName,
    };

    setTxList((prev) => [newTx, ...prev]);
    if (onUpdateTransactions) {
      onUpdateTransactions((prev) => [newTx, ...prev]);
    }
    onShowToast('Nueva Transacción en Mempool', 'Transacción transmitida. Observa las confirmaciones en tiempo real.');
  };

  const getInteractionIcon = (type: TransactionInteractionType) => {
    switch (type) {
      case 'swap':
        return <ArrowLeftRight className="w-4 h-4 text-[#4cd7f6]" />;
      case 'rescue':
        return <ShieldCheck className="w-4 h-4 text-[#4edea3]" />;
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-[#ffb4ab]" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-[#4edea3]" />;
      case 'airdrop':
        return <Sparkles className="w-4 h-4 text-[#d0bcff]" />;
      case 'approval':
        return <KeyRound className="w-4 h-4 text-[#ffdbcd]" />;
      case 'staking':
        return <Coins className="w-4 h-4 text-[#acedff]" />;
      default:
        return <RefreshCw className="w-4 h-4 text-[#bcc9cd]" />;
    }
  };

  // Filter logic
  const filteredTransactions = txList.filter((tx) => {
    // Type filter
    if (selectedTypeFilter !== 'all') {
      if (selectedTypeFilter === 'swap' && tx.type !== 'swap') return false;
      if (selectedTypeFilter === 'rescue' && tx.type !== 'rescue') return false;
      if (selectedTypeFilter === 'transfers' && tx.type !== 'send' && tx.type !== 'receive') return false;
      if (selectedTypeFilter === 'airdrop' && tx.type !== 'airdrop') return false;
      if (selectedTypeFilter === 'approval' && tx.type !== 'approval') return false;
      if (selectedTypeFilter === 'staking' && tx.type !== 'staking') return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'confirmed' && tx.status !== 'confirmed') return false;
      if (selectedStatusFilter === 'pending' && tx.status !== 'pending') return false;
      if (selectedStatusFilter === 'failed' && tx.status !== 'failed') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchHash = tx.hash.toLowerCase().includes(q);
      const matchChain = tx.chainLabel.toLowerCase().includes(q);
      const matchType = tx.typeLabel.toLowerCase().includes(q);
      const matchMethod = tx.contractMethod?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchHash && !matchChain && !matchType && !matchMethod) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = txList.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Banner: Quick Summary & Controls */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1d1f27] via-[#21242e] to-[#1d1f27] border border-[#3d494c]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00687a]/20 border border-[#4cd7f6]/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#4cd7f6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#e1e2ec]">Historial de Bloques & Mempool</h3>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                  {pendingCount} en validación
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00a572]/20 text-[#4edea3] border border-[#00a572]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Sincronizado
                </span>
              )}
            </div>
            <p className="text-xs text-[#bcc9cd] mt-0.5">
              Confirmaciones en tiempo real (L1/L2), enlaces verificados a exploradores y telemetría de gas.
            </p>
          </div>
        </div>

        {/* Action button to simulate live pending tx */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateNewPendingTx}
            className="px-3 py-2 rounded-xl bg-[#4cd7f6] hover:brightness-110 active:scale-95 text-[#003640] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Simular Tx en Mempool</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#869397]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por TxHash (0x...), método, protocolo o red..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1d1f27] border border-[#3d494c]/40 text-xs text-[#e1e2ec] placeholder-[#869397] focus:outline-none focus:border-[#4cd7f6] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#869397] hover:text-[#e1e2ec]"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Status Select Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#1d1f27] border border-[#3d494c]/40 text-xs text-[#e1e2ec] focus:outline-none focus:border-[#4cd7f6] cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="confirmed">Confirmadas (64/64)</option>
              <option value="pending">En Mempool (En Vivo)</option>
              <option value="failed">Revertidas / Neutralizadas</option>
            </select>
          </div>
        </div>

        {/* Interaction Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Todas las Interacciones' },
            { id: 'swap', label: 'Canjes (Swaps)' },
            { id: 'rescue', label: 'Rescates MEV' },
            { id: 'transfers', label: 'Envíos / Recibos' },
            { id: 'airdrop', label: 'Airdrops' },
            { id: 'approval', label: 'Aprobaciones' },
            { id: 'staking', label: 'DeFi / Staking' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40 font-semibold'
                  : 'bg-[#1d1f27] text-[#bcc9cd] hover:text-[#e1e2ec] border border-[#3d494c]/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#1d1f27]/50 border border-[#3d494c]/30 text-center space-y-2">
            <SlidersHorizontal className="w-8 h-8 text-[#869397] mx-auto opacity-50" />
            <h4 className="text-sm font-semibold text-[#e1e2ec]">No se encontraron transacciones</h4>
            <p className="text-xs text-[#869397] max-w-sm mx-auto">
              Prueba cambiando los filtros de interacción o término de búsqueda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTypeFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="text-xs text-[#4cd7f6] hover:underline font-semibold cursor-pointer pt-1 inline-block"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isCopied = copiedId === tx.id;
            const progressPercent = Math.min(
              100,
              Math.round((tx.confirmations / tx.requiredConfirmations) * 100)
            );

            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setSelectedTx(tx)}
                className={`p-3.5 sm:p-4 rounded-2xl bg-[#1d1f27] hover:bg-[#232631] border transition-all cursor-pointer group relative overflow-hidden ${
                  tx.status === 'pending'
                    ? 'border-[#4cd7f6]/40 shadow-sm shadow-[#4cd7f6]/10'
                    : 'border-[#3d494c]/30 hover:border-[#3d494c]/60'
                }`}
              >
                {/* Pending active indicator bar */}
                {tx.status === 'pending' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#191c24] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00687a] via-[#4cd7f6] to-[#4edea3] transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side: Interaction Type, Icon, Title, and Real-Time Badge */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#272a32] border border-[#3d494c]/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      {getInteractionIcon(tx.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#e1e2ec] group-hover:text-[#4cd7f6] transition-colors truncate">
                          {tx.title}
                        </h4>
                        
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#272a32] text-[#bcc9cd] border border-[#3d494c]/40">
                          {tx.chainLabel}
                        </span>

                        {/* Real-time Confirmation Badge */}
                        {tx.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00a572]/15 text-[#4edea3] border border-[#00a572]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirmada (64/64)</span>
                          </span>
                        )}

                        {tx.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 animate-pulse">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Mempool: {tx.confirmations}/64 bloques</span>
                          </span>
                        )}

                        {tx.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Revertida</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#869397] mt-1 line-clamp-1">
                        {tx.description}
                      </p>

                      {/* Hash & Metadata row */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#bcc9cd]">
                        <div className="flex items-center gap-1 font-code-sm">
                          <span>Tx: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}</span>
                          <button
                            onClick={(e) => handleCopyHash(e, tx.hash, tx.id)}
                            className="p-1 rounded hover:bg-[#32353d] text-[#869397] hover:text-[#4cd7f6] transition-colors cursor-pointer"
                            title="Copiar Hash"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        <span className="text-[#3d494c]">•</span>
                        <span className="text-[#869397]">{tx.timestamp}</span>

                        {tx.contractMethod && (
                          <>
                            <span className="text-[#3d494c]">•</span>
                            <span className="font-code-sm text-[#4cd7f6] px-1.5 py-0.2 rounded bg-[#13151b] border border-[#3d494c]/20 truncate max-w-[140px]">
                              {tx.contractMethod.split('(')[0]}()
                            </span>
                          </>
                        )}

                        {tx.mevProtected && (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[#4edea3] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Flashbots RPC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount, Gas, and Direct Explorer Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#3d494c]/20">
                    <div className="text-left sm:text-right">
                      <span className={`font-code-md text-sm font-bold block ${
                        tx.isPositive ? 'text-[#4edea3]' : 'text-[#e1e2ec]'
                      }`}>
                        {tx.amountDisplay}
                      </span>
                      <div className="flex items-center sm:justify-end gap-1 text-[11px] text-[#869397] font-code-sm">
                        <span>{tx.amountUsdDisplay}</span>
                        <span>•</span>
                        <span className="text-[#bcc9cd]">Gas {tx.gasFeeUsd}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Direct Block Explorer Link */}
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#869397] hover:text-[#4cd7f6] transition-colors border border-[#3d494c]/30 flex items-center justify-center cursor-pointer"
                        title={`Abrir en ${tx.explorerName}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Detail Chevron */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="p-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#869397] hover:text-[#e1e2ec] transition-colors border border-[#3d494c]/30 cursor-pointer"
                        title="Ver Ficha Técnica Completa"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Telemetry Summary Footer */}
      <div className="p-3.5 rounded-2xl bg-[#1d1f27]/70 border border-[#3d494c]/30 flex flex-wrap items-center justify-between gap-3 text-xs text-[#bcc9cd]">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-[#4edea3]" />
          <span>Total Ahorrado en Gas: <strong className="text-[#4edea3] font-code-sm">+$22.00 USD</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#4cd7f6]" />
          <span>7/8 Transacciones enrutadas vía Flashbots Builder</span>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        tx={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onSpeedUp={handleSpeedUpTx}
        onShowToast={onShowToast}
      />
    </div>
  );
};
