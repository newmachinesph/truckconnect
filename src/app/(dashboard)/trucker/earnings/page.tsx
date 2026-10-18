"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { formatPeso } from "@/lib/utils"

interface EarningBooking {
  id: string
  waybillNumber: string
  status: string
  agreedRate: number
  platformFee: number
  netEarning: number
  paymentStatus: string
  createdAt: string
  load: {
    originAddress: string
    destAddress: string
    cargoType: string
    pickupDate: string
  }
}

interface EarningsData {
  totalEarnings: number
  pendingEarnings: number
  completedTrips: number
  bookings: EarningBooking[]
}

export default function TruckerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch("/api/earnings")
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchEarnings()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-6">My Earnings</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="text-center">
          <CardContent>
            <p className="text-xs font-medium text-warm-300 uppercase">Total Earnings</p>
            <p className="mt-1 text-3xl font-bold text-indigo-600">
              {formatPeso(data?.totalEarnings ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent>
            <p className="text-xs font-medium text-warm-300 uppercase">Pending</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">
              {formatPeso(data?.pendingEarnings ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent>
            <p className="text-xs font-medium text-warm-300 uppercase">Completed Trips</p>
            <p className="mt-1 font-display text-3xl font-bold text-warm-800">
              {data?.completedTrips ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History */}
      <Card>
        <CardTitle className="mb-4">Earnings History</CardTitle>
        <CardContent>
          {!data?.bookings.length ? (
            <p className="text-center text-sm text-warm-300 py-8">No earnings yet</p>
          ) : (
            <div className="space-y-3">
              {data.bookings.map((b) => (
                <a
                  key={b.id}
                  href={`/trucker/booking/${b.id}`}
                  className="flex items-center justify-between rounded-xl border border-warm-200 p-4 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {b.load.originAddress.split(",")[0]} → {b.load.destAddress.split(",")[0]}
                    </p>
                    <p className="text-xs text-warm-300 mt-0.5">
                      {b.load.cargoType} · {b.waybillNumber?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-indigo-600">
                      {formatPeso(b.netEarning)}
                    </p>
                    <Badge variant={getStatusVariant(b.status)} className="mt-1">
                      {b.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
