"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { Modal } from "@/components/ui/Modal"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { ClaimForm } from "@/components/insurance/ClaimForm"
import { formatPeso, formatDate } from "@/lib/utils"
import {
  ShieldCheckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-indigo-600-50 text-indigo-500" },
  CLAIMED: { label: "Claimed", className: "bg-amber-50 text-amber-700" },
  EXPIRED: { label: "Expired", className: "bg-warm-100 text-warm-600" },
  VOID: { label: "Void", className: "bg-red-50 text-red-700" },
}

const tierLabels: Record<string, string> = {
  BASIC: "Basic",
  COMPREHENSIVE: "Comprehensive",
}

type InsurancePolicy = {
  id: string
  bookingId: string
  tier: string
  declaredValue: number
  premium: number
  coverageMax: number
  status: string
  claimFiledAt: string | null
  claimNotes: string | null
  claimStatus: string | null
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

export default function InsurancePage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimModalPolicy, setClaimModalPolicy] = useState<InsurancePolicy | null>(null)

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await fetch("/api/insurance")
        const data = await res.json()
        if (data.success) {
          setPolicies(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch insurance:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  if (isLoading) return <PageLoading />

  const activePolicies = policies.filter((p) => p.status === "ACTIVE")
  const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverageMax, 0)
  const claimsFiled = policies.filter((p) => p.status === "CLAIMED").length

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">Insurance</h1>
        <p className="text-sm text-warm-400 mt-1">
          Manage your cargo insurance policies and file claims
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-warm-800">{activePolicies.length}</p>
              <p className="text-xs text-warm-400">Active Policies</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-warm-800">{formatPeso(totalCoverage)}</p>
              <p className="text-xs text-warm-400">Total Coverage</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <DocumentTextIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-warm-800">{claimsFiled}</p>
              <p className="text-xs text-warm-400">Claims Filed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Policies List */}
      {policies.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="h-6 w-6" />}
          title="No insurance policies"
          description="You don't have any insurance policies yet. Add insurance when booking a load to protect your cargo."
        />
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => {
            const config = statusConfig[policy.status] || statusConfig.ACTIVE
            return (
              <Card key={policy.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-sm sm:text-base">
                        {tierLabels[policy.tier] || policy.tier} Coverage
                      </CardTitle>
                      <Badge className={config.className}>{config.label}</Badge>
                    </div>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-warm-300">Declared Value</p>
                          <p className="text-sm font-medium text-warm-800">
                            {formatPeso(policy.declaredValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-300">Premium Paid</p>
                          <p className="text-sm font-medium text-warm-800">
                            {formatPeso(policy.premium)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-300">Coverage Max</p>
                          <p className="text-sm font-medium text-warm-800">
                            {formatPeso(policy.coverageMax)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-300">Created</p>
                          <p className="text-sm text-warm-600">{formatDate(policy.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-warm-300">
                        <span>Ref: {policy.booking.waybillNumber}</span>
                        <span>{policy.booking.load.cargoType}</span>
                        <span>
                          {policy.booking.load.originAddress} &rarr; {policy.booking.load.destAddress}
                        </span>
                      </div>

                      {/* Claim info */}
                      {policy.claimStatus && (
                        <div className="mt-3 p-2 bg-amber-50 rounded text-sm">
                          <p className="text-amber-800 font-medium">
                            Claim Status: {policy.claimStatus}
                          </p>
                          {policy.claimNotes && (
                            <p className="text-amber-700 mt-1 text-xs">{policy.claimNotes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {policy.status === "ACTIVE" && (
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setClaimModalPolicy(policy)}
                      >
                        File Claim
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Claim Modal */}
      <Modal
        isOpen={!!claimModalPolicy}
        onClose={() => setClaimModalPolicy(null)}
        title="File Insurance Claim"
        size="lg"
      >
        {claimModalPolicy && (
          <ClaimForm
            policy={claimModalPolicy}
            onSuccess={() => {
              setClaimModalPolicy(null)
              // Refresh policies
              setPolicies((prev) =>
                prev.map((p) =>
                  p.id === claimModalPolicy.id
                    ? { ...p, status: "CLAIMED", claimStatus: "UNDER_REVIEW", claimFiledAt: new Date().toISOString() }
                    : p
                )
              )
            }}
            onCancel={() => setClaimModalPolicy(null)}
          />
        )}
      </Modal>
    </div>
  )
}
