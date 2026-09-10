import React from 'react';
import { ArbitrageOpportunity } from '../../types';
import { FreshnessIndicator } from '../common/FreshnessIndicator';
import { SpreadPill } from '../common/SpreadPill';
import { formatPair } from '../../exchanges/common/utils';
import { ArrowRight, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  opportunity: ArbitrageOpportunity;
  onSelect: (opp: ArbitrageOpportunity) => void;
}

export const OpportunityCard: React.FC<Props> = ({ opportunity, onSelect }) => {
  const isActionable = opportunity.isActionable;
  const isNetPositive = opportunity.estimatedNetSpreadPercent > 0;

  const buyExchangeLabel = opportunity.buyExchange.toUpperCase();
  const sellExchangeLabel = opportunity.sellExchange.toUpperCase();

  const buyColor = opportunity.buyExchange === 'binance' ? 'text-amber-400 bg-amber-950/40 border-amber-800/50' : 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50';
  const sellColor = opportunity.sellExchange === 'binance' ? 'text-amber-400 bg-amber-950/40 border-amber-800/50' : 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50';

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className={`relative rounded-xl border p-3.5 transition-all cursor-pointer select-none active:scale-[0.99] ${
        isActionable
          ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm hover:border-emerald-400/60'
          : isNetPositive
          ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
          : 'bg-slate-850/40 border-slate-800/80 opacity-85 hover:border-slate-700'
      }`}
    >
      {/* Top Bar: Symbol + Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base text-slate-100 tracking-tight">
            {formatPair(opportunity.symbol)}
          </span>
          {isActionable && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 size={10} /> Actionable
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <FreshnessIndicator status={opportunity.status} freshnessMs={opportunity.freshnessMs} />
          <ChevronRight size={16} className="text-slate-500" />
        </div>
      </div>

      {/* Trade Route Flow */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50 mb-3">
        {/* Buy Side */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400">BUY</span>
            <span className={`text-[10px] font-bold px-1 py-0.2 rounded border ${buyColor}`}>
              {buyExchangeLabel}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold text-slate-100">
            ${opportunity.buyAsk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Vol: {opportunity.buyQty.toFixed(3)} {opportunity.baseAsset}
          </span>
        </div>

        {/* Direction Arrow */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="p-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Sell Side */}
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-1 mb-1">
            <span className={`text-[10px] font-bold px-1 py-0.2 rounded border ${sellColor}`}>
              {sellExchangeLabel}
            </span>
            <span className="text-[10px] uppercase font-bold text-rose-400">SELL</span>
          </div>
          <span className="font-mono text-sm font-semibold text-slate-100">
            ${opportunity.sellBid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Vol: {opportunity.sellQty.toFixed(3)} {opportunity.baseAsset}
          </span>
        </div>
      </div>

      {/* Bottom Summary Strip */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-xs">
        <SpreadPill
          grossSpreadPercent={opportunity.grossSpreadPercent}
          netSpreadPercent={opportunity.estimatedNetSpreadPercent}
          direction={opportunity.spreadDirection}
        />

        <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
          <span>Max:</span>
          <span className="text-slate-200 font-medium">
            {opportunity.maxVolume.toFixed(3)} {opportunity.baseAsset}
          </span>
          <span className="text-slate-500">
            (~${Math.round(opportunity.capitalRequired).toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};
