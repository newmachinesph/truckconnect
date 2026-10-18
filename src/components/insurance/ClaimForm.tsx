"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/Toast"
import { formatPeso } from "@/lib/utils"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface ClaimFormProps {
  policy: {
    id: string
    tier: string
    declaredValue: number
    coverageMax: number
    booking: {
      waybillNumber: string
      load: {
        cargoType: string
        originAddress: string
        destAddress: string
      }
    }
  }
  onSuccess: () => void
  onCancel: () => void
}

export function ClaimForm({ policy, onSuccess, onCancel }: ClaimFormProps) {
  const { toast } = useToast()
  const [claimNotes, setClaimNotes] = useState("")
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (!claimNotes.trim()) {
      toast("error", "Please describe the incident")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/insurance/${policy.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimNotes: claimNotes.trim(),
          claimPhotos: photoUrls,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Claim filed successfully. Our team will review it shortly.")
        onSuccess()
      } else {
        toast("error", data.error || "Failed to file claim")
      }
    } catch {
      toast("error", "Failed to file claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Policy Summary */}
      <div className="p-3 bg-surface rounded-lg text-sm space-y-1">
        <p className="text-warm-600">
          <span className="text-warm-300">Policy:</span>{" "}
          {policy.tier === "BASIC" ? "Basic" : "Comprehensive"} Coverage
        </p>
        <p className="text-warm-600">
          <span className="text-warm-300">Booking:</span> {policy.booking.waybillNumber}
        </p>
        <p className="text-warm-600">
          <span className="text-warm-300">Cargo:</span> {policy.booking.load.cargoType}
        </p>
        <p className="text-warm-600">
          <span className="text-warm-300">Coverage:</span> Up to {formatPeso(policy.coverageMax)}
        </p>
      </div>

      {/* Incident Description */}
      <Textarea
        label="Incident Description"
        value={claimNotes}
        onChange={(e) => setClaimNotes(e.target.value)}
        placeholder="Describe what happened to the cargo..."
        rows={4}
      />

      {/* Photo Evidence */}
      <div>
        <label className="block text-sm font-medium text-warm-600 mb-1">
          Photo Evidence URLs
        </label>
        <p className="text-xs text-warm-300 mb-2">
          Add URLs to photos documenting the damage or incident
        </p>

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
            placeholder="https://example.com/damage-photo.jpg"
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={addPhotoUrl}>
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Submit Claim
        </Button>
      </div>
    </form>
  )
}
