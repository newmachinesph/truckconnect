import { Card } from "@/components/ui/Card"
import { formatPeso } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { RateBreakdown as RateBreakdownType } from "@/types"

interface RateBreakdownProps {
  breakdown: RateBreakdownType
  className?: string
}

export function RateBreakdown({ breakdown, className }: RateBreakdownProps) {
  const lineItems = [
    { label: "Base Rate", amount: breakdown.baseRate },
    { label: "Fuel Surcharge", amount: breakdown.fuelSurcharge },
    { label: "Platform Fee", amount: breakdown.platformFeeShipper },
  ]

  return (
    <Card className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-warm-800 uppercase tracking-wide">
        Rate Breakdown
      </h3>

      <div className="space-y-2">
        {lineItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-warm-500">{item.label}</span>
            <span className="font-mono text-warm-800">{formatPeso(item.amount)}</span>
          </div>
        ))}
      </div>

      <hr className="border-warm-200" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-warm-800">Total</span>
        <span className="text-3xl font-mono text-indigo-600">
          {formatPeso(breakdown.totalShipperPays)}
        </span>
      </div>

      {breakdown.baseRatePerKm > 0 && (
        <p className="text-xs text-warm-300 text-right">
          {formatPeso(breakdown.baseRatePerKm)}/km &middot; {breakdown.distanceKm} km
        </p>
      )}
    </Card>
  )
}
