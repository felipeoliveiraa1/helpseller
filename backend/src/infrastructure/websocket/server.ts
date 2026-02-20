import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../infrastructure/supabase/client.js';
import { redis } from '../../infrastructure/cache/redis.js';
import { logger } from '../../shared/utils/logger.js';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

const WEBM_EBML = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const MIN_INIT_SEGMENT_BYTES = 100;

function isValidWebMInit(chunkBuf: Buffer): boolean {
    return chunkBuf.length >= MIN_INIT_SEGMENT_BYTES
        && chunkBuf[0] === WEBM_EBML[0]
        && chunkBuf[1] === WEBM_EBML[1]
        && chunkBuf[2] === WEBM_EBML[2]
        && chunkBuf[3] === WEBM_EBML[3];
}

/** Encode media payload to binary frame: 1 byte (0x01=header, 0x00=data) + chunk bytes. Returns null if base64 decode fails. */
function encodeMediaChunkToBinary(payload: { chunk: string; isHeader?: boolean }): Buffer | null {
    try {
        const chunkBuf = Buffer.from(payload.chunk, 'base64');
        const flag = payload.isHeader ? 0x01 : 0x00;
        return Buffer.concat([Buffer.from([flag]), chunkBuf]);
    } catch {
        return null;
    }
}

/** Gestores inscritos por callId (broadcast direto quando Redis está em memory mode). */
const managerSocketsByCallId = new Map<string, Set<WebSocket>>();

// DEBUG LOGGING
const LOG_FILE = path.join(process.cwd(), 'backend-websocket-debug-v2.log');
function debugLog(msg: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
}

// AI Imports
import { CoachEngine } from '../ai/coach-engine.js';
import { OpenAIClient } from '../ai/openai-client.js';
import { PostCallAnalyzer } from '../ai/post-call-analyzer.js';
import { WhisperClient } from '../ai/whisper-client.js';
import { SummaryAgent } from '../ai/summary-agent.js';

// Types
export interface CallSession {
    callId: string;
    userId: string;
    scriptId: string;
    transcript: TranscriptChunk[];
    currentStep: number;
    /** Timestamp (ms) when call started; used for duration_seconds */
    startedAt?: number;
    platform?: string;
    // AI State
    chunksSinceLastCoach: number;
    lastCoachingAt?: number;
    lastSummaryAt?: number; // NEW: Timer for summary
    leadProfile?: any;
    lastCoaching?: string;
    startupTime?: number;
    lastTranscription?: string; // legacy; prefer lastLeadTranscription / lastSellerTranscription
    lastLeadTranscription?: string;
    lastSellerTranscription?: string;
    leadName?: string;
    /** Display name for seller (from extension selfName or profile) */
    sellerName?: string;
    recentTranscriptions?: Array<{ text: string; role: string; timestamp: number }>;
    webmHeader?: Buffer[];
    /** Perguntas já enviadas ao vendedor (para o agente não repetir) */
    sentQuestions?: string[];
}

export interface TranscriptChunk {
    text: string;
    /** Display name (e.g. seller name, lead name) for identifying who is speaking */
    speaker: string;
    role?: 'seller' | 'lead';
    timestamp: number;
    isFinal?: boolean;
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
    if (trimmed.replace(/[^a-zA-ZÀ-ú]/g, '').length < 5) return true; // Too short (User requested filter 5)
    for (const pattern of HALLUCINATION_PATTERNS) {
        if (pattern.test(trimmed)) return true;
    }
    return false;
}

const DEDUP_WINDOW_MS = 8000; // 8s (segmentos 3s + latência Whisper)

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:""'']/g, '')
        .replace(/\s+/g, ' ');
}

function textsAreSimilar(a: string, b: string): boolean {
    const normA = normalizeText(a);
    const normB = normalizeText(b);
    if (normA === normB) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;
    const wordsA = new Set(normA.split(' ').filter((w) => w.length > 1));
    const wordsB = new Set(normB.split(' ').filter((w) => w.length > 1));
    if (wordsA.size === 0 || wordsB.size === 0) return false;
    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return intersection / union > 0.5;
}

/** Lead tem prioridade: se seller diz o mesmo que o lead = eco → descartar seller. */
function shouldDiscard(
    text: string,
    role: string,
    session: CallSession | null
): boolean {
    if (!session) return false;
    const recent = session.recentTranscriptions ?? [];
    const now = Date.now();

    session.recentTranscriptions = recent.filter(
        (t) => now - t.timestamp < DEDUP_WINDOW_MS
    );

    for (const r of session.recentTranscriptions) {
        if (!textsAreSimilar(text, r.text)) continue;

        // SAME ROLE DUPLICATION (Whisper transcribing same audio multiple times)
        if (r.role === role) {
            logger.info(
                `🔇 Duplicate filtered [${role}]: "${text.slice(0, 50)}..." (same text from same role)`
            );
            return true;
        }

        // CROSS-CHANNEL ECHO/LEAKAGE

        // Case 1: Active Role is Seller (Mic), matched with recent Lead (Tab).
        // Lead said it first, now Seller matches = Leakage (Lead's voice in Mic)
        if (role === 'seller') {
            logger.info(
                `🔇 Leakage filtered [seller]: "${text.slice(0, 50)}..." (matches lead)`
            );
            return true;
        }

        // Case 2: Active Role is Lead (Tab), matched with recent Seller (Mic).
        // Seller said it first, now Lead matches = Echo (Seller's voice in Tab)
        if (role === 'lead') {
            logger.info(`🔇 Echo filtered [lead]: "${text.slice(0, 50)}..." (matches seller)`);
            return true;
        }
    }

    session.recentTranscriptions.push({
        text,
        role: role as 'lead' | 'seller',
        timestamp: now,
    });
    return false;
}

// Initialize Services (Singleton pattern to avoid memory leaks)
const openaiClient = new OpenAIClient();
const coachEngine = new CoachEngine(openaiClient);
const postCallAnalyzer = new PostCallAnalyzer(openaiClient);
const whisperClient = new WhisperClient();
const summaryAgent = new SummaryAgent(openaiClient);

