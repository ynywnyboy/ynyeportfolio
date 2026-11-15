/** Rough "is this a weak device?" check used to scale animation workloads down. */
export function isLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number }
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || (typeof window !== 'undefined' && window.innerWidth < 640)
}
