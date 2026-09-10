import { MarketQuote, ExchangeStatus, ConnectionState } from '../../types';
import { parseSymbol } from '../common/utils';

export class BybitAdapter {
  readonly id = 'bybit' as const;
  readonly name = 'Bybit';

  private ws: WebSocket | null = null;
  private symbols: Set<string> = new Set();
  private status: ConnectionState = 'disconnected';
  private latencyMs = 0;
  private lastEventTime = 0;
  private messagesReceived = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private pingStartTime = 0;
  private isExplicitlyClosed = false;

  // Cache latest known quotes per symbol for delta updates
  private quoteCache: Map<string, { bidPrice: number; bidQty: number; askPrice: number; askQty: number }> = new Map();

  private onMarketUpdateCallbacks: Array<(quote: MarketQuote) => void> = [];
  private onStatusChangeCallbacks: Array<(status: ExchangeStatus) => void> = [];

  constructor(initialSymbols: string[] = []) {
    initialSymbols.forEach(s => this.symbols.add(s.toUpperCase()));
  }

  onMarketUpdate(cb: (quote: MarketQuote) => void) {
    this.onMarketUpdateCallbacks.push(cb);
  }

  onStatusChange(cb: (status: ExchangeStatus) => void) {
    this.onStatusChangeCallbacks.push(cb);
  }

  getStatus(): ExchangeStatus {
    return {
      exchange: this.id,
      status: this.status,
      latencyMs: this.latencyMs,
      lastEventTime: this.lastEventTime,
      messagesReceived: this.messagesReceived,
    };
  }

  private updateStatus(newStatus: ConnectionState, errorMsg?: string) {
    this.status = newStatus;
    const current = {
      ...this.getStatus(),
      errorMessage: errorMsg,
    };
    this.onStatusChangeCallbacks.forEach(cb => cb(current));
  }

  connect() {
    this.isExplicitlyClosed = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    // Fetch quick REST snapshot for instant UI response
    this.fetchInitialSnapshot();

    try {
      this.ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.startHeartbeat();
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data as string);

          // Heartbeat response
          if (raw.op === 'pong' || raw.ret_msg === 'pong') {
            if (this.pingStartTime > 0) {
              this.latencyMs = Math.max(1, Date.now() - this.pingStartTime);
            }
            return;
          }

          // Orderbook.1 topic
          if (raw.topic && typeof raw.topic === 'string' && raw.topic.startsWith('orderbook.1.') && raw.data) {
            this.handleOrderbook(raw);
          }
        } catch {
          // ignore malformed payloads
        }
      };

      this.ws.onerror = () => {
        this.updateStatus('error', 'Bybit WebSocket error');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.updateStatus('disconnected');
          this.scheduleReconnect();
        }
      };
    } catch (err: any) {
      this.updateStatus('error', err?.message || 'Failed to connect');
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.ws.send(JSON.stringify({ op: 'ping' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 10000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resubscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.symbols.size === 0) return;

    const topics = Array.from(this.symbols).map(s => `orderbook.1.${s.toUpperCase()}`);
    this.ws.send(JSON.stringify({
      op: 'subscribe',
      args: topics,
    }));
  }

  subscribe(symbolsToAdd: string[]) {
    symbolsToAdd.forEach(s => this.symbols.add(s.toUpperCase()));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const topics = symbolsToAdd.map(s => `orderbook.1.${s.toUpperCase()}`);
      this.ws.send(JSON.stringify({
        op: 'subscribe',
        args: topics,
      }));
    }
    this.fetchInitialSnapshot(symbolsToAdd);
  }

  unsubscribe(symbolsToRemove: string[]) {
    symbolsToRemove.forEach(s => this.symbols.delete(s.toUpperCase()));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const topics = symbolsToRemove.map(s => `orderbook.1.${s.toUpperCase()}`);
      this.ws.send(JSON.stringify({
        op: 'unsubscribe',
        args: topics,
      }));
    }
  }

  private handleOrderbook(raw: { topic: string; ts: number; data: { s: string; b?: [string, string][]; a?: [string, string][] } }) {
    const symbol = raw.data.s.toUpperCase();
    const now = Date.now();
    this.lastEventTime = now;
    this.messagesReceived++;

    const cached = this.quoteCache.get(symbol) || {
      bidPrice: 0,
      bidQty: 0,
      askPrice: 0,
      askQty: 0,
    };

    if (raw.data.b && raw.data.b.length > 0) {
      const topBid = raw.data.b[0];
      const p = parseFloat(topBid[0]);
      const q = parseFloat(topBid[1]);
      if (!isNaN(p) && p > 0) {
        cached.bidPrice = p;
        cached.bidQty = !isNaN(q) ? q : 0;
      }
    }

    if (raw.data.a && raw.data.a.length > 0) {
      const topAsk = raw.data.a[0];
      const p = parseFloat(topAsk[0]);
      const q = parseFloat(topAsk[1]);
      if (!isNaN(p) && p > 0) {
        cached.askPrice = p;
        cached.askQty = !isNaN(q) ? q : 0;
      }
    }

    this.quoteCache.set(symbol, cached);

    if (cached.bidPrice <= 0 || cached.askPrice <= 0) return;

    const { baseAsset, quoteAsset } = parseSymbol(symbol);

    const quote: MarketQuote = {
      exchange: this.id,
      symbol,
      baseAsset,
      quoteAsset,
      bidPrice: cached.bidPrice,
      bidQty: cached.bidQty,
      askPrice: cached.askPrice,
      askQty: cached.askQty,
      exchangeTimestamp: raw.ts || now,
      receivedTimestamp: now,
    };

    this.onMarketUpdateCallbacks.forEach(cb => cb(quote));
  }

  private async fetchInitialSnapshot(targetSymbols?: string[]) {
    try {
      const list = targetSymbols || Array.from(this.symbols);
      if (list.length === 0) return;

      for (const sym of list) {
        const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${sym.toUpperCase()}`;
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data && data.retCode === 0 && data.result?.list?.[0]) {
              const item = data.result.list[0];
              const bidPrice = parseFloat(item.bid1Price);
              const askPrice = parseFloat(item.ask1Price);
              const bidQty = parseFloat(item.bid1Size || '0');
              const askQty = parseFloat(item.ask1Size || '0');

              if (bidPrice > 0 && askPrice > 0) {
                const now = Date.now();
                this.quoteCache.set(sym.toUpperCase(), {
                  bidPrice,
                  bidQty,
                  askPrice,
                  askQty,
                });
                const { baseAsset, quoteAsset } = parseSymbol(sym);
                this.onMarketUpdateCallbacks.forEach(cb => cb({
                  exchange: this.id,
                  symbol: sym.toUpperCase(),
                  baseAsset,
                  quoteAsset,
                  bidPrice,
                  bidQty,
                  askPrice,
                  askQty,
                  exchangeTimestamp: now,
                  receivedTimestamp: now,
                }));
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // Best-effort REST initial snapshot
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }
}
