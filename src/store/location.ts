import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Coords {
  lat: number
  lng: number
}

interface LocationStore {
  coords: Coords | null
  setCoords: (coords: Coords) => void
  clearCoords: () => void
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      coords: null,
      setCoords: (coords) => set({ coords }),
      clearCoords: () => set({ coords: null }),
    }),
    { name: 'rd-location' }
  )
)
