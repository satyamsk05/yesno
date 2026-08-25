"use client";

import { useState, useEffect, useRef } from "react";

// Types for lightweight-charts
export interface ChartCandle {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

// Live Price Ticker Hook
export function useBinancePrice() {
  const [price, setPrice] = useState<number>(64250.00);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const prevPriceRef = useRef<number>(64250.00);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    // 1. Fetch initial price instantly via REST so there's no loading lag
    const fetchInitialPrice = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        const data = await res.json();
        const initialPrice = parseFloat(data.price);
        if (!isNaN(initialPrice)) {
          setPrice(initialPrice);
          prevPriceRef.current = initialPrice;
        }
      } catch (err) {
        console.error("Failed to fetch initial Binance price via REST:", err);
      }
    };

    fetchInitialPrice();

    // 2. Open WebSocket for real-time trade ticks
    const connectWS = () => {
      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.p);
          if (!isNaN(currentPrice)) {
            setPrice((prev) => {
              if (currentPrice > prev) setPriceDirection("up");
              else if (currentPrice < prev) setPriceDirection("down");
              return currentPrice;
            });
            retryCountRef.current = 0; // reset reconnect retries on successful message
          }
        } catch (e) {
          console.error("Error parsing trade WebSocket tick:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Binance trade WS error:", err);
      };

      ws.onclose = () => {
        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWS();
        }, delay);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection on cleanup
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return { price, priceDirection };
}

// Live Candlestick/Kline Hook
export function useBinanceKlines(interval: string = "1m", limit: number = 60) {
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<string>(interval);
  const limitRef = useRef<number>(limit);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  intervalRef.current = interval;
  limitRef.current = limit;

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 1. Fetch initial kline history via REST
    const fetchInitialKlines = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limitRef.current}`
        );
        if (!res.ok) throw new Error(`HTTP error status ${res.status}`);
        const data = await res.json();
        
        // Map Binance response schema to lightweight-charts
        const formatted: ChartCandle[] = data.map((d: (string | number)[]) => ({
          time: Math.floor(Number(d[0]) / 1000), // open time in seconds
          open: parseFloat(String(d[1])),
          high: parseFloat(String(d[2])),
          low: parseFloat(String(d[3])),
          close: parseFloat(String(d[4])),
        }));
        
        setCandles(formatted);
        setLoading(false);
      } catch (err: unknown) {
        console.error("Failed to fetch initial kline history:", err);
        const errMsg = err instanceof Error ? err.message : "Failed to load chart history";
        setError(errMsg);
        setLoading(false);
      }
    };

    fetchInitialKlines();

    // 2. Stream live kline updates via WebSocket
    const connectWS = () => {
      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const k = data.k;
          
          const time = Math.floor(k.t / 1000); // kline start time
          const newCandle: ChartCandle = {
            time,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          };

          setCandles((prev) => {
            if (prev.length === 0) return [newCandle];
            
            const last = prev[prev.length - 1];
            if (time === last.time) {
              // Update current ongoing candle
              return [...prev.slice(0, -1), newCandle];
            } else if (time > last.time) {
              // Append newly closed candle
              return [...prev, newCandle].slice(-limitRef.current);
            }
            return prev;
          });
        } catch (e) {
          console.error("Error parsing kline WebSocket:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Binance kline WS error:", err);
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWS();
        }, 3000);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [interval]); // Trigger reload when timeframe interval changes

  return { candles, loading, error };
}

// 24h Stats Ticker Hook
export interface Ticker24hData {
  priceChangePercent: number;
  volume: number;
  high: number;
  low: number;
}

export function useBinance24h() {
  const [data, setData] = useState<Ticker24hData>({
    priceChangePercent: 0,
    volume: 0,
    high: 0,
    low: 0,
  });

  useEffect(() => {
    const fetch24hTicker = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        const json = await res.json();
        setData({
          priceChangePercent: parseFloat(json.priceChangePercent) || 0,
          volume: parseFloat(json.volume) || 0,
          high: parseFloat(json.highPrice) || 0,
          low: parseFloat(json.lowPrice) || 0,
        });
      } catch (err) {
        console.error("Failed to fetch 24h ticker data:", err);
      }
    };

    fetch24hTicker();
    
    // Poll every 15s to keep stats fresh
    const timer = setInterval(fetch24hTicker, 15000);
    return () => clearInterval(timer);
  }, []);

  return data;
}
