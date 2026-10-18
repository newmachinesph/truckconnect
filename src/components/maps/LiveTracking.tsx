"use client"

import { useEffect, useRef, useState } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { loadMapsLibrary } from "@/lib/maps"
import { cn, timeAgo } from "@/lib/utils"

interface LiveTrackingProps {
  bookingId: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  className?: string
}

interface TrackingUpdate {
  lat: number
  lng: number
  timestamp: string
}

export function LiveTracking({
  bookingId,
  originLat,
  originLng,
  destLat,
  destLng,
  className,
}: LiveTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const truckerMarkerRef = useRef<google.maps.Marker | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Initialize map
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

        // Trucker marker (blue, will be updated via SSE)
        const truckerMarker = new google.maps.Marker({
          map,
          position: origin, // start at origin
          title: "Trucker",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        truckerMarkerRef.current = truckerMarker
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

  // Subscribe to SSE for tracking updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/tracking/${bookingId}/stream`)

    eventSource.onmessage = (event) => {
      try {
        const update: TrackingUpdate = JSON.parse(event.data)

        // Update trucker marker position
        if (truckerMarkerRef.current) {
          truckerMarkerRef.current.setPosition({ lat: update.lat, lng: update.lng })
        }

        setLastUpdate(update.timestamp)
      } catch (err) {
        console.error("Failed to parse tracking update:", err)
      }
    }

    eventSource.onerror = () => {
      // SSE will auto-reconnect
      console.warn("Tracking SSE connection lost, reconnecting...")
    }

    return () => {
      eventSource.close()
    }
  }, [bookingId])

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-warm-200 bg-surface flex flex-col items-center justify-center p-8",
          className
        )}
      >
        <MapPinIcon className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-warm-400">Live tracking map could not be loaded</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={mapRef}
        className="rounded-lg border border-warm-200 min-h-[400px]"
      />
      {lastUpdate && (
        <p className="text-xs text-warm-300 text-right">
          Last updated: {timeAgo(lastUpdate)}
        </p>
      )}
    </div>
  )
}
