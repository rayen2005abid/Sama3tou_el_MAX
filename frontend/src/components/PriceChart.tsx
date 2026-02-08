import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";
import type { StockHistorical, PriceForecast } from "@/types/trading";

type ChartMode = "line" | "candle";

interface PriceChartProps {
  history: StockHistorical[];
  forecast: PriceForecast[];
}

// Custom candlestick shape for Recharts Bar
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "hsl(145, 70%, 45%)" : "hsl(0, 75%, 55%)";

  // Scale: y is top of bar, height is bar height (negative means going up)
  const yScale = props.background?.height || 200;
  const yMin = props.yAxis?.y ?? y;

  // Use the y-axis scale from the chart
  const barTop = Math.min(y, y + height);
  const barBottom = Math.max(y, y + height);
  const barHeight = barBottom - barTop;

  // Wick positions relative to the bar
  const wickX = x + width / 2;

  return (
    <g>
      {/* Wick (high to low) */}
      <line
        x1={wickX}
        y1={barTop - 2}
        x2={wickX}
        y2={barBottom + 2}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Body */}
      <rect
        x={x + 2}
        y={barTop}
        width={Math.max(width - 4, 4)}
        height={Math.max(barHeight, 2)}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
        rx={1}
        fillOpacity={isUp ? 0.3 : 0.8}
      />
    </g>
  );
};

export default function PriceChart({ history, forecast }: PriceChartProps) {
  const [mode, setMode] = useState<ChartMode>("line");

  const lineData = useMemo(() => {
    const hist = history.slice(-30).map(h => ({
      date: h.date.slice(5),
      price: h.close,
      type: "actual",
    }));
    const fore = forecast.map(f => ({
      date: f.date.slice(5),
      price: f.predicted,
      lower: f.lower,
      upper: f.upper,
      type: "forecast",
    }));
    return [...hist, ...fore];
  }, [history, forecast]);

  const candleData = useMemo(() => {
    return history.slice(-30).map(h => ({
      date: h.date.slice(5),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
      // For Bar chart: use open→close range
      range: [Math.min(h.open, h.close), Math.max(h.open, h.close)],
      volume: h.volume,
    }));
  }, [history]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setMode(m => (m === "line" ? "candle" : "line"))}
        className="absolute top-0 right-0 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all backdrop-blur-sm border border-border/50"
        title={mode === "line" ? "Switch to Candlestick" : "Switch to Line"}
      >
        {mode === "line" ? (
          <>
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Candles</span>
          </>
        ) : (
          <>
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Line</span>
          </>
        )}
      </button>

      <div className="h-[300px]">
        {mode === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="price" stroke="hsl(185, 70%, 50%)" fill="url(#priceGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(185, 70%, 50%)" fillOpacity={0.08} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(185, 70%, 50%)" fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const isUp = d.close >= d.open;
                  return (
                    <div className="rounded-lg border border-border/50 bg-card p-2.5 text-xs shadow-xl space-y-1">
                      <p className="font-medium text-foreground">{d.date}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                        <span>Open</span><span className="text-right font-mono text-foreground">{d.open.toFixed(2)}</span>
                        <span>High</span><span className="text-right font-mono text-foreground">{d.high.toFixed(2)}</span>
                        <span>Low</span><span className="text-right font-mono text-foreground">{d.low.toFixed(2)}</span>
                        <span>Close</span>
                        <span className={`text-right font-mono ${isUp ? "text-gain" : "text-loss"}`}>{d.close.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Wicks: high to low */}
              <Bar dataKey="high" fill="transparent" barSize={1}>
                {candleData.map((entry, i) => {
                  const isUp = entry.close >= entry.open;
                  return (
                    <Cell
                      key={i}
                      fill="transparent"
                    />
                  );
                })}
              </Bar>
              {/* Candlestick bodies rendered via custom shapes */}
              <Bar dataKey="range" barSize={12} shape={<CandlestickShape />}>
                {candleData.map((entry, i) => (
                  <Cell key={i} fill="transparent" />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
