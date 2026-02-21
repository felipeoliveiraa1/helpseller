import WebSocket from 'ws';
import { logger } from '../../shared/utils/logger.js';
import { env } from '../../shared/config/env.js';

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

const DEEPGRAM_QUERY_PARAMS: Record<string, string> = {
    model: 'nova-2',
    language: 'pt-BR',
    punctuate: 'true',
    smart_format: 'true',
    interim_results: 'true',
    endpointing: '1000',
    utterance_end_ms: '1500',
    vad_events: 'true',
};

const KEEPALIVE_INTERVAL_MS = 3_000;
const RECONNECT_DELAY_MS = 1_000;

interface DeepgramTranscriptResponse {
    type: string;
    channel_index: number[];
    duration: number;
    start: number;
    is_final: boolean;
    speech_final: boolean;
    channel: {
        alternatives: Array<{
            transcript: string;
            confidence: number;
            words: Array<{
                word: string;
                start: number;
                end: number;
                confidence: number;
            }>;
        }>;
    };
}

interface DeepgramUtteranceEndResponse {
    type: 'UtteranceEnd';
    channel: number[];
    last_word_end: number;
}

export type DeepgramCallback = (text: string) => void;
export type DeepgramUtteranceEndCallback = () => void;
export type DeepgramErrorCallback = (error: Error) => void;

/**
 * Low-level Deepgram streaming client using raw WebSocket (ws).
 * One instance per audio channel (lead / seller).
 */
export class DeepgramRealtimeClient {
    private ws: WebSocket | null = null;
    private keepAliveTimer: NodeJS.Timeout | null = null;
    private hasReconnected = false;
    private isClosed = false;
    private role: string;
    private pendingAudio: Buffer[] = [];

    onInterim: DeepgramCallback = () => {};
    onFinal: DeepgramCallback = () => {};
    onUtteranceEnd: DeepgramUtteranceEndCallback = () => {};
    onError: DeepgramErrorCallback = () => {};

    constructor(role: string) {
        this.role = role;
    }

    async connect(): Promise<void> {
        if (this.isClosed) return;

        const apiKey = env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            throw new Error('DEEPGRAM_API_KEY is not configured');
        }

        const queryString = new URLSearchParams(DEEPGRAM_QUERY_PARAMS).toString();
        const url = `${DEEPGRAM_WS_URL}?${queryString}`;

        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(url, {
                headers: { Authorization: `Token ${apiKey}` },
            });

            this.ws.on('open', () => {
                logger.info(`🎙️ Deepgram [${this.role}] connected`);
                this.startKeepAlive();
                if (this.pendingAudio.length > 0) {
                    console.log(`[DG] [${this.role}] Flushing ${this.pendingAudio.length} buffered chunks (includes WebM header)`);
                    for (const buf of this.pendingAudio) {
                        this.ws!.send(buf);
                    }
                    this.pendingAudio = [];
                }
                resolve();
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                this.handleMessage(data);
            });

            this.ws.on('close', (code: number, reason: Buffer) => {
                logger.info({ code, reason: reason.toString() }, `🎙️ Deepgram [${this.role}] closed`);
                this.stopKeepAlive();
                this.attemptReconnect();
            });

            this.ws.on('error', (err: Error) => {
                logger.error({ err }, `🎙️ Deepgram [${this.role}] error`);
                this.onError(err);
                reject(err);
            });
        });
    }

    sendAudio(buffer: Buffer): void {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
            return;
        }
        if (this.ws.readyState === WebSocket.CONNECTING) {
            this.pendingAudio.push(buffer);
            return;
        }
        this.ws.send(buffer);
    }

    /** Send CloseStream to flush remaining audio and get final transcript. */
    finish(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'CloseStream' }));
    }

    close(): void {
        this.isClosed = true;
        this.pendingAudio = [];
        this.stopKeepAlive();
        if (this.ws) {
            const state = this.ws.readyState;
            if (state === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'CloseStream' }));
                this.ws.removeAllListeners();
                this.ws.close();
            } else if (state === WebSocket.CONNECTING) {
                this.ws.removeAllListeners();
                this.ws.on('open', () => this.ws?.close());
                this.ws.on('error', () => {});
            } else {
                this.ws.removeAllListeners();
            }
            this.ws = null;
        }
    }

    getReadyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    private dgMessageCount = 0;

    private handleMessage(data: WebSocket.Data): void {
        try {
            const message = JSON.parse(data.toString());
            this.dgMessageCount++;
            if (this.dgMessageCount <= 3 || this.dgMessageCount % 100 === 0) {
                logger.info(`[DG MSG #${this.dgMessageCount}] [${this.role}] type=${message.type}`);
            }
            if (message.type === 'Results') {
                this.handleTranscriptResult(message as DeepgramTranscriptResponse);
            } else if (message.type === 'UtteranceEnd') {
                logger.info(`[DG UTTERANCE_END] [${this.role}]`);
                this.onUtteranceEnd();
            } else if (message.type === 'SpeechStarted') {
                logger.info(`[DG SPEECH_STARTED] [${this.role}]`);
            } else if (message.type === 'Metadata') {
                logger.info(`[DG METADATA] [${this.role}] request_id=${message.request_id}`);
            } else if (message.type === 'Error') {
                logger.error({ message }, `🎙️ Deepgram [${this.role}] server error`);
                this.onError(new Error(message.description || 'Deepgram server error'));
            }
        } catch (err) {
            logger.error({ err }, `🎙️ Deepgram [${this.role}] failed to parse message`);
        }
    }

    private dgResultCount = 0;

    private handleTranscriptResult(result: DeepgramTranscriptResponse): void {
        this.dgResultCount++;
        const transcript = result.channel?.alternatives?.[0]?.transcript || '';
        if (this.dgResultCount <= 5 || this.dgResultCount % 50 === 0) {
            logger.info(`[DG RESULT #${this.dgResultCount}] [${this.role}] is_final=${result.is_final} speech_final=${result.speech_final} text="${transcript.slice(0, 60)}" dur=${result.duration?.toFixed(1)}`);
        }
        if (!transcript.trim()) return;
        if (result.is_final) {
            logger.info(`[DG FINAL] [${this.role}] "${transcript.slice(0, 80)}"`);
            this.onFinal(transcript);
        } else {
            logger.info(`[DG INTERIM] [${this.role}] "${transcript.slice(0, 80)}"`);
            this.onInterim(transcript);
        }
    }

    private startKeepAlive(): void {
        this.stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
            }
        }, KEEPALIVE_INTERVAL_MS);
    }

    private stopKeepAlive(): void {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }

    private attemptReconnect(): void {
        if (this.isClosed || this.hasReconnected) return;
        this.hasReconnected = true;

        logger.info(`🎙️ Deepgram [${this.role}] attempting reconnect in ${RECONNECT_DELAY_MS}ms...`);

        setTimeout(async () => {
            try {
                await this.connect();
                logger.info(`🎙️ Deepgram [${this.role}] reconnected successfully`);
            } catch (err) {
                logger.error({ err }, `🎙️ Deepgram [${this.role}] reconnect failed`);
                this.onError(err instanceof Error ? err : new Error(String(err)));
            }
        }, RECONNECT_DELAY_MS);
    }
}
