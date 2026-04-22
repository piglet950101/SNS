'use client'

import * as React from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { ALLOWED_IMAGE_MIME, MAX_IMAGES_PER_POST } from '@postari/shared'
import { compressImage } from '@/lib/image-compression'
import { useApi } from '@/lib/api-client'
import { Button } from './ui/button'
import { cn } from '@/lib/cn'

export interface PickedImage {
  tempId: string
  publicUrl: string
  previewUrl: string
  uploading: boolean
}

export function ImagePicker({
  images,
  onChange,
  disabled,
}: {
  images: PickedImage[]
  /** Functional setter — accepts `useState<PickedImage[]>` directly. */
  onChange: React.Dispatch<React.SetStateAction<PickedImage[]>>
  disabled?: boolean
}) {
  const api = useApi()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErr(null)
    const room = MAX_IMAGES_PER_POST - images.length
    if (room <= 0) {
      setErr(`画像は最大 ${MAX_IMAGES_PER_POST} 枚までです`)
      return
    }
    const incoming = Array.from(files).slice(0, room)

    // Each placeholder has a unique tempId so concurrent completions update
    // the right row even if order of completion differs from order of start.
    const withIds = incoming.map((file) => ({
      file,
      tempId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      previewUrl: URL.createObjectURL(file),
    }))

    onChange((prev) => [
      ...prev,
      ...withIds.map(
        (w): PickedImage => ({
          tempId: w.tempId,
          publicUrl: '',
          previewUrl: w.previewUrl,
          uploading: true,
        }),
      ),
    ])

    await Promise.all(
      withIds.map(async (w) => {
        try {
          if (!ALLOWED_IMAGE_MIME.includes(w.file.type as (typeof ALLOWED_IMAGE_MIME)[number])) {
            throw new Error('JPEG/PNG/WebP のみ対応しています')
          }
          const { blob } = await compressImage(w.file)
          const filename = w.file.name.replace(/[^A-Za-z0-9._-]/g, '_')
          const sig = await api<{ uploadUrl: string; publicUrl: string }>(
            '/api/posts/upload-url',
            {
              method: 'POST',
              body: JSON.stringify({ filename, contentType: 'image/jpeg' }),
            },
          )
          const putRes = await fetch(sig.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: blob,
          })
          if (!putRes.ok) throw new Error('アップロードに失敗しました')

          onChange((prev) =>
            prev.map((img) =>
              img.tempId === w.tempId
                ? { ...img, publicUrl: sig.publicUrl, uploading: false }
                : img,
            ),
          )
        } catch (e) {
          setErr((e as Error).message)
          URL.revokeObjectURL(w.previewUrl)
          onChange((prev) => prev.filter((img) => img.tempId !== w.tempId))
        }
      }),
    )
  }

  const remove = (tempId: string) => {
    const target = images.find((img) => img.tempId === tempId)
    if (target?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl)
    onChange((prev) => prev.filter((img) => img.tempId !== tempId))
  }

  const clearAll = () => {
    for (const img of images) {
      if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl)
    }
    onChange([])
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files)
          // Reset so selecting the same file again still triggers onChange.
          e.currentTarget.value = ''
        }}
        disabled={disabled}
      />
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img) => (
          <div
            key={img.tempId}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
            {img.uploading && (
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(img.tempId)}
              aria-label="画像を削除"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES_PER_POST && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'grid h-20 w-20 shrink-0 place-items-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/40 text-primary-600 hover:bg-primary-50',
              disabled && 'opacity-50',
            )}
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            <span className="sr-only">画像を追加</span>
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        画像は1〜{MAX_IMAGES_PER_POST}枚、JPEG/PNG/WebP に対応。5MB以内に自動圧縮されます。
      </p>
      {images.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={clearAll}>
          すべてクリア
        </Button>
      )}
    </div>
  )
}
