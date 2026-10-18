"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { useToast } from "@/components/ui/Toast"
import {
  TicketIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"

const categoryOptions = [
  { value: "Account", label: "Account" },
  { value: "Billing", label: "Billing" },
  { value: "Booking", label: "Booking" },
  { value: "Technical", label: "Technical" },
  { value: "Other", label: "Other" },
]

export default function NewSupportTicketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!category) newErrors.category = "Please select a category"
    if (!subject.trim()) newErrors.subject = "Subject is required"
    if (!description.trim()) newErrors.description = "Description is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category,
          description,
          attachmentUrl: attachmentUrl || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Support ticket submitted successfully")
        router.push("/support")
      } else {
        toast("error", data.error || "Failed to submit ticket")
      }
    } catch {
      toast("error", "Failed to submit ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/support"
          className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to tickets
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600-50">
            <TicketIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-800">New Support Ticket</h1>
            <p className="text-sm text-warm-400">
              Describe your issue and we will get back to you shortly.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Category"
            value={category}
            onChange={(v) => {
              setCategory(v)
              setErrors((prev) => ({ ...prev, category: "" }))
            }}
            options={categoryOptions}
            placeholder="Select a category..."
            error={errors.category}
          />

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setErrors((prev) => ({ ...prev, subject: "" }))
            }}
            placeholder="Brief summary of your issue"
            error={errors.subject}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setErrors((prev) => ({ ...prev, description: "" }))
            }}
            placeholder="Please provide details about your issue, including any relevant booking IDs or screenshots..."
            rows={6}
            error={errors.description}
          />

          <Input
            label="Attachment URL (optional)"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://example.com/screenshot.png"
            hint="Paste a link to a screenshot or document if applicable"
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Submit Ticket
            </Button>
            <Link href="/support">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
