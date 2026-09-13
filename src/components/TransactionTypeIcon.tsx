import React from 'react';
import {
  Waypoints,
  ArrowLeftRight,
  Gift,
  LifeBuoy,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  Coins,
  FileCode,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TransactionInteractionType, TransactionStatus } from '../types';

interface TransactionTypeIconProps {
  type: TransactionInteractionType;
  status?: TransactionStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TransactionTypeIcon: React.FC<TransactionTypeIconProps> = ({
  type,
  status = 'confirmed',
  size = 'md',
  className = '',
}) => {
  const isPending = status === 'pending';

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  // Specific visual styling per type
  const getTypeConfig = () => {
    switch (type) {
      case 'bridge':
        return {
          icon: <Waypoints className={`${iconSizes} text-indigo-300 group-hover:scale-110 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-indigo-600/30 via-sky-600/20 to-[#191c24]',
          border: 'border-indigo-500/40 group-hover:border-indigo-400/80',
          glow: 'shadow-[0_0_12px_rgba(99,102,241,0.25)]',
          badgeText: 'Bridge L1⇄L2',
          badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
        };
      case 'swap':
        return {
          icon: <ArrowLeftRight className={`${iconSizes} text-[#4cd7f6] group-hover:rotate-180 transition-transform duration-300`} />,
          containerBg: 'bg-gradient-to-br from-[#00687a]/40 via-[#4cd7f6]/20 to-[#191c24]',
          border: 'border-[#4cd7f6]/40 group-hover:border-[#4cd7f6]/80',
          glow: 'shadow-[0_0_12px_rgba(76,215,246,0.25)]',
          badgeText: 'DEX Swap',
          badgeClass: 'bg-[#003640]/70 text-[#4cd7f6] border-[#4cd7f6]/40',
        };
      case 'airdrop':
        return {
          icon: <Gift className={`${iconSizes} text-[#d0bcff] group-hover:scale-110 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-purple-600/35 via-fuchsia-600/20 to-[#191c24]',
          border: 'border-[#d0bcff]/40 group-hover:border-[#d0bcff]/80',
          glow: 'shadow-[0_0_12px_rgba(208,188,255,0.25)]',
          badgeText: 'Airdrop Reclamo',
          badgeClass: 'bg-purple-950/70 text-[#d0bcff] border-purple-500/40',
        };
      case 'rescue':
        return {
          icon: <LifeBuoy className={`${iconSizes} text-[#4edea3] group-hover:rotate-45 transition-transform duration-300`} />,
          containerBg: 'bg-gradient-to-br from-emerald-600/35 via-teal-600/20 to-[#191c24]',
          border: 'border-[#4edea3]/40 group-hover:border-[#4edea3]/80',
          glow: 'shadow-[0_0_12px_rgba(78,222,163,0.25)]',
          badgeText: 'MEV Rescue',
          badgeClass: 'bg-emerald-950/70 text-[#4edea3] border-emerald-500/40',
        };
      case 'send':
        return {
          icon: <ArrowUpRight className={`${iconSizes} text-[#ffb4ab] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-rose-600/25 via-red-950/40 to-[#191c24]',
          border: 'border-[#ffb4ab]/30 group-hover:border-[#ffb4ab]/60',
          glow: 'shadow-[0_0_10px_rgba(255,180,171,0.15)]',
          badgeText: 'Envío',
          badgeClass: 'bg-rose-950/70 text-[#ffb4ab] border-rose-500/30',
        };
      case 'receive':
        return {
          icon: <ArrowDownLeft className={`${iconSizes} text-[#4edea3] group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-emerald-600/25 via-teal-950/40 to-[#191c24]',
          border: 'border-[#4edea3]/30 group-hover:border-[#4edea3]/60',
          glow: 'shadow-[0_0_10px_rgba(78,222,163,0.15)]',
          badgeText: 'Recepción',
          badgeClass: 'bg-emerald-950/70 text-[#4edea3] border-emerald-500/30',
        };
      case 'approval':
        return {
          icon: <KeyRound className={`${iconSizes} text-amber-300 group-hover:rotate-12 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-amber-600/25 via-orange-950/40 to-[#191c24]',
          border: 'border-amber-400/30 group-hover:border-amber-400/60',
          glow: 'shadow-[0_0_10px_rgba(251,191,36,0.15)]',
          badgeText: 'Aprobación ERC-20',
          badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
        };
      case 'staking':
        return {
          icon: <Coins className={`${iconSizes} text-[#acedff] group-hover:scale-110 transition-transform`} />,
          containerBg: 'bg-gradient-to-br from-sky-600/25 via-blue-950/40 to-[#191c24]',
          border: 'border-[#acedff]/30 group-hover:border-[#acedff]/60',
          glow: 'shadow-[0_0_10px_rgba(172,237,255,0.15)]',
          badgeText: 'DeFi Liquidez',
          badgeClass: 'bg-sky-950/70 text-[#acedff] border-sky-500/30',
        };
      default:
        return {
          icon: <FileCode className={`${iconSizes} text-[#bcc9cd]`} />,
          containerBg: 'bg-[#272a32]',
          border: 'border-[#3d494c]/40',
          glow: '',
          badgeText: 'Transacción',
          badgeClass: 'bg-[#272a32] text-[#bcc9cd] border-[#3d494c]/40',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Dynamic Animated Spinning Ring for Pending Transactions */}
      {isPending && (
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#4cd7f6]/70 via-[#4edea3]/40 to-indigo-500/60 animate-spin opacity-80 blur-[1px]" />
      )}

      {/* Main Icon Container */}
      <div
        className={`relative ${sizeClasses} ${config.containerBg} ${config.border} border flex items-center justify-center ${config.glow} transition-all duration-300 overflow-hidden`}
      >
        {/* Subtle Ambient Wave when Pending */}
        {isPending && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#4cd7f6]/20 to-transparent animate-pulse" />
        )}

        {/* Dynamic Icon */}
        <div className="relative z-10">{config.icon}</div>
      </div>

      {/* Mini Live Status Pill in Corner */}
      {isPending && (
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10131a] border border-[#4cd7f6] flex items-center justify-center shadow-lg"
          title="Transmitiendo en mempool"
        >
          <Loader2 className="w-2.5 h-2.5 text-[#4cd7f6] animate-spin" />
        </div>
      )}
    </div>
  );
};
