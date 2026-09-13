import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, Sparkles, X, Info } from 'lucide-react';
import { getAssetRiskEvaluation, TokenRiskEvaluation } from '../utils/aiRiskScorer';

interface AiRiskBadgeProps {
  symbol: string;
  tokenName?: string;
  size?: 'sm' | 'md';
}

export const AiRiskBadge: React.FC<AiRiskBadgeProps> = ({
  symbol,
  tokenName,
  size = 'sm',
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const evaluation: TokenRiskEvaluation = getAssetRiskEvaluation(symbol);

  const getRiskIcon = () => {
    switch (evaluation.level) {
      case 'low':
        return <ShieldCheck className="w-2.5 h-2.5 shrink-0" />;
      case 'moderate':
        return <Activity className="w-2.5 h-2.5 shrink-0" />;
      case 'high':
      case 'critical':
        return <ShieldAlert className="w-2.5 h-2.5 shrink-0" />;
      default:
        return <ShieldCheck className="w-2.5 h-2.5 shrink-0" />;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        title={`Riesgo IA: ${evaluation.label}. Clic para ver desglose de seguridad, volatilidad y liquidez.`}
        className={`inline-flex items-center gap-1 font-code-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
        }`}
        style={{
          backgroundColor: evaluation.bgColor,
          borderColor: evaluation.borderColor,
          color: evaluation.tagColor,
        }}
      >
        <Sparkles className="w-2.5 h-2.5 shrink-0 opacity-80" />
        {getRiskIcon()}
        <span>{evaluation.label}</span>
      </button>

      {/* Detail Modal Dialog */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-[#1d1f27] border border-[#3d494c] p-5 shadow-2xl space-y-4 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: evaluation.bgColor,
                      borderColor: evaluation.borderColor,
                      color: evaluation.tagColor,
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#e1e2ec] font-headline-lg flex items-center gap-1.5">
                      Evaluación de Riesgo IA — {symbol}
                    </h3>
                    <p className="text-[11px] text-[#869397] font-code-sm">
                      {tokenName || symbol} • Análisis multi-vectorial continuo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg bg-[#10131a] hover:bg-[#272a32] text-[#869397] hover:text-[#e1e2ec] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Score Bar Banner */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: evaluation.bgColor,
                  borderColor: evaluation.borderColor,
                }}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-code-sm font-semibold opacity-90 block" style={{ color: evaluation.tagColor }}>
                    Factor de Riesgo Global
                  </span>
                  <div className="text-xl font-extrabold font-code-md tracking-tight flex items-baseline gap-2 mt-0.5 text-white">
                    <span>{evaluation.label}</span>
                    <span className="text-xs font-code-sm opacity-80" style={{ color: evaluation.tagColor }}>
                      (Score: {evaluation.score}/100)
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border font-code-sm"
                  style={{
                    backgroundColor: '#10131a',
                    borderColor: evaluation.tagColor,
                    color: evaluation.tagColor,
                  }}
                >
                  {evaluation.score}
                </div>
              </div>

              {/* 3 Core Vectors Breakdown: Security, Volatility, Liquidity */}
              <div className="space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-[#869397] font-code-sm font-bold block">
                  Vectores de Evaluación Auditados
                </span>

                {/* 1. Contract Security */}
                <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#e1e2ec] flex items-center gap-1.5 font-headline-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                      Seguridad de Contratos Inteligentes
                    </span>
                    <span className="font-extrabold font-code-sm text-[#4edea3]">
                      {evaluation.breakdown.contractSecurity}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#272a32] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4edea3] rounded-full"
                      style={{ width: `${evaluation.breakdown.contractSecurity}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#bcc9cd] font-code-sm">
                    {evaluation.breakdown.contractNotes}
                  </p>
                </div>

                {/* 2. Historical Volatility */}
                <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#e1e2ec] flex items-center gap-1.5 font-headline-lg">
                      <Activity className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      Estabilidad & Volatilidad Histórica
                    </span>
                    <span className="font-extrabold font-code-sm text-[#4cd7f6]">
                      {evaluation.breakdown.historicalVolatility}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#272a32] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4cd7f6] rounded-full"
                      style={{ width: `${evaluation.breakdown.historicalVolatility}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#bcc9cd] font-code-sm">
                    {evaluation.breakdown.volatilityNotes}
                  </p>
                </div>

                {/* 3. Liquidity Health */}
                <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#e1e2ec] flex items-center gap-1.5 font-headline-lg">
                      <Sparkles className="w-3.5 h-3.5 text-[#d0bcff]" />
                      Salud & Profundidad de Liquidez DEX/CEX
                    </span>
                    <span className="font-extrabold font-code-sm text-[#d0bcff]">
                      {evaluation.breakdown.liquidityHealth}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#272a32] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d0bcff] rounded-full"
                      style={{ width: `${evaluation.breakdown.liquidityHealth}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#bcc9cd] font-code-sm">
                    {evaluation.breakdown.liquidityNotes}
                  </p>
                </div>
              </div>

              {/* Explanatory footer */}
              <div className="pt-2 border-t border-[#272a32] flex items-center justify-between text-[10px] text-[#869397] font-code-sm">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#4cd7f6]" />
                  Actualizado en tiempo real por el Sentinel AI Guard.
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] font-semibold transition-colors"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
