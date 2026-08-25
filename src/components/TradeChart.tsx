"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, UTCTimestamp } from "lightweight-charts";
import { ChartCandle } from "@/hooks/useBinance";

interface TradeChartProps {
  candles: ChartCandle[];
  loading: boolean;
  error: string | null;
}

export default function TradeChart({ candles, loading, error }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Lightweight Chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 350,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#6b7280", // gray-500
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "#eeeeee" },
        horzLines: { color: "#eeeeee" },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: "#374151", // gray-700
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "#9ca3af",
          width: 1,
          style: 3, // dashed
        },
        horzLine: {
          color: "#9ca3af",
          width: 1,
          style: 3,
        },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00D964",
      downColor: "#FF3B30",
      borderUpColor: "#00D964",
      borderDownColor: "#FF3B30",
      wickUpColor: "#00D964",
      wickDownColor: "#FF3B30",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive scaling resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 350);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data smoothly on new socket klines
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles.map(c => ({ ...c, time: c.time as UTCTimestamp })));
    }
  }, [candles]);

  return (
    <div className="relative w-full h-[350px] bg-white rounded-2xl border border-brand-border p-4 shadow-sm overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs">
          <span className="flex h-6 w-6 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-green/30"></span>
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-brand-red font-medium">
          Error loading chart data: {error}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
