"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface BidCardProps {
  bid: {
    id: string
    proposedRate: number
    comments?: string | null
    status: string
    counterRate?: number | null
    counterNote?: string | null
    createdAt: string
    trucker: {
      completedTrips: number
      user: { name: string | null; image: string | null }
      trucks: { truckType: string; plateNumber: string; capacityTons: number }[]
    }
  }
  isShipperView?: boolean
  onAction?: () => void
}

const bidStatusMap: Record<string, string> = {
  PENDING: "open",
  ACCEPTED: "confirmed",
  REJECTED: "cancelled",
  COUNTERED: "in_transit",
  WITHDRAWN: "cancelled",
  EXPIRED: "default",
}

export function BidCard({ bid, isShipperView, onAction }: BidCardProps) {
  const [isLoading, setIsLoading] = useState("")
  const [counterRate, setCounterRate] = useState("")
  const [showCounter, setShowCounter] = useState(false)

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    setIsLoading(action)
    try {
      const res = await fetch(`/api/bids/${bid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) onAction?.()
    } catch {
      // silent
    } finally {
      setIsLoading("")
    }
  }

  const variant = (bidStatusMap[bid.status] ?? "default") as "open" | "confirmed" | "in_transit" | "delivered" | "cancelled" | "truck_ban" | "default"

  return (
    <div className="rounded-xl border border-warm-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100 text-sm font-bold text-warm-500">
            {bid.trucker.user.name?.[0]?.toUpperCase() ?? "T"}
          </div>
          <div>
            <p className="font-semibold text-warm-800">{bid.trucker.user.name ?? "Trucker"}</p>
            <p className="text-xs text-warm-300">
              {bid.trucker.completedTrips} trips · {bid.trucker.trucks[0]?.truckType.replace(/_/g, " ") ?? "No truck"}
            </p>
          </div>
        </div>
        <Badge variant={variant}>{bid.status}</Badge>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-warm-800">₱{bid.proposedRate.toLocaleString()}</span>
        {bid.counterRate && (
          <span className="text-sm text-amber-600">
            Counter: ₱{bid.counterRate.toLocaleString()}
          </span>
        )}
      </div>

      {bid.comments && (
        <p className="text-sm text-warm-400 bg-surface rounded-lg p-3">{bid.comments}</p>
      )}
      {bid.counterNote && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
          <span className="font-medium">Counter note:</span> {bid.counterNote}
        </p>
      )}

      {isShipperView && bid.status === "PENDING" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => handleAction("accept")} isLoading={isLoading === "accept"}>
            Accept
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowCounter(!showCounter)}>
            Counter
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleAction("reject")} isLoading={isLoading === "reject"}>
            Reject
          </Button>
        </div>
      )}

      {showCounter && (
        <div className="flex gap-2 pt-1">
          <Input
            type="number"
            value={counterRate}
            onChange={(e) => setCounterRate(e.target.value)}
            placeholder="Counter rate (₱)"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleAction("counter", { counterRate: parseFloat(counterRate) })}
            isLoading={isLoading === "counter"}
            disabled={!counterRate}
          >
            Send Counter
          </Button>
        </div>
      )}

      {!isShipperView && bid.status === "COUNTERED" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => handleAction("accept_counter")} isLoading={isLoading === "accept_counter"}>
            Accept ₱{bid.counterRate?.toLocaleString()}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleAction("withdraw")} isLoading={isLoading === "withdraw"}>
            Withdraw
          </Button>
        </div>
      )}
    </div>
  )
}
