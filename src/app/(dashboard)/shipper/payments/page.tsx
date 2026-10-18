"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EscrowBadge } from "@/components/payments/EscrowBadge"
import { formatPeso } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  platformFee: number
  netAmount: number
  method: string
  status: string
  receiptNumber: string | null
  createdAt: string
  booking: {
    load: {
      originAddress: string
      destAddress: string
      cargoType: string
    }
  }
}

export default function ShipperPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/payments")
        const data = await res.json()
        if (data.success) setPayments(data.data)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchPayments()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const totalPaid = payments
    .filter((p) => p.status !== "FAILED" && p.status !== "REFUNDED")
    .reduce((sum, p) => sum + p.amount, 0)

  const escrowHeld = payments
    .filter((p) => p.status === "ESCROW_HELD")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-6">My Payments</h1>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card className="text-center">
          <CardContent>
            <p className="text-xs font-medium text-warm-300 uppercase">Total Paid</p>
            <p className="mt-1 font-display text-3xl font-bold text-warm-800">{formatPeso(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent>
            <p className="text-xs font-medium text-warm-300 uppercase">In Escrow</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{formatPeso(escrowHeld)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardTitle className="mb-4">Payment History</CardTitle>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-sm text-warm-300 py-8">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-warm-200 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {p.booking.load.originAddress.split(",")[0]} → {p.booking.load.destAddress.split(",")[0]}
                    </p>
                    <p className="text-xs text-warm-300 mt-0.5">
                      {p.booking.load.cargoType} · {p.method.replace(/_/g, " ")}
                      {p.receiptNumber && ` · ${p.receiptNumber}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-warm-800">{formatPeso(p.amount)}</p>
                    <EscrowBadge status={p.status} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
