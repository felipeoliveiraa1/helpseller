import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const urlOrEmpty = z.union([z.string().url(), z.literal('')]);

const envSchema = z.object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('*'),

    // Supabase (optional at boot so Cloud Run can start; set in service env for full behavior)
    SUPABASE_URL: urlOrEmpty.default(''),
    SUPABASE_ANON_KEY: z.string().default(''),
    SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),

    // Redis (use "memory" for no Redis / in-memory only, e.g. Cloud Run without Memorystore)
    REDIS_URL: z.union([z.string().url(), z.literal('memory')]).default('redis://localhost:6379'),

    // OpenAI
    OPENAI_API_KEY: z.string().default(''),

    // Deepgram
    DEEPGRAM_API_KEY: z.string().default(''),
    TRANSCRIPTION_PROVIDER: z.enum(['deepgram', 'whisper']).default('deepgram'),
    TRANSCRIPT_NORMALIZER_ENABLED: z.coerce.boolean().default(false),

    // Stripe
    STRIPE_SECRET_KEY: z.string().default(''),
    STRIPE_WEBHOOK_SECRET: z.string().default(''),

    // WebSocket
    WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const env = _env.data;

export const config = {
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
};
