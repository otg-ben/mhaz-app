'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoViewerProps {
  photos: string[]
  initialIndex?: number
  onClose: () => void
}

export function PhotoViewer({ photos, initialIndex = 0, onClose }: PhotoViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(initialIndex)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Keyboard nav + escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') scrollTo(current + 1)
      if (e.key === 'ArrowLeft') scrollTo(current - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // Scroll to initial
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = initialIndex * scrollRef.current.offsetWidth
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollTo = (index: number) => {
    if (index < 0 || index >= photos.length) return
    scrollRef.current?.scrollTo({ left: index * (scrollRef.current.offsetWidth), behavior: 'smooth' })
    setCurrent(index)
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth)
    setCurrent(idx)
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 flex flex-col animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-sm text-white/50 font-mono">{current + 1} / {photos.length}</span>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Photo strip — CSS scroll snap */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {photos.map((url, i) => (
          <div
            key={i}
            className="w-full flex-shrink-0 snap-center flex items-center justify-center px-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Prev / next (desktop) */}
      {photos.length > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
          <button
            onClick={() => scrollTo(current - 1)}
            disabled={current === 0}
            className="pointer-events-auto p-2 rounded-xl bg-black/40 text-white/60 hover:text-white hover:bg-black/70 transition-colors disabled:opacity-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scrollTo(current + 1)}
            disabled={current === photos.length - 1}
            className="pointer-events-auto p-2 rounded-xl bg-black/40 text-white/60 hover:text-white hover:bg-black/70 transition-colors disabled:opacity-20"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-4 flex-shrink-0">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-white w-4' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
