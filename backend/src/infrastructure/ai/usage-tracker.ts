import { supabaseAdmin } from '../supabase/client.js';
import { logger } from '../../shared/utils/logger.js';

// ─── Token Usage Interface ───────────────────────────────────
export interface UsageInfo {
    prompt_tokens: number;
    completion_tokens: number;
    cached_tokens: number;
    total_tokens: number;
    model: string;
}

// ─── Pricing Tables (USD) ────────────────────────────────────
const OPENAI_PRICING: Record<string, { input: number; output: number; cached: number }> = {
    'gpt-4.1-mini': { input: 0.150 / 1e6, output: 0.600 / 1e6, cached: 0.075 / 1e6 },
    'gpt-4.1-nano': { input: 0.10 / 1e6, output: 0.40 / 1e6, cached: 0.025 / 1e6 },
    'gpt-4o-mini': { input: 0.15 / 1e6, output: 0.60 / 1e6, cached: 0.075 / 1e6 },
    'gpt-4o': { input: 2.50 / 1e6, output: 10.0 / 1e6, cached: 1.25 / 1e6 },
    'gpt-4.1': { input: 2.00 / 1e6, output: 8.00 / 1e6, cached: 0.50 / 1e6 },
};

const DEEPGRAM_PRICE_PER_MIN = 0.0043;        // Nova-2 Pay-as-you-go
const LIVEKIT_PRICE_PER_PARTICIPANT_MIN = 0.0015; // Cloud Standard

// ─── Cost Calculators ────────────────────────────────────────

function calculateOpenAICost(usage: UsageInfo): number {
    const pricing = OPENAI_PRICING[usage.model];
    if (!pricing) {
        logger.warn({ model: usage.model }, '⚠️ UsageTracker: unknown model, using gpt-4.1-mini pricing');
        const fallback = OPENAI_PRICING['gpt-4.1-mini'];
        return (usage.prompt_tokens - usage.cached_tokens) * fallback.input
            + usage.cached_tokens * fallback.cached
            + usage.completion_tokens * fallback.output;
    }
    const uncachedInput = usage.prompt_tokens - usage.cached_tokens;
    return uncachedInput * pricing.input
        + usage.cached_tokens * pricing.cached
        + usage.completion_tokens * pricing.output;
}

function calculateDeepgramCost(durationSeconds: number): number {
    return (durationSeconds / 60) * DEEPGRAM_PRICE_PER_MIN;
}

function calculateLiveKitCost(durationSeconds: number, participants: number): number {
    return (durationSeconds / 60) * participants * LIVEKIT_PRICE_PER_PARTICIPANT_MIN;
}

// ─── Persistence ─────────────────────────────────────────────

interface LogContext {
    callId: string;
    organizationId?: string | null;
    userId?: string | null;
}

async function insertLog(row: Record<string, unknown>): Promise<void> {
    try {
        const { error } = await supabaseAdmin.from('ai_usage_logs').insert(row);
        if (error) {
            logger.error({ error, row }, '❌ UsageTracker: failed to insert usage log');
        }
    } catch (err) {
        logger.error({ err }, '❌ UsageTracker: unexpected error inserting usage log');
    }
}

// ─── Public API ──────────────────────────────────────────────

export const UsageTracker = {
    /**
     * Log an OpenAI API call (chat completions — streaming or non-streaming).
     */
    async logOpenAI(ctx: LogContext, method: string, usage: UsageInfo): Promise<void> {
        const costUsd = calculateOpenAICost(usage);
        logger.info({
            callId: ctx.callId, method, model: usage.model,
            in: usage.prompt_tokens, out: usage.completion_tokens,
            cached: usage.cached_tokens, costUsd: costUsd.toFixed(8),
        }, '💰 UsageTracker: OpenAI');

        await insertLog({
            call_id: ctx.callId,
            organization_id: ctx.organizationId ?? null,
            user_id: ctx.userId ?? null,
            service: 'openai',
            method,
            model: usage.model,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            cached_tokens: usage.cached_tokens,
            total_tokens: usage.total_tokens,
            cost_usd: costUsd,
        });
    },

    /**
     * Log Deepgram real-time transcription usage for one audio channel.
     */
    async logDeepgram(ctx: LogContext, durationSeconds: number): Promise<void> {
        const costUsd = calculateDeepgramCost(durationSeconds);
        logger.info({
            callId: ctx.callId, durationSeconds, costUsd: costUsd.toFixed(8),
        }, '💰 UsageTracker: Deepgram');

        await insertLog({
            call_id: ctx.callId,
            organization_id: ctx.organizationId ?? null,
            user_id: ctx.userId ?? null,
            service: 'deepgram',
            method: 'transcription',
            model: 'nova-2',
            duration_seconds: durationSeconds,
            cost_usd: costUsd,
        });
    },

    /**
     * Log LiveKit room usage.
     */
    async logLiveKit(ctx: LogContext, durationSeconds: number, participants: number): Promise<void> {
        const costUsd = calculateLiveKitCost(durationSeconds, participants);
        logger.info({
            callId: ctx.callId, durationSeconds, participants, costUsd: costUsd.toFixed(8),
        }, '💰 UsageTracker: LiveKit');

        await insertLog({
            call_id: ctx.callId,
            organization_id: ctx.organizationId ?? null,
            user_id: ctx.userId ?? null,
            service: 'livekit',
            method: 'room',
            model: 'livekit-cloud',
            duration_seconds: durationSeconds,
            participants,
            cost_usd: costUsd,
        });
    },
};
