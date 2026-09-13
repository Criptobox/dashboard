import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  Coins,
  KeyRound,
  FileCode,
  Share2,
  Layers,
  Fuel,
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { PendingTransactionProgress } from './PendingTransactionProgress';

interface TransactionDetailModalProps {
  tx: TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSpeedUp?: (txId: string) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  tx,
  isOpen,
  onClose,
  onSpeedUp,
  onShowToast,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState(false);
  const [copiedTo, setCopiedTo] = useState(false);

  if (!isOpen || !tx) return null;

  const copyToClipboard = (text: string, type: 'hash' | 'from' | 'to') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'from') {
      setCopiedFrom(true);
      setTimeout(() => setCopiedFrom(false), 2000);
    } else {
      setCopiedTo(true);
      setTimeout(() => setCopiedTo(false), 2000);
    }
    onShowToast('Copiado al Portapapeles', `${text.slice(0, 10)}...${text.slice(-6)}`);
  };

  const getInteractionIcon = () => {
    switch (tx.type) {
      case 'swap':
        return <ArrowLeftRight className="w-5 h-5 text-[#4cd7f6]" />;
      case 'rescue':
        return <ShieldCheck className="w-5 h-5 text-[#4edea3]" />;
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-[#ffb4ab]" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-[#4edea3]" />;
      case 'airdrop':
        return <Sparkles className="w-5 h-5 text-[#d0bcff]" />;
      case 'approval':
        return <KeyRound className="w-5 h-5 text-[#ffdbcd]" />;
      case 'staking':
        return <Coins className="w-5 h-5 text-[#acedff]" />;
      default:
        return <FileCode className="w-5 h-5 text-[#bcc9cd]" />;
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round((tx.confirmations / tx.requiredConfirmations) * 100)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#191c24] border border-[#3d494c]/60 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-[#e1e2ec] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#3d494c]/30 flex items-center justify-between sticky top-0 bg-[#191c24]/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <TransactionTypeIcon type={tx.type} status={tx.status} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#e1e2ec]">{tx.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#272a32] text-[#4cd7f6] border border-[#4cd7f6]/20">
                    {tx.chainLabel}
                  </span>
                </div>
                <p className="text-xs text-[#869397] mt-0.5">{tx.typeLabel} • {tx.timestamp}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#869397] hover:text-[#e1e2ec] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Status & Confirmation State Banner */}
            <div className={`p-4 rounded-2xl border ${
              tx.status === 'confirmed'
                ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                : tx.status === 'pending'
                ? 'bg-[#4cd7f6]/10 border-[#4cd7f6]/30 text-[#4cd7f6]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {tx.status === 'confirmed' && (
                    <CheckCircle2 className="w-5 h-5 text-[#4edea3] shrink-0" />
                  )}
                  {tx.status === 'pending' && (
                    <Clock className="w-5 h-5 text-[#4cd7f6] shrink-0 animate-spin" />
                  )}
                  {tx.status === 'failed' && (
                    <AlertTriangle className="w-5 h-5 text-[#ffb4ab] shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {tx.status === 'confirmed' && 'Transacción Confirmada & Finalizada'}
                      {tx.status === 'pending' && `Confirmando en Mempool (${tx.confirmations}/${tx.requiredConfirmations} bloques)`}
                      {tx.status === 'failed' && 'Transacción Revertida / Neutralizada'}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5 text-[#bcc9cd]">
                      {tx.status === 'confirmed' && `Inclusión verificada en bloque #${tx.blockNumber.toLocaleString()}`}
                      {tx.status === 'pending' && `Bloque en validación de consenso descentralizado. Progreso: ${progressPercent}%`}
                      {tx.status === 'failed' && 'Firma o llamada revertida para prevenir pérdida de fondos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Animated Progress Bar for Pending Transactions */}
              {tx.status === 'pending' && (
                <PendingTransactionProgress
                  txId={tx.id}
                  confirmations={tx.confirmations}
                  requiredConfirmations={tx.requiredConfirmations}
                  blockNumber={tx.blockNumber}
                  type={tx.type}
                  onSpeedUp={onSpeedUp}
                />
              )}
            </div>

            {/* Value & Transfer Highlight */}
            <div className="p-4 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#869397] font-semibold">
                  Monto de Interacción
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-xl font-bold font-code-md ${tx.isPositive ? 'text-[#4edea3]' : 'text-[#e1e2ec]'}`}>
                    {tx.amountDisplay}
                  </span>
                </div>
                <span className="text-xs text-[#869397] font-code-sm">{tx.amountUsdDisplay}</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-[#869397] font-semibold">
                  Costo de Red (Gas)
                </span>
                <div className="text-sm font-bold font-code-md text-[#e1e2ec] mt-0.5">
                  {tx.gasFeeUsd}
                </div>
                <span className="text-[11px] text-[#bcc9cd] font-code-sm">{tx.gasFeeEth}</span>
              </div>
            </div>

            {/* Transaction Hash with Direct Explorer Link */}
            <div className="p-4 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#bcc9cd]">Hash de la Transacción (TxHash)</span>
                <a
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline font-semibold"
                >
                  <span>Ver en {tx.explorerName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-2.5 rounded-xl bg-[#13151b] border border-[#3d494c]/20 flex items-center justify-between gap-2">
                <code className="text-xs font-code-sm text-[#e1e2ec] truncate select-all">
                  {tx.hash}
                </code>
                <button
                  onClick={() => copyToClipboard(tx.hash, 'hash')}
                  className="p-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#4cd7f6] transition-colors shrink-0 cursor-pointer"
                  title="Copiar Hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Addresses (From / To) */}
            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-[#869397] block font-semibold">Origen (De)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-medium text-[#e1e2ec] truncate">
                      {tx.fromLabel || `${tx.fromAddress.slice(0, 8)}...${tx.fromAddress.slice(-6)}`}
                    </span>
                    <span className="text-[10px] text-[#869397] font-code-sm">
                      ({tx.fromAddress.slice(0, 6)}...{tx.fromAddress.slice(-4)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(tx.fromAddress, 'from')}
                  className="p-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#869397] hover:text-[#4cd7f6] transition-colors shrink-0 cursor-pointer"
                  title="Copiar dirección origen"
                >
                  {copiedFrom ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-[#869397] block font-semibold">Destino / Contrato (Hacia)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-medium text-[#e1e2ec] truncate">
                      {tx.toLabel || `${tx.toAddress.slice(0, 8)}...${tx.toAddress.slice(-6)}`}
                    </span>
                    <span className="text-[10px] text-[#869397] font-code-sm">
                      ({tx.toAddress.slice(0, 6)}...{tx.toAddress.slice(-4)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(tx.toAddress, 'to')}
                  className="p-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#869397] hover:text-[#4cd7f6] transition-colors shrink-0 cursor-pointer"
                  title="Copiar dirección destino"
                >
                  {copiedTo ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="p-4 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 space-y-3">
              <h5 className="text-xs font-bold text-[#bcc9cd] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4cd7f6]" />
                Especificaciones de Ejecución & Red
              </h5>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#13151b] border border-[#3d494c]/20">
                  <span className="text-[10px] text-[#869397] block font-semibold">Método de Contrato</span>
                  <code className="text-[#4cd7f6] font-code-sm font-semibold truncate block mt-0.5">
                    {tx.contractMethod || 'transfer(address,uint256)'}
                  </code>
                </div>

                <div className="p-2.5 rounded-xl bg-[#13151b] border border-[#3d494c]/20">
                  <span className="text-[10px] text-[#869397] block font-semibold">Gas Utilizado</span>
                  <span className="text-[#e1e2ec] font-code-sm block mt-0.5">
                    {tx.gasUsed}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#13151b] border border-[#3d494c]/20">
                  <span className="text-[10px] text-[#869397] block font-semibold">Precio de Gas Base</span>
                  <span className="text-[#e1e2ec] font-code-sm block mt-0.5">
                    {tx.gasPriceGwei} Gwei
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#13151b] border border-[#3d494c]/20">
                  <span className="text-[10px] text-[#869397] block font-semibold">Bloque de Inclusión</span>
                  <span className="text-[#e1e2ec] font-code-sm block mt-0.5">
                    #{tx.blockNumber.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Flashbots Gas Optimization & Savings Audit */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#16181f] via-[#1a1e27] to-[#16181f] border border-[#4edea3]/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#e1e2ec] flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-[#4edea3]" />
                    Auditoría de Gas Flashbots
                  </span>
                  {tx.gasSavingsPercent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00a572]/20 text-[#4edea3] border border-[#00a572]/40">
                      -{tx.gasSavingsPercent}% Reducción
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-code-sm">
                  <div className="p-2 rounded-lg bg-[#13151b] border border-[#3d494c]/30">
                    <span className="text-[10px] text-[#869397] block">Gas Real Abonado</span>
                    <span className="font-bold text-[#4cd7f6] mt-0.5 block">
                      {tx.gasFeeUsd}
                    </span>
                    <span className="text-[10px] text-[#869397]">
                      {tx.gasPriceGwei} Gwei
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#13151b] border border-[#3d494c]/30">
                    <span className="text-[10px] text-[#869397] block">Flashbots Óptimo</span>
                    <span className="font-bold text-[#4edea3] mt-0.5 block">
                      {tx.optimalGasFeeUsd || tx.gasFeeUsd}
                    </span>
                    <span className="text-[10px] text-[#869397]">
                      {tx.optimalGasPriceGwei ?? tx.gasPriceGwei} Gwei
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#13151b] border border-[#00a572]/40 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#4edea3] block font-bold">Ahorro con Ajuste</span>
                    <span className="font-bold text-[#4edea3] mt-0.5 block">
                      +{tx.savedWithEcoGasUsd || '$0.00'} USD
                    </span>
                    <span className="text-[10px] text-[#869397]">
                      vs Mempool pública
                    </span>
                  </div>
                </div>

                {tx.unoptimizedGasUsd && (
                  <div className="text-[11px] text-[#869397] flex items-center justify-between pt-1 border-t border-[#3d494c]/20">
                    <span>Sin optimización (mempool pública):</span>
                    <span className="line-through text-[#ffb4ab] font-code-sm">{tx.unoptimizedGasUsd} USD</span>
                  </div>
                )}
              </div>
            </div>

            {/* MEV & Privacy Shield */}
            {tx.mevProtected && (
              <div className="p-3.5 rounded-2xl bg-[#00687a]/15 border border-[#4cd7f6]/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#4cd7f6] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#4cd7f6] block">Protección Flashbots RPC Activa</span>
                  <p className="text-[#bcc9cd] mt-0.5 leading-relaxed">
                    Esta interacción fue remitida a través del builder privado de OmniVault, neutralizando ataques de arbitraje sándwich y frontrunning de bots mempool.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-[#3d494c]/30 bg-[#191c24]/95 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0">
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#272a32] hover:bg-[#32353d] border border-[#3d494c]/40 text-[#e1e2ec] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Abrir Explorador ({tx.explorerName})</span>
              <ExternalLink className="w-4 h-4 text-[#4cd7f6]" />
            </a>

            <button
              onClick={() => {
                const summary = `Tx OmniVault: ${tx.title} (${tx.amountDisplay}) - ${tx.hash}\n${tx.explorerUrl}`;
                navigator.clipboard.writeText(summary);
                onShowToast('Comprobante Copiado', 'Detalles de la transacción listos para compartir');
              }}
              className="py-2.5 px-4 rounded-xl bg-[#4cd7f6] hover:brightness-110 text-[#003640] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
