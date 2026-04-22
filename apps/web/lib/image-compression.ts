// -----------------------------------------------------------------------------
// Client-side image compression using Canvas API.
// Compresses to JPEG <= maxBytes (default 5 MB) by iteratively lowering quality.
// -----------------------------------------------------------------------------

import { MAX_IMAGE_BYTES } from '@postari/shared'

export interface CompressOptions {
  maxBytes?: number
  maxDimension?: number // longest edge, px
  mimeType?: 'image/jpeg' | 'image/webp'
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<{ blob: Blob; width: number; height: number }> {
  const maxBytes = opts.maxBytes ?? MAX_IMAGE_BYTES
  const maxDim = opts.maxDimension ?? 2_048
  const type = opts.mimeType ?? 'image/jpeg'

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (Math.max(width, height) > maxDim) {
    const ratio = maxDim / Math.max(width, height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : (() => {
          const c = document.createElement('canvas')
          c.width = width
          c.height = height
          return c
        })()

  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  let quality = 0.92
  let blob = await toBlob(canvas, type, quality)
  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08
    blob = await toBlob(canvas, type, quality)
  }
  return { blob, width, height }
}

async function toBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type, quality })
  }
  return new Promise((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))),
      type,
      quality,
    )
  })
}
