"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, AreaSeries, UTCTimestamp } from "lightweight-charts";

interface ProbabilityPoint {
  time: number; // UNIX timestamp in seconds
  value: number; // Probability between 0 and 100
}

interface ProbabilityChartProps {
  data: ProbabilityPoint[];
  loading: boolean;
  error: string | null;
  side: "YES" | "NO"; // Color theme based on selected side
}

export default function ProbabilityChart({ data, loading, error, side }: ProbabilityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Lightweight Chart for Polymarket style
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 280,
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

    // Create the area series matching Polymarket line graphs
    const seriesColor = side === "YES" ? "#00C853" : "#FF3B57";
    const topGradient = side === "YES" ? "rgba(0, 200, 83, 0.15)" : "rgba(255, 59, 87, 0.15)";

    const series = chart.addSeries(AreaSeries, {
      lineColor: seriesColor,
      topColor: topGradient,
      bottomColor: "rgba(255, 255, 255, 0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${Math.round(price)}%`,
      },
    });

    // Fix Y-axis range between 0 and 100 for probability
    series.priceScale().applyOptions({
      autoScale: false,
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive scaling resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 280);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [side]); // Recreate series colors if user toggles YES/NO display color

  // Update chart data points
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      // Map data to lightweight-charts AreaData format
      const formatted = data.map((pt) => ({
        time: pt.time as UTCTimestamp,
        value: pt.value,
      }));
      seriesRef.current.setData(formatted);
    }
  }, [data]);

  return (
    <div className="relative w-full h-[280px] bg-white rounded-xl border border-brand-border p-4 shadow-sm overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-xs">
          <span className="flex h-6 w-6 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-green/30"></span>
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0D0F11] text-xs text-brand-red font-medium">
          Error loading chart: {error}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
