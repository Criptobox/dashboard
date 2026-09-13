import React from 'react';
import { ScreenTab } from '../types';
import { Sparkles } from 'lucide-react';
import { NAV_TABS } from '../data/navTabs';

interface BottomNavProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  unclaimedCount?: number;
  readyAirdropsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unclaimedCount = 5,
  readyAirdropsCount = 2,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#10131a]/95 backdrop-blur-xl border-t border-[#272a32]/80 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] lg:hidden">
      <div className="max-w-md md:max-w-2xl mx-auto flex justify-around items-center h-18 px-1">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] h-14 transition-all duration-200 rounded-xl px-0.5 ${
                isActive
                  ? 'text-[#4cd7f6] font-semibold scale-105'
                  : 'text-[#869397] hover:text-[#e1e2ec]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#4cd7f6]' : 'text-[#869397]'}`} />
                {tab.id === 'rescue' && unclaimedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#4edea3] ring-2 ring-[#10131a] animate-pulse" />
                )}
                {tab.id === 'airdrops' && readyAirdropsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[#00a572] text-[#002113] text-[9px] font-extrabold font-code-sm ring-1 ring-[#10131a] animate-bounce">
                    {readyAirdropsCount}
                  </span>
                )}
                {tab.id === 'alertas-ia' && (
                  <Sparkles className="absolute -top-1.5 -right-2 w-3 h-3 text-[#d0bcff]" />
                )}
              </div>
              <span className={`text-[9.5px] mt-1 font-sans tracking-tight ${isActive ? 'text-[#4cd7f6] font-bold' : 'text-[#869397]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
