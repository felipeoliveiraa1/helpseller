import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AccessToken, type VideoGrant } from 'livekit-server-sdk';
import { z } from 'zod';

const BodySchema = z.object({
    roomName: z.string().min(1, 'roomName is required').max(256),
    identity: z.string().min(1, 'identity is required').max(256),
    role: z.enum(['publisher', 'viewer']),
});

export type LiveKitTokenBody = z.infer<typeof BodySchema>;

/**
 * POST /api/livekit/token
 * Generates a LiveKit access token for the given room and role.
 * Requires authenticated user (Supabase session). Token is never generated on the client.
 */
export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'LiveKit is not configured (missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET)' },
                { status: 503 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        let user: { id: string } | null = null;
        if (authHeader?.startsWith('Bearer ') && supabaseUrl && supabaseAnonKey) {
            const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: { Authorization: authHeader, apikey: supabaseAnonKey },
            });
            if (res.ok) {
                const u = await res.json();
                user = u;
            }
        }
        if (!user) {
            const cookieStore = await cookies();
            const supabase = createClient(cookieStore);
            const { data: { user: u } } = await supabase.auth.getUser();
            user = u;
        }
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { roomName, identity: requestedIdentity, role } = parsed.data;
        const identity = requestedIdentity.trim();

        const at = new AccessToken(apiKey, apiSecret, {
            identity,
            ttl: '2h',
        });

        const videoGrant: VideoGrant = {
            room: roomName,
            roomJoin: true,
            canPublish: role === 'publisher',
            canSubscribe: role === 'viewer' || role === 'publisher',
            canPublishData: false,
        };
        at.addGrant(videoGrant);

        const token = await at.toJwt();
        const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';
        return NextResponse.json({ token, serverUrl });
    } catch (err) {
        console.error('[LIVEKIT_TOKEN] Error generating token:', err);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
