"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { loadMapsLibrary } from "@/lib/maps"
import { cn } from "@/lib/utils"

interface DemoTrackingProps {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  className?: string
  onProgress?: (progress: number) => void
}

/**
 * Build a HIGH-RESOLUTION path from DirectionsResult by concatenating
 * every step's detailed path (not the simplified overview_path).
 * This follows actual road geometry — every curve, turn, and lane.
 */
function getDetailedPath(result: google.maps.DirectionsResult): google.maps.LatLng[] {
  const detailed: google.maps.LatLng[] = []
  const legs = result.routes[0].legs

  for (const leg of legs) {
    for (const step of leg.steps) {
      // step.path is already a decoded LatLng[] in the JS API
      // It contains the high-resolution road geometry for each maneuver
      for (let i = 0; i < step.path.length; i++) {
        // Skip duplicate points at step boundaries
        if (detailed.length > 0 && i === 0) {
          const last = detailed[detailed.length - 1]
          if (last.lat() === step.path[i].lat() && last.lng() === step.path[i].lng()) {
            continue
          }
        }
        detailed.push(step.path[i])
      }
    }
  }

  return detailed
}

/** Pre-compute cumulative distances along the path (meters) */
function buildDistanceTable(path: google.maps.LatLng[]): number[] {
  const cumulative = [0]
  for (let i = 1; i < path.length; i++) {
    const d = google.maps.geometry.spherical.computeDistanceBetween(path[i - 1], path[i])
    cumulative.push(cumulative[i - 1] + d)
  }
  return cumulative
}

/**
 * Get smooth interpolated position at a given progress (0–1) along the path.
 * Uses google.maps.geometry.spherical.interpolate for accurate geodesic interpolation.
 */
function getPositionAt(
  path: google.maps.LatLng[],
  cumDist: number[],
  progress: number
): { pos: google.maps.LatLng; segIndex: number } {
  const totalDist = cumDist[cumDist.length - 1]
  const target = Math.max(0, Math.min(1, progress)) * totalDist

  // Binary search for the right segment
  let lo = 0
  let hi = cumDist.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (cumDist[mid] <= target) lo = mid
    else hi = mid
  }

  const segLen = cumDist[hi] - cumDist[lo]
  const fraction = segLen > 0 ? (target - cumDist[lo]) / segLen : 0

  // Use spherical interpolation for geodesic accuracy
  const pos = google.maps.geometry.spherical.interpolate(path[lo], path[hi], fraction)

  return { pos, segIndex: lo }
}

/** Build the traveled sub-path (indigo portion) up to current progress */
function buildTraveledPath(
  path: google.maps.LatLng[],
  cumDist: number[],
  progress: number
): google.maps.LatLng[] {
  const totalDist = cumDist[cumDist.length - 1]
  const target = progress * totalDist
  const sub: google.maps.LatLng[] = []

  for (let i = 0; i < path.length; i++) {
    if (cumDist[i] <= target) {
      sub.push(path[i])
    } else {
      // Interpolate the final point precisely
      const prev = i - 1
      const segLen = cumDist[i] - cumDist[prev]
      const frac = segLen > 0 ? (target - cumDist[prev]) / segLen : 0
      sub.push(google.maps.geometry.spherical.interpolate(path[prev], path[i], frac))
      break
    }
  }

  return sub
}

