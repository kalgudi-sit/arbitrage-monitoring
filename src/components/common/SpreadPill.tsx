import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  grossSpreadPercent: number;
  netSpreadPercent: number;
  direction?: 'widened' | 'narrowed' | 'steady';
  compact?: boolean;
}

export const SpreadPill: React.FC<Props> = ({
  grossSpreadPercent,
  netSpreadPercent,
  direction,
  compact = false,
}) => {
  const isPositiveNet = netSpreadPercent > 0;
  const isPositiveGross = grossSpreadPercent > 0;

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {/* Estimated Net Spread */}
      <div
        className={`inline-flex items-center gap-1 font-mono font-bold rounded px-2 py-0.5 ${
          compact ? 'text-xs' : 'text-sm'
        } ${
          isPositiveNet
            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
            : isPositiveGross
            ? 'bg-amber-950/50 text-amber-300 border border-amber-600/40'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}
      >
        {direction === 'widened' ? (
          <TrendingUp size={13} className="text-emerald-400" />
        ) : direction === 'narrowed' ? (
          <TrendingDown size={13} className="text-amber-400" />
        ) : (
          <Minus size={11} className="text-slate-500" />
        )}
        <span>
          {isPositiveNet ? '+' : ''}
          {netSpreadPercent.toFixed(3)}%
        </span>
        <span className="text-[10px] font-normal tracking-wide opacity-80 uppercase">
          Net
        </span>
      </div>

      {/* Gross Spread (Subtle) */}
      {!compact && (
        <span className="text-xs font-mono text-slate-400">
          Gross: {isPositiveGross ? '+' : ''}
          {grossSpreadPercent.toFixed(3)}%
        </span>
      )}
    </div>
  );
};
