import { MapPinIcon, TruckIcon, ClockIcon } from "@heroicons/react/24/outline"
import { cn, formatPeso, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import type { TruckType } from "@/types"

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed Van)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

function getExpiryCountdown(expiresAt: string | Date): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return "Expired"

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

interface BackhaulCardProps {
  id: string
  originAddress: string
  destAddress: string
  truckType: TruckType
  availableTons: number
  discountedRate: number
  departureTime: string | Date
  expiresAt: string | Date
  truckerName: string
  onBook?: (id: string) => void
  className?: string
}

export function BackhaulCard({
  id,
  originAddress,
  destAddress,
  truckType,
  availableTons,
  discountedRate,
  departureTime,
  expiresAt,
  truckerName,
  onBook,
  className,
}: BackhaulCardProps) {
  const isExpired = new Date(expiresAt).getTime() <= Date.now()

  return (
    <Card interactive className={cn("hover:shadow-md hover:border-indigo-200", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Route */}
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 shrink-0 text-indigo-600" />
            <span className="font-medium text-warm-800 truncate">{originAddress}</span>
            <span className="text-warm-300 shrink-0">&rarr;</span>
            <MapPinIcon className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-medium text-warm-800 truncate">{destAddress}</span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-500">
            <span className="inline-flex items-center gap-1">
              <TruckIcon className="h-4 w-4 text-warm-300" />
              {TRUCK_TYPE_LABELS[truckType]}
            </span>
            <span>{availableTons} tons available</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-warm-300" />
              Departs: {formatDateTime(departureTime)}
            </span>
          </div>

          {/* Trucker */}
          <p className="text-xs text-warm-300">Offered by {truckerName}</p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant="confirmed">Discounted</Badge>

          <span className="text-lg font-mono font-semibold text-indigo-600">
            {formatPeso(discountedRate)}
          </span>

          <p className={cn("text-xs", isExpired ? "text-red-500" : "text-amber-600")}>
            {getExpiryCountdown(expiresAt)}
          </p>

          {onBook && !isExpired && (
            <Button size="sm" onClick={() => onBook(id)}>
              Book This
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
