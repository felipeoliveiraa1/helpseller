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
        if (!organization_id) {
            return reply.code(400).send({ error: 'Missing organization. Faça login novamente.' });
        }

        const managerOrgId = String(organization_id);

        try {
            console.log('Admin Debug: Creating user...', { email, role, organization_id: managerOrgId });

            // 1. Create User in Supabase Auth (metadata com organization_id em string para o trigger)
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
                        organization_id: managerOrgId
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
                            organization_id: managerOrgId
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
                            organization_id: managerOrgId
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

            // 2. Garantir perfil na organização do gerente e role SELLER (trigger pode ter criado org errada + MANAGER)
            const profilePayload = {
                email,
                full_name: name,
                role: 'SELLER',
                organization_id: managerOrgId
            };
            const { data: updatedProfile, error: updateError } = await supabaseAdmin
                .from('profiles')
                .update(profilePayload)
                .eq('id', user.id)
                .select()
                .single();

            if (updateError || !updatedProfile) {
                const { error: insertError } = await supabaseAdmin
                    .from('profiles')
                    .insert({ id: user.id, ...profilePayload })
                    .select()
                    .single();
                if (insertError) {
                    console.error('Admin Debug: Profile update/insert error', updateError || insertError);
                    request.log.warn({ updateError, insertError }, 'Profile fix failed');
                }
            } else {
                console.log('Admin Debug: Profile updated to org', managerOrgId, 'role SELLER');
            }

            return { success: true, user: { id: user.id, email: user.email } };

        } catch (error: any) {
            const message = error?.message || String(error);
            console.error('Admin Debug: Catch Block Error', error);
            request.log.error({ error }, 'Failed to create user');
            if (message.includes('already been registered') || message.includes('already exists') || message.includes('User already registered')) {
                return reply.code(400).send({ error: 'Este e-mail já está cadastrado.' });
            }
            if (message.includes('Profile not found') || message.includes('organization')) {
                return reply.code(400).send({ error: message });
            }
            return reply.code(500).send({ error: message || 'Falha ao criar usuário.' });
        }
    });

    /** Alterar senha de um vendedor/membro da organização. Apenas gestor (MANAGER) pode usar. */
    fastify.post('/update-password', async (request: any, reply) => {
        const { user_id: targetUserId, new_password } = request.body as { user_id?: string; new_password?: string };
        const { organization_id, role } = request.user;

        if (role !== 'MANAGER') {
            return reply.code(403).send({ error: 'Apenas o gestor pode alterar a senha de vendedores.' });
        }
        if (!organization_id) {
            return reply.code(400).send({ error: 'Missing organization. Faça login novamente.' });
        }
        if (!targetUserId || !new_password || new_password.length < 6) {
            return reply.code(400).send({ error: 'Informe o usuário e uma nova senha com no mínimo 6 caracteres.' });
        }

        try {
            const { data: targetProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id, organization_id, role')
                .eq('id', targetUserId)
                .single();

            if (profileError || !targetProfile) {
                return reply.code(404).send({ error: 'Usuário não encontrado.' });
            }
            if ((targetProfile as { organization_id: string }).organization_id !== organization_id) {
                return reply.code(403).send({ error: 'Você só pode alterar a senha de membros da sua organização.' });
            }

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                password: new_password
            });

            if (updateError) {
                const msg = updateError.message || 'Falha ao atualizar senha.';
                if (msg.includes('password') && msg.toLowerCase().includes('least')) {
                    return reply.code(400).send({ error: 'A senha deve ter no mínimo 6 caracteres.' });
                }
                return reply.code(500).send({ error: msg });
            }

            return { success: true, message: 'Senha alterada com sucesso.' };
        } catch (error: any) {
            request.log.error({ error }, 'Admin update-password error');
            return reply.code(500).send({ error: error?.message || 'Falha ao alterar senha.' });
        }
    });
}
