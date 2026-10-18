"use client"

import { useState, useEffect, use } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import {
  StarIcon,
  TruckIcon,
  BookmarkIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"
import {
  StarIcon as StarSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from "@heroicons/react/24/solid"
import Link from "next/link"
import { timeAgo } from "@/lib/utils"

interface CarrierDetail {
  id: string
  userId: string
  name: string | null
  image: string | null
  memberSince: string
  avgRating: number
  ratingBreakdown: {
    onTime: number
    cargoCare: number
    communication: number
    professionalism: number
  }
  reviewCount: number
  completedTrips: number
  experienceTags: string[]
  preferredRegions: string[]
  ltfrbAccreditation: string | null
  isAvailable: boolean
  isSaved: boolean
  trucks: {
    id: string
    plateNumber: string
    truckType: string
    capacityTons: number
    lengthFt: number | null
    widthFt: number | null
    heightFt: number | null
    photoUrl: string | null
    isVerified: boolean
  }[]
  reviews: {
    id: string
    reviewerName: string | null
    reviewerImage: string | null
    overallRating: number
    comment: string | null
    response: string | null
    route: string | null
    createdAt: string
  }[]
}

const TRUCK_TYPE_LABELS: Record<string, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

function RatingStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.round(rating) ? (
            <StarSolidIcon className={`${cls} text-amber-400`} />
          ) : (
            <StarIcon className={`${cls} text-warm-200`} />
          )}
        </span>
      ))}
    </div>
  )
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-warm-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-warm-600 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

