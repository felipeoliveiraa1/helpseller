'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const NEAR_BOTTOM_THRESHOLD_PX = 40

/**
 * Auto-scrolls the container to the bottom ONLY when the user is already near the bottom.
 * If the user scrolled up to read history, keeps position and exposes `hasNewBelow` so the
 * caller can render a "↓ nova mensagem" button that calls `jumpToBottom`.
 */
export function useSmartAutoscroll<T extends HTMLElement = HTMLDivElement>(dep: unknown) {
  const containerRef = useRef<T | null>(null)
  const stuckToBottomRef = useRef(true)
  const [hasNewBelow, setHasNewBelow] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (stuckToBottomRef.current) {
      el.scrollTop = el.scrollHeight
      if (hasNewBelow) setHasNewBelow(false)
    } else {
      setHasNewBelow(true)
    }
  }, [dep]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX
    stuckToBottomRef.current = atBottom
    if (atBottom) setHasNewBelow(false)
  }, [])

  const jumpToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    stuckToBottomRef.current = true
    setHasNewBelow(false)
  }, [])

  return { containerRef, handleScroll, hasNewBelow, jumpToBottom }
}
