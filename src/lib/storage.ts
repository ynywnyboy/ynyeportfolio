import { supabase, BUCKET } from './supabase'

export const MAX_BYTES = 50 * 1024 * 1024 // Supabase free-tier per-file cap

export type UploadKind = 'image' | 'video' | 'audio'

/** Some phones/browsers hand over files with an empty `type`; fall back to the extension. */
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  avif: 'image/avif', heic: 'image/heic', heif: 'image/heif', bmp: 'image/bmp', svg: 'image/svg+xml',
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', ogv: 'video/ogg',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', oga: 'audio/ogg', ogg: 'audio/ogg', flac: 'audio/flac',
}

const extOf = (name: string) => (name.includes('.') ? name.split('.').pop() ?? '' : '').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * The MIME type Supabase Storage will serve the file with. If this is wrong or missing the
 * browser refuses to draw the image (Storage sends `nosniff`), which looks like "no preview".
 */
export function mimeOf(file: File): string {
  return file.type || EXT_MIME[extOf(file.name)] || ''
}

export function kindOf(file: File): UploadKind | null {
  const t = mimeOf(file)
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  if (t.startsWith('audio/')) return 'audio'
  return null
}

export function publicUrl(path: string | null | undefined): string {
  if (!path) return ''
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function validateFile(file: File, allowed: UploadKind[]): string | null {
  const k = kindOf(file)
  if (!k || !allowed.includes(k)) return `"${file.name}" is not a supported ${allowed.join('/')} file.`
  if (file.size > MAX_BYTES) return `"${file.name}" is larger than 50 MB (Supabase free-tier limit).`
  return null
}

/**
 * Resolves true if this browser can actually draw the image (e.g. iPhone HEIC photos only
 * display in Safari). Used to give a clear message instead of uploading a "broken" picture.
 */
export function canDisplayImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const done = (ok: boolean) => { clearTimeout(timer); resolve(ok) }
    const timer = setTimeout(() => done(true), 15000) // don't block huge files forever
    img.onload = () => done(true)
    img.onerror = () => done(false)
    img.src = url
  })
}

const isHeic = (f: File) => /^image\/hei[cf]$/i.test(f.type) || /\.hei[cf]$/i.test(f.name)

/**
 * Browsers other than Safari can't display HEIC photos, so they'd upload fine but show a
 * broken image. Convert HEIC/HEIF to JPEG in the browser when it can decode them (Safari /
 * iOS); otherwise stop with a clear message instead of storing a picture nobody can see.
 */
export async function normalizeImage(file: File): Promise<File> {
  if (!isHeic(file)) return file
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
    if (!blob) throw new Error('encode failed')
    return new File([blob], file.name.replace(/\.hei[cf]$/i, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    throw new Error(`"${file.name}" is a HEIC photo this browser can't read. Please upload it as JPEG (on iPhone: Settings → Camera → Formats → Most Compatible).`)
  }
}

/** Downscales big photos (used for page backgrounds) so they load fast on phones. */
export async function shrinkImage(file: File, maxSide = 2400): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < 1_500_000) { bmp.close?.(); return file }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close?.()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.86))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

/** Uploads a file to persistent Supabase Storage and returns its storage path. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = extOf(file.name) || 'bin'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: mimeOf(file) || undefined,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function removeFiles(paths: (string | null | undefined)[]): Promise<void> {
  const list = paths.filter((p): p is string => Boolean(p))
  if (!list.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(list)
  if (error) throw error
}
