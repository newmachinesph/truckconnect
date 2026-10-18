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
import { CheckoutFlow } from "@/components/payments/CheckoutFlow"
import { EscrowBadge } from "@/components/payments/EscrowBadge"
import { ReviewForm } from "@/components/reviews/ReviewForm"
import { useSession } from "next-auth/react"
import { formatPeso, formatDateTime } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

export default function ShipperBookingDetailPage() {
  const params = useParams()
  const bookingId = params.id as string
  const { data: session } = useSession()

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`)
      const data = await res.json()
      setBooking(data.data || data)
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

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
  const isCompleted = booking.status === "COMPLETED" || booking.status === "DELIVERED"
  const truckerName = booking.truckerProfile?.user?.name || "Trucker"
  const truckerUserId = booking.truckerProfile?.userId

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
          {/* Booking Detail Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Shipment Info</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(booking.status ?? "PENDING")}>
                  {(booking.status ?? "PENDING").replace(/_/g, " ")}
                </Badge>
              </div>
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
                  <p className="text-xs font-medium text-warm-300 uppercase">Agreed Rate</p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-600">
                    {formatPeso(booking.agreedRate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-300 uppercase">Trucker</p>
                  <p className="mt-0.5 text-sm text-warm-600">{truckerName}</p>
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

          {/* Payment Section */}
          {isConfirmed && !paymentDone && (
            <Card>
              <CardTitle className="mb-4">Payment</CardTitle>
              <CardContent>
                {showPayment ? (
                  <CheckoutFlow
                    bookingId={bookingId}
                    agreedRate={booking.agreedRate}
                    platformFee={booking.platformFeeShipper}
                    onPaymentComplete={() => {
                      setPaymentDone(true)
                      fetchBooking()
                    }}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-warm-400 mb-3">
                      Secure your booking by paying {formatPeso(booking.agreedRate + booking.platformFeeShipper)}
                    </p>
                    <Button onClick={() => setShowPayment(true)}>
                      Proceed to Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {paymentDone && (
            <Card>
              <CardContent>
                <EscrowBadge status="ESCROW_HELD" amount={booking.agreedRate + booking.platformFeeShipper} />
              </CardContent>
            </Card>
          )}

          {/* Live Tracking */}
          {isInTransit && (
            <Card>
              <CardTitle className="mb-4">Live Tracking</CardTitle>
              <div className="h-64 rounded-lg bg-warm-100 flex items-center justify-center">
                <p className="text-sm text-warm-300">
                  Map will display live GPS tracking here
                </p>
              </div>
            </Card>
          )}

          {/* Review Section */}
          {isCompleted && truckerUserId && session?.user?.id && (
            <Card>
              <CardTitle className="mb-4">Leave a Review</CardTitle>
              <CardContent>
                <ReviewForm
                  bookingId={bookingId}
                  revieweeId={truckerUserId}
                  revieweeName={truckerName}
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
