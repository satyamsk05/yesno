/**
 * Server-side utility to fetch the current BTC price from Binance API.
 * Useful for prediction market resolution logic.
 */
export async function getCurrentBTCPrice(): Promise<number> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
      cache: "no-store", // Ensure we always get fresh price (bypass Next.js default fetch caching)
    });
    if (!res.ok) {
      throw new Error(`Binance API returned status ${res.status}`);
    }
    const data = (await res.json()) as { price: string; symbol: string };
    const price = parseFloat(data.price);
    if (isNaN(price)) {
      throw new Error("Invalid price returned from Binance API");
    }
    return price;
  } catch (error) {
    console.error("Error in getCurrentBTCPrice:", error);
    throw error;
  }
}

export async function getHistoricalBTCPrice(timestampMs: number): Promise<number> {
  try {
    // Fetches the 1m kline starting at or after timestampMs
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${timestampMs}&limit=1`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Binance API returned status ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No kline data returned from Binance API");
    }
    const closePrice = parseFloat(data[0][4]); // Index 4 is the Close Price
    if (isNaN(closePrice)) {
      throw new Error("Invalid close price returned from Binance API");
    }
    return closePrice;
  } catch (error) {
    console.error("Error in getHistoricalBTCPrice:", error);
    throw error;
  }
}

