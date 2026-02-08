
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

export function AnomalyPoller() {
    const { toast } = useToast();
    const [lastAnomalyId, setLastAnomalyId] = useState<string | null>(null);

    useEffect(() => {
        const checkAnomalies = async () => {
            try {
                const anomalies = await api.getAnomalies();
                if (anomalies.length === 0) return;

                // Sort by ID descending (assuming numeric ID or lexicographical)
                // Actually assuming API returns sorted desc by date, so first is latest
                const latest = anomalies[0];

                if (lastAnomalyId === null) {
                    // First load, just set tracking
                    setLastAnomalyId(latest.id);
                } else if (extractId(latest.id) > extractId(lastAnomalyId)) {
                    // New anomaly found
                    setLastAnomalyId(latest.id);

                    toast({
                        title: "New Market Anomaly Detected",
                        description: `${latest.stock}: ${latest.type === 'volume_spike' ? 'Volume Spike' : 'Price Shock'} detected.`,
                        variant: "destructive", // Red
                        duration: 5000,
                    });
                }
            } catch (e) {
                console.error("Anomaly poll failed", e);
            }
        };

        // Check immediately
        checkAnomalies();

        // Then poll every 60 seconds
        const interval = setInterval(checkAnomalies, 60000);
        return () => clearInterval(interval);
    }, [lastAnomalyId, toast]);

    return null; // Renderless component
}

// Helper to handle ID comparison safely
function extractId(id: string): number {
    return parseInt(id, 10) || 0;
}
