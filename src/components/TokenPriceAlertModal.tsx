import React, { useState, useMemo } from 'react';
import { TokenItem, PushSentinel } from '../types';
import { TokenLogo } from './TokenLogo';
import {
  X,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Radio,
  Volume2,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';

interface TokenPriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: TokenItem[];
  onSaveAlert: (sentinel: Omit<PushSentinel, 'id'>) => void;
  onTestNotification: (title: string, subtitle: string, tokenSymbol: string) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const TokenPriceAlertModal: React.FC<TokenPriceAlertModalProps> = ({
  isOpen,
  onClose,
  tokens,
  onSaveAlert,
  onTestNotification,
  onShowToast,
}) => {
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string>(
    tokens[0]?.symbol || 'ETH'
  );
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notificationChannel, setNotificationChannel] = useState<'push' | 'websocket' | 'sound'>('push');
  const [customNote, setCustomNote] = useState<string>('');

  const currentToken = useMemo(() => {
    return (
      tokens.find((t) => t.symbol.toUpperCase() === selectedTokenSymbol.toUpperCase()) ||
      tokens[0] || {
        id: 'eth',
        name: 'Ethereum',
        symbol: 'ETH',
        priceUsd: 3342.10,
        chain: 'ethereum',
        chainLabel: 'Ethereum',
        change24h: 3.4,
        balance: 1.5,
        valueUsd: 5013.15,
        iconType: 'eth' as const,
      }
    );
  }, [tokens, selectedTokenSymbol]);

  // Set default target price when token or condition changes
  const targetPriceNum = parseFloat(targetPrice) || 0;
  const currentPrice = currentToken.priceUsd;

  const percentageDistance = useMemo(() => {
    if (!targetPriceNum || !currentPrice) return 0;
    return ((targetPriceNum - currentPrice) / currentPrice) * 100;
  }, [targetPriceNum, currentPrice]);

  const handleApplyPreset = (percent: number) => {
    const calculated = currentPrice * (1 + percent / 100);
    // Format sensibly
    if (calculated >= 1000) {
      setTargetPrice(calculated.toFixed(0));
    } else if (calculated >= 1) {
      setTargetPrice(calculated.toFixed(2));
    } else {
      setTargetPrice(calculated.toFixed(4));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPriceNum) {
      onShowToast('Umbral Requerido', 'Por favor ingresa un precio objetivo válido.');
      return;
    }

    const sign = condition === 'above' ? '>' : '<';
    const title = `${currentToken.name} (${currentToken.symbol}) ${sign} $${targetPriceNum.toLocaleString()}`;
    const subtitle = `Actual: $${currentPrice.toLocaleString()}`;
    const distanceStr = `${percentageDistance > 0 ? '+' : ''}${percentageDistance.toFixed(1)}% para meta`;

    onSaveAlert({
      title,
      subtitle,
      metaInfo: distanceStr,
      enabled: true,
      icon: currentToken.symbol.toLowerCase(),
      iconColor: condition === 'above' ? '#4edea3' : '#ffb4ab',
      tokenSymbol: currentToken.symbol,
      currentPrice,
      targetPrice: targetPriceNum,
      condition,
      notificationChannel,
    });

    onShowToast(
      'Alerta de Centinela Activada',
      `Monitoreando ${currentToken.symbol} ${sign} $${targetPriceNum.toLocaleString()} vía ${notificationChannel.toUpperCase()}`
    );

    // Optional preview test
    onClose();
  };

  const handleQuickTest = () => {
    const sign = condition === 'above' ? '>' : '<';
    const testPrice = targetPriceNum || currentPrice * (condition === 'above' ? 1.05 : 0.95);
    onTestNotification(
      `¡Push Sentinel Alcanzado! ${currentToken.symbol} ${sign} $${testPrice.toLocaleString()}`,
      `${currentToken.name} alcanzó tu umbral de precio configurado. Disparado por Oráculo Pyth / Mempool.`,
      currentToken.symbol
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-3xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#272a32]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4cd7f6]/15 border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">
                Configurar Alerta de Precio
              </h3>
              <p className="text-[11px] text-[#bcc9cd]">
                Push Sentinel con monitorización continua en mempool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Step 1: Select Token */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd] flex items-center justify-between">
              <span>1. Seleccionar Token</span>
              <span className="text-[10px] text-[#869397]">Precio en vivo</span>
            </label>

            {/* Token Scroller / Selector Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tokens.slice(0, 6).map((t) => {
                const isSelected = selectedTokenSymbol.toUpperCase() === t.symbol.toUpperCase();
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTokenSymbol(t.symbol);
                      // Auto populate target with +5%
                      const defaultTarget = t.priceUsd * (condition === 'above' ? 1.05 : 0.95);
                      setTargetPrice(defaultTarget >= 1 ? defaultTarget.toFixed(2) : defaultTarget.toFixed(4));
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      isSelected
                        ? 'bg-[#4cd7f6]/15 border-[#4cd7f6] shadow-sm'
                        : 'bg-[#191b23] border-[#272a32] hover:border-[#3d494c]'
                    }`}
                  >
                    <TokenLogo symbol={t.symbol} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#e1e2ec] block truncate">
                        {t.symbol}
                      </span>
                      <span className="font-code-sm text-[10px] text-[#bcc9cd] block">
                        ${t.priceUsd.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Token Preview Card */}
          <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TokenLogo symbol={currentToken.symbol} size="md" />
              <div>
                <span className="text-xs font-bold text-[#e1e2ec] block">
                  {currentToken.name} ({currentToken.symbol})
                </span>
                <span className="text-[11px] text-[#869397]">{currentToken.chainLabel}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-code-lg text-sm font-bold text-[#e1e2ec] block">
                ${currentToken.priceUsd.toLocaleString()} USD
              </span>
              <span
                className={`font-code-sm text-[11px] font-semibold ${
                  currentToken.change24h >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                }`}
              >
                {currentToken.change24h >= 0 ? '+' : ''}
                {currentToken.change24h}% (24h)
              </span>
            </div>
          </div>

          {/* Step 2: Trigger Condition */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
              2. Condición del Disparador
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCondition('above');
                  handleApplyPreset(5);
                }}
                className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                  condition === 'above'
                    ? 'bg-[#4edea3]/20 border-[#4edea3] text-[#4edea3] shadow-md shadow-[#4edea3]/10'
                    : 'bg-[#191b23] border-[#272a32] text-[#bcc9cd] hover:text-[#e1e2ec]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Supera Precio (&gt;)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCondition('below');
                  handleApplyPreset(-5);
                }}
                className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                  condition === 'below'
                    ? 'bg-[#ffb4ab]/20 border-[#ffb4ab] text-[#ffb4ab] shadow-md shadow-[#ffb4ab]/10'
                    : 'bg-[#191b23] border-[#272a32] text-[#bcc9cd] hover:text-[#e1e2ec]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Cae por Debajo (&lt;)</span>
              </button>
            </div>
          </div>

          {/* Step 3: Target Price Input with Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                3. Umbral de Precio Objetivo (USD)
              </label>
              {targetPriceNum > 0 && (
                <span
                  className={`font-code-sm text-[11px] font-bold ${
                    percentageDistance >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {percentageDistance >= 0 ? '+' : ''}
                  {percentageDistance.toFixed(1)}% de distancia
                </span>
              )}
            </div>

            <div className="flex items-center bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2.5 focus-within:border-[#4cd7f6]">
              <span className="text-[#869397] font-code-lg text-lg mr-1">$</span>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={currentPrice.toString()}
                className="bg-transparent text-[#e1e2ec] font-code-lg text-lg focus:outline-none w-full font-bold"
                required
              />
              <span className="font-code-md text-xs text-[#4cd7f6] font-bold px-2 py-1 bg-[#272a32] rounded-lg shrink-0">
                USD
              </span>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[#869397] uppercase font-semibold shrink-0">Atajos:</span>
              {condition === 'above'
                ? [3, 5, 10, 20, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPreset(pct)}
                      className="px-2.5 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[11px] font-code-sm text-[#4edea3] font-semibold transition-colors shrink-0"
                    >
                      +{pct}%
                    </button>
                  ))
                : [-3, -5, -10, -20, -35].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPreset(pct)}
                      className="px-2.5 py-1 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[11px] font-code-sm text-[#ffb4ab] font-semibold transition-colors shrink-0"
                    >
                      {pct}%
                    </button>
                  ))}
            </div>
          </div>

          {/* Step 4: Notification Channel */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
              4. Canal de Centinela Push
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNotificationChannel('push')}
                className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                  notificationChannel === 'push'
                    ? 'bg-[#4cd7f6]/15 border-[#4cd7f6] text-[#4cd7f6]'
                    : 'bg-[#191b23] border-[#272a32] text-[#869397]'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span className="text-[11px] font-sans">Push Móvil</span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationChannel('websocket')}
                className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                  notificationChannel === 'websocket'
                    ? 'bg-[#d0bcff]/15 border-[#d0bcff] text-[#d0bcff]'
                    : 'bg-[#191b23] border-[#272a32] text-[#869397]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-[11px] font-sans">WebSocket</span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationChannel('sound')}
                className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                  notificationChannel === 'sound'
                    ? 'bg-[#4edea3]/15 border-[#4edea3] text-[#4edea3]'
                    : 'bg-[#191b23] border-[#272a32] text-[#869397]'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[11px] font-sans">Alarma Sonora</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#272a32]">
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4cd7f6]/20 transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>Activar Centinela Push</span>
            </button>

            <button
              type="button"
              onClick={handleQuickTest}
              className="w-full h-10 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#e1e2ec] font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#3d494c]/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>Probar Disparo de Notificación Inmediato</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
