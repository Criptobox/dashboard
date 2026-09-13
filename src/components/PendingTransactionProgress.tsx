import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, ShieldCheck, ArrowRightLeft, Waypoints, Gift, LifeBuoy } from 'lucide-react';
import { TransactionInteractionType } from '../types';

interface PendingTransactionProgressProps {
  txId: string;
  confirmations: number;
  requiredConfirmations: number;
  blockNumber: number;
  type: TransactionInteractionType;
  onSpeedUp?: (txId: string) => void;
  className?: string;
}

export const PendingTransactionProgress: React.FC<PendingTransactionProgressProps> = ({
  txId,
  confirmations,
  requiredConfirmations,
  blockNumber,
  type,
  onSpeedUp,
  className = '',
}) => {
  const percent = Math.min(100, Math.max(3, Math.round((confirmations / requiredConfirmations) * 100)));
  const remainingBlocks = Math.max(0, requiredConfirmations - confirmations);
  const estimatedSecondsRemaining = Math.max(2, Math.ceil(remainingBlocks * 0.4));

  // Determine sub-label depending on transaction interaction type
  const getTypeSpecificLabel = () => {
    switch (type) {
      case 'bridge':
        return 'Validación Cross-Chain (Relay L1⇄L2)';
      case 'swap':
        return 'Enrutador DEX Privado • Anti-Sandwich MEV';
      case 'airdrop':
        return 'Verificación Criptográfica de Reclamo Merkle';
      case 'rescue':
        return 'Flashbots Bundle Atómico Privado';
      default:
        return 'Consenso de Validadores en Mempool';
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`mt-3.5 pt-3 border-t border-[#3d494c]/30 rounded-xl bg-[#13151c]/60 p-3 flex flex-col gap-2 ${className}`}
    >
      {/* Top telemetry and block header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-2">
          {/* Animated pulsing live radar */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4cd7f6]" />
          </span>

          <span className="font-bold text-xs text-[#e1e2ec] flex items-center gap-1.5">
            <span>En Mempool</span>
            <span className="text-[#3d494c] font-normal">•</span>
            <span className="font-code-sm text-[11px] text-[#869397]">Bloque #{blockNumber.toLocaleString()}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-code-sm">
          <span className="text-xs font-bold text-[#4cd7f6]">
            {confirmations}/{requiredConfirmations} Bloques
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40">
            {percent}%
          </span>
        </div>
      </div>

      {/* The Animated Progress Bar */}
      <div className="relative w-full h-3 rounded-full bg-[#0d0f14] border border-[#3d494c]/60 p-[2px] overflow-hidden shadow-inner">
        {/* Animated Fill Bar */}
        <motion.div
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative h-full rounded-full overflow-hidden bg-gradient-to-r from-[#00687a] via-[#4cd7f6] to-[#4edea3] shadow-[0_0_12px_rgba(76,215,246,0.5)]"
        >
          {/* High-speed animated shimmer sweep passing along the bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-sweep w-full h-full" />

          {/* Diagonal high-tech stripe pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px)',
            }}
          />

          {/* Leading active spark dot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </motion.div>
      </div>

      {/* Bottom status & Speed up control */}
      <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] min-w-0">
          <Clock className="w-3.5 h-3.5 text-[#4cd7f6] shrink-0" />
          <span className="truncate">
            ~{estimatedSecondsRemaining}s restantes
          </span>
          <span className="text-[#3d494c] hidden sm:inline">•</span>
          <span className="hidden sm:inline text-[#869397] truncate">
            {getTypeSpecificLabel()}
          </span>
        </div>

        {onSpeedUp && (
          <button
            onClick={() => onSpeedUp(txId)}
            className="px-2.5 py-1 rounded-lg bg-[#4cd7f6]/15 hover:bg-[#4cd7f6] text-[#4cd7f6] hover:text-[#003640] border border-[#4cd7f6]/30 hover:border-transparent font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0 shadow-xs"
            title="Priorizar transacción (+30% Gwei a validadores)"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Acelerar (+30%)</span>
          </button>
        )}
      </div>
    </div>
  );
};
