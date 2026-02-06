import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Manually load env for standalone script
import dotenv from 'dotenv';
dotenv.config();

// Workaround for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
    console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 API Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'MISSING');

    const testFilePath = path.join(__dirname, 'test.webm');

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
        console.error('❌ Test file not found:', testFilePath);
        console.log('Creating a dummy file for check (will fail transcription but test API connection)...');
        fs.writeFileSync(testFilePath, Buffer.from('FAKE AUDIO CONTENT'));
    }

    try {
        console.log('🎤 Testing Whisper API...');
        const result = await openai.audio.transcriptions.create({
            file: fs.createReadStream(testFilePath),
            model: 'whisper-1',
            language: 'pt'
        });
        console.log('✅ Transcription Result:', result);
    } catch (err: any) {
        console.error('❌ FULL ERROR:', JSON.stringify(err, null, 2));
        console.error('❌ Message:', err.message);
        console.error('❌ Status:', err.status);
    }
}

test();
