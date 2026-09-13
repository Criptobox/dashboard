import React, { useEffect } from 'react';
import { TokenLogo } from './TokenLogo';
import {
  Bell,
  X,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export interface PushNotificationData {
  id: string;
  title: string;
  message: string;
  tokenSymbol?: string;
  timestamp: string;
}

interface PushNotificationBannerProps {
  notification: PushNotificationData | null;
  onDismiss: () => void;
  onAction?: () => void;
}

// Synthesize pleasant cybernetic two-tone notification ping using Web Audio API
export const playSentinelChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // Audio context may be restricted before user interaction
  }
};

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  useEffect(() => {
    if (notification) {
      playSentinelChime();

      // Native browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        } catch (e) {
          // ignore
        }
      }

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-[#10131a]/95 backdrop-blur-xl border border-[#4cd7f6]/50 p-4 shadow-2xl shadow-[#4cd7f6]/15 flex flex-col gap-2.5">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4cd7f6] via-[#4edea3] to-[#d0bcff]" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {notification.tokenSymbol ? (
              <div className="relative shrink-0 mt-0.5">
                <TokenLogo symbol={notification.tokenSymbol} size="md" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#4edea3] flex items-center justify-center text-[10px] text-[#003824] font-bold">
                  ✓
                </span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#4cd7f6]/20 border border-[#4cd7f6]/40 flex items-center justify-center text-[#4cd7f6] shrink-0 mt-0.5">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/20 text-[#4cd7f6] font-code-sm text-[10px] font-bold uppercase tracking-wider">
                  Push Sentinel
                </span>
                <span className="text-[10px] font-code-sm text-[#869397]">
                  {notification.timestamp}
                </span>
              </div>
              <h4 className="font-sans text-xs sm:text-sm font-bold text-[#e1e2ec] mt-1 leading-snug">
                {notification.title}
              </h4>
              <p className="text-xs text-[#bcc9cd] mt-0.5 leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-[#272a32] flex items-center justify-center text-[#bcc9cd] hover:text-[#e1e2ec] shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action button in toast */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#272a32]">
          {onAction && (
            <button
              onClick={() => {
                onAction();
                onDismiss();
              }}
              className="flex-1 h-8 rounded-lg bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ejecutar Acción / Swap</span>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="px-3 h-8 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
