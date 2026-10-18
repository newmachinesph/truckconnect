"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { SignaturePad } from "./SignaturePad"
import { FileUpload } from "@/components/uploads/FileUpload"

interface EPODFlowProps {
  bookingId: string
  onComplete?: () => void
}

type Step = "photos" | "inspection" | "signature" | "confirm"

export function EPODFlow({ bookingId, onComplete }: EPODFlowProps) {
  const [step, setStep] = useState<Step>("photos")
  const [photos, setPhotos] = useState<string[]>([])
  const [deliveryStatus, setDeliveryStatus] = useState("FULL")
  const [damageNotes, setDamageNotes] = useState("")
  const [missingItems, setMissingItems] = useState("")
  const [signature, setSignature] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/epod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epodPhotoUrl: photos[0] ?? null,
          epodDamagePhotos: photos,
          epodSignature: signature,
          epodDamageNotes: damageNotes || null,
          epodMissingItems: missingItems || null,
          epodDeliveryStatus: deliveryStatus,
        }),
      })

      if (res.ok) {
        setDone(true)
        onComplete?.()
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-600-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-indigo-500">Delivery Confirmed!</h3>
        <p className="mt-2 text-sm text-indigo-600">ePOD has been submitted and recorded.</p>
        <Badge variant="confirmed" className="mt-3">Demo: Auto-verified</Badge>
      </div>
    )
  }

  const steps: { key: Step; label: string }[] = [
    { key: "photos", label: "Photos" },
    { key: "inspection", label: "Inspection" },
    { key: "signature", label: "Signature" },
    { key: "confirm", label: "Confirm" },
  ]

  const currentIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i <= currentIdx ? "bg-indigo-600 text-white" : "bg-warm-200 text-warm-300"
            }`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:inline ${
              i <= currentIdx ? "text-indigo-500" : "text-warm-300"
            }`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`mx-2 flex-1 h-0.5 ${
                i < currentIdx ? "bg-indigo-600-400" : "bg-warm-200"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === "photos" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-warm-800">Upload Delivery Photos</h3>
          <FileUpload
            endpoint="epodPhoto"
            onUploadComplete={(urls) => setPhotos((prev) => [...prev, ...urls])}
            hint="Take photos of the delivered cargo"
          />
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`} className="rounded-lg h-24 w-full object-cover" />
              ))}
            </div>
          )}
          <Button onClick={() => setStep("inspection")} className="w-full">
            Next: Cargo Inspection
          </Button>
        </div>
      )}

      {step === "inspection" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-warm-800">Cargo Inspection</h3>
          <div>
            <label className="block text-sm font-medium text-warm-600 mb-1">Delivery Status</label>
            <Select
              value={deliveryStatus}
              onChange={(v) => setDeliveryStatus(v)}
              options={[
                { value: "FULL", label: "Full Delivery" },
                { value: "PARTIAL", label: "Partial Delivery" },
                { value: "REFUSED", label: "Refused" },
                { value: "FAILED", label: "Failed" },
              ]}
            />
          </div>
          {deliveryStatus !== "FULL" && (
            <>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">Damage Notes</label>
                <Textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Describe any damage..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">Missing Items</label>
                <Textarea
                  value={missingItems}
                  onChange={(e) => setMissingItems(e.target.value)}
                  placeholder="List missing items..."
                  rows={2}
                />
              </div>
            </>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("photos")} className="flex-1">Back</Button>
            <Button onClick={() => setStep("signature")} className="flex-1">Next: Signature</Button>
          </div>
        </div>
      )}

      {step === "signature" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-warm-800">Consignee Signature</h3>
          <SignaturePad onSave={(sig) => { setSignature(sig); setStep("confirm") }} label="Receiver's signature" />
          <Button variant="secondary" onClick={() => setStep("inspection")}>Back</Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-warm-800">Confirm Delivery</h3>
          <div className="rounded-xl bg-surface p-4 space-y-2 text-sm">
            <p><span className="text-warm-400">Photos:</span> {photos.length} uploaded</p>
            <p><span className="text-warm-400">Status:</span> {deliveryStatus}</p>
            {damageNotes && <p><span className="text-warm-400">Damage:</span> {damageNotes}</p>}
            {signature && <p><span className="text-warm-400">Signature:</span> Captured</p>}
          </div>
          <Badge variant="confirmed" className="w-full justify-center py-1">Demo: Auto-verified</Badge>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("signature")} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">Submit ePOD</Button>
          </div>
        </div>
      )}
    </div>
  )
}
