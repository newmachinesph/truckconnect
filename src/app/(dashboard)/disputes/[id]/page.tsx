"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PhotoIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"

type DisputeStatusType = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "APPEALED" | "CLOSED"

const statusConfig: Record<DisputeStatusType, { label: string; className: string; icon: typeof ClockIcon }> = {
  OPEN: { label: "Open", className: "bg-amber-50 text-amber-700", icon: ClockIcon },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-50 text-blue-700", icon: ArrowPathIcon },
  RESOLVED: { label: "Resolved", className: "bg-indigo-600-50 text-indigo-500", icon: CheckCircleIcon },
  APPEALED: { label: "Appealed", className: "bg-red-50 text-red-700", icon: ExclamationTriangleIcon },
  CLOSED: { label: "Closed", className: "bg-warm-100 text-warm-600", icon: CheckCircleIcon },
}

const disputeTypeLabels: Record<string, string> = {
  CARGO_DAMAGE: "Cargo Damage",
  LATE_DELIVERY: "Late Delivery",
  DETENTION_FEE: "Detention Fee",
  CARGO_MISREPRESENTATION: "Cargo Misrepresentation",
  NO_SHOW: "No Show",
  OTHER: "Other",
}

type DisputeDetail = {
  id: string
  type: string
  description: string
  evidencePhotos: string[]
  evidenceNotes: string | null
  counterEvidence: string | null
  counterPhotos: string[]
  status: DisputeStatusType
  resolution: string | null
  resolvedAt: string | null
  appealedAt: string | null
  appealReason: string | null
  createdAt: string
  updatedAt: string
  booking: {
    waybillNumber: string
    agreedRate: number
    load: {
      cargoType: string
      originAddress: string
      destAddress: string
      pickupDate: string
      weightTons: number
    }
  }
  filedBy: { name: string | null; email: string | null }
  resolvedBy: { name: string | null; email: string | null } | null
}

