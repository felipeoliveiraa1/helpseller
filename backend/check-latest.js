require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: calls } = await supabase
        .from('calls')
        .select('id, transcript, started_at, call_summaries(ai_notes, result)')
        .order('started_at', { ascending: false })
        .limit(1);

    if (calls && calls.length > 0) {
        const call = calls[0];
        const transcript = call.transcript || [];
        const text = transcript.map(t => `[${t.speaker}] ${t.text}`).join('\n');
        console.log('Call ID:', call.id);
        console.log('Chunks:', transcript.length);
        console.log('Text Length:', text.length);
        console.log('AI Notes Length:', call.call_summaries?.[0]?.ai_notes?.length);
        console.log('--- AI NOTES START ---');
        console.log(call.call_summaries?.[0]?.ai_notes?.substring(0, 500));
        console.log('--- AI NOTES END ---');
        console.log('--- TRANSCRIPT START ---');
        console.log(text.substring(0, 1000));
        console.log('--- TRANSCRIPT END ---');
    }
}

run();
