"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Modal } from "@/components/ui/Modal"
import { formatPeso, formatDate } from "@/lib/utils"
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline"

type Contract = {
  id: string
  originCity: string
  destCity: string
  agreedRate: number
  fuelSurchargeFormula: string | null
  startDate: string
  endDate: string
  noticePeriodDays: number
  status: string
  signedByShipper: string | null
  signedByTrucker: string | null
  terminatedAt: string | null
  terminationReason: string | null
  createdAt: string
  shipper: { id: string; user: { name: string | null; email: string | null } }
  trucker: { id: string; user: { name: string | null; email: string | null } }
}

const statusSteps = [
  { key: "DRAFT", label: "Draft", icon: DocumentTextIcon },
  { key: "PENDING_SIGNATURE", label: "Pending Signature", icon: PencilSquareIcon },
  { key: "ACTIVE", label: "Active", icon: CheckCircleIcon },
]

function getStepIndex(status: string) {
  if (status === "TERMINATED" || status === "EXPIRED") return 3
  const idx = statusSteps.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const [terminateReason, setTerminateReason] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchContract()
  }, [id])

  async function fetchContract() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/contracts/${id}`)
      const data = await res.json()
      if (data.success) {
        setContract(data.data)
      }
    } catch {
      setError("Failed to load contract")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSign() {
    setIsActing(true)
    setError("")
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" }),
      })
      const data = await res.json()
      if (data.success) {
        setContract(data.data)
      } else {
        setError(data.error || "Failed to sign")
      }
    } catch {
      setError("Network error")
    } finally {
      setIsActing(false)
    }
  }

  async function handleTerminate() {
    setIsActing(true)
    setError("")
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "terminate", terminationReason: terminateReason }),
      })
      const data = await res.json()
      if (data.success) {
        setContract(data.data)
        setShowTerminate(false)
        setTerminateReason("")
      } else {
        setError(data.error || "Failed to terminate")
      }
    } catch {
      setError("Network error")
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-center text-warm-400">Contract not found.</p>
      </div>
    )
  }

  const currentStep = getStepIndex(contract.status)
  const isTerminated = contract.status === "TERMINATED" || contract.status === "EXPIRED"

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/contracts")}
        className="flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Contracts
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">
            {contract.originCity} &rarr; {contract.destCity}
          </h1>
          <p className="mt-1 text-sm text-warm-400">
            Contract ID: {contract.id.slice(0, 8)}...
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            contract.status === "ACTIVE"
              ? "bg-indigo-600-50 text-indigo-500"
              : contract.status === "TERMINATED"
              ? "bg-red-50 text-red-700"
              : contract.status === "PENDING_SIGNATURE"
              ? "bg-amber-50 text-amber-700"
              : "bg-warm-100 text-warm-600"
          }`}
        >
          {contract.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardTitle className="mb-4">Status Timeline</CardTitle>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, idx) => {
            const isComplete = idx < currentStep
            const isCurrent = idx === currentStep && !isTerminated
            const StepIcon = step.icon

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isComplete
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isCurrent
                        ? "border-indigo-600 text-indigo-600 bg-indigo-600-50"
                        : "border-warm-200 text-warm-300 bg-white"
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isComplete || isCurrent ? "text-indigo-500" : "text-warm-300"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      idx < currentStep ? "bg-indigo-600" : "bg-warm-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
          {isTerminated && (
            <div className="flex items-center flex-1">
              <div className="flex-1 h-0.5 mx-2 bg-red-300" />
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-red-50 border-red-400 text-red-600">
                  <XCircleIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-medium text-red-600">
                  {contract.status === "EXPIRED" ? "Expired" : "Terminated"}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Parties */}
        <Card>
          <CardTitle className="mb-4">Parties</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase tracking-wide">Shipper</p>
                <p className="text-sm font-semibold text-warm-800 mt-1">
                  {contract.shipper?.user?.name || "N/A"}
                </p>
                <p className="text-xs text-warm-400">{contract.shipper?.user?.email || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-warm-300 uppercase tracking-wide">Carrier</p>
                <p className="text-sm font-semibold text-warm-800 mt-1">
                  {contract.trucker?.user?.name || "N/A"}
                </p>
                <p className="text-xs text-warm-400">{contract.trucker?.user?.email || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route & Rate */}
        <Card>
          <CardTitle className="mb-4">Route &amp; Rate</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-warm-300">Route</span>
                <span className="text-sm font-medium text-warm-800">
                  {contract.originCity} &rarr; {contract.destCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-warm-300">Agreed Rate</span>
                <span className="text-sm font-semibold text-indigo-500">
                  {formatPeso(contract.agreedRate)}
                </span>
              </div>
              {contract.fuelSurchargeFormula && (
                <div className="flex justify-between">
                  <span className="text-xs text-warm-300">Fuel Surcharge</span>
                  <span className="text-sm text-warm-600">{contract.fuelSurchargeFormula}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardTitle className="mb-4">Contract Period</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-warm-300">Start Date</span>
                <span className="text-sm text-warm-800">{formatDate(contract.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-warm-300">End Date</span>
                <span className="text-sm text-warm-800">{formatDate(contract.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-warm-300">Notice Period</span>
                <span className="text-sm text-warm-800">{contract.noticePeriodDays} days</span>
              </div>
              {contract.terminatedAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-warm-300">Terminated</span>
                  <span className="text-sm text-red-600">{formatDate(contract.terminatedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardTitle className="mb-4">Signatures</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-warm-300">Shipper Signature</p>
                  <p className="text-sm font-medium text-warm-800 mt-0.5">
                    {contract.shipper?.user?.name || "Shipper"}
                  </p>
                </div>
                {contract.signedByShipper ? (
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-xs">{formatDate(contract.signedByShipper)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-warm-300 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Pending
                  </span>
                )}
              </div>
              <div className="border-t border-warm-100 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-warm-300">Carrier Signature</p>
                  <p className="text-sm font-medium text-warm-800 mt-0.5">
                    {contract.trucker?.user?.name || "Carrier"}
                  </p>
                </div>
                {contract.signedByTrucker ? (
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-xs">{formatDate(contract.signedByTrucker)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-warm-300 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Termination Reason */}
      {contract.terminationReason && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardTitle className="text-red-700 mb-2">Termination Reason</CardTitle>
          <CardContent>
            <p className="text-sm text-red-600">{contract.terminationReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {!isTerminated && (
        <div className="flex flex-wrap gap-3">
          {(contract.status === "DRAFT" || contract.status === "PENDING_SIGNATURE") && (
            <Button onClick={handleSign} isLoading={isActing}>
              <PencilSquareIcon className="mr-2 h-4 w-4" />
              Sign Contract
            </Button>
          )}
          {contract.status === "ACTIVE" && (
            <Button
              variant="danger"
              onClick={() => setShowTerminate(true)}
            >
              <XCircleIcon className="mr-2 h-4 w-4" />
              Terminate Contract
            </Button>
          )}
        </div>
      )}

      {/* Terminate Modal */}
      <Modal
        isOpen={showTerminate}
        onClose={() => setShowTerminate(false)}
        title="Terminate Contract"
      >
        <div className="space-y-4">
          <p className="text-sm text-warm-500">
            Are you sure you want to terminate this contract? This action cannot be undone.
            The notice period is {contract.noticePeriodDays} days.
          </p>
          <Input
            label="Reason for Termination"
            placeholder="Enter reason..."
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowTerminate(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleTerminate}
              isLoading={isActing}
              disabled={!terminateReason.trim()}
            >
              Confirm Termination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
