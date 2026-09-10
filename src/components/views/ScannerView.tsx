import React, { useState, useMemo } from 'react';
import { ArbitrageOpportunity, UserSettings } from '../../types';
import { OpportunityCard } from '../mobile/OpportunityCard';
import { Search, Filter, ArrowUpDown, Zap, CheckCircle2, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface Props {
  opportunities: ArbitrageOpportunity[];
  settings: UserSettings;
  onSelectOpportunity: (opp: ArbitrageOpportunity) => void;
  onReconnect: () => void;
}

type FilterType = 'all' | 'actionable' | 'above_05' | 'above_10' | 'live_only';
type SortType = 'net_spread_desc' | 'gross_spread_desc' | 'freshness_asc' | 'symbol_asc';

export const ScannerView: React.FC<Props> = ({
  opportunities,
  settings,
  onSelectOpportunity,
  onReconnect,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('net_spread_desc');

  // Filter & Sort
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      list = list.filter((o) => o.symbol.includes(q) || o.baseAsset.includes(q));
    }

    // Filter type
    if (filter === 'actionable') {
      list = list.filter((o) => o.isActionable);
    } else if (filter === 'above_05') {
      list = list.filter((o) => o.grossSpreadPercent >= 0.05);
    } else if (filter === 'above_10') {
      list = list.filter((o) => o.grossSpreadPercent >= 0.10);
    } else if (filter === 'live_only') {
      list = list.filter((o) => o.status === 'LIVE');
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'net_spread_desc') {
        return b.estimatedNetSpreadPercent - a.estimatedNetSpreadPercent;
      }
      if (sortBy === 'gross_spread_desc') {
        return b.grossSpreadPercent - a.grossSpreadPercent;
      }
      if (sortBy === 'freshness_asc') {
        return a.freshnessMs - b.freshnessMs;
      }
      if (sortBy === 'symbol_asc') {
        return a.symbol.localeCompare(b.symbol);
      }
      return 0;
    });

    return list;
  }, [opportunities, filter, searchQuery, sortBy]);

  // Key stats
  const actionableCount = opportunities.filter((o) => o.isActionable).length;
  const topNetSpread = opportunities.reduce(
    (max, o) => Math.max(max, o.estimatedNetSpreadPercent),
    0
  );
  const avgFreshness = opportunities.length
    ? Math.round(
        opportunities.reduce((sum, o) => sum + o.freshnessMs, 0) / opportunities.length
      )
    : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 bg-slate-850/90 border border-slate-800 rounded-xl p-3 text-center">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Actionable
          </span>
          <span className="font-mono text-base font-extrabold text-emerald-400">
            {actionableCount}
          </span>
        </div>
        <div className="border-x border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Top Net Spread
          </span>
          <span
            className={`font-mono text-base font-extrabold ${
              topNetSpread > 0 ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {topNetSpread > 0 ? `+${topNetSpread.toFixed(3)}%` : '0.00%'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Avg Latency
          </span>
          <span className="font-mono text-base font-extrabold text-blue-400">
            {avgFreshness} ms
          </span>
        </div>
      </div>

      {/* Search & Sort Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search coin (e.g. BTC, ETH, SOL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="net_spread_desc">Highest Net</option>
            <option value="gross_spread_desc">Highest Gross</option>
            <option value="freshness_asc">Freshest</option>
            <option value="symbol_asc">Symbol A-Z</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/70'
          }`}
        >
          All ({opportunities.length})
        </button>
        <button
          onClick={() => setFilter('actionable')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors font-medium flex items-center gap-1 ${
            filter === 'actionable'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/70'
          }`}
        >
          <CheckCircle2 size={12} />
          Actionable ({actionableCount})
        </button>
        <button
          onClick={() => setFilter('above_05')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors font-medium ${
            filter === 'above_05'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/70'
          }`}
        >
          Spread &gt; 0.05%
        </button>
        <button
          onClick={() => setFilter('above_10')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors font-medium ${
            filter === 'above_10'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/70'
          }`}
        >
          Spread &gt; 0.10%
        </button>
        <button
          onClick={() => setFilter('live_only')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors font-medium ${
            filter === 'live_only'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/70'
          }`}
        >
          Live Only
        </button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={onSelectOpportunity}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
            <Zap size={28} className="mx-auto text-slate-600 mb-2" />
            <h3 className="font-bold text-sm text-slate-300">
              {opportunities.length === 0
                ? 'Connecting to Binance & Bybit Feeds...'
                : 'No opportunities match your filter'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {opportunities.length === 0
                ? 'Subscribing to live WebSocket orderbook streams. Prices will populate momentarily.'
                : 'Try adjusting your filters or watch more volatile crypto pairs.'}
            </p>
            {opportunities.length === 0 && (
              <button
                onClick={onReconnect}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <RefreshCw size={12} />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
