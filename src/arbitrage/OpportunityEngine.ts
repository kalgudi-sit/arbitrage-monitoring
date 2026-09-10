import {
  MarketQuote,
  ArbitrageOpportunity,
  UserSettings,
  ExchangeStatus,
  OpportunityStatus,
  ExchangeId,
} from '../types';

export class OpportunityEngine {
  private quotes: Map<string, { binance?: MarketQuote; bybit?: MarketQuote }> = new Map();
  private previousOpportunities: Map<string, ArbitrageOpportunity> = new Map();

  constructor() {}

  updateQuote(quote: MarketQuote) {
    const existing = this.quotes.get(quote.symbol) || {};
    if (quote.exchange === 'binance') {
      existing.binance = quote;
    } else if (quote.exchange === 'bybit') {
      existing.bybit = quote;
    }
    this.quotes.set(quote.symbol, existing);
  }

  calculateOpportunities(
    settings: UserSettings,
    exchangeStatuses: Record<ExchangeId, ExchangeStatus>
  ): ArbitrageOpportunity[] {
    const now = Date.now();
    const opportunities: ArbitrageOpportunity[] = [];

    const isBinanceConnected = exchangeStatuses.binance.status === 'connected';
    const isBybitConnected = exchangeStatuses.bybit.status === 'connected';

    for (const [symbol, pairQuotes] of this.quotes.entries()) {
      const { binance, bybit } = pairQuotes;
      if (!binance || !bybit) continue;

      const baseAsset = binance.baseAsset || bybit.baseAsset;
      const quoteAsset = binance.quoteAsset || bybit.quoteAsset;

      // Evaluate Direction 1: Buy Binance -> Sell Bybit
      const dir1Gross = ((bybit.bidPrice - binance.askPrice) / binance.askPrice) * 100;
      const dir1Fees = settings.binanceFeePercent + settings.bybitFeePercent;
      const dir1Net = dir1Gross - (dir1Fees + settings.slippagePercent);

      // Evaluate Direction 2: Buy Bybit -> Sell Binance
      const dir2Gross = ((binance.bidPrice - bybit.askPrice) / bybit.askPrice) * 100;
      const dir2Fees = settings.bybitFeePercent + settings.binanceFeePercent;
      const dir2Net = dir2Gross - (dir2Fees + settings.slippagePercent);

      // Pick the better direction
      let buyEx: ExchangeId = 'binance';
      let sellEx: ExchangeId = 'bybit';
      let buyAsk = binance.askPrice;
      let sellBid = bybit.bidPrice;
      let buyQty = binance.askQty;
      let sellQty = bybit.bidQty;
      let grossSpreadPercent = dir1Gross;
      let estimatedNetSpreadPercent = dir1Net;
      let estimatedFeesPercent = dir1Fees;

      if (dir2Gross > dir1Gross) {
        buyEx = 'bybit';
        sellEx = 'binance';
        buyAsk = bybit.askPrice;
        sellBid = binance.bidPrice;
        buyQty = bybit.askQty;
        sellQty = binance.bidQty;
        grossSpreadPercent = dir2Gross;
        estimatedNetSpreadPercent = dir2Net;
        estimatedFeesPercent = dir2Fees;
      }

      const grossSpreadAbsolute = sellBid - buyAsk;
      const maxVolume = Math.min(buyQty, sellQty);
      const capitalRequired = maxVolume * buyAsk;
      const estimatedNetProfitUsd = (estimatedNetSpreadPercent / 100) * capitalRequired;

      const binanceAge = now - binance.receivedTimestamp;
      const bybitAge = now - bybit.receivedTimestamp;
      const freshnessMs = Math.max(binanceAge, bybitAge);

      const buyQuoteFresh = buyEx === 'binance' ? binanceAge < settings.freshnessAgingThresholdMs : bybitAge < settings.freshnessAgingThresholdMs;
      const sellQuoteFresh = sellEx === 'binance' ? binanceAge < settings.freshnessAgingThresholdMs : bybitAge < settings.freshnessAgingThresholdMs;

      let status: OpportunityStatus = 'LIVE';

      if (!isBinanceConnected || !isBybitConnected) {
        status = 'DISCONNECTED';
      } else if (freshnessMs > settings.freshnessAgingThresholdMs) {
        status = 'STALE';
      } else if (freshnessMs > settings.freshnessLiveThresholdMs) {
        status = 'AGING';
      } else if (grossSpreadPercent < settings.minGrossSpreadThreshold) {
        status = 'BELOW_THRESHOLD';
      } else {
        status = 'LIVE';
      }

      const id = `${symbol}-${buyEx}-${sellEx}`;
      const prev = this.previousOpportunities.get(symbol);

      let spreadDirection: 'widened' | 'narrowed' | 'steady' = 'steady';
      if (prev) {
        if (estimatedNetSpreadPercent > prev.estimatedNetSpreadPercent + 0.001) {
          spreadDirection = 'widened';
        } else if (estimatedNetSpreadPercent < prev.estimatedNetSpreadPercent - 0.001) {
          spreadDirection = 'narrowed';
        }
      }

      const isActionable =
        status === 'LIVE' &&
        estimatedNetSpreadPercent > 0 &&
        buyAsk > 0 &&
        sellBid > buyAsk &&
        buyQuoteFresh &&
        sellQuoteFresh;

      const opportunity: ArbitrageOpportunity = {
        id,
        symbol,
        baseAsset,
        quoteAsset,
        buyExchange: buyEx,
        sellExchange: sellEx,
        buyAsk,
        sellBid,
        buyQty,
        sellQty,
        maxVolume,
        capitalRequired,
        grossSpreadPercent,
        grossSpreadAbsolute,
        estimatedFeesPercent,
        estimatedSlippagePercent: settings.slippagePercent,
        estimatedNetSpreadPercent,
        estimatedNetProfitUsd,
        detectedAt: prev ? prev.detectedAt : now,
        lastUpdatedAt: now,
        status,
        freshnessMs,
        isActionable,
        buyQuoteFresh,
        sellQuoteFresh,
        spreadDirection,
      };

      this.previousOpportunities.set(symbol, opportunity);
      opportunities.push(opportunity);
    }

    return opportunities;
  }
}
