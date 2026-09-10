import { MarketQuote, ExchangeStatus, ConnectionState } from '../../types';
import { parseSymbol } from '../common/utils';

export class BinanceAdapter {
  readonly id = 'binance' as const;
  readonly name = 'Binance';

  private ws: WebSocket | null = null;
  private symbols: Set<string> = new Set();
  private status: ConnectionState = 'disconnected';
  private latencyMs = 0;
  private lastEventTime = 0;
  private messagesReceived = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private subscriptionId = 1;

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

    // Fetch quick initial REST snapshot in parallel for instant data
    this.fetchInitialSnapshot();

    try {
      this.ws = new WebSocket('wss://stream.binance.com:9443/ws');

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data as string);
          // Binance bookTicker payload: { u, s, b, B, a, A }
          if (raw.s && raw.b !== undefined && raw.a !== undefined) {
            this.handleBookTicker(raw);
          }
        } catch {
          // ignore malformed payloads
        }
      };

      this.ws.onerror = () => {
        this.updateStatus('error', 'Binance WebSocket error');
      };

      this.ws.onclose = () => {
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

    const streams = Array.from(this.symbols).map(s => `${s.toLowerCase()}@bookTicker`);
    const payload = {
      method: 'SUBSCRIBE',
      params: streams,
      id: this.subscriptionId++,
    };
    this.ws.send(JSON.stringify(payload));
  }

  subscribe(symbolsToAdd: string[]) {
    symbolsToAdd.forEach(s => this.symbols.add(s.toUpperCase()));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const streams = symbolsToAdd.map(s => `${s.toLowerCase()}@bookTicker`);
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: this.subscriptionId++,
      }));
    }
    // Also fetch initial snapshot for the new symbols
    this.fetchInitialSnapshot(symbolsToAdd);
  }

  unsubscribe(symbolsToRemove: string[]) {
    symbolsToRemove.forEach(s => this.symbols.delete(s.toUpperCase()));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const streams = symbolsToRemove.map(s => `${s.toLowerCase()}@bookTicker`);
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: streams,
        id: this.subscriptionId++,
      }));
    }
  }

  private handleBookTicker(raw: { s: string; b: string; B: string; a: string; A: string }) {
    const symbol = raw.s.toUpperCase();
    const now = Date.now();
    this.lastEventTime = now;
    this.messagesReceived++;

    const bidPrice = parseFloat(raw.b);
    const bidQty = parseFloat(raw.B);
    const askPrice = parseFloat(raw.a);
    const askQty = parseFloat(raw.A);

    if (isNaN(bidPrice) || isNaN(askPrice) || bidPrice <= 0 || askPrice <= 0) return;

    const { baseAsset, quoteAsset } = parseSymbol(symbol);

    const quote: MarketQuote = {
      exchange: this.id,
      symbol,
      baseAsset,
      quoteAsset,
      bidPrice,
      bidQty,
      askPrice,
      askQty,
      exchangeTimestamp: now,
      receivedTimestamp: now,
    };

    this.onMarketUpdateCallbacks.forEach(cb => cb(quote));
  }

  private async fetchInitialSnapshot(targetSymbols?: string[]) {
    try {
      const list = targetSymbols || Array.from(this.symbols);
      if (list.length === 0) return;

      const symbolsParam = JSON.stringify(list.map(s => s.toUpperCase()));
      const url = `https://api.binance.com/api/v3/ticker/bookTicker?symbols=${encodeURIComponent(symbolsParam)}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const item of data) {
          if (item.symbol && item.bidPrice && item.askPrice) {
            const bidPrice = parseFloat(item.bidPrice);
            const askPrice = parseFloat(item.askPrice);
            const bidQty = parseFloat(item.bidQty || '0');
            const askQty = parseFloat(item.askQty || '0');
            if (bidPrice > 0 && askPrice > 0) {
              const { baseAsset, quoteAsset } = parseSymbol(item.symbol);
              this.onMarketUpdateCallbacks.forEach(cb => cb({
                exchange: this.id,
                symbol: item.symbol.toUpperCase(),
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
        }
      }
    } catch {
      // Best-effort REST initial snapshot
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
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
