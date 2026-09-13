import { Wallet, ShieldAlert, Radar, Layers, Bell, Settings, LucideIcon } from 'lucide-react';
import { ScreenTab } from '../types';

export interface NavTabConfig {
  id: ScreenTab;
  label: string;
  icon: LucideIcon;
}

export const NAV_TABS: NavTabConfig[] = [
  { id: 'dashboard', label: 'Bóveda', icon: Wallet },
  { id: 'rescue', label: 'Rescate', icon: ShieldAlert },
  { id: 'airdrops', label: 'Airdrops', icon: Radar },
  { id: 'nfts', label: 'NFTs', icon: Layers },
  { id: 'alertas-ia', label: 'IA & Alertas', icon: Bell },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];
