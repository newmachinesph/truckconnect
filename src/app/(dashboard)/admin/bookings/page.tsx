"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatPeso, formatDate } from "@/lib/utils"
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline"

type BookingRow = {
  id: string
  waybillNumber: string
  status: string
  agreedRate: number
  platformFeeShipper: number
  platformFeeTrucker: number
  createdAt: string
  load: {
    originAddress: string
    destAddress: string
    cargoType: string
    weightTons: number
    shipperProfile: {
      user: { name: string | null; email: string | null }
    }
  }
  truckerProfile: {
    user: { name: string | null; email: string | null }
  }
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

const statusFilters = [
  { label: "All", value: "" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Disputed", value: "DISPUTED" },
]

export default function AdminBookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState(searchParams.get("status") || "")

  const currentPage = parseInt(searchParams.get("page") || "1", 10)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeStatus) params.set("status", activeStatus)
      params.set("page", currentPage.toString())

      const res = await fetch(`/api/admin/bookings?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setBookings(data.data || [])
        setPagination(data.pagination || null)
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false)
    }
  }, [activeStatus, currentPage])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    if (!updates.page) {
      params.delete("page")
    }
    router.push(`/admin/bookings?${params.toString()}`)
  }

  function handleStatusFilter(status: string) {
    setActiveStatus(status)
    updateParams({ status, page: "" })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-warm-800">Booking Management</h1>
        <p className="mt-1 text-sm text-warm-400">
          View and manage all platform bookings.
        </p>
      </div>

      {/* Status Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeStatus === filter.value
                  ? "bg-indigo-50 text-indigo-500"
                  : "bg-warm-100 text-warm-500 hover:bg-warm-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardTitle className="mb-4">
          Bookings {pagination ? `(${pagination.total})` : ""}
        </CardTitle>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-warm-100 rounded" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
            title="No bookings found"
            description="Try adjusting your status filter."
            size="sm"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100 text-left">
                    <th className="pb-3 font-medium text-warm-400">Waybill</th>
                    <th className="pb-3 font-medium text-warm-400">Shipper</th>
                    <th className="pb-3 font-medium text-warm-400">Trucker</th>
                    <th className="pb-3 font-medium text-warm-400">Route</th>
                    <th className="pb-3 font-medium text-warm-400">Amount</th>
                    <th className="pb-3 font-medium text-warm-400">Fees</th>
                    <th className="pb-3 font-medium text-warm-400">Status</th>
                    <th className="pb-3 font-medium text-warm-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-surface">
                      <td className="py-3 font-mono text-xs text-warm-500">
                        {booking.waybillNumber.slice(0, 8)}...
                      </td>
                      <td className="py-3 text-warm-800">
                        {booking.load.shipperProfile?.user?.name || "N/A"}
                      </td>
                      <td className="py-3 text-warm-800">
                        {booking.truckerProfile?.user?.name || "N/A"}
                      </td>
                      <td className="py-3 text-warm-500 max-w-[200px] truncate">
                        {booking.load.originAddress} &rarr; {booking.load.destAddress}
                      </td>
                      <td className="py-3 font-semibold text-warm-800">
                        {formatPeso(booking.agreedRate)}
                      </td>
                      <td className="py-3 text-xs text-warm-400">
                        {formatPeso(booking.platformFeeShipper + booking.platformFeeTrucker)}
                      </td>
                      <td className="py-3">
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-warm-400 text-xs">
                        {formatDate(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-warm-100">
                <p className="text-xs text-warm-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} bookings)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: (pagination.page - 1).toString() })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() => updateParams({ page: (pagination.page + 1).toString() })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
