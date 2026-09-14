import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WalletProvider, WalletState } from '../types';
import { CHAIN_INFO, getChainId, getInjectedProvider, requestRealAccount } from '../utils/web3';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Radio,
  Unplug,
  Loader2,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

// MetaMask Fox Vector
export const MetaMaskLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 318.6 318.6" className={className}>
    <polygon fill="#E2761B" points="274.1,35.5 174.6,109.4 193,65.8" />
    <polygon fill="#E4761B" points="44.4,35.5 143.1,110.1 125.6,65.8" />
    <polygon fill="#E4761B" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" />
    <polygon fill="#E4761B" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" />
    <polygon fill="#E4761B" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1" />
    <polygon fill="#E4761B" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1" />
    <polygon fill="#E4761B" points="106.8,247.4 140.6,230.9 111.4,208.1" />
    <polygon fill="#E4761B" points="177.9,230.9 211.8,247.4 207.1,208.1" />
    <polygon fill="#D7C1B3" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3" />
    <polygon fill="#D7C1B3" points="106.8,247.4 138.3,262.3 137.9,253 140.6,230.9" />
    <polygon fill="#233447" points="138.8,193.5 110.6,185.2 130.5,176.1" />
    <polygon fill="#233447" points="179.7,193.5 188,176.1 208,185.2" />
    <polygon fill="#CD6116" points="106.8,247.4 111.6,206.8 80.3,207.7" />
    <polygon fill="#CD6116" points="207,206.8 211.8,247.4 238.3,207.7" />
    <polygon fill="#CD6116" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2 238.3,206.8 284.8,207.7" />
    <polygon fill="#CD6116" points="33.9,207.7 80.3,206.8 110.6,185.2 130.5,176.1 138.8,193.5 144.1,164.6 87.8,162.1" />
    <polygon fill="#E4751F" points="87.8,162.1 33.9,207.7 75.3,164.6" />
    <polygon fill="#E4751F" points="243.3,164.6 284.8,207.7 230.8,162.1" />
    <polygon fill="#F6851B" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7" />
    <polygon fill="#F6851B" points="174.6,164.6 171.8,182.6 173.1,227.6 179.8,193.5" />
    <polygon fill="#C0AD9E" points="177.9,230.9 140.6,230.9 145.4,227.6 173.1,227.6" />
    <polygon fill="#161616" points="159.3,270.5 138.3,262.3 180.3,262.3" />
    <polygon fill="#763D16" points="174.6,109.4 143.1,110.1 158.8,80.7" />
  </svg>
);

// WalletConnect Official Bridge Icon
export const WalletConnectLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-xl bg-[#3b99fc] flex items-center justify-center p-1.5 shrink-0 shadow-sm ${className}`}>
    <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
      <path d="M5.44 8.04c3.62-3.55 9.5-3.55 13.12 0l.44.43a.47.47 0 0 1 0 .68l-1.49 1.46a.48.48 0 0 1-.68 0l-.6-.59c-2.38-2.33-6.23-2.33-8.6 0l-.64.63a.48.48 0 0 1-.68 0L4.82 9.18a.47.47 0 0 1 0-.68l.62-.46zm16.14 2.96l1.32 1.3a.47.47 0 0 1 0 .68l-5.96 5.84a.48.48 0 0 1-.68 0l-4.26-4.17-4.26 4.17a.48.48 0 0 1-.68 0L1.1 12.98a.47.47 0 0 1 0-.68l1.32-1.3a.48.48 0 0 1 .68 0l4.26 4.17 4.26-4.17a.48.48 0 0 1 .68 0l4.26 4.17 4.26-4.17a.48.48 0 0 1 .68 0z" />
    </svg>
  </div>
);

