"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatPeso, formatDate } from "@/lib/utils"
import { DocumentTextIcon } from "@heroicons/react/24/outline"

type Contract = {
  id: string
  originCity: string
  destCity: string
  agreedRate: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
  shipper: { user: { name: string | null } }
  trucker: { user: { name: string | null } }
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_SIGNATURE", label: "Pending Signature" },
  { value: "ACTIVE", label: "Active" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "EXPIRED", label: "Expired" },
]

function getContractBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-warm-100 text-warm-600"
    case "PENDING_SIGNATURE":
      return "bg-amber-50 text-amber-700"
    case "ACTIVE":
      return "bg-indigo-600-50 text-indigo-500"
    case "TERMINATED":
      return "bg-red-50 text-red-700"
    case "EXPIRED":
      return "bg-warm-100 text-warm-400"
    default:
      return "bg-warm-100 text-warm-600"
  }
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    fetchContracts()
  }, [statusFilter])

  async function fetchContracts() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/contracts?${params.toString()}`)
      const data = await res.json()
      setContracts(data.data || [])
    } catch {
      setContracts([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Contracts</h1>
          <p className="mt-1 text-sm text-warm-400">
            Manage your contract lanes and agreements.
          </p>
        </div>
        <Link href="/contracts/new">
          <Button>
            <DocumentTextIcon className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 max-w-xs">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-6 w-6" />}
          title="No contracts found"
          description="Create your first contract lane to establish recurring shipping agreements."
          action={
            <Link href="/contracts/new">
              <Button size="sm">Create Contract</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-warm-800 truncate">
                      {contract.originCity} &rarr; {contract.destCity}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {contract.shipper?.user?.name || "Shipper"} &middot; {contract.trucker?.user?.name || "Trucker"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getContractBadgeClass(contract.status)}`}
                  >
                    {contract.status.replace(/_/g, " ")}
                  </span>
                </div>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-warm-300">Agreed Rate</span>
                      <span className="text-sm font-semibold text-indigo-500">
                        {formatPeso(contract.agreedRate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-warm-300">Period</span>
                      <span className="text-xs text-warm-500">
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
