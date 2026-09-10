import React from 'react';
import { ExchangeStatus } from '../../types';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { Volume2, VolumeX, Smartphone, Monitor, RefreshCw, Zap } from 'lucide-react';

interface Props {
  binanceStatus: ExchangeStatus;
  bybitStatus: ExchangeStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isPhoneFrame: boolean;
  onToggleFrame: () => void;
  onReconnect: () => void;
  activeOpportunitiesCount: number;
}

export const MobileHeader: React.FC<Props> = ({
  binanceStatus,
  bybitStatus,
  soundEnabled,
  onToggleSound,
  isPhoneFrame,
  onToggleFrame,
  onReconnect,
  activeOpportunitiesCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        {/* Logo and Live Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/20">
            <Zap size={18} className="fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-100 tracking-tight leading-none">
                Arbitrage Tracker
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                MVP 1
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span>Spot Arbitrage</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{activeOpportunitiesCount} active pairs</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Chime alerts enabled' : 'Chime alerts muted'}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Phone Shell / Desktop View Toggle */}
          <button
            onClick={onToggleFrame}
            title={isPhoneFrame ? 'Expand to Full View' : 'Switch to Mobile Frame'}
            className="hidden sm:flex p-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isPhoneFrame ? <Monitor size={16} /> : <Smartphone size={16} />}
          </button>

          {/* Reconnect */}
          <button
            onClick={onReconnect}
            title="Refresh Feeds"
            className="p-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Sub Header / Connection Diagnostics bar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
        <ConnectionBadge
          binanceStatus={binanceStatus}
          bybitStatus={bybitStatus}
          onReconnect={onReconnect}
        />
        <div className="text-[10px] text-slate-400 font-mono">
          <span>Real WS Feeds</span>
        </div>
      </div>
    </header>
  );
};
