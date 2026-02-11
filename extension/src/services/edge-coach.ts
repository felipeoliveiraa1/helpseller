/**
 * Edge Coach - Coordinates local vs backend processing
 * Intelligently routes objection matching based on hardware capabilities
 */

import { HardwareDetector, type HardwareProfile } from './hardware-detector';
import type { CachedObjection } from '../stores/coaching-store';

interface MatchResult {
    score: number;
    objectionId: string;
    triggerPhrase: string;
    suggestedResponse: string;
    mentalTrigger: string;
    coachingTip: string;
}

interface WorkerResponse {
    requestId: string;
    result: MatchResult | null;
    duration: number;
    timestamp: number;
}

interface PendingRequest {
    resolve: (value: WorkerResponse) => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

class EdgeCoach {
    private worker: Worker | null = null;
    private hardwareProfile: HardwareProfile | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private initialized = false;

    /**
     * Initializes edge coaching system
     * - Detects hardware capabilities
     * - Spawns worker if hardware is powerful
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('⚠️ Edge coach already initialized');
            return;
        }

        console.log('🚀 Initializing Edge Coach...');

        // 1. Detect hardware
        const detector = new HardwareDetector();
        this.hardwareProfile = await detector.detect();

        console.log('🖥️ Hardware Profile:', {
            cpuCores: this.hardwareProfile.cpuCores,
            deviceMemory: this.hardwareProfile.deviceMemory,
            networkLatency: `${this.hardwareProfile.networkLatency}ms`,
            isPowerful: this.hardwareProfile.isPowerful
        });

        // 2. If powerful, initialize worker
        if (this.hardwareProfile.isPowerful) {
            try {
                this.worker = new Worker(
                    new URL('../workers/objection-matcher.worker.ts', import.meta.url),
                    { type: 'module' }
                );

                this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                    this.handleWorkerResult(e.data);
                };

                this.worker.onerror = (error) => {
                    console.error('❌ Worker error:', error);
                };

                console.log('✅ Local matcher worker initialized');
            } catch (error) {
                console.error('❌ Failed to initialize worker:', error);
                this.hardwareProfile.isPowerful = false; // Fallback to backend
            }
        } else {
            console.log('⚠️ Weak hardware detected, using backend only');
        }

        this.initialized = true;
    }

    /**
     * Processes transcript chunk with intelligent routing
     * Returns match result if processed locally, null if should use backend
     */
    async processTranscript(
        text: string,
        speaker: string,
        cachedObjections: CachedObjection[]
    ): Promise<MatchResult | null> {
        // Only process objections from lead/client
        if (speaker !== 'lead' && speaker !== 'Cliente' && speaker !== 'client') {
            return null;
        }

        // If hardware is weak, use backend
        if (!this.hardwareProfile?.isPowerful || !this.worker) {
            console.log('📡 Using backend (weak hardware or no worker)');
            return null;
        }

        // Check cache availability
        if (cachedObjections.length === 0) {
            console.warn('⚠️ No cached objections, falling back to backend');
            return null;
        }

        // Attempt local processing with timeout
        try {
            const startTime = performance.now();
            const response = await this.matchLocal(text, cachedObjections, 200); // 200ms timeout
            const totalDuration = performance.now() - startTime;

            if (response.result) {
                console.log(
                    `⚡ LOCAL MATCH: ${Math.round(totalDuration)}ms | Score: ${response.result.score.toFixed(2)} | ${response.result.coachingTip.substring(0, 50)}...`
                );
            } else {
                console.log(`⚡ LOCAL: No match (${Math.round(totalDuration)}ms)`);
            }

            return response.result;
        } catch (error) {
            if (error instanceof Error && error.message === 'Timeout') {
                console.warn('⏱️ Local timeout (>200ms), falling back to backend');
            } else {
                console.error('❌ Local processing error:', error);
            }
            return null; // Fallback to backend
        }
    }

    /**
     * Sends match request to worker with timeout
     */
    private matchLocal(
        text: string,
        objections: CachedObjection[],
        timeoutMs: number
    ): Promise<WorkerResponse> {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(2);

            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Timeout'));
            }, timeoutMs);

            this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

            this.worker!.postMessage({ requestId, text, objections });
        });
    }

    /**
     * Handles worker response
     */
    private handleWorkerResult(data: WorkerResponse): void {
        const pending = this.pendingRequests.get(data.requestId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            pending.resolve(data);
            this.pendingRequests.delete(data.requestId);
        }
    }

    /**
     * Get hardware profile (for debugging/monitoring)
     */
    getHardwareProfile(): HardwareProfile | null {
        return this.hardwareProfile;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingRequests.clear();
        this.initialized = false;
        console.log('🛑 Edge coach destroyed');
    }
}

// Singleton instance
export const edgeCoach = new EdgeCoach();
