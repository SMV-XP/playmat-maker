/// <reference types="vite/client" />

interface Window {
  playmat?: {
    openBackground: () => Promise<{ name: string; dataUrl: string } | null>
    openLogo: () => Promise<{ name: string; dataUrl: string } | null>
    openProject: () => Promise<{ name: string; content: string } | null>
    saveProject: (payload: {
      content: string
      suggestedName: string
    }) => Promise<{ filePath: string; name: string } | null>
    exportImage: (payload: {
      dataUrl: string
      format: 'png' | 'jpeg'
      suggestedName: string
    }) => Promise<{ filePath: string; name: string } | null>
  }
}
