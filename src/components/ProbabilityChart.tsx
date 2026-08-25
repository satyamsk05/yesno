"use client";

import { motion } from "framer-motion";

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
  chartStyle: "line" | "deviation" | "candles";
}

export default function ProbabilityChart({ data, loading, error, side, referencePrice, chartStyle }: ProbabilityChartProps) {
  // SVG Canvas dimensions
  const width = 500;
  const height = 240;
  
  // Padding dimensions
  const padLeft = 15;
  const padRight = 75;
  const padTop = 25;
  const padBottom = 25;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  // Render loading state
  if (loading || data.length === 0) {
    return (
      <div className="relative w-full h-[240px] bg-white border border-brand-border rounded-xl flex items-center justify-center">
        <span className="flex h-5 w-5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F80ED] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-[#2F80ED]/30"></span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[240px] bg-white border border-brand-border rounded-xl flex items-center justify-center text-xs text-[#FF3B57] font-medium">
        Error loading chart data
      </div>
    );
  }

  // Common Color definitions
  const strokeColor = side === "YES" ? "#2F80ED" : "#FF3B57";
  const gradientId = `chart-gradient-${side}`;

  // 1. CALCULATE BOUNDARIES & COORDINATES BASED ON CHART STYLE
  if (chartStyle === "deviation") {
    // DEV MODE: Maps percentage deviation relative to locked referencePrice
    const devPoints = data.map((d) => {
      const dev = referencePrice > 0 ? ((d.value - referencePrice) / referencePrice) * 100 : 0;
      return { time: d.time, value: dev };
    });

    const minDev = Math.min(...devPoints.map((d) => d.value));
    const maxDev = Math.max(...devPoints.map((d) => d.value));

    // Force visible scale delta
    const deltaRange = maxDev - minDev;
    const padding = deltaRange * 0.15 || 0.05; // min 0.05% margin
    const yMin = minDev - padding;
    const yMax = maxDev + padding;
    const yRange = yMax - yMin;

    const points = devPoints.map((d, i) => {
      const x = padLeft + (i / (devPoints.length - 1)) * chartWidth;
      const y = padTop + chartHeight - ((d.value - yMin) / yRange) * chartHeight;
      return { x, y, value: d.value };
    });

    const lastPoint = points[points.length - 1];

    // Target (0% change) Y coordinate
    const targetY = padTop + chartHeight - ((0 - yMin) / yRange) * chartHeight;

    // Cubic Bezier interpolation path generator
    const getBezierPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
      
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        const controlX1 = curr.x + (next.x - curr.x) / 3;
        const controlY1 = curr.y;
        const controlX2 = curr.x + 2 * (next.x - curr.x) / 3;
        const controlY2 = next.y;
        path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
      }
      return path;
    };

    const linePath = getBezierPath(points);
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`
      : "";

    // Gridline percentage intervals
    const gridLines = [0, 0.33, 0.66, 1.0].map((ratio) => {
      const y = padTop + ratio * chartHeight;
      const devVal = yMax - ratio * yRange;
      return { y, devVal };
    });

    return (
      <div className="relative w-full h-[240px] bg-white overflow-hidden rounded-xl border border-brand-border p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line x1={padLeft} y1={line.y} x2={padLeft + chartWidth} y2={line.y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={padLeft + chartWidth + 8} y={line.y + 3.5} fill="#9CA3AF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
                {line.devVal >= 0 ? "+" : ""}{line.devVal.toFixed(2)}%
              </text>
            </g>
          ))}

          {/* Zero baseline strike marker */}
          {targetY >= padTop && targetY <= padTop + chartHeight && (
            <g>
              <motion.line
                x1={padLeft}
                y1={targetY}
                x2={padLeft + chartWidth}
                y2={targetY}
                stroke="#6B7280"
                strokeWidth={1}
                strokeDasharray="3 3"
                animate={{ y1: targetY, y2: targetY }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              />
              <motion.g animate={{ y: targetY - 7 }} transition={{ type: "spring", stiffness: 100, damping: 18 }}>
                <rect x={padLeft + chartWidth + 6} width={65} height={14} rx={4} fill="#4B5563" />
                <text x={padLeft + chartWidth + 10} y={10} fill="#FFFFFF" fontSize="8" fontWeight="extrabold" fontFamily="Inter, sans-serif">
                  Target (0%)
                </text>
              </motion.g>
            </g>
          )}

          {areaPath && <motion.path d={areaPath} fill={`url(#${gradientId})`} animate={{ d: areaPath }} transition={{ type: "spring", stiffness: 100, damping: 18 }} />}
          {linePath && <motion.path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" animate={{ d: linePath }} transition={{ type: "spring", stiffness: 100, damping: 18 }} />}
          
          {lastPoint && (
            <g>
              <motion.circle cx={lastPoint.x} cy={lastPoint.y} r={7} fill={strokeColor} opacity={0.2} animate={{ r: [6, 11, 6] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
              <circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={strokeColor} stroke="#FFFFFF" strokeWidth={1.5} />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // Common boundary check logic for Spot line and Candlestick modes
  let minPrice = Math.min(...data.map((d) => d.value));
  let maxPrice = Math.max(...data.map((d) => d.value));

  if (referencePrice > 0) {
    minPrice = Math.min(minPrice, referencePrice);
    maxPrice = Math.max(maxPrice, referencePrice);
  }

  const priceDelta = maxPrice - minPrice;
  const marginOffset = priceDelta * 0.15 || 5.0;
  const yMin = minPrice - marginOffset;
  const yMax = maxPrice + marginOffset;
  const yRange = yMax - yMin;

  const targetY = padTop + chartHeight - ((referencePrice - yMin) / yRange) * chartHeight;

  // Gridlines
  const gridLines = [0, 0.33, 0.66, 1.0].map((ratio) => {
    const y = padTop + ratio * chartHeight;
    const priceVal = yMax - ratio * yRange;
    return { y, priceVal };
  });

  // 2. CANDLESTICK RENDERING MODE
  if (chartStyle === "candles") {
    // Group ticks into 18 candlesticks
    const numCandles = Math.min(18, data.length);
    const groupSize = Math.max(1, Math.floor(data.length / numCandles));
    const candles: { open: number; close: number; high: number; low: number; x: number }[] = [];

    for (let c = 0; c < numCandles; c++) {
      const startIdx = c * groupSize;
      const endIdx = Math.min(data.length, (c + 1) * groupSize);
      const groupData = data.slice(startIdx, endIdx);
      if (groupData.length === 0) continue;

      const open = groupData[0].value;
      const close = groupData[groupData.length - 1].value;
      const values = groupData.map((d) => d.value);
      const high = Math.max(...values);
      const low = Math.min(...values);

      // Centered X coordinate
      const x = padLeft + (c / (numCandles - 1)) * chartWidth;
      candles.push({ open, close, high, low, x });
    }

    const candleWidth = (chartWidth / numCandles) * 0.55;

    return (
      <div className="relative w-full h-[240px] bg-white overflow-hidden rounded-xl border border-brand-border p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
          {/* Gridlines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line x1={padLeft} y1={line.y} x2={padLeft + chartWidth} y2={line.y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={padLeft + chartWidth + 8} y={line.y + 3.5} fill="#9CA3AF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
                ${line.priceVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}

          {/* Target strike marker */}
          {referencePrice > 0 && targetY >= padTop && targetY <= padTop + chartHeight && (
            <g>
              <motion.line
                x1={padLeft}
                y1={targetY}
                x2={padLeft + chartWidth}
                y2={targetY}
                stroke="#6B7280"
                strokeWidth={1}
                strokeDasharray="3 3"
                animate={{ y1: targetY, y2: targetY }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              />
              <motion.g animate={{ y: targetY - 7 }} transition={{ type: "spring", stiffness: 100, damping: 18 }}>
                <rect x={padLeft + chartWidth + 6} width={65} height={14} rx={4} fill="#4B5563" />
                <text x={padLeft + chartWidth + 10} y={10} fill="#FFFFFF" fontSize="8" fontWeight="extrabold" fontFamily="Inter, sans-serif">
                  Target
                </text>
                <text x={padLeft + chartWidth + 38} y={10} fill="#FFFFFF" fontSize="7" fontWeight="semibold" fontFamily="Inter, sans-serif">
                  {Math.round(referencePrice)}
                </text>
              </motion.g>
            </g>
          )}

          {/* Render individual candlesticks */}
          {candles.map((candle, idx) => {
            const isBullish = candle.close >= candle.open;
            const color = isBullish ? "#00C853" : "#FF3B57";
            
            // Map OHLC to SVG coordinates
            const wickYHigh = padTop + chartHeight - ((candle.high - yMin) / yRange) * chartHeight;
            const wickYLow = padTop + chartHeight - ((candle.low - yMin) / yRange) * chartHeight;
            
            const bodyYOpen = padTop + chartHeight - ((candle.open - yMin) / yRange) * chartHeight;
            const bodyYClose = padTop + chartHeight - ((candle.close - yMin) / yRange) * chartHeight;
            
            const bodyY = Math.min(bodyYOpen, bodyYClose);
            const bodyHeight = Math.max(2, Math.abs(bodyYOpen - bodyYClose));

            return (
              <g key={idx}>
                {/* Wick line */}
                <line x1={candle.x} y1={wickYLow} x2={candle.x} y2={wickYHigh} stroke={color} strokeWidth={1.5} />
                {/* Candle body */}
                <rect
                  x={candle.x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isBullish ? "none" : color}
                  stroke={color}
                  strokeWidth={1.5}
                  rx={1}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // 3. STANDARD AREA/LINE MODE (default)
  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartWidth;
    const y = padTop + chartHeight - ((d.value - yMin) / yRange) * chartHeight;
    return { x, y, value: d.value };
  });

  const lastPoint = points[points.length - 1];

  const getBezierPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const controlX1 = curr.x + (next.x - curr.x) / 3;
      const controlY1 = curr.y;
      const controlX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const controlY2 = next.y;
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const linePath = getBezierPath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`
    : "";

  return (
    <div className="relative w-full h-[240px] bg-white overflow-hidden rounded-xl border border-brand-border p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line x1={padLeft} y1={line.y} x2={padLeft + chartWidth} y2={line.y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={padLeft + chartWidth + 8} y={line.y + 3.5} fill="#9CA3AF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
              ${line.priceVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}

        {/* Target strike price line */}
        {referencePrice > 0 && targetY >= padTop && targetY <= padTop + chartHeight && (
          <g>
            <motion.line
              x1={padLeft}
              y1={targetY}
              x2={padLeft + chartWidth}
              y2={targetY}
              stroke="#6B7280"
              strokeWidth={1}
              strokeDasharray="3 3"
              animate={{ y1: targetY, y2: targetY }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
            />
            <motion.g animate={{ y: targetY - 7 }} transition={{ type: "spring", stiffness: 100, damping: 18 }}>
              <rect x={padLeft + chartWidth + 6} width={65} height={14} rx={4} fill="#4B5563" />
              <text x={padLeft + chartWidth + 10} y={10} fill="#FFFFFF" fontSize="8" fontWeight="extrabold" fontFamily="Inter, sans-serif">
                Target
              </text>
              <text x={padLeft + chartWidth + 38} y={10} fill="#FFFFFF" fontSize="7" fontWeight="semibold" fontFamily="Inter, sans-serif">
                {Math.round(referencePrice)}
              </text>
            </motion.g>
          </g>
        )}

        {areaPath && <motion.path d={areaPath} fill={`url(#${gradientId})`} animate={{ d: areaPath }} transition={{ type: "spring", stiffness: 100, damping: 18 }} />}
        {linePath && <motion.path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" animate={{ d: linePath }} transition={{ type: "spring", stiffness: 100, damping: 18 }} />}

        {lastPoint && (
          <g>
            <motion.circle cx={lastPoint.x} cy={lastPoint.y} r={7} fill={strokeColor} opacity={0.2} animate={{ r: [6, 11, 6] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
            <circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={strokeColor} stroke="#FFFFFF" strokeWidth={1.5} />
          </g>
        )}
      </svg>
    </div>
  );
}
