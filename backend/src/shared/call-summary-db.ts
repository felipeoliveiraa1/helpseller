/**
 * Colunas aceitas pela tabela call_summaries (evita erro ao fazer upsert com campos do AI que não existem no schema).
 */
export const CALL_SUMMARY_DB_COLUMNS = [
    'call_id',
    'script_adherence_score',
    'strengths',
    'improvements',
    'objections_faced',
    'buying_signals',
    'lead_sentiment',
    'result',
    'ai_notes',
    'raw_analysis',
] as const;

const RESULT_VALUES = new Set<string>(['CONVERTED', 'FOLLOW_UP', 'LOST', 'UNKNOWN']);
const SENTIMENT_VALUES = new Set<string>(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED']);
const RESULT_ALIASES: Record<string, string> = { CONVERTED: 'CONVERTED', FOLLOW_UP: 'FOLLOW_UP', FOLLOWUP: 'FOLLOW_UP', LOST: 'LOST', UNKNOWN: 'UNKNOWN', SEGUIMENTO: 'FOLLOW_UP', PERDIDA: 'LOST' };
const SENTIMENT_ALIASES: Record<string, string> = { POSITIVE: 'POSITIVE', NEUTRAL: 'NEUTRAL', NEGATIVE: 'NEGATIVE', MIXED: 'MIXED', POSITIVO: 'POSITIVE', NEUTRO: 'NEUTRAL', NEGATIVO: 'NEGATIVE', MISTO: 'MIXED' };
const JSONB_KEYS = new Set<string>(['strengths', 'improvements', 'objections_faced', 'buying_signals', 'raw_analysis']);

function normalizeResult(value: unknown): string | undefined {
    if (value == null) return undefined;
    const s = String(value).toUpperCase().replace(/\s+/g, '_');
    return RESULT_VALUES.has(s) ? s : RESULT_ALIASES[s] ?? undefined;
}

function normalizeSentiment(value: unknown): string | undefined {
    if (value == null) return undefined;
    const s = String(value).toUpperCase().trim();
    if (SENTIMENT_VALUES.has(s)) return s;
    return SENTIMENT_ALIASES[s] ?? (SENTIMENT_VALUES.has(s) ? s : undefined);
}

function sanitizeValue(key: string, value: unknown): unknown {
    if (value === undefined || value === null) return undefined;
    if (key === 'script_adherence_score') {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }
    if (key === 'result') return normalizeResult(value);
    if (key === 'lead_sentiment') return normalizeSentiment(value);
    if (JSONB_KEYS.has(key)) {
        if (Array.isArray(value)) return value;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }
    if (key === 'ai_notes') return typeof value === 'string' ? value : String(value);
    return value;
}

/**
 * Extrai do objeto summary apenas as chaves que existem em call_summaries e normaliza tipos (evita erro de CHECK/JSONB).
 */
export function pickSummaryRowForDb(summary: Record<string, unknown>, callId: string, resultOverride?: string | null): Record<string, unknown> {
    const row: Record<string, unknown> = { call_id: callId };
    const resultRaw = resultOverride ?? summary.result;
    const result = normalizeResult(resultRaw);
    if (result != null) row.result = result;
    for (const key of CALL_SUMMARY_DB_COLUMNS) {
        if (key === 'call_id' || key === 'result') continue;
        const value = summary[key];
        const sanitized = sanitizeValue(key, value);
        if (sanitized !== undefined && sanitized !== null) {
            row[key] = sanitized;
        }
    }
    return row;
}
