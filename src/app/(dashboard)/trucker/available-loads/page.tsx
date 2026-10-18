"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatPeso, timeAgo } from "@/lib/utils"
import type { Load } from "@/types"

const truckTypeOptions = [
  { value: "", label: "All Truck Types" },
  { value: "FOUR_WHEELER", label: "Four Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "Six Wheeler Open" },
  { value: "SIX_WHEELER_CLOSED", label: "Six Wheeler Closed" },
  { value: "TEN_WHEELER", label: "Ten Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

export default function AvailableLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [truckTypeFilter, setTruckTypeFilter] = useState("")
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchLoads()

    // Set up SSE for real-time updates
    try {
      const es = new EventSource("/api/loads/stream")
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "NEW_LOAD") {
            setLoads((prev) => [data.load, ...prev])
          } else if (data.type === "LOAD_ACCEPTED") {
            setLoads((prev) => prev.filter((l) => l.id !== data.loadId))
          }
        } catch {
          // Ignore parse errors
        }
      }

      es.onerror = () => {
        es.close()
      }
    } catch {
      // SSE not available, fall back to polling
    }

    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  async function fetchLoads() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/loads?status=OPEN")
      const data = await res.json()
      setLoads(data.data || data || [])
    } catch {
      setLoads([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAccept(loadId: string) {
    setAcceptingId(loadId)
    try {
      const res = await fetch(`/api/loads/${loadId}/accept`, {
        method: "POST",
      })
      if (res.ok) {
        setLoads((prev) => prev.filter((l) => l.id !== loadId))
      }
    } catch {
      // Handle error silently
    } finally {
      setAcceptingId(null)
    }
  }

  const filteredLoads = loads.filter((load) => {
    const matchesCity =
      !searchCity ||
      load.originAddress?.toLowerCase().includes(searchCity.toLowerCase()) ||
      load.destAddress?.toLowerCase().includes(searchCity.toLowerCase())
    const matchesTruck = !truckTypeFilter || load.preferredTruck === truckTypeFilter
    return matchesCity && matchesTruck
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-6">Available Loads</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="Search by city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <Select
            value={truckTypeFilter}
            onChange={setTruckTypeFilter}
            options={truckTypeOptions}
            placeholder="All Truck Types"
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={fetchLoads} className="w-full sm:w-auto">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Load List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredLoads.length === 0 ? (
        <EmptyState
          title="No available loads"
          description="There are no loads matching your filters right now. Try adjusting your search or check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLoads.map((load) => (
            <Card key={load.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-warm-800">
                      {load.originAddress} &rarr; {load.destAddress}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {load.preferredTruck?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(load.status)}>
                    {load.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-warm-400 mb-4">
                  {load.weightTons && <p>Weight: {load.weightTons} tons</p>}
                  {load.distanceKm && <p>Distance: {load.distanceKm.toFixed(0)} km</p>}
                  {load.cargoType && (
                    <p className="truncate">Cargo: {load.cargoType}</p>
                  )}
                  <p>{timeAgo(load.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-warm-100">
                <p className="text-lg font-bold text-indigo-600">
                  {formatPeso(load.rateEstimate ?? 0)}
                </p>
                <Button
                  size="sm"
                  onClick={() => handleAccept(load.id)}
                  isLoading={acceptingId === load.id}
                >
                  Accept
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
