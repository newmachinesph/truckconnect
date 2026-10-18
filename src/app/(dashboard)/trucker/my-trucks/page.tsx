"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Truck } from "@/types"

const truckTypeOptions = [
  { value: "FOUR_WHEELER", label: "Four Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "Six Wheeler Open" },
  { value: "SIX_WHEELER_CLOSED", label: "Six Wheeler Closed" },
  { value: "TEN_WHEELER", label: "Ten Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

export default function MyTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    plateNumber: "",
    truckType: "",
    capacityTons: "",
  })

  useEffect(() => {
    fetchTrucks()
  }, [])

  async function fetchTrucks() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/trucks")
      const data = await res.json()
      setTrucks(data.data || data || [])
    } catch {
      setTrucks([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddTruck(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: form.plateNumber,
          truckType: form.truckType,
          capacityTons: parseFloat(form.capacityTons) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to add truck.")
        return
      }

      const data = await res.json()
      setTrucks((prev) => [...prev, data.data || data])
      setIsModalOpen(false)
      setForm({ plateNumber: "", truckType: "", capacityTons: "" })
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-800">My Trucks</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Truck
        </Button>
      </div>

      {trucks.length === 0 ? (
        <EmptyState
          title="No trucks registered"
          description="Add your first truck to start accepting loads."
          action={
            <Button onClick={() => setIsModalOpen(true)}>Add Your First Truck</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <Card key={truck.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-warm-800">{truck.plateNumber}</p>
                  <p className="text-sm text-warm-400 mt-0.5">
                    {truck.truckType?.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge variant={truck.isVerified ? "confirmed" : "default"}>
                  {truck.isVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-warm-500">
                <div className="flex justify-between">
                  <span>Capacity</span>
                  <span className="font-medium">{truck.capacityTons?.toLocaleString()} tons</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Truck Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add a Truck"
      >
        <form onSubmit={handleAddTruck} className="space-y-4">
          <Input
            label="Plate Number"
            placeholder="e.g., ABC 1234"
            value={form.plateNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, plateNumber: e.target.value }))}
            required
          />
          <Select
            label="Truck Type"
            value={form.truckType}
            onChange={(val) => setForm((prev) => ({ ...prev, truckType: val }))}
            options={truckTypeOptions}
            placeholder="Select truck type..."
          />
          <Input
            label="Capacity (tons)"
            type="number"
            placeholder="e.g., 10000"
            value={form.capacityTons}
            onChange={(e) => setForm((prev) => ({ ...prev, capacityTons: e.target.value }))}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Add Truck
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
