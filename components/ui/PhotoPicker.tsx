'use client'

import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface PhotoPickerProps {
  photos: string[]
  onChange: (urls: string[]) => void
  maxPhotos?: number
}

export function PhotoPicker({ photos, onChange, maxPhotos = 3 }: PhotoPickerProps) {
  const { user } = useAuth()
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const supabase = createClient()

  const handleFile = async (index: number, file: File) => {
    if (!user) return
    setUploadingSlot(index)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${index}.${ext}`
      const { error } = await supabase.storage
        .from('trail-photos')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('trail-photos').getPublicUrl(path)
      const updated = [...photos]
      updated[index] = publicUrl
      onChange(updated.filter(Boolean))
    } catch (err) {
      console.error('Photo upload failed', err)
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleRemove = (index: number) => {
    const updated = [...photos]
    updated.splice(index, 1)
    onChange(updated)
  }

  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] ?? null)

  return (
    <div className="flex gap-2">
      {slots.map((url, i) => (
        <PhotoSlot
          key={i}
          url={url}
          loading={uploadingSlot === i}
          onFile={(file) => handleFile(i, file)}
          onRemove={() => handleRemove(i)}
          disabled={uploadingSlot !== null}
        />
      ))}
    </div>
  )
}

function PhotoSlot({
  url, loading, onFile, onRemove, disabled,
}: {
  url: string | null
  loading: boolean
  onFile: (f: File) => void
  onRemove: () => void
  disabled: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden border-2 border-dashed border-border flex-shrink-0">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />

      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Trail photo" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
          >
            <X size={10} className="text-white" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={disabled}
          className={cn(
            'w-full h-full flex flex-col items-center justify-center gap-1',
            'hover:bg-elevated/60 transition-colors text-muted',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera size={20} />
          )}
          <span className="text-[10px]">{loading ? 'Uploading…' : 'Add photo'}</span>
        </button>
      )}
    </div>
  )
}
