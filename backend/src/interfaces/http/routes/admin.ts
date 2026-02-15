import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../../infrastructure/supabase/client.js';

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.post('/create-user', async (request: any, reply) => {
        const { email, password, name } = request.body;
        const { organization_id, role } = request.user;

        // Security check: Only managers can create users
        if (role !== 'MANAGER') {
            return reply.code(403).send({ error: 'Unauthorized: Only managers can create users' });
        }

        if (!email || !password || !name) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        try {
            console.log('Admin Debug: Creating user...', { email, role, organization_id });

            // 1. Create User in Supabase Auth
            // Try with auto-confirm first
            let authData, authError;

            try {
                console.log('Admin Debug: Attempting creation with auto-confirm...');
                const result = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: name,
                        role: 'SELLER',
                        organization_id: organization_id
                    }
                });
                authData = result.data;
                authError = result.error;
            } catch (err: any) {
                console.error('Admin Debug: Auto-confirm attempt failed', err);
                // Fallback if auto-confirm fails (e.g. key issue)
                if (err.message?.includes('service_role key')) {
                    console.log('Admin Debug: Retrying without auto-confirm');
                    const result = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: false,
                        user_metadata: {
                            full_name: name,
                            role: 'SELLER',
                            organization_id: organization_id
                        }
                    });
                    authData = result.data;
                    authError = result.error;
                } else {
                    throw err;
                }
            }

            if (authError) {
                console.error('Admin Debug: Auth Error returned', authError);
                if (authError.message?.includes('service_role key')) {
                    console.log('Admin Debug: Retrying without auto-confirm (from error obj)');
                    const result = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: false,
                        user_metadata: {
                            full_name: name,
                            role: 'SELLER',
                            organization_id: organization_id
                        }
                    });
                    authData = result.data;
                    authError = result.error;
                }
            }

            if (authError) {
                console.error('Admin Debug: Final Auth Error', authError);
                throw authError; // This will start the catch block below
            }

            const user = authData.user;
            if (!user) {
                return reply.code(500).send({ error: 'User not created' });
            }

            console.log('Admin Debug: User created, ID:', user.id);

            // 2. Create Profile in public.profiles (if not handled by trigger)
            // Ideally, a Supabase trigger handles this, but we can double check or enforce additional data here if needed.
            // For now, we assume the trigger on auth.users -> public.profiles exists or we rely on metadata sync.
            // However, to be safe and ensure the profile exists instantly for the UI:

            console.log('Admin Debug: Creating/Verifying profile...');
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: user.id,
                    email: email,
                    full_name: name,
                    role: 'SELLER',
                    organization_id: organization_id
                })
                .select()
                .single();

            // Ignore duplicate key error if trigger already created it
            if (profileError) {
                if (!profileError.message.includes('duplicate key')) {
                    console.error('Admin Debug: Profile creation error', profileError);
                    request.log.warn({ profileError }, 'Profile creation warning');
                } else {
                    console.log('Admin Debug: Profile already exists (duplicate key)');
                }
            } else {
                console.log('Admin Debug: Profile created successfully');
            }

            return { success: true, user: { id: user.id, email: user.email } };

        } catch (error: any) {
            console.error('Admin Debug: Catch Block Error', error);
            request.log.error({ error }, 'Failed to create user');
            return reply.code(500).send({ error: error.message || 'Failed to create user' });
        }
    });
}
