"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { useToast } from "@/components/ui/Toast"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"

type ExpiringDoc = {
  id: string
  type: string
  fileName: string
  status: string
  userId: string
  userName: string
  userEmail: string | null
  expiryDate: string
  daysRemaining: number
  createdAt: string
}

type AuditEntry = {
  id: string
  action: string
  title: string
  body: string
  userName: string | null
  createdAt: string
}

type ComplianceData = {
  expiringDocuments: ExpiringDoc[]
  stats: {
    totalVerified: number
    pendingReview: number
    expired: number
    totalDocuments: number
  }
  auditLog: AuditEntry[]
}

export default function ComplianceDashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<ComplianceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/compliance")
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      toast("error", "Failed to load compliance data")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDocAction(documentId: string, action: "verify" | "reject") {
    setActionLoading(documentId)
    try {
      const res = await fetch("/api/admin/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action }),
      })
      const json = await res.json()
      if (json.success) {
        toast("success", action === "verify" ? "Document verified" : "Re-upload requested")
        fetchData()
      } else {
        toast("error", json.error || "Action failed")
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

  function getUrgencyColor(days: number) {
    if (days <= 0) return "text-red-600 bg-red-50"
    if (days <= 7) return "text-red-600 bg-red-50"
    if (days <= 14) return "text-amber-600 bg-amber-50"
    return "text-warm-500 bg-surface"
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600-50">
            <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-800">Compliance Dashboard</h1>
            <p className="text-sm text-warm-400">
              Monitor document compliance and expiration status.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                Verified
              </p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {stats?.totalVerified ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-600-50">
              <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                Pending Review
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {stats?.pendingReview ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50">
              <ClockIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                Expired
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {stats?.expired ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                Total Documents
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-warm-800">
                {stats?.totalDocuments ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-warm-100">
              <DocumentCheckIcon className="h-5 w-5 text-warm-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expiry Queue */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Expiry Queue (Next 30 Days)</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            {!data?.expiringDocuments?.length ? (
              <EmptyState
                icon={<CheckCircleIcon className="h-6 w-6" />}
                title="All clear"
                description="No documents expiring in the next 30 days."
                size="sm"
              />
            ) : (
              <div className="space-y-3">
                {data.expiringDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-warm-200 p-3 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-warm-800">
                          {formatDocType(doc.type)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getUrgencyColor(doc.daysRemaining)}`}
                        >
                          {doc.daysRemaining <= 0
                            ? "EXPIRED"
                            : `${doc.daysRemaining}d remaining`}
                        </span>
                      </div>
                      <p className="text-xs text-warm-400">
                        {doc.userName} -- Expires {formatDate(doc.expiryDate)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleDocAction(doc.id, "verify")}
                        isLoading={actionLoading === doc.id}
                        disabled={!!actionLoading}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDocAction(doc.id, "reject")}
                        disabled={!!actionLoading}
                      >
                        Request Re-upload
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Audit Log */}
        <div>
          <Card>
            <CardTitle>Recent Audit Log</CardTitle>
            <CardContent>
              {!data?.auditLog?.length ? (
                <p className="text-sm text-warm-300 mt-4 text-center py-8">
                  No audit entries yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {data.auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-l-2 border-warm-200 pl-3 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.action.includes("VERIFIED") || entry.action.includes("APPROVED")
                              ? "confirmed"
                              : "cancelled"
                          }
                        >
                          {entry.action.includes("VERIFIED") || entry.action.includes("APPROVED")
                            ? "Verified"
                            : "Rejected"}
                        </Badge>
                      </div>
                      <p className="text-xs text-warm-500 mt-1">{entry.title}</p>
                      <p className="text-xs text-warm-300">
                        {entry.userName} -- {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
