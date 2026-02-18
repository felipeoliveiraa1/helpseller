/**
 * Hardware Detector - Evaluates client hardware capability
 * Determines if local processing should be used or fallback to backend
 */
import { apiBaseUrl } from '@/config/env';

export interface HardwareProfile {
    cpuCores: number;
    deviceMemory: number; // GB estimate
    connectionType: string;
    networkLatency: number; // ms
    isPowerful: boolean; // Final decision
}

export class HardwareDetector {
    private static readonly POWERFUL_THRESHOLD = {
        MIN_CPU_CORES: 4,
        MIN_MEMORY_GB: 4,
        MAX_LATENCY_MS: 150
    };

    /**
     * Detects hardware capabilities and determines if local processing is viable
     */
    async detect(): Promise<HardwareProfile> {
        const cpuCores = navigator.hardwareConcurrency || 2;
        const deviceMemory = (navigator as any).deviceMemory || 4; // DeviceMemory API
        const connection = (navigator as any).connection;
        const connectionType = connection?.effectiveType || 'unknown';

        // Measure network latency to backend
        const networkLatency = await this.measureLatency();

        // Decision: Hardware is powerful if it meets all thresholds
        const isPowerful =
            cpuCores >= HardwareDetector.POWERFUL_THRESHOLD.MIN_CPU_CORES &&
            deviceMemory >= HardwareDetector.POWERFUL_THRESHOLD.MIN_MEMORY_GB &&
            networkLatency < HardwareDetector.POWERFUL_THRESHOLD.MAX_LATENCY_MS;

        const profile: HardwareProfile = {
            cpuCores,
            deviceMemory,
            connectionType,
            networkLatency,
            isPowerful
        };

        console.log('🖥️ Hardware Profile:', profile);

        return profile;
    }

    /**
     * Measures average network latency to backend with 3 ping attempts
     */
    private async measureLatency(): Promise<number> {
        const attempts = 3;
        const latencies: number[] = [];

        for (let i = 0; i < attempts; i++) {
            try {
                const start = performance.now();
                await fetch(`${apiBaseUrl}/health`, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                const duration = performance.now() - start;
                latencies.push(duration);
            } catch (error) {
                console.warn(`Ping attempt ${i + 1} failed, assuming high latency`);
                latencies.push(500); // Assume high latency on error
            }

            // Small delay between pings
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Calculate average
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        return Math.round(avgLatency);
    }

    /**
     * Re-evaluates hardware (useful for dynamic conditions)
     */
    async reevaluate(): Promise<HardwareProfile> {
        return this.detect();
    }
}

// Singleton instance
export const hardwareDetector = new HardwareDetector();
