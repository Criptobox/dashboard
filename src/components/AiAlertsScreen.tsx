import React, { useState } from 'react';
import { AiAction, PushSentinel, TokenItem } from '../types';
import { TokenLogo } from './TokenLogo';
import { TokenPriceAlertModal } from './TokenPriceAlertModal';
import { PushNotificationBanner, PushNotificationData, playSentinelChime } from './PushNotificationBanner';
import { ContractRugScannerWidget } from './ContractRugScannerWidget';
import {
  Brain,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Fuel,
  Lock,
  Plus,
  Check,
  X,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  Bell,
  BellRing,
  Trash2,
  Zap,
  Volume2,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Settings,
} from 'lucide-react';

interface AiAlertsScreenProps {
  aiActions: AiAction[];
  pushSentinels: PushSentinel[];
  tokens?: TokenItem[];
  onToggleSentinel: (id: string) => void;
  onRevokeApprovals: (id: string) => void;
  onDepositAave: (id: string) => void;
  onShowPendingGasOps: () => void;
  onAddNewSentinel: (sentinel: Omit<PushSentinel, 'id'>) => void;
  onDeleteSentinel?: (id: string) => void;
  onTriggerSwap?: (tokenSymbol?: string) => void;
  onShowToast: (title: string, msg: string) => void;
  onOpenSettings?: () => void;
}

