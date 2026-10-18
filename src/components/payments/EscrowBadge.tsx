"use client"

import { Badge } from "@/components/ui/Badge"

interface EscrowBadgeProps {
  status: string
  amount?: number
  className?: string
}

const escrowConfig: Record<string, { variant: "open" | "confirmed" | "in_transit" | "delivered" | "cancelled" | "default"; label: string }> = {
  PENDING: { variant: "default", label: "Payment Pending" },
  ESCROW_HELD: { variant: "in_transit", label: "In Escrow" },
  RELEASED: { variant: "delivered", label: "Released" },
  REFUNDED: { variant: "cancelled", label: "Refunded" },
  FAILED: { variant: "cancelled", label: "Failed" },
}

export function EscrowBadge({ status, amount, className }: EscrowBadgeProps) {
  const config = escrowConfig[status] ?? escrowConfig.PENDING

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Badge variant={config.variant}>{config.label}</Badge>
      {amount && (
        <span className="text-sm font-medium text-warm-500">
          ₱{amount.toLocaleString()}
        </span>
      )}
      {status === "ESCROW_HELD" && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          Demo: Auto-held
        </span>
      )}
    </div>
  )
}
