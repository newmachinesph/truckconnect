"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/Toast"
import {
  FlagIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

interface ReportUserModalProps {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
}

const REPORT_REASONS = [
  { value: "fraud", label: "Fraud", description: "Suspicious or fraudulent activity" },
  { value: "harassment", label: "Harassment", description: "Threatening or abusive behavior" },
  { value: "spam", label: "Spam", description: "Unsolicited or repetitive messages" },
  { value: "other", label: "Other", description: "Other policy violation" },
]

export function ReportUserModal({ userId, userName, isOpen, onClose }: ReportUserModalProps) {
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    setSelectedReason("")
    setDescription("")
    onClose()
  }

  async function handleSubmit() {
    if (!selectedReason) {
      toast("warning", "Please select a reason for your report")
      return
    }

    setIsSubmitting(true)
    // Demo: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSubmitting(false)

    toast("success", `Report submitted for ${userName}. Our team will review it shortly.`)
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Report ${userName}`} size="md">
      <div className="space-y-5">
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 p-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Reports are reviewed by our team. False reports may result in account restrictions.
          </p>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-2">
            Reason for report
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedReason === reason.value
                    ? "border-indigo-600-500 bg-indigo-600-50 ring-1 ring-indigo-600"
                    : "border-warm-200 hover:border-slate-300 hover:bg-surface"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selectedReason === reason.value
                      ? "border-indigo-600-600 bg-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedReason === reason.value && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-800">{reason.label}</p>
                  <p className="text-xs text-warm-400">{reason.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide any additional context or evidence..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!selectedReason}
            className="flex-1"
          >
            <FlagIcon className="h-4 w-4 mr-1.5" />
            Submit Report
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
