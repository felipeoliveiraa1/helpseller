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

/** CORS headers so the Chrome extension can call this API (extension origin varies per install). */
function corsHeaders(request: NextRequest): Record<string, string> {
    const origin = request.headers.get('origin');
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

/** OPTIONS for preflight when extension calls from chrome-extension:// origin */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

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
                { status: 503, headers: corsHeaders(request) }
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(request) });
        }

        const body = await request.json();
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400, headers: corsHeaders(request) }
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
        if (!serverUrl) {
            console.warn('[LIVEKIT_TOKEN] NEXT_PUBLIC_LIVEKIT_URL is not set; extension will not publish to LiveKit');
        }
        return NextResponse.json({ token, serverUrl }, { headers: corsHeaders(request) });
    } catch (err) {
        console.error('[LIVEKIT_TOKEN] Error generating token:', err);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500, headers: corsHeaders(request) }
        );
    }
}
