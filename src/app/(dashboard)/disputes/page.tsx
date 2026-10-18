"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { formatDate } from "@/lib/utils"
import {
  ExclamationTriangleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline"

type DisputeStatusType = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "APPEALED" | "CLOSED"

const statusConfig: Record<DisputeStatusType, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-amber-50 text-amber-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-50 text-blue-700" },
  RESOLVED: { label: "Resolved", className: "bg-indigo-600-50 text-indigo-500" },
  APPEALED: { label: "Appealed", className: "bg-red-50 text-red-700" },
  CLOSED: { label: "Closed", className: "bg-warm-100 text-warm-600" },
}

const disputeTypeLabels: Record<string, string> = {
  CARGO_DAMAGE: "Cargo Damage",
  LATE_DELIVERY: "Late Delivery",
  DETENTION_FEE: "Detention Fee",
  CARGO_MISREPRESENTATION: "Cargo Misrepresentation",
  NO_SHOW: "No Show",
  OTHER: "Other",
}

type Dispute = {
  id: string
  type: string
  description: string
  status: DisputeStatusType
  createdAt: string
  booking: {
    waybillNumber: string
    load: {
      cargoType: string
      originAddress: string
      destAddress: string
    }
  }
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const res = await fetch("/api/disputes")
        const data = await res.json()
        if (data.success) {
          setDisputes(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch disputes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDisputes()
  }, [])

  if (isLoading) return <PageLoading />

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">Disputes</h1>
          <p className="text-sm text-warm-400 mt-1">Manage your filed disputes and resolutions</p>
        </div>
        <Link href="/disputes/new">
          <Button>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            File New Dispute
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["OPEN", "UNDER_REVIEW", "RESOLVED", "APPEALED"] as DisputeStatusType[]).map((status) => {
          const count = disputes.filter((d) => d.status === status).length
          const config = statusConfig[status]
          return (
            <Card key={status} className="text-center">
              <p className="font-display text-2xl font-bold text-warm-800">{count}</p>
              <p className="text-xs text-warm-400 mt-1">{config.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <EmptyState
          icon={<ExclamationTriangleIcon className="h-6 w-6" />}
          title="No disputes filed"
          description="You haven't filed any disputes yet. If you encounter an issue with a booking, you can file a dispute here."
          action={
            <Link href="/disputes/new">
              <Button>File a Dispute</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const config = statusConfig[dispute.status]
            return (
              <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                <Card interactive className="mb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm sm:text-base">
                          {disputeTypeLabels[dispute.type] || dispute.type}
                        </CardTitle>
                        <Badge className={config.className}>
                          {config.label}
                        </Badge>
                      </div>
                      <CardContent>
                        <p className="text-warm-500 line-clamp-1 mb-2">{dispute.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-warm-300">
                          <span>Ref: {dispute.booking.waybillNumber}</span>
                          <span>{dispute.booking.load.cargoType}</span>
                          <span>Filed {formatDate(dispute.createdAt)}</span>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
