'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface DocumentPictureInPicture {
    requestWindow(options?: { width?: number; height?: number }): Promise<Window>
    window: Window | null
}

declare global {
    interface Window {
        documentPictureInPicture?: DocumentPictureInPicture
    }
}

interface OpenOptions {
    width: number
    height: number
    /** Used only when the Document Picture-in-Picture API is unavailable. */
    fallbackUrl: string
    /** Label for the popup window. */
    fallbackName?: string
}

interface PipState {
    /** Element where the consumer should render via createPortal. Null while closed. */
    container: HTMLElement | null
    /** True when a PiP / popup window is open. */
    isOpen: boolean
    /** True when the browser supports the Document PiP API. */
    supportsDocumentPip: boolean
}

/**
 * Opens a Document Picture-in-Picture window when the browser supports it, or falls
 * back to a plain `window.open` popup. The consumer receives a `container` element
 * (when Document PiP is used) so it can render React content into the PiP window via
 * `createPortal`.
 *
 * Must be called from a user gesture (click handler) — browser requirement for both
 * the Document PiP API and `window.open` without pop-up blockers.
 */
export function usePictureInPicture() {
    const [state, setState] = useState<PipState>({
        container: null,
        isOpen: false,
        supportsDocumentPip:
            typeof window !== 'undefined' && 'documentPictureInPicture' in window,
    })
    const pipWindowRef = useRef<Window | null>(null)
    const fallbackPopupRef = useRef<Window | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const cleanup = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
        pipWindowRef.current = null
        fallbackPopupRef.current = null
        setState((prev) => ({ ...prev, container: null, isOpen: false }))
    }, [])

    const close = useCallback(() => {
        try {
            if (pipWindowRef.current && !pipWindowRef.current.closed) {
                pipWindowRef.current.close()
            }
        } catch { /* ignore */ }
        try {
            if (fallbackPopupRef.current && !fallbackPopupRef.current.closed) {
                fallbackPopupRef.current.close()
            }
        } catch { /* ignore */ }
        cleanup()
    }, [cleanup])

    const open = useCallback(async (opts: OpenOptions) => {
        // If already open, no-op
        if (pipWindowRef.current && !pipWindowRef.current.closed) return
        if (fallbackPopupRef.current && !fallbackPopupRef.current.closed) return

        // Preferred path: Document Picture-in-Picture API (floating, always-on-top).
        if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
            try {
                const pipWindow = await window.documentPictureInPicture!.requestWindow({
                    width: opts.width,
                    height: opts.height,
                })

                // Base reset + dark bg so the popup matches the main app visually.
                const baseStyle = pipWindow.document.createElement('style')
                baseStyle.textContent = `
                    html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0a; color: white;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        overflow: hidden; }
                    * { box-sizing: border-box; }
                    button { font-family: inherit; }
                    @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                    @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
                    @keyframes cursorBlink { 50% { opacity: 0 } }
                `
                pipWindow.document.head.appendChild(baseStyle)

                // Copy same-origin stylesheets from the main document so any CSS modules
                // / Tailwind used by child components keep working.
                Array.from(document.styleSheets).forEach((sheet) => {
                    try {
                        const rules = sheet.cssRules
                        if (!rules) return
                        const styleEl = pipWindow.document.createElement('style')
                        styleEl.textContent = Array.from(rules).map((r) => r.cssText).join('\n')
                        pipWindow.document.head.appendChild(styleEl)
                    } catch {
                        // Cross-origin stylesheet — clone via <link> instead.
                        if (sheet.href) {
                            const link = pipWindow.document.createElement('link')
                            link.rel = 'stylesheet'
                            link.href = sheet.href
                            pipWindow.document.head.appendChild(link)
                        }
                    }
                })

                const container = pipWindow.document.createElement('div')
                container.style.height = '100%'
                pipWindow.document.body.appendChild(container)

                pipWindow.addEventListener('pagehide', cleanup, { once: true })

                pipWindowRef.current = pipWindow
                setState({ container, isOpen: true, supportsDocumentPip: true })
                return
            } catch (err) {
                // Fall through to window.open fallback.
                // eslint-disable-next-line no-console
                console.warn('[PiP] Document PiP failed, falling back to window.open:', err)
            }
        }

        // Fallback: traditional popup window (creates a browser chrome tab).
        const left = window.screenX + window.outerWidth - opts.width - 40
        const top = window.screenY + 80
        const popup = window.open(
            opts.fallbackUrl,
            opts.fallbackName ?? 'helpcloser-session',
            `popup=yes,width=${opts.width},height=${opts.height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
        )
        if (!popup) return
        fallbackPopupRef.current = popup
        setState((prev) => ({ ...prev, container: null, isOpen: true }))

        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(() => {
            if (!popup || popup.closed) cleanup()
        }, 500)
    }, [cleanup])

    // Clean up when the component holding the hook unmounts.
    useEffect(() => {
        return () => {
            close()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { ...state, open, close }
}
