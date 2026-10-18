"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

const LoadVisualizer = dynamic(
  () => import("@/components/three/LoadVisualizer").then(m => ({ default: m.LoadVisualizer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-xl border border-warm-200 bg-surface flex items-center justify-center text-sm text-warm-300">
        Loading 3D view...
      </div>
    ),
  }
)
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { ChatWindow } from "@/components/messaging/ChatWindow"
import { EPODFlow } from "@/components/bookings/EPODFlow"
import { EscrowBadge } from "@/components/payments/EscrowBadge"
import { ReviewForm } from "@/components/reviews/ReviewForm"
import { useSession } from "next-auth/react"
import { formatPeso, formatDateTime } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

export default function TruckerBookingDetailPage() {
  const params = useParams()
  const bookingId = params.id as string
  const { data: session } = useSession()

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isTrackingGps, setIsTrackingGps] = useState(false)
  const [showEpod, setShowEpod] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`)
      const data = await res.json()
      setBooking(data.data || data)
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  async function updateStatus(status: string) {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setBooking(data.data || data)
      }
    } catch {
      // Handle silently
    } finally {
      setIsUpdating(false)
    }
  }

  function toggleGpsTracking() {
    if (isTrackingGps) {
      setIsTrackingGps(false)
      return
    }

    if ("geolocation" in navigator) {
      setIsTrackingGps(true)
      navigator.geolocation.watchPosition(
        (position) => {
          fetch(`/api/bookings/${bookingId}/tracking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          }).catch(() => {})
        },
        () => {
          setIsTrackingGps(false)
        },
        { enableHighAccuracy: true }
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card className="p-8 text-center">
          <p className="text-warm-400">Booking not found.</p>
        </Card>
      </div>
    )
  }

  const isConfirmed = booking.status === "CONFIRMED"
  const isInTransit = booking.status === "IN_TRANSIT"
  const isDelivered = booking.status === "DELIVERED"
  const isCompleted = booking.status === "COMPLETED"
  const shipperName = booking.load.shipperProfile?.user?.name || "Shipper"
  const shipperUserId = booking.load.shipperProfile?.userId
  const netEarning = booking.agreedRate - booking.platformFeeTrucker

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-800">Booking Details</h1>
        <p className="mt-1 text-sm text-warm-400">
          Waybill #{booking.waybillNumber?.slice(0, 10) ?? bookingId.slice(0, 8)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Info */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Shipment Info</CardTitle>
              <Badge variant={getStatusVariant(booking.status)}>
                {booking.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Origin</p>
                  <p className="mt-0.5 text-sm font-medium text-warm-800">
                    {booking.load.originAddress}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Destination</p>
                  <p className="mt-0.5 text-sm font-medium text-warm-800">
                    {booking.load.destAddress}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Truck Type</p>
                  <p className="mt-0.5 text-sm text-warm-600">
                    {booking.load.preferredTruck?.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Your Earnings</p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-600">
                    {formatPeso(netEarning)}
                    <span className="text-xs text-warm-300 font-normal ml-1">
                      (after {formatPeso(booking.platformFeeTrucker)} fee)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Shipper</p>
                  <p className="mt-0.5 text-sm text-warm-600">{shipperName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Booked At</p>
                  <p className="mt-0.5 text-sm text-warm-600">
                    {formatDateTime(booking.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LoadVisualizer
            truckType={booking.load.preferredTruck || "TEN_WHEELER"}
            cargoType={booking.load.cargoType}
            weightTons={booking.load.weightTons}
          />

          {/* Status Action Buttons */}
          <Card>
            <CardTitle className="mb-4">Actions</CardTitle>
            <div className="flex flex-wrap gap-3">
              {isConfirmed && (
                <Button
                  onClick={() => updateStatus("IN_TRANSIT")}
                  isLoading={isUpdating}
                >
                  Start Transit
                </Button>
              )}
              {isInTransit && (
                <>
                  <Button
                    onClick={() => updateStatus("DELIVERED")}
                    isLoading={isUpdating}
                  >
                    Mark Delivered
                  </Button>
                  <Button
                    variant={isTrackingGps ? "danger" : "secondary"}
                    onClick={toggleGpsTracking}
                  >
                    {isTrackingGps ? "Stop GPS Sharing" : "Start GPS Sharing"}
                  </Button>
                </>
              )}
              {isDelivered && !showEpod && (
                <Button onClick={() => setShowEpod(true)}>
                  Submit ePOD
                </Button>
              )}
              {!isConfirmed && !isInTransit && !isDelivered && !isCompleted && (
                <p className="text-sm text-warm-400">No actions available for this status.</p>
              )}
            </div>
          </Card>

          {/* Enhanced E-POD Flow */}
          {isDelivered && showEpod && (
            <Card>
              <CardTitle className="mb-4">Electronic Proof of Delivery</CardTitle>
              <CardContent>
                <EPODFlow
                  bookingId={bookingId}
                  onComplete={() => {
                    setShowEpod(false)
                    fetchBooking()
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Escrow Status */}
          {(isInTransit || isDelivered || isCompleted) && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-warm-600">Payment Status</span>
                  <EscrowBadge
                    status={isCompleted ? "RELEASED" : "ESCROW_HELD"}
                    amount={netEarning}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {isCompleted && shipperUserId && session?.user?.id && (
            <Card>
              <CardTitle className="mb-4">Leave a Review</CardTitle>
              <CardContent>
                <ReviewForm
                  bookingId={bookingId}
                  revieweeId={shipperUserId}
                  revieweeName={shipperName}
                  onSubmitted={fetchBooking}
                />
              </CardContent>
            </Card>
          )}

          {/* Waybill */}
          <Card>
            <CardTitle className="mb-4">Waybill</CardTitle>
            <CardContent>
              <div className="rounded-lg border border-dashed border-warm-200 p-6 text-center">
                <p className="text-sm text-warm-400">
                  Waybill #{booking.waybillNumber}
                </p>
                <Button variant="secondary" className="mt-3" size="sm">
                  Download Waybill
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardTitle className="mb-2 px-4 pt-4">Messages</CardTitle>
            {session?.user?.id && (
              <ChatWindow
                bookingId={bookingId}
                currentUserId={session.user.id}
                className="h-[460px]"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