export default function CarrierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { toast } = useToast()
  const [carrier, setCarrier] = useState<CarrierDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    async function fetchCarrier() {
      try {
        const res = await fetch(`/api/carriers/${id}`)
        const json = await res.json()
        if (json.success) {
          setCarrier(json.data)
          setIsSaved(json.data.isSaved)
        } else {
          toast("error", "Carrier not found")
        }
      } catch {
        toast("error", "Failed to load carrier profile")
      } finally {
        setLoading(false)
      }
    }
    fetchCarrier()
  }, [id, toast])

  async function handleToggleSave() {
    if (!carrier) return
    setSavingBookmark(true)
    try {
      if (isSaved) {
        const res = await fetch(`/api/saved-carriers?carrierId=${carrier.userId}`, {
          method: "DELETE",
        })
        const json = await res.json()
        if (json.success) {
          setIsSaved(false)
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
          setIsSaved(true)
          toast("success", "Carrier saved")
        }
      }
    } catch {
      toast("error", "Failed to update saved carriers")
    } finally {
      setSavingBookmark(false)
    }
  }

  async function handleInviteToBid() {
    setInviting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    toast("success", `Bid invitation sent to ${carrier?.name || "carrier"}`)
    setInviting(false)
  }

  if (loading) return <PageLoading />

  if (!carrier) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-warm-400">Carrier not found</p>
        <Link
          href="/shipper/carriers"
          className="text-indigo-600 text-sm mt-2 inline-block hover:underline"
        >
          Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10 space-y-6">
      {/* Back link */}
      <Link
        href="/shipper/carriers"
        className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to search
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-indigo-500">
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

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-warm-800">
                    {carrier.name || "Unknown Carrier"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={carrier.avgRating} />
                    <span className="text-sm text-warm-400">
                      {carrier.avgRating} ({carrier.reviewCount} review
                      {carrier.reviewCount !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>
                <Badge variant={carrier.isAvailable ? "confirmed" : "default"}>
                  {carrier.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-warm-400">
                <span className="flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" />
                  {carrier.completedTrips} completed trips
                </span>
                {carrier.ltfrbAccreditation && (
                  <span className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                    LTFRB Accredited
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4" />
                  Member since{" "}
                  {new Date(carrier.memberSince).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button onClick={handleInviteToBid} isLoading={inviting}>
                  Invite to Bid
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleToggleSave}
                  isLoading={savingBookmark}
                >
                  {isSaved ? (
                    <BookmarkSolidIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                  ) : (
                    <BookmarkIcon className="h-4 w-4 mr-1.5" />
                  )}
                  {isSaved ? "Saved" : "Save Carrier"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Tags */}
      {carrier.experienceTags.length > 0 && (
        <Card>
          <CardTitle>Specializations</CardTitle>
          <CardContent className="mt-3">
            <div className="flex flex-wrap gap-2">
              {carrier.experienceTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm bg-indigo-600-50 text-indigo-500 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferred Regions */}
      {carrier.preferredRegions.length > 0 && (
        <Card>
          <CardTitle>Service Regions</CardTitle>
          <CardContent className="mt-3">
            <div className="flex flex-wrap gap-2">
              {carrier.preferredRegions.map((region) => (
                <span
                  key={region}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-warm-100 text-warm-600"
                >
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {region}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Breakdown */}
      <Card>
        <CardTitle>Rating Summary</CardTitle>
        <CardContent className="mt-4 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display text-3xl font-bold text-warm-800">
              {carrier.avgRating.toFixed(1)}
            </span>
            <div>
              <RatingStars rating={carrier.avgRating} />
              <p className="text-xs text-warm-400 mt-0.5">
                {carrier.reviewCount} review{carrier.reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <RatingBar label="On-Time" value={carrier.ratingBreakdown.onTime} />
          <RatingBar label="Cargo Care" value={carrier.ratingBreakdown.cargoCare} />
          <RatingBar
            label="Communication"
            value={carrier.ratingBreakdown.communication}
          />
          <RatingBar
            label="Professionalism"
            value={carrier.ratingBreakdown.professionalism}
          />
        </CardContent>
      </Card>

      {/* Truck Fleet */}
      <Card>
        <CardTitle>Truck Fleet</CardTitle>
        <CardContent className="mt-4">
          {carrier.trucks.length === 0 ? (
            <p className="text-sm text-warm-300 text-center py-4">
              No trucks listed
            </p>
          ) : (
            <div className="space-y-3">
              {carrier.trucks.map((truck) => (
                <div
                  key={truck.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-warm-100"
                >
                  <div className="h-10 w-10 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                    <TruckIcon className="h-5 w-5 text-warm-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-warm-800">
                        {TRUCK_TYPE_LABELS[truck.truckType] || truck.truckType}
                      </span>
                      {truck.isVerified && (
                        <Badge variant="confirmed">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-warm-400 mt-0.5">
                      <span>{truck.plateNumber}</span>
                      <span>{truck.capacityTons} tons</span>
                      {truck.lengthFt && (
                        <span>
                          {truck.lengthFt}L x {truck.widthFt}W x {truck.heightFt}H ft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardTitle>Recent Reviews</CardTitle>
        <CardContent className="mt-4">
          {carrier.reviews.length === 0 ? (
            <p className="text-sm text-warm-300 text-center py-6">
              No reviews yet
            </p>
          ) : (
            <div className="space-y-4">
              {carrier.reviews.map((review) => (
                <div
                  key={review.id}
                  className="pb-4 border-b border-warm-100 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-warm-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-warm-500">
                          {review.reviewerName
                            ? review.reviewerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-warm-800">
                          {review.reviewerName || "Anonymous"}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <RatingStars rating={review.overallRating} size="sm" />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-warm-300 shrink-0">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>

                  {review.route && (
                    <p className="text-xs text-warm-300 mt-2 flex items-center gap-1">
                      <MapPinIcon className="h-3 w-3" />
                      {review.route}
                    </p>
                  )}

                  {review.comment && (
                    <p className="text-sm text-warm-500 mt-2">{review.comment}</p>
                  )}

                  {review.response && (
                    <div className="mt-2 ml-4 p-3 bg-surface rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <ChatBubbleLeftIcon className="h-3.5 w-3.5 text-warm-300" />
                        <span className="text-xs font-medium text-warm-400">
                          Carrier response
                        </span>
                      </div>
                      <p className="text-sm text-warm-500">{review.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
