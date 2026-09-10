import React from 'react';
import { OpportunityStatus } from '../../types';
import { Clock, Zap, AlertTriangle, WifiOff } from 'lucide-react';

interface Props {
  status: OpportunityStatus;
  freshnessMs: number;
}

export const FreshnessIndicator: React.FC<Props> = ({ status, freshnessMs }) => {
  if (status === 'DISCONNECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/70 text-rose-300 border border-rose-800/60">
        <WifiOff size={11} />
        <span>Disconnected</span>
      </span>
    );
  }

  if (status === 'STALE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/60 text-red-300 border border-red-800/60">
        <AlertTriangle size={11} />
        <span>Stale • {(freshnessMs / 1000).toFixed(1)}s</span>
      </span>
    );
  }

  if (status === 'AGING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
        <Clock size={11} />
        <span>Aging • {(freshnessMs / 1000).toFixed(1)}s</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
      <Zap size={11} className="text-emerald-400" />
      <span>Live • {freshnessMs}ms</span>
    </span>
  );
};
