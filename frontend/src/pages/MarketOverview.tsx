import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Stock, MarketIndex, Anomaly, Recommendation } from "@/types/trading";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketOverview() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    Promise.all([api.getStocks(), api.getIndices(), api.getAnomalies(), api.getRecommendations()]).then(
      ([s, i, a, r]) => { setStocks(s); setIndices(i); setAnomalies(a); setRecommendations(r); }
    );
  }, []);

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const avgSentiment = 0.38; // mock

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
        <p className="text-sm text-muted-foreground">Tunis Stock Exchange — BVMT</p>
      </div>

      {/* Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => (
          <Card key={idx.name} className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{idx.name}</p>
              <p className="text-2xl font-bold font-mono">{idx.value.toLocaleString()}</p>
              <div className={`flex items-center gap-1 text-sm font-mono ${idx.change >= 0 ? "text-gain" : "text-loss"}`}>
                {idx.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)} ({idx.changePercent.toFixed(2)}%)
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Market Sentiment</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold font-mono text-gain">+{avgSentiment.toFixed(2)}</p>
              <Badge variant="outline" className="border-gain text-gain text-xs">Positive</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on 47 articles today</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Alerts</p>
            <p className="text-2xl font-bold font-mono text-warning">{anomalies.filter(a => !a.resolved).length}</p>
            <p className="text-xs text-muted-foreground mt-1">{anomalies.length} total today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gain" /> Top 5 Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {gainers.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <div>
                    <span className="font-medium text-sm">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm">{s.lastPrice.toFixed(2)}</span>
                    <span className="text-gain font-mono text-xs ml-2">+{s.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-loss" /> Top 5 Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {losers.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <div>
                    <span className="font-medium text-sm">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm">{s.lastPrice.toFixed(2)}</span>
                    <span className="text-loss font-mono text-xs ml-2">{s.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {anomalies.filter(a => !a.resolved).slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <Activity className={`w-4 h-4 mt-0.5 ${a.severity === "critical" ? "text-loss" : "text-warning"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
                <Badge variant={a.severity === "critical" ? "destructive" : "outline"} className="text-xs shrink-0">
                  {a.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations preview */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Today's Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recommendations.slice(0, 5).map((r) => (
              <div key={r.symbol} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`text-xs font-bold w-12 justify-center ${
                      r.action === "BUY" ? "bg-gain/10 text-gain border-gain" :
                      r.action === "SELL" ? "bg-loss/10 text-loss border-loss" :
                      "bg-warning/10 text-warning border-warning"
                    }`}
                    variant="outline"
                  >
                    {r.action}
                  </Badge>
                  <div>
                    <span className="font-medium text-sm">{r.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.stock}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="font-mono text-sm ml-2">{(r.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
