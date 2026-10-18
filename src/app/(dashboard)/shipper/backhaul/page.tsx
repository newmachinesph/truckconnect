"use client"

import { useEffect, useState } from "react"
import { cn, formatPeso, timeAgo } from "@/lib/utils"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { Modal } from "@/components/ui/Modal"
import type { BackhaulOffer } from "@/types"
import {
  TagIcon,
  TruckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

const truckTypeOptions = [
  { value: "", label: "All Truck Types" },
  { value: "FOUR_WHEELER", label: "Four Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "Six Wheeler Open" },
  { value: "SIX_WHEELER_CLOSED", label: "Six Wheeler Closed" },
  { value: "TEN_WHEELER", label: "Ten Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

function getSavingsPercent(discounted: number, original: number) {
  if (!original || original <= 0) return 0
  return Math.round(((original - discounted) / original) * 100)
}

export default function ShipperBackhaulPage() {
  const [offers, setOffers] = useState<BackhaulOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<BackhaulOffer | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Filter state
  const [filterTruckType, setFilterTruckType] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterRoute, setFilterRoute] = useState("")

  useEffect(() => {
    fetchOffers()
  }, [])

  async function fetchOffers() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/backhaul")
      const data = await res.json()
      setOffers(data.data || data || [])
    } catch {
      setOffers([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBookBackhaul() {
    if (!selectedOffer) return
    setIsBooking(true)
    // Simulate booking
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsBooking(false)
    setBookingSuccess(true)
  }

  // Apply client-side filters
  const filteredOffers = offers.filter((offer) => {
    if (filterTruckType && offer.truckType !== filterTruckType) return false
    if (filterRoute) {
      const route = filterRoute.toLowerCase()
      const matchOrigin = offer.originAddress?.toLowerCase().includes(route)
      const matchDest = offer.destAddress?.toLowerCase().includes(route)
      if (!matchOrigin && !matchDest) return false
    }
    if (filterDateFrom && offer.departureTime) {
      if (new Date(offer.departureTime) < new Date(filterDateFrom)) return false
    }
    if (filterDateTo && offer.departureTime) {
      if (new Date(offer.departureTime) > new Date(filterDateTo)) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Backhaul Capacity</h1>
          <p className="mt-1 text-sm text-warm-400">
            Browse discounted rates from truckers with empty return trips.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Savings Banner */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 flex-shrink-0">
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Save up to 40% with Backhaul Rates</h3>
            <p className="text-sm text-indigo-600-light mt-0.5">
              Truckers offer discounted rates for their return trips. Same quality service, lower cost.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardTitle className="mb-3">Filter Available Capacity</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Route Search"
              placeholder="City name..."
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
            />
            <Select
              label="Truck Type"
              value={filterTruckType}
              onChange={(v) => setFilterTruckType(v)}
              options={truckTypeOptions}
              placeholder="All types"
            />
            <Input
              label="Date From"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          {(filterTruckType || filterRoute || filterDateFrom || filterDateTo) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-warm-400">
                {filteredOffers.length} result{filteredOffers.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterTruckType("")
                  setFilterRoute("")
                  setFilterDateFrom("")
                  setFilterDateTo("")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Offers */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          icon={<TruckIcon className="h-6 w-6" />}
          title="No backhaul capacity available"
          description="Check back later for discounted backhaul offers from truckers with empty return trips."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => {
            const estimatedOriginal = Math.round(offer.discountedRate * 1.4)
            const savings = getSavingsPercent(offer.discountedRate, estimatedOriginal)

            return (
              <Card key={offer.id} interactive>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-warm-800">
                      {offer.originAddress} &rarr; {offer.destAddress}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {offer.truckType?.replace(/_/g, " ")}
                    </p>
                  </div>
                  {savings > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500 ml-2 flex-shrink-0">
                      <TagIcon className="h-3 w-3" />
                      Save {savings}%
                    </span>
                  )}
                </div>

                <CardContent>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-indigo-500">
                        {formatPeso(offer.discountedRate)}
                      </span>
                      {savings > 0 && (
                        <span className="text-sm text-warm-300 line-through">
                          {formatPeso(estimatedOriginal)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-warm-400 mb-3">
                    {offer.departureTime && (
                      <p>Departure: {new Date(offer.departureTime).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}</p>
                    )}
                    <p>Posted {timeAgo(offer.createdAt)}</p>
                  </div>
                </CardContent>

                <div className="pt-3 border-t border-warm-100">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedOffer(offer)
                      setBookingSuccess(false)
                    }}
                  >
                    Book Backhaul
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={!!selectedOffer}
        onClose={() => {
          setSelectedOffer(null)
          setBookingSuccess(false)
        }}
        title={bookingSuccess ? "Booking Confirmed" : "Book Backhaul Capacity"}
      >
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mx-auto mb-4">
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-warm-800 mb-2">Backhaul Booked!</h3>
            <p className="text-sm text-warm-400 mb-4">
              Your backhaul booking has been confirmed. The trucker will be notified.
            </p>
            <Button onClick={() => { setSelectedOffer(null); setBookingSuccess(false) }}>
              Done
            </Button>
          </div>
        ) : selectedOffer && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-warm-400">Route</span>
                <span className="text-sm font-semibold text-warm-800">
                  {selectedOffer.originAddress} &rarr; {selectedOffer.destAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-400">Truck Type</span>
                <span className="text-sm text-warm-800">
                  {selectedOffer.truckType?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-warm-400">Rate</span>
                <span className="text-sm font-bold text-indigo-500">
                  {formatPeso(selectedOffer.discountedRate)}
                </span>
              </div>
              {selectedOffer.departureTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-warm-400">Departure</span>
                  <span className="text-sm text-warm-800">
                    {new Date(selectedOffer.departureTime).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-indigo-600-50 border border-indigo-200 p-3">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-500">
                  You save approximately {formatPeso(Math.round(selectedOffer.discountedRate * 0.4))} compared to standard rates
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setSelectedOffer(null)}>
                Cancel
              </Button>
              <Button onClick={handleBookBackhaul} isLoading={isBooking}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
