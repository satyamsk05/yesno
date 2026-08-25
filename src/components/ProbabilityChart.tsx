"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, AreaSeries, UTCTimestamp, IPriceLine } from "lightweight-charts";

interface PricePoint {
  time: number; // UNIX timestamp in seconds
  value: number; // BTC Price in USD
}

interface ProbabilityChartProps {
  data: PricePoint[];
  loading: boolean;
  error: string | null;
  side: "YES" | "NO"; // Color theme based on selected side
  referencePrice: number; // Strike Price to Beat
}

export default function ProbabilityChart({ data, loading, error, side, referencePrice }: ProbabilityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Lightweight Chart for flat, clean style matching the screenshot
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 240,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#6B7280", // gray-500
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "#eeeeee" },
        horzLines: { color: "#eeeeee" },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: "#374151", // gray-700
        entireTextOnly: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "#9ca3af", // gray-400
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

    // Create the area series matching YFX/Pancake prediction layout
    const seriesColor = side === "YES" ? "#2F80ED" : "#FF3B57"; // Blue/green for UP/YES, red for NO
    const topGradient = side === "YES" ? "rgba(47, 128, 237, 0.12)" : "rgba(255, 59, 87, 0.12)";

    const series = chart.addSeries(AreaSeries, {
      lineColor: seriesColor,
      topColor: topGradient,
      bottomColor: "rgba(255, 255, 255, 0)",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    // Price scaling margins
    series.priceScale().applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.15,
        bottom: 0.15,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive scaling resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 240);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [side]); // Recreate series colors if user toggles YES/NO display color

  // Draw or update the horizontal "Target" strike price line
  useEffect(() => {
    if (!seriesRef.current || referencePrice === 0) return;

    // Remove previous target line if it exists
    if (priceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(priceLineRef.current);
      } catch (e) {
        console.error("Failed to remove old price line:", e);
      }
    }

    // Create the horizontal target dashed line
    const priceLine = seriesRef.current.createPriceLine({
      price: referencePrice,
      color: "#4b5563", // gray-600
      lineWidth: 1,
      lineStyle: 1, // Dashed
      axisLabelVisible: true,
      title: "Target",
    });

    priceLineRef.current = priceLine;
  }, [referencePrice]);

  // Update chart data points
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formatted = data.map((pt) => ({
        time: pt.time as UTCTimestamp,
        value: pt.value,
      }));
      seriesRef.current.setData(formatted);
    }
  }, [data]);

  return (
    <div className="relative w-full h-[240px] bg-white overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-xs">
          <span className="flex h-6 w-6 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-green/30"></span>
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-xs text-brand-red font-medium">
          Error loading chart: {error}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
