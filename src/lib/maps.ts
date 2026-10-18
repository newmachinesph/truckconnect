import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

let initialized = false

export function initMapsApi() {
  if (!initialized) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
      libraries: ["places", "geometry"],
    })
    initialized = true
  }
}

export async function loadPlacesLibrary() {
  initMapsApi()
  return importLibrary("places")
}

export async function loadMapsLibrary() {
  initMapsApi()
  return importLibrary("maps")
}

export async function loadGeometryLibrary() {
  initMapsApi()
  return importLibrary("geometry")
}

// Server-side distance calculation using Google Distance Matrix API
export async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distanceKm: number; durationMinutes: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}&units=metric`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== "OK" || !data.rows[0]?.elements[0]) {
    throw new Error("Failed to calculate distance")
  }

  const element = data.rows[0].elements[0]
  if (element.status !== "OK") {
    throw new Error(`Distance calculation failed: ${element.status}`)
  }

  return {
    distanceKm: Math.round(element.distance.value / 1000 * 10) / 10,
    durationMinutes: Math.round(element.duration.value / 60),
  }
}
