import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import type {
    CreateCallRequest,
    CreateCallResponse,
    GetScriptObjectionsResponse,
    RecordSuccessRequest
} from '@closeia/types';

dotenv.config();

const server = Fastify({ logger: true });

// CORS
server.register(cors, {
    origin: true,
    credentials: true
});

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
);

// Redis Cache
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Health Check
server.get('/health', async () => {
    return { status: 'ok', service: 'core-api' };
});

// ==========================================
// CALL ROUTES
// ==========================================

// Create Call
server.post<{ Body: CreateCallRequest }>('/api/calls', async (request, reply) => {
    const { userId, organizationId, scriptId, platform } = request.body;

    const { data: call, error } = await supabase
        .from('calls')
        .insert({
            user_id: userId,
            organization_id: organizationId,
            script_id: scriptId,
            platform: platform || 'OTHER',
            status: 'ACTIVE',
            started_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        return reply.code(500).send({ error: error.message });
    }

    // Cache session data
    await redis.set(
        `call:${call.id}`,
        JSON.stringify({
            callId: call.id,
            userId,
            scriptId,
            transcript: [],
            currentStep: 1,
            lastCoachingAt: 0,
            startupTime: Date.now()
        }),
        'EX',
        3600 * 4 // 4 hours
    );

    return { call } as CreateCallResponse;
});

// End Call
server.put<{ Params: { id: string } }>('/api/calls/:id/end', async (request, reply) => {
    const { id } = request.params;

    const { data, error } = await supabase
        .from('calls')
        .update({
            status: 'COMPLETED',
            ended_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return reply.code(500).send({ error: error.message });
    }

    // Cleanup Redis session
    await redis.del(`call:${id}`);

    return { call: data };
});

// ==========================================
// SCRIPT ROUTES
// ==========================================

// Get Script Objections with Success Rates
server.get<{ Params: { id: string } }>('/api/scripts/:id/objections', async (request, reply) => {
    const { id: scriptId } = request.params;

    // Get objections with success metrics
    const { data: objections, error } = await supabase
        .from('objections')
        .select(`
            id,
            script_id,
            trigger,
            response,
            category,
            objection_successes (
                id,
                converted,
                created_at
            )
        `)
        .eq('script_id', scriptId);

    if (error) {
        return reply.code(500).send({ error: error.message });
    }

    // Calculate success rates
    const objectionsWithRates = objections.map((obj: any) => {
        const successes = obj.objection_successes || [];
        const total = successes.length;
        const converted = successes.filter((s: any) => s.converted).length;
        const success_rate = total > 0 ? (converted / total) * 100 : 0;

        return {
            id: obj.id,
            script_id: obj.script_id,
            trigger: obj.trigger,
            response: obj.response,
            category: obj.category,
            success_rate: Math.round(success_rate * 10) / 10 // Round to 1 decimal
        };
    });

    return { objections: objectionsWithRates } as GetScriptObjectionsResponse;
});

// ==========================================
// OBJECTION SUCCESS ROUTES
// ==========================================

// Record Objection Success/Failure
server.post<{ Body: RecordSuccessRequest }>('/api/objections/success', async (request, reply) => {
    const { objectionId, callId, converted } = request.body;

    const { data, error } = await supabase
        .from('objection_successes')
        .insert({
            objection_id: objectionId,
            call_id: callId,
            converted
        })
        .select()
        .single();

    if (error) {
        return reply.code(500).send({ error: error.message });
    }

    // Invalidate cache for this objection
    await redis.del(`objection:${objectionId}:success_rate`);

    return { success: data };
});

// Start Server
const start = async () => {
    try {
        await server.listen({ port: 3004, host: '0.0.0.0' });
        console.log('🚀 Core API running on port 3004');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
