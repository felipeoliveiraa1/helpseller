/**
 * Gateway Service - WebSocket Orchestrator
 * 
 * Responsibilities:
 * - Seller & Manager WebSocket connections
 * - Supabase authentication
 * - Message routing via Redis pub/sub
 * - Integration with Core API
 */

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import type { WebSocket } from 'ws';

dotenv.config();

const server = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty'
        }
    }
});

// Plugins
server.register(cors, { origin: true, credentials: true });
server.register(websocket);

// Supabase
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
);

// Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subscriber = redis.duplicate();

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3004';
const BACKEND_HTTP_URL = process.env.BACKEND_HTTP_URL || 'http://localhost:3002';

// ==========================================
// PROXY /api/* TO BACKEND (dashboard reprocess-summary and other HTTP API)
// ==========================================

server.all('/api/*', async (request, reply) => {
    const path = request.url.split('?')[0];
    const query = request.url.includes('?') ? '?' + request.url.split('?')[1] : '';
    const targetUrl = `${BACKEND_HTTP_URL}${path}${query}`;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.headers)) {
        if (k.toLowerCase() === 'host') continue;
        if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
    try {
        const res = await fetch(targetUrl, {
            method: request.method,
            headers,
        });
        const text = await res.text();
        const contentType = res.headers.get('Content-Type');
        if (contentType) reply.header('Content-Type', contentType);
        return reply.status(res.status).send(text);
    } catch (err: any) {
        request.log.warn({ err: err?.message, targetUrl }, 'Proxy to backend failed');
        return reply.code(502).send({ error: 'Backend unavailable' });
    }
});

// ==========================================
// SELLER WEBSOCKET ROUTE
// ==========================================

server.get('/ws/call', { websocket: true }, async (socket, req) => {
    const logger = server.log.child({ route: 'seller' });
    logger.info('Seller WS connection attempt');

    const token = (req.query as any).token;
    if (!token) {
        socket.close(1008, 'Token required');
        return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        socket.close(1008, 'Invalid token');
        return;
    }

    logger.info({ userId: user.id }, 'Seller authenticated');

    let callId: string | null = null;
    let commandHandler: ((message: any) => void) | null = null;

    socket.on('message', async (message: string) => {
        try {
            const event = JSON.parse(message.toString());

            switch (event.type) {
                case 'call:start':
                    // Create call via Core API
                    const response = await fetch(`${CORE_API_URL}/api/calls`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user.id,
                            organizationId: event.payload.organizationId || user.user_metadata?.organization_id,
                            scriptId: event.payload.scriptId,
                            platform: event.payload.platform || 'OTHER'
                        })
                    });

                    const { call } = await response.json();
                    callId = call.id;

                    socket.send(JSON.stringify({
                        type: 'call:started',
                        payload: { callId }
                    }));

                    // Subscribe to manager whispers
                    commandHandler = (command: any) => {
                        if (command.type === 'whisper') {
                            socket.send(JSON.stringify({
                                type: 'coach:whisper',
                                payload: {
                                    source: 'manager',
                                    content: command.content,
                                    urgency: command.urgency
                                }
                            }));
                        }
                    };
                    await redis.subscribe(`call:${callId}:commands`, commandHandler);

                    // Subscribe to AI transcript results
                    const transcriptHandler = (data: any) => {
                        socket.send(JSON.stringify({
                            type: 'transcript:chunk',
                            payload: data
                        }));
                    };
                    await redis.subscribe(`transcript:result:${callId}`, transcriptHandler);

                    logger.info({ callId }, 'Call started');
                    break;

                case 'audio:segment':
                    // Publish to AI Service for processing
                    if (callId) {
                        await redis.publish(`audio:process:${callId}`, JSON.stringify({
                            audio: event.payload.audio,
                            role: event.payload.role,
                            timestamp: Date.now()
                        }));
                    }
                    break;

                case 'media:stream':
                    // Publish media chunks to Redis for Streaming Service
                    if (callId) {
                        await redis.publish(`call:${callId}:media_raw`, JSON.stringify({
                            chunk: event.payload.chunk,
                            size: event.payload.size,
                            timestamp: event.payload.timestamp
                        }));
                    }
                    break;

                case 'transcript:chunk':
                    // Publish transcript for managers
                    if (callId) {
                        await redis.publish(`call:${callId}:stream`, JSON.stringify({
                            text: event.payload.text,
                            speaker: event.payload.speaker,
                            role: event.payload.role,
                            timestamp: Date.now()
                        }));
                    }
                    break;

                case 'call:end':
                    if (callId) {
                        await fetch(`${CORE_API_URL}/api/calls/${callId}/end`, {
                            method: 'PUT'
                        });
                        logger.info({ callId }, 'Call ended');
                    }
                    break;
            }
        } catch (err: any) {
            logger.error({ err }, 'Error handling message');
        }
    });

    socket.on('close', async () => {
        logger.info('Seller disconnected');
        if (callId && commandHandler) {
            await redis.unsubscribe(`call:${callId}:commands`, commandHandler);
        }
    });
});

