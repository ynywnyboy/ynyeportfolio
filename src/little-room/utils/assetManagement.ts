import { publicUrl, removeFiles, uploadFile } from '../../lib/storage'
import { assetId } from './house'
import type { Asset, LibCat } from '../types/littleRoom'

const extOf = (b: Blob) => (b.type === 'image/webp' ? 'webp' : b.type === 'image/jpeg' ? 'jpg' : 'png')

/** Uploads one picture into the existing storage bucket (folder "room-assets") and returns its library entry. */
export async function saveAsset(blob: Blob, meta: { name: string; category: LibCat; w: number; h: number; from: Asset['from']; hash?: string }): Promise<Asset> {
  const file = new File([blob], `${meta.name.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'asset'}.${extOf(blob)}`, { type: blob.type || 'image/png' })
  const path = await uploadFile(file, 'room-assets')
  return { id: assetId(), name: meta.name, category: meta.category, path, w: meta.w, h: meta.h, from: meta.from, hash: meta.hash, created: new Date().toISOString() }
}

export const assetUrl = (a: Asset) => publicUrl(a.path)

export async function deleteAssetFile(a: Asset) { try { await removeFiles([a.path]) } catch { /* the library entry is removed anyway */ } }

/** Extraction results are remembered for this session so the same picture is never processed twice. */
export const separationCache = new Map<string, unknown>()
