"use client"

import { useState, useMemo } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { useToast } from "@/components/ui/Toast"
import { formatPeso } from "@/lib/utils"
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface CancellationFlowProps {
  bookingId: string
  agreedRate: number
  pickupDate: string | Date
  onCancel?: (cancellation: { penaltyAmount: number; reason: string }) => void
}

const cancellationReasons = [
  { value: "CHANGE_OF_PLANS", label: "Change of plans" },
  { value: "FOUND_BETTER_RATE", label: "Found a better rate" },
  { value: "CARGO_NOT_READY", label: "Cargo not ready" },
  { value: "TRUCK_ISSUE", label: "Truck/vehicle issue" },
  { value: "WEATHER", label: "Weather conditions" },
  { value: "PERSONAL_EMERGENCY", label: "Personal emergency" },
  { value: "OTHER", label: "Other" },
]

export function CancellationFlow({
  bookingId,
  agreedRate,
  pickupDate,
  onCancel,
}: CancellationFlowProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const penaltyCalc = useMemo(() => {
    const now = new Date()
    const pickup = new Date(pickupDate)
    const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60)

    let rate = 0
    let label = ""
    let description = ""

    if (hoursUntilPickup <= 0) {
      rate = 0.25
      label = "Day-of cancellation"
      description = "25% penalty applies for cancellations on or after the pickup date"
    } else if (hoursUntilPickup < 24) {
      rate = 0.1
      label = "Less than 24 hours"
      description = "10% penalty applies for cancellations within 24 hours of pickup"
    } else {
      rate = 0
      label = "Free cancellation"
      description = "No penalty for cancellations more than 24 hours before pickup"
    }

    return {
      hoursUntilPickup: Math.max(0, Math.round(hoursUntilPickup)),
      rate,
      label,
      description,
      penaltyAmount: Math.round(agreedRate * rate),
    }
  }, [pickupDate, agreedRate])

  async function handleCancel() {
    if (!reason) {
      toast("error", "Please select a cancellation reason")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancellationReasons.find((r) => r.value === reason)?.label || reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Booking cancelled successfully")
        onCancel?.({
          penaltyAmount: data.data.penaltyAmount,
          reason: cancellationReasons.find((r) => r.value === reason)?.label || reason,
        })
      } else {
        toast("error", data.error || "Failed to cancel booking")
      }
    } catch {
      toast("error", "Failed to cancel booking")
    } finally {
      setIsSubmitting(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cancellation Policy */}
      <Card>
        <CardTitle>Cancellation Policy</CardTitle>
        <CardContent className="mt-3">
          <div className="space-y-3">
            {[
              {
                hours: "> 24 hours before pickup",
                penalty: "Free",
                isCurrent: penaltyCalc.hoursUntilPickup > 24,
                color: "indigo",
                icon: CheckCircleIcon,
              },
              {
                hours: "< 24 hours before pickup",
                penalty: "10% penalty",
                isCurrent: penaltyCalc.hoursUntilPickup > 0 && penaltyCalc.hoursUntilPickup <= 24,
                color: "amber",
                icon: ClockIcon,
              },
              {
                hours: "Day of pickup",
                penalty: "25% penalty",
                isCurrent: penaltyCalc.hoursUntilPickup <= 0,
                color: "red",
                icon: ExclamationTriangleIcon,
              },
            ].map((tier, i) => {
              const Icon = tier.icon
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    tier.isCurrent
                      ? `bg-${tier.color}-50 border-${tier.color}-200`
                      : "bg-white border-warm-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      tier.isCurrent ? `text-${tier.color}-500` : "text-slate-300"
                    )}
                  />
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", tier.isCurrent ? "text-warm-800" : "text-warm-300")}>
                      {tier.hours}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tier.isCurrent
                        ? tier.color === "indigo"
                          ? "text-indigo-600"
                          : tier.color === "amber"
                          ? "text-amber-600"
                          : "text-red-600"
                        : "text-slate-300"
                    )}
                  >
                    {tier.penalty}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className={cn(
        "border-l-4",
        penaltyCalc.rate === 0
          ? "border-l-indigo-600"
          : penaltyCalc.rate === 0.1
          ? "border-l-amber-500"
          : "border-l-red-500"
      )}>
        <CardContent>
          <p className="text-sm font-medium text-warm-800 mb-1">{penaltyCalc.label}</p>
          <p className="text-xs text-warm-400 mb-3">{penaltyCalc.description}</p>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-warm-300">Agreed Rate</p>
              <p className="text-sm font-medium text-warm-600">{formatPeso(agreedRate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-warm-300">Cancellation Fee</p>
              <p className={cn(
                "text-lg font-bold",
                penaltyCalc.penaltyAmount > 0 ? "text-red-600" : "text-indigo-600"
              )}>
                {penaltyCalc.penaltyAmount > 0
                  ? formatPeso(penaltyCalc.penaltyAmount)
                  : "Free"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reason Selection */}
      <Select
        label="Reason for Cancellation"
        value={reason}
        onChange={setReason}
        options={cancellationReasons}
        placeholder="Select a reason..."
      />

      {/* Cancel Button */}
      {!showConfirmation ? (
        <Button
          variant="danger"
          onClick={() => {
            if (!reason) {
              toast("error", "Please select a cancellation reason")
              return
            }
            setShowConfirmation(true)
          }}
          className="w-full"
        >
          Cancel Booking
        </Button>
      ) : (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent>
            <p className="text-sm font-medium text-red-800 mb-3">
              Are you sure you want to cancel this booking?
              {penaltyCalc.penaltyAmount > 0 && (
                <span>
                  {" "}
                  A cancellation fee of{" "}
                  <strong>{formatPeso(penaltyCalc.penaltyAmount)}</strong> will apply.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleCancel}
                isLoading={isSubmitting}
              >
                Yes, Cancel Booking
              </Button>
              <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
                Keep Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