export const AiAlertsScreen: React.FC<AiAlertsScreenProps> = ({
  aiActions,
  pushSentinels,
  tokens = [],
  onToggleSentinel,
  onRevokeApprovals,
  onDepositAave,
  onShowPendingGasOps,
  onAddNewSentinel,
  onDeleteSentinel,
  onTriggerSwap,
  onShowToast,
  onOpenSettings,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showNewAlertModal, setShowNewAlertModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [activePushNotification, setActivePushNotification] = useState<PushNotificationData | null>(null);
  const [sentinelFilter, setSentinelFilter] = useState<'all' | 'tokens' | 'security'>('all');
  const [intelligenceTab, setIntelligenceTab] = useState<'scanner' | 'sentinels' | 'actions'>('scanner');
  const [notificationHistory, setNotificationHistory] = useState<PushNotificationData[]>([
    {
      id: 'init-1',
      title: 'Ethereum (ETH) > $3,300 Alcanzado',
      message: 'Precio cruzó umbral a $3,342.10 (+1.28% de desvío mempool). Notificación entregada.',
      tokenSymbol: 'ETH',
      timestamp: 'Hace 14 min',
    },
  ]);

  // Form state for basic custom rule
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<'price' | 'gas' | 'security'>('price');

  // Request browser notification permission
  const handleRequestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          playSentinelChime();
          onShowToast('Push Activadas', 'Recibirás avisos de Centinela en segundo plano.');
        } else {
          onShowToast('Permiso Denegado', 'Las alertas Push se mostrarán en la aplicación.');
        }
      } catch (err) {
        onShowToast('Aviso Push', 'Notificaciones activadas en modo aplicativo.');
      }
    } else {
      onShowToast('Aviso', 'Navegador sin soporte de Push web nativa. Usando Centinela In-App.');
    }
  };

  const triggerPushSentinelAlert = (title: string, message: string, tokenSymbol?: string) => {
    const newNotif: PushNotificationData = {
      id: `push-${Date.now()}`,
      title,
      message,
      tokenSymbol,
      timestamp: 'Ahora mismo',
    };
    setActivePushNotification(newNotif);
    setNotificationHistory((prev) => [newNotif, ...prev.slice(0, 4)]);
  };

  const handleSimulateSentinel = (s: PushSentinel) => {
    playSentinelChime();
    const conditionText = s.condition === 'below' ? 'cayó por debajo' : 'superó';
    const targetText = s.targetPrice ? `$${s.targetPrice.toLocaleString()}` : 'umbral establecido';
    triggerPushSentinelAlert(
      `🚨 ¡Push Sentinel: ${s.title}!`,
      `${s.tokenSymbol || 'Activo'} ${conditionText} de ${targetText}. Oráculo Pyth sincronizado.`,
      s.tokenSymbol
    );
    onShowToast('Disparo Simulado', `Alerta de ${s.title} emitida a dispositivos.`);
  };

  const handleAction = (action: AiAction) => {
    setProcessingId(action.id);
    if (action.type === 'security') {
      setTimeout(() => {
        setProcessingId(null);
        onRevokeApprovals(action.id);
        onShowToast(
          'Permisos Revocados',
          '3 Contratos de 2021 desautorizados en la mempool para USDC y USDT'
        );
      }, 1200);
    } else if (action.type === 'yield') {
      setTimeout(() => {
        setProcessingId(null);
        onDepositAave(action.id);
        onShowToast(
          'Depósito en Aave v3 Confirmado',
          '$8,450 USDC ahora generando 5.4% APY en Arbitrum One'
        );
      }, 1200);
    } else {
      setProcessingId(null);
      onShowPendingGasOps();
    }
  };

  const handleCreateCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddNewSentinel({
      title: newTitle,
      subtitle: `Objetivo: ${newTarget || 'En rango'}`,
      metaInfo: 'Disparador WebSocket',
      enabled: true,
      icon: newType,
      iconColor: newType === 'price' ? '#4cd7f6' : newType === 'gas' ? '#acedff' : '#ffb4ab',
      notificationChannel: 'websocket',
    });

    onShowToast('Nueva Alerta Creada', `${newTitle} activada en el motor centinela`);
    setNewTitle('');
    setNewTarget('');
    setShowNewAlertModal(false);
  };

  const secAction = aiActions.find((a) => a.id === 'sec-infinite-approvals');
  const isSecResolved = secAction?.completed;

  // Filter sentinels
  const filteredSentinels = pushSentinels.filter((s) => {
    if (sentinelFilter === 'tokens') {
      return !!s.tokenSymbol || s.icon === 'eth' || s.icon === 'sol' || s.icon === 'link';
    }
    if (sentinelFilter === 'security') {
      return s.icon === 'vault' || s.locked || s.icon === 'bayc';
    }
    return true;
  });

  return (
    <div className="pb-24 pt-2 flex flex-col gap-5">
      {/* Live Push Notification Banner */}
      <PushNotificationBanner
        notification={activePushNotification}
        onDismiss={() => setActivePushNotification(null)}
        onAction={() => {
          if (onTriggerSwap) {
            onTriggerSwap(activePushNotification?.tokenSymbol);
          }
        }}
      />

      {/* Screen Header Banner */}
      <div className="px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#191b23] via-[#1d1f27] to-[#10131a] border border-[#3d494c]/40 p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4cd7f6]/20 border border-[#4cd7f6]/40 flex items-center justify-center text-[#4cd7f6] shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-code-sm font-bold uppercase tracking-wider text-[#4cd7f6] bg-[#4cd7f6]/10 px-2 py-0.5 rounded-full border border-[#4cd7f6]/20">
                    Sentinel Engine v3.4
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
                </div>
                <h1 className="font-headline-md text-lg sm:text-xl text-[#e1e2ec] font-bold tracking-tight mt-0.5">
                  Centro de Inteligencia & Seguridad
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRequestPushPermission}
                title="Configurar Notificaciones Push"
                className="p-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#4cd7f6] transition-colors border border-[#3d494c]/30 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#4cd7f6]" />
                <span className="hidden sm:inline">Push Web</span>
              </button>

              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  title="Configuración de Notificaciones & Alertas"
                  className="p-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-[#4cd7f6] transition-colors border border-[#3d494c]/30 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#4cd7f6]" />
                  <span className="hidden sm:inline">Ajustes</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-[#bcc9cd] mt-2 leading-relaxed">
            Monitorización en tiempo real de mempools L1/L2, análisis de bytecode para detección de rug-pulls, oráculos descentralizados Pyth y centinelas push.
          </p>
        </div>
      </div>

      {/* INTELLIGENCE CENTER SUB-TABS */}
      <div className="px-4 lg:px-6">
        <div className="p-1.5 rounded-2xl bg-[#14161f] border border-[#272a32] flex items-center gap-1.5 shadow-inner">
          <button
            onClick={() => setIntelligenceTab('scanner')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              intelligenceTab === 'scanner'
                ? 'bg-gradient-to-r from-[#ff5449]/20 to-[#ff7966]/20 text-white border border-[#ff5449]/40 shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${intelligenceTab === 'scanner' ? 'text-[#ff5449]' : ''}`} />
            <span className="font-bold">Escáner Anti-Rugpull</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5449] animate-pulse" />
          </button>

          <button
            onClick={() => setIntelligenceTab('sentinels')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              intelligenceTab === 'sentinels'
                ? 'bg-[#272a32] text-[#4cd7f6] border border-[#3d494c]/40 shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${intelligenceTab === 'sentinels' ? 'text-[#4cd7f6]' : ''}`} />
            <span>Centinelas Push</span>
            <span className="text-[10px] font-code-sm px-1.5 py-0.2 rounded bg-[#10131a] text-[#4cd7f6]">
              {pushSentinels.filter((s) => s.enabled).length}
            </span>
          </button>

          <button
            onClick={() => setIntelligenceTab('actions')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              intelligenceTab === 'actions'
                ? 'bg-[#272a32] text-[#4edea3] border border-[#3d494c]/40 shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${intelligenceTab === 'actions' ? 'text-[#4edea3]' : ''}`} />
            <span>Acciones IA</span>
            <span className="text-[10px] font-code-sm px-1.5 py-0.2 rounded bg-[#10131a] text-[#4edea3]">
              3
            </span>
          </button>
        </div>
      </div>

      {/* RUG-PULL SCANNER TAB */}
      {intelligenceTab === 'scanner' && (
        <div className="px-4 lg:px-6">
          <ContractRugScannerWidget
            onShowToast={onShowToast}
            onOpenSwap={onTriggerSwap}
          />
        </div>
      )}

      {/* SECTION 1: AI AUTOMATIONS & OP PORTFOLIO */}
      {intelligenceTab === 'actions' && (
      <div className="px-4 lg:px-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold tracking-tight">
            Acciones Inteligentes Sugeridas
          </h2>
          <span className="text-xs font-code-sm text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-md border border-[#4edea3]/20">
            3 Detecciones
          </span>
        </div>

        {/* CARD 1: SECURITY ALERT */}
        {aiActions
          .filter((a) => a.type === 'security')
          .map((action) => (
            <div
              key={action.id}
              className={`relative overflow-hidden rounded-2xl p-4 shadow-md flex flex-col gap-3 transition-all border ${
                action.completed
                  ? 'bg-[#191b23] border-[#272a32] opacity-75'
                  : 'bg-[#1d1f27] border-[#ffb4ab]/40'
              }`}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  action.completed ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'
                }`}
              />
              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      action.completed
                        ? 'bg-[#4edea3]/15 border-[#4edea3]/30 text-[#4edea3]'
                        : 'bg-[#ba1a1a]/20 border-[#ffb4ab]/30 text-[#ffb4ab]'
                    }`}
                  >
                    {action.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold ${
                          action.completed ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                        }`}
                      >
                        {action.completed ? 'Riesgo Mitigado' : action.typeLabel}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#869397]" />
                      <span className="font-code-sm text-xs text-[#bcc9cd]">{action.chain}</span>
                    </div>
                    <h3 className="text-sm text-[#e1e2ec] font-bold leading-snug">{action.title}</h3>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full font-code-sm text-xs font-bold ${
                    action.completed
                      ? 'bg-[#4edea3]/20 text-[#4edea3]'
                      : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                  }`}
                >
                  {action.completed ? 'SEGURO' : action.metricBadge}
                </span>
              </div>

              <div className="pl-1 text-xs text-[#bcc9cd] leading-relaxed">
                {action.description}
              </div>

              <div className="mx-1 p-2.5 rounded-xl bg-[#191b23] border border-[#272a32] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-code-sm text-xs text-[#e1e2ec]">Exposición Total Estimada:</span>
                </div>
                <span
                  className={`font-code-md text-xs font-bold ${
                    action.completed ? 'text-[#869397] line-through' : 'text-[#ffb4ab]'
                  }`}
                >
                  {action.highlightVal}
                </span>
              </div>

              <button
                onClick={() => handleAction(action)}
                disabled={action.completed || processingId === action.id}
                className={`w-full mt-1 h-11 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                  action.completed
                    ? 'bg-[#272a32] text-[#4edea3] cursor-default border border-[#3d494c]/30'
                    : 'bg-[#ffb4ab] text-[#690005] hover:bg-[#ffdad6] active:scale-[0.98]'
                }`}
              >
                {processingId === action.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Revocando permisos en mempool...</span>
                  </>
                ) : action.completed ? (
                  <>
                    <Check className="w-4 h-4 text-[#4edea3]" />
                    <span>Permisos Revocados con Éxito</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{action.actionButtonText}</span>
                  </>
                )}
              </button>
            </div>
          ))}

        {/* CARD 2: DEFI YIELD */}
        {aiActions
          .filter((a) => a.type === 'yield')
          .map((action) => (
            <div
              key={action.id}
              className={`relative overflow-hidden rounded-2xl p-4 shadow-md flex flex-col gap-3 transition-all border ${
                action.completed
                  ? 'bg-[#191b23] border-[#272a32] opacity-75'
                  : 'bg-[#1d1f27] border-[#4edea3]/40'
              }`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4edea3]" />
              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00a572]/20 border border-[#4edea3]/30 text-[#4edea3] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-[#4edea3] font-bold">
                        {action.typeLabel}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#869397]" />
                      <span className="font-code-sm text-xs text-[#bcc9cd]">{action.chain}</span>
                    </div>
                    <h3 className="text-sm text-[#e1e2ec] font-bold leading-snug">{action.title}</h3>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] font-code-sm text-xs font-bold">
                  {action.metricBadge}
                </span>
              </div>

              <div className="pl-1 text-xs text-[#bcc9cd] leading-relaxed">
                {action.description}
              </div>

              <div className="mx-1 p-2.5 rounded-xl bg-[#191b23] border border-[#272a32] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4edea3]" />
                  <span className="text-xs text-[#bcc9cd]">Ganancia proyectada 30d:</span>
                </div>
                <span className="font-code-md text-xs text-[#4edea3] font-bold">{action.highlightVal}</span>
              </div>

              <button
                onClick={() => handleAction(action)}
                disabled={action.completed || processingId === action.id}
                className={`w-full mt-1 h-11 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                  action.completed
                    ? 'bg-[#272a32] text-[#4edea3] cursor-default border border-[#3d494c]/30'
                    : 'bg-[#4edea3] text-[#003824] hover:bg-[#6ffbbe] active:scale-[0.98]'
                }`}
              >
                {processingId === action.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enrutando fondos a Aave v3...</span>
                  </>
                ) : action.completed ? (
                  <>
                    <Check className="w-4 h-4 text-[#4edea3]" />
                    <span>$8,450 Generando 5.4% APY</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>{action.actionButtonText}</span>
                  </>
                )}
              </button>
            </div>
          ))}

        {/* CARD 3: GAS OPTIMIZATION */}
        {aiActions
          .filter((a) => a.type === 'gas')
          .map((action) => (
            <div
              key={action.id}
              className="relative overflow-hidden rounded-2xl bg-[#1d1f27] border border-[#4cd7f6]/40 p-4 shadow-md flex flex-col gap-3"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4cd7f6]" />
              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#06b6d4]/20 border border-[#4cd7f6]/30 text-[#4cd7f6] flex items-center justify-center shrink-0">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-[#4cd7f6] font-bold">
                        {action.typeLabel}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#869397]" />
                      <span className="font-code-sm text-xs text-[#bcc9cd]">{action.chain}</span>
                    </div>
                    <h3 className="text-sm text-[#e1e2ec] font-bold leading-snug">{action.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                  <span className="font-code-sm text-xs font-bold">{action.metricBadge}</span>
                </div>
              </div>

              <div className="pl-1 text-xs text-[#bcc9cd] leading-relaxed">
                {action.description}
              </div>

              <button
                onClick={() => handleAction(action)}
                className="w-full mt-1 h-11 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all border border-[#3d494c]/40"
              >
                <Layers className="w-4 h-4 text-[#4cd7f6]" />
                <span>{action.actionButtonText}</span>
              </button>
            </div>
          ))}
      </div>
      )}

      {/* SECCIÓN 2: CENTRO DE ALERTAS Y CENTINELAS PUSH */}
      {intelligenceTab === 'sentinels' && (
      <div className="px-4 lg:px-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-base text-[#e1e2ec] font-bold tracking-tight">
                Push Sentinel: Alertas por Token
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
            </div>
            <p className="text-xs text-[#bcc9cd]">Umbrales personalizados de precio y avisos en vivo</p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#272a32] text-[#4cd7f6] font-code-sm text-xs border border-[#4cd7f6]/30 font-bold">
            {pushSentinels.filter((s) => s.enabled).length} Activos
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => setShowPriceAlertModal(true)}
            className="h-13 py-3 px-4 rounded-xl bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#4edea3] text-[#003640] font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#4cd7f6]/20 active:scale-[0.98] transition-all hover:brightness-105"
          >
            <BellRing className="w-5 h-5" />
            <span>Configurar Alerta de Precio por Token</span>
          </button>

          <button
            onClick={() => setShowNewAlertModal(true)}
            className="h-13 py-3 px-4 rounded-xl bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ec] font-sans text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-[#3d494c]/50 transition-colors"
          >
            <Sliders className="w-4 h-4 text-[#4cd7f6]" />
            <span>+ Regla Libre / Centinela de Red</span>
          </button>
        </div>

        {/* SENTINEL FILTER TABS */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#14161f] border border-[#272a32]">
          <button
            onClick={() => setSentinelFilter('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold font-sans transition-all ${
              sentinelFilter === 'all'
                ? 'bg-[#272a32] text-[#4cd7f6] shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            Todos ({pushSentinels.length})
          </button>
          <button
            onClick={() => setSentinelFilter('tokens')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold font-sans transition-all ${
              sentinelFilter === 'tokens'
                ? 'bg-[#272a32] text-[#4edea3] shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            Precios de Tokens ({pushSentinels.filter((s) => !!s.tokenSymbol || s.icon === 'eth' || s.icon === 'sol').length})
          </button>
          <button
            onClick={() => setSentinelFilter('security')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold font-sans transition-all ${
              sentinelFilter === 'security'
                ? 'bg-[#272a32] text-[#d0bcff] shadow-sm'
                : 'text-[#869397] hover:text-[#bcc9cd]'
            }`}
          >
            Seguridad & Gas ({pushSentinels.filter((s) => s.icon === 'vault' || s.locked || s.icon === 'bayc').length})
          </button>
        </div>

        {/* Alert List Container */}
        <div className="rounded-2xl bg-[#1d1f27] border border-[#3d494c]/40 overflow-hidden shadow-lg flex flex-col">
          {filteredSentinels.map((s, idx) => {
            const hasTokenDetails = !!s.tokenSymbol;
            const isAbove = s.condition !== 'below';

            return (
              <div key={s.id}>
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#272a32]/50 transition-colors">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Token or Sentinel Icon */}
                    <div className="shrink-0 mt-0.5">
                      {s.tokenSymbol ? (
                        <TokenLogo symbol={s.tokenSymbol} size="md" />
                      ) : s.icon === 'eth' ? (
                        <TokenLogo symbol="ETH" size="md" />
                      ) : s.icon === 'sol' ? (
                        <TokenLogo symbol="SOL" size="md" />
                      ) : s.icon === 'bayc' ? (
                        <div className="w-10 h-10 rounded-full bg-[#d0bcff]/20 border border-[#d0bcff]/40 flex items-center justify-center text-[#d0bcff]">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#4edea3]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3]">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#e1e2ec] truncate">
                          {s.title}
                        </h4>

                        {/* Channel Badge */}
                        <span className="px-2 py-0.5 rounded-full bg-[#272a32] border border-[#3d494c]/30 text-[10px] font-code-sm text-[#bcc9cd] flex items-center gap-1">
                          {s.notificationChannel === 'websocket' ? (
                            <>
                              <Zap className="w-3 h-3 text-[#d0bcff]" />
                              <span>WebSocket</span>
                            </>
                          ) : s.notificationChannel === 'sound' ? (
                            <>
                              <Volume2 className="w-3 h-3 text-[#4edea3]" />
                              <span>Alarma</span>
                            </>
                          ) : (
                            <>
                              <Radio className="w-3 h-3 text-[#4cd7f6]" />
                              <span>Push</span>
                            </>
                          )}
                        </span>

                        {s.enabled ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-code-sm bg-[#4edea3]/15 text-[#4edea3] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                            En vivo
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-code-sm bg-[#272a32] text-[#869397]">
                            Pausada
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#bcc9cd] mt-1 flex-wrap">
                        <span className="font-code-sm text-xs">{s.subtitle}</span>
                        <span className="w-1 h-1 rounded-full bg-[#869397]" />
                        <span
                          className={`font-code-sm text-xs font-semibold ${
                            isAbove ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                          }`}
                        >
                          {s.metaInfo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Switch */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#272a32]/60">
                    {/* Test Trigger Button */}
                    <button
                      type="button"
                      onClick={() => handleSimulateSentinel(s)}
                      title="Probar notificación de Push Sentinel ahora"
                      className="h-8 px-2.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#4cd7f6] hover:text-[#e1e2ec] font-code-sm text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-[#3d494c]/30"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      <span>Probar</span>
                    </button>

                    {/* Delete button (for non-locked alerts) */}
                    {!s.locked && onDeleteSentinel && (
                      <button
                        type="button"
                        onClick={() => onDeleteSentinel(s.id)}
                        title="Eliminar regla"
                        className="w-8 h-8 rounded-lg bg-[#272a32] hover:bg-[#ba1a1a]/20 text-[#869397] hover:text-[#ffb4ab] flex items-center justify-center transition-colors border border-[#3d494c]/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Switch button */}
                    {s.locked ? (
                      <div className="flex items-center gap-1.5 pl-1">
                        <Lock className="w-4 h-4 text-[#869397]" />
                        <div className="w-11 h-6 bg-[#4edea3] rounded-full relative p-0.5 cursor-not-allowed opacity-90">
                          <div className="w-5 h-5 rounded-full bg-[#10131a] shadow-sm transform translate-x-5 flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#4edea3]" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onToggleSentinel(s.id);
                          onShowToast(
                            s.enabled ? 'Alerta pausada' : 'Alerta activada',
                            s.title
                          );
                        }}
                        className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none shrink-0 ${
                          s.enabled ? 'bg-[#4cd7f6]' : 'bg-[#32353d]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-[#10131a] shadow-sm transform transition-transform flex items-center justify-center ${
                            s.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {s.enabled ? (
                            <Check className="w-3 h-3 text-[#4cd7f6]" />
                          ) : (
                            <X className="w-3 h-3 text-[#869397]" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
                {idx < filteredSentinels.length - 1 && <div className="h-[1px] bg-[#272a32] mx-3" />}
              </div>
            );
          })}
        </div>

        {/* RECENT NOTIFICATIONS LOG */}
        <div className="rounded-2xl bg-[#14161f] border border-[#272a32] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4cd7f6]" />
              <h3 className="font-headline-sm text-xs font-bold text-[#e1e2ec] uppercase tracking-wider">
                Historial de Push Sentinel Recientes
              </h3>
            </div>
            <span className="text-[10px] font-code-sm text-[#869397]">Canal Encriptado</span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {notificationHistory.map((notif) => (
              <div
                key={notif.id}
                className="p-2.5 rounded-xl bg-[#191b23] border border-[#272a32] flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {notif.tokenSymbol ? (
                    <div className="shrink-0 mt-0.5">
                      <TokenLogo symbol={notif.tokenSymbol} size="sm" />
                    </div>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6] mt-1.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-[#e1e2ec] block truncate">{notif.title}</span>
                    <span className="text-[11px] text-[#bcc9cd] block leading-snug">{notif.message}</span>
                  </div>
                </div>
                <span className="font-code-sm text-[10px] text-[#869397] shrink-0">{notif.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Modal 1: Dedicated Token Price Alert Configurator */}
      <TokenPriceAlertModal
        isOpen={showPriceAlertModal}
        onClose={() => setShowPriceAlertModal(false)}
        tokens={tokens}
        onSaveAlert={(newSentinel) => {
          onAddNewSentinel(newSentinel);
          // Also schedule or trigger a notification preview
          triggerPushSentinelAlert(
            `Centinela Activado: ${newSentinel.title}`,
            `Monitoreando mempool en tiempo real. Recibirás aviso Push cuando alcance el umbral.`,
            newSentinel.tokenSymbol
          );
        }}
        onTestNotification={(title, subtitle, tokenSymbol) => {
          triggerPushSentinelAlert(title, subtitle, tokenSymbol);
        }}
        onShowToast={onShowToast}
      />

      {/* Modal 2: General / Freeform Sentinel Rule Modal */}
      {showNewAlertModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b0e15]/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateCustomAlert}
            className="w-full max-w-md bg-[#1d1f27] border border-[#3d494c]/60 rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#272a32]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#4cd7f6]" />
                <h3 className="font-headline-sm text-base text-[#e1e2ec] font-bold">Crear Regla de Centinela</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAlertModal(false)}
                className="w-8 h-8 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Nombre de la Alerta
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ej: Arbitrum Gas > 35 Gwei"
                className="bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2.5 text-sm text-[#e1e2ec] focus:outline-none focus:border-[#4cd7f6]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Tipo de Monitoreo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['price', 'gas', 'security'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase font-code-sm transition-all ${
                      newType === type
                        ? 'bg-[#4cd7f6] text-[#003640] font-bold'
                        : 'bg-[#191b23] text-[#bcc9cd] border border-[#272a32]'
                    }`}
                  >
                    {type === 'price' ? 'Precio' : type === 'gas' ? 'Gas Gwei' : 'Seguridad'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-code-sm uppercase tracking-wider text-[#bcc9cd]">
                Condición / Umbral
              </label>
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="ej: +5% en 1 hora"
                className="bg-[#191b23] border border-[#272a32] rounded-xl px-3 py-2.5 text-sm text-[#e1e2ec] focus:outline-none focus:border-[#4cd7f6]"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 h-12 rounded-xl bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Regla Push</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
