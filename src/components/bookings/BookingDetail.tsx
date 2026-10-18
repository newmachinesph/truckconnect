"use client"

import { MapPinIcon, TruckIcon, DocumentTextIcon } from "@heroicons/react/24/outline"
import { cn, formatPeso, formatDate } from "@/lib/utils"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import type { TruckType, BookingStatus } from "@/types"

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed Van)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

interface BookingDetailProps {
  booking: {
    id: string
    waybillNumber: string
    status: BookingStatus
    agreedRate: number
    pickupDate: string | Date
    epodUrl: string | null
    load: {
      originAddress: string
      destAddress: string
      cargoType: string
      weightTons: number
      preferredTruck: TruckType
      shipperProfile: {
        businessName: string
        user: { name: string | null; image: string | null }
      }
    }
    truckerProfile: {
      user: { name: string | null; image: string | null }
    }
  }
  onMarkInTransit?: () => void
  onMarkDelivered?: () => void
  onUploadEpod?: () => void
  isLoading?: boolean
}

export function BookingDetail({
  booking,
  onMarkInTransit,
  onMarkDelivered,
  onUploadEpod,
  isLoading,
}: BookingDetailProps) {
  const { load } = booking

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-warm-300 uppercase tracking-wide">Waybill</p>
          <p className="text-xl font-mono font-semibold text-warm-800">{booking.waybillNumber}</p>
        </div>
        <Badge variant={getStatusVariant(booking.status)} className="text-sm px-3 py-1">
          {booking.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Route */}
      <Card>
        <CardHeader>
          <CardTitle>Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-5 w-5 shrink-0 text-indigo-600" />
            <span className="font-medium text-warm-800">{load.originAddress}</span>
            <span className="text-warm-300 mx-1">&rarr;</span>
            <MapPinIcon className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-medium text-warm-800">{load.destAddress}</span>
          </div>
        </CardContent>
      </Card>

      {/* People */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Shipper</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-warm-800">{load.shipperProfile.businessName}</p>
            <p className="text-warm-400">{load.shipperProfile.user.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trucker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-warm-800">
              {booking.truckerProfile.user.name || "Unassigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cargo details */}
      <Card>
        <CardHeader>
          <CardTitle>Cargo Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-warm-400">Cargo Type</dt>
              <dd className="font-medium text-warm-800">{load.cargoType}</dd>
            </div>
            <div>
              <dt className="text-warm-400">Weight</dt>
              <dd className="font-medium text-warm-800">{load.weightTons} tons</dd>
            </div>
            <div>
              <dt className="text-warm-400">Truck Type</dt>
              <dd className="font-medium text-warm-800 inline-flex items-center gap-1">
                <TruckIcon className="h-4 w-4 text-warm-300" />
                {TRUCK_TYPE_LABELS[load.preferredTruck]}
              </dd>
            </div>
            <div>
              <dt className="text-warm-400">Pickup Date</dt>
              <dd className="font-medium text-warm-800">{formatDate(booking.pickupDate)}</dd>
            </div>
            <div>
              <dt className="text-warm-400">Agreed Rate</dt>
              <dd className="font-mono font-semibold text-indigo-600 text-base">
                {formatPeso(booking.agreedRate)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ePOD Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-warm-300" />
            Electronic Proof of Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booking.epodUrl ? (
            <div className="space-y-2">
              <img
                src={booking.epodUrl}
                alt="Proof of delivery"
                className="rounded-md border border-warm-200 max-h-64 object-contain"
              />
              <p className="text-xs text-warm-300">ePOD uploaded</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-warm-400 mb-3">No proof of delivery uploaded yet</p>
              {onUploadEpod && (
                <Button variant="secondary" size="sm" onClick={onUploadEpod}>
                  Upload ePOD
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status actions */}
      <div className="flex flex-wrap gap-3">
        {booking.status === "CONFIRMED" && onMarkInTransit && (
          <Button onClick={onMarkInTransit} isLoading={isLoading}>
            Mark In Transit
          </Button>
        )}
        {booking.status === "IN_TRANSIT" && onMarkDelivered && (
          <Button onClick={onMarkDelivered} isLoading={isLoading}>
            Mark Delivered
          </Button>
        )}
      </div>
    </div>
  )
}
