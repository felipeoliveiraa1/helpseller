/**
 * Objection Matcher Web Worker
 * Runs in isolated thread to avoid blocking main thread during matching
 * Ports exact logic from backend/src/infrastructure/ai/objection-matcher.ts
 */

interface Objection {
    id: string;
    trigger_phrases: string[];
    suggested_response: string;
    mental_trigger: string;
    coaching_tip: string;
    success_rate?: number; // Historical conversion rate (0-1)
}

interface MatchRequest {
    requestId: string;
    text: string;
    objections: Objection[];
}

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

/**
 * Normalizes text for matching (exact port from backend)
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .trim();
}

/**
 * Calculates matching score between text and phrase (exact port from backend)
 */
function calculateScore(text: string, phrase: string): number {
    if (text.includes(phrase)) return 1.0;

    // Basic word overlap check
    const textWords = new Set(text.split(/\s+/));
    const phraseWords = phrase.split(/\s+/);
    const matches = phraseWords.filter(w => textWords.has(w)).length;

    return matches / phraseWords.length;
}

/**
 * Main matching function with success rate boost (exact port from backend)
 */
function match(text: string, objections: Objection[]): MatchResult | null {
    const normalized = normalize(text);
    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    for (const obj of objections) {
        for (const phrase of obj.trigger_phrases) {
            const normalizedPhrase = normalize(phrase);

            // Calculate base matching score
            let score = calculateScore(normalized, normalizedPhrase);

            // Apply success rate boost if enabled and data is available
            if (obj.success_rate !== undefined && obj.success_rate > 0) {
                // Boost can add up to 15% to the score
                // This means in tie-breaking scenarios, higher success rate wins
                const successBoost = obj.success_rate * 0.15;
                score = score + successBoost;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    score,
                    objectionId: obj.id,
                    triggerPhrase: phrase,
                    suggestedResponse: obj.suggested_response,
                    mentalTrigger: obj.mental_trigger,
                    coachingTip: obj.coaching_tip
                };
            }
        }
    }

    // Return match only if score is above threshold
    return bestMatch && bestMatch.score > 0.4 ? bestMatch : null;
}

// Worker message handler
self.onmessage = (e: MessageEvent<MatchRequest>) => {
    const { requestId, text, objections } = e.data;

    const startTime = performance.now();
    const result = match(text, objections);
    const duration = performance.now() - startTime;

    const response: WorkerResponse = {
        requestId,
        result,
        duration,
        timestamp: Date.now()
    };

    self.postMessage(response);
};

// Log when worker is ready
console.log('⚡ Objection Matcher Worker initialized');
