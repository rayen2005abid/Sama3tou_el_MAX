import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Stock, StockHistorical, PriceForecast, SentimentData, Recommendation, SentimentSignal, NewsArticle } from "@/types/trading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { MessageSquare, TrendingUp, Info, ChevronsUpDown, Check } from "lucide-react";
import PriceChart from "@/components/PriceChart";
import { cn } from "@/lib/utils";
import { TradeModal } from "@/components/TradeModal";

export default function StockAnalysis() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selected, setSelected] = useState("TT");
  const [history, setHistory] = useState<StockHistorical[]>([]);
  const [forecast, setForecast] = useState<PriceForecast[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [sentimentSignal, setSentimentSignal] = useState<SentimentSignal | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showExplain, setShowExplain] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  useEffect(() => {
    api.getStocks().then(setStocks);
    api.getRecommendations().then(setRecommendations);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getStockHistory(selected),
      api.getStockForecast(selected),
      api.getStockSentiment(selected),
      api.getLatestSentiment(selected),
      api.getSentimentArticles(selected),
    ]).then(([h, f, s, sig, arts]) => {
      setHistory(h);
      setForecast(f);
      setSentiment(s);
      setSentimentSignal(sig);
      setArticles(arts);
    });
  }, [selected]);

  const currentStock = stocks.find(s => s.symbol === selected);
  const rec = recommendations.find(r => r.symbol === selected);


  // Simple RSI/MACD mock
  const rsi = 45 + Math.random() * 20;
  const macd = (Math.random() - 0.5) * 0.8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Analysis</h1>
          <p className="text-sm text-muted-foreground">Detailed analysis with forecasts & sentiment</p>
        </div>
        <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={selectorOpen} className="w-[260px] justify-between bg-card">
              {currentStock ? `${currentStock.symbol} — ${currentStock.name}` : "Select stock..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0 bg-card border-border z-50">
            <Command className="bg-card">
              <CommandInput placeholder="Search stock..." />
              <CommandList>
                <CommandEmpty>No stock found.</CommandEmpty>
                <CommandGroup>
                  {stocks.map(s => (
                    <CommandItem
                      key={s.symbol}
                      value={`${s.symbol} ${s.name}`}
                      onSelect={() => { setSelected(s.symbol); setSelectorOpen(false); }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selected === s.symbol ? "opacity-100" : "opacity-0")} />
                      <span className="font-mono mr-2">{s.symbol}</span>
                      <span className="text-muted-foreground truncate">{s.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stock header */}
      {currentStock && (
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">{currentStock.name}</h2>
              <p className="text-sm text-muted-foreground">{currentStock.sector} · {currentStock.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono">{currentStock.lastPrice.toFixed(2)} <span className="text-sm text-muted-foreground">TND</span></p>
              <p className={`font-mono text-sm ${currentStock.change >= 0 ? "text-gain" : "text-loss"}`}>
                {currentStock.change >= 0 ? "+" : ""}{currentStock.change.toFixed(2)} ({currentStock.changePercent.toFixed(2)}%)
              </p>
              <Button size="sm" className="mt-2" onClick={() => setTradeModalOpen(true)}>Buy {currentStock.symbol}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Summary Cards */}
      {forecast.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Tomorrow's Forecast (T+1)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {forecast[0].predicted.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">TND</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-background/50">
                  Range: {forecast[0].lower.toFixed(2)} - {forecast[0].upper.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> 5-Day Target (T+5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {forecast[forecast.length - 1].predicted.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">TND</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-background/50">
                  Range: {forecast[forecast.length - 1].lower.toFixed(2)} - {forecast[forecast.length - 1].upper.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price chart + forecast */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Price History + 5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart history={history} forecast={forecast} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentimentSignal ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xl font-bold ${sentimentSignal.sentiment_score > 0 ? "text-gain" : sentimentSignal.sentiment_score < 0 ? "text-loss" : "text-muted-foreground"}`}>
                      {(sentimentSignal.sentiment_score * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-muted-foreground uppercase">{sentimentSignal.sentiment_label}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sentimentSignal.article_count} Articles
                  </Badge>
                </div>

                {/* Score Bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20 z-10" />
                  <div
                    className={`h-full transition-all ${sentimentSignal.sentiment_score > 0 ? "bg-gain" : "bg-loss"}`}
                    style={{
                      width: `${Math.abs(sentimentSignal.sentiment_score * 50)}%`,
                      marginLeft: sentimentSignal.sentiment_score > 0 ? '50%' : `${50 - Math.abs(sentimentSignal.sentiment_score * 50)}%`
                    }}
                  />
                </div>

                {/* News List */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Recent News</p>
                  {articles.length > 0 ? (
                    articles.slice(0, 3).map((art) => (
                      <div key={art.id} className="text-xs border-b border-border/50 pb-2 last:border-0">
                        <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline font-medium line-clamp-1">
                          {art.title}
                        </a>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>{art.source}</span>
                          <span>{new Date(art.published_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No recent articles parsed.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <p>No sentiment data available for {selected}</p>
                <Button variant="outline" size="sm" onClick={() => api.getLatestSentiment(selected).then(setSentimentSignal)}>
                  Force Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Indicators */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">RSI (14)</span>
                <span className="font-mono">{rsi.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rsi}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>Oversold (30)</span><span>Overbought (70)</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">MACD</span>
                <span className={`font-mono ${macd >= 0 ? "text-gain" : "text-loss"}`}>{macd >= 0 ? "+" : ""}{macd.toFixed(3)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{macd >= 0 ? "Bullish crossover signal" : "Bearish divergence"}</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Volume</p>
              <p className="font-mono text-lg">{currentStock?.volume.toLocaleString() ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      {rec && (
        <Card className="glass-card glow-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-base font-bold px-4 py-1 ${rec.action === "BUY" ? "bg-gain/10 text-gain border-gain" :
                    rec.action === "SELL" ? "bg-loss/10 text-loss border-loss" :
                      "bg-warning/10 text-warning border-warning"
                    }`}
                  variant="outline"
                >
                  {rec.action}
                </Badge>
                <div>
                  <p className="font-medium">Agent Recommendation</p>
                  <p className="text-xs text-muted-foreground">Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <button
                onClick={() => setShowExplain(!showExplain)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Info className="w-4 h-4" /> {showExplain ? "Hide" : "Explain why"}
              </button>
            </div>
            {showExplain && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50 space-y-2">
                <p className="text-sm">{rec.reason}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rec.signals.map((sig, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{sig}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {currentStock && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          symbol={currentStock.symbol}
          currentPrice={currentStock.lastPrice}
          action="BUY"
        />
      )}
    </div>
  );
}
