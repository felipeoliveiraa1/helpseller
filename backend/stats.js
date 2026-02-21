require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('calls')
    .select('id, started_at, transcript', { count: 'exact' })
    .order('started_at', { ascending: false })
    .limit(1)
    .then(res => {
        const t = res.data[0].transcript || [];
        const text = t.map(x => `[${(x.speaker || 'UNKNOWN').toUpperCase()}] ${x.text || ''}`).join('\n');
        fs.writeFileSync('stats.txt', `Call ID: ${res.data[0].id}\nChunks: ${t.length}\nText Length: ${text.length}\nText Trimmed Length: ${text.trim().length}\n`);
    })
    .catch(console.error);
