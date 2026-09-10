export type ExchangeId = 'binance' | 'bybit';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

export type OpportunityStatus = 'LIVE' | 'AGING' | 'STALE' | 'BELOW_THRESHOLD' | 'DISCONNECTED';

export interface MarketQuote {
  exchange: ExchangeId;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  bidPrice: number;
  bidQty: number;
  askPrice: number;
  askQty: number;
  exchangeTimestamp: number;
  receivedTimestamp: number;
  priceDirection?: 'up' | 'down' | 'same';
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
  buyAsk: number;
  sellBid: number;
  buyQty: number;
  sellQty: number;
  maxVolume: number;
  capitalRequired: number;
  grossSpreadPercent: number;
  grossSpreadAbsolute: number;
  estimatedFeesPercent: number;
  estimatedSlippagePercent: number;
  estimatedNetSpreadPercent: number;
  estimatedNetProfitUsd: number;
  detectedAt: number;
  lastUpdatedAt: number;
  status: OpportunityStatus;
  freshnessMs: number;
  isActionable: boolean;
  buyQuoteFresh: boolean;
  sellQuoteFresh: boolean;
  spreadDirection?: 'widened' | 'narrowed' | 'steady';
}

export interface ExchangeStatus {
  exchange: ExchangeId;
  status: ConnectionState;
  latencyMs: number;
  lastEventTime: number;
  messagesReceived: number;
  errorMessage?: string;
}

export interface UserSettings {
  watchlist: string[];
  minGrossSpreadThreshold: number;
  minNetSpreadThreshold: number;
  alertNetSpreadThreshold: number;
  binanceFeePercent: number;
  bybitFeePercent: number;
  slippagePercent: number;
  soundAlertsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  alertCooldownSeconds: number;
  freshnessLiveThresholdMs: number;
  freshnessAgingThresholdMs: number;
}

export interface AlertLogItem {
  id: string;
  opportunityId: string;
  symbol: string;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
  buyPrice: number;
  sellPrice: number;
  grossSpreadPercent: number;
  netSpreadPercent: number;
  timestamp: number;
}