// Coinbase Wallet Official Circle Icon
export const CoinbaseLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-xl bg-[#0052ff] flex items-center justify-center p-1.5 shrink-0 shadow-sm ${className}`}>
    <svg viewBox="0 0 28 28" fill="white" className="w-full h-full">
      <path d="M14 0C6.268 0 0 6.268 0 14s6.268 14 14 14 14-6.268 14-14S21.732 0 14 0zm0 19.6a5.6 5.6 0 1 1 0-11.2 5.6 5.6 0 0 1 0 11.2z" />
      <rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2" fill="white" />
      <rect x="12.6" y="12.6" width="2.8" height="2.8" rx="0.6" fill="#0052ff" />
    </svg>
  </div>
);

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: WalletState;
  onConnect: (provider: WalletProvider, address: string) => void;
  onDisconnect: () => void;
  onShowToast: (title: string, msg: string) => void;
}

const WALLET_OPTIONS: {
  id: WalletProvider;
  name: string;
  tag: string;
  badge: string;
  badgeColor: string;
  description: string;
  /** Only used by WalletConnect's explicitly-simulated demo flow below. */
  address?: string;
  popular?: boolean;
}[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    tag: 'Extensión & Móvil',
    badge: 'Detectada',
    badgeColor: '#e2761b',
    description: 'Bóveda Web3 más utilizada. Conexión inyectada EIP-1193 directa.',
    popular: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    tag: 'Protocolo Universal v2',
    badge: 'Escanear QR',
    badgeColor: '#3b99fc',
    description: 'Vincular escaneando desde Rainbow, Trust, Zerion, Ledger o Safe.',
    address: '0x3A91b8C4096EdfC7802Db349F899e072fa9B2',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    tag: 'Smart Wallet Passkeys',
    badge: 'EIP-5792',
    badgeColor: '#0052ff',
    description: 'Autocustodia sin frases semilla. Acceso biométrico con Passkey.',
  },
];

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  walletState,
  onConnect,
  onDisconnect,
  onShowToast,
}) => {
  const [connectingProvider, setConnectingProvider] = useState<WalletProvider | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'qr' | 'details'>(
    walletState.isConnected ? 'details' : 'providers'
  );
  const [copied, setCopied] = useState(false);
  const [explorerBaseUrl, setExplorerBaseUrl] = useState('https://etherscan.io');

  // Point "Ver en Explorer" at the block explorer for whichever chain the
  // wallet is actually connected to, instead of always assuming Ethereum.
  useEffect(() => {
    if (!walletState.isConnected || walletState.provider === 'walletconnect') return;
    let cancelled = false;
    getChainId()
      .then((chainId) => {
        if (!cancelled) setExplorerBaseUrl(CHAIN_INFO[chainId]?.explorer || 'https://etherscan.io');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [walletState.isConnected, walletState.provider]);

  // Real, live detection of an injected browser wallet — drives the "Detectada"
  // badges below so they reflect what's actually installed, not a hardcoded claim.
  const injected = getInjectedProvider();
  const isRealBadge = (providerId: WalletProvider): string | null => {
    if (providerId === 'metamask') return injected?.isMetaMask ? 'Detectada' : 'No Instalada';
    if (providerId === 'coinbase') return injected?.isCoinbaseWallet ? 'Detectada' : 'No Instalada';
    return null;
  };

  // Trigger web audio pleasant chime
  const playConnectChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // AudioContext fallback
    }
  };

  const handleSelectWallet = async (option: (typeof WALLET_OPTIONS)[0]) => {
    if (connectingProvider) return;

    // WalletConnect has no browser extension to query directly here — this path
    // stays an explicit, labeled simulation ("Simular Escaneo") since real
    // WalletConnect support needs their SDK plus a project ID to be configured.
    if (option.id === 'walletconnect') {
      setConnectingProvider(option.id);
      setTimeout(() => {
        onConnect(option.id, option.address || '0x0000000000000000000000000000000000000000');
        setConnectingProvider(null);
        playConnectChime();
        onShowToast(
          'Sesión de Demostración',
          'WalletConnect necesita configuración adicional; esta es una vinculación simulada, no tu wallet real.'
        );
        setActiveTab('details');
        setTimeout(() => {
          onClose();
        }, 700);
      }, 850);
      return;
    }

    // MetaMask / Coinbase Wallet: connect for real through the browser's
    // injected EIP-1193 provider and use the account it actually returns.
    const injected = getInjectedProvider();
    if (!injected) {
      onShowToast(
        `${option.name} No Detectada`,
        'Instala la extensión en tu navegador y recarga la página para conectar tu wallet real.'
      );
      return;
    }

    setConnectingProvider(option.id);
    try {
      const address = await requestRealAccount();
      onConnect(option.id, address);
      playConnectChime();
      onShowToast(
        'Wallet Conectada',
        `Conectado a ${option.name} (${address.slice(0, 6)}...${address.slice(-4)}). Cargando tu saldo real...`
      );
      setActiveTab('details');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      onShowToast('Conexión Cancelada', 'Rechazaste la solicitud o no se pudo conectar con tu wallet.');
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleCopy = () => {
    if (!walletState.address) return;
    navigator.clipboard?.writeText(walletState.address).catch(() => {});
    setCopied(true);
    onShowToast('Dirección Copiada', `${walletState.address.slice(0, 8)}... guardada`);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProviderObj = WALLET_OPTIONS.find((w) => w.id === walletState.provider);

  if (!isOpen) return null;

  return (
    <div
      id="connect-wallet-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#0b0e15]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !connectingProvider) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="w-full max-w-md bg-[#161820] border border-[#3d494c]/60 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl overflow-hidden relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#4cd7f6] to-transparent opacity-60" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#272a32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                {walletState.isConnected && activeTab === 'details'
                  ? 'Bóveda Conectada'
                  : 'Conectar Wallet'}
              </h2>
              <p className="text-xs text-[#869397]">
                {walletState.isConnected && activeTab === 'details'
                  ? 'Sesión RPC segura multichain activa'
                  : 'Elige tu cliente para operar en OmniVault'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={!!connectingProvider}
            className="w-8 h-8 rounded-full bg-[#272a32] hover:bg-[#32353d] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Navigation Pills if connected */}
        {walletState.isConnected && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#10131a] rounded-xl border border-[#272a32]">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'details'
                  ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                  : 'text-[#869397] hover:text-[#bcc9cd]'
              }`}
            >
              Cuenta Activa
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'providers'
                  ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                  : 'text-[#869397] hover:text-[#bcc9cd]'
              }`}
            >
              Cambiar Wallet
            </button>
          </div>
        )}

        {/* View 1: Active Connected Account Details */}
        {walletState.isConnected && activeTab === 'details' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Active Provider Card */}
            <div className="p-4 rounded-2xl bg-[#1d1f27] border border-[#4edea3]/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {walletState.provider === 'metamask' && <MetaMaskLogo className="w-7 h-7" />}
                  {walletState.provider === 'walletconnect' && (
                    <WalletConnectLogo className="w-7 h-7" />
                  )}
                  {walletState.provider === 'coinbase' && <CoinbaseLogo className="w-7 h-7" />}
                  <div>
                    <span className="font-bold text-sm text-[#e1e2ec] block">
                      {currentProviderObj?.name || 'Wallet Web3'}
                    </span>
                    <span className="text-[11px] text-[#4edea3] font-code-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                      Conectado en Mainnet & L2
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-code-sm text-[10px] font-bold border border-[#4edea3]/30">
                  ACTIVO
                </span>
              </div>

              {/* Address Row */}
              <div className="p-2.5 rounded-xl bg-[#10131a] border border-[#272a32] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-code-sm tracking-wider text-[#869397] block">
                    Dirección Pública
                  </span>
                  <span className="font-code-sm text-xs text-[#4cd7f6] font-semibold truncate block">
                    {walletState.address}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] font-code-sm text-xs flex items-center gap-1 transition-colors shrink-0"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#4edea3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  )}
                  <span>{copied ? 'Listo' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`${explorerBaseUrl}/address/${walletState.address}`}
                target="_blank"
                rel="noreferrer"
                className="h-10 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#3d494c]/30"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#d0bcff]" />
                <span>Ver en Explorer</span>
              </a>

              <button
                onClick={() => setActiveTab('providers')}
                className="h-10 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#3d494c]/30"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Cambiar Proveedor</span>
              </button>
            </div>

            {/* Security Badge */}
            <div className="p-3 bg-[#10131a] rounded-xl border border-[#272a32] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#4edea3]" />
                <div>
                  <span className="font-medium text-[#e1e2ec] block">Protección Flashbots RPC</span>
                  <span className="text-[11px] text-[#869397]">Anti-Frontrunning & Sandwich mev</span>
                </div>
              </div>
              <span className="text-[10px] font-code-sm font-bold text-[#4edea3] bg-[#00a572]/20 px-2 py-0.5 rounded">
                EIP-712
              </span>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={() => {
                onDisconnect();
                onShowToast('Wallet Desconectada', 'Sesión terminada. Datos de bóveda preservados.');
                setActiveTab('providers');
              }}
              className="w-full h-10 rounded-xl bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Unplug className="w-3.5 h-3.5" />
              <span>Desconectar Bóveda</span>
            </button>
          </div>
        )}

        {/* View 2: Wallet Provider Selector (MetaMask, WalletConnect, Coinbase) */}
        {(!walletState.isConnected || activeTab === 'providers') && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="text-xs text-[#bcc9cd] flex items-center justify-between px-1">
              <span>Proveedores Web3</span>
              {injected ? (
                <span className="text-[11px] text-[#4edea3] font-code-sm">● Extensión Detectada</span>
              ) : (
                <span className="text-[11px] text-[#869397] font-code-sm">● Sin Extensión Web3</span>
              )}
            </div>

            {WALLET_OPTIONS.map((option) => {
              const isSelected = walletState.isConnected && walletState.provider === option.id;
              const isConnectingThis = connectingProvider === option.id;
              const liveBadge = isRealBadge(option.id);
              const badgeLabel = liveBadge ?? option.badge;
              const badgeColor = liveBadge === 'No Instalada' ? '#869397' : option.badgeColor;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectWallet(option)}
                  disabled={!!connectingProvider}
                  className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer disabled:cursor-wait ${
                    isSelected
                      ? 'bg-[#06b6d4]/10 border-[#4cd7f6]/60 shadow-md shadow-[#4cd7f6]/10'
                      : isConnectingThis
                      ? 'bg-[#272a32] border-[#4cd7f6] scale-[0.99]'
                      : 'bg-[#1d1f27] hover:bg-[#272a32] border-[#3d494c]/40 hover:border-[#4cd7f6]/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0 relative">
                      {option.id === 'metamask' && <MetaMaskLogo className="w-8 h-8" />}
                      {option.id === 'walletconnect' && (
                        <WalletConnectLogo className="w-8 h-8" />
                      )}
                      {option.id === 'coinbase' && <CoinbaseLogo className="w-8 h-8" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#e1e2ec] group-hover:text-[#4cd7f6] transition-colors">
                          {option.name}
                        </span>
                        {option.popular && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-code-sm font-bold bg-[#e2761b]/20 text-[#e2761b]">
                            Popular
                          </span>
                        )}
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-code-sm font-semibold border"
                          style={{
                            borderColor: `${badgeColor}40`,
                            color: badgeColor,
                            backgroundColor: `${badgeColor}15`,
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#869397] mt-0.5 line-clamp-1">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isConnectingThis ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#4cd7f6] font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-[#4cd7f6]" />
                        <span className="hidden xs:inline">Conectando...</span>
                      </div>
                    ) : isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-[#4edea3]/20 border border-[#4edea3]/50 flex items-center justify-center text-[#4edea3]">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#10131a] group-hover:bg-[#4cd7f6] group-hover:text-[#003640] border border-[#272a32] flex items-center justify-center text-[#869397] transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* WalletConnect QR Code Simulator shortcut */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('qr')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#10131a] hover:bg-[#191b23] border border-[#272a32] text-xs text-[#bcc9cd] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#3b99fc]" />
                <span>¿Prefieres escanear con WalletConnect QR?</span>
              </button>
            </div>
          </div>
        )}

        {/* View 3: QR Code Scanner Simulator */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center p-4 bg-[#10131a] rounded-2xl border border-[#272a32] space-y-3 animate-in fade-in duration-200 text-center">
            <div className="relative p-4 bg-white rounded-2xl shadow-xl">
              {/* Stylized QR Code SVG */}
              <svg className="w-40 h-40" viewBox="0 0 100 100" fill="#000">
                {/* QR Finder Corners */}
                <rect x="5" y="5" width="25" height="25" rx="3" fill="#000" />
                <rect x="9" y="9" width="17" height="17" rx="1" fill="#fff" />
                <rect x="13" y="13" width="9" height="9" rx="1" fill="#000" />

                <rect x="70" y="5" width="25" height="25" rx="3" fill="#000" />
                <rect x="74" y="9" width="17" height="17" rx="1" fill="#fff" />
                <rect x="78" y="13" width="9" height="9" rx="1" fill="#000" />

                <rect x="5" y="70" width="25" height="25" rx="3" fill="#000" />
                <rect x="9" y="74" width="17" height="17" rx="1" fill="#fff" />
                <rect x="13" y="78" width="9" height="9" rx="1" fill="#000" />

                {/* Random QR data points */}
                <rect x="35" y="10" width="5" height="5" />
                <rect x="45" y="15" width="5" height="10" />
                <rect x="55" y="8" width="8" height="5" />
                <rect x="35" y="25" width="10" height="5" />
                <rect x="10" y="35" width="5" height="10" />
                <rect x="20" y="40" width="10" height="5" />
                <rect x="35" y="38" width="30" height="6" />
                <rect x="72" y="35" width="8" height="8" />
                <rect x="85" y="45" width="5" height="15" />
                <rect x="35" y="50" width="8" height="12" />
                <rect x="48" y="52" width="12" height="6" />
                <rect x="65" y="50" width="5" height="12" />
                <rect x="40" y="72" width="15" height="5" />
                <rect x="60" y="70" width="10" height="10" />
                <rect x="75" y="75" width="15" height="5" />
                <rect x="42" y="85" width="20" height="5" />
                <rect x="70" y="88" width="8" height="6" />
              </svg>

              {/* Centered WalletConnect Badge in QR */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="p-1.5 rounded-xl bg-white shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-[#3b99fc] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path d="M5.44 8.04c3.62-3.55 9.5-3.55 13.12 0l.44.43a.47.47 0 0 1 0 .68l-1.49 1.46a.48.48 0 0 1-.68 0l-.6-.59c-2.38-2.33-6.23-2.33-8.6 0l-.64.63a.48.48 0 0 1-.68 0L4.82 9.18a.47.47 0 0 1 0-.68l.62-.46zm16.14 2.96l1.32 1.3a.47.47 0 0 1 0 .68l-5.96 5.84a.48.48 0 0 1-.68 0l-4.26-4.17-4.26 4.17a.48.48 0 0 1-.68 0L1.1 12.98a.47.47 0 0 1 0-.68l1.32-1.3a.48.48 0 0 1 .68 0l4.26 4.17 4.26-4.17a.48.48 0 0 1 .68 0l4.26 4.17 4.26-4.17a.48.48 0 0 1 .68 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#e1e2ec]">
                Escanea este código con cualquier wallet compatible
              </p>
              <p className="text-[11px] text-[#869397] mt-0.5">
                Rainbow • Trust Wallet • MetaMask Mobile • Zerion • Safe
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button
                onClick={() => handleSelectWallet(WALLET_OPTIONS[1])}
                disabled={!!connectingProvider}
                className="h-10 rounded-xl bg-gradient-to-r from-[#3b99fc] to-[#0052ff] hover:brightness-110 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#3b99fc]/20"
              >
                {connectingProvider ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Simular Escaneo</span>
              </button>

              <button
                onClick={() => setActiveTab('providers')}
                className="h-10 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] text-xs font-semibold transition-colors"
              >
                Volver a la lista
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#272a32] flex items-center justify-between text-[11px] text-[#869397]">
          <span>OmniVault Smart Account • EIP-4337</span>
          <span className="text-[#4cd7f6] font-code-sm">v2.4.0</span>
        </div>
      </motion.div>
    </div>
  );
};
