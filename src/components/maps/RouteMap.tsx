"use client"

import { useEffect, useRef, useState } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { loadMapsLibrary } from "@/lib/maps"
import { cn } from "@/lib/utils"

interface RouteMapProps {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  className?: string
}

export function RouteMap({ originLat, originLng, destLat, destLng, className }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [error, setError] = useState(false)

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
          disableDefaultUI: true,
          zoomControl: true,
        })

        const bounds = new google.maps.LatLngBounds()
        bounds.extend(origin)
        bounds.extend(dest)
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 })
        mapInstanceRef.current = map

        // Origin marker (green)
        new google.maps.Marker({
          map,
          position: origin,
          title: "Origin",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#059669",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        // Destination marker (red)
        new google.maps.Marker({
          map,
          position: dest,
          title: "Destination",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        // Draw route polyline
        new google.maps.Polyline({
          path: [origin, dest],
          geodesic: true,
          strokeColor: "#059669",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
        })
      } catch (err) {
        console.error("Failed to load Google Maps:", err)
        if (!cancelled) setError(true)
      }
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [originLat, originLng, destLat, destLng])

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-warm-200 bg-surface flex flex-col items-center justify-center p-8",
          className
        )}
      >
        <MapPinIcon className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-warm-400">Map could not be loaded</p>
        <p className="text-xs text-warm-300 mt-1">
          {originLat.toFixed(4)}, {originLng.toFixed(4)} &rarr; {destLat.toFixed(4)},{" "}
          {destLng.toFixed(4)}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className={cn("rounded-lg border border-warm-200 min-h-[300px]", className)}
    />
  )
}
