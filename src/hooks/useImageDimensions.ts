import { useEffect, useState } from 'react'
import { getImageDimensions } from '../utils/files'

export function useImageDimensions(source: string | null) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    let active = true
    if (!source) {
      setDimensions(null)
      return () => { active = false }
    }
    void getImageDimensions(source)
      .then((loaded) => { if (active) setDimensions(loaded) })
      .catch(() => { if (active) setDimensions(null) })
    return () => { active = false }
  }, [source])

  return dimensions
}
