import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../infrastructure/supabase/client.js';
import { redis } from '../../infrastructure/cache/redis.js';
import { logger } from '../../shared/utils/logger.js';
import { WebSocket } from 'ws';

// AI Imports
import { CoachEngine } from '../ai/coach-engine.js';
import { OpenAIClient } from '../ai/openai-client.js';
import { ObjectionMatcher } from '../ai/objection-matcher.js';
import { TriggerDetector } from '../ai/trigger-detector.js';
import { PromptBuilder } from '../ai/prompt-builder.js';
import { ResponseParser } from '../ai/response-parser.js';
import { PostCallAnalyzer } from '../ai/post-call-analyzer.js';
import { WhisperClient } from '../ai/whisper-client.js';

// Types
export interface CallSession {
    callId: string;
    userId: string;
    scriptId: string;
    transcript: TranscriptChunk[];
    currentStep: number;
    // AI State
    lastCoachingAt?: number;
    leadProfile?: any;
    lastCoaching?: string;
    startupTime?: number;
    lastTranscription?: string; // Context for prompt chaining
    webmHeader?: Buffer[];
}

export interface TranscriptChunk {
    text: string;
    speaker: 'seller' | 'lead';
    timestamp: number;
}

// Hallucination Patterns (Whisper known issues)
const HALLUCINATION_PATTERNS = [
    /legendas?\s+(pela|por)\s+comunidade/i,
    /amara\.org/i,
    /obrigad[oa]\s+por\s+assistir/i,
    /acesse\s+o\s+site/i,
    /rádio\s+onu/i,
    /www\.\w+\.org/i,
    /inscreva-se/i,
    /subscribe/i,
    /like\s+and\s+subscribe/i,
    /thanks?\s+for\s+watching/i,
    /subtitles?\s+by/i,
    /translated\s+by/i,
    /♪|♫|🎵/,                    // Notes
    /^\s*\.+\s*$/,               // Just dots
    /^\s*,+\s*$/,                // Just commas
    /^(tchau[,.\s]*)+$/i,        // Repeated 'tchau'
    /^(.{1,15}[,.\s]+)\1{2,}$/i, // Short repeated phrases
];

function isHallucination(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.replace(/[^a-zA-ZÀ-ú]/g, '').length < 3) return true; // Too short
    for (const pattern of HALLUCINATION_PATTERNS) {
        if (pattern.test(trimmed)) return true;
    }
    return false;
}

