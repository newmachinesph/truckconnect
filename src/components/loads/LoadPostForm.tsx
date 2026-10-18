"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import { formatPeso } from "@/lib/utils"
import type { TruckType, RateBreakdown } from "@/types"

const TRUCK_TYPE_OPTIONS = [
  { value: "FOUR_WHEELER", label: "4-Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "6-Wheeler (Open)" },
  { value: "SIX_WHEELER_CLOSED", label: "6-Wheeler (Closed Van)" },
  { value: "TEN_WHEELER", label: "10-Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

// Default coords: Manila and Cebu
const DEFAULT_ORIGIN = { lat: 14.5995, lng: 120.9842 }
const DEFAULT_DEST = { lat: 10.3157, lng: 123.8854 }

interface LoadPostFormProps {
  onSuccess?: (loadId: string) => void
}

export function LoadPostForm({ onSuccess }: LoadPostFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateBreakdown, setRateBreakdown] = useState<RateBreakdown | null>(null)

  const [form, setForm] = useState({
    originAddress: "",
    destAddress: "",
    cargoType: "",
    weightTons: "",
    preferredTruck: "" as TruckType | "",
    pickupDate: "",
    originLat: DEFAULT_ORIGIN.lat,
    originLng: DEFAULT_ORIGIN.lng,
    destLat: DEFAULT_DEST.lat,
    destLng: DEFAULT_DEST.lng,
  })

  const allFieldsFilled =
    form.originAddress &&
    form.destAddress &&
    form.cargoType &&
    form.weightTons &&
    form.preferredTruck &&
    form.pickupDate

  // Fetch rate estimate when all required fields are filled
  useEffect(() => {
    if (!allFieldsFilled || !form.preferredTruck) return

    const controller = new AbortController()
    setRateLoading(true)

    fetch("/api/rate/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originLat: form.originLat,
        originLng: form.originLng,
        destLat: form.destLat,
        destLng: form.destLng,
        truckType: form.preferredTruck,
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRateBreakdown(data.data)
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Rate estimate failed:", err)
        }
      })
      .finally(() => setRateLoading(false))

    return () => controller.abort()
  }, [
    allFieldsFilled,
    form.originLat,
    form.originLng,
    form.destLat,
    form.destLng,
    form.preferredTruck,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allFieldsFilled) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAddress: form.originAddress,
          destAddress: form.destAddress,
          originLat: form.originLat,
          originLng: form.originLng,
          destLat: form.destLat,
          destLng: form.destLng,
          cargoType: form.cargoType,
          weightTons: parseFloat(form.weightTons),
          preferredTruck: form.preferredTruck,
          pickupDate: form.pickupDate,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post load")
      }

      toast("success", "Load posted successfully!")
      onSuccess?.(data.data.id)
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to post load")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Origin Address"
          placeholder="e.g. Manila Port Area"
          value={form.originAddress}
          onChange={(e) => updateField("originAddress", e.target.value)}
          required
        />
        <Input
          label="Destination Address"
          placeholder="e.g. Cebu City"
          value={form.destAddress}
          onChange={(e) => updateField("destAddress", e.target.value)}
          required
        />
      </div>

      {/* Hidden coordinate fields */}
      <input type="hidden" name="originLat" value={form.originLat} />
      <input type="hidden" name="originLng" value={form.originLng} />
      <input type="hidden" name="destLat" value={form.destLat} />
      <input type="hidden" name="destLng" value={form.destLng} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Cargo Type"
          placeholder="e.g. Electronics, Rice"
          value={form.cargoType}
          onChange={(e) => updateField("cargoType", e.target.value)}
          required
        />
        <Input
          label="Weight (tons)"
          type="number"
          min={0.1}
          step={0.1}
          placeholder="0.0"
          value={form.weightTons}
          onChange={(e) => updateField("weightTons", e.target.value)}
          required
        />
        <Select
          label="Preferred Truck Type"
          value={form.preferredTruck}
          onChange={(value) => updateField("preferredTruck", value)}
          options={TRUCK_TYPE_OPTIONS}
          placeholder="Select truck type"
        />
      </div>

      <Input
        label="Pickup Date"
        type="date"
        value={form.pickupDate}
        onChange={(e) => updateField("pickupDate", e.target.value)}
        required
      />

      {/* Rate estimate section */}
      {allFieldsFilled && (
        <Card className="bg-surface">
          <h4 className="text-sm font-medium text-warm-600 mb-2">Rate Estimate</h4>
          {rateLoading ? (
            <p className="text-sm text-warm-400">Calculating rate...</p>
          ) : rateBreakdown ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-500">Base Rate</span>
                <span className="font-mono">{formatPeso(rateBreakdown.baseRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">Fuel Surcharge</span>
                <span className="font-mono">{formatPeso(rateBreakdown.fuelSurcharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">Platform Fee</span>
                <span className="font-mono">{formatPeso(rateBreakdown.platformFeeShipper)}</span>
              </div>
              <hr className="border-warm-200 my-1" />
              <div className="flex justify-between font-semibold">
                <span className="text-warm-800">Total</span>
                <span className="font-mono text-indigo-600">
                  {formatPeso(rateBreakdown.totalShipperPays)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-warm-400">Unable to calculate rate</p>
          )}
        </Card>
      )}

      <Button type="submit" isLoading={isSubmitting} disabled={!allFieldsFilled} size="lg" className="w-full">
        Post Load
      </Button>
    </form>
  )
}
