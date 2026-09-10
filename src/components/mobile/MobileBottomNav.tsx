import React from 'react';
import { Zap, BarChart2, Bell, Settings } from 'lucide-react';

export type ActiveTab = 'scanner' | 'markets' | 'alerts' | 'settings';

interface Props {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  actionableCount: number;
  alertCount: number;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  actionableCount,
  alertCount,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'scanner',
      label: 'Scanner',
      icon: <Zap size={20} />,
      badge: actionableCount > 0 ? actionableCount : undefined,
    },
    {
      id: 'markets',
      label: 'Markets',
      icon: <BarChart2 size={20} />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell size={20} />,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