export function DemoTracking({
  originLat,
  originLng,
  destLat,
  destLng,
  className,
  onProgress,
}: DemoTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const truckMarkerRef = useRef<google.maps.Marker | null>(null)
  const traveledPolyRef = useRef<google.maps.Polyline | null>(null)
  const animFrameRef = useRef<number>(0)
  const progressRef = useRef(0.30)

  const [error, setError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [stats, setStats] = useState({
    speed: 62,
    distanceRemaining: 0,
    etaMinutes: 0,
    totalDistanceKm: 0,
    progressPct: 30,
  })

  const isPausedRef = useRef(false)
  isPausedRef.current = isPaused

  const panToTruck = useCallback((pos: google.maps.LatLng) => {
    const map = mapInstanceRef.current
    if (!map) return
    map.panTo(pos)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    async function initMap() {
      try {
        const { Map: GoogleMap } = await loadMapsLibrary()
        if (cancelled || !mapRef.current) return

        const origin = { lat: originLat, lng: originLng }
        const dest = { lat: destLat, lng: destLng }

        const map = new GoogleMap(mapRef.current, {
          center: origin,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        })
        mapInstanceRef.current = map

        // ---- 1. Fetch REAL driving route ----
        const directionsService = new google.maps.DirectionsService()
        const result = await directionsService.route({
          origin,
          destination: dest,
          travelMode: google.maps.TravelMode.DRIVING,
        })

        if (cancelled) return
        const route = result.routes[0]
        if (!route) { setError(true); return }

        // ---- 2. Build HIGH-RES path from steps (not overview_path) ----
        const detailedPath = getDetailedPath(result)
        const cumDist = buildDistanceTable(detailedPath)
        const totalDistMeters = cumDist[cumDist.length - 1]
        const totalDistKm = totalDistMeters / 1000

        // ---- 3. Draw the full route (gray = upcoming) ----
        // Use the detailed path directly so the line is perfectly on the road
        new google.maps.Polyline({
          path: detailedPath,
          geodesic: true,
          strokeColor: "#d1d5db",
          strokeOpacity: 1,
          strokeWeight: 6,
          map,
          zIndex: 1,
        })

        // ---- 4. Traveled polyline (indigo, on top) ----
        const traveledPoly = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#4f46e5",
          strokeOpacity: 1,
          strokeWeight: 6,
          map,
          zIndex: 3,
        })
        traveledPolyRef.current = traveledPoly

        // ---- 5. Origin marker (green) ----
        new google.maps.Marker({
          map,
          position: origin,
          title: "Pickup: BGC, Taguig",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#059669",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 4,
        })

        // ---- 6. Destination marker (red) ----
        new google.maps.Marker({
          map,
          position: dest,
          title: "Delivery: Naga City",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 4,
        })

        // ---- 7. Truck marker (indigo circle with truck icon) ----
        const { pos: startPos } = getPositionAt(detailedPath, cumDist, progressRef.current)

        const truckIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" fill="#4f46e5" stroke="#ffffff" stroke-width="3"/>
          <g transform="translate(14,15) scale(1)" fill="#ffffff">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </g>
        </svg>`

        const truckMarker = new google.maps.Marker({
          map,
          position: startPos,
          title: "Juan Dela Cruz — 10-Wheeler",
          icon: {
            url: "data:image/svg+xml," + encodeURIComponent(truckIconSvg),
            scaledSize: new google.maps.Size(52, 52),
            anchor: new google.maps.Point(26, 26),
          },
          zIndex: 20,
        })
        truckMarkerRef.current = truckMarker

        // ---- 8. Initial state ----
        traveledPoly.setPath(buildTraveledPath(detailedPath, cumDist, progressRef.current))
        map.setCenter(startPos)
        map.setZoom(13)

        setStats({
          speed: 58 + Math.floor(Math.random() * 12),
          distanceRemaining: Math.round(totalDistKm * (1 - progressRef.current)),
          etaMinutes: Math.round((totalDistKm * (1 - progressRef.current)) / 65 * 60),
          totalDistanceKm: Math.round(totalDistKm),
          progressPct: Math.round(progressRef.current * 100),
        })
        setMapReady(true)

        // ---- 9. Animation loop ----
        let lastTime = performance.now()
        let frameCount = 0

        function animate(now: number) {
          if (cancelled) return
          const dt = now - lastTime
          lastTime = now

          if (!isPausedRef.current && progressRef.current < 1) {
            // Full route in ~120s for demo
            const step = dt / 1000 / 120
            progressRef.current = Math.min(1, progressRef.current + step)
            frameCount++

            const { pos } = getPositionAt(detailedPath, cumDist, progressRef.current)

            // Move truck every frame for smoothness
            truckMarkerRef.current?.setPosition(pos)

            // Update traveled polyline every 4 frames
            if (frameCount % 4 === 0) {
              traveledPoly.setPath(buildTraveledPath(detailedPath, cumDist, progressRef.current))
            }

            // Pan camera every 12 frames
            if (frameCount % 12 === 0) {
              panToTruck(pos)
            }

            // Update stats every 20 frames
            if (frameCount % 20 === 0) {
              const baseSpeed = 55 + Math.sin(now / 4000) * 12 + Math.random() * 8
              const remaining = totalDistKm * (1 - progressRef.current)

              setStats({
                speed: Math.round(baseSpeed),
                distanceRemaining: Math.round(remaining * 10) / 10,
                etaMinutes: Math.round((remaining / baseSpeed) * 60),
                totalDistanceKm: Math.round(totalDistKm),
                progressPct: Math.round(progressRef.current * 100),
              })
            }

            onProgress?.(progressRef.current)
          }

          animFrameRef.current = requestAnimationFrame(animate)
        }

        animFrameRef.current = requestAnimationFrame(animate)
      } catch (err) {
        console.error("Failed to load map:", err)
        if (!cancelled) setError(true)
      }
    }

    initMap()

    return () => {
      cancelled = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [originLat, originLng, destLat, destLng, panToTruck, onProgress])

  if (error) {
    return (
      <div className={cn("rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-8", className)}>
        <MapPinIcon className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">Live tracking map could not be loaded</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {/* Stats bar */}
      {mapReady && (
        <div className="flex items-center justify-between rounded-t-lg bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400">LIVE</span>
            </div>
            <div className="text-sm text-white font-semibold">{stats.speed} km/h</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{stats.distanceRemaining} km left</span>
            <span className="text-white font-medium">
              ETA{" "}
              {stats.etaMinutes > 60
                ? `${Math.floor(stats.etaMinutes / 60)}h ${stats.etaMinutes % 60}m`
                : `${stats.etaMinutes}m`}
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className={cn(
          "min-h-[450px] border-x border-gray-200",
          mapReady ? "" : "rounded-lg border"
        )}
      />

      {/* Progress bar + controls */}
      {mapReady && (
        <div className="rounded-b-lg bg-white border-x border-b border-gray-200 px-4 py-3 space-y-2">
          <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500">BGC, Taguig</span>
            </div>
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {isPaused ? (
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Naga City</span>
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
