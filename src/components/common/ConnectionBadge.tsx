import React from 'react';
import { ExchangeStatus } from '../../types';
import { RefreshCw, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  binanceStatus: ExchangeStatus;
  bybitStatus: ExchangeStatus;
  onReconnect: () => void;
}

export const ConnectionBadge: React.FC<Props> = ({ binanceStatus, bybitStatus, onReconnect }) => {
  const isAllConnected = binanceStatus.status === 'connected' && bybitStatus.status === 'connected';
  const isAnyConnecting = binanceStatus.status === 'connecting' || bybitStatus.status === 'connecting' || binanceStatus.status === 'reconnecting' || bybitStatus.status === 'reconnecting';

  return (
    <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 rounded-full px-3 py-1 text-xs">
      {/* Overall Market Indicator */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
        <span className="relative flex h-2 w-2">
          {isAllConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : isAnyConnecting ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span className="font-semibold text-slate-300">
          {isAllConnected ? 'Feeds Live' : isAnyConnecting ? 'Connecting' : 'Feed Alert'}
        </span>
      </div>

      {/* Binance Pill */}
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${binanceStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="text-slate-400">Binance</span>
        {binanceStatus.status === 'connected' && (
          <span className="font-mono text-[10px] text-slate-400">({binanceStatus.messagesReceived > 0 ? `${binanceStatus.messagesReceived}` : 'ws'})</span>
        )}
      </div>

      {/* Bybit Pill */}
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${bybitStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="text-slate-400">Bybit</span>
        {bybitStatus.latencyMs > 0 && (
          <span className="font-mono text-[10px] text-slate-400">{bybitStatus.latencyMs}ms</span>
        )}
      </div>

      {/* Reconnect button if disconnected */}
      {!isAllConnected && (
        <button
          onClick={onReconnect}
          title="Reconnect Feeds"
          className="ml-1 text-blue-400 hover:text-blue-300 transition-colors p-0.5"
        >
          <RefreshCw size={12} className={isAnyConnecting ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
};
