import React from 'react';

interface TokenLogoProps {
  symbol: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TokenLogo: React.FC<TokenLogoProps> = ({ symbol, className = '', size = 'md' }) => {
  const cleanSymbol = symbol.toUpperCase().trim();

  const sizeClasses = {
    sm: 'w-5 h-5 min-w-[20px]',
    md: 'w-7 h-7 min-w-[28px]',
    lg: 'w-10 h-10 min-w-[40px]',
    xl: 'w-12 h-12 min-w-[48px]',
  };

  const currentSizeClass = sizeClasses[size];

  // Official high-fidelity crypto token SVGs
  switch (cleanSymbol) {
    case 'ETH':
    case 'ETHEREUM':
    case 'WETH':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#627eea]/20 border border-[#627eea]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 784.37 1277.39" className="w-3/5 h-3/5 text-[#627eea]" fill="currentColor">
            <path d="M392.07 0L383.5 29.11V873.74L392.07 882.29L784.13 650.54L392.07 0Z" fill="#627eea" />
            <path d="M392.07 0L0 650.54L392.07 882.29V472.33V0Z" fill="#8a92b2" />
            <path d="M392.07 956.52L387.24 962.41V1277.38L392.07 1277.39L784.37 724.89L392.07 956.52Z" fill="#627eea" />
            <path d="M392.07 1277.39V956.52L0 724.89L392.07 1277.39Z" fill="#8a92b2" />
            <path d="M392.07 882.29L784.13 650.54L392.07 472.33V882.29Z" fill="#454a75" />
            <path d="M0 650.54L392.07 882.29V472.33L0 650.54Z" fill="#627eea" />
          </svg>
        </div>
      );

    case 'SOL':
    case 'SOLANA':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-gradient-to-tr from-[#9945FF]/20 to-[#14F195]/20 border border-[#14F195]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 397 311" className="w-3/5 h-3/5">
            <defs>
              <linearGradient id="solanaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#9945FF" />
                <stop offset="100%" stopColor="#14F195" />
              </linearGradient>
            </defs>
            <path fill="url(#solanaGrad)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67 1.4 70.3 0 73.8 0h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zm267.8 115.1c-2.4-2.4-5.7-3.8-9.2-3.8H9.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h313.7c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
          </svg>
        </div>
      );

    case 'USDC':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#2775CA]/20 border border-[#2775CA]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 2000 2000" className="w-3/5 h-3/5">
            <circle cx="1000" cy="1000" r="1000" fill="#2775CA" />
            <path fill="#FFFFFF" d="M1275 1158c0-142-84-190-252-211-118-15-143-46-143-98 0-51 38-83 111-83 67 0 102 24 122 75 4 10 13 16 24 16h81c13 0 24-10 25-23-4-68-52-132-139-152v-99c0-14-11-25-25-25h-84c-14 0-25 11-25 25v95c-106 17-178 86-178 181 0 135 80 186 247 208 123 18 148 44 148 102 0 66-54 103-128 103-97 0-136-41-149-92-3-12-13-20-25-20h-85c-14 0-25 11-25 25 14 87 74 153 174 176v100c0 14 11 25 25 25h84c14 0 25-11 25-25v-98c114-18 190-87 190-184z" />
            <circle cx="1000" cy="1000" r="780" fill="none" stroke="#FFFFFF" strokeWidth="48" opacity="0.4" />
          </svg>
        </div>
      );

