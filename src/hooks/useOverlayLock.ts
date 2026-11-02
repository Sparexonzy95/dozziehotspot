import { useEffect } from 'react'

/**
 * While a drawer or sheet is open: stop the page behind it from scrolling and
 * flag the document so floating badges step out of the way.
 */
export function useOverlayLock(open: boolean): void {
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    root.dataset.overlay = 'open'
    return () => {
      document.body.style.overflow = overflow
      delete root.dataset.overlay
    }
  }, [open])
}