export async function websocketRoutes(fastify: FastifyInstance) {
    // Initialize AI Engine
    const openaiClient = new OpenAIClient();
    const coachEngine = new CoachEngine(
        new TriggerDetector(),
        new ObjectionMatcher(),
        new PromptBuilder(),
        openaiClient,
        new ResponseParser()
    );
    const postCallAnalyzer = new PostCallAnalyzer(openaiClient);
    const whisperClient = new WhisperClient();

    fastify.get('/ws/call', { websocket: true }, async (socket, req) => {
        logger.info('🔌 New WebSocket connection attempt');

        const token = (req.query as any).token;
        if (!token) {
            socket.close(1008, 'Token required');
            return;
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            socket.close(1008, 'Invalid token');
            return;
        }

        logger.info(`✅ User authenticated: ${user.id}`);
        let callId: string | null = null;
        let sessionData: CallSession | null = null;
        let audioBuffer: Buffer[] = [];
        let transcriptionTimer: NodeJS.Timeout | null = null;

        socket.on('message', async (message: string) => {
            try {
                const event = JSON.parse(message.toString());

                switch (event.type) {
                    case 'call:start':
                        await handleCallStart(event, user.id, socket);
                        break;
                    case 'audio:chunk':
                        // Legacy handler - kept for compatibility
                        await handleAudioChunk(event, socket);
                        break;
                    case 'audio:segment':
                        // New handler - complete WebM segment
                        await handleAudioSegment(event, socket);
                        break;
                    case 'transcript:chunk':
                        await handleTranscript(event, callId, socket);
                        break;
                    case 'call:end':
                        await handleCallEnd(callId, socket);
                        break;
                }
            } catch (err: any) {
                logger.error({
                    message: err?.message,
                    name: err?.name,
                    stack: err?.stack,
                    code: err?.code
                }, '❌ Error handling message');
            }
        });

        socket.on('close', (code, reason) => {
            logger.info({ code, reason: reason?.toString() }, '🔌 WS Disconnected');
        });

        socket.on('error', (err) => {
            logger.error({ err }, '🔌 WS Error');
        });

        // --- Handlers ---

        async function handleCallStart(event: any, userId: string, ws: WebSocket) {
            const { scriptId, platform } = event.payload;

            const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', userId).single();
            if (!profile) return ws.close(1011);

            const { data: call } = await supabaseAdmin.from('calls')
                .insert({
                    user_id: userId,
                    organization_id: profile.organization_id,
                    script_id: scriptId,
                    platform: platform || 'OTHER',
                    status: 'ACTIVE',
                    started_at: new Date().toISOString(),
                })
                .select().single();

            if (!call) return;
            callId = call.id;

            const session: CallSession = {
                callId: call.id,
                userId: userId,
                scriptId: scriptId,
                transcript: [],
                currentStep: 1,
                lastCoachingAt: 0,
                startupTime: Date.now()
            };

            await redis.set(`call:${call.id}`, session, 3600 * 4);
            sessionData = session;

            ws.send(JSON.stringify({ type: 'call:started', payload: { callId: call.id } }));
        }

        async function handleTranscript(event: any, currentCallId: string | null, ws: WebSocket) {
            if (!currentCallId || !sessionData) {
                // Try reload from redis if local var missing (reconnection scenario)
                if (currentCallId) {
                    sessionData = await redis.get(`call:${currentCallId}`);
                }
                if (!sessionData) return;
            }

            const chunk: TranscriptChunk = event.payload;

            // 1. Update Session
            sessionData.transcript.push(chunk);

            // 2. Process with AI Engine
            const events = await coachEngine.processTranscriptChunk(chunk, sessionData);

            // 3. Send AI Events to Client
            for (const aiEvent of events) {
                ws.send(JSON.stringify({
                    type: 'COACHING_MESSAGE', // Mapping to what frontend expects
                    payload: aiEvent // Frontend should handle this structure
                }));

                // Update session based on event (e.g. lastCoachingAt)
                sessionData.lastCoachingAt = Date.now();
                if (aiEvent.type === 'stage_change' && aiEvent.currentStep) {
                    sessionData.currentStep = aiEvent.currentStep;
                }
            }

            // 4. Persist State
            await redis.set(`call:${currentCallId}`, sessionData, 3600 * 4);
        }

        async function handleCallEnd(currentCallId: string | null, ws: WebSocket) {
            if (!currentCallId || !sessionData) return;

            // 1. Generate Summary
            // Need to fetch script details first in real app
            const summary = await postCallAnalyzer.generate(sessionData, "Standard Script", ["Intro", "Discovery", "Close"]);

            // 2. Send Summary to Client
            ws.send(JSON.stringify({
                type: 'call:summary',
                payload: summary
            }));

            // 3. Update DB
            await supabaseAdmin.from('calls').update({
                status: 'COMPLETED',
                ended_at: new Date().toISOString(),
                transcript: sessionData.transcript, // Save full transcript
                // summary: summary // If column exists
            }).eq('id', currentCallId);

            // 4. Save Summary to specific table
            if (summary) {
                await supabaseAdmin.from('call_summaries').insert({
                    call_id: currentCallId,
                    ...summary
                });
            }
            // 4. Clear Redis
            await redis.del(`call:${currentCallId}`);
        }

        async function handleAudioChunk(event: any, ws: WebSocket) {
            const audioData = Buffer.from(event.payload.audio, 'base64');
            audioBuffer.push(audioData);

            logger.info(`📦 Received audio chunk: ${audioData.length} bytes, buffer size: ${audioBuffer.length}`);

            // Logic: Transcribe every ~3 seconds of audio (3 chunks of 1s)
            const CHUNKS_TO_PROCESS = 3;

            if (audioBuffer.length >= CHUNKS_TO_PROCESS) {
                // Concatenate all binary buffers (MediaRecorder chunks form valid WebM when concatenated)
                const finalBuffer = Buffer.concat(audioBuffer);
                audioBuffer = []; // Clear buffer immediately

                logger.info(`🎤 Transcribing ${finalBuffer.length} bytes of audio...`);

                try {
                    const prompt = "Transcreva o áudio. Identifique como 'Vendedor:' e 'Cliente:' se possível.";
                    const text = await whisperClient.transcribe(finalBuffer, prompt);

                    if (text && text.trim().length > 0) {
                        logger.info(`✨ Transcription result: ${text}`);

                        // Send transcription result to socket
                        ws.send(JSON.stringify({
                            type: 'transcript:chunk',
                            payload: {
                                text: text,
                                isFinal: true
                            }
                        }));
                    }
                } catch (err) {
                    logger.error('❌ Whisper transcription failed', err);
                }
            }
        }

        async function handleAudioSegment(event: any, ws: WebSocket) {
            // Each segment is a COMPLETE, INDEPENDENT WebM file
            const audioBuffer = Buffer.from(event.payload.audio, 'base64');
            const speaker = event.payload.speaker || 'unknown'; // Get speaker info

            logger.info(`📦 Received complete audio segment: ${audioBuffer.length} bytes, Speaker: ${speaker}`);

            // Validate WebM header (should ALWAYS be 1a45dfa3)
            const headerHex = audioBuffer.slice(0, 4).toString('hex');
            logger.debug(`📁 File header: ${headerHex} (expected: 1a45dfa3)`);

            if (headerHex !== '1a45dfa3') {
                logger.warn(`⚠️ Unexpected header: ${headerHex} - attempting transcription anyway`);
            }

            try {
                // Prompt Chaining: Use previous transcription as prompt/context
                const previousContext = sessionData?.lastTranscription || "Transcreva o áudio. Identifique como 'Vendedor:' e 'Cliente:' se possível.";

                const text = await whisperClient.transcribe(audioBuffer, previousContext);

                if (text && text.trim().length > 0) {

                    // Filter Hallucinations
                    if (isHallucination(text)) {
                        logger.warn(`🚫 Hallucination filtered: "${text}"`);
                        return;
                    }

                    logger.info(`✨ Transcription result: ${text} (${speaker})`);

                    // Update context for next segment
                    if (sessionData) {
                        // Keep last ~200 chars for context
                        sessionData.lastTranscription = text.slice(-200);
                    }

                    ws.send(JSON.stringify({
                        type: 'transcript:chunk',
                        payload: {
                            text: text,
                            isFinal: true,
                            speaker: speaker // 🏷️ Return speaker to client
                        }
                    }));
                } else {
                    logger.debug('⏭️ Empty transcription (silence)');
                }
            } catch (err: any) {
                logger.error({ message: err?.message, stack: err?.stack }, '❌ Segment transcription failed');
            }
        }
    });
}
