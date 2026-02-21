import { OpenAIClient } from './openai-client.js';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';

const MIN_TEXT_LENGTH = 12;

const NORMALIZER_SYSTEM_PROMPT = `You are an ASR transcription corrector for Brazilian Portuguese.

Rules:
- Fix punctuation and grammar errors introduced by speech-to-text.
- Fix obvious misheard words based on context.
- Never invent words that were not spoken.
- Never add content, commentary, or explanations.
- Return ONLY the corrected text, nothing else.
- Keep the original meaning and speaker intent intact.`;

interface NormalizerResult {
    corrected: string;
}

/**
 * Corrects ASR transcription errors using an LLM.
 * Controlled by TRANSCRIPT_NORMALIZER_ENABLED feature flag.
 */
export class TranscriptNormalizer {
    constructor(private openaiClient: OpenAIClient) {}

    async normalize(text: string): Promise<string> {
        if (text.length < MIN_TEXT_LENGTH) return text;
        if (!env.TRANSCRIPT_NORMALIZER_ENABLED) return text;

        try {
            const result = await this.openaiClient.completeJson<NormalizerResult>(
                NORMALIZER_SYSTEM_PROMPT,
                `Correct this ASR transcript (return JSON {"corrected": "..."}): "${text}"`
            );
            return result?.corrected || text;
        } catch (err) {
            logger.warn({ err }, 'TranscriptNormalizer failed, returning original text');
            return text;
        }
    }
}
