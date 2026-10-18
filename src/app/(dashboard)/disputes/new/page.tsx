"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import { formatDate, formatPeso } from "@/lib/utils"
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline"

const disputeTypes = [
  { value: "CARGO_DAMAGE", label: "Cargo Damage" },
  { value: "LATE_DELIVERY", label: "Late Delivery" },
  { value: "DETENTION_FEE", label: "Detention Fee" },
  { value: "CARGO_MISREPRESENTATION", label: "Cargo Misrepresentation" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "OTHER", label: "Other" },
]

type BookingOption = {
  id: string
  waybillNumber: string
  agreedRate: number
  status: string
  load: {
    cargoType: string
    originAddress: string
    destAddress: string
    pickupDate: string
  }
}

export default function FileDisputePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<BookingOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedBooking, setSelectedBooking] = useState("")
  const [disputeType, setDisputeType] = useState("")
  const [description, setDescription] = useState("")
  const [evidenceNotes, setEvidenceNotes] = useState("")
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState("")

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings")
        const data = await res.json()
        if (data.success || data.data) {
          const allBookings = data.data || []
          // Show recent completed/delivered bookings for dispute filing
          const eligible = allBookings.filter(
            (b: BookingOption) =>
              b.status === "DELIVERED" || b.status === "COMPLETED" || b.status === "IN_TRANSIT"
          )
          setBookings(eligible)
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBookings()
  }, [])

  function addPhotoUrl() {
    if (newPhotoUrl.trim()) {
      setPhotoUrls((prev) => [...prev, newPhotoUrl.trim()])
      setNewPhotoUrl("")
    }
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedBooking) {
      toast("error", "Please select a booking")
      return
    }
    if (!disputeType) {
      toast("error", "Please select a dispute type")
      return
    }
    if (!description.trim()) {
      toast("error", "Please provide a description")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking,
          type: disputeType,
          description: description.trim(),
          evidencePhotos: photoUrls,
          evidenceNotes: evidenceNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Dispute filed successfully")
        router.push("/disputes")
      } else {
        toast("error", data.error || "Failed to file dispute")
      }
    } catch {
      toast("error", "Failed to file dispute")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoading />

  const selectedBookingData = bookings.find((b) => b.id === selectedBooking)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/disputes")}
        className="flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-600 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Disputes
      </button>

      <div>
        <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">File New Dispute</h1>
        <p className="text-sm text-warm-400 mt-1">
          Report an issue with a booking for review by our team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Booking */}
        <Card>
          <CardTitle>Select Booking</CardTitle>
          <CardContent className="mt-3">
            <Select
              label="Booking"
              value={selectedBooking}
              onChange={setSelectedBooking}
              placeholder="Select a booking..."
              options={bookings.map((b) => ({
                value: b.id,
                label: `${b.waybillNumber} - ${b.load.cargoType} (${formatDate(b.load.pickupDate)})`,
              }))}
            />

            {selectedBookingData && (
              <div className="mt-4 p-3 bg-surface rounded-lg text-sm space-y-1">
                <p className="text-warm-600">
                  <span className="text-warm-300">From:</span> {selectedBookingData.load.originAddress}
                </p>
                <p className="text-warm-600">
                  <span className="text-warm-300">To:</span> {selectedBookingData.load.destAddress}
                </p>
                <p className="text-warm-600">
                  <span className="text-warm-300">Rate:</span> {formatPeso(selectedBookingData.agreedRate)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dispute Details */}
        <Card>
          <CardTitle>Dispute Details</CardTitle>
          <CardContent className="mt-3 space-y-4">
            <Select
              label="Dispute Type"
              value={disputeType}
              onChange={setDisputeType}
              placeholder="Select type..."
              options={disputeTypes}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={5}
            />
          </CardContent>
        </Card>

        {/* Evidence */}
        <Card>
          <CardTitle>Evidence</CardTitle>
          <CardContent className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-600 mb-1">
                Evidence Photo URLs
              </label>
              <p className="text-xs text-warm-300 mb-2">
                Add URLs to photos that support your dispute
              </p>

              {/* Added photos */}
              {photoUrls.length > 0 && (
                <div className="space-y-2 mb-3">
                  {photoUrls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-surface rounded-md text-sm"
                    >
                      <span className="flex-1 truncate text-warm-500">{url}</span>
                      <button
                        type="button"
                        onClick={() => removePhotoUrl(i)}
                        className="text-warm-300 hover:text-red-500 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={addPhotoUrl}>
                  Add
                </Button>
              </div>
            </div>

            <Textarea
              label="Evidence Notes"
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              placeholder="Any additional notes about the evidence..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting} size="lg">
            File Dispute
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.push("/disputes")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
