import { useEffect, useState } from 'react'

export function useLoadedImage(source: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!source) {
      setImage(null)
      return
    }
    const next = new window.Image()
    next.onload = () => setImage(next)
    next.src = source
    return () => {
      next.onload = null
    }
  }, [source])

  return image
}

