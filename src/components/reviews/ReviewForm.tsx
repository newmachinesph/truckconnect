"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { StarRating } from "./StarRating"

interface ReviewFormProps {
  bookingId: string
  revieweeId: string
  revieweeName: string
  onSubmitted?: () => void
}

export function ReviewForm({ bookingId, revieweeId, revieweeName, onSubmitted }: ReviewFormProps) {
  const [ratings, setRatings] = useState({
    onTimeRating: 0,
    cargoCareRating: 0,
    communicationRating: 0,
    professionalismRating: 0,
  })
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const allRated = Object.values(ratings).every((r) => r > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allRated) return
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId,
          ...ratings,
          comment: comment || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to submit review")
        return
      }

      setSuccess(true)
      onSubmitted?.()
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-600-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-indigo-500">Review Submitted!</p>
        <p className="mt-1 text-sm text-indigo-600">Thank you for your feedback.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-warm-800">Rate {revieweeName}</h3>

      <div className="space-y-3">
        <StarRating
          label="On Time"
          value={ratings.onTimeRating}
          onChange={(v) => setRatings((p) => ({ ...p, onTimeRating: v }))}
        />
        <StarRating
          label="Cargo Care"
          value={ratings.cargoCareRating}
          onChange={(v) => setRatings((p) => ({ ...p, cargoCareRating: v }))}
        />
        <StarRating
          label="Communication"
          value={ratings.communicationRating}
          onChange={(v) => setRatings((p) => ({ ...p, communicationRating: v }))}
        />
        <StarRating
          label="Professionalism"
          value={ratings.professionalismRating}
          onChange={(v) => setRatings((p) => ({ ...p, professionalismRating: v }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-600 mb-1">Comments (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!allRated}>
        Submit Review
      </Button>
    </form>
  )
}