export async function websocketRoutes(fastify: FastifyInstance) {
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
        let bufferedLeadName: string | null = null; // Buffer leadName if it arrives before session
        let bufferedSellerName: string | null = null; // Buffer sellerName (selfName) if it arrives before session
        let audioBuffer: Buffer[] = [];
        let transcriptionTimer: NodeJS.Timeout | null = null;
        let commandHandler: ((message: any) => void) | null = null; // For manager whispers
        let isAlive = true;

        // HEARTBEAT
        const pingInterval = setInterval(() => {
            if (!isAlive) {
                logger.warn(`💓 Client inactive, terminating connection for user ${user.id}`);
                socket.terminate();
                return;
            }
            isAlive = false;
            if (socket.readyState === WebSocket.OPEN) {
                socket.ping();
            }
        }, 30000);

        socket.on('pong', () => {
            isAlive = true;
            // debugLog(`[PONG] Heartbeat received from ${user.id}`);
        });

        socket.on('message', async (message: string) => {
            try {
                const msgString = message.toString();
                // console.log('👀 RAW SOCKET MESSAGE SERVER-SIDE:', msgString.substring(0, 100));

                if (!msgString.includes('media:stream') && !msgString.includes('audio:segment')) {
                    logger.info(`RAW MSG RECEIVED: ${msgString.slice(0, 500)}`);
                }
                const event = JSON.parse(msgString);

                // IGNORE media:stream logs to avoid noise, but log everything else
                if (event.type !== 'media:stream' && event.type !== 'audio:segment') {
                    logger.info(`📨 WS EVENT RECEIVED: ${event.type}`);
                }

                if (!callId && event.type !== 'call:start') {
                    if (event.type === 'media:stream') {
                        // Silent ignore or debug log
                        // logger.debug('⚠️ media:stream received before call:start (Ignored)');
                    } else {
                        // logger.warn(`⚠️ Received ${event.type} before call:start (callId is null)`);
                    }
                }

                switch (event.type) {
                    case 'call:start':
                        logger.info({ payload: event.payload }, '🚀 Processing call:start payload');
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
                    case 'call:participants':
                        await handleCallParticipants(event, callId, sessionData);
                        break;
                    case 'call:end':
                        await handleCallEnd(callId, user.id, socket, event.payload);
                        break;
                    case 'media:stream': {
                        // [LIVE_DEBUG] Log every N chunks to avoid spam; always log header
                        const hasChunk = !!event.payload?.chunk;
                        const isHeader = !!event.payload?.isHeader;
                        if (!callId) {
                            logger.warn('[LIVE_DEBUG] media:stream received but callId is null (call:start not sent yet?)');
                        } else if (!hasChunk) {
                            logger.warn('[LIVE_DEBUG] media:stream received but payload.chunk is missing');
                        } else if (isHeader) {
                            const managerCount = managerSocketsByCallId.get(callId)?.size ?? 0;
                            logger.info(`[LIVE_DEBUG] media:stream HEADER callId=${callId} managerSockets=${managerCount}`);
                        }

                        // Relay video + audio chunks to managers via Redis pub/sub + direct broadcast
                        if (callId && event.payload?.chunk) {
                            const payload = {
                                chunk: event.payload.chunk,
                                size: event.payload.size,
                                timestamp: event.payload.timestamp,
                                isHeader: !!event.payload.isHeader
                            };

                            if (event.payload.isHeader) {
                                await redis.set(
                                    `call:${callId}:media_header`,
                                    payload,
                                    14400
                                );
                                logger.info(`📼 Video Header cached for call ${callId}`);
                            }

                            await redis.publish(`call:${callId}:media_raw`, payload);

                            const managerSockets = managerSocketsByCallId.get(callId);
                            if (managerSockets) {
                                const binaryMsg = encodeMediaChunkToBinary(payload);
                                if (binaryMsg) {
                                    let sent = 0;
                                    managerSockets.forEach((s) => {
                                        if (s.readyState === WebSocket.OPEN) {
                                            s.send(binaryMsg);
                                            sent++;
                                        }
                                    });
                                    if (isHeader) {
                                        logger.info(`[LIVE_DEBUG] media:stream broadcast to ${sent} manager(s) for callId=${callId}`);
                                    }
                                }
                            } else if (isHeader) {
                                logger.warn(`[LIVE_DEBUG] media:stream no manager sockets for callId=${callId} (gestor ainda não fez manager:join?)`);
                            }
                        }
                        break;
                    }
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


        socket.on('close', async (code, reason) => {
            clearInterval(pingInterval);
            logger.info({ code, reason: reason?.toString(), callId }, '🔌 WS Disconnected');

            // Cleanup command subscription
            if (callId && commandHandler) {
                await redis.unsubscribe(`call:${callId}:commands`, commandHandler);
                commandHandler = null;
            }

            // Finalize call if not explicitly ended (refresh, troca de conta, crash)
            let finalCallId = callId;
            let finalSession = sessionData;
            if (!finalCallId) {
                const fromRedis = await redis.get<string>(`user:${user.id}:current_call`);
                if (fromRedis) {
                    finalCallId = fromRedis;
                    finalSession = await redis.get<CallSession>(`call:${finalCallId}:session`) ?? null;
                    logger.info(`🔗 Recovered callId from Redis for user ${user.id}: ${finalCallId}`);
                }
            }
            if (finalCallId && finalSession) {
                try {
                    const { data: callRow } = await supabaseAdmin
                        .from('calls')
                        .select('status')
                        .eq('id', finalCallId)
                        .single();

                    if (callRow && (callRow as any).status === 'ACTIVE') {
                        const endedAt = new Date();
                        let durationSeconds: number | undefined;
                        if (finalSession.startedAt) {
                            durationSeconds = Math.round((endedAt.getTime() - finalSession.startedAt) / 1000);
                        }
                        await supabaseAdmin.from('calls').update({
                            status: 'COMPLETED',
                            ended_at: endedAt.toISOString(),
                            duration_seconds: durationSeconds || null,
                            transcript: finalSession.transcript ?? [],
                        }).eq('id', finalCallId);
                        logger.info(`🔒 Auto-finalized call ${finalCallId} on disconnect (${durationSeconds}s)`);
                        await redis.del(`call:${finalCallId}:session`);
                        await redis.del(`user:${user.id}:current_call`);
                    }
                } catch (e: any) {
                    logger.error({ message: e?.message }, '❌ Failed to auto-finalize call on disconnect');
                }
            }
        });

        socket.on('error', (err) => {
            logger.error({ err, callId }, '🔌 WS Error');
        });

        // Helper to setup command subscription
        const setupCommandSubscription = async (targetCallId: string, socket: WebSocket) => {
            // Cleanup previous if any
            if (commandHandler) {
                await redis.unsubscribe(`call:${callId}:commands`, commandHandler);
            }

            commandHandler = (command: any) => {
                if (command.type === 'whisper') {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'coach:whisper',
                            payload: {
                                source: 'manager',
                                content: command.content,
                                urgency: command.urgency,
                                timestamp: command.timestamp
                            }
                        }));
                    }
                }
            };
            await redis.subscribe(`call:${targetCallId}:commands`, commandHandler);
        };

        // --- Handlers ---

        async function handleCallStart(event: any, userId: string, ws: WebSocket) {
            debugLog(`[START] handleCallStart Payload: ${JSON.stringify(event.payload)}`);
            logger.info({ payload: event.payload }, '📞 handleCallStart initiated');

            try {
                const { scriptId, platform, leadName } = event.payload;
                const externalIdRaw = event.payload?.externalId ?? event.payload?.external_id;
                const externalId = typeof externalIdRaw === 'string' ? externalIdRaw.trim() || null : null;
                logger.info({ externalIdReceived: externalId, payloadKeys: Object.keys(event.payload || {}) }, '📞 call:start payload (externalId for re-record)');

                // Get current user org first (needed for reactivation so call stays in correct org)
                const { data: profile, error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', userId)
                    .single();

                if (profileError || !profile) {
                    debugLog(`[ERROR] Profile not found: ${JSON.stringify(profileError)}`);
                    logger.error({ profileError, userId }, '❌ Profile not found or error');
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'USER_PROFILE_NOT_FOUND' } }));
                    return;
                }

                const NULL_ORG_UUID = '00000000-0000-0000-0000-000000000000';
                const rawOrgId = profile.organization_id;
                const orgId = rawOrgId && rawOrgId !== NULL_ORG_UUID ? rawOrgId : null;
                const safeOrgId = orgId === NULL_ORG_UUID ? null : (orgId ?? null);

                // 0. Check if call already exists for this connection (Idempotency / Re-record same call)
                if (callId) {
                    const { data: existingCallById, error: fetchErr } = await supabaseAdmin
                        .from('calls')
                        .select('id, status, script_id, transcript')
                        .eq('id', callId)
                        .maybeSingle();

                    if (fetchErr) {
                        logger.warn({ err: fetchErr, callId }, '⚠️ Failed to fetch call by id (re-record path)');
                    }
                    const isCompleted = existingCallById?.status === 'COMPLETED';
                    logger.info({ callId, status: existingCallById?.status, isCompleted }, '📞 call:start same-connection check');

                    if (isCompleted) {
                        logger.info(`🔄 Re-activating COMPLETED call ${callId} for same connection (re-record).`);
                        const updatePayload: { status: string; ended_at: null; organization_id: string | null } = { status: 'ACTIVE', ended_at: null, organization_id: safeOrgId };
                        const { error: updateErr } = await supabaseAdmin.from('calls')
                            .update(updatePayload)
                            .eq('id', callId);
                        if (updateErr) {
                            logger.error({ err: updateErr, callId }, '❌ Failed to reactivate call (same-connection)');
                        } else {
                            logger.info(`✅ Call ${callId} reactivated to ACTIVE`);
                        }
                        const dbTranscript = Array.isArray(existingCallById?.transcript) ? existingCallById.transcript : [];
                        if (sessionData) {
                            sessionData.startedAt = Date.now();
                        } else {
                            sessionData = {
                                callId: callId ?? '',
                                userId: userId ?? '',
                                scriptId: (existingCallById?.script_id ?? scriptId ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as string,
                                transcript: dbTranscript,
                                currentStep: 0,
                                chunksSinceLastCoach: 0,
                                sentQuestions: [],
                                startedAt: Date.now(),
                                startupTime: Date.now(),
                                leadName: leadName || 'Cliente'
                            };
                        }
                        await redis.set(`call:${callId}:session`, sessionData, 3600);
                        await redis.set(`user:${userId}:current_call`, callId, 14400);
                        if (callId) await setupCommandSubscription(callId, ws);
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'call:started', payload: { callId: callId } }));
                        }
                        return;
                    }

                    logger.warn(`⚠️ Call already initialized for this connection. ID: ${callId}. Ignoring duplicate call:start.`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'call:started', payload: { callId: callId } }));
                    }
                    return;
                }

                // 1.1. Check for external_id match (Meet ID Reuse) — main path when extension reconnects each time
                logger.info({ externalId, userId }, '📞 call:start external_id check');
                if (externalId) {
                    const { data: existingExternalCall, error: extFetchErr } = await supabaseAdmin
                        .from('calls')
                        .select('id, script_id, platform, transcript, started_at, status')
                        .eq('user_id', userId)
                        .eq('external_id', externalId)
                        .order('started_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (extFetchErr) {
                        logger.warn({ err: extFetchErr, externalId, userId }, '⚠️ Failed to fetch call by external_id');
                    }
                    if (!existingExternalCall && externalId) {
                        logger.warn({ userId, externalId }, '📞 No existing call for user+external_id — will create new call');
                    }
                    if (existingExternalCall) {
                        logger.info(`🔗 Found existing call by External ID (${externalId}): ${existingExternalCall.id} status=${existingExternalCall.status}`);

                        // Reactivate and set org (overwrite with safeOrgId so wrong org is cleared)
                        const updatePayload: { status: string; ended_at: null; organization_id: string | null } = { status: 'ACTIVE', ended_at: null, organization_id: safeOrgId };
                        const { error: extUpdateErr } = await supabaseAdmin.from('calls')
                            .update(updatePayload)
                            .eq('id', existingExternalCall.id);
                        if (extUpdateErr) {
                            logger.error({ err: extUpdateErr, callId: existingExternalCall.id }, '❌ Failed to reactivate call (external_id path)');
                        } else {
                            logger.info(`✅ Call ${existingExternalCall.id} reactivated to ACTIVE (external_id=${externalId})`);
                        }

                        callId = existingExternalCall.id;
                        await redis.set(`user:${userId}:current_call`, callId, 14400);

                        // Reconstruct Session Data
                        // Try Redis first
                        let currentSession = await redis.get<CallSession>(`call:${callId}:session`);
                        if (!currentSession) {
                            // Reconstruct from DB
                            logger.info(`♻️ Reconstructing session from DB for call ${callId}`);
                            const dbTranscript = existingExternalCall.transcript || [];

                            sessionData = {
                                callId: callId ?? '',
                                userId: userId ?? '',
                                scriptId: (existingExternalCall.script_id ?? scriptId ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as string,
                                transcript: Array.isArray(dbTranscript) ? dbTranscript : [],
                                currentStep: 0,
                                chunksSinceLastCoach: 0,
                                sentQuestions: [],
                                startupTime: Date.now(),
                                leadName: leadName || 'Cliente'
                            };
                            await redis.set(`call:${callId}:session`, sessionData, 3600);
                        } else {
                            sessionData = currentSession;
                        }

                        // Subscribe to commands
                        if (callId) await setupCommandSubscription(callId, ws);

                        // Confirm
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'call:started', payload: { callId: callId } }));
                        }
                        return;
                    }
                }

                // 1.5. Check for EXISTING ACTIVE CALL (Resume Logic - Fallback if no externalId)
                // Look for a call started in the last hour that is still ACTIVE
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                const { data: existingCall } = await supabaseAdmin
                    .from('calls')
                    .select('id, script_id, platform, started_at')
                    .eq('user_id', userId)
                    .eq('status', 'ACTIVE')
                    .gte('started_at', oneHourAgo)
                    .order('started_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (existingCall) {
                    logger.info(`🔄 Found existing ACTIVE call: ${existingCall.id}. Attempting to resume...`);

                    // Check if session data exists in Redis
                    const existingSession = await redis.get<CallSession>(`call:${existingCall.id}:session`);

                    if (existingSession) {
                        logger.info(`✅ Resumed session for call ${existingCall.id}`);
                        callId = existingCall.id;
                        sessionData = existingSession;
                        await redis.set(`user:${userId}:current_call`, callId, 14400);
                        logger.info(`[LIVE_DEBUG] call:start (resume) done callId=${callId}`);

                        // Check if we have a lead name to apply (Payload > Buffered > Redis)
                        const resumeLeadName = leadName || bufferedLeadName;

                        if (resumeLeadName) {
                            sessionData.leadName = resumeLeadName;
                            logger.info(`👤 Applied lead name to resumed session: ${resumeLeadName}`);
                            await redis.set(`call:${callId}:session`, sessionData, 3600);
                        } else if (!sessionData.leadName) {
                            // Try to see if it was saved in Redis while we were processing
                            const refreshedSession = await redis.get<CallSession>(`call:${callId}:session`);
                            if (refreshedSession?.leadName) {
                                sessionData.leadName = refreshedSession.leadName;
                                logger.info(`👤 Recovered lead name from Redis race condition: ${sessionData.leadName}`);
                            }
                        }

                        // Re-subscribe to commands
                        if (callId) await setupCommandSubscription(callId, ws);

                        // Confirm to client
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'call:started', payload: { callId: callId } }));
                        }
                        return; // EXIT HERE - RESUME COMPLETE
                    } else {
                        logger.warn(`⚠️ Active call found (${existingCall.id}) but Redis session missing. Closing it and starting new.`);
                        // Close the stale call
                        await supabaseAdmin.from('calls').update({
                            status: 'COMPLETED',
                            ended_at: new Date().toISOString()
                        }).eq('id', existingCall.id);
                    }
                }

                // 2. Resolve Script ID (New Call)
                let finalScriptId = scriptId;
                if (orgId && (!scriptId || scriptId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) {
                    const { data: defaultScript } = await supabaseAdmin
                        .from('scripts')
                        .select('id')
                        .eq('organization_id', orgId)
                        .limit(1)
                        .maybeSingle();

                    if (defaultScript) {
                        finalScriptId = defaultScript.id;
                    }
                }

                // 3. Insert Call into DB (omit organization_id when invalid so DB stores NULL)
                const insertPayload = {
                    user_id: userId,
                    script_id: finalScriptId,
                    platform: platform || 'OTHER',
                    status: 'ACTIVE',
                    started_at: new Date().toISOString(),
                    external_id: externalId,
                    ...(safeOrgId != null && safeOrgId !== '' && { organization_id: safeOrgId })
                };
                logger.info({ rawOrgId, safeOrgId, userId, hasOrgInPayload: 'organization_id' in insertPayload }, '📞 call:insert payload org');
                const { data: call, error: insertError } = await supabaseAdmin
                    .from('calls')
                    .insert(insertPayload)
                    .select()
                    .single();

                if (insertError) {
                    logger.error({ insertError, finalScriptId }, '❌ DB INSERT FAILED: calls table');
                    ws.send(JSON.stringify({
                        type: 'error',
                        payload: {
                            message: 'DB_INSERT_FAILED',
                            details: insertError.message,
                            code: insertError.code
                        }
                    }));
                    return;
                }

                callId = call.id ?? '';
                logger.info(`✅ Call created in DB. ID: ${callId}`);
                logger.info(`[LIVE_DEBUG] call:start done callId=${callId} (seller can now send media:stream)`);

                // 4. Initialize Session (seller name from profile as fallback until call:participants sends selfName)
                const { data: sellerProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('full_name')
                    .eq('id', userId)
                    .single();
                const sellerNameFromProfile = (sellerProfile as { full_name?: string } | null)?.full_name?.trim() || undefined;

                sessionData = {
                    callId: call.id ?? '',
                    userId: userId ?? '',
                    scriptId: finalScriptId ?? '',
                    platform: platform ?? undefined,
                    startedAt: new Date().getTime(),
                    transcript: [],
                    currentStep: 1,
                    chunksSinceLastCoach: 0,
                    sentQuestions: [],
                    lastCoachingAt: 0,
                    lastSummaryAt: 0,
                    leadName: leadName || bufferedLeadName || undefined,
                    sellerName: bufferedSellerName || sellerNameFromProfile
                };

                // 5. Cache Session + current call by user (para finalizar ao desconectar mesmo se closure perder callId)
                await redis.set(`call:${callId}:session`, sessionData, 3600);
                await redis.set(`user:${userId}:current_call`, callId, 14400);

                // 6. Subscribe to Manager Commands
                commandHandler = (command: any) => {
                    if (command.type === 'whisper') {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'coach:whisper',
                                payload: {
                                    source: 'manager',
                                    content: command.content,
                                    urgency: command.urgency,
                                    timestamp: command.timestamp
                                }
                            }));
                            logger.info(`💬 Forwarded manager whisper to seller`);
                        }
                    }
                };
                await redis.subscribe(`call:${callId}:commands`, commandHandler);


                // 7. Confirm to Client
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'call:started', payload: { callId: callId } }));
                }

            } catch (err: any) {
                logger.error({ err }, '🔥 CRITICAL ERROR in handleCallStart');
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'INTERNAL_ERROR' } }));
                }
            }
        }

        async function handleTranscript(event: any, currentCallId: string | null, ws: WebSocket) {
            if (!currentCallId || !sessionData) {
                // Try reload from redis if local var missing (reconnection scenario)
                if (currentCallId) {
                    sessionData = await redis.get(`call:${currentCallId}:session`);
                }
                if (!sessionData) return;
            }

            const chunk: TranscriptChunk = event.payload;

            // 1. Update Session
            sessionData.transcript.push(chunk);

            // 2. Persist State
            await redis.set(`call:${currentCallId}:session`, sessionData, 3600 * 4);
        }

        async function handleCallEnd(
            currentCallId: string | null,
            userId: string,
            ws: WebSocket,
            payload?: { callId?: string; result?: string }
        ) {
            let resolvedCallId = currentCallId ?? (payload?.callId && payload.callId.trim() ? payload.callId.trim() : null);
            if (!resolvedCallId && userId) {
                const fromRedis = await redis.get<string>(`user:${userId}:current_call`);
                if (fromRedis) {
                    resolvedCallId = fromRedis;
                    logger.info(`🔗 Recovered callId from Redis for call:end (user ${userId}): ${resolvedCallId}`);
                }
            }
            if (!resolvedCallId) {
                logger.warn('call:end ignored: no callId (connection, payload, or Redis)');
                return;
            }
            const sellerResultFromPayload = payload?.result && ['CONVERTED', 'LOST', 'FOLLOW_UP', 'UNKNOWN'].includes(payload.result)
                ? payload.result
                : null;
            let resolvedSession = sessionData;
            if (!resolvedSession) {
                resolvedSession = await redis.get<CallSession>(`call:${resolvedCallId}:session`) ?? null;
                if (resolvedSession) {
                    logger.info(`🔗 Recovered session from Redis for call:end: ${resolvedCallId}`);
                }
            }
            if (!resolvedSession) {
                logger.warn(`call:end: no session for call ${resolvedCallId}, marking COMPLETED and saving result only`);
                const endedAt = new Date();
                await supabaseAdmin.from('calls').update({
                    status: 'COMPLETED',
                    ended_at: endedAt.toISOString(),
                }).eq('id', resolvedCallId);
                if (sellerResultFromPayload) {
                    await supabaseAdmin.from('call_summaries').upsert(
                        { call_id: resolvedCallId, result: sellerResultFromPayload },
                        { onConflict: 'call_id' }
                    );
                }
                await redis.del(`call:${resolvedCallId}:session`);
                await redis.del(`user:${userId}:current_call`);
                return;
            }

            const currentCallIdForRest = resolvedCallId;
            sessionData = resolvedSession;
            const sellerResult = sellerResultFromPayload ?? undefined;

            // 1. Fetch script details for analysis
            const { data: scriptData } = await supabaseAdmin
                .from('scripts')
                .select('name, id')
                .eq('id', sessionData.scriptId)
                .single();

            const scriptName = scriptData?.name || "Standard Script";

            // Fetch objections for this script (needed for correlation)
            const { data: objections } = await supabaseAdmin
                .from('objections')
                .select('id, trigger_phrases, suggested_response, mental_trigger, coaching_tip')
                .eq('script_id', sessionData.scriptId);

            // 2. Generate Summary (AI may fail, timeout or return null; we still save seller result)
            const POST_CALL_ANALYSIS_TIMEOUT_MS = 90_000;
            let summary: any = null;
            try {
                summary = await Promise.race([
                    postCallAnalyzer.generate(sessionData, scriptName, ["Intro", "Discovery", "Close"]),
                    new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error('Post-call analysis timeout')), POST_CALL_ANALYSIS_TIMEOUT_MS)
                    ),
                ]);
            } catch (err: any) {
                logger.warn({ err: err?.message }, '⚠️ Post-call summary generation failed; saving seller result only');
            }

            // Prefer seller-reported result for call_summaries.result
            const resultForDb = sellerResult ?? summary?.result ?? null;

            // 4. Send Summary to Client
            ws.send(JSON.stringify({
                type: 'call:summary',
                payload: summary ? { ...summary, result: resultForDb ?? summary.result } : { result: resultForDb }
            }));

            // 5. Update DB — compute duration_seconds
            const endedAt = new Date();
            let durationSeconds: number | undefined;
            if (sessionData.startedAt) {
                durationSeconds = Math.round((endedAt.getTime() - sessionData.startedAt) / 1000);
            }

            await supabaseAdmin.from('calls').update({
                status: 'COMPLETED',
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds || null,
                transcript: sessionData.transcript, // Save full transcript
            }).eq('id', currentCallIdForRest);

            // 6. Save Summary to specific table (only columns that exist in call_summaries)
            const { pickSummaryRowForDb } = await import('../../shared/call-summary-db.js');
            const summaryRow = summary
                ? pickSummaryRowForDb(summary as Record<string, unknown>, currentCallIdForRest, resultForDb ?? undefined)
                : { call_id: currentCallIdForRest, result: resultForDb };
            await supabaseAdmin.from('call_summaries').upsert(summaryRow, { onConflict: 'call_id' });
            // 7. Clear Redis (permite ao disconnect saber que a call já foi finalizada)
            await redis.del(`call:${currentCallIdForRest}:session`);
            if (sessionData?.userId) await redis.del(`user:${sessionData.userId}:current_call`);
        }

        async function handleAudioChunk(event: any, ws: WebSocket) {
            const audioData = Buffer.from(event.payload.audio, 'base64');
            audioBuffer.push(audioData);

            logger.debug(`📦 Received audio chunk: ${audioData.length} bytes, buffer size: ${audioBuffer.length}`);

            // Logic: Transcribe every ~3 seconds of audio (3 chunks of 1s)
            const CHUNKS_TO_PROCESS = 3;

            if (audioBuffer.length >= CHUNKS_TO_PROCESS) {
                const finalBuffer = Buffer.concat(audioBuffer);
                audioBuffer = []; // Clear buffer immediately

                const headerHex = finalBuffer.length >= 4 ? finalBuffer.slice(0, 4).toString('hex') : '';
                if (headerHex !== '1a45dfa3') {
                    logger.debug(`audio:chunk (legacy) invalid WebM header (${headerHex}); skipping Whisper.`);
                    return;
                }

                logger.info(`🎤 Transcribing ${finalBuffer.length} bytes of audio...`);

                try {
                    const prompt = "Transcreva o áudio. Identifique como 'Vendedor:' e 'Cliente:' se possível.";
                    const text = await whisperClient.transcribe(finalBuffer, prompt);

                    if (text && text.trim().length > 0) {
                        logger.info(`✨ Transcription result: ${text}`);

                        ws.send(JSON.stringify({
                            type: 'transcript:chunk',
                            payload: {
                                text: text,
                                isFinal: true
                            }
                        }));
                    }
                } catch (error: any) {
                    logger.error({ err: error }, '❌ Whisper transcription failed');
                }
            }
        }

        async function handleCallParticipants(event: any, currentCallId: string | null, session: CallSession | null) {
            logger.info(`📨 Handling call:participants event. Payload: ${JSON.stringify(event.payload)}`);
            const leadName = event.payload?.leadName;
            const selfName = event.payload?.selfName && String(event.payload.selfName).trim() ? String(event.payload.selfName).trim() : null;

            if (selfName) {
                bufferedSellerName = selfName;
                if (session) {
                    session.sellerName = selfName;
                    if (sessionData && sessionData.callId === session.callId) {
                        sessionData.sellerName = selfName;
                    }
                    logger.info(`👤 Seller name set in session: ${selfName}`);
                } else {
                    logger.info(`👤 Buffering seller name (session not ready): ${selfName}`);
                }
            }

            if (!leadName && !selfName) {
                logger.warn('⚠️ Received call:participants but both leadName and selfName are missing or empty');
                if (session && currentCallId) await redis.set(`call:${currentCallId}:session`, session, 3600 * 4);
                return;
            }

            if (leadName) {
                if (!session || !currentCallId) {
                    bufferedLeadName = leadName;
                    logger.info(`👤 Buffering lead name (session not ready): ${leadName}`);
                    return;
                }
                session.leadName = leadName;
                if (sessionData && sessionData.callId === session.callId) {
                    sessionData.leadName = leadName;
                }
                logger.info(`👤 Lead identified and set in session: ${leadName}`);
            }

            if (session && currentCallId) {
                await redis.set(`call:${currentCallId}:session`, session, 3600 * 4);
            }
        }

        async function handleAudioSegment(event: any, ws: WebSocket) {
            const audioBuffer = Buffer.from(event.payload.audio, 'base64');
            const role = event.payload.role || event.payload.speaker || 'unknown'; // 'lead' | 'seller'

            debugLog(`[AUDIO] Received ${audioBuffer.length} bytes for role: ${role}`);

            const headerHex = audioBuffer.slice(0, 4).toString('hex');
            if (headerHex !== '1a45dfa3') {
                debugLog(`[WARNING] Unexpected header: ${headerHex}`);
            }

            try {
                const previousText = role === 'lead'
                    ? (sessionData?.lastLeadTranscription || "Transcreva o áudio.")
                    : (sessionData?.lastSellerTranscription || "Transcreva o áudio.");

                debugLog(`[WHISPER START] Transcribing ${audioBuffer.length} bytes...`);
                const text = await whisperClient.transcribe(audioBuffer, previousText);
                debugLog(`[WHISPER END] Result: '${text}'`);

                if (text && text.trim().length > 0) {
                    if (isHallucination(text)) {
                        debugLog(`[FILTER] Hallucination: ${text}`);
                        return;
                    }
                    if (shouldDiscard(text.trim(), role, sessionData ?? null)) {
                        return;
                    }

                    // 1. Dynamic Speaker Label Resolution: use stored names for seller and lead
                    const dynamicSpeaker = event.payload.speakerName;
                    const currentLeadName = dynamicSpeaker || sessionData?.leadName || bufferedLeadName || 'Cliente';
                    const currentSellerName = sessionData?.sellerName || bufferedSellerName || 'Vendedor';
                    const speakerLabel = role === 'seller' ? currentSellerName : currentLeadName;

                    logger.info(`✨ [${speakerLabel}]: "${text}"`);
                    debugLog(`[SUCCESS] Transcription: ${text}`);

                    if (sessionData) {
                        if (role === 'lead') {
                            sessionData.lastLeadTranscription = text.slice(-200);
                        } else {
                            sessionData.lastSellerTranscription = text.slice(-200);
                        }

                        // 2. Update Session Data
                        const transcriptChunk = {
                            text,
                            speaker: speakerLabel,
                            role,
                            timestamp: Date.now(),
                            isFinal: true
                        };

                        if (!sessionData.transcript) sessionData.transcript = [];
                        sessionData.transcript.push(transcriptChunk);

                        // 3. Persist to Redis (Session)
                        if (callId) {
                            await redis.set(`call:${callId}:session`, sessionData, 3600);
                        }

                        // 4. Update DB
                        const { error: updateError } = await supabaseAdmin.from('calls').update({
                            transcript: sessionData.transcript
                        }).eq('id', callId);

                        if (updateError) {
                            logger.error({ updateError, callId }, '❌ DB UPDATE ERROR: Failed to save transcript');
                        }

                        // ============================================
                        // AI LOGIC: SPIN Coach (1 min) + Live Summary (30s)
                        // Uses 60s sliding window for context
                        // ============================================

                        const now = Date.now();
                        const COACH_INTERVAL = 60000;   // 1 minuto
                        const SUMMARY_INTERVAL = 30000; // 30s
                        const CONTEXT_WINDOW = 60000;   // 60s sliding window

                        // Increment chunk counter
                        if (!sessionData.chunksSinceLastCoach) sessionData.chunksSinceLastCoach = 0;
                        sessionData.chunksSinceLastCoach++;

                        // Build FULL context (all history)
                        const buildFullContext = (): string => {
                            // No cutoff - send everything
                            return sessionData!.transcript
                                .map((t: any) => `${t.role === 'seller' ? 'VENDEDOR' : 'LEAD'}: ${t.text}`)
                                .join('\n');
                        };

                        // A. SPIN Coach (Every 1 min) → coach:tip + objection:detected
                        if (!sessionData.lastCoachingAt || (now - sessionData.lastCoachingAt) >= COACH_INTERVAL) {
                            sessionData.chunksSinceLastCoach = 0;
                            sessionData.lastCoachingAt = now;
                            try {
                                // 1. Fetch latest transcript from DB (Source of Truth)
                                const { data: dbCall, error: dbError } = await supabaseAdmin
                                    .from('calls')
                                    .select('transcript')
                                    .eq('id', callId)
                                    .single();

                                let transcriptList = sessionData.transcript; // Fallback to memory
                                if (!dbError && dbCall?.transcript && Array.isArray(dbCall.transcript)) {
                                    transcriptList = dbCall.transcript;
                                } else {
                                    logger.warn({ dbError }, `⚠️ Failed to fetch transcript from DB for Coach, using memory. Call ${callId}`);
                                }

                                // 2. Build Full Context
                                const fullContext = transcriptList
                                    .map((t: any) => `${t.role === 'seller' ? 'VENDEDOR' : 'LEAD'}: ${t.text}`)
                                    .join('\n');

                                const sentQuestions = sessionData.sentQuestions ?? [];
                                logger.info(`🧠 SPIN Coach analyzing DB CONTEXT (${fullContext.length} chars, ${sentQuestions.length} perguntas já enviadas) for call ${callId}`);
                                const spinResult = await coachEngine.analyzeTranscription(fullContext, { sentQuestions });

                                if (spinResult && ws.readyState === WebSocket.OPEN) {
                                    if (spinResult.suggested_question) {
                                        sessionData.sentQuestions = [...sentQuestions, spinResult.suggested_question];
                                        await redis.set(`call:${callId}:session`, sessionData, 3600 * 4);
                                    }
                                    // Always send the coaching tip
                                    ws.send(JSON.stringify({
                                        type: 'COACHING_MESSAGE',
                                        payload: {
                                            type: spinResult.objection ? 'objection' : 'tip',
                                            content: spinResult.tip,
                                            urgency: spinResult.objection ? 'high' : 'medium',
                                            metadata: {
                                                phase: spinResult.phase,
                                                objection: spinResult.objection,
                                                suggested_question: spinResult.suggested_question ?? undefined,
                                                suggested_response: spinResult.suggested_response ?? undefined
                                            }
                                        }
                                    }));

                                    // If objection detected, also emit objection:detected
                                    if (spinResult.objection) {
                                        ws.send(JSON.stringify({
                                            type: 'objection:detected',
                                            payload: {
                                                objection: spinResult.objection,
                                                phase: spinResult.phase,
                                                tip: spinResult.tip
                                            }
                                        }));
                                        logger.info(`⚡ Objection detected: ${spinResult.objection}`);
                                    }
                                }
                            } catch (coachError: any) {
                                logger.error({ message: coachError?.message, stack: coachError?.stack }, '❌ SPIN Coach failed (non-fatal)');
                            }
                        }

                        // B. Live Summary (Every 20s) → managers via Redis
                        if (!sessionData.lastSummaryAt || (now - sessionData.lastSummaryAt) >= SUMMARY_INTERVAL) {
                            sessionData.lastSummaryAt = now;
                            try {
                                logger.info(`📊 Generating Live Summary for call ${callId}`);
                                // Pass sliding window as TranscriptChunk[] for the summary agent
                                const cutoff = now - CONTEXT_WINDOW;
                                const recentChunks = sessionData!.transcript.filter(t => t.timestamp > cutoff);
                                const liveSummary = await summaryAgent.generateLiveSummary(recentChunks);

                                if (liveSummary) {
                                    await redis.publish(`call:${callId}:live_summary`, JSON.stringify(liveSummary));
                                }
                            } catch (summaryError: any) {
                                logger.error({ message: summaryError?.message, stack: summaryError?.stack }, '❌ Summary Agent failed (non-fatal)');
                            }
                        }
                    }

                    // 5. Publish to Redis (Real-time Manager)
                    if (callId) {
                        await redis.publish(`call:${callId}:stream`, {
                            text,
                            speaker: speakerLabel,
                            role,
                            timestamp: Date.now()
                        });
                    }

                    // OPTIMIZATION: Transcript is not sent back to seller to save bandwidth & focus
                    /*
                    ws.send(JSON.stringify({
                        type: 'transcript:chunk',
                        payload: {
                            text,
                            isFinal: true,
                            speaker: speakerLabel,
                            role
                        }
                    }));
                    */
                } else {
                    debugLog(`[SILENCE] Empty transcription`);
                }
            } catch (err: any) {
                debugLog(`[WHISPER ERROR] ${err.message}\n${err.stack}`);
                logger.error({ message: err?.message, stack: err?.stack }, `❌ [${role}] Transcription failed`);
            }
        }

    }); // END OF /ws/call handler

    // ========================================
    // MANAGER WEBSOCKET ROUTE - WHISPER SYSTEM
    // ========================================

    fastify.get('/ws/manager', { websocket: true }, async (socket, req) => {
        logger.info('👔 Manager WebSocket connection attempt');

        const token = (req.query as any).token;
        if (!token) {
            socket.close(1008, 'Token required');
            return;
        }

        let subscribedCallId: string | null = null;
        let streamHandler: ((message: any) => void) | null = null;
        let mediaHandler: ((message: any) => void) | null = null;
        let liveSummaryHandler: ((message: any) => void) | null = null;

        let authUser: { id: string } | null = null;
        const authPromise = (async () => {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                try { socket.close(1008, 'Invalid token'); } catch { /* already closed */ }
                return;
            }
            authUser = user;
            logger.info(`✅ Manager authenticated: ${user.id}`);
        })();

        socket.on('message', async (message: string | Buffer) => {
            await authPromise;
            if (!authUser) return;
            try {
                const event = JSON.parse(message.toString());
                logger.info(`[LIVE_DEBUG] manager WS message type=${event?.type ?? 'unknown'}`);

                switch (event.type) {
                    case 'manager:join': {
                        // Manager wants to join/monitor a specific call
                        const { callId } = event.payload || {};
                        logger.info(`[LIVE_DEBUG] manager:join received callId=${callId ?? 'undefined'}`);

                        if (!callId) {
                            socket.send(JSON.stringify({
                                type: 'error',
                                payload: { message: 'callId is required' }
                            }));
                            return;
                        }

                        // Unsubscribe from previous call if any
                        if (subscribedCallId && streamHandler) {
                            await redis.unsubscribe(`call:${subscribedCallId}:stream`, streamHandler);
                        }
                        if (subscribedCallId && mediaHandler) {
                            await redis.unsubscribe(`call:${subscribedCallId}:media_raw`, mediaHandler);
                        }
                        if (subscribedCallId && liveSummaryHandler) {
                            await redis.unsubscribe(`call:${subscribedCallId}:live_summary`, liveSummaryHandler);
                        }
                        if (subscribedCallId) {
                            const prevSet = managerSocketsByCallId.get(subscribedCallId);
                            if (prevSet) {
                                prevSet.delete(socket);
                                if (prevSet.size === 0) managerSocketsByCallId.delete(subscribedCallId);
                            }
                        }

                        // Subscribe to new call's transcript stream
                        subscribedCallId = callId;
                        let set = managerSocketsByCallId.get(callId);
                        if (!set) {
                            set = new Set();
                            managerSocketsByCallId.set(callId, set);
                        }
                        set.add(socket);
                        logger.info(`[LIVE_DEBUG] manager subscribed to callId=${callId} totalManagersForCall=${set.size}`);

                        streamHandler = (transcriptData: any) => {
                            // Forward transcript to manager
                            socket.send(JSON.stringify({
                                type: 'transcript:stream',
                                payload: transcriptData
                            }));
                        };

                        await redis.subscribe(`call:${subscribedCallId}:stream`, streamHandler);

                        // NEW: Subscribe to media stream (video + audio) — send binary to avoid base64 encoding issues
                        mediaHandler = (mediaData: any) => {
                            const binaryMsg = encodeMediaChunkToBinary(mediaData);
                            if (binaryMsg) socket.send(binaryMsg);
                        };

                        await redis.subscribe(`call:${subscribedCallId}:media_raw`, mediaHandler);

                        // NEW: Subscribe to live summary
                        liveSummaryHandler = async (summaryData: any) => {
                            // Send to manager if valid
                            if (summaryData) {
                                logger.info({ summary: summaryData }, '📊 Broadcasting Live Summary');
                                socket.send(JSON.stringify({
                                    type: 'call:live_summary',
                                    payload: summaryData
                                }));
                            }
                        };
                        await redis.subscribe(`call:${subscribedCallId}:live_summary`, liveSummaryHandler);

                        // Do NOT send cached media header on manager:join — it can be stale or from a different
                        // codec (vp8 vs vp9), causing intermittent SourceBuffer/Playback errors when mixed with
                        // live chunks. Client waits for the next init segment from the live stream (within ~5s).
                        logger.info(`👔 Manager ${authUser.id} joined call ${callId} (transcript + media)`);

                        socket.send(JSON.stringify({
                            type: 'manager:joined',
                            payload: { callId }
                        }));
                        break;
                    }

                    case 'manager:whisper':
                        // Manager sends a coaching tip/whisper to the seller
                        if (!subscribedCallId) {
                            socket.send(JSON.stringify({
                                type: 'error',
                                payload: { message: 'Not subscribed to any call' }
                            }));
                            return;
                        }

                        const { content, urgency = 'normal' } = event.payload || {};
                        if (!content) {
                            socket.send(JSON.stringify({
                                type: 'error',
                                payload: { message: 'content is required' }
                            }));
                            return;
                        }

                        // Publish whisper to the command channel
                        await redis.publish(`call:${subscribedCallId}:commands`, {
                            type: 'whisper',
                            content,
                            urgency,
                            managerId: authUser.id,
                            timestamp: Date.now()
                        });

                        logger.info(`💬 Manager ${authUser.id} sent whisper to call ${subscribedCallId}`);

                        socket.send(JSON.stringify({
                            type: 'whisper:sent',
                            payload: { callId: subscribedCallId }
                        }));
                        break;

                    default:
                        logger.warn(`Unknown event type from manager: ${event.type}`);
                }
            } catch (err: any) {
                logger.error({ error: err }, '❌ Error handling manager message');
            }
        });

        socket.on('close', async (code, reason) => {
            logger.info({ code, reason: reason?.toString() }, '👔 Manager WS Disconnected');

            if (subscribedCallId) {
                const set = managerSocketsByCallId.get(subscribedCallId);
                if (set) {
                    set.delete(socket);
                    if (set.size === 0) managerSocketsByCallId.delete(subscribedCallId);
                }
            }

            // Cleanup subscriptions
            if (subscribedCallId && streamHandler) {
                await redis.unsubscribe(`call:${subscribedCallId}:stream`, streamHandler);
            }
            if (subscribedCallId && mediaHandler) {
                await redis.unsubscribe(`call:${subscribedCallId}:media_raw`, mediaHandler);
            }
            if (subscribedCallId && liveSummaryHandler) {
                await redis.unsubscribe(`call:${subscribedCallId}:live_summary`, liveSummaryHandler);
            }
        });

        socket.on('error', (err) => {
            logger.error({ err }, '👔 Manager WS Error');
        });
    });
}