// ==========================================
// MANAGER WEBSOCKET ROUTE
// ==========================================

server.get('/ws/manager', { websocket: true }, async (socket, req) => {
    const logger = server.log.child({ route: 'manager' });
    logger.info('Manager WS connection attempt');

    const token = (req.query as any).token;
    if (!token) {
        socket.close(1008, 'Token required');
        return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        socket.close(1008, 'Invalid token');
        return;
    }

    logger.info({ userId: user.id }, 'Manager authenticated');

    let subscribedCallId: string | null = null;
    let streamHandler: ((message: any) => void) | null = null;

    socket.on('message', async (message: string) => {
        try {
            const event = JSON.parse(message.toString());

            switch (event.type) {
                case 'manager:join':
                    const { callId } = event.payload;

                    if (!callId) {
                        socket.send(JSON.stringify({
                            type: 'error',
                            payload: { message: 'callId required' }
                        }));
                        return;
                    }

                    // Unsubscribe from previous
                    if (subscribedCallId && streamHandler) {
                        await redis.unsubscribe(`call:${subscribedCallId}:stream`, streamHandler);
                    }

                    // Subscribe to transcript stream
                    subscribedCallId = callId;
                    streamHandler = (data: any) => {
                        socket.send(JSON.stringify({
                            type: 'transcript:stream',
                            payload: data
                        }));
                    };

                    await redis.subscribe(`call:${callId}:stream`, streamHandler);

                    socket.send(JSON.stringify({
                        type: 'manager:joined',
                        payload: { callId }
                    }));

                    logger.info({ callId }, 'Manager joined call');
                    break;

                case 'manager:whisper':
                    if (subscribedCallId) {
                        await redis.publish(`call:${subscribedCallId}:commands`, JSON.stringify({
                            type: 'whisper',
                            content: event.payload.content,
                            urgency: event.payload.urgency || 'normal',
                            managerId: user.id,
                            timestamp: Date.now()
                        }));

                        socket.send(JSON.stringify({
                            type: 'whisper:sent'
                        }));

                        logger.info({ callId: subscribedCallId }, 'Whisper sent');
                    }
                    break;
            }
        } catch (err: any) {
            logger.error({ err }, 'Error handling manager message');
        }
    });

    socket.on('close', async () => {
        logger.info('Manager disconnected');
        if (subscribedCallId && streamHandler) {
            await redis.unsubscribe(`call:${subscribedCallId}:stream`, streamHandler);
        }
    });
});

// ==========================================
// HEALTH CHECK
// ==========================================

server.get('/health', async () => {
    return { status: 'ok', service: 'gateway' };
});

// ==========================================
// START SERVER
// ==========================================

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.log('🚀 Gateway Service running on port 3001');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
