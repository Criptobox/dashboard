import React, { useState } from 'react';
import { AirdropItem } from '../types';
import { TokenLogo } from './TokenLogo';
import {
  Radar,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Fuel,
  Info,
} from 'lucide-react';

interface AirdropsScreenProps {
  airdrops: AirdropItem[];
  gasSaverMode: boolean;
  onClaimAirdrop: (airdrop: AirdropItem) => void;
  onCompleteCriterion: (airdropId: string, criterionId: string) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const AirdropsScreen: React.FC<AirdropsScreenProps> = ({
  airdrops,
  gasSaverMode,
  onClaimAirdrop,
  onCompleteCriterion,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'ready' | 'near' | 'claimed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('airdrop-zro');
  const [isScanning, setIsScanning] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Filtered airdrops
  const filtered = airdrops.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const readyAirdrops = airdrops.filter((a) => a.status === 'ready');
  const nearAirdrops = airdrops.filter((a) => a.status === 'near');
  const totalClaimableUsd = readyAirdrops.reduce((acc, a) => acc + a.estimatedUsd, 0);
  const totalNearUsd = nearAirdrops.reduce((acc, a) => acc + a.estimatedUsd, 0);

  const handleScanWallet = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onShowToast(
        'Escaneo Multichain Completo',
        readyAirdrops.length > 0 || nearAirdrops.length > 0
          ? `14 redes analizadas: ${readyAirdrops.length} airdrops listos para reclamar y ${nearAirdrops.length} en fase avanzada`
          : '14 redes analizadas: sin airdrops elegibles detectados para esta wallet'
      );
    }, 1500);
  };

  const handleClaim = (airdrop: AirdropItem) => {
    setClaimingId(airdrop.id);
    setTimeout(() => {
      setClaimingId(null);
      onClaimAirdrop(airdrop);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Header Banner: Airdrop Radar & Total Value */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d1f27] via-[#272a32] to-[#191b23] border border-[#3d494c]/50 p-5 shadow-xl">
        {/* Glow blooms */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#4edea3]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#4cd7f6]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/20 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Radar className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold tracking-tight">
                Cacería de Airdrops & Reclamos
              </h2>
              <span className="text-[11px] text-[#bcc9cd] font-code-sm">
                Radar de Elegibilidad en 14 Redes L1/L2
              </span>
            </div>
          </div>

          <button
            onClick={handleScanWallet}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191b23] hover:bg-[#272a32] border border-[#3d494c]/60 text-xs font-semibold text-[#4cd7f6] transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Escaneando...' : 'Re-escanear'}</span>
          </button>
        </div>

        {/* Big Metrics Grid */}
        <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#10131a]/70 border border-[#4edea3]/30">
            <div className="flex items-center justify-between text-xs text-[#bcc9cd]">
              <span>Pendiente de Reclamar</span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs text-[#4edea3] font-code-sm font-bold">$</span>
              <span className="font-code-lg text-2xl sm:text-3xl text-[#4edea3] font-bold">
                {totalClaimableUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-[#bcc9cd] mt-0.5 block">
              {readyAirdrops.length} asignaciones listas hoy
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#10131a]/70 border border-[#3d494c]/30">
            <div className="flex items-center justify-between text-xs text-[#bcc9cd]">
              <span>Cerca de Reclamar</span>
              <Sparkles className="w-3.5 h-3.5 text-[#d0bcff]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs text-[#d0bcff] font-code-sm font-bold">~$</span>
              <span className="font-code-lg text-2xl sm:text-3xl text-[#e1e2ec] font-bold">
                {totalNearUsd.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-[10px] text-[#bcc9cd] mt-0.5 block">
              {nearAirdrops.length} protocolos en progreso
            </span>
          </div>
        </div>

        {/* Security & Sybil Status Bar */}
        <div className="relative z-10 mt-3 flex items-center justify-between p-2.5 rounded-xl bg-[#10131a]/50 border border-[#272a32] text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span className="text-[#bcc9cd]">Auditoría Sybil:</span>
            <span className="text-[#4edea3] font-semibold font-code-sm">0% Riesgo (Limpia)</span>
          </div>

          {gasSaverMode && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20 text-[10px] font-semibold">
              <Fuel className="w-3 h-3" />
              <span>Ahorro Gas Activo (-55%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 rounded-xl bg-[#191b23] border border-[#272a32] gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 min-w-[70px] py-2 text-center rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
              : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
          }`}
        >
          Todos ({airdrops.length})
        </button>
        <button
          onClick={() => setFilter('ready')}
          className={`flex-1 min-w-[120px] py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            filter === 'ready'
              ? 'bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/40 shadow-sm'
              : 'text-[#bcc9cd] hover:text-[#4edea3]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
          <span>Pendientes ({readyAirdrops.length})</span>
        </button>
        <button
          onClick={() => setFilter('near')}
          className={`flex-1 min-w-[110px] py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            filter === 'near'
              ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40 shadow-sm'
              : 'text-[#bcc9cd] hover:text-[#4cd7f6]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
          <span>Cerca ({nearAirdrops.length})</span>
        </button>
        <button
          onClick={() => setFilter('claimed')}
          className={`flex-1 min-w-[90px] py-2 text-center rounded-lg text-xs font-bold transition-all ${
            filter === 'claimed'
              ? 'bg-[#272a32] text-[#e1e2ec] shadow-sm'
              : 'text-[#bcc9cd] hover:text-[#e1e2ec]'
          }`}
        >
          Reclamados ({airdrops.filter((a) => a.status === 'claimed').length})
        </button>
      </div>

      {/* Airdrop Cards Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#1d1f27] border border-[#272a32]">
            <CheckCircle2 className="w-10 h-10 text-[#4edea3] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#e1e2ec]">No hay airdrops en este estado</p>
            <p className="text-xs text-[#bcc9cd] mt-1">
              Todos los criterios están verificados o al día.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isReady = item.status === 'ready';
            const isNear = item.status === 'near';
            const isClaimed = item.status === 'claimed';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isReady
                    ? 'bg-[#1d1f27] border-[#4edea3]/40 shadow-lg shadow-[#4edea3]/5'
                    : isClaimed
                    ? 'bg-[#191b23]/80 border-[#272a32] opacity-80'
                    : 'bg-[#1d1f27] border-[#3d494c]/40'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <TokenLogo symbol={item.symbol} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#e1e2ec]">{item.name}</h3>
                          <span className="font-code-sm text-xs font-bold text-[#4cd7f6]">
                            ${item.symbol}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#272a32] text-[#bcc9cd] text-[10px] font-code-sm">
                            {item.networkBadge}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#32353d] text-[#d0bcff] text-[10px]">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right shrink-0">
                      {isReady && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/30 text-xs font-bold font-code-sm animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                          LISTO PARA RECLAMAR
                        </span>
                      )}
                      {isNear && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 text-xs font-bold font-code-sm">
                          {item.progressPercent}% CALIFICADO
                        </span>
                      )}
                      {isClaimed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#272a32] text-[#869397] text-xs font-medium font-code-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
                          RECLAMADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allocation & Value Display */}
                  <div className="mt-3.5 p-3 rounded-xl bg-[#191b23] border border-[#272a32] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#bcc9cd] uppercase font-code-sm">
                        {isReady ? 'Asignación Confirmada' : isClaimed ? 'Total Reclamado' : 'Asignación Estimada'}
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-code-lg text-lg text-[#e1e2ec] font-bold">
                          {item.allocatedTokens.toLocaleString()} {item.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#bcc9cd] uppercase font-code-sm">Valor de Mercado</span>
                      <div className="font-code-lg text-lg font-bold text-[#4edea3]">
                        ${item.estimatedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for near eligibility */}
                  {isNear && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-code-sm mb-1">
                        <span className="text-[#bcc9cd]">Progreso hacia el reclamo:</span>
                        <span className="text-[#4cd7f6] font-bold">{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#191b23] overflow-hidden border border-[#272a32]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#4cd7f6] to-[#4edea3] transition-all duration-500"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Deadline Notice */}
                  {item.claimDeadline && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#bcc9cd]">
                      <Clock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      <span>{item.claimDeadline}</span>
                    </div>
                  )}

                  {/* Primary Action Row */}
                  <div className="mt-4 flex items-center gap-2">
                    {isReady && (
                      <button
                        onClick={() => handleClaim(item)}
                        disabled={claimingId === item.id}
                        className="flex-1 h-11 rounded-xl bg-[#00a572] hover:bg-[#4edea3] text-[#003824] hover:text-[#002113] font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        {claimingId === item.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Firmando Reclamo...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            <span>Reclamar {item.allocatedTokens} {item.symbol}</span>
                          </>
                        )}
                      </button>
                    )}

                    {isNear && (
                      <button
                        onClick={() => {
                          const incomplete = item.criteria.find((c) => !c.completed);
                          if (incomplete) {
                            onCompleteCriterion(item.id, incomplete.id);
                          } else {
                            onShowToast('Criterios al Día', 'Esperando el snapshot oficial de la red');
                          }
                        }}
                        className="flex-1 h-11 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] border border-[#4cd7f6]/30 font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Completar Último Criterio</span>
                      </button>
                    )}

                    {isClaimed && (
                      <button
                        onClick={() =>
                          onShowToast(
                            'Transacción Confirmada',
                            `Ver contrato oficial: ${item.officialClaimContract.slice(0, 10)}...`
                          )
                        }
                        className="flex-1 h-11 rounded-xl bg-[#191b23] border border-[#272a32] text-[#bcc9cd] font-code-sm text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                        <span>Reclamado con Éxito</span>
                      </button>
                    )}

                    {/* Expand/Collapse Criteria Button */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="h-11 px-3 rounded-xl bg-[#191b23] hover:bg-[#272a32] border border-[#272a32] text-[#bcc9cd] hover:text-[#e1e2ec] flex items-center gap-1 transition-colors text-xs font-semibold"
                      title="Ver Criterios de Calificación"
                    >
                      <span>Criterios</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Criteria Checklist Section */}
                {isExpanded && (
                  <div className="border-t border-[#272a32] p-4 bg-[#141720]/80 rounded-b-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-code-sm text-[#bcc9cd] tracking-wider">
                        Requisitos & Criterios On-Chain
                      </span>
                      <span className="text-[11px] text-[#4cd7f6] font-code-sm">
                        Gas Reclamo: ~${gasSaverMode ? (item.gasCostEstimateUsd * 0.45).toFixed(2) : item.gasCostEstimateUsd.toFixed(2)} USD
                      </span>
                    </div>

                    <p className="text-xs text-[#bcc9cd] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-2">
                      {item.criteria.map((crit) => (
                        <div
                          key={crit.id}
                          onClick={() => {
                            if (!crit.completed) {
                              onCompleteCriterion(item.id, crit.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                            crit.completed
                              ? 'bg-[#191b23] border-[#4edea3]/30 text-[#e1e2ec]'
                              : 'bg-[#272a32]/60 border-[#ffb4ab]/30 text-[#e1e2ec] hover:border-[#4cd7f6] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {crit.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border-2 border-[#ffb4ab] shrink-0" />
                            )}
                            <span className="truncate">{crit.label}</span>
                          </div>

                          {crit.scoreWeight && (
                            <span
                              className={`font-code-sm text-[10px] px-2 py-0.5 rounded shrink-0 font-bold ${
                                crit.completed
                                  ? 'bg-[#4edea3]/15 text-[#4edea3]'
                                  : 'bg-[#ffb4ab]/15 text-[#ffb4ab]'
                              }`}
                            >
                              {crit.scoreWeight}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Official Contract & Security Hash */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#869397] font-code-sm">
                      <span>Contrato: {item.officialClaimContract.slice(0, 8)}...{item.officialClaimContract.slice(-6)}</span>
                      <a
                        href={`https://etherscan.io/address/${item.officialClaimContract}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#4cd7f6] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Explorador</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
