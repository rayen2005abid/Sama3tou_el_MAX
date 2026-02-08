import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { PortfolioSummary } from "@/types/trading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldCheck, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeModal } from "@/components/TradeModal";

const COLORS = [
  "hsl(185, 70%, 50%)", "hsl(145, 65%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(210, 80%, 60%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(160, 50%, 50%)",
];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");

  const refreshPortfolio = () => {
    api.getPortfolio().then(setPortfolio);
  };

  useEffect(() => { refreshPortfolio(); }, []);

  const handleTrade = (stock: string, price: number, action: "BUY" | "SELL") => {
    setSelectedStock(stock);
    setSelectedPrice(price);
    setTradeAction(action);
    setTradeModalOpen(true);
  };

  if (!portfolio) return null;

  const pieData = portfolio.positions.map(p => ({ name: p.symbol, value: p.allocation }));

  // Mock capital evolution
  const capitalEvolution = Array.from({ length: 30 }, (_, i) => {
    const base = 10000 + (i / 29) * portfolio.totalPnl;
    const noise = (Math.random() - 0.5) * 300;
    return { day: i + 1, value: +(base + noise).toFixed(0) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Portfolio</h1>
        <p className="text-sm text-muted-foreground">Virtual portfolio · 10,000 TND initial capital</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Total Value</p>
            <p className="text-2xl font-bold font-mono">{portfolio.totalValue.toLocaleString()} <span className="text-sm text-muted-foreground">TND</span></p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">P&L</p>
            <p className={`text-2xl font-bold font-mono ${portfolio.totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
              {portfolio.totalPnl >= 0 ? "+" : ""}{portfolio.totalPnl.toFixed(0)} TND
            </p>
            <p className={`text-xs font-mono ${portfolio.totalPnlPercent >= 0 ? "text-gain" : "text-loss"}`}>
              {portfolio.totalPnlPercent >= 0 ? "+" : ""}{portfolio.totalPnlPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
            <p className="text-2xl font-bold font-mono">{portfolio.sharpeRatio.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
            <p className="text-2xl font-bold font-mono text-loss">{portfolio.maxDrawdown.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {pieData.map((p, i) => (
                <span key={p.name} className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {p.name} {p.value}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capital evolution */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capital Evolution (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={capitalEvolution}>
                  <defs>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145, 65%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(145, 65%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(145, 65%, 45%)" fill="url(#capGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left p-3">Stock</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Avg Price</th>
                <th className="text-right p-3">Current</th>
                <th className="text-right p-3">P&L</th>
                <th className="text-right p-3">%</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => (
                <tr key={p.symbol} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <span className="font-medium">{p.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{p.stock}</span>
                  </td>
                  <td className="text-right p-3 font-mono">{p.quantity}</td>
                  <td className="text-right p-3 font-mono">{p.avgPrice.toFixed(2)}</td>
                  <td className="text-right p-3 font-mono">{p.currentPrice.toFixed(2)}</td>
                  <td className={`text-right p-3 font-mono ${p.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                    {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(0)}
                  </td>
                  <td className={`text-right p-3 font-mono ${p.pnlPercent >= 0 ? "text-gain" : "text-loss"}`}>
                    {p.pnlPercent >= 0 ? "+" : ""}{p.pnlPercent.toFixed(2)}%
                  </td>
                  <td className="text-right p-3">
                    <Button variant="outline" size="sm" onClick={() => handleTrade(p.symbol, p.currentPrice, "SELL")}>
                      Sell
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-secondary/30 border border-border/50">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>This is a virtual portfolio for educational purposes only. No real money is involved.</span>
      </div>

      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        symbol={selectedStock}
        currentPrice={selectedPrice}
        action={tradeAction}
        onSuccess={refreshPortfolio}
      />
    </div>
  );
}
