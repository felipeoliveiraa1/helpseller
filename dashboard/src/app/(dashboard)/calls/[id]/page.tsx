'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect /calls/[id] to /calls?callId=[id] so the Raio X is shown in the panel on the calls page.
 */
export default function CallIdRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            router.replace(`/calls?callId=${encodeURIComponent(id)}`);
        } else {
            router.replace('/calls');
        }
    }, [id, router]);

    return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff007a]" />
            <span className="ml-2 text-sm text-gray-400">Redirecionando...</span>
        </div>
    );
}
