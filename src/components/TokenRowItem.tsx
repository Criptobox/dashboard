import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenItem } from '../types';
import { TokenLogo } from './TokenLogo';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface TokenRowItemProps {
  token: TokenItem;
  hideBalance: boolean;
  onOpenActionModal: (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => void;
}

export const TokenRowItem: React.FC<TokenRowItemProps> = ({
  token,
  hideBalance,
  onOpenActionModal,
}) => {
  const [flashType, setFlashType] = useState<
    'price-up' | 'price-down' | 'balance-up' | 'balance-down' | null
  >(null);

  const prevPriceRef = useRef<number>(token.priceUsd);
  const prevBalanceRef = useRef<number>(token.balance);
  const prevValueRef = useRef<number>(token.valueUsd);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Detect price change
    if (Math.abs(token.priceUsd - prevPriceRef.current) > 0.0001) {
      if (token.priceUsd > prevPriceRef.current) {
        setFlashType('price-up');
      } else {
        setFlashType('price-down');
      }
      prevPriceRef.current = token.priceUsd;
      timer = setTimeout(() => setFlashType(null), 1400);
    }
    // Detect balance change
    else if (Math.abs(token.balance - prevBalanceRef.current) > 0.00001) {
      if (token.balance > prevBalanceRef.current) {
        setFlashType('balance-up');
      } else {
        setFlashType('balance-down');
      }
      prevBalanceRef.current = token.balance;
      timer = setTimeout(() => setFlashType(null), 1400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [token.priceUsd, token.balance]);

  // Keep value in sync
  useEffect(() => {
    prevValueRef.current = token.valueUsd;
  }, [token.valueUsd]);

  const getBorderAndBgStyle = () => {
    if (flashType === 'price-up') {
      return 'border-[#4edea3]/70 bg-[#4edea3]/10 shadow-lg shadow-[#4edea3]/10';
    }
    if (flashType === 'price-down') {
      return 'border-[#ffb4ab]/70 bg-[#ffb4ab]/10 shadow-lg shadow-[#ffb4ab]/10';
    }
    if (flashType?.startsWith('balance')) {
      return 'border-[#4cd7f6]/70 bg-[#4cd7f6]/10 shadow-lg shadow-[#4cd7f6]/10';
    }
    return 'border-[#3d494c]/30 bg-[#1d1f27] hover:bg-[#272a32]';
  };

  return (
    <motion.div
      layout
      layoutId={token.id}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -14,
        scale: 0.95,
        filter: 'blur(2px)',
        transition: { duration: 0.22 },
      }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 30,
        mass: 0.8,
      }}
      onClick={() => onOpenActionModal('swap', token)}
      className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300 cursor-pointer group select-none ${getBorderAndBgStyle()}`}
    >
      {/* Left side: Logo + Name + Animated Price */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <TokenLogo symbol={token.symbol} size="lg" />
          {/* Subtle live indicator dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10131a] flex items-center justify-center">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                token.change24h >= 0 ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'
              }`}
            />
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm text-[#e1e2ec] truncate group-hover:text-[#4cd7f6] transition-colors">
              {token.name}
            </h3>
            <span className="px-1.5 py-0.5 rounded bg-[#32353d] text-[#bcc9cd] font-code-sm text-[10px]">
              {token.chainLabel}
            </span>

            {/* Flash Badge Indicator for changes */}
            <AnimatePresence>
              {flashType === 'price-up' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6, x: -4 }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-code-sm text-[#4edea3] bg-[#4edea3]/20 px-1.5 py-0.2 rounded-full font-bold border border-[#4edea3]/30"
                >
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  <span>+Precio</span>
                </motion.span>
              )}
              {flashType === 'price-down' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6, x: -4 }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-code-sm text-[#ffb4ab] bg-[#ffb4ab]/20 px-1.5 py-0.2 rounded-full font-bold border border-[#ffb4ab]/30"
                >
                  <ArrowDownRight className="w-2.5 h-2.5" />
                  <span>-Precio</span>
                </motion.span>
              )}
              {flashType?.startsWith('balance') && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6, x: -4 }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-code-sm text-[#4cd7f6] bg-[#4cd7f6]/20 px-1.5 py-0.2 rounded-full font-bold border border-[#4cd7f6]/30"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>Saldo Act.</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Animated Price & 24h Change Row */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="relative inline-flex items-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={token.priceUsd}
                  initial={{ opacity: 0, y: flashType === 'price-up' ? 6 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: flashType === 'price-up' ? -6 : 6 }}
                  transition={{ duration: 0.2 }}
                  className={`font-code-sm text-xs transition-colors duration-300 font-medium ${
                    flashType === 'price-up'
                      ? 'text-[#4edea3] font-bold'
                      : flashType === 'price-down'
                      ? 'text-[#ffb4ab] font-bold'
                      : 'text-[#bcc9cd]'
                  }`}
                >
                  ${token.priceUsd.toLocaleString()}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="relative inline-flex items-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={token.change24h}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }}
                  className={`font-code-sm text-xs font-semibold ${
                    token.change24h >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {token.change24h >= 0 ? `+${token.change24h}%` : `${token.change24h}%`}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Animated Total USD Value & Balance */}
      <div className="text-right shrink-0">
        <div className="font-code-md text-sm font-bold relative overflow-hidden flex justify-end">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hideBalance ? 'hidden-usd' : token.valueUsd}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -7 }}
              transition={{ duration: 0.22 }}
              className={`transition-colors duration-300 ${
                flashType === 'price-up' || flashType === 'balance-up'
                  ? 'text-[#4edea3]'
                  : flashType === 'price-down' || flashType === 'balance-down'
                  ? 'text-[#ffb4ab]'
                  : 'text-[#e1e2ec]'
              }`}
            >
              ${hideBalance ? '••••' : token.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="font-code-sm text-xs relative overflow-hidden flex justify-end mt-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hideBalance ? 'hidden-bal' : token.balance}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={`transition-colors duration-300 ${
                flashType?.startsWith('balance')
                  ? 'text-[#4cd7f6] font-bold'
                  : 'text-[#869397]'
              }`}
            >
              {hideBalance ? '••••' : `${token.balance} ${token.symbol}`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
