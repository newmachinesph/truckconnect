"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  StarIcon,
  TruckIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"
import {
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid"
import Link from "next/link"

interface Carrier {
  id: string
  userId: string
  name: string | null
  image: string | null
  avgRating: number
  reviewCount: number
  completedTrips: number
  experienceTags: string[]
  preferredRegions: string[]
  isAvailable: boolean
  trucks: {
    id: string
    truckType: string
    capacityTons: number
    plateNumber: string
  }[]
}

const TRUCK_TYPE_OPTIONS = [
  { value: "", label: "All Truck Types" },
  { value: "FOUR_WHEELER", label: "4-Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "6-Wheeler (Open)" },
  { value: "SIX_WHEELER_CLOSED", label: "6-Wheeler (Closed)" },
  { value: "TEN_WHEELER", label: "10-Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

const RATING_OPTIONS = [
  { value: "", label: "Any Rating" },
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.0", label: "4.0+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
  { value: "3.0", label: "3.0+ Stars" },
]

const TRIPS_OPTIONS = [
  { value: "", label: "Any Experience" },
  { value: "100", label: "100+ Trips" },
  { value: "50", label: "50+ Trips" },
  { value: "20", label: "20+ Trips" },
  { value: "10", label: "10+ Trips" },
]

const EXPERIENCE_TAG_OPTIONS = [
  { value: "", label: "All Specializations" },
  { value: "Frozen Goods", label: "Frozen Goods" },
  { value: "Hazardous Materials", label: "Hazardous Materials" },
  { value: "Oversized Cargo", label: "Oversized Cargo" },
  { value: "Fragile Items", label: "Fragile Items" },
  { value: "FMCG", label: "FMCG" },
  { value: "Electronics", label: "Electronics" },
  { value: "Construction Materials", label: "Construction Materials" },
  { value: "Agricultural Products", label: "Agricultural Products" },
]

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

export default function CarrierSearchPage() {
  const { toast } = useToast()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [loading, setLoading] = useState(true)
  const [savedCarrierIds, setSavedCarrierIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [truckType, setTruckType] = useState("")
  const [minRating, setMinRating] = useState("")
  const [minTrips, setMinTrips] = useState("")
  const [experienceTag, setExperienceTag] = useState("")

  const fetchCarriers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (truckType) params.set("truckType", truckType)
      if (minRating) params.set("minRating", minRating)
      if (minTrips) params.set("minTrips", minTrips)
      if (experienceTag) params.set("experienceTag", experienceTag)

      const res = await fetch(`/api/carriers?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setCarriers(json.data)
      }
    } catch {
      toast("error", "Failed to load carriers")
    } finally {
      setLoading(false)
    }
  }, [search, truckType, minRating, minTrips, experienceTag, toast])

  useEffect(() => {
    fetchCarriers()
  }, [fetchCarriers])

  useEffect(() => {
    async function fetchSaved() {
      try {
        const res = await fetch("/api/saved-carriers")
        const json = await res.json()
        if (json.success) {
          const ids = new Set<string>(json.data.map((s: { userId: string }) => s.userId))
          setSavedCarrierIds(ids)
        }
      } catch {
        // Silent fail for saved carriers
      }
    }
    fetchSaved()
  }, [])

  async function handleSaveCarrier(carrier: Carrier) {
    setSavingId(carrier.userId)
    const isSaved = savedCarrierIds.has(carrier.userId)

    try {
      if (isSaved) {
        const res = await fetch(`/api/saved-carriers?carrierId=${carrier.userId}`, {
          method: "DELETE",
        })
        const json = await res.json()
        if (json.success) {
          setSavedCarrierIds((prev) => {
            const next = new Set(prev)
            next.delete(carrier.userId)
            return next
          })
          toast("success", "Carrier removed from saved")
        }
      } else {
        const res = await fetch("/api/saved-carriers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carrierId: carrier.userId }),
        })
        const json = await res.json()
        if (json.success) {
          setSavedCarrierIds((prev) => new Set(prev).add(carrier.userId))
          toast("success", "Carrier saved")
        }
      }
    } catch {
      toast("error", "Failed to update saved carriers")
    } finally {
      setSavingId(null)
    }
  }

  async function handleInviteToBid(carrier: Carrier) {
    setInvitingId(carrier.userId)
    // Simulate invite
    await new Promise((resolve) => setTimeout(resolve, 800))
    toast("success", `Bid invitation sent to ${carrier.name || "carrier"}`)
    setInvitingId(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:font-display text-2xl font-bold text-warm-800">
          Find Carriers
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FunnelIcon className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search carriers by name..."
          className="block w-full rounded-lg border border-warm-200 pl-10 pr-4 py-2.5 text-sm placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Truck Type"
              value={truckType}
              onChange={setTruckType}
              options={TRUCK_TYPE_OPTIONS}
            />
            <Select
              label="Min. Rating"
              value={minRating}
              onChange={setMinRating}
              options={RATING_OPTIONS}
            />
            <Select
              label="Min. Trips"
              value={minTrips}
              onChange={setMinTrips}
              options={TRIPS_OPTIONS}
            />
            <Select
              label="Specialization"
              value={experienceTag}
              onChange={setExperienceTag}
              options={EXPERIENCE_TAG_OPTIONS}
            />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <PageLoading />
      ) : carriers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TruckIcon className="h-12 w-12 text-warm-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-warm-800">No carriers found</p>
            <p className="text-sm text-warm-300 mt-1">
              Try adjusting your filters or search term
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-warm-400">
            {carriers.length} carrier{carriers.length !== 1 ? "s" : ""} found
          </p>
          {carriers.map((carrier) => {
            const isSaved = savedCarrierIds.has(carrier.userId)
            return (
              <Card key={carrier.id} className="hover:shadow-md transition-shadow">
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
                              {carrier.avgRating} ({carrier.reviewCount} review
                              {carrier.reviewCount !== 1 ? "s" : ""})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-warm-400">
                        <span className="flex items-center gap-1">
                          <TruckIcon className="h-3.5 w-3.5" />
                          {carrier.completedTrips} trips
                        </span>
                        {carrier.trucks.map((truck) => (
                          <Badge key={truck.id} variant="default">
                            {TRUCK_TYPE_LABELS[truck.truckType] || truck.truckType}{" "}
                            ({truck.capacityTons}t)
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
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleSaveCarrier(carrier)}
                        disabled={savingId === carrier.userId}
                        className="p-2 rounded-lg hover:bg-warm-100 transition-colors disabled:opacity-50"
                        title={isSaved ? "Remove from saved" : "Save carrier"}
                      >
                        {isSaved ? (
                          <BookmarkSolidIcon className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5 text-warm-300" />
                        )}
                      </button>
                      <Button
                        size="sm"
                        onClick={() => handleInviteToBid(carrier)}
                        isLoading={invitingId === carrier.userId}
                      >
                        Invite to Bid
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
