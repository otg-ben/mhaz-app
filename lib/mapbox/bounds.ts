// Geographic constraints for MHAZ — centered on Marin County with spillover
// to southern Sonoma (Petaluma OK). Excludes East Bay, Santa Cruz, Mendocino.

export const MAP_CENTER: [number, number] = [-122.5311, 37.9735] // San Rafael
export const MAP_DEFAULT_ZOOM = 11
export const MAP_MIN_ZOOM = 9
export const MAP_MAX_ZOOM = 18

// Loose viewport bounds — what users can pan to
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-123.3, 37.65], // SW: Pacific coast south of Muir Beach
  [-122.2, 38.55], // NE: north of Petaluma
]

// Strict pin-drop bounds — where alerts can be placed
// Excludes East Bay (lng > -122.35 is east of bay), Mendocino (lat > 38.50),
// and anything too far south (lat < 37.75 is SF proper / south)
export const ALERT_BOUNDS = {
  minLat: 37.75,
  maxLat: 38.50,
  minLng: -123.15,
  maxLng: -122.35,
} as const

export function isInValidRegion(lat: number, lng: number): boolean {
  return (
    lat >= ALERT_BOUNDS.minLat &&
    lat <= ALERT_BOUNDS.maxLat &&
    lng >= ALERT_BOUNDS.minLng &&
    lng <= ALERT_BOUNDS.maxLng
  )
}

export function formatCoords(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lngStr}`
}
