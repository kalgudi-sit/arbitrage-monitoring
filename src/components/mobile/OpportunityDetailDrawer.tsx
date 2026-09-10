import React from 'react';
import { ArbitrageOpportunity, UserSettings } from '../../types';
import { formatPair } from '../../exchanges/common/utils';
import { FreshnessIndicator } from '../common/FreshnessIndicator';
import {
  X,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Clock,
  DollarSign,
  Layers,
  Scale,
  Percent,
} from 'lucide-react';

interface Props {
  opportunity: ArbitrageOpportunity | null;
  settings: UserSettings;
  onClose: () => void;
}

export const OpportunityDetailDrawer: React.FC<Props> = ({ opportunity, settings, onClose }) => {
  if (!opportunity) return null;

  const binanceUrl = `https://www.binance.com/en/trade/${opportunity.baseAsset}_${opportunity.quoteAsset}?type=spot`;
  const bybitUrl = `https://www.bybit.com/en/trade/spot/${opportunity.baseAsset}/${opportunity.quoteAsset}`;

  const buyUrl = opportunity.buyExchange === 'binance' ? binanceUrl : bybitUrl;
  const sellUrl = opportunity.sellExchange === 'binance' ? binanceUrl : bybitUrl;

  const buyFeeRate = opportunity.buyExchange === 'binance' ? settings.binanceFeePercent : settings.bybitFeePercent;
  const sellFeeRate = opportunity.sellExchange === 'binance' ? settings.binanceFeePercent : settings.bybitFeePercent;
  const totalFees = buyFeeRate + sellFeeRate;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-lg text-white">
              {formatPair(opportunity.symbol)}
            </span>
            <FreshnessIndicator status={opportunity.status} freshnessMs={opportunity.freshnessMs} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Visual Execution Flow */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Actionable Trade Route
            </span>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {/* Buy Side */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                  1. BUY (ASK)
                </span>
                <span className="text-xs font-bold text-slate-200 uppercase block">
                  {opportunity.buyExchange}
                </span>
                <span className="font-mono text-base font-bold text-white block mt-0.5">
                  ${opportunity.buyAsk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-1">
                  Qty: {opportunity.buyQty.toFixed(4)}
                </span>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center px-1">
                <div className="p-1.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40">
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* Sell Side */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-rose-500/30 text-right">
                <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                  2. SELL (BID)
                </span>
                <span className="text-xs font-bold text-slate-200 uppercase block">
                  {opportunity.sellExchange}
                </span>
                <span className="font-mono text-base font-bold text-white block mt-0.5">
                  ${opportunity.sellBid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-1">
                  Qty: {opportunity.sellQty.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-700/60">
              <a
                href={buyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                <span>Open {opportunity.buyExchange.toUpperCase()} Spot</span>
                <ExternalLink size={12} />
              </a>
              <a
                href={sellUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                <span>Open {opportunity.sellExchange.toUpperCase()} Spot</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Mathematical Cost & Net Breakdown Waterfall */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Spread & Execution Waterfall
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Percent size={13} className="text-blue-400" />
                  Gross Price Difference
                </span>
                <span className="font-mono font-bold text-white">
                  +{opportunity.grossSpreadPercent.toFixed(3)}%
                  <span className="text-slate-400 ml-1 font-normal">
                    (${opportunity.grossSpreadAbsolute.toFixed(2)})
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="pl-5">
                  - Buy Fee ({opportunity.buyExchange.toUpperCase()})
                </span>
                <span className="font-mono text-rose-400">
                  -{buyFeeRate.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="pl-5">
                  - Sell Fee ({opportunity.sellExchange.toUpperCase()})
                </span>
                <span className="font-mono text-rose-400">
                  -{sellFeeRate.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="pl-5">- Estimated Slippage buffer</span>
                <span className="font-mono text-amber-400">
                  -{settings.slippagePercent.toFixed(2)}%
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-200">Estimated Net Opportunity</span>
                <span
                  className={`font-mono text-base ${
                    opportunity.estimatedNetSpreadPercent > 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {opportunity.estimatedNetSpreadPercent > 0 ? '+' : ''}
                  {opportunity.estimatedNetSpreadPercent.toFixed(3)}%
                </span>
              </div>
            </div>
          </div>

          {/* Volume & Capital Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Layers size={13} className="text-blue-400" />
                <span>Max Executable Vol</span>
              </div>
              <span className="font-mono text-base font-bold text-white">
                {opportunity.maxVolume.toFixed(4)} {opportunity.baseAsset}
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Limited by lower orderbook side
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <DollarSign size={13} className="text-emerald-400" />
                <span>Capital Required</span>
              </div>
              <span className="font-mono text-base font-bold text-white">
                ${Math.round(opportunity.capitalRequired).toLocaleString()}
              </span>
              <span className="block text-[11px] text-emerald-400 mt-0.5">
                Est. Net: ${opportunity.estimatedNetProfitUsd.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Freshness & Latency Diagnostics */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span>Data Freshness Age:</span>
              <span className="text-slate-200 font-semibold">{opportunity.freshnessMs} ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Opportunity First Detected:</span>
              <span className="text-slate-200">{new Date(opportunity.detectedAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Exchange Event:</span>
              <span className="text-slate-200">{new Date(opportunity.lastUpdatedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Risk Reality Notice (PRD Requirement) */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <ShieldAlert size={14} />
              <span>Execution Reality & Disclaimers</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              This system is a market monitoring detector. Estimated net spread is potential, not guaranteed profit. Real-world execution is subject to transfer latency, order book depth changes, slippage, and exchange withdrawal limits.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
