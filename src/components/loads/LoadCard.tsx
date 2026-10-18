import { MapPinIcon, TruckIcon } from "@heroicons/react/24/outline"
import { cn, formatPeso, formatDate } from "@/lib/utils"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import type { TruckType, LoadStatus } from "@/types"

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed Van)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

interface LoadCardProps {
  id: string
  originAddress: string
  destAddress: string
  cargoType: string
  weightTons: number
  preferredTruck: TruckType
  pickupDate: string | Date
  rateEstimate: number | null
  status: LoadStatus
  shipperName: string
  onAccept?: (loadId: string) => void
  className?: string
}

export function LoadCard({
  id,
  originAddress,
  destAddress,
  cargoType,
  weightTons,
  preferredTruck,
  pickupDate,
  rateEstimate,
  status,
  shipperName,
  onAccept,
  className,
}: LoadCardProps) {
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
            <span>{cargoType}</span>
            <span>{weightTons} tons</span>
            <span className="inline-flex items-center gap-1">
              <TruckIcon className="h-4 w-4 text-warm-300" />
              {TRUCK_TYPE_LABELS[preferredTruck]}
            </span>
            <span>Pickup: {formatDate(pickupDate)}</span>
          </div>

          {/* Shipper */}
          <p className="text-xs text-warm-300">Posted by {shipperName}</p>
        </div>

        {/* Right side: rate + status + action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant={getStatusVariant(status)}>{status.replace("_", " ")}</Badge>

          {rateEstimate !== null && (
            <span className="text-lg font-mono font-semibold text-indigo-600">
              {formatPeso(rateEstimate)}
            </span>
          )}

          {onAccept && status === "OPEN" && (
            <Button size="sm" onClick={() => onAccept(id)}>
              Accept Load
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
