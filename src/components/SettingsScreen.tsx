import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationSettings, NotificationLogItem, ScreenTab } from '../types';
import {
  Bell,
  BellRing,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Smartphone,
  Volume2,
  VolumeX,
  Send,
  Zap,
  Radio,
  Sliders,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Lock,
  Fuel,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface SettingsScreenProps {
  onNavigateTab: (tab: ScreenTab) => void;
  onShowToast: (title: string, msg: string) => void;
  gasSaverMode: boolean;
  onToggleGasSaverMode: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  browserPush: true,
  soundAlerts: true,
  hapticFeedback: true,
  telegramSync: false,

  incomingTransfers: true,
  outgoingTransfers: true,
  minTransferThresholdUsd: 10,
  unlimitedApprovals: true,
  priceVolatilityAlerts: true,
  volatilityThresholdPercent: 5,
  gasPriceAlerts: true,
  gasThresholdGwei: 12,
  newAirdropsEligible: true,

  phishingProtection: true,
  sandwichMevProtection: true,
  vulnerableContractRevocation: true,
  unknownDappConnections: true,
  fundRescueFound: true,
};

const INITIAL_LOGS: NotificationLogItem[] = [
  {
    id: 'log-1',
    type: 'security',
    title: 'Intento de Phishing Bloqueado',
    message: 'Se interceptó una firma maliciosa `permit()` desde un dominio phishing no verificado.',
    timestamp: 'Hace 8 min',
    severity: 'critical',
  },
  {
    id: 'log-2',
    type: 'wallet',
    title: 'Transferencia Entrante Confirmada',
    message: 'Recibidos +1,250 USDC en Arbitrum One. Saldo acreditado.',
    timestamp: 'Hace 34 min',
    severity: 'success',
  },
  {
    id: 'log-3',
    type: 'gas',
    title: 'Oportunidad de Gas (9.4 Gwei)',
    message: 'Las tarifas en Ethereum L1 bajaron del umbral configurado. Momento óptimo para operar.',
    timestamp: 'Hace 1 hora',
    severity: 'info',
  },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateTab,
  onShowToast,
  gasSaverMode,
  onToggleGasSaverMode,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('omnivault_notification_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [logs, setLogs] = useState<NotificationLogItem[]>(INITIAL_LOGS);
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'default' | 'simulated'>('granted');

  // Play synthesized audio alert
  const playAlertSound = (type: 'info' | 'warning' | 'critical') => {
    if (!settings.soundAlerts) return;
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

      const now = ctx.currentTime;
      if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.16); // C6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Ignore audio context errors
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(key: K, val: NotificationSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    localStorage.setItem('omnivault_notification_settings', JSON.stringify(updated));
  };

  // Trigger simulated push notification
  const handleSimulateAlert = (
    type: 'wallet' | 'security' | 'gas',
    title: string,
    message: string,
    severity: 'critical' | 'warning' | 'info' | 'success'
  ) => {
    setIsSimulating(type);
    playAlertSound(severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info');

    setTimeout(() => {
      setIsSimulating(null);
      onShowToast(`Push: ${title}`, message);

      const newLog: NotificationLogItem = {
        id: `sim-${Date.now()}`,
        type,
        title,
        message,
        timestamp: 'Ahora mismo',
        severity,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 600);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('omnivault_notification_settings', JSON.stringify(DEFAULT_SETTINGS));
    onShowToast('Preferencias Restablecidas', 'Se han restaurado los valores por defecto recomendados.');
  };

  return (
    <div className="flex flex-col w-full px-4 space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Top Header Breadcrumb & Screen Title */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="w-8 h-8 rounded-full bg-[#1d1f27] hover:bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec] transition-colors cursor-pointer"
            title="Volver a Bóveda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-headline-sm text-lg sm:text-xl font-bold text-[#e1e2ec] flex items-center gap-2">
              <span>Configuración</span>
              <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] font-code-sm text-[10px] font-bold">
                Alertas Push
              </span>
            </h1>
            <p className="text-xs text-[#869397]">
              Preferencias de notificaciones en vivo y centinelas criptográficos
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-2.5 py-1.5 rounded-xl bg-[#1d1f27] hover:bg-[#272a32] border border-[#3d494c]/30 text-xs font-semibold text-[#bcc9cd] hover:text-[#e1e2ec] transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Restablecer valores predeterminados"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Por Defecto</span>
        </button>
      </div>

      {/* Master Push Notification Switch & Delivery Channels Card */}
      <div
        className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          settings.pushEnabled
            ? 'bg-gradient-to-br from-[#1d1f27] to-[#161820] border-[#4cd7f6]/40 shadow-lg shadow-[#4cd7f6]/5'
            : 'bg-[#161820] border-[#3d494c]/30 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#272a32]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                settings.pushEnabled
                  ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40'
                  : 'bg-[#272a32] text-[#869397]'
              }`}
            >
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-[#e1e2ec]">Notificaciones Push Globales</h2>
                {settings.pushEnabled && (
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                )}
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                {settings.pushEnabled
                  ? 'Servicio de eventos en tiempo real activo'
                  : 'Todas las alertas push se encuentran pausadas'}
              </p>
            </div>
          </div>

          {/* Master Toggle */}
          <button
            onClick={() => {
              const next = !settings.pushEnabled;
              updateSetting('pushEnabled', next);
              onShowToast(
                next ? 'Notificaciones Activadas' : 'Notificaciones Pausadas',
                next
                  ? 'Recibirás alertas en segundo plano sobre transacciones y seguridad.'
                  : 'Has desactivado el servicio de notificaciones en este dispositivo.'
              );
            }}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
              settings.pushEnabled ? 'bg-[#4cd7f6]' : 'bg-[#272a32]'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                settings.pushEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Channels Configuration Chips */}
        <div className="pt-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bcc9cd] block">
            Canales de Entrega
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Browser Push */}
            <button
              onClick={() => updateSetting('browserPush', !settings.browserPush)}
              disabled={!settings.pushEnabled}
              className={`p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer disabled:opacity-40 ${
                settings.browserPush && settings.pushEnabled
                  ? 'bg-[#4cd7f6]/10 border-[#4cd7f6]/50 text-[#e1e2ec]'
                  : 'bg-[#10131a] border-[#272a32] text-[#869397]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Smartphone className="w-4 h-4 text-[#4cd7f6]" />
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.browserPush && settings.pushEnabled ? 'bg-[#4edea3]' : 'bg-[#3d494c]'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold">Web Push</span>
              <span className="text-[10px] text-[#869397]">Segundo plano</span>
            </button>

            {/* Sound Chimes */}
            <button
              onClick={() => updateSetting('soundAlerts', !settings.soundAlerts)}
              disabled={!settings.pushEnabled}
              className={`p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer disabled:opacity-40 ${
                settings.soundAlerts && settings.pushEnabled
                  ? 'bg-[#00a572]/10 border-[#4edea3]/50 text-[#e1e2ec]'
                  : 'bg-[#10131a] border-[#272a32] text-[#869397]'
              }`}
            >
              <div className="flex items-center justify-between">
                {settings.soundAlerts ? (
                  <Volume2 className="w-4 h-4 text-[#4edea3]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#869397]" />
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.soundAlerts && settings.pushEnabled ? 'bg-[#4edea3]' : 'bg-[#3d494c]'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold">Sonido Web3</span>
              <span className="text-[10px] text-[#869397]">Beep sintetizado</span>
            </button>

            {/* Haptic Feedback */}
            <button
              onClick={() => updateSetting('hapticFeedback', !settings.hapticFeedback)}
              disabled={!settings.pushEnabled}
              className={`p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer disabled:opacity-40 ${
                settings.hapticFeedback && settings.pushEnabled
                  ? 'bg-[#d0bcff]/10 border-[#d0bcff]/50 text-[#e1e2ec]'
                  : 'bg-[#10131a] border-[#272a32] text-[#869397]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Radio className="w-4 h-4 text-[#d0bcff]" />
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.hapticFeedback && settings.pushEnabled ? 'bg-[#4edea3]' : 'bg-[#3d494c]'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold">Vibración</span>
              <span className="text-[10px] text-[#869397]">Pulsos hápticos</span>
            </button>

            {/* Telegram Bot Sync */}
            <button
              onClick={() => {
                const next = !settings.telegramSync;
                updateSetting('telegramSync', next);
                if (next) {
                  onShowToast(
                    'Bot de Telegram Vinculado',
                    'Recibirás notificaciones espejo en @OmniVaultAlertsBot'
                  );
                }
              }}
              disabled={!settings.pushEnabled}
              className={`p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer disabled:opacity-40 ${
                settings.telegramSync && settings.pushEnabled
                  ? 'bg-[#3b99fc]/10 border-[#3b99fc]/50 text-[#e1e2ec]'
                  : 'bg-[#10131a] border-[#272a32] text-[#869397]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Send className="w-4 h-4 text-[#3b99fc]" />
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.telegramSync && settings.pushEnabled ? 'bg-[#4edea3]' : 'bg-[#3d494c]'
                  }`}
                />
              </div>
              <span className="text-xs font-semibold">Telegram</span>
              <span className="text-[10px] text-[#869397]">Bot de respaldo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Servicios Simulados de Alertas de Billetera */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#4cd7f6]" />
            <h2 className="font-bold text-sm text-[#e1e2ec]">Alertas de Cartera & Balances</h2>
          </div>
          <span className="text-[11px] text-[#bcc9cd] font-code-sm">Pyth & Mempool</span>
        </div>

        <div className="bg-[#1d1f27] rounded-3xl border border-[#3d494c]/40 p-4 space-y-4 divide-y divide-[#272a32]">
          {/* Incoming Transfers */}
          <div className="flex items-start justify-between gap-3 pt-0 first:pt-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Transferencias Entrantes</span>
                <span className="px-1.5 py-0.2 rounded bg-[#00a572]/20 text-[#4edea3] font-code-sm text-[10px] font-bold">
                  Depósitos
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Notificar al recibir fondos o tokens ERC-20 / SPL en cualquier cadena.
              </p>

              {/* Threshold selector if enabled */}
              {settings.incomingTransfers && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-[#bcc9cd]">Umbral mínimo:</span>
                  {[0, 10, 100, 1000].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateSetting('minTransferThresholdUsd', val)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-code-sm font-semibold transition-colors ${
                        settings.minTransferThresholdUsd === val
                          ? 'bg-[#4cd7f6] text-[#003640]'
                          : 'bg-[#10131a] text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      {val === 0 ? 'Todos' : `>$${val}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => updateSetting('incomingTransfers', !settings.incomingTransfers)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.incomingTransfers ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.incomingTransfers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Outgoing Transfers */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div>
              <span className="font-semibold text-sm text-[#e1e2ec] block">
                Transferencias Salientes & Envíos
              </span>
              <p className="text-xs text-[#869397] mt-0.5">
                Confirmación instantánea al emitir firmas y transmitir transacciones al mempool.
              </p>
            </div>
            <button
              onClick={() => updateSetting('outgoingTransfers', !settings.outgoingTransfers)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.outgoingTransfers ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.outgoingTransfers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Unlimited Token Approvals Warning */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Aprobaciones Ilimitadas</span>
                <span className="px-1.5 py-0.2 rounded bg-[#f0b90b]/20 text-[#f0b90b] font-code-sm text-[10px] font-bold">
                  Riesgo DeFi
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Alerta cuando un protocolo solicita gastar saldo ilimitado de tokens (`uint256 max`).
              </p>
            </div>
            <button
              onClick={() => updateSetting('unlimitedApprovals', !settings.unlimitedApprovals)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.unlimitedApprovals ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.unlimitedApprovals ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Price Volatility Alerts */}
          <div className="flex items-start justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Volatilidad de Precios</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Movimientos bruscos en tokens de la cartera calculados mediante el oráculo Pyth.
              </p>

              {settings.priceVolatilityAlerts && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-[#bcc9cd]">Variación 24h:</span>
                  {[3, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => updateSetting('volatilityThresholdPercent', pct)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-code-sm font-semibold transition-colors ${
                        settings.volatilityThresholdPercent === pct
                          ? 'bg-[#4cd7f6] text-[#003640]'
                          : 'bg-[#10131a] text-[#869397] hover:text-[#e1e2ec]'
                      }`}
                    >
                      ±{pct}%
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => updateSetting('priceVolatilityAlerts', !settings.priceVolatilityAlerts)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.priceVolatilityAlerts ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.priceVolatilityAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Gas Price Alert */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Caída de Gas (Modo Eco)</span>
                <Fuel className="w-3.5 h-3.5 text-[#4edea3]" />
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Aviso cuando las tarifas en Ethereum L1 bajen de {settings.gasThresholdGwei} Gwei para ejecutar transferencias económicas.
              </p>
            </div>
            <button
              onClick={() => updateSetting('gasPriceAlerts', !settings.gasPriceAlerts)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.gasPriceAlerts ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.gasPriceAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* New Airdrops Eligible Alert */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Airdrops Elegibles Listos</span>
                <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-code-sm text-[10px] font-bold">
                  Reclamos
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Detección automática de asignaciones confirmadas en protocolos multichain.
              </p>
            </div>
            <button
              onClick={() => updateSetting('newAirdropsEligible', !settings.newAirdropsEligible)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.newAirdropsEligible ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.newAirdropsEligible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Servicios Simulados de Alertas de Seguridad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" />
            <h2 className="font-bold text-sm text-[#e1e2ec]">Centinelas de Seguridad & Antifraude</h2>
          </div>
          <span className="text-[10px] font-code-sm text-[#4edea3] bg-[#00a572]/20 px-2 py-0.5 rounded">
            Shield v3
          </span>
        </div>

        <div className="bg-[#1d1f27] rounded-3xl border border-[#3d494c]/40 p-4 space-y-4 divide-y divide-[#272a32]">
          {/* Phishing & Drainer Protection */}
          <div className="flex items-start justify-between gap-3 pt-0 first:pt-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Motor Antifraude & Drainers</span>
                <span className="px-1.5 py-0.2 rounded bg-[#ffb4ab]/20 text-[#ffb4ab] font-code-sm text-[10px] font-bold">
                  Blockaid Engine
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Simula la ejecución de contratos antes de firmar para detectar scripts de robo o sweepers.
              </p>
            </div>
            <button
              onClick={() => updateSetting('phishingProtection', !settings.phishingProtection)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.phishingProtection ? 'bg-[#ffb4ab]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#690005] shadow-md transform transition-transform ${
                  settings.phishingProtection ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sandwich & Frontrunning MEV Protection */}
          <div className="flex items-start justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Protección Sandwich MEV</span>
                <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-code-sm text-[10px] font-bold">
                  Flashbots RPC
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Notifica si un bot de arbitraje detecta tu swap en la mempool pública y activa el enrutamiento privado.
              </p>
            </div>
            <button
              onClick={() => updateSetting('sandwichMevProtection', !settings.sandwichMevProtection)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.sandwichMevProtection ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.sandwichMevProtection ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vulnerable Contract Revocation Alerts */}
          <div className="flex items-start justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Aviso de Revocación Inmediata</span>
                <span className="px-1.5 py-0.2 rounded bg-[#f0b90b]/20 text-[#f0b90b] font-code-sm text-[10px] font-bold">
                  Revoke.cash
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Alerta si un smart contract al que otorgaste permisos en el pasado reporta un exploit o vulnerabilidad crítica.
              </p>
            </div>
            <button
              onClick={() => updateSetting('vulnerableContractRevocation', !settings.vulnerableContractRevocation)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.vulnerableContractRevocation ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.vulnerableContractRevocation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Unknown dApp Connections Alert */}
          <div className="flex items-start justify-between gap-3 pt-3.5">
            <div>
              <span className="font-semibold text-sm text-[#e1e2ec] block">
                Conexiones a dApps No Verificadas
              </span>
              <p className="text-xs text-[#869397] mt-0.5">
                Alerta de confirmación secundaria cuando una página externa sin reputación intenta solicitar firmas.
              </p>
            </div>
            <button
              onClick={() => updateSetting('unknownDappConnections', !settings.unknownDappConnections)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.unknownDappConnections ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.unknownDappConnections ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Rescue Funds Detected Alert */}
          <div className="flex items-start justify-between gap-3 pt-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#e1e2ec]">Fondos Huérfanos Rescatables</span>
                <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-code-sm text-[10px] font-bold">
                  OmniRescue
                </span>
              </div>
              <p className="text-xs text-[#869397] mt-0.5">
                Alerta push al detectar saldos atrapados en contratos antiguos o reclamos de puentes multichain.
              </p>
            </div>
            <button
              onClick={() => updateSetting('fundRescueFound', !settings.fundRescueFound)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                settings.fundRescueFound ? 'bg-[#4edea3]' : 'bg-[#272a32]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.fundRescueFound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Laboratorio de Simulación de Notificaciones en Vivo */}
      <div className="p-4 rounded-3xl bg-[#1d1f27] border border-[#3d494c]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d0bcff]" />
            <h3 className="font-bold text-sm text-[#e1e2ec]">Simulador de Alertas en Vivo</h3>
          </div>
          <span className="text-[10px] text-[#bcc9cd] font-code-sm">Probar Sonido & Push</span>
        </div>

        <p className="text-xs text-[#869397]">
          Pulsa cualquiera de los botones para verificar la respuesta del sistema de audio y la entrega visual de alertas:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Simulate Security Threat */}
          <button
            onClick={() =>
              handleSimulateAlert(
                'security',
                '¡Ataque Drainer Bloqueado!',
                'Firma maliciosa `permit2` rechazada en contrato 0x9a8b...4f',
                'critical'
              )
            }
            disabled={isSimulating !== null}
            className="p-3 rounded-2xl bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" />
              <span className="text-[10px] font-code-sm text-[#ffb4ab] font-bold">SEGURIDAD</span>
            </div>
            <span className="font-bold text-xs text-[#e1e2ec] block group-hover:text-[#ffb4ab] transition-colors">
              Simular Phishing
            </span>
            <span className="text-[10px] text-[#869397] line-clamp-1 mt-0.5">
              Alerta de alta severidad
            </span>
          </button>

          {/* Simulate Incoming Transfer */}
          <button
            onClick={() =>
              handleSimulateAlert(
                'wallet',
                'Depósito Recibido (+0.85 ETH)',
                'Fondos acreditados desde Coinbase en Base L2.',
                'success'
              )
            }
            disabled={isSimulating !== null}
            className="p-3 rounded-2xl bg-[#00a572]/10 hover:bg-[#00a572]/20 border border-[#4edea3]/30 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <Wallet className="w-4 h-4 text-[#4edea3]" />
              <span className="text-[10px] font-code-sm text-[#4edea3] font-bold">CARTERA</span>
            </div>
            <span className="font-bold text-xs text-[#e1e2ec] block group-hover:text-[#4edea3] transition-colors">
              Simular Depósito
            </span>
            <span className="text-[10px] text-[#869397] line-clamp-1 mt-0.5">
              Transferencia confirmada
            </span>
          </button>

          {/* Simulate Gas Drop Alert */}
          <button
            onClick={() =>
              handleSimulateAlert(
                'gas',
                'Tarifas de Gas a 8 Gwei',
                'Red Ethereum en mínimo de 24h. Ideal para reclamar o mover activos.',
                'info'
              )
            }
            disabled={isSimulating !== null}
            className="p-3 rounded-2xl bg-[#4cd7f6]/10 hover:bg-[#4cd7f6]/20 border border-[#4cd7f6]/30 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <Fuel className="w-4 h-4 text-[#4cd7f6]" />
              <span className="text-[10px] font-code-sm text-[#4cd7f6] font-bold">GAS MEMPOOL</span>
            </div>
            <span className="font-bold text-xs text-[#e1e2ec] block group-hover:text-[#4cd7f6] transition-colors">
              Simular Gas Dip
            </span>
            <span className="text-[10px] text-[#869397] line-clamp-1 mt-0.5">
              Notificación de tarifa baja
            </span>
          </button>
        </div>
      </div>

      {/* Section 4: Registro de Notificaciones Recientes (Log) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#bcc9cd]" />
            <span className="font-bold text-xs text-[#e1e2ec]">Registro Reciente ({logs.length})</span>
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => {
                setLogs([]);
                onShowToast('Registro Limpiado', 'Historial de alertas vaciado con éxito.');
              }}
              className="text-[11px] text-[#ffb4ab] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#1d1f27] border border-[#272a32] text-center">
              <CheckCircle2 className="w-7 h-7 text-[#4edea3] mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-semibold text-[#e1e2ec]">Sin alertas pendientes</p>
              <p className="text-[11px] text-[#869397] mt-0.5">
                Todas las notificaciones y eventos de seguridad están al día.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#1d1f27] border border-[#3d494c]/30 flex items-start gap-3 transition-all hover:bg-[#272a32]"
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    log.severity === 'critical'
                      ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                      : log.severity === 'success'
                      ? 'bg-[#00a572]/20 text-[#4edea3]'
                      : 'bg-[#4cd7f6]/20 text-[#4cd7f6]'
                  }`}
                >
                  {log.type === 'security' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {log.type === 'wallet' && <Wallet className="w-3.5 h-3.5" />}
                  {log.type === 'gas' && <Fuel className="w-3.5 h-3.5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-semibold text-xs text-[#e1e2ec] truncate">{log.title}</h4>
                    <span className="text-[10px] text-[#869397] font-code-sm shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#bcc9cd] mt-0.5 leading-relaxed">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
