import React, { useState } from 'react';
import { RecoverableContract } from '../types';
import {
  Radar,
  ShieldCheck,
  Zap,
  Fuel,
  Lock,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Code,
  CheckCircle2,
  RefreshCw,
  Layers,
} from 'lucide-react';

interface RescueScreenProps {
  contracts: RecoverableContract[];
  onToggleContract: (id: string) => void;
  onToggleAll: () => void;
  onExecuteRescue: (selectedContracts: RecoverableContract[], totalAmount: number) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const RescueScreen: React.FC<RescueScreenProps> = ({
  contracts,
  onToggleContract,
  onToggleAll,
  onExecuteRescue,
  onShowToast,
}) => {
  const [modalContract, setModalContract] = useState<RecoverableContract | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Calculate selected total
  const selectedContracts = contracts.filter((c) => c.selected && !c.rescued);
  const totalRecoverable = selectedContracts.reduce((acc, c) => acc + c.amountUsd, 0);
  const allSelected = contracts.length > 0 && contracts.every((c) => c.selected || c.rescued);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash).catch(() => {});
    setCopiedHash(true);
    onShowToast("Hash copiado", hash);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 space-y-4 pb-14 animate-in fade-in duration-200">
      {/* Scanner Diagnostic Telemetry */}
      <section className="w-full bg-[#191b23] border border-[#272a32] rounded-2xl p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
            </span>
            <span className="text-[11px] font-code-sm uppercase tracking-wider text-[#4edea3] font-bold">
              Telemetría Activa
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1d1f27] px-2.5 py-0.5 rounded-full border border-[#3d494c]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
            <span className="font-code-sm text-xs text-[#bcc9cd]">Sincronizado</span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#272a32] border border-[#3d494c]/40 flex items-center justify-center text-[#4cd7f6] shrink-0">
            <Radar className="w-5 h-5 text-[#4cd7f6] animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold leading-tight">
              Smart Contract Fund Rescuer
            </h2>
            <p className="text-xs text-[#bcc9cd] mt-0.5 leading-relaxed">
              Escaneo profundo completado en <span className="text-[#4cd7f6] font-semibold">14 redes</span> y{' '}
              <span className="text-[#4cd7f6] font-semibold">1,840 protocolos</span> históricos.
            </p>
          </div>
        </div>
      </section>

      {/* Hero Highlight: Recoverable Treasury */}
      <section className="w-full relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-[#1d1f27] via-[#272a32] to-[#191b23] border border-[#3d494c]/50 shadow-xl">
        {/* Ambient Holographic Bloom Elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#4edea3]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#4cd7f6]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5">
          {/* Title & Metric Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#bcc9cd] uppercase tracking-widest font-bold flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 text-[#4edea3]" />
              Tesorería Recuperable
            </span>
            <span className="bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3] px-2.5 py-1 rounded-full font-code-sm text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
              {selectedContracts.length} Protocolos
            </span>
          </div>

          {/* Main Balance Display */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-lg-mobile text-3xl sm:text-4xl text-[#e1e2ec] font-bold font-code-lg">
                ${totalRecoverable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-code-md text-sm text-[#4cd7f6] font-bold">USD</span>
            </div>
            <p className="text-xs text-[#bcc9cd] mt-1 flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
              <span>Total líquido disponible para extracción inmediata</span>
            </p>
          </div>

          {/* Gas Telemetry Pipeline Card */}
          <div className="bg-[#0b0e15]/80 backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-2 border border-[#272a32]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#272a32] flex items-center justify-center text-[#4cd7f6] shrink-0">
                <Fuel className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-[#bcc9cd]">Batch Flash Rescue</div>
                <div className="font-code-sm text-xs text-[#e1e2ec] font-semibold flex items-center gap-1.5">
                  <span>~$14.20 gas</span>
                  <span className="text-[#4edea3]">(68% ahorro)</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-code-sm bg-[#4cd7f6]/10 text-[#4cd7f6] px-2 py-1 rounded-md border border-[#4cd7f6]/20 font-semibold whitespace-nowrap">
              Ruta Agregador
            </span>
          </div>

          {/* Master Giant Action Button */}
          <button
            onClick={() => onExecuteRescue(selectedContracts, totalRecoverable)}
            disabled={selectedContracts.length === 0}
            className={`w-full relative group overflow-hidden bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-headline-sm text-base py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
              selectedContracts.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_24px_rgba(78,222,163,0.35)]'
            }`}
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-5 h-5 fill-current" />
            <span className="truncate font-bold tracking-tight">RESCATAR TODO EN 1 CLIC</span>
            <span className="font-code-sm text-xs bg-[#10131a]/30 text-[#003824] px-2 py-0.5 rounded font-bold ml-1">
              ${totalRecoverable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </button>

          {/* MEV Protection & Security Assurance */}
          <div className="flex items-center justify-between text-[#bcc9cd] text-[11px] px-1 font-sans">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#4edea3]" />
              Protegido MEV Flashbots
            </span>
            <span className="flex items-center gap-1 font-code-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
              Slippage máx. 0.05%
            </span>
          </div>
        </div>
      </section>

      {/* Contract Breakdown Section Header */}
      <section className="flex items-center justify-between pt-1">
        <div>
          <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Activos Detectados</h3>
          <p className="text-xs text-[#bcc9cd]">Selecciona los fondos a consolidar en tu bóveda</p>
        </div>
        <button
          onClick={onToggleAll}
          className="h-8 px-3 rounded-full bg-[#272a32] text-[#4cd7f6] hover:bg-[#32353d] font-code-sm text-xs font-semibold transition-colors border border-[#3d494c]/40"
        >
          {allSelected ? 'Deseleccionar' : 'Seleccionar Todo'}
        </button>
      </section>

      {/* Detailed Contract Cards List */}
      {contracts.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-[#1d1f27] border border-[#272a32]">
          <ShieldCheck className="w-10 h-10 text-[#4edea3] mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-[#e1e2ec]">Sin fondos rescatables detectados</p>
          <p className="text-xs text-[#bcc9cd] mt-1">
            No se encontraron contratos abandonados u olvidados asociados a esta wallet.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {contracts.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl p-4 transition-all border flex flex-col gap-3 ${
              item.rescued
                ? 'bg-[#10131a] border-[#272a32] opacity-60'
                : 'bg-[#191b23] hover:bg-[#1d1f27] border-[#3d494c]/40 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-[#272a32] border border-[#3d494c]/50 flex items-center justify-center text-[#e1e2ec]">
                    <Layers className="w-5 h-5 text-[#4cd7f6]" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#10131a] border border-[#3d494c]/50 text-[9px] font-code-sm rounded text-[#bcc9cd] font-bold">
                    {item.chainBadge}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-semibold text-sm text-[#e1e2ec] truncate">{item.title}</h4>
                    <span
                      className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${
                        item.categoryType === 'alert'
                          ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                          : item.categoryType === 'success'
                          ? 'bg-[#00a572]/20 text-[#4edea3]'
                          : 'bg-[#32353d] text-[#bcc9cd]'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#bcc9cd] mt-0.5">{item.description}</p>
                </div>
              </div>

              {/* Custom Switch Checkbox */}
              {item.rescued ? (
                <span className="px-2 py-1 rounded bg-[#4edea3]/20 text-[#4edea3] font-code-sm text-[11px] font-bold">
                  Rescatado
                </span>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => onToggleContract(item.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#32353d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e1e2ec] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4edea3]" />
                </label>
              )}
            </div>

            {/* Financial Value & Details CTA */}
            <div className="flex items-center justify-between pt-1 bg-[#0b0e15]/60 rounded-xl p-3 border border-[#272a32]">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-code-sm text-[#869397]">
                  Monto Bloqueado
                </div>
                <div className="font-code-lg text-base text-[#4edea3] font-bold">
                  ${item.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="font-code-sm text-xs text-[#869397] font-normal">USD</span>
                </div>
              </div>

              <button
                onClick={() => setModalContract(item)}
                className="flex items-center gap-1 font-code-sm text-xs text-[#4cd7f6] hover:text-[#acedff] transition-colors p-1"
              >
                <span>{item.contractHash}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Security Audit & Verification Assurance Card */}
      <section className="bg-[#191b23] border border-[#272a32] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-semibold text-sm text-[#e1e2ec]">Garantía Criptográfica Verificada</h5>
            <p className="text-xs text-[#bcc9cd]">
              Auditado por <span className="text-[#e1e2ec] font-bold">CertiK</span> &{' '}
              <span className="text-[#e1e2ec] font-bold">OpenZeppelin</span>.
            </p>
          </div>
        </div>

        {/* Simulation Check Feedback */}
        <div className="mt-3 bg-[#1d1f27] border border-[#3d494c]/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
            <span className="font-code-sm text-xs text-[#e1e2ec] truncate">
              Simulación de transacción: EXITOSA (0 Reverts)
            </span>
          </div>
          <span className="text-[10px] font-code-sm bg-[#4edea3]/20 text-[#4edea3] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
            100% SEGURO
          </span>
        </div>
      </section>

      {/* Contract Details Modal */}
      {modalContract && (
        <div className="fixed inset-0 z-50 bg-[#0b0e15]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#4cd7f6]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Detalles Técnicos</h3>
              </div>
              <button
                onClick={() => setModalContract(null)}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="bg-[#191b23] p-3 rounded-xl border border-[#272a32] flex flex-col gap-1">
                <span className="text-[11px] text-[#bcc9cd] font-code-sm uppercase">Protocolo</span>
                <span className="font-code-md text-sm text-[#e1e2ec] font-semibold">{modalContract.protocol}</span>
              </div>

              <div className="bg-[#191b23] p-3 rounded-xl border border-[#272a32] flex flex-col gap-1">
                <span className="text-[11px] text-[#bcc9cd] font-code-sm uppercase">Red de Origen</span>
                <span className="font-code-md text-sm text-[#4cd7f6] font-semibold">{modalContract.originNetwork}</span>
              </div>

              <div className="bg-[#191b23] p-3 rounded-xl border border-[#272a32] flex flex-col gap-1">
                <span className="text-[11px] text-[#bcc9cd] font-code-sm uppercase">Hash del Contrato Inteligente</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-code-sm text-xs text-[#4edea3] truncate font-medium">{modalContract.fullHash}</span>
                  <button
                    onClick={() => handleCopyHash(modalContract.fullHash)}
                    className="flex items-center gap-1 text-xs text-[#4cd7f6] hover:underline font-code-sm shrink-0"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#191b23] p-3 rounded-xl border border-[#272a32] flex items-center justify-between">
                <span className="text-[11px] text-[#bcc9cd] font-code-sm uppercase">Costo Gas Individual</span>
                <span className="font-code-sm text-xs text-[#e1e2ec] font-bold">{modalContract.gasCost}</span>
              </div>
            </div>

            <a
              href={modalContract.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] rounded-xl font-code-sm text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#3d494c]/40"
            >
              <span>Ver en Explorador de Bloques</span>
              <ExternalLink className="w-4 h-4 text-[#4cd7f6]" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