    case 'POL':
    case 'MATIC':
    case 'POLYGON':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#8247E5]/20 border border-[#8247E5]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 38 33" className="w-3/5 h-3/5" fill="none">
            <path d="M29 10.2L19.2 4.5c-.8-.5-1.7-.5-2.5 0L6.9 10.2c-.8.5-1.2 1.3-1.2 2.3v11.4c0 .9.5 1.8 1.2 2.3l9.8 5.7c.8.5 1.7.5 2.5 0l9.8-5.7c.8-.5 1.2-1.3 1.2-2.3V12.5c0-1-.5-1.8-1.2-2.3z" fill="#8247E5" />
            <path d="M18 19.3l-4.9-2.8v-5.7l4.9 2.8v5.7zm2.9-7.4l4.9-2.8 4.9 2.8-4.9 2.9-4.9-2.9zm4.9 4.6l4.9-2.8v5.7l-4.9 2.8v-5.7z" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'LINK':
    case 'CHAINLINK':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#375BD2]/20 border border-[#375BD2]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 375 433" className="w-3/5 h-3/5" fill="#375BD2">
            <path d="M187.5 0L37.5 86.6v173.2L187.5 346.4l150-86.6V86.6L187.5 0zm97.5 228.3l-97.5 56.3-97.5-56.3V117.7l97.5-56.3 97.5 56.3v110.6z" />
          </svg>
        </div>
      );

    case 'ARB':
    case 'ARBITRUM':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#28A0F0]/20 border border-[#28A0F0]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5" fill="#28A0F0">
            <path d="M14.6 2.5L7.2 16.4l2.5 4.5 9.7-14.8-4.8-3.6zm-5.2 9.9l-4.8 9.1h4.9l2.4-4.5-2.5-4.6zm7.2 4.6l-2.4 4.5h4.9l4.9-9.1-7.4 4.6z" />
          </svg>
        </div>
      );

    case 'OP':
    case 'OPTIMISM':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#FF0420]/20 border border-[#FF0420]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 32 32" className="w-3/5 h-3/5">
            <circle cx="16" cy="16" r="16" fill="#FF0420" />
            <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">
              OP
            </text>
          </svg>
        </div>
      );

    case 'BASE':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#0052FF]/20 border border-[#0052FF]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 115 115" className="w-3/5 h-3/5">
            <circle cx="57.5" cy="57.5" r="57.5" fill="#0052FF" />
            <path d="M57.5 95C78.2107 95 95 78.2107 95 57.5C95 36.7893 78.2107 20 57.5 20C38.1691 20 22.2562 34.6146 20.2584 53.4074H69.4583V61.5926H20.2584C22.2562 80.3854 38.1691 95 57.5 95Z" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'UNI':
    case 'UNISWAP':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#FF007A]/20 border border-[#FF007A]/40 ${currentSizeClass} ${className}`}>
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5" fill="#FF007A">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>
      );

    case 'ZRO':
    case 'LAYERZERO':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#000000] border border-[#ffffff]/30 ${currentSizeClass} ${className}`}>
          <span className="font-code-sm font-black text-[10px] text-white tracking-tighter">ZRO</span>
        </div>
      );

    case 'HYPE':
    case 'HYPERLIQUID':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#50E3C2]/20 border border-[#50E3C2]/40 ${currentSizeClass} ${className}`}>
          <span className="font-code-sm font-black text-[10px] text-[#50E3C2] tracking-tighter">HYPE</span>
        </div>
      );

    case 'MONAD':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#836EF9]/20 border border-[#836EF9]/40 ${currentSizeClass} ${className}`}>
          <span className="font-code-sm font-black text-[10px] text-[#836EF9] tracking-tighter">MON</span>
        </div>
      );

    case 'SCR':
    case 'SCROLL':
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#FFE799]/20 border border-[#FFE799]/40 ${currentSizeClass} ${className}`}>
          <span className="font-code-sm font-black text-[10px] text-[#FFE799] tracking-tighter">SCR</span>
        </div>
      );

    default:
      return (
        <div className={`relative rounded-full flex items-center justify-center bg-[#272a32] border border-[#3d494c] ${currentSizeClass} ${className}`}>
          <span className="font-code-sm text-[10px] font-bold text-[#4cd7f6]">
            {cleanSymbol.slice(0, 3)}
          </span>
        </div>
      );
  }
};
