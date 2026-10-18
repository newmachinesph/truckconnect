"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { BidForm } from "@/components/bids/BidForm"
import { RouteMap } from "@/components/maps/RouteMap"
import { formatPeso, formatDateTime } from "@/lib/utils"

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
  lengthFt: number | null
  widthFt: number | null
  heightFt: number | null
  preferredTruck: string | null
  pickupDate: string
  rateEstimate: number | null
  distanceKm: number | null
  maxBudget: number | null
  status: string
  specialHandling: string[]
  biddingDeadline: string | null
  createdAt: string
  shipperProfile: {
    businessName: string
    user: { name: string | null }
  }
}

export default function TruckerLoadDetailPage() {
  const params = useParams()
  const loadId = params.id as string
  const [load, setLoad] = useState<LoadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLoad() {
      try {
        const res = await fetch(`/api/loads/${loadId}`)
        const data = await res.json()
        setLoad(data.data || data)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchLoad()
  }, [loadId])

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-1">Load Details</h1>
      <p className="text-sm text-warm-400 mb-6">
        Posted by {load.shipperProfile?.businessName ?? "Shipper"}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Load Info */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Shipment Details</CardTitle>
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
                  <p className="mt-0.5 text-sm text-warm-600">{load.cargoType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Weight</p>
                  <p className="mt-0.5 text-sm text-warm-600">{load.weightTons} tons</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Preferred Truck</p>
                  <p className="mt-0.5 text-sm text-warm-600">
                    {load.preferredTruck?.replace(/_/g, " ") ?? "Any"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Pickup Date</p>
                  <p className="mt-0.5 text-sm text-warm-600">{formatDateTime(load.pickupDate)}</p>
                </div>
                {load.distanceKm && (
                  <div>
                    <p className="text-xs font-medium text-warm-300 uppercase">Distance</p>
                    <p className="mt-0.5 text-sm text-warm-600">{load.distanceKm.toFixed(0)} km</p>
                  </div>
                )}
                {load.rateEstimate && (
                  <div>
                    <p className="text-xs font-medium text-warm-300 uppercase">Estimated Rate</p>
                    <p className="mt-0.5 text-sm font-semibold text-indigo-600">{formatPeso(load.rateEstimate)}</p>
                  </div>
                )}
              </div>

              {load.specialHandling.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-warm-300 uppercase mb-2">Special Handling</p>
                  <div className="flex flex-wrap gap-2">
                    {load.specialHandling.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {load.biddingDeadline && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs text-amber-700">
                    Bidding closes: {formatDateTime(load.biddingDeadline)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Route Map */}
        {load.originLat && load.destLat && (
          <div className="lg:col-span-2">
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
          </div>
        )}

        {/* Bid Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardTitle className="mb-4">Place Your Bid</CardTitle>
            <CardContent>
              {load.status === "OPEN" ? (
                <BidForm
                  loadId={loadId}
                  rateEstimate={load.rateEstimate}
                  maxBudget={load.maxBudget}
                />
              ) : (
                <p className="text-sm text-warm-300 text-center py-4">
                  This load is no longer accepting bids.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
