import React from 'react';
import { AlertLogItem, UserSettings } from '../../types';
import { formatPair } from '../../exchanges/common/utils';
import { Bell, Volume2, VolumeX, ShieldAlert, Trash2, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

interface Props {
  alertLogs: AlertLogItem[];
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onClearHistory: () => void;
}

export const AlertsView: React.FC<Props> = ({
  alertLogs,
  settings,
  onUpdateSettings,
  onRequestNotificationPermission,
  onClearHistory,
}) => {
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permissionState = isNotificationSupported ? Notification.permission : 'unsupported';

  return (
    <div className="space-y-4 p-4">
      {/* Configuration Box */}
      <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
          Alert Rules & Notification Setup
        </h3>

        {/* Browser Notifications Permission */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-750">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                Browser Push Alerts
              </span>
              <span className="text-[11px] text-slate-400 block">
                {permissionState === 'granted'
                  ? 'Permission granted • Desktop notifications active'
                  : permissionState === 'denied'
                  ? 'Permission blocked in browser settings'
                  : 'Receive push alerts even if tab is in background'}
              </span>
            </div>
          </div>

          {permissionState !== 'granted' ? (
            <button
              onClick={onRequestNotificationPermission}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap transition-colors"
            >
              Enable
            </button>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
              <CheckCircle2 size={14} /> Active
            </span>
          )}
        </div>

        {/* Audio Chime Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-750">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              {settings.soundAlertsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                In-App Audio Chime
              </span>
              <span className="text-[11px] text-slate-400 block">
                Synthesizes instant pleasant tone upon detection
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundAlertsEnabled}
              onChange={(e) => onUpdateSettings({ soundAlertsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Threshold Slider */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-750">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Trigger Threshold (Net Spread)</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              &gt;= +{settings.alertNetSpreadThreshold.toFixed(2)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.50"
            step="0.05"
            value={settings.alertNetSpreadThreshold}
            onChange={(e) => onUpdateSettings({ alertNetSpreadThreshold: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.05% (Aggressive)</span>
            <span>0.20% (Balanced)</span>
            <span>1.00%+ (High Value)</span>
          </div>
        </div>

        {/* Cooldown Settings */}
        <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-900 border border-slate-750">
          <div>
            <span className="font-semibold text-slate-200 block">Alert Cooldown</span>
            <span className="text-[10px] text-slate-400 block">
              Anti-spam window per pair
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <input
              type="number"
              min="5"
              max="300"
              value={settings.alertCooldownSeconds}
              onChange={(e) => onUpdateSettings({ alertCooldownSeconds: parseInt(e.target.value) || 20 })}
              className="w-16 bg-slate-850 border border-slate-750 rounded px-2 py-1 text-right text-xs text-white"
            />
            <span className="text-slate-400 text-xs">sec</span>
          </div>
        </div>
      </div>

      {/* Alert History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-300">
            Trigger History Log ({alertLogs.length})
          </span>
          {alertLogs.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Clear Log
            </button>
          )}
        </div>

        {alertLogs.length > 0 ? (
          <div className="space-y-2">
            {alertLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-850/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-100 font-mono">
                    {formatPair(log.symbol)}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                    +{log.netSpreadPercent.toFixed(3)}% Net
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300 text-[11px] font-mono">
                  <span>
                    Buy {log.buyExchange.toUpperCase()}: ${log.buyPrice.toLocaleString()}
                  </span>
                  <ArrowRight size={12} className="text-slate-500" />
                  <span>
                    Sell {log.sellExchange.toUpperCase()}: ${log.sellPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Gross: +{log.grossSpreadPercent.toFixed(3)}%</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
            <Zap size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">
              No alert triggers recorded yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Alerts will log here whenever a live net spread exceeds your +{settings.alertNetSpreadThreshold.toFixed(2)}% threshold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
