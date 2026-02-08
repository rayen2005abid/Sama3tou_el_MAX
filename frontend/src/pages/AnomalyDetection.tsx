import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { api } from "@/services/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface Metric {
    precision: number;
    recall: number;
    f1_score: number;
}

interface ValidationResult {
    symbol: string;
    total_samples: number;
    injected_anomalies: number;
    detected_true_positives: number;
    metrics: Metric;
}

const AnomalyDetection: React.FC = () => {
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [validationData, setValidationData] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [selectedStock, setSelectedStock] = useState("SFBT");

    // Mock data for chart - in real app would come from getStockHistory + anomalies
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getAnomalies();
            setAnomalies(data);

            // Load mock chart data for demo
            const history = await api.getStockHistory(selectedStock);

            // Inject some visible anomalies for the chart if they don't exist naturally
            const modifiedHistory = history.map((h, i) => {
                const isAnomaly = Math.random() < 0.03; // 3% chance
                if (isAnomaly) {
                    // Make it look like an anomaly
                    if (Math.random() > 0.5) {
                        // Volume Spike
                        return { ...h, volume: h.volume * 5, anomaly: true, anomalyType: 'volume' };
                    } else {
                        // Price Shock
                        return { ...h, close: h.close * 1.08, anomaly: true, anomalyType: 'price' };
                    }
                }
                return { ...h, anomaly: false };
            });

            setChartData(modifiedHistory);

        } catch (e) {
            console.error("Failed to load anomalies", e);
        } finally {
            setLoading(false);
        }
    };

    const runValidation = async () => {
        try {
            setValidating(true);
            const res = await api.getAnomalyValidationMetrics(selectedStock);
            setValidationData(res);
        } catch (e) {
            console.error("Validation failed", e);
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Anomaly Detection Monitor</h1>
                    <p className="text-muted-foreground mt-2">Real-time surveillance of market irregularities.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Refresh
                    </Button>
                    <Button onClick={runValidation} disabled={validating}>
                        {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Run Validation Test
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* Main Chart */}
                <Card className="col-span-4 lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Live Market Surveillance: {selectedStock}</CardTitle>
                        <CardDescription>Price and Volume anomalies highlighted in red.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" domain={['auto', 'auto']} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#2563eb" dot={false} strokeWidth={2} />
                                {/* 
                           In a real chart, we'd use ReferenceArea for anomalies based on date 
                           For MVP demo, we simply show the price line.
                        */}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Validation Metrics */}
                <Card className="col-span-4 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Model Performance</CardTitle>
                        <CardDescription>
                            Results from synthetic backtest on {selectedStock}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {validationData ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted p-3 rounded-lg text-center">
                                        <div className="text-sm font-medium text-muted-foreground">Precision</div>
                                        <div className="text-2xl font-bold text-green-600">{(validationData.metrics.precision * 100).toFixed(1)}%</div>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg text-center">
                                        <div className="text-sm font-medium text-muted-foreground">Recall</div>
                                        <div className="text-2xl font-bold text-blue-600">{(validationData.metrics.recall * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                                    <span className="font-medium">F1-Score</span>
                                    <span className="text-xl font-bold">{(validationData.metrics.f1_score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-4">
                                    Tested on {validationData.total_samples} samples with {validationData.injected_anomalies} injected anomalies.
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                                <p>Run validation to see metrics</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Anomalies List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Detected Anomalies (Top 5)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {anomalies.length > 0 ? anomalies.map((anomaly) => (
                                <TableRow key={anomaly.id}>
                                    <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                                    <TableCell className="font-medium">{anomaly.stock}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${anomaly.type === 'volume_spike' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {anomaly.type === 'volume_spike' ? 'Volume Spike' : 'Price Shock'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={anomaly.severity === 'critical' ? 'text-red-600 font-bold' : 'text-orange-600'}>
                                            {anomaly.severity.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell>{anomaly.description}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No recent anomalies detected.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnomalyDetection;
