import type { ConvertOptions, ConvertResult } from '../types'
import { computeResize, estimateBase64SizeBytes, isSvgMime, normalizeTargetMime } from './utils'

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer()
}

async function readFileAsDataURL(file: File | Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(blob)
}

function extractMimeFromDataUrl(dataUrl: string): string {
  const semi = dataUrl.indexOf(';')
  if (dataUrl.startsWith('data:') && semi > 5) return dataUrl.slice(5, semi)
  return 'application/octet-stream'
}

function clampCanvasMime(requested: string): 'image/png' | 'image/jpeg' | 'image/webp' {
  return requested === 'image/jpeg' || requested === 'image/webp' ? requested : 'image/png'
}

function isDomAvailable(): boolean {
  return typeof document !== 'undefined' && typeof (document as any).createElement === 'function'
}

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  if (typeof OffscreenCanvas !== 'undefined' && !isDomAvailable()) {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
    return { canvas, ctx }
  }
  // DOM fallback
  const canvas = (document as Document).createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  return { canvas, ctx }
}

async function canvasToDataURL(canvas: HTMLCanvasElement | OffscreenCanvas, type: string, quality?: number): Promise<string> {
  const anyCanvas = canvas as any
  if (typeof anyCanvas.convertToBlob === 'function') {
    const blob = await (anyCanvas as OffscreenCanvas).convertToBlob({ type, quality })
    return await readFileAsDataURL(blob)
  }
  return (canvas as HTMLCanvasElement).toDataURL(type, quality)
}

export async function convertFileToBase64(file: File, options: ConvertOptions = {}): Promise<ConvertResult> {
  const originalMime = file.type || 'application/octet-stream'
  const targetMimeRequested = normalizeTargetMime(originalMime, options.targetFormat)

  // SVG passthrough (or to svg target)
  if (isSvgMime(originalMime) && (options.targetFormat === 'svg' || options.targetFormat === 'original' || options.targetFormat === 'base64' || !options.targetFormat)) {
    const dataUrl = await readFileAsDataURL(file)
    return { dataUrl, mime: extractMimeFromDataUrl(dataUrl), sizeBytes: estimateBase64SizeBytes(dataUrl), fileName: file.name }
  }

  // If no transform required and file is already base64-friendly, read as data URL directly
  if (options.targetFormat === 'original' || options.targetFormat === 'base64' || (!options.targetFormat && originalMime.startsWith('image/'))) {
    const needsCanvas = Boolean(options.resize) || (targetMimeRequested === 'image/jpeg')
    if (!needsCanvas) {
      const dataUrl = await readFileAsDataURL(file)
      return { dataUrl, mime: extractMimeFromDataUrl(dataUrl), sizeBytes: estimateBase64SizeBytes(dataUrl), fileName: file.name }
    }
  }

  // Convert via canvas (resize/format/quality)
  const blob = new Blob([await readFileAsArrayBuffer(file)], { type: originalMime })
  let bitmap: ImageBitmap
  try {
    bitmap = await blobToImageBitmap(blob)
  } catch (err) {
    // Fallback to HTMLImageElement only if DOM available; otherwise rethrow
    if (!isDomAvailable()) throw err
    const url = URL.createObjectURL(blob)
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve(createImageBitmap(img))
        URL.revokeObjectURL(url)
      }
      img.onerror = (e) => {
        URL.revokeObjectURL(url)
        reject(e)
      }
      img.src = url
    })
  }

  const { width: srcW, height: srcH } = bitmap
  const fit = options.resize?.fit ?? 'contain'
  const { width, height, sx, sy, sWidth, sHeight } = computeResize(srcW, srcH, options.resize?.maxWidth, options.resize?.maxHeight, fit)

  const { canvas, ctx } = createCanvas(width, height)

  const requestedCanvasMime = clampCanvasMime(targetMimeRequested)
  const shouldCompositeBackground = requestedCanvasMime === 'image/jpeg'
  if (shouldCompositeBackground) {
    ;(ctx as any).fillStyle = options.background ?? '#ffffff'
    ;(ctx as any).fillRect(0, 0, width, height)
  }
  ;(ctx as any).drawImage(bitmap as any, sx, sy, sWidth, sHeight, 0, 0, width, height)

  const quality = typeof options.quality === 'number' ? options.quality : 0.92
  const dataUrl = await canvasToDataURL(canvas, requestedCanvasMime, quality)
  const actualMime = extractMimeFromDataUrl(dataUrl)
  return { dataUrl, mime: actualMime, sizeBytes: estimateBase64SizeBytes(dataUrl), width, height, fileName: file.name }
}


