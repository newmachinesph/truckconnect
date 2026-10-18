"use client"

import { cn, formatPeso, formatDate } from "@/lib/utils"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import type { TruckType, BookingStatus } from "@/types"

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed Van)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

interface WaybillProps {
  waybillNumber: string
  status: BookingStatus
  originAddress: string
  destAddress: string
  cargoType: string
  weightTons: number
  truckType: TruckType
  agreedRate: number
  pickupDate: string | Date
  shipperName: string
  truckerName: string
  className?: string
}

export function Waybill({
  waybillNumber,
  status,
  originAddress,
  destAddress,
  cargoType,
  weightTons,
  truckType,
  agreedRate,
  pickupDate,
  shipperName,
  truckerName,
  className,
}: WaybillProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-2 border-slate-300 rounded-lg bg-white p-6 md:p-8 print:border print:shadow-none">
        {/* Header */}
        <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
          <h1 className="text-lg font-bold text-warm-800 uppercase tracking-wider">
            TruckConnect PH - Digital Waybill
          </h1>
          <p className="text-3xl font-mono font-bold text-warm-800 mt-2">{waybillNumber}</p>
          <div className="mt-2">
            <Badge variant={getStatusVariant(status)} className="text-sm px-3 py-1">
              {status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">From</p>
            <p className="text-sm font-medium text-warm-800">{originAddress}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">To</p>
            <p className="text-sm font-medium text-warm-800">{destAddress}</p>
          </div>
        </div>

        {/* Cargo Details Table */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-2">
            Cargo Details
          </p>
          <table className="w-full text-sm border border-warm-200">
            <thead>
              <tr className="bg-surface">
                <th className="text-left px-3 py-2 border-b border-warm-200 font-medium text-warm-600">
                  Cargo Type
                </th>
                <th className="text-left px-3 py-2 border-b border-warm-200 font-medium text-warm-600">
                  Weight
                </th>
                <th className="text-left px-3 py-2 border-b border-warm-200 font-medium text-warm-600">
                  Truck Type
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-warm-100 text-warm-800">{cargoType}</td>
                <td className="px-3 py-2 border-b border-warm-100 text-warm-800">{weightTons} tons</td>
                <td className="px-3 py-2 border-b border-warm-100 text-warm-800">
                  {TRUCK_TYPE_LABELS[truckType]}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">
              Shipper
            </p>
            <p className="text-sm font-medium text-warm-800">{shipperName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">
              Trucker
            </p>
            <p className="text-sm font-medium text-warm-800">{truckerName}</p>
          </div>
        </div>

        {/* Rate and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-slate-300 pt-4">
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">
              Pickup Date
            </p>
            <p className="text-sm font-medium text-warm-800">{formatDate(pickupDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">
              Agreed Rate
            </p>
            <p className="text-2xl font-mono font-bold text-indigo-600">{formatPeso(agreedRate)}</p>
          </div>
        </div>
      </div>

      {/* Print button (hidden in print) */}
      <div className="flex justify-end print:hidden">
        <Button variant="secondary" onClick={handlePrint}>
          Print Waybill
        </Button>
      </div>
    </div>
  )
}
