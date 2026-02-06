import OpenAI from 'openai';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class WhisperClient {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY
        });
    }

    async transcribe(audioBuffer: Buffer, prompt?: string): Promise<string> {
        // Create a unique temp file path
        const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`);

        try {
            logger.info(`🎤 Transcribing audio with Whisper (Temp File: ${tempFilePath})...`);

            // 1. Write Buffer to Temp File
            await fs.promises.writeFile(tempFilePath, audioBuffer);

            // 🔍 VALIDATION: Check for WebM Header (EBML)
            const fileHeader = await fs.promises.open(tempFilePath, 'r');
            const bufferHeader = Buffer.alloc(4);
            await fileHeader.read(bufferHeader, 0, 4, 0);
            await fileHeader.close();

            const headerHex = bufferHeader.toString('hex');
            logger.info(`🔍 Validating File Header: ${headerHex} (Expected: 1a45dfa3 for WebM)`);

            if (headerHex !== '1a45dfa3') {
                logger.warn('⚠️ WARNING: Invalid WebM header detected! The file might be rejected by Whisper.');
            }

            // 2. Send ReadStream to OpenAI
            const response = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                language: 'pt',
                response_format: 'verbose_json', // Access metadata
                temperature: 0.0, // Minimal creativity = less hallucinations
                prompt: prompt
            }) as any;

            // 3. Process Verbose Response (Check no_speech_prob)
            if (response.segments) {
                // Calculate average no_speech_prob
                const avgNoSpeechProb = response.segments.reduce(
                    (sum: number, seg: any) => sum + (seg.no_speech_prob || 0), 0
                ) / (response.segments.length || 1);

                logger.debug(`📊 Whisper Metrics - segments: ${response.segments.length}, avg_no_speech: ${avgNoSpeechProb.toFixed(3)}`);

                if (avgNoSpeechProb > 0.6) {
                    logger.info(`🔇 High silence probability (${avgNoSpeechProb.toFixed(2)}) - discarding potential hallucination`);
                    return '';
                }

                // Filter individual segments
                const validText = response.segments
                    .filter((seg: any) => (seg.no_speech_prob || 0) < 0.6)
                    .map((seg: any) => seg.text)
                    .join(' ')
                    .trim();

                logger.info('✅ Transcription completed');
                return validText;
            }

            // Fallback if no segments (rare with verbose_json)
            const text = response.text || '';
            logger.info('✅ Transcription completed (simple text)');
            return text;

        } catch (err: any) {
            // LOG COMPLETO — cobrir TODOS os formatos possíveis de erro
            logger.error({
                message: err.message,
                status: err.status || err.response?.status,
                data: err.response?.data || err.error,
                type: err.type,
                code: err.code,
                stack: err.stack,
                fullObject: err
            }, '❌ Whisper FULL error object');

            throw err;
        } finally {
            // 3. Cleanup Temp File
            try {
                if (fs.existsSync(tempFilePath)) {
                    await fs.promises.unlink(tempFilePath);
                    logger.debug('🧹 Temp file cleaned up');
                }
            } catch (cleanupErr) {
                logger.warn({ err: cleanupErr }, '⚠️ Failed to delete temp file');
            }
        }
    }
}
