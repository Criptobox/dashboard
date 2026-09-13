import React from 'react';
import { ScreenTab } from '../types';
import { Sparkles } from 'lucide-react';
import { NAV_TABS } from '../data/navTabs';

interface DesktopNavProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  unclaimedCount?: number;
  readyAirdropsCount?: number;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  activeTab,
  onTabChange,
  unclaimedCount = 5,
  readyAirdropsCount = 2,
}) => {
  return (
    <nav className="hidden lg:block fixed top-16 inset-x-0 z-30 h-12 bg-[#10131a]/95 backdrop-blur-xl border-b border-[#272a32]/70">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center gap-1">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-semibold font-sans transition-all ${
                isActive
                  ? 'bg-[#272a32] text-[#4cd7f6]'
                  : 'text-[#869397] hover:text-[#e1e2ec] hover:bg-[#1d1f27]'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="w-4 h-4" />
                {tab.id === 'rescue' && unclaimedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#4edea3] ring-2 ring-[#10131a]" />
                )}
                {tab.id === 'alertas-ia' && (
                  <Sparkles className="absolute -top-1.5 -right-2 w-3 h-3 text-[#d0bcff]" />
                )}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'airdrops' && readyAirdropsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#00a572] text-[#002113] text-[9.5px] font-extrabold font-code-sm">
                  {readyAirdropsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
