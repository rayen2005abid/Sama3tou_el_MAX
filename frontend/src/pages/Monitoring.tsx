import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Anomaly } from "@/types/trading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, AlertTriangle, Activity, CheckCircle2, Clock, Zap } from "lucide-react";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-loss/10 text-loss border-loss",
  high: "bg-warning/10 text-warning border-warning",
  medium: "bg-info text-primary-foreground",
  low: "bg-secondary text-secondary-foreground",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  volume_spike: <Zap className="w-5 h-5" />,
  price_jump: <Activity className="w-5 h-5" />,
  suspicious_pattern: <AlertTriangle className="w-5 h-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  volume_spike: "Volume Spike",
  price_jump: "Price Jump",
  suspicious_pattern: "Suspicious Pattern",
};

export default function Monitoring() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { api.getAnomalies().then(setAnomalies); }, []);

  const filtered = anomalies.filter(a => filter === "all" || a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring & Alerts</h1>
          <p className="text-sm text-muted-foreground">Real-time anomaly detection · Market surveillance</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="volume_spike">Volume Spikes</SelectItem>
            <SelectItem value="price_jump">Price Jumps</SelectItem>
            <SelectItem value="suspicious_pattern">Suspicious Patterns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-loss/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-loss" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-xl font-bold font-mono">{anomalies.filter(a => a.severity === "critical").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-xl font-bold font-mono">{anomalies.filter(a => a.severity === "high").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-xl font-bold font-mono">{anomalies.filter(a => !a.resolved).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gain/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-gain" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-xl font-bold font-mono">{anomalies.filter(a => a.resolved).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly feed */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className={`glass-card transition-all ${!a.resolved ? "border-l-2" : ""} ${
            a.severity === "critical" ? "border-l-loss" :
            a.severity === "high" ? "border-l-warning" : ""
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${
                  a.severity === "critical" ? "text-loss" :
                  a.severity === "high" ? "text-warning" : "text-muted-foreground"
                }`}>
                  {TYPE_ICONS[a.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">{a.description}</h3>
                    <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[a.severity]}`}>
                      {a.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[a.type]}</Badge>
                    {a.resolved && (
                      <Badge className="text-[10px] bg-gain/10 text-gain border-gain" variant="outline">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-mono">{a.stock}</span> · {new Date(a.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">{a.details}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
