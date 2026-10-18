"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"

const TRUCK_TYPE_OPTIONS = [
  { value: "FOUR_WHEELER", label: "4-Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "6-Wheeler (Open)" },
  { value: "SIX_WHEELER_CLOSED", label: "6-Wheeler (Closed Van)" },
  { value: "TEN_WHEELER", label: "10-Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

interface BackhaulPostFormProps {
  onSuccess?: (id: string) => void
}

export function BackhaulPostForm({ onSuccess }: BackhaulPostFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    originAddress: "",
    destAddress: "",
    truckType: "",
    availableTons: "",
    discountedRate: "",
    departureTime: "",
    expiresAt: "",
  })

  const allFieldsFilled =
    form.originAddress &&
    form.destAddress &&
    form.truckType &&
    form.availableTons &&
    form.discountedRate &&
    form.departureTime &&
    form.expiresAt

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allFieldsFilled) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/backhaul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAddress: form.originAddress,
          destAddress: form.destAddress,
          truckType: form.truckType,
          availableTons: parseFloat(form.availableTons),
          discountedRate: parseFloat(form.discountedRate),
          departureTime: form.departureTime,
          expiresAt: form.expiresAt,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post backhaul offer")
      }

      toast("success", "Backhaul offer posted successfully!")
      onSuccess?.(data.data.id)
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to post backhaul offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Origin Address"
          placeholder="e.g. Cebu City"
          value={form.originAddress}
          onChange={(e) => updateField("originAddress", e.target.value)}
          required
        />
        <Input
          label="Destination Address"
          placeholder="e.g. Manila"
          value={form.destAddress}
          onChange={(e) => updateField("destAddress", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Truck Type"
          value={form.truckType}
          onChange={(value) => updateField("truckType", value)}
          options={TRUCK_TYPE_OPTIONS}
          placeholder="Select truck type"
        />
        <Input
          label="Available Capacity (tons)"
          type="number"
          min={0.1}
          step={0.1}
          placeholder="0.0"
          value={form.availableTons}
          onChange={(e) => updateField("availableTons", e.target.value)}
          required
        />
        <Input
          label="Discounted Rate (PHP)"
          type="number"
          min={0}
          step={100}
          placeholder="0"
          value={form.discountedRate}
          onChange={(e) => updateField("discountedRate", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Departure Time"
          type="datetime-local"
          value={form.departureTime}
          onChange={(e) => updateField("departureTime", e.target.value)}
          required
        />
        <Input
          label="Offer Expires At"
          type="datetime-local"
          value={form.expiresAt}
          onChange={(e) => updateField("expiresAt", e.target.value)}
          required
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} disabled={!allFieldsFilled} size="lg" className="w-full">
        Post Backhaul Offer
      </Button>
    </form>
  )
}
