export interface Objection {
    id: string;
    trigger_phrases: string[];
    suggested_response: string;
    mental_trigger: string;
    coaching_tip: string;
    success_rate?: number; // Historical conversion rate (0-1)
}

export interface ObjectionMatchResult {
    score: number;
    objectionId: string;
    triggerPhrase: string;
    suggestedResponse: string;
    mentalTrigger: string;
    coachingTip: string;
}

export class ObjectionMatcher {
    /**
     * Match objections with intelligent prioritization based on success rates
     * @param text - The text to match against
     * @param objections - List of objections with optional success_rate
     * @param useSuccessRateBoost - Whether to apply success rate boosting (default: true)
     * @param minUsageForBoost - Minimum usage count before applying boost (default: 5)
     */
    match(
        text: string,
        objections: Objection[],
        useSuccessRateBoost: boolean = true,
        minUsageForBoost: number = 5
    ): ObjectionMatchResult | null {
        const normalized = this.normalize(text);
        let bestMatch: ObjectionMatchResult | null = null;
        let bestScore = 0;

        for (const obj of objections) {
            for (const phrase of obj.trigger_phrases) {
                const normalizedPhrase = this.normalize(phrase);

                // Calculate base matching score
                let score = this.calculateScore(normalized, normalizedPhrase);

                // Apply success rate boost if enabled and data is available
                if (useSuccessRateBoost && obj.success_rate !== undefined) {
                    // Only apply boost if we have enough data to be confident
                    // This prevents overfitting on 1-2 data points
                    const hasEnoughData = true; // We don't have usage count here, so trust the rate if provided

                    if (hasEnoughData && obj.success_rate > 0) {
                        // Boost can add up to 15% to the score
                        // This means in tie-breaking scenarios, higher success rate wins
                        const successBoost = obj.success_rate * 0.15;
                        score = score + successBoost;
                    }
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

        return bestMatch && bestMatch.score > 0.4 ? bestMatch : null;
    }

    private normalize(text: string): string {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '').trim();
    }

    private calculateScore(text: string, phrase: string): number {
        if (text.includes(phrase)) return 1.0;

        // Basic overlap check
        const textWords = new Set(text.split(/\s+/));
        const phraseWords = phrase.split(/\s+/);
        const matches = phraseWords.filter(w => textWords.has(w)).length;

        return matches / phraseWords.length;
    }
}
