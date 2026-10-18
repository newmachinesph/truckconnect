"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn, formatPeso, timeAgo } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Load } from "@/types"

const tabs = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Booked", value: "BOOKED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
]

export default function MyLoadsPage() {
  const [activeTab, setActiveTab] = useState("")
  const [loads, setLoads] = useState<Load[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLoads() {
      setIsLoading(true)
      try {
        const url = activeTab ? `/api/loads?status=${activeTab}` : "/api/loads"
        const res = await fetch(url)
        const data = await res.json()
        setLoads(data.data || data || [])
      } catch {
        setLoads([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoads()
  }, [activeTab])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-800">My Loads</h1>
        <Link href="/shipper/post-load">
          <Button>Post a Load</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-warm-200 mb-6">
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

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : loads.length === 0 ? (
        <EmptyState
          title="No loads found"
          description={
            activeTab
              ? `You don't have any ${activeTab.replace(/_/g, " ").toLowerCase()} loads.`
              : "You haven't posted any loads yet."
          }
          action={
            <Link href="/shipper/post-load">
              <Button>Post Your First Load</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {loads.map((load) => (
            <Link key={load.id} href={`/shipper/my-loads/${load.id}`}>
              <Card interactive className="hover:border-indigo-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-warm-800">
                        {load.originAddress} &rarr; {load.destAddress}
                      </p>
                      <Badge variant={getStatusVariant(load.status)}>
                        {load.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-warm-400">
                      {load.preferredTruck?.replace(/_/g, " ")} &middot;{" "}
                      {load.weightTons ? `${load.weightTons} tons` : "Weight TBD"} &middot;{" "}
                      {timeAgo(load.createdAt)}
                    </p>
                    {load.cargoType && (
                      <p className="mt-1 text-xs text-warm-300 truncate">
                        {load.cargoType}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {formatPeso(load.rateEstimate ?? 0)}
                    </p>
                    <p className="text-xs text-warm-300">
                      {load.distanceKm ? `${load.distanceKm.toFixed(0)} km` : ""}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
