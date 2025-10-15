import { useCallback, useRef } from 'react'

/**
 * useFlipList
 * Lightweight FLIP-based list animator for drag-reorder transitions.
 * 1) Call capture() immediately before changing order.
 * 2) After state updates (next frame), call animate().
 * 3) Attach register(id) to each item's ref to track positions.
 */
export function useFlipList() {
  const nodeMap = useRef(new Map<string, HTMLElement>())
  const prevRectsRef = useRef(new Map<string, DOMRect>())

  const register = useCallback((id: string) => (el: HTMLElement | null) => {
    if (!el) {
      nodeMap.current.delete(id)
      return
    }
    nodeMap.current.set(id, el)
  }, [])

  const capture = useCallback(() => {
    const rects = new Map<string, DOMRect>()
    nodeMap.current.forEach((el, id) => {
      rects.set(id, el.getBoundingClientRect())
    })
    prevRectsRef.current = rects
  }, [])

  const animate = useCallback((duration = 220) => {
    const newRects = new Map<string, DOMRect>()
    nodeMap.current.forEach((el, id) => {
      newRects.set(id, el.getBoundingClientRect())
    })

    newRects.forEach((newRect, id) => {
      const prevRect = prevRectsRef.current.get(id)
      if (!prevRect) return
      const dx = prevRect.left - newRect.left
      const dy = prevRect.top - newRect.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
      const el = nodeMap.current.get(id)
      if (!el) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      // Force reflow
      el.getBoundingClientRect()
      el.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
      el.style.transform = ''
      const cleanup = () => {
        el.style.transition = ''
        el.removeEventListener('transitionend', cleanup)
      }
      el.addEventListener('transitionend', cleanup)
    })

    prevRectsRef.current = newRects
  }, [])

  return { register, capture, animate }
}

