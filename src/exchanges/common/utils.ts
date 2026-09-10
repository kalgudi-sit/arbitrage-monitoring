export function parseSymbol(rawSymbol: string): { baseAsset: string; quoteAsset: string } {
  const upper = rawSymbol.toUpperCase().replace(/[-_/]/g, '');
  const quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'EUR', 'BTC', 'ETH'];
  
  for (const quote of quotes) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      return {
        baseAsset: upper.slice(0, -quote.length),
        quoteAsset: quote,
      };
    }
  }

  // Default fallback
  if (upper.length > 4) {
    return {
      baseAsset: upper.slice(0, -4),
      quoteAsset: upper.slice(-4),
    };
  }

  return { baseAsset: upper, quoteAsset: 'USDT' };
}

export function formatPair(symbol: string): string {
  const { baseAsset, quoteAsset } = parseSymbol(symbol);
  return `${baseAsset}/${quoteAsset}`;
}
