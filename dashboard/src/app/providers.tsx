'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'

if (typeof window !== 'undefined') {
    const originalError = console.error
    console.error = (...args) => {
        if (typeof args[0] === 'string' && (
            args[0].includes('bis_skin_checked') ||
            args[0].includes('Tried to add a track for a participant')
        )) {
            return
        }
        originalError(...args)
    }
}

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        refetchOnWindowFocus: true,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                {children}
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        </QueryClientProvider>
    )
}
