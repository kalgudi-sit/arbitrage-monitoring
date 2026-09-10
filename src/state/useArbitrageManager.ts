import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExchangeId,
  ExchangeStatus,
  MarketQuote,
  ArbitrageOpportunity,
  UserSettings,
  AlertLogItem,
} from '../types';
import { BinanceAdapter } from '../exchanges/binance/BinanceAdapter';
import { BybitAdapter } from '../exchanges/bybit/BybitAdapter';
import { OpportunityEngine } from '../arbitrage/OpportunityEngine';
import { AlertService } from '../arbitrage/AlertService';

const DEFAULT_SETTINGS: UserSettings = {
  watchlist: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT'],
  minGrossSpreadThreshold: 0.02,
  minNetSpreadThreshold: 0.0,
  alertNetSpreadThreshold: 0.15,
  binanceFeePercent: 0.10,
  bybitFeePercent: 0.10,
  slippagePercent: 0.05,
  soundAlertsEnabled: true,
  browserNotificationsEnabled: false,
  alertCooldownSeconds: 20,
  freshnessLiveThresholdMs: 1500,
  freshnessAgingThresholdMs: 4000,
};

const STORAGE_KEY = 'crypto_arbitrage_settings_v1';

export function useArbitrageManager() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [quotes, setQuotes] = useState<Record<string, { binance?: MarketQuote; bybit?: MarketQuote }>>({});
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());

  const [exchangeStatuses, setExchangeStatuses] = useState<Record<ExchangeId, ExchangeStatus>>({
    binance: {
      exchange: 'binance',
      status: 'connecting',
      latencyMs: 0,
      lastEventTime: 0,
      messagesReceived: 0,
    },
    bybit: {
      exchange: 'bybit',
      status: 'connecting',
      latencyMs: 0,
      lastEventTime: 0,
      messagesReceived: 0,
    },
  });

  // Services references
  const binanceRef = useRef<BinanceAdapter | null>(null);
  const bybitRef = useRef<BybitAdapter | null>(null);
  const engineRef = useRef<OpportunityEngine>(new OpportunityEngine());
  const alertServiceRef = useRef<AlertService>(new AlertService());
  const quotesRef = useRef<Record<string, { binance?: MarketQuote; bybit?: MarketQuote }>>({});
  const statusesRef = useRef(exchangeStatuses);
  statusesRef.current = exchangeStatuses;

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Handle alert callbacks
  useEffect(() => {
    const alertService = alertServiceRef.current;
    alertService.onAlert((item) => {
      setAlertLogs((prev) => [item, ...prev].slice(0, 40));
    });
  }, []);

  // Initialize adapters & engine
  useEffect(() => {
    const binance = new BinanceAdapter(settings.watchlist);
    const bybit = new BybitAdapter(settings.watchlist);
    binanceRef.current = binance;
    bybitRef.current = bybit;

    // Status listeners
    binance.onStatusChange((status) => {
      setExchangeStatuses((prev) => ({ ...prev, binance: status }));
    });

    bybit.onStatusChange((status) => {
      setExchangeStatuses((prev) => ({ ...prev, bybit: status }));
    });

    // Market update listener
    const handleQuote = (quote: MarketQuote) => {
      engineRef.current.updateQuote(quote);

      const existing = quotesRef.current[quote.symbol] || {};
      if (quote.exchange === 'binance') {
        existing.binance = quote;
      } else {
        existing.bybit = quote;
      }
      quotesRef.current[quote.symbol] = existing;
    };

    binance.onMarketUpdate(handleQuote);
    bybit.onMarketUpdate(handleQuote);

    // Connect
    binance.connect();
    bybit.connect();

    return () => {
      binance.disconnect();
      bybit.disconnect();
    };
  }, []);

  // Recalculation Loop: Batch UI updates every 150ms for smooth 60fps rendering without UI lag
  useEffect(() => {
    const interval = setInterval(() => {
      const opps = engineRef.current.calculateOpportunities(settings, statusesRef.current);
      setOpportunities(opps);
      setQuotes({ ...quotesRef.current });
      setLastTickTime(Date.now());

      // Update selected opportunity if currently viewing one
      if (selectedOpportunity) {
        const freshSelected = opps.find((o) => o.symbol === selectedOpportunity.symbol);
        if (freshSelected) {
          setSelectedOpportunity(freshSelected);
        }
      }

      // Check for alerts
      for (const opp of opps) {
        alertServiceRef.current.checkOpportunity(opp, settings);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [settings, selectedOpportunity]);

  // Actions
  const addSymbol = useCallback((symbol: string) => {
    const upper = symbol.toUpperCase().trim().replace(/[-_/]/g, '');
    if (!upper || settings.watchlist.includes(upper)) return;

    const newWatchlist = [...settings.watchlist, upper];
    setSettings((prev) => ({ ...prev, watchlist: newWatchlist }));

    binanceRef.current?.subscribe([upper]);
    bybitRef.current?.subscribe([upper]);
  }, [settings.watchlist]);

  const removeSymbol = useCallback((symbol: string) => {
    const upper = symbol.toUpperCase().trim();
    const newWatchlist = settings.watchlist.filter((s) => s !== upper);
    setSettings((prev) => ({ ...prev, watchlist: newWatchlist }));

    binanceRef.current?.unsubscribe([upper]);
    bybitRef.current?.unsubscribe([upper]);
  }, [settings.watchlist]);

  const reconnectExchanges = useCallback(() => {
    binanceRef.current?.disconnect();
    bybitRef.current?.disconnect();
    setTimeout(() => {
      binanceRef.current?.connect();
      bybitRef.current?.connect();
    }, 400);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const clearAlertHistory = useCallback(() => {
    alertServiceRef.current.clearHistory();
    setAlertLogs([]);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    const perm = await alertServiceRef.current.requestNotificationPermission();
    if (perm === 'granted') {
      updateSettings({ browserNotificationsEnabled: true });
      return true;
    }
    updateSettings({ browserNotificationsEnabled: false });
    return false;
  }, [updateSettings]);

  return {
    settings,
    quotes,
    opportunities,
    exchangeStatuses,
    selectedOpportunity,
    setSelectedOpportunity,
    alertLogs,
    lastTickTime,
    addSymbol,
    removeSymbol,
    reconnectExchanges,
    updateSettings,
    clearAlertHistory,
    requestNotificationPermission,
  };
}
