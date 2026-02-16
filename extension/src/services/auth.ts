import { createClient } from '@supabase/supabase-js';

// These should eventually come from build env vars
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase with:', SUPABASE_URL ? 'URL Present' : 'URL Missing');

let supabase: any;

try {
    supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storage: {
                getItem: (key) => new Promise((resolve) => chrome.storage.local.get([key], (result) => resolve((result[key] as string) || null))),
                setItem: (key, value) => new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve)),
                removeItem: (key) => new Promise((resolve) => chrome.storage.local.remove([key], resolve)),
            }
        }
    });
    console.log('Supabase client created successfully');
} catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
}

export { supabase };

export const authService = {
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (data.session) {
            await this.saveSession(data.session);
        }
        return data;
    },

    async saveSession(session: any) {
        await chrome.storage.local.set({
            supabase_session: session,
            access_token: session.access_token,
            refresh_token: session.refresh_token
        });
    },

    async getSession(): Promise<any> {
        const data = await chrome.storage.local.get(['supabase_session']);
        return data.supabase_session;
    },

    async logout() {
        await supabase.auth.signOut();
        await chrome.storage.local.remove(['supabase_session', 'access_token', 'refresh_token']);
    },

    async getFreshToken(): Promise<string> {
        // 1. Tentar pegar sessão do Supabase (memória)
        let { data: { session }, error } = await supabase.auth.getSession();

        // 2. Se não tiver em memória, tentar recuperar do storage (background reiniciou / extensão recarregada)
        if (!session) {
            console.warn('⚠️ No session in memory, trying to recover from storage...');
            const storedSession = await this.getSession();
            if (storedSession && storedSession.refresh_token) {
                const { data: setData, error: setErr } = await supabase.auth.setSession({
                    access_token: storedSession.access_token,
                    refresh_token: storedSession.refresh_token
                });

                if (!setErr && setData.session) {
                    console.log('✅ Session recovered from storage');
                    session = setData.session;
                    await this.saveSession(setData.session);
                } else if (storedSession.refresh_token) {
                    // access_token pode estar expirado; tentar só refresh
                    console.warn('⚠️ setSession failed, trying refreshSession...');
                    const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession({
                        refresh_token: storedSession.refresh_token
                    });
                    if (!refreshErr && refreshData.session) {
                        console.log('✅ Session recovered via refresh');
                        session = refreshData.session;
                        await this.saveSession(refreshData.session);
                    } else {
                        console.error('❌ Failed to restore session:', setErr?.message || refreshErr?.message);
                    }
                } else {
                    console.error('❌ Failed to restore session: Auth session missing!');
                }
            }
        }

        if (!session) {
            throw new Error('No session found');
        }

        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = expiresAt - now;

        console.log(`🔑 Token time left: ${timeLeft}s`);

        // Se expira em menos de 5 minutos, forçar refresh
        if (timeLeft < 300) {
            console.log('🔄 Token expiring soon, refreshing...');
            const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();

            if (refreshErr || !refreshData.session) {
                console.error('❌ Token refresh failed:', refreshErr?.message);
                // Tentar usar o token atual mesmo assim
                return session.access_token;
            }

            console.log(`✅ Token refreshed! New expiry: ${refreshData.session.expires_at}`);
            // Salvar nova sessão
            await this.saveSession(refreshData.session);
            return refreshData.session.access_token;
        }

        return session.access_token;
    }
};
