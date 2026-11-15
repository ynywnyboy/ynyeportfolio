import { useMemo } from 'react'
import { useTable } from '../../lib/data'
import type { WheelOption, WheelSet, WheelSpin } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'

/** All Love Wheel data, kept live for both partners through Supabase Realtime. */
export function useWheelData() {
  const { loading: authLoading, isMember } = useAuth()
  const enabled = !authLoading && isMember
  const wheels = useTable<WheelSet>('wheel_sets', 'id', { orderBy: 'position', enabled })
  const options = useTable<WheelOption>('wheel_options', 'id', { orderBy: 'position', enabled })
  const history = useTable<WheelSpin>('wheel_history', 'id', { orderBy: 'created_at', ascending: false, enabled })

  const sortedWheels = useMemo(
    () => [...wheels.rows].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)),
    [wheels.rows],
  )

  return {
    wheels: sortedWheels,
    options: options.rows,
    history: history.rows,
    loading: wheels.loading || options.loading || history.loading,
    error: wheels.error || options.error || history.error,
    reloadOptions: options.reload,
  }
}

export type WheelData = ReturnType<typeof useWheelData>
