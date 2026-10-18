"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"

const truckTypeOptions = [
  { value: "FOUR_WHEELER", label: "Four Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "Six Wheeler Open" },
  { value: "SIX_WHEELER_CLOSED", label: "Six Wheeler Closed" },
  { value: "TEN_WHEELER", label: "Ten Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

export default function PostLoadPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    originAddress: "",
    originLat: "",
    originLng: "",
    destAddress: "",
    destLat: "",
    destLng: "",
    preferredTruck: "",
    cargoType: "",
    weightTons: "",
    pickupDate: "",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAddress: form.originAddress,
          originLat: parseFloat(form.originLat) || 14.5995,
          originLng: parseFloat(form.originLng) || 120.9842,
          destAddress: form.destAddress,
          destLat: parseFloat(form.destLat) || 10.3157,
          destLng: parseFloat(form.destLng) || 123.8854,
          cargoType: form.cargoType || "General",
          weightTons: parseFloat(form.weightTons) || 1,
          preferredTruck: form.preferredTruck || undefined,
          pickupDate: form.pickupDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to post load.")
        return
      }

      router.push("/shipper/my-loads")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-6">Post a New Load</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin */}
              <div>
                <h2 className="text-sm font-semibold text-warm-800 uppercase tracking-wide mb-3">
                  Pickup Location
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Address"
                    placeholder="e.g., Manila, Metro Manila"
                    value={form.originAddress}
                    onChange={(e) => updateField("originAddress", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <h2 className="text-sm font-semibold text-warm-800 uppercase tracking-wide mb-3">
                  Delivery Location
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Address"
                    placeholder="e.g., Cebu City, Cebu"
                    value={form.destAddress}
                    onChange={(e) => updateField("destAddress", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Cargo Details */}
              <div>
                <h2 className="text-sm font-semibold text-warm-800 uppercase tracking-wide mb-3">
                  Cargo Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Truck Type"
                    value={form.preferredTruck}
                    onChange={(val) => updateField("preferredTruck", val)}
                    options={truckTypeOptions}
                    placeholder="Select truck type..."
                  />
                  <Input
                    label="Weight (tons)"
                    type="number"
                    placeholder="e.g., 5"
                    value={form.weightTons}
                    onChange={(e) => updateField("weightTons", e.target.value)}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Cargo Type"
                    placeholder="e.g., Electronics, Food, Construction Materials"
                    value={form.cargoType}
                    onChange={(e) => updateField("cargoType", e.target.value)}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h2 className="text-sm font-semibold text-warm-800 uppercase tracking-wide mb-3">
                  Schedule
                </h2>
                <Input
                  label="Pickup Date"
                  type="date"
                  value={form.pickupDate}
                  onChange={(e) => updateField("pickupDate", e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                Post Load
              </Button>
            </form>
          </Card>
        </div>

        {/* Tips Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardTitle>Tips for Posting</CardTitle>
            <CardContent className="mt-3 space-y-3">
              <div>
                <p className="font-medium text-warm-600">Be specific about cargo</p>
                <p className="text-xs text-warm-400">
                  Include dimensions, weight, and any special handling requirements.
                </p>
              </div>
              <div>
                <p className="font-medium text-warm-600">Choose the right truck type</p>
                <p className="text-xs text-warm-400">
                  Matching truck type ensures accurate pricing and better trucker matches.
                </p>
              </div>
              <div>
                <p className="font-medium text-warm-600">Set a realistic pickup date</p>
                <p className="text-xs text-warm-400">
                  Loads with flexible dates tend to get more competitive rates.
                </p>
              </div>
              <div>
                <p className="font-medium text-warm-600">Provide complete addresses</p>
                <p className="text-xs text-warm-400">
                  Accurate locations help truckers plan their routes efficiently.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
