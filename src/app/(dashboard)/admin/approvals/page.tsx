"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { useToast } from "@/components/ui/Toast"
import { formatDate } from "@/lib/utils"
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

type Approval = {
  id: string
  name: string
  email: string | null
  registeredAt: string
  documents: {
    id: string
    type: string
    fileName: string
    status: string
    createdAt: string
  }[]
  truckCount: number
  truckTypes: string[]
}

const filterOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

export default function AdminApprovalsPage() {
  const { toast } = useToast()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("PENDING")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchApprovals()
  }, [filter])

  async function fetchApprovals() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/approvals?filter=${filter}`)
      const data = await res.json()
      if (data.success) {
        setApprovals(data.data)
      }
    } catch {
      toast("error", "Failed to load approvals")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAction(userId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", action === "approve" ? "Carrier approved successfully" : "Carrier rejected")
        setRejectingId(null)
        setRejectReason("")
        fetchApprovals()
      } else {
        toast("error", data.error || "Action failed")
      }
    } catch {
      toast("error", "Failed to process action")
    } finally {
      setActionLoading(null)
    }
  }

  function formatDocType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function formatTruckType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-warm-800">Carrier Approvals</h1>
        <p className="mt-1 text-sm text-warm-400">
          Review and approve carrier registrations and uploaded documents.
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 max-w-xs">
        <Select
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={filterOptions}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="h-6 w-6" />}
          title={`No ${filter.toLowerCase()} approvals`}
          description={
            filter === "PENDING"
              ? "All carrier registrations have been reviewed."
              : `No ${filter.toLowerCase()} carriers found.`
          }
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Carrier Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600-50">
                      <TruckIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle>{approval.name}</CardTitle>
                      {approval.email && (
                        <p className="text-xs text-warm-400">{approval.email}</p>
                      )}
                    </div>
                  </div>

                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-medium text-warm-300 uppercase">Registered</p>
                        <p className="text-sm text-warm-600">{formatDate(approval.registeredAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-warm-300 uppercase">Trucks</p>
                        <p className="text-sm text-warm-600">
                          {approval.truckCount} truck{approval.truckCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-warm-300 uppercase">Types</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {approval.truckTypes.length > 0 ? (
                            approval.truckTypes.map((type) => (
                              <Badge key={type} variant="default">
                                {formatTruckType(type)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-warm-300">None</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <p className="text-xs font-medium text-warm-300 uppercase mb-2">
                        Documents ({approval.documents.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {approval.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 rounded-md border border-warm-200 px-2.5 py-1.5 text-xs"
                          >
                            <DocumentTextIcon className="h-3.5 w-3.5 text-warm-300" />
                            <span className="text-warm-600">{formatDocType(doc.type)}</span>
                            <Badge
                              variant={
                                doc.status === "VERIFIED"
                                  ? "confirmed"
                                  : doc.status === "REJECTED"
                                    ? "cancelled"
                                    : "open"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Actions */}
                {filter === "PENDING" && (
                  <div className="flex flex-col gap-2 lg:min-w-[180px]">
                    <Button
                      onClick={() => handleAction(approval.id, "approve")}
                      isLoading={actionLoading === approval.id}
                      disabled={!!actionLoading}
                    >
                      Approve
                    </Button>

                    {rejectingId === approval.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAction(approval.id, "reject", rejectReason)}
                            isLoading={actionLoading === approval.id}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRejectingId(null)
                              setRejectReason("")
                            }}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setRejectingId(approval.id)}
                        disabled={!!actionLoading}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                )}

                {filter !== "PENDING" && (
                  <div>
                    <Badge
                      variant={filter === "APPROVED" ? "confirmed" : "cancelled"}
                    >
                      {filter}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
