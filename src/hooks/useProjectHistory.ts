import { useCallback, useState } from 'react'
import { createDefaultProject } from '../defaults'
import type { PlaymatProject } from '../types'

const HISTORY_LIMIT = 40

export function useProjectHistory() {
  const [project, setProject] = useState<PlaymatProject>(() => createDefaultProject())
  const [past, setPast] = useState<PlaymatProject[]>([])
  const [future, setFuture] = useState<PlaymatProject[]>([])
  const [dirty, setDirty] = useState(false)
  const commit = useCallback((updater: (current: PlaymatProject) => PlaymatProject) => {
    setProject((current) => {
      const next = updater(current)
      if (next === current) return current
      setPast((items) => [...items.slice(-(HISTORY_LIMIT - 1)), current])
      setFuture([])
      setDirty(true)
      return next
    })
  }, [])

  const undo = useCallback(() => {
    setPast((items) => {
      if (!items.length) return items
      const previous = items[items.length - 1]
      setProject((current) => {
        setFuture((next) => [current, ...next].slice(0, HISTORY_LIMIT))
        return previous
      })
      setDirty(true)
      return items.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items
      const next = items[0]
      setProject((current) => {
        setPast((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), current])
        return next
      })
      setDirty(true)
      return items.slice(1)
    })
  }, [])

  return { project, setProject, past, setPast, future, setFuture, dirty, setDirty, commit, undo, redo }
}
