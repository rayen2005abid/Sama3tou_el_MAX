import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Brain, ShieldAlert, Cpu, CheckCircle2, Zap, BarChart3, Network } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

// Mock data generator for charts
const generatePerformanceData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        accuracy: 90 + Math.random() * 8,
        loss: 10 + Math.random() * 5,
    }));
};

const radarData = [
    { subject: 'Accuracy', A: 92, fullMark: 100 },
    { subject: 'Speed', A: 98, fullMark: 100 },
    { subject: 'Recall', A: 86, fullMark: 100 },
    { subject: 'Precision', A: 82, fullMark: 100 },
    { subject: 'Stability', A: 99, fullMark: 100 },
    { subject: 'Adaptability', A: 85, fullMark: 100 },
];

export default function ModelPerformance() {
    const [metrics, setMetrics] = useState<any>(null);
    const [perfData, setPerfData] = useState(generatePerformanceData());

    useEffect(() => {
        // Fetch from new endpoint
        const fetchMetrics = async () => {
            try {
                // In real app use api service, here direct fetch for speed/mock
                // We'll use the API_BASE from env or default
                const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
                const res = await fetch(`${API_BASE}/system/metrics`);
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (e) {
                console.error("Failed to fetch metrics", e);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000); // Live update every 3s
        return () => clearInterval(interval);
    }, []);

    // Update chart data periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setPerfData(prev => {
                const next = [...prev.slice(1)];
                next.push({
                    time: prev[prev.length - 1].time + 1,
                    accuracy: 90 + Math.random() * 8,
                    loss: 10 + Math.random() * 5
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!metrics) return <div className="p-8 text-center">Loading Neural Interface...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        AI Command Center
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Status: ONLINE · Latency: 12ms · Neural Net Active
                    </p>
                </div>
                <div className="flex gap-4 font-mono text-sm">
                    <div className="bg-card p-2 rounded border border-primary/20">
                        <span className="text-muted-foreground">CPU Load:</span> <span className="text-primary font-bold">{metrics.system.cpu_load}</span>
                    </div>
                    <div className="bg-card p-2 rounded border border-primary/20">
                        <span className="text-muted-foreground">Uptime:</span> <span className="text-green-500 font-bold">{metrics.system.uptime}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Forecasting Core */}
                <Card className="glass-card border-l-4 border-l-blue-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Brain size={100} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Brain className="text-blue-500" /> Forecasting Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-muted-foreground">Model Architecture</p>
                                <p className="font-mono font-bold text-lg">{metrics.forecasting.model_name}</p>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">{metrics.forecasting.status}</Badge>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Accuracy Score</span>
                                <span className="font-bold text-blue-400">{metrics.forecasting.accuracy_score}%</span>
                            </div>
                            <Progress value={metrics.forecasting.accuracy_score} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-secondary/30 p-2 rounded">
                                <p className="text-xs text-muted-foreground">RMSE</p>
                                <p className="font-mono font-bold">{metrics.forecasting.rmse}</p>
                            </div>
                            <div className="bg-secondary/30 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Next Retrain</p>
                                <p className="font-mono font-bold">{metrics.forecasting.next_retrain}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Anomaly Watchdog */}
                <Card className="glass-card border-l-4 border-l-red-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert size={100} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldAlert className="text-red-500" /> Anomaly Watchdog
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-muted-foreground">Model Type</p>
                                <p className="font-mono font-bold text-lg">{metrics.anomaly.model_name}</p>
                            </div>
                            <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">{metrics.anomaly.status}</Badge>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>System Integrity</span>
                                <span className="font-bold text-red-400">{metrics.anomaly.integrity_score}%</span>
                            </div>
                            <Progress value={metrics.anomaly.integrity_score} className="h-2" IndicatorClassName="bg-red-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-secondary/30 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Latency</p>
                                <p className="font-mono font-bold">{metrics.anomaly.detection_rate}</p>
                            </div>
                            <div className="bg-secondary/30 p-2 rounded">
                                <p className="text-xs text-muted-foreground">24h Alerts</p>
                                <p className="font-mono font-bold text-red-400">{metrics.anomaly.anomalies_24h}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sentiment Cortex */}
                <Card className="glass-card border-l-4 border-l-purple-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Network size={100} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Network className="text-purple-500" /> Sentiment Cortex
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-muted-foreground">LLM Engine</p>
                                <p className="font-mono font-bold text-lg">{metrics.sentiment.model_name}</p>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">{metrics.sentiment.status}</Badge>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Confidence Avg</span>
                                <span className="font-bold text-purple-400">{metrics.sentiment.confidence_avg}%</span>
                            </div>
                            <Progress value={metrics.sentiment.confidence_avg} className="h-2" IndicatorClassName="bg-purple-500" />
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-center">
                            <div className="bg-secondary/30 p-2 rounded flex justify-between px-4 items-center">
                                <p className="text-xs text-muted-foreground">Throughput</p>
                                <p className="font-mono font-bold text-emerald-400">{metrics.sentiment.throughput}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Performance Chart */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm"><Activity className="w-4 h-4" /> Live Inference Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={perfData}>
                                <defs>
                                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Area type="monotone" dataKey="accuracy" stroke="#8884d8" fillOpacity={1} fill="url(#colorAcc)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Model Comparison Radar */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm"><Cpu className="w-4 h-4" /> System Capability Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Capabilities" dataKey="A" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
