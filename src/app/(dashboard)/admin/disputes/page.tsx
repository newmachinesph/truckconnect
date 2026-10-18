"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Modal } from "@/components/ui/Modal"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { useToast } from "@/components/ui/Toast"
import { formatDate, timeAgo } from "@/lib/utils"
import {
  ExclamationTriangleIcon,
  FunnelIcon,
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

type AdminDispute = {
  id: string
  type: string
  description: string
  status: DisputeStatusType
  createdAt: string
  filedBy: { name: string | null; email: string | null }
  booking: {
    waybillNumber: string
    load: {
      cargoType: string
      originAddress: string
      destAddress: string
    }
  }
}

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "APPEALED", label: "Appealed" },
  { value: "CLOSED", label: "Closed" },
]

const typeFilterOptions = [
  { value: "", label: "All Types" },
  { value: "CARGO_DAMAGE", label: "Cargo Damage" },
  { value: "LATE_DELIVERY", label: "Late Delivery" },
  { value: "DETENTION_FEE", label: "Detention Fee" },
  { value: "CARGO_MISREPRESENTATION", label: "Cargo Misrepresentation" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "OTHER", label: "Other" },
]

export default function AdminDisputesPage() {
  const { toast } = useToast()
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Resolve modal state
  const [resolveModal, setResolveModal] = useState<{ id: string; action: string } | null>(null)
  const [resolution, setResolution] = useState("")
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() {
    try {
      // For admin, fetch all disputes (in production, use a separate admin endpoint)
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

  async function handleResolve() {
    if (!resolveModal || !resolution.trim()) {
      toast("error", "Please provide a resolution note")
      return
    }

    setIsResolving(true)
    try {
      const res = await fetch(`/api/disputes/${resolveModal.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: resolution.trim(),
          status: resolveModal.action,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", `Dispute ${resolveModal.action === "RESOLVED" ? "resolved" : resolveModal.action === "UNDER_REVIEW" ? "marked under review" : "closed"} successfully`)
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === resolveModal.id
              ? { ...d, status: resolveModal.action as DisputeStatusType }
              : d
          )
        )
        setResolveModal(null)
        setResolution("")
      } else {
        toast("error", data.error || "Failed to update dispute")
      }
    } catch {
      toast("error", "Failed to update dispute")
    } finally {
      setIsResolving(false)
    }
  }

  if (isLoading) return <PageLoading />

  // Filter and sort disputes
  let filtered = disputes
  if (statusFilter) {
    filtered = filtered.filter((d) => d.status === statusFilter)
  }
  if (typeFilter) {
    filtered = filtered.filter((d) => d.type === typeFilter)
  }

  // Sort by priority: OPEN first, then APPEALED, then UNDER_REVIEW, sorted by oldest first
  const priorityOrder: Record<string, number> = {
    OPEN: 0,
    APPEALED: 1,
    UNDER_REVIEW: 2,
    RESOLVED: 3,
    CLOSED: 4,
  }
  filtered.sort((a, b) => {
    const pDiff = (priorityOrder[a.status] || 9) - (priorityOrder[b.status] || 9)
    if (pDiff !== 0) return pDiff
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">Dispute Queue</h1>
        <p className="text-sm text-warm-400 mt-1">
          Review and resolve disputes. Prioritized by age and status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["OPEN", "UNDER_REVIEW", "APPEALED", "RESOLVED", "CLOSED"] as DisputeStatusType[]).map((status) => {
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

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-4 w-4 text-warm-300" />
          <span className="text-sm font-medium text-warm-600">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilterOptions}
            placeholder="All Statuses"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeFilterOptions}
            placeholder="All Types"
          />
        </div>
      </Card>

      {/* Disputes List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ExclamationTriangleIcon className="h-6 w-6" />}
          title="No disputes found"
          description="No disputes match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((dispute) => {
            const config = statusConfig[dispute.status]
            const isActionable = dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" || dispute.status === "APPEALED"

            return (
              <Card key={dispute.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-sm sm:text-base">
                        {disputeTypeLabels[dispute.type] || dispute.type}
                      </CardTitle>
                      <Badge className={config.className}>{config.label}</Badge>
                    </div>
                    <CardContent>
                      <p className="text-warm-500 line-clamp-2 mb-2">{dispute.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-warm-300">
                        <span>Ref: {dispute.booking.waybillNumber}</span>
                        <span>By: {dispute.filedBy.name || "Unknown"}</span>
                        <span>{dispute.booking.load.cargoType}</span>
                        <span>Filed {timeAgo(dispute.createdAt)}</span>
                      </div>
                    </CardContent>
                  </div>

                  {isActionable && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {dispute.status === "OPEN" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setResolveModal({ id: dispute.id, action: "UNDER_REVIEW" })}
                        >
                          Mark Review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setResolveModal({ id: dispute.id, action: "RESOLVED" })}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResolveModal({ id: dispute.id, action: "CLOSED" })}
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal
        isOpen={!!resolveModal}
        onClose={() => {
          setResolveModal(null)
          setResolution("")
        }}
        title={
          resolveModal?.action === "UNDER_REVIEW"
            ? "Mark as Under Review"
            : resolveModal?.action === "RESOLVED"
            ? "Resolve Dispute"
            : "Close Dispute"
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution Note"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder={
              resolveModal?.action === "UNDER_REVIEW"
                ? "Add a note about what you are reviewing..."
                : "Provide a resolution summary..."
            }
            rows={4}
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setResolveModal(null)
                setResolution("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} isLoading={isResolving}>
              {resolveModal?.action === "UNDER_REVIEW"
                ? "Mark Under Review"
                : resolveModal?.action === "RESOLVED"
                ? "Resolve"
                : "Close Dispute"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