export default function DisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [appealReason, setAppealReason] = useState("")
  const [isAppealing, setIsAppealing] = useState(false)
  const [showAppealForm, setShowAppealForm] = useState(false)

  useEffect(() => {
    async function fetchDispute() {
      try {
        const res = await fetch(`/api/disputes/${params.id}`)
        const data = await res.json()
        if (data.success) {
          setDispute(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch dispute:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDispute()
  }, [params.id])

  async function handleAppeal() {
    if (!appealReason.trim()) {
      toast("error", "Please provide a reason for your appeal")
      return
    }

    setIsAppealing(true)
    try {
      const res = await fetch(`/api/disputes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealReason }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Appeal submitted successfully")
        setDispute((prev) => prev ? { ...prev, status: "APPEALED", appealReason, appealedAt: new Date().toISOString() } : null)
        setShowAppealForm(false)
      } else {
        toast("error", data.error || "Failed to submit appeal")
      }
    } catch {
      toast("error", "Failed to submit appeal")
    } finally {
      setIsAppealing(false)
    }
  }

  if (isLoading) return <PageLoading />
  if (!dispute) {
    return (
      <div className="p-6 text-center">
        <p className="text-warm-400">Dispute not found</p>
      </div>
    )
  }

  const config = statusConfig[dispute.status]
  const canAppeal =
    dispute.status === "RESOLVED" &&
    dispute.resolvedAt &&
    (Date.now() - new Date(dispute.resolvedAt).getTime()) / (1000 * 60 * 60 * 24) <= 7

  // Build timeline events
  const timeline: { label: string; date: string; icon: typeof ClockIcon; color: string }[] = [
    { label: "Dispute Filed", date: dispute.createdAt, icon: ExclamationTriangleIcon, color: "text-amber-500" },
  ]
  if (dispute.status !== "OPEN") {
    timeline.push({ label: "Under Review", date: dispute.updatedAt, icon: ArrowPathIcon, color: "text-blue-500" })
  }
  if (dispute.resolvedAt) {
    timeline.push({ label: "Resolved", date: dispute.resolvedAt, icon: CheckCircleIcon, color: "text-indigo-600" })
  }
  if (dispute.appealedAt) {
    timeline.push({ label: "Appealed", date: dispute.appealedAt, icon: ExclamationTriangleIcon, color: "text-red-500" })
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/disputes")}
        className="flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-600 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Disputes
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">
              {disputeTypeLabels[dispute.type] || dispute.type}
            </h1>
            <Badge className={config.className}>{config.label}</Badge>
          </div>
          <p className="text-sm text-warm-400">
            Ref: {dispute.booking.waybillNumber} &middot; Filed {formatDate(dispute.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Description */}
          <Card>
            <CardTitle>Description</CardTitle>
            <CardContent className="mt-3">
              <p className="text-warm-600 whitespace-pre-wrap">{dispute.description}</p>
            </CardContent>
          </Card>

          {/* Evidence Photos */}
          {dispute.evidencePhotos.length > 0 && (
            <Card>
              <CardTitle>Evidence Photos</CardTitle>
              <CardContent className="mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dispute.evidencePhotos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center overflow-hidden">
                      <img
                        src={photo}
                        alt={`Evidence ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                          ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                      <div className="hidden flex-col items-center text-warm-300">
                        <PhotoIcon className="h-8 w-8" />
                        <span className="text-xs mt-1">Photo {i + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Notes */}
          {dispute.evidenceNotes && (
            <Card>
              <CardTitle>Evidence Notes</CardTitle>
              <CardContent className="mt-3">
                <p className="text-warm-600 whitespace-pre-wrap">{dispute.evidenceNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Counter-Evidence */}
          {(dispute.counterEvidence || dispute.counterPhotos.length > 0) && (
            <Card>
              <CardTitle>Counter-Evidence (Other Party)</CardTitle>
              <CardContent className="mt-3 space-y-3">
                {dispute.counterEvidence && (
                  <p className="text-warm-600 whitespace-pre-wrap">{dispute.counterEvidence}</p>
                )}
                {dispute.counterPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {dispute.counterPhotos.map((photo, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center overflow-hidden">
                        <img src={photo} alt={`Counter evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resolution */}
          {dispute.resolution && (
            <Card className="border-indigo-200 bg-indigo-600-50/50">
              <CardTitle>Resolution</CardTitle>
              <CardContent className="mt-3">
                <p className="text-warm-600 whitespace-pre-wrap">{dispute.resolution}</p>
                {dispute.resolvedBy && (
                  <p className="text-xs text-warm-300 mt-3">
                    Resolved by {dispute.resolvedBy.name} on {formatDateTime(dispute.resolvedAt!)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appeal Section */}
          {canAppeal && !showAppealForm && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent>
                <p className="text-sm text-amber-800 mb-3">
                  Not satisfied with the resolution? You can appeal within 7 days of resolution.
                </p>
                <Button variant="danger" size="sm" onClick={() => setShowAppealForm(true)}>
                  Appeal Resolution
                </Button>
              </CardContent>
            </Card>
          )}

          {showAppealForm && (
            <Card>
              <CardTitle>Submit Appeal</CardTitle>
              <CardContent className="mt-3 space-y-4">
                <Textarea
                  label="Appeal Reason"
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you believe the resolution should be reconsidered..."
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button onClick={handleAppeal} isLoading={isAppealing}>
                    Submit Appeal
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAppealForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appeal Info */}
          {dispute.appealReason && (
            <Card className="border-red-200 bg-red-50/50">
              <CardTitle>Appeal</CardTitle>
              <CardContent className="mt-3">
                <p className="text-warm-600 whitespace-pre-wrap">{dispute.appealReason}</p>
                {dispute.appealedAt && (
                  <p className="text-xs text-warm-300 mt-3">
                    Appealed on {formatDateTime(dispute.appealedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardTitle>Booking Details</CardTitle>
            <CardContent className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-warm-300 uppercase tracking-wide">Cargo</p>
                <p className="text-sm font-medium text-warm-800">{dispute.booking.load.cargoType}</p>
              </div>
              <div>
                <p className="text-xs text-warm-300 uppercase tracking-wide">Route</p>
                <p className="text-sm text-warm-600">{dispute.booking.load.originAddress}</p>
                <p className="text-xs text-warm-300 my-0.5">to</p>
                <p className="text-sm text-warm-600">{dispute.booking.load.destAddress}</p>
              </div>
              <div>
                <p className="text-xs text-warm-300 uppercase tracking-wide">Pickup Date</p>
                <p className="text-sm text-warm-600">{formatDate(dispute.booking.load.pickupDate)}</p>
              </div>
              <div>
                <p className="text-xs text-warm-300 uppercase tracking-wide">Weight</p>
                <p className="text-sm text-warm-600">{dispute.booking.load.weightTons} tons</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardTitle>Timeline</CardTitle>
            <CardContent className="mt-3">
              <div className="space-y-4">
                {timeline.map((event, i) => {
                  const Icon = event.icon
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-1 ${event.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px h-full bg-warm-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-warm-800">{event.label}</p>
                        <p className="text-xs text-warm-300">{formatDateTime(event.date)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filed By */}
          <Card>
            <CardTitle>Filed By</CardTitle>
            <CardContent className="mt-3">
              <p className="text-sm font-medium text-warm-800">{dispute.filedBy.name || "Unknown"}</p>
              {dispute.filedBy.email && (
                <p className="text-xs text-warm-300">{dispute.filedBy.email}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
