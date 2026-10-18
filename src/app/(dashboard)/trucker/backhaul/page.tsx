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
import type { BackhaulOffer } from "@/types"
import {
  TagIcon,
  SparklesIcon,
  FunnelIcon,
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

const tabs = [
  { label: "My Offers", value: "mine" },
  { label: "Browse All", value: "all" },
]

// Demo suggested backhaul routes after delivery
const suggestedBackhauls = [
  {
    id: "sug-1",
    originAddress: "Cebu City",
    destAddress: "Manila",
    truckType: "TEN_WHEELER",
    discountedRate: 12000,
    originalRate: 18000,
    departureTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    reason: "You just delivered to Cebu. Fill your return trip!",
  },
  {
    id: "sug-2",
    originAddress: "Davao City",
    destAddress: "Cebu City",
    truckType: "SIX_WHEELER_CLOSED",
    discountedRate: 8500,
    originalRate: 13000,
    departureTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    reason: "Popular return route with 35% savings.",
  },
]

function getSavingsPercent(discounted: number, original: number) {
  if (!original || original <= 0) return 0
  return Math.round(((original - discounted) / original) * 100)
}

export default function BackhaulPage() {
  const [activeTab, setActiveTab] = useState("mine")
  const [offers, setOffers] = useState<BackhaulOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [filterTruckType, setFilterTruckType] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterRoute, setFilterRoute] = useState("")

  const [form, setForm] = useState({
    originAddress: "",
    destAddress: "",
    truckType: "",
    departureTime: "",
    discountedRate: "",
  })

  useEffect(() => {
    fetchOffers()
  }, [activeTab])

  async function fetchOffers() {
    setIsLoading(true)
    try {
      const url = activeTab === "mine" ? "/api/backhaul?mine=true" : "/api/backhaul"
      const res = await fetch(url)
      const data = await res.json()
      setOffers(data.data || data || [])
    } catch {
      setOffers([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    setIsPosting(true)
    setError("")

    try {
      const res = await fetch("/api/backhaul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountedRate: parseFloat(form.discountedRate) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to post backhaul offer.")
        return
      }

      const data = await res.json()
      setOffers((prev) => [data.data || data, ...prev])
      setIsFormOpen(false)
      setForm({ originAddress: "", destAddress: "", truckType: "", departureTime: "", discountedRate: "" })
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsPosting(false)
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-800">Backhaul Marketplace</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <FunnelIcon className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            {isFormOpen ? "Cancel" : "Post Backhaul"}
          </Button>
        </div>
      </div>

      {/* Auto-Suggest Section */}
      {activeTab === "mine" && suggestedBackhauls.length > 0 && !isFormOpen && (
        <Card className="mb-6 border-indigo-200 bg-gradient-to-r from-indigo-600-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-500">Suggested Return Trips</CardTitle>
          </div>
          <CardContent>
            <p className="text-sm text-indigo-600 mb-4">
              Fill your empty return trips and earn more with discounted backhaul routes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedBackhauls.map((sug) => {
                const savings = getSavingsPercent(sug.discountedRate, sug.originalRate)
                return (
                  <div
                    key={sug.id}
                    className="p-3 bg-white rounded-lg border border-indigo-600-100 hover:border-indigo-600-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-warm-800">
                        {sug.originAddress} &rarr; {sug.destAddress}
                      </p>
                      {savings > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-500">
                          <TagIcon className="h-3 w-3" />
                          Save {savings}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-warm-400 mb-2">
                      <span>{sug.truckType.replace(/_/g, " ")}</span>
                      <span>&middot;</span>
                      <span>{new Date(sug.departureTime).toLocaleDateString("en-PH")}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-indigo-500">{formatPeso(sug.discountedRate)}</span>
                      <span className="text-sm text-warm-300 line-through">{formatPeso(sug.originalRate)}</span>
                    </div>
                    <p className="text-xs text-warm-400 italic mb-3">{sug.reason}</p>
                    <Button size="sm" className="w-full">
                      Post This Backhaul
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardTitle className="mb-3">Filter Offers</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Truck Type"
              value={filterTruckType}
              onChange={(v) => setFilterTruckType(v)}
              options={truckTypeOptions}
              placeholder="All types"
            />
            <Input
              label="Route Search"
              placeholder="City name..."
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
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
            <div className="mt-3">
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

      {/* Post Form - Collapsible */}
      {isFormOpen && (
        <Card className="mb-6 p-6">
          <CardTitle className="mb-4">Post a Backhaul Offer</CardTitle>
          <form onSubmit={handlePost} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Origin Address"
                placeholder="e.g., Cebu City"
                value={form.originAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, originAddress: e.target.value }))}
                required
              />
              <Input
                label="Destination Address"
                placeholder="e.g., Manila"
                value={form.destAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, destAddress: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Truck Type"
                value={form.truckType}
                onChange={(val) => setForm((prev) => ({ ...prev, truckType: val }))}
                options={truckTypeOptions.filter((o) => o.value !== "")}
                placeholder="Select..."
              />
              <Input
                label="Departure Time"
                type="datetime-local"
                value={form.departureTime}
                onChange={(e) => setForm((prev) => ({ ...prev, departureTime: e.target.value }))}
              />
              <Input
                label="Discounted Rate"
                type="number"
                placeholder="e.g., 5000"
                value={form.discountedRate}
                onChange={(e) => setForm((prev) => ({ ...prev, discountedRate: e.target.value }))}
                hint="Rate per trip"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" isLoading={isPosting}>
              Post Offer
            </Button>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-warm-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.value
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-warm-400 hover:text-warm-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          title={activeTab === "mine" ? "No backhaul offers yet" : "No backhaul offers available"}
          description={
            activeTab === "mine"
              ? "Post a backhaul offer to fill your return trips at discounted rates."
              : "Check back later for available backhaul offers."
          }
          action={
            activeTab === "mine" ? (
              <Button onClick={() => setIsFormOpen(true)}>Post Your First Offer</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => {
            // Simulate original rate as 40% higher for savings display
            const estimatedOriginal = Math.round(offer.discountedRate * 1.4)
            const savings = getSavingsPercent(offer.discountedRate, estimatedOriginal)

            return (
              <Card key={offer.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-warm-800">
                      {offer.originAddress} &rarr; {offer.destAddress}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {offer.truckType?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="confirmed">
                      {formatPeso(offer.discountedRate)}
                    </Badge>
                    {savings > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-500">
                        <TagIcon className="h-2.5 w-2.5" />
                        Save {savings}%
                      </span>
                    )}
                  </div>
                </div>
                <CardContent>
                  <div className="space-y-1 text-xs text-warm-400">
                    {savings > 0 && (
                      <p className="flex items-center gap-1">
                        <span className="text-warm-300 line-through">
                          {formatPeso(estimatedOriginal)}
                        </span>
                        <span className="text-indigo-600 font-medium">
                          &rarr; {formatPeso(offer.discountedRate)}
                        </span>
                      </p>
                    )}
                    {offer.departureTime && (
                      <p>Departure: {new Date(offer.departureTime).toLocaleDateString("en-PH")}</p>
                    )}
                    <p>{timeAgo(offer.createdAt)}</p>
                  </div>
                </CardContent>
                {activeTab === "all" && (
                  <div className="mt-3 pt-3 border-t border-warm-100">
                    <Button size="sm" className="w-full">
                      Contact Trucker
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
