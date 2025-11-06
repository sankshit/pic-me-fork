export function normalizeTargetMime(originalMime: string, target?: string): string {
  if (!target || target === 'original' || target === 'base64') return originalMime || 'application/octet-stream'
  switch (target) {
    case 'png':
      return 'image/png'
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return originalMime || 'application/octet-stream'
  }
}

export function estimateBase64SizeBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl
  // Remove padding
  const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
  return Math.floor(base64.length * 3 / 4) - padding
}

export type FitMode = 'contain' | 'cover'

export function computeResize(
  srcWidth: number,
  srcHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  fit: FitMode = 'contain',
): { width: number; height: number; sx: number; sy: number; sWidth: number; sHeight: number } {
  const sourceAspect = srcWidth / srcHeight
  const targetMaxWidth = maxWidth ?? srcWidth
  const targetMaxHeight = maxHeight ?? srcHeight

  if (fit === 'contain') {
    const scale = Math.min(targetMaxWidth / srcWidth, targetMaxHeight / srcHeight, 1)
    return { width: Math.round(srcWidth * scale), height: Math.round(srcHeight * scale), sx: 0, sy: 0, sWidth: srcWidth, sHeight: srcHeight }
  }

  // cover
  const targetAspect = targetMaxWidth / targetMaxHeight
  let sWidth = srcWidth
  let sHeight = srcHeight
  if (sourceAspect > targetAspect) {
    // source is wider, crop horizontally
    sWidth = Math.round(srcHeight * targetAspect)
  } else {
    // source is taller, crop vertically
    sHeight = Math.round(srcWidth / targetAspect)
  }
  const sx = Math.floor((srcWidth - sWidth) / 2)
  const sy = Math.floor((srcHeight - sHeight) / 2)
  return { width: targetMaxWidth, height: targetMaxHeight, sx, sy, sWidth, sHeight }
}

export function isSvgMime(mime?: string): boolean {
  return mime === 'image/svg+xml' || mime === 'image/svg'
}

export function mimeToExtension(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
    case 'image/svg':
      return 'svg'
    case 'image/gif':
      return 'gif'
    case 'image/bmp':
      return 'bmp'
    default:
      return 'bin'
  }
}


