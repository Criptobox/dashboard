import React, { useState } from 'react';
import { APP_ASSETS } from '../data/mockData';
import { WalletProvider, WalletState } from '../types';
import {
  ChevronDown,
  Check,
  X,
  Fuel,
  Wallet,
  Settings,
} from 'lucide-react';
import {
  ConnectWalletModal,
  MetaMaskLogo,
  WalletConnectLogo,
  CoinbaseLogo,
} from './ConnectWalletModal';

interface HeaderProps {
  currentChain: string;
  onSelectChain: (chain: string) => void;
  gasSaverMode: boolean;
  onToggleGasSaverMode: () => void;
  onShowToast: (title: string, msg: string) => void;
  walletState: WalletState;
  onConnectWallet: (provider: WalletProvider, address: string) => void;
  onDisconnectWallet: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentChain,
  onSelectChain,
  gasSaverMode,
  onToggleGasSaverMode,
  onShowToast,
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  onOpenSettings,
}) => {
  const [showChainsModal, setShowChainsModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const chainsList = [
    { id: 'all', name: 'Todas las Cadenas', icon: 'hub', color: '#4cd7f6' },
    { id: 'eth', name: 'Ethereum Mainnet', icon: 'eth', color: '#627eea' },
    { id: 'sol', name: 'Solana Network', icon: 'sol', color: '#14f195' },
    { id: 'arb', name: 'Arbitrum One', icon: 'arb', color: '#28a0f0' },
    { id: 'polygon', name: 'Polygon PoS', icon: 'pol', color: '#8247e5' },
    { id: 'base', name: 'Base Layer 2', icon: 'base', color: '#0052ff' },
    { id: 'bnb', name: 'BNB Smart Chain', icon: 'bnb', color: '#f0b90b' },
    { id: 'op', name: 'Optimism Mainnet', icon: 'op', color: '#ff0420' },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#10131a]/90 backdrop-blur-xl border-b border-[#272a32]/60 pt-safe transition-all">
        <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo & Brand Title */}
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer shrink-0"
            onClick={() => onShowToast('OmniVault Protocol', 'Bóveda multichain institucional activa')}
          >
            <img
              src={APP_ASSETS.logo}
              alt="OmniVault Logo"
              className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(76,215,246,0.4)]"
            />
            <span className="hidden sm:inline font-headline-sm text-base sm:text-lg font-bold text-[#e1e2ec] tracking-tight truncate">
              OmniVault
            </span>
          </div>

          {/* Center/Right Controls: Gas Saver Toggle, Chain Selector, Connect Wallet / Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Modo de Ahorro de Gas Global Switch */}
            <button
              onClick={onToggleGasSaverMode}
              className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 transition-all text-xs font-semibold ${
                gasSaverMode
                  ? 'bg-[#00a572]/20 border border-[#4edea3]/50 text-[#4edea3] shadow-sm shadow-[#4edea3]/20'
                  : 'bg-[#1d1f27]/90 hover:bg-[#272a32] border border-[#3d494c]/40 text-[#869397] hover:text-[#bcc9cd]'
              }`}
              title={
                gasSaverMode
                  ? 'Modo de ahorro de gas ACTIVADO (-55% tarifas)'
                  : 'Activar Modo de ahorro de gas'
              }
            >
              <Fuel
                className={`w-3.5 h-3.5 ${gasSaverMode ? 'text-[#4edea3]' : 'text-[#869397]'}`}
              />
              <span className="hidden xs:inline font-code-sm text-[11px] tracking-tight whitespace-nowrap">
                {gasSaverMode ? 'Eco Gas' : 'Gas'}
              </span>
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  gasSaverMode ? 'bg-[#4edea3] animate-pulse' : 'bg-[#3d494c]'
                }`}
              />
            </button>

            {/* Chain Selector Pill */}
            <button
              onClick={() => setShowChainsModal(true)}
              className="h-9 px-2 sm:px-2.5 bg-[#1d1f27]/90 hover:bg-[#272a32] border border-[#3d494c]/40 rounded-full flex items-center gap-1 text-[#e1e2ec] transition-colors cursor-pointer"
              title="Seleccionar Red"
            >
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
              <span className="text-[11px] uppercase tracking-wider text-[#bcc9cd] font-code-sm font-semibold max-w-[48px] truncate">
                {currentChain === 'all' ? 'All' : currentChain.toUpperCase()}
              </span>
              <ChevronDown className="w-3 h-3 text-[#869397]" />
            </button>

            {/* Wallet Action Button: 'Conectar Wallet' or Connected Wallet Pill */}
            {!walletState.isConnected ? (
              <button
                id="connect-wallet-header-btn"
                onClick={() => setShowConnectModal(true)}
                className="h-9 w-9 sm:w-auto justify-center px-0 sm:px-3 rounded-full bg-gradient-to-r from-[#4cd7f6] via-[#22d3ee] to-[#4edea3] hover:brightness-110 text-[#003640] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#4cd7f6]/25 transition-all cursor-pointer select-none shrink-0 active:scale-95"
                title="Conectar Wallet Web3 (MetaMask, WalletConnect, Coinbase)"
              >
                <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline font-bold tracking-tight">Conectar Wallet</span>
              </button>
            ) : (
              <button
                id="wallet-profile-header-btn"
                onClick={() => setShowConnectModal(true)}
                className="h-9 pl-2 pr-2.5 bg-[#1d1f27]/90 hover:bg-[#272a32] border border-[#3d494c]/50 hover:border-[#4cd7f6]/50 rounded-full flex items-center gap-1.5 text-[#e1e2ec] transition-all shrink-0 cursor-pointer"
                title={`Conectado: ${walletState.provider} (${walletState.address}) - Clic para opciones o cambiar`}
              >
                {walletState.provider === 'metamask' && <MetaMaskLogo className="w-5 h-5" />}
                {walletState.provider === 'walletconnect' && (
                  <WalletConnectLogo className="w-5 h-5" />
                )}
                {walletState.provider === 'coinbase' && <CoinbaseLogo className="w-5 h-5" />}
                {!walletState.provider && (
                  <img
                    src={APP_ASSETS.avatar}
                    alt="Profile Avatar"
                    className="w-5 h-5 rounded-full object-cover border border-[#4cd7f6]/40"
                  />
                )}
                <span className="hidden sm:inline font-code-sm text-[11px] text-[#4cd7f6] font-semibold tracking-tight">
                  {shortenAddress(walletState.address)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              </button>
            )}

            {/* Quick Settings Button */}
            {onOpenSettings && (
              <button
                id="header-settings-btn"
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-full bg-[#1d1f27]/90 hover:bg-[#272a32] border border-[#3d494c]/40 flex items-center justify-center text-[#869397] hover:text-[#4cd7f6] transition-colors cursor-pointer shrink-0"
                title="Configuración de Notificaciones & Alertas"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chain Selector Modal */}
      {showChainsModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0e15]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/50 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] animate-pulse" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                  Redes Conectadas
                </h3>
              </div>
              <button
                onClick={() => setShowChainsModal(false)}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {chainsList.map((ch) => {
                const isSelected = currentChain === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onSelectChain(ch.id);
                      setShowChainsModal(false);
                      onShowToast(`Red cambiada`, `Filtro activo: ${ch.name}`);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#06b6d4]/15 border border-[#4cd7f6]/40 text-[#4cd7f6]'
                        : 'bg-[#191b23] hover:bg-[#272a32] text-[#e1e2ec] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg bg-[#272a32] flex items-center justify-center text-xs font-bold font-code-sm"
                        style={{ color: ch.color }}
                      >
                        {ch.id.slice(0, 3).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-left">{ch.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#4cd7f6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet Modal with MetaMask, WalletConnect, Coinbase Wallet */}
      <ConnectWalletModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        walletState={walletState}
        onConnect={onConnectWallet}
        onDisconnect={onDisconnectWallet}
        onShowToast={onShowToast}
      />
    </>
  );
};
