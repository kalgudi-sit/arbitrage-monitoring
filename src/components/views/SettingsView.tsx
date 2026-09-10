import React from 'react';
import { UserSettings, ExchangeStatus } from '../../types';
import { RefreshCw, Server, Cpu, ShieldCheck, RotateCcw, Activity } from 'lucide-react';

interface Props {
  settings: UserSettings;
  binanceStatus: ExchangeStatus;
  bybitStatus: ExchangeStatus;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onReconnect: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  binanceStatus,
  bybitStatus,
  onUpdateSettings,
  onReconnect,
}) => {
  const handleResetDefaults = () => {
    onUpdateSettings({
      minGrossSpreadThreshold: 0.02,
      minNetSpreadThreshold: 0.0,
      alertNetSpreadThreshold: 0.15,
      binanceFeePercent: 0.10,
      bybitFeePercent: 0.10,
      slippagePercent: 0.05,
      soundAlertsEnabled: true,
      alertCooldownSeconds: 20,
      freshnessLiveThresholdMs: 1500,
      freshnessAgingThresholdMs: 4000,
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Exchange Connectivity & Diagnostics */}
      <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-blue-400" />
            <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
              Exchange WebSocket Feeds
            </h3>
          </div>
          <button
            onClick={onReconnect}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            <RefreshCw size={12} />
            <span>Reconnect All</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Binance */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Binance</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  binanceStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Status:</span>
              <span className="capitalize text-slate-200">{binanceStatus.status}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Messages:</span>
              <span className="font-mono text-slate-200">{binanceStatus.messagesReceived}</span>
            </div>
          </div>

          {/* Bybit */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">Bybit</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  bybitStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Status:</span>
              <span className="capitalize text-slate-200">{bybitStatus.status}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Ping RTT:</span>
              <span className="font-mono text-slate-200">{bybitStatus.latencyMs} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee & Slippage Model */}
      <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
          Execution Fee & Cost Assumptions
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-slate-300">Binance Spot Fee (%)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.binanceFeePercent}
                onChange={(e) => onUpdateSettings({ binanceFeePercent: parseFloat(e.target.value) || 0 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-300">Bybit Spot Fee (%)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.bybitFeePercent}
                onChange={(e) => onUpdateSettings({ bybitFeePercent: parseFloat(e.target.value) || 0 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-300">Estimated Slippage Buffer (%)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={settings.slippagePercent}
                onChange={(e) => onUpdateSettings({ slippagePercent: parseFloat(e.target.value) || 0 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Freshness & Threshold Tuning */}
      <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
          Data Freshness & Display Cutoffs
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-slate-300">Min. Gross Spread to Surface (%)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.minGrossSpreadThreshold}
                onChange={(e) => onUpdateSettings({ minGrossSpreadThreshold: parseFloat(e.target.value) || 0 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-300">Live Status Window (ms)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="250"
                min="500"
                max="5000"
                value={settings.freshnessLiveThresholdMs}
                onChange={(e) => onUpdateSettings({ freshnessLiveThresholdMs: parseInt(e.target.value) || 1500 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-300">Stale Data Threshold (ms)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="500"
                min="1000"
                max="10000"
                value={settings.freshnessAgingThresholdMs}
                onChange={(e) => onUpdateSettings({ freshnessAgingThresholdMs: parseInt(e.target.value) || 4000 })}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-right font-mono text-white"
              />
              <span className="text-slate-400">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Defaults Button */}
      <div className="pt-2">
        <button
          onClick={handleResetDefaults}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset All Settings to Factory Defaults</span>
        </button>
      </div>

      {/* App Principle Footer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-slate-400 text-xs space-y-1">
        <span className="font-bold text-slate-300 block">
          Truthful Market Data Principle
        </span>
        <p className="text-[11px] leading-relaxed">
          MVP 1 connects directly to Binance and Bybit public WebSocket feeds. Zero simulated or fabricated prices. In case of network interruption, prices are marked STALE or DISCONNECTED immediately.
        </p>
      </div>
    </div>
  );
};
