"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { BidCard } from "@/components/bids/BidCard"
import { RouteMap } from "@/components/maps/RouteMap"
import { formatPeso, formatDateTime } from "@/lib/utils"

interface LoadBid {
  id: string
  proposedRate: number
  comments: string | null
  status: string
  counterRate: number | null
  counterNote: string | null
  createdAt: string
  trucker: {
    completedTrips: number
    user: { name: string | null; image: string | null }
    trucks: { truckType: string; plateNumber: string; capacityTons: number }[]
  }
}

interface LoadDetail {
  id: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  cargoType: string
  weightTons: number
  preferredTruck: string | null
  pickupDate: string
  rateEstimate: number | null
  maxBudget: number | null
  status: string
  biddingDeadline: string | null
  createdAt: string
}

export default function ShipperLoadDetailPage() {
  const params = useParams()
  const loadId = params.id as string
  const [load, setLoad] = useState<LoadDetail | null>(null)
  const [bids, setBids] = useState<LoadBid[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [loadRes, bidsRes] = await Promise.all([
        fetch(`/api/loads/${loadId}`),
        fetch(`/api/loads/${loadId}/bids`),
      ])
      const loadData = await loadRes.json()
      const bidsData = await bidsRes.json()
      if (loadData.success || loadData.data) setLoad(loadData.data || loadData)
      if (bidsData.success) setBids(bidsData.data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [loadId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!load) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card className="p-8 text-center">
          <p className="text-warm-400">Load not found.</p>
        </Card>
      </div>
    )
  }

  const pendingBids = bids.filter((b) => b.status === "PENDING" || b.status === "COUNTERED")
  const otherBids = bids.filter((b) => b.status !== "PENDING" && b.status !== "COUNTERED")

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-1">Load Details</h1>
      <p className="text-sm text-warm-400 mb-6">#{loadId.slice(0, 8)}</p>

      <div className="space-y-6">
        {/* Load Info */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Shipment Info</CardTitle>
            <Badge variant={getStatusVariant(load.status)}>
              {load.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase">Origin</p>
                <p className="mt-0.5 text-sm font-medium text-warm-800">{load.originAddress}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase">Destination</p>
                <p className="mt-0.5 text-sm font-medium text-warm-800">{load.destAddress}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase">Cargo</p>
                <p className="mt-0.5 text-sm text-warm-600">{load.cargoType} · {load.weightTons}T</p>
              </div>
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase">Pickup Date</p>
                <p className="mt-0.5 text-sm text-warm-600">{formatDateTime(load.pickupDate)}</p>
              </div>
              {load.rateEstimate && (
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Rate Estimate</p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-600">{formatPeso(load.rateEstimate)}</p>
                </div>
              )}
              {load.maxBudget && (
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Budget</p>
                  <p className="mt-0.5 text-sm text-warm-600">{formatPeso(load.maxBudget)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Map */}
        {load.originLat && load.destLat && (
          <Card>
            <CardTitle className="mb-4">Route</CardTitle>
            <CardContent>
              <RouteMap
                originLat={load.originLat}
                originLng={load.originLng}
                destLat={load.destLat}
                destLng={load.destLng}
                className="h-[300px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Active Bids */}
        <Card>
          <CardTitle className="mb-4">
            Active Bids ({pendingBids.length})
          </CardTitle>
          <CardContent>
            {pendingBids.length === 0 ? (
              <p className="text-center text-sm text-warm-300 py-6">
                {load.status === "OPEN" ? "No bids yet. Truckers will start bidding soon." : "No active bids."}
              </p>
            ) : (
              <div className="space-y-3">
                {pendingBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} isShipperView onAction={fetchData} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Bids */}
        {otherBids.length > 0 && (
          <Card>
            <CardTitle className="mb-4">Past Bids ({otherBids.length})</CardTitle>
            <CardContent>
              <div className="space-y-3">
                {otherBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} isShipperView />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
