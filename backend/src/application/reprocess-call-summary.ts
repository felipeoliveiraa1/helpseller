import { supabaseAdmin } from '../infrastructure/supabase/client.js';
import { OpenAIClient } from '../infrastructure/ai/openai-client.js';
import { PostCallAnalyzer } from '../infrastructure/ai/post-call-analyzer.js';
import { logger } from '../shared/utils/logger.js';
import { pickSummaryRowForDb } from '../shared/call-summary-db.js';

const openaiClient = new OpenAIClient();
const postCallAnalyzer = new PostCallAnalyzer(openaiClient);

const POST_CALL_ANALYSIS_TIMEOUT_MS = 90_000;

const MIN_TRANSCRIPT_LENGTH = 30;

/**
 * Normalizes DB transcript (may have speaker or role) to chunks with .text and .speaker for PostCallAnalyzer.
 */
function normalizeTranscript(rows: any[]): Array<{ text: string; speaker: string; timestamp: number }> {
    if (!Array.isArray(rows)) return [];
    return rows.map((t: any) => ({
        text: String(t.text ?? t.content ?? t.message ?? '').trim(),
        speaker: t.speaker ?? (t.role === 'seller' ? 'Vendedor' : t.role === 'lead' ? 'Cliente' : 'UNKNOWN') ?? 'UNKNOWN',
        timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
    }));
}

/**
 * Extracts transcript array from DB value (may be array, JSON string, or object with chunks/segments).
 */
function extractTranscriptRaw(transcript: unknown): any[] {
    if (Array.isArray(transcript)) return transcript;
    if (typeof transcript === 'string') {
        const trimmed = transcript.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : parsed?.chunks ?? parsed?.segments ?? [];
        } catch {
            return [{ text: trimmed, speaker: 'UNKNOWN', timestamp: Date.now() }];
        }
    }
    if (transcript && typeof transcript === 'object') {
        const o = transcript as Record<string, unknown>;
        if (Array.isArray(o.chunks)) return o.chunks;
        if (Array.isArray(o.segments)) return o.segments;
        if (Array.isArray(o.transcript)) return o.transcript;
    }
    return [];
}

/**
 * Reprocesses a single COMPLETED call: runs post-call AI analysis from stored transcript and upserts call_summaries.
 */
export async function reprocessCallSummary(callId: string): Promise<{ ok: boolean; error?: string }> {
    const { data: call, error: callError } = await supabaseAdmin
        .from('calls')
        .select('id, script_id, transcript, status, user_id, started_at')
        .eq('id', callId)
        .single();

    if (callError || !call) {
        return { ok: false, error: 'Chamada não encontrada' };
    }
    if ((call as any).status !== 'COMPLETED') {
        return { ok: false, error: 'Chamada não está finalizada' };
    }

    const transcriptRaw = (call as any).transcript;
    const transcriptArray = extractTranscriptRaw(transcriptRaw);
    const normalized = normalizeTranscript(transcriptArray);
    const transcriptText = normalized.map((t) => `${t.speaker}: ${t.text}`).join('\n').trim();
    if (!transcriptText || transcriptText.length < MIN_TRANSCRIPT_LENGTH) {
        return { ok: false, error: 'Transcrição insuficiente para análise' };
    }

    const scriptId = (call as any).script_id;
    const { data: scriptData } = await supabaseAdmin
        .from('scripts')
        .select('name')
        .eq('id', scriptId)
        .single();
    const scriptName = (scriptData as any)?.name ?? 'Script padrão';

    const { data: stepsData } = await supabaseAdmin
        .from('script_steps')
        .select('name')
        .eq('script_id', scriptId)
        .order('step_order', { ascending: true });
    const steps = Array.isArray(stepsData) ? (stepsData as any[]).map((s) => s.name).filter(Boolean) : ['Intro', 'Discovery', 'Close'];

    const session = {
        callId,
        userId: (call as any).user_id ?? '',
        scriptId: scriptId ?? '',
        transcript: normalized,
        currentStep: 0,
        chunksSinceLastCoach: 0,
        startedAt: (call as any).started_at ? new Date((call as any).started_at).getTime() : undefined,
    };

    let summary: any = null;
    try {
        summary = await Promise.race([
            postCallAnalyzer.generate(session, scriptName, steps),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), POST_CALL_ANALYSIS_TIMEOUT_MS)
            ),
        ]);
    } catch (err: any) {
        logger.warn({ err: err?.message, callId }, 'Reprocessamento: análise pós-chamada falhou');
        return { ok: false, error: err?.message ?? 'Falha na análise' };
    }

    if (!summary) {
        return { ok: false, error: 'Análise não retornou resultado' };
    }

    const row = pickSummaryRowForDb(summary as Record<string, unknown>, callId);
    const { error: upsertError } = await supabaseAdmin
        .from('call_summaries')
        .upsert(row, { onConflict: 'call_id' });

    if (upsertError) {
        logger.warn({ err: upsertError, callId }, 'Reprocessamento: falha ao salvar resumo');
        return { ok: false, error: 'Falha ao salvar resumo' };
    }

    logger.info({ callId }, 'Reprocessamento: resumo salvo com sucesso');
    return { ok: true };
}

/**
 * Finds COMPLETED calls that have no or minimal summary and reprocesses them (batch).
 */
export async function findAndReprocessPendingCalls(limit = 5): Promise<{ processed: number; errors: number }> {
    const { data: summaries } = await supabaseAdmin
        .from('call_summaries')
        .select('call_id, ai_notes, objections_faced');

    const callIdsWithSummary = new Set((summaries ?? []).map((s: any) => s.call_id));

    const { data: completedCalls } = await supabaseAdmin
        .from('calls')
        .select('id')
        .eq('status', 'COMPLETED')
        .order('ended_at', { ascending: false })
        .limit(limit + 50);

    const pending: string[] = [];
    for (const c of completedCalls ?? []) {
        const id = (c as any).id;
        if (!id) continue;
        const hasSummary = callIdsWithSummary.has(id);
        if (!hasSummary) pending.push(id);
        if (pending.length >= limit) break;
    }

    const withMinimalSummary = (summaries ?? []).filter(
        (s: any) => !s.ai_notes && (!s.objections_faced || (Array.isArray(s.objections_faced) && s.objections_faced.length === 0))
    ).map((s: any) => s.call_id);
    for (const id of withMinimalSummary) {
        if (!pending.includes(id)) pending.push(id);
        if (pending.length >= limit) break;
    }

    let processed = 0;
    let errors = 0;
    for (const callId of pending.slice(0, limit)) {
        const result = await reprocessCallSummary(callId);
        if (result.ok) processed++;
        else errors++;
    }
    if (pending.length > 0) {
        logger.info({ processed, errors, pending: pending.length }, 'Job de reprocessamento executado');
    }
    return { processed, errors };
}

let reprocessIntervalId: ReturnType<typeof setInterval> | null = null;
const REPROCESS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Starts the periodic job that reprocesses unprocessed COMPLETED calls.
 */
export function startReprocessJob(): void {
    if (reprocessIntervalId) return;
    reprocessIntervalId = setInterval(async () => {
        try {
            await findAndReprocessPendingCalls(5);
        } catch (err) {
            logger.warn({ err }, 'Job de reprocessamento falhou');
        }
    }, REPROCESS_INTERVAL_MS);
    logger.info({ intervalMinutes: REPROCESS_INTERVAL_MS / 60000 }, 'Job de reprocessamento de chamadas iniciado');
}
