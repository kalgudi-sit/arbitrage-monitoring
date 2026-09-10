import React, { useState } from 'react';
import { MarketQuote, UserSettings } from '../../types';
import { formatPair } from '../../exchanges/common/utils';
import { Plus, Trash2, TrendingUp, TrendingDown, Layers, Check, ExternalLink } from 'lucide-react';

interface Props {
  watchlist: string[];
  quotes: Record<string, { binance?: MarketQuote; bybit?: MarketQuote }>;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const POPULAR_SUGGESTIONS = ['PEPEUSDT', 'SUIUSDT', 'NEARUSDT', 'LINKUSDT', 'APTUSDT', 'INJUSDT', 'FETUSDT'];

export const WatchlistView: React.FC<Props> = ({
  watchlist,
  quotes,
  onAddSymbol,
  onRemoveSymbol,
}) => {
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = (symToAdd?: string) => {
    const raw = symToAdd || newSymbolInput;
    let clean = raw.toUpperCase().trim().replace(/[-_/]/g, '');
    if (!clean) return;
    if (!clean.endsWith('USDT') && !clean.endsWith('USDC')) {
      clean = `${clean}USDT`;
    }

    if (watchlist.includes(clean)) {
      setErrorMsg(`${clean} is already in your watchlist.`);
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }

    onAddSymbol(clean);
    setNewSymbolInput('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-4 p-4">
      {/* Add Symbol Input */}
      <div className="bg-slate-850/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            Add Pair to Watchlist
          </span>
          <span className="text-[10px] text-slate-400">Binance & Bybit Spot</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="e.g. SUI, LINK, PEPE (or BTCUSDT)"
            value={newSymbolInput}
            onChange={(e) => setNewSymbolInput(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 font-mono uppercase"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>

        {errorMsg && (
          <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
          <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">
            Popular:
          </span>
          {POPULAR_SUGGESTIONS.filter((s) => !watchlist.includes(s)).slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => handleAdd(s)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap font-mono"
            >
              +{s.replace('USDT', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Market Quotes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            Live Exchange Quotes ({watchlist.length})
          </span>
          <span className="text-[11px]">Binance vs Bybit</span>
        </div>

        {watchlist.map((symbol) => {
          const pairData = quotes[symbol] || {};
          const binance = pairData.binance;
          const bybit = pairData.bybit;

          const hasQuotes = binance && bybit;
          const priceDiff = hasQuotes
            ? ((bybit.bidPrice - binance.askPrice) / binance.askPrice) * 100
            : 0;

          return (
            <div
              key={symbol}
              className="rounded-xl border border-slate-800 bg-slate-850/80 p-3 space-y-2.5 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-100 font-mono">
                    {formatPair(symbol)}
                  </span>
                  {hasQuotes && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        Math.abs(priceDiff) >= 0.05
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Diff: {priceDiff >= 0 ? '+' : ''}
                      {priceDiff.toFixed(3)}%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onRemoveSymbol(symbol)}
                  title="Remove from watchlist"
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Binance Quote */}
                <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[10px] text-amber-400 uppercase">
                      Binance
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {binance ? `${binance.bidQty.toFixed(2)} / ${binance.askQty.toFixed(2)}` : 'waiting'}
                    </span>
                  </div>
                  {binance ? (
                    <div className="space-y-0.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Bid:</span>
                        <span className="text-emerald-400 font-semibold">
                          ${binance.bidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Ask:</span>
                        <span className="text-rose-400 font-semibold">
                          ${binance.askPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 animate-pulse block">
                      Connecting stream...
                    </span>
                  )}
                </div>

                {/* Bybit Quote */}
                <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[10px] text-cyan-400 uppercase">
                      Bybit
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {bybit ? `${bybit.bidQty.toFixed(2)} / ${bybit.askQty.toFixed(2)}` : 'waiting'}
                    </span>
                  </div>
                  {bybit ? (
                    <div className="space-y-0.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Bid:</span>
                        <span className="text-emerald-400 font-semibold">
                          ${bybit.bidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Ask:</span>
                        <span className="text-rose-400 font-semibold">
                          ${bybit.askPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 animate-pulse block">
                      Connecting stream...
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
