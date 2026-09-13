import React, { useState, useEffect } from 'react';
import { TokenItem, RecoverableContract } from '../types';
import { TokenLogo } from './TokenLogo';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  RefreshCw,
  Fuel,
  ArrowLeftRight,
  GitFork,
  ArrowUpRight,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ToastData {
  title: string;
  message: string;
}

interface ActionModalsProps {
  toast: ToastData | null;
  onCloseToast: () => void;
  // Send / Receive / Swap / Bridge
  activeActionModal: 'send' | 'receive' | 'swap' | 'bridge' | null;
  selectedToken?: TokenItem;
  tokens: TokenItem[];
  onCloseActionModal: () => void;
  onShowToast: (title: string, msg: string) => void;
  // Gas saver global mode
  gasSaverMode?: boolean;
  onToggleGasSaverMode?: () => void;
  // Rescue execution
  rescueModalData: {
    isOpen: boolean;
    contracts: RecoverableContract[];
    totalAmount: number;
  } | null;
  onCloseRescueModal: () => void;
  onConfirmRescueCompleted: (rescuedIds: string[]) => void;
  // Pending gas ops modal
  showPendingGasModal: boolean;
  onClosePendingGasModal: () => void;
  // Token balance updates
  onExecuteSwapSuccess?: (fromSymbol: string, fromAmount: number, toSymbol: string, toAmount: number) => void;
  onExecuteSendSuccess?: (tokenSymbol: string, amount: number) => void;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  toast,
  onCloseToast,
  activeActionModal,
  selectedToken,
  tokens,
  onCloseActionModal,
  onShowToast,
  gasSaverMode = false,
  onToggleGasSaverMode,
  rescueModalData,
  onCloseRescueModal,
  onConfirmRescueCompleted,
  showPendingGasModal,
  onClosePendingGasModal,
  onExecuteSwapSuccess,
  onExecuteSendSuccess,
}) => {
  // Gas Priority Configuration State
  const [gasPriority, setGasPriority] = useState<'eco' | 'standard' | 'fast'>(
    gasSaverMode ? 'eco' : 'standard'
  );

  // Sync with global gas saver mode
  useEffect(() => {
    if (gasSaverMode) {
      setGasPriority('eco');
    }
  }, [gasSaverMode]);

  // Send state
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Swap state
  const [fromAmount, setFromAmount] = useState('1.5');
  const [isSwapping, setIsSwapping] = useState(false);

  // Rescue simulation state
  const [rescueStep, setRescueStep] = useState<number>(1);
  const [isRescuing, setIsRescuing] = useState<boolean>(false);

  // Gas priority helper
  const getGasConfig = (priority: 'eco' | 'standard' | 'fast') => {
    switch (priority) {
      case 'eco':
        return { gwei: '7 Gwei', costUsd: '$0.42', label: 'Eco Ahorro', speed: 'Off-peak (~3 min)' };
      case 'fast':
        return { gwei: '24 Gwei', costUsd: '$2.15', label: 'Rápido', speed: '1-2 seg (MEV Protected)' };
      case 'standard':
      default:
        return { gwei: '14 Gwei', costUsd: '$1.18', label: 'Estándar', speed: '15-30 seg' };
    }
  };

  const currentGas = getGasConfig(gasPriority);

  const GasPriorityControl = () => (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#191b23] border border-[#272a32]">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#e1e2ec]">
          <Fuel className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span>Configuración de Prioridad de Gas</span>
        </div>
        {gasSaverMode && (
          <span className="px-2 py-0.5 rounded-full bg-[#00a572]/20 text-[#4edea3] text-[10px] font-extrabold font-code-sm">
            MODO AHORRO ACTIVO (-55%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {(['eco', 'standard', 'fast'] as const).map((p) => {
          const isSelected = gasPriority === p;
          const conf = getGasConfig(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setGasPriority(p)}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[56px] ${
                isSelected
                  ? p === 'eco'
                    ? 'bg-[#00a572]/20 border-[#4edea3] text-[#e1e2ec] shadow-sm'
                    : 'bg-[#4cd7f6]/20 border-[#4cd7f6] text-[#e1e2ec]'
                  : 'bg-[#10131a] border-[#272a32] text-[#869397] hover:border-[#3d494c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-tight">{conf.label}</span>
                {isSelected && <Check className="w-3 h-3 text-[#4edea3]" />}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[10px] font-code-sm text-[#4edea3] font-semibold">{conf.costUsd}</span>
                <span className="text-[9px] font-code-sm text-[#bcc9cd]">{conf.gwei}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-[#bcc9cd] flex items-center justify-between pt-1 border-t border-[#272a32]/60">
        <span>Tiempo estimado: {currentGas.speed}</span>
        {onToggleGasSaverMode && (
          <button
            type="button"
            onClick={onToggleGasSaverMode}
            className="text-[#4cd7f6] hover:underline font-medium"
          >
            {gasSaverMode ? 'Cambiar a modo Estándar' : 'Activar Ahorro Global'}
          </button>
        )}
      </div>
    </div>
  );
  const [copied, setCopied] = useState(false);
  const walletAddress = "0x7F29b8A649c096EdfC7802Db349F899e072fa9B2";

  const handleCopy = () => {
    navigator.clipboard?.writeText(walletAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !sendAmount) return;
    setIsSending(true);
    const amountVal = parseFloat(sendAmount) || 0;
    const tokenSym = selectedToken?.symbol || 'ETH';
    setTimeout(() => {
      setIsSending(false);
      if (onExecuteSendSuccess) {
        onExecuteSendSuccess(tokenSym, amountVal);
      }
      onShowToast(
        'Transacción Transmitida',
        `Enviados ${sendAmount} ${tokenSym} a ${recipient.slice(0, 8)}...`
      );
      setRecipient('');
      setSendAmount('');
      onCloseActionModal();
    }, 1000);
  };

  const handleExecuteSwap = () => {
    setIsSwapping(true);
    const amountVal = parseFloat(fromAmount) || 1;
    const receivedVal = parseFloat((amountVal * 3342.11).toFixed(2));
    setTimeout(() => {
      setIsSwapping(false);
      if (onExecuteSwapSuccess) {
        onExecuteSwapSuccess('ETH', amountVal, 'USDC', receivedVal);
      }
      onShowToast(
        'Swap Completado',
        `Canjeados ${amountVal} ETH por ${receivedVal.toLocaleString()} USDC sin deslizamiento`
      );
      onCloseActionModal();
    }, 1200);
  };

  const handleStartRescueFlow = () => {
    setIsRescuing(true);
    setRescueStep(1);

    setTimeout(() => {
      setRescueStep(2);
      setTimeout(() => {
        setRescueStep(3);
        setTimeout(() => {
          setRescueStep(4);
          setIsRescuing(false);
          if (rescueModalData) {
            onConfirmRescueCompleted(rescueModalData.contracts.map((c) => c.id));
          }
          onShowToast(
            '¡Extracción Exitosa!',
            `$${rescueModalData?.totalAmount.toFixed(2)} USD transferidos a tu balance`
          );
        }, 1200);
      }, 1200);
    }, 1000);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50 bg-[#1d1f27]/95 border border-[#4cd7f6]/40 text-[#e1e2ec] p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center shrink-0 border border-[#4edea3]/30">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-[#e1e2ec]">{toast.title}</p>
            <p className="text-[11px] text-[#bcc9cd] truncate mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={onCloseToast}
            className="w-6 h-6 rounded-full hover:bg-[#272a32] flex items-center justify-center text-[#869397]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SEND MODAL */}
      {activeActionModal === 'send' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleExecuteSend}
            className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#4cd7f6]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Enviar Activos</h3>
              </div>
              <button
                type="button"
                onClick={onCloseActionModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Destinatario (Dirección o ENS)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x... o vitalik.eth"
                className="bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2.5 text-sm text-[#e1e2ec] focus:outline-none focus:border-[#4cd7f6]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Monto
              </label>
              <div className="flex items-center justify-between bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2">
                <input
                  type="number"
                  step="any"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-[#e1e2ec] font-code-lg text-lg focus:outline-none w-full font-bold"
                  required
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#272a32] shrink-0">
                  <TokenLogo symbol={selectedToken?.symbol || 'ETH'} size="sm" />
                  <span className="font-code-md text-xs text-[#e1e2ec] font-bold">
                    {selectedToken?.symbol || 'ETH'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gas Priority Control */}
            <GasPriorityControl />

            <button
              type="submit"
              disabled={isSending}
              className="w-full h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              <span>{isSending ? 'Transmitiendo a la Mempool...' : `Confirmar Envío (${currentGas.costUsd} Gas)`}</span>
            </button>
          </form>
        </div>
      )}

      {/* RECEIVE MODAL */}
      {activeActionModal === 'receive' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl items-center text-center">
            <div className="w-full flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#4edea3]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Recibir Cripto</h3>
              </div>
              <button
                onClick={onCloseActionModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Mock code box */}
            <div className="p-4 bg-white rounded-2xl shadow-xl mt-2">
              <div className="w-48 h-48 bg-[#10131a] rounded-xl flex flex-col items-center justify-center p-2 relative">
                <div className="w-full h-full border-4 border-dashed border-[#4cd7f6]/60 rounded-lg flex items-center justify-center flex-col gap-2">
                  <QrCode className="w-20 h-20 text-[#4cd7f6]" />
                  <span className="text-[10px] font-code-sm text-white font-bold tracking-widest">
                    OMNIVAULT SAFE
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#191b23] p-3 rounded-xl border border-[#272a32] mt-1">
              <span className="text-[11px] text-[#bcc9cd] block uppercase font-code-sm">Dirección Multichain</span>
              <p className="font-code-sm text-xs text-[#4edea3] truncate font-bold mt-1">{walletAddress}</p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full h-11 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] font-code-sm text-xs font-semibold flex items-center justify-center gap-2 border border-[#3d494c]/40"
            >
              {copied ? <Check className="w-4 h-4 text-[#4edea3]" /> : <Copy className="w-4 h-4 text-[#4cd7f6]" />}
              <span>{copied ? '¡Dirección Copiada!' : 'Copiar Dirección'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SWAP MODAL */}
      {activeActionModal === 'swap' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#d0bcff]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Swap Agregado</h3>
              </div>
              <button
                onClick={onCloseActionModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pay section */}
            <div className="bg-[#191b23] p-3.5 rounded-2xl border border-[#272a32]">
              <div className="flex justify-between text-xs text-[#bcc9cd]">
                <span>Tú Pagas</span>
                <span>Saldo: 14.82 ETH</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="bg-transparent font-code-lg text-2xl text-[#e1e2ec] font-bold focus:outline-none w-36"
                />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272a32] text-xs font-bold text-[#e1e2ec]">
                  <TokenLogo symbol="ETH" size="sm" />
                  <span>ETH</span>
                </div>
              </div>
            </div>

            {/* Center icon */}
            <div className="flex justify-center -my-2 z-10">
              <div className="w-8 h-8 rounded-full bg-[#272a32] border border-[#3d494c] flex items-center justify-center text-[#d0bcff]">
                <ArrowLeftRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Receive section */}
            <div className="bg-[#191b23] p-3.5 rounded-2xl border border-[#272a32]">
              <div className="flex justify-between text-xs text-[#bcc9cd]">
                <span>Tú Recibes (Aprox.)</span>
                <span className="text-[#4edea3]">Mejor Ruta: Uniswap v3</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-code-lg text-2xl text-[#4edea3] font-bold">
                  {(parseFloat(fromAmount || '0') * 3342.11).toFixed(2)}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272a32] text-xs font-bold text-[#e1e2ec]">
                  <TokenLogo symbol="USDC" size="sm" />
                  <span>USDC</span>
                </div>
              </div>
            </div>

            {/* Gas Priority Control in Swap */}
            <GasPriorityControl />

            <div className="p-2.5 bg-[#0b0e15]/70 rounded-xl border border-[#272a32] flex items-center justify-between text-xs text-[#bcc9cd]">
              <span>Slippage Garantizado:</span>
              <span className="font-code-sm text-[#4edea3] font-bold">0.05% (Protegido MEV)</span>
            </div>

            <button
              onClick={handleExecuteSwap}
              disabled={isSwapping}
              className="w-full h-12 rounded-xl bg-[#d0bcff] hover:bg-[#b395ff] text-[#3c0091] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {isSwapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{isSwapping ? 'Optimizando Ruta y Canjeando...' : `Ejecutar Swap Flash (${currentGas.costUsd} Gas)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* BRIDGE MODAL */}
      {activeActionModal === 'bridge' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-[#acedff] rotate-90" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Puente Multichain</h3>
              </div>
              <button
                onClick={onCloseActionModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#191b23] border border-[#272a32] rounded-xl">
                <span className="text-[10px] text-[#bcc9cd] uppercase font-code-sm">Origen</span>
                <p className="font-semibold text-sm text-[#4cd7f6] mt-1">Ethereum Mainnet</p>
              </div>
              <div className="p-3 bg-[#191b23] border border-[#272a32] rounded-xl">
                <span className="text-[10px] text-[#bcc9cd] uppercase font-code-sm">Destino</span>
                <p className="font-semibold text-sm text-[#4edea3] mt-1">Solana Network</p>
              </div>
            </div>

            <div className="p-3 bg-[#191b23] border border-[#272a32] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#bcc9cd]">Protocolo de Puente:</span>
              <span className="font-semibold text-[#e1e2ec]">Wormhole Core Relayer</span>
            </div>

            <button
              onClick={() => {
                onShowToast('Puente Iniciado', 'Ruta Wormhole verificada sin bloqueo de liquidez');
                onCloseActionModal();
              }}
              className="w-full h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <GitFork className="w-4 h-4 rotate-90" />
              <span>Conectar Puente Relayer</span>
            </button>
          </div>
        </div>
      )}

      {/* FLASHBOTS RESCUE EXECUTION MODAL */}
      {rescueModalData && rescueModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/90 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#4edea3]/50 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#4edea3]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                  Batch Flash Rescue en Proceso
                </h3>
              </div>
              <button
                onClick={onCloseRescueModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total to be rescued summary */}
            <div className="bg-[#191b23] p-4 rounded-xl border border-[#272a32] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#bcc9cd]">Fondos en extracción:</span>
                <h4 className="text-2xl font-bold font-code-lg text-[#4edea3]">
                  ${rescueModalData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-code-sm text-xs font-bold">
                {rescueModalData.contracts.length} Protocolos
              </span>
            </div>

            {/* Steps list */}
            <div className="flex flex-col gap-2.5">
              {[
                { step: 1, text: 'Construyendo Bundle Flashbots MEV privado' },
                { step: 2, text: 'Simulación de 0 reverts en nodo RPC privado' },
                { step: 3, text: 'Extracción atómica multicontrato a tu bóveda' },
                { step: 4, text: '¡Transacción confirmada y fondos asegurados!' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl flex items-center gap-3 text-xs font-medium border transition-all ${
                    rescueStep > s.step
                      ? 'bg-[#00a572]/15 border-[#4edea3]/30 text-[#4edea3]'
                      : rescueStep === s.step
                      ? 'bg-[#4cd7f6]/15 border-[#4cd7f6]/40 text-[#4cd7f6]'
                      : 'bg-[#191b23] border-[#272a32] text-[#869397]'
                  }`}
                >
                  {rescueStep > s.step ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : rescueStep === s.step && isRescuing ? (
                    <RefreshCw className="w-4 h-4 text-[#4cd7f6] animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                      {s.step}
                    </span>
                  )}
                  <span>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Gas Priority Control in Rescue */}
            {rescueStep < 4 && <GasPriorityControl />}

            {rescueStep === 4 ? (
              <button
                onClick={onCloseRescueModal}
                className="w-full h-12 rounded-xl bg-[#4edea3] text-[#003824] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Cerrar y Ver Balance Actualizado</span>
              </button>
            ) : (
              <button
                onClick={handleStartRescueFlow}
                disabled={isRescuing}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                {isRescuing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{isRescuing ? 'Ejecutando Extracción Atómica...' : `Comenzar Rescate Inmediato (${currentGas.costUsd} Gas)`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PENDING GAS OPS MODAL */}
      {showPendingGasModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-[#4cd7f6]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                  Operaciones Encoladas (12 Gwei)
                </h3>
              </div>
              <button
                onClick={onClosePendingGasModal}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="p-3 bg-[#191b23] border border-[#272a32] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#e1e2ec]">Consolidación Dust L1</h4>
                  <p className="text-[11px] text-[#bcc9cd]">3 sub-cuentas a bóveda central</p>
                </div>
                <span className="font-code-sm text-xs text-[#4edea3] font-bold">~$2.10 (Ahorro 75%)</span>
              </div>

              <div className="p-3 bg-[#191b23] border border-[#272a32] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#e1e2ec]">Migración Contrato Proxy v2</h4>
                  <p className="text-[11px] text-[#bcc9cd]">Actualización de almacenamiento</p>
                </div>
                <span className="font-code-sm text-xs text-[#4edea3] font-bold">~$3.40 (Ahorro 80%)</span>
              </div>
            </div>

            <button
              onClick={() => {
                onShowToast('Transacciones Ejecutadas', '2 transacciones enviadas aprovechando el gas de 12 Gwei');
                onClosePendingGasModal();
              }}
              className="w-full h-12 rounded-xl bg-[#4cd7f6] text-[#003640] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span>Ejecutar Ambas con Gas Mínimo</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
