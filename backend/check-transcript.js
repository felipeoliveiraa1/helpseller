require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('calls')
    .select('id, started_at, transcript')
    .order('started_at', { ascending: false })
    .limit(1)
    .then(res => {
        const t = res.data[0].transcript || [];
        const text = t.map(x => `[${(x.speaker || 'UNKNOWN').toUpperCase()}] ${x.text || ''}`).join('\n');
        console.log('Call ID:', res.data[0].id);
        console.log('Chunks:', t.length);
        console.log('Text Length:', text.length);
        console.log('Text Preview:', text);
    })
    .catch(console.error);
