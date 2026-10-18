"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import {
  StarIcon,
  TruckIcon,
  BookmarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"
import Link from "next/link"

interface SavedCarrier {
  savedId: string
  id: string
  userId: string
  name: string | null
  image: string | null
  avgRating: number
  reviewCount: number
  completedTrips: number
  experienceTags: string[]
  isAvailable: boolean
  trucks: {
    id: string
    truckType: string
    capacityTons: number
  }[]
  savedAt: string
  notes: string | null
}

const TRUCK_TYPE_LABELS: Record<string, string> = {
  FOUR_WHEELER: "4W",
  SIX_WHEELER_OPEN: "6W Open",
  SIX_WHEELER_CLOSED: "6W Closed",
  TEN_WHEELER: "10W",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.round(rating) ? (
            <StarSolidIcon className="h-4 w-4 text-amber-400" />
          ) : (
            <StarIcon className="h-4 w-4 text-warm-200" />
          )}
        </span>
      ))}
    </div>
  )
}

export default function SavedCarriersPage() {
  const { toast } = useToast()
  const [carriers, setCarriers] = useState<SavedCarrier[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSaved() {
      try {
        const res = await fetch("/api/saved-carriers")
        const json = await res.json()
        if (json.success) {
          setCarriers(json.data)
        }
      } catch {
        toast("error", "Failed to load saved carriers")
      } finally {
        setLoading(false)
      }
    }
    fetchSaved()
  }, [toast])

  async function handleRemove(carrier: SavedCarrier) {
    setRemovingId(carrier.userId)
    try {
      const res = await fetch(`/api/saved-carriers?carrierId=${carrier.userId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        setCarriers((prev) => prev.filter((c) => c.userId !== carrier.userId))
        toast("success", `${carrier.name || "Carrier"} removed from saved`)
      } else {
        toast("error", "Failed to remove carrier")
      }
    } catch {
      toast("error", "Failed to remove carrier")
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <PageLoading />

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:font-display text-2xl font-bold text-warm-800">
          Saved Carriers
        </h1>
        <Link href="/shipper/carriers">
          <Button variant="secondary" size="sm">
            Find More Carriers
          </Button>
        </Link>
      </div>

      {carriers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookmarkIcon className="h-12 w-12 text-warm-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-warm-800">No saved carriers</p>
            <p className="text-sm text-warm-300 mt-1">
              Save carriers you work with frequently for quick access
            </p>
            <Link href="/shipper/carriers">
              <Button size="sm" className="mt-4">
                Browse Carriers
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-warm-400">
            {carriers.length} saved carrier{carriers.length !== 1 ? "s" : ""}
          </p>
          {carriers.map((carrier) => (
            <Card key={carrier.savedId || carrier.id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-indigo-500">
                          {carrier.name
                            ? carrier.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </span>
                      </div>
                      <div>
                        <Link
                          href={`/shipper/carriers/${carrier.id}`}
                          className="text-sm font-semibold text-warm-800 hover:text-indigo-600 transition-colors"
                        >
                          {carrier.name || "Unknown Carrier"}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RatingStars rating={carrier.avgRating} />
                          <span className="text-xs text-warm-400">
                            {carrier.avgRating} ({carrier.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-warm-400">
                      <span className="flex items-center gap-1">
                        <TruckIcon className="h-3.5 w-3.5" />
                        {carrier.completedTrips} trips
                      </span>
                      <Badge
                        variant={carrier.isAvailable ? "confirmed" : "default"}
                      >
                        {carrier.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                      {carrier.trucks.map((truck) => (
                        <Badge key={truck.id} variant="default">
                          {TRUCK_TYPE_LABELS[truck.truckType] || truck.truckType}
                        </Badge>
                      ))}
                    </div>

                    {carrier.experienceTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {carrier.experienceTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-indigo-600-50 text-indigo-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {carrier.savedAt && (
                      <p className="text-xs text-warm-300 mt-2">
                        Saved{" "}
                        {new Date(carrier.savedAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/shipper/carriers/${carrier.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(carrier)}
                      isLoading={removingId === carrier.userId}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
